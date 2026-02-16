import express from "express";
import twilio from "twilio";
import { z } from "zod";
import { env, hasTwilioConfig } from "../../config/env.js";
import { parseBusinessReply } from "../../core/extract.js";
import { normalizePhone } from "../../core/helpers.js";
import { decideFromReply } from "../../core/negotiate.js";
import { notifyOpenClaw } from "../../core/notify.js";
import { buildAssistantIntro, buildAssistantQuestion, buildVoicemailMessage } from "../../core/policy.js";
import { findRecentCallByPhone } from "../../core/callLookup.js";
import { sendApprovalPrompt, sendMessage } from "../../core/telegram.js";
import { mapTwilioStatusToCallStatus, isTwilioFailureStatus } from "../../core/twilioStatus.js";
import { getSpeechAudioUrl } from "../../core/voice.js";
import { logEvent } from "../../core/log.js";
import { addTranscript, attachTwilioSid, createCall, getCall, setOutcome, updateStatus } from "../../core/store.js";

export const twilioRouter = express.Router();

const twilioStatusSchema = z.object({
  CallStatus: z.string().optional(),
  status: z.string().optional(),
  CallSid: z.string().optional(),
});

const twilioInboundSchema = z.object({
  From: z.string().optional(),
  To: z.string().optional(),
  CallSid: z.string().optional(),
});

const twilioGatherSchema = z.object({
  From: z.string().optional(),
  SpeechResult: z.string().optional(),
  CallSid: z.string().optional(),
});

const twilioVoiceSchema = z.object({
  AnsweredBy: z.string().optional(),
  CallSid: z.string().optional(),
});

function verifyTwilioRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!hasTwilioConfig()) return next();
  const signature = req.header("x-twilio-signature") || "";
  const url = `${env.appBaseUrl}${req.originalUrl}`;
  const params = req.body as Record<string, string>;
  const ok = twilio.validateRequest(env.twilioAuthToken, signature, url, params);
  if (!ok) return res.status(403).json({ error: "Invalid Twilio signature" });
  return next();
}

async function sayOrPlay(vr: twilio.twiml.VoiceResponse, text: string) {
  const audioUrl = await getSpeechAudioUrl(text);
  if (audioUrl) vr.play(audioUrl);
  else vr.say({ voice: "alice" }, text);
}

async function gatherSayOrPlay(gather: ReturnType<twilio.twiml.VoiceResponse["gather"]>, text: string) {
  const audioUrl = await getSpeechAudioUrl(text);
  if (audioUrl) gather.play(audioUrl);
  else gather.say({ voice: "alice" }, text);
}

twilioRouter.post("/api/twilio/status", verifyTwilioRequest, async (req, res) => {
  const parsed = twilioStatusSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid twilio status payload" });

  const callId = String(req.query.callId || (req.body as any)?.callId || "");
  const status = String(parsed.data.CallStatus || parsed.data.status || "");
  if (!callId || !status) return res.status(400).json({ error: "callId and status required" });

  const mapped = mapTwilioStatusToCallStatus(status);
  await updateStatus(callId, mapped);
  await addTranscript(callId, "system", `Twilio status: ${status}`);
  logEvent("twilio.status", { callId, twilioStatus: status, mappedStatus: mapped, twilioSid: parsed.data.CallSid });

  if (isTwilioFailureStatus(status)) {
    await setOutcome(callId, { status: "failed", needsUserApproval: false, confidence: 0.9, reason: `Twilio call ended with status: ${status}` });
  }

  return res.json({ ok: true, mapped });
});

twilioRouter.post("/api/twilio/inbound", verifyTwilioRequest, async (req, res) => {
  const parsed = twilioInboundSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid twilio inbound payload" });

  const from = normalizePhone(String(parsed.data.From || ""));
  const to = normalizePhone(String(parsed.data.To || ""));
  const inboundSid = String(parsed.data.CallSid || "");
  const related = from ? await findRecentCallByPhone(from) : undefined;
  const requestId = inboundSid ? `inbound-${inboundSid}` : `inbound-${Date.now()}`;

  const call = await createCall({
    requestId,
    businessName: related?.reservation.businessName || `Callback ${from || "unknown"}`,
    businessPhone: from || "unknown",
    date: related?.reservation.date || new Date().toISOString().slice(0, 10),
    timePreferred: related?.reservation.timePreferred || "19:00",
    partySize: related?.reservation.partySize || 2,
    nameForBooking: related?.reservation.nameForBooking || "Felix",
    policy: { allowAutoConfirm: false },
    script: { mode: "personal", intro: "Hi, this is Felix's assistant. Thanks for calling back.", question: "Please say your message after the tone and I will pass it along right away." },
  });

  if (inboundSid) await attachTwilioSid(call.id, inboundSid);
  await updateStatus(call.id, "CONNECTED");
  await addTranscript(call.id, "system", `Inbound callback received from ${from || "unknown"} to ${to || "unknown"}${related ? ` (related to ${related.id})` : ""}`);
  logEvent("twilio.inbound.received", { callId: call.id, from, to, relatedCallId: related?.id, twilioSid: inboundSid || undefined });
  void notifyOpenClaw("callback_received", { callId: call.id, from, to, relatedCallId: related?.id, businessName: call.reservation.businessName });

  const vr = new twilio.twiml.VoiceResponse();
  await sayOrPlay(vr, "Hi, this is Felix's assistant. Thanks for calling back.");
  const gather = vr.gather({
    input: ["speech"],
    speechTimeout: "3",
    timeout: 8,
    actionOnEmptyResult: true,
    action: `/api/twilio/inbound-gather?callId=${encodeURIComponent(call.id)}&attempt=1`,
    method: "POST",
  });
  await gatherSayOrPlay(gather, "Please leave your message after the tone. I am listening.");
  await sayOrPlay(vr, "Sorry, I did not catch that. Please call back and try again.");
  vr.hangup();

  return res.type("text/xml").send(vr.toString());
});

twilioRouter.post("/api/twilio/inbound-gather", verifyTwilioRequest, async (req, res) => {
  const parsed = twilioGatherSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid twilio gather payload" });

  const callId = String(req.query.callId || "");
  const attempt = Number(req.query.attempt || 1);
  const speech = String(parsed.data.SpeechResult || "").trim();
  const from = normalizePhone(String(parsed.data.From || ""));
  const call = await getCall(callId);

  const vr = new twilio.twiml.VoiceResponse();
  if (!call) {
    await sayOrPlay(vr, "Sorry, we could not process your callback. Please try again later.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  await addTranscript(callId, "business", speech || "(no speech captured)");
  logEvent("twilio.inbound.gather", { callId, from, hasSpeech: Boolean(speech), twilioSid: parsed.data.CallSid });

  if (!speech) {
    if (attempt < 2) {
      await addTranscript(callId, "system", "No speech captured on callback; retrying gather once.");
      await sayOrPlay(vr, "Sorry, I did not catch that. Please say your message again after the tone.");
      const retryGather = vr.gather({
        input: ["speech"],
        speechTimeout: "3",
        timeout: 8,
        actionOnEmptyResult: true,
        action: `/api/twilio/inbound-gather?callId=${encodeURIComponent(callId)}&attempt=2`,
        method: "POST",
      });
      await gatherSayOrPlay(retryGather, "I am listening.");
      await sayOrPlay(vr, "Still no message captured. Please call back and try again.");
      vr.hangup();
      return res.type("text/xml").send(vr.toString());
    }

    await setOutcome(callId, { status: "failed", needsUserApproval: false, confidence: 0.3, reason: "No speech captured on callback" });
    await updateStatus(callId, "FAILED");
    await sayOrPlay(vr, "Thanks for calling back. We did not catch your message. Please try again.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  await setOutcome(callId, {
    status: "pending",
    needsUserApproval: true,
    confidence: 0.9,
    reason: "Inbound callback message received",
    confirmedDetails: { date: call.reservation.date, time: call.reservation.timePreferred, partySize: call.reservation.partySize, name: call.reservation.nameForBooking, notes: speech },
  });
  await updateStatus(callId, "WAITING_USER_APPROVAL");

  void notifyOpenClaw("callback_message", { callId, from, businessName: call.reservation.businessName, message: speech });
  if (env.telegramChatId) {
    void sendMessage(env.telegramChatId, `📞 Callback message received\nFrom: ${from || "unknown"}\nFor: ${call.reservation.businessName}\nCall ID: ${callId}\n\nMessage: ${speech}`);
  }

  await sayOrPlay(vr, "Thank you. I have passed your message to Felix. Goodbye.");
  vr.hangup();
  return res.type("text/xml").send(vr.toString());
});

twilioRouter.post("/api/twilio/voice", verifyTwilioRequest, async (req, res) => {
  const parsed = twilioVoiceSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid twilio voice payload" });

  const callId = String(req.query.callId || "");
  const call = await getCall(callId);
  if (!call) return res.status(404).send("Unknown call");

  const answeredBy = String(parsed.data.AnsweredBy || "").toLowerCase();
  const isVoicemail = answeredBy.startsWith("machine") || answeredBy.includes("voicemail") || answeredBy === "fax" || answeredBy === "unknown";

  const vr = new twilio.twiml.VoiceResponse();
  logEvent("twilio.voice", { callId, answeredBy: answeredBy || undefined, isVoicemail, twilioSid: parsed.data.CallSid });
  if (isVoicemail) {
    const voicemailMessage = buildVoicemailMessage(call.reservation);
    await addTranscript(callId, "system", `Voicemail detected by Twilio (AnsweredBy=${answeredBy || "n/a"})`);
    await addTranscript(callId, "assistant", `Voicemail message left: ${voicemailMessage}`);
    await setOutcome(callId, {
      status: "voicemail",
      needsUserApproval: false,
      confidence: 0.95,
      reason: `Voicemail detected (${answeredBy || "unknown"})`,
      confirmedDetails: { date: call.reservation.date, time: call.reservation.timePreferred, partySize: call.reservation.partySize, name: call.reservation.nameForBooking, notes: voicemailMessage },
    });
    await updateStatus(callId, "ENDED");
    void notifyOpenClaw("call_voicemail", { callId, businessName: call.reservation.businessName, answeredBy: answeredBy || "unknown" });
    await sayOrPlay(vr, voicemailMessage);
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  await updateStatus(callId, "DISCOVERY");
  await sayOrPlay(vr, buildAssistantIntro(call.reservation));
  await sayOrPlay(vr, buildAssistantQuestion(call.reservation));
  const gather = vr.gather({ input: ["speech"], speechTimeout: "auto", action: `/api/twilio/gather?callId=${encodeURIComponent(callId)}`, method: "POST" });
  await gatherSayOrPlay(gather, "I am listening.");
  await sayOrPlay(vr, "Sorry, I did not catch that.");
  vr.redirect({ method: "POST" }, `/api/twilio/voice?callId=${encodeURIComponent(callId)}`);
  return res.type("text/xml").send(vr.toString());
});

twilioRouter.post("/api/twilio/gather", verifyTwilioRequest, async (req, res) => {
  const parsed = twilioGatherSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid twilio gather payload" });

  const callId = String(req.query.callId || "");
  const speech = String(parsed.data.SpeechResult || "").trim();
  const call = await getCall(callId);
  if (!call) return res.status(404).send("Unknown call");

  await addTranscript(callId, "business", speech || "(no speech captured)");
  logEvent("twilio.gather", { callId, hasSpeech: Boolean(speech), twilioSid: parsed.data.CallSid });
  const vr = new twilio.twiml.VoiceResponse();

  if (!speech) {
    await sayOrPlay(vr, "I did not hear a response. I will follow up later. Thank you.");
    await updateStatus(callId, "FAILED");
    await setOutcome(callId, { status: "failed", needsUserApproval: false, confidence: 0.4, reason: "No speech captured" });
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  if (call.reservation.script?.mode === "personal") {
    await updateStatus(callId, "WAITING_USER_APPROVAL");
    await setOutcome(callId, {
      status: "pending",
      needsUserApproval: true,
      confidence: 0.9,
      reason: "Personal call response captured",
      confirmedDetails: { date: call.reservation.date, time: call.reservation.timePreferred, partySize: call.reservation.partySize, name: call.reservation.nameForBooking, notes: speech },
    });
    void sendApprovalPrompt({ callId, businessName: call.reservation.businessName, date: call.reservation.date, time: call.reservation.timePreferred, partySize: call.reservation.partySize, notes: `Personal response: ${speech}` });
    await sayOrPlay(vr, "Thank you, I will pass this message along.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  const replyParsed = parseBusinessReply(speech);
  const decision = decideFromReply(replyParsed, call.reservation);

  if (decision.status === "reject") {
    await updateStatus(callId, "FAILED");
    await setOutcome(callId, { status: "failed", needsUserApproval: false, confidence: replyParsed.confidence, reason: decision.reason });
    void notifyOpenClaw("call_failed", { callId, businessName: call.reservation.businessName, reason: decision.reason });
    await sayOrPlay(vr, "Understood, thank you for checking. Have a great day.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  if (decision.status === "confirm") {
    const confirmedTime = decision.proposedTime || call.reservation.timePreferred;
    await setOutcome(callId, {
      status: "confirmed",
      needsUserApproval: false,
      confidence: replyParsed.confidence,
      reason: decision.reason,
      confirmedDetails: { date: call.reservation.date, time: confirmedTime, partySize: call.reservation.partySize, name: call.reservation.nameForBooking, notes: decision.notes },
    });
    await updateStatus(callId, "CONFIRMED");
    void notifyOpenClaw("call_confirmed", { callId, businessName: call.reservation.businessName });
    await sayOrPlay(vr, `Perfect. Please confirm the reservation under ${call.reservation.nameForBooking}. Thank you.`);
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  if (decision.status === "needs_approval") {
    await setOutcome(callId, {
      status: "pending",
      needsUserApproval: true,
      confidence: replyParsed.confidence,
      reason: decision.reason,
      confirmedDetails: { date: call.reservation.date, time: decision.proposedTime || call.reservation.timePreferred, partySize: call.reservation.partySize, name: call.reservation.nameForBooking, notes: decision.notes },
    });

    await updateStatus(callId, "WAITING_USER_APPROVAL");
    void notifyOpenClaw("approval_required", {
      callId,
      businessName: call.reservation.businessName,
      phone: call.reservation.businessPhone,
      date: call.reservation.date,
      time: decision.proposedTime || call.reservation.timePreferred,
      partySize: call.reservation.partySize,
      notes: decision.notes,
    });
    void sendApprovalPrompt({ callId, businessName: call.reservation.businessName, date: call.reservation.date, time: decision.proposedTime || call.reservation.timePreferred, partySize: call.reservation.partySize, notes: decision.notes });

    await sayOrPlay(vr, "Thank you. I need to confirm final details with Felix and will call back if needed.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  const refreshed = await getCall(callId);
  const clarificationAttempts = (refreshed?.transcript || []).filter((t) => t.speaker === "business").length;
  if (clarificationAttempts >= 3) {
    await updateStatus(callId, "WAITING_USER_APPROVAL");
    await setOutcome(callId, {
      status: "pending",
      needsUserApproval: true,
      confidence: replyParsed.confidence,
      reason: "Ambiguous after multiple clarification attempts",
      confirmedDetails: { date: call.reservation.date, time: call.reservation.timePreferred, partySize: call.reservation.partySize, name: call.reservation.nameForBooking, notes: speech },
    });
    void sendApprovalPrompt({ callId, businessName: call.reservation.businessName, date: call.reservation.date, time: call.reservation.timePreferred, partySize: call.reservation.partySize, notes: "Ambiguous response after multiple attempts" });
    await sayOrPlay(vr, "Thank you. I will confirm details with Felix and follow up if needed.");
    vr.hangup();
    return res.type("text/xml").send(vr.toString());
  }

  await updateStatus(callId, "NEGOTIATION");
  await sayOrPlay(vr, "Thanks. Could you repeat the available time and any reservation conditions?");
  const gather = vr.gather({ input: ["speech"], speechTimeout: "auto", action: `/api/twilio/gather?callId=${encodeURIComponent(callId)}`, method: "POST" });
  await gatherSayOrPlay(gather, "I am listening.");
  return res.type("text/xml").send(vr.toString());
});
