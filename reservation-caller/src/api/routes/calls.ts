import express from "express";
import { z } from "zod";
import { hasTwilioConfig } from "../../config/env.js";
import { createOutboundCall } from "../../core/twilio.js";
import { applyDecision } from "../../core/decision.js";
import { needsHumanConfirmation, buildAssistantIntro } from "../../core/policy.js";
import { runRecall } from "../../core/recall.js";
import {
  addTranscript,
  attachTwilioSid,
  createCall,
  failStaleCalls,
  getCall,
  listCalls,
  setOutcome,
  updateStatus,
} from "../../core/store.js";

const reservationSchema = z.object({
  requestId: z.string().optional().default(""),
  businessName: z.string(),
  businessPhone: z.string(),
  date: z.string(),
  timePreferred: z.string(),
  partySize: z.number().int().positive(),
  nameForBooking: z.string(),
  constraints: z.any().optional(),
  policy: z.any().optional(),
  script: z
    .object({
      intro: z.string().optional(),
      question: z.string().optional(),
      voicemail: z.string().optional(),
      mode: z.enum(["reservation", "personal"]).optional(),
    })
    .optional(),
});

const personalCallSchema = z.object({
  requestId: z.string().optional(),
  targetName: z.string().optional().default("Personal Contact"),
  targetPhone: z.string(),
  callerName: z.string().default("Felix"),
  intro: z.string(),
  question: z.string(),
});

export const callsRouter = express.Router();

callsRouter.get("/health", async (_req, res) => {
  const staleSweep = await failStaleCalls();
  res.json({ ok: true, twilioConfigured: hasTwilioConfig(), staleSweep });
});

callsRouter.get("/api/calls", async (_req, res) => {
  const staleSweep = await failStaleCalls();
  res.json({ calls: await listCalls(), staleSweep });
});

callsRouter.post("/api/calls/start", async (req, res) => {
  await failStaleCalls();
  const parsed = reservationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const request = parsed.data;

  const existing = request.requestId ? await getCall(request.requestId) : undefined;
  if (existing) return res.status(200).json({ message: "Call already exists for this requestId", callId: existing.id, status: existing.status, idempotent: true, call: existing });

  const call = await createCall(request);
  await updateStatus(call.id, "DIALING");
  await addTranscript(call.id, "assistant", buildAssistantIntro(call.reservation));

  if (!hasTwilioConfig()) {
    await attachTwilioSid(call.id, `SIM-${call.id.slice(0, 8)}`);
    return res.status(202).json({ message: "Call queued (simulation mode)", callId: call.id, simulated: true, idempotent: false });
  }

  try {
    const outbound = await createOutboundCall({ to: call.reservation.businessPhone, callId: call.id });
    await attachTwilioSid(call.id, outbound.sid);
    await addTranscript(call.id, "system", `Twilio call created: ${outbound.sid}`);
    return res.status(202).json({ message: "Twilio call queued", callId: call.id, twilioCallSid: outbound.sid, simulated: false, idempotent: false });
  } catch (error) {
    await updateStatus(call.id, "FAILED");
    await addTranscript(call.id, "system", `Twilio error: ${error instanceof Error ? error.message : "unknown"}`);
    return res.status(502).json({ error: "Failed to create Twilio call", callId: call.id });
  }
});

callsRouter.post("/api/calls/start-personal", async (req, res) => {
  await failStaleCalls();
  const parsed = personalCallSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;

  const request = {
    requestId: body.requestId || "",
    businessName: body.targetName,
    businessPhone: body.targetPhone,
    date: new Date().toISOString().slice(0, 10),
    timePreferred: "19:00",
    partySize: 2,
    nameForBooking: body.callerName,
    policy: { allowAutoConfirm: false },
    script: { mode: "personal" as const, intro: body.intro, question: body.question },
  };

  const existing = request.requestId ? await getCall(request.requestId) : undefined;
  if (existing) return res.status(200).json({ message: "Call already exists for this requestId", callId: existing.id, status: existing.status, idempotent: true, call: existing });

  const call = await createCall(request);
  await updateStatus(call.id, "DIALING");
  await addTranscript(call.id, "assistant", buildAssistantIntro(call.reservation));

  if (!hasTwilioConfig()) {
    await attachTwilioSid(call.id, `SIM-${call.id.slice(0, 8)}`);
    return res.status(202).json({ message: "Call queued (simulation mode)", callId: call.id, simulated: true, idempotent: false });
  }

  try {
    const outbound = await createOutboundCall({ to: call.reservation.businessPhone, callId: call.id });
    await attachTwilioSid(call.id, outbound.sid);
    await addTranscript(call.id, "system", `Twilio call created: ${outbound.sid}`);
    return res.status(202).json({ message: "Twilio call queued", callId: call.id, twilioCallSid: outbound.sid, simulated: false, idempotent: false });
  } catch (error) {
    await updateStatus(call.id, "FAILED");
    await addTranscript(call.id, "system", `Twilio error: ${error instanceof Error ? error.message : "unknown"}`);
    return res.status(502).json({ error: "Failed to create Twilio call", callId: call.id });
  }
});

callsRouter.post("/api/calls/timeout-sweep", async (_req, res) => {
  const staleSweep = await failStaleCalls();
  return res.json({ ok: true, staleSweep });
});

callsRouter.post("/api/calls/:id/approve", async (req, res) => {
  const id = req.params.id;
  const { decision, notes } = req.body as { decision?: "approve" | "revise" | "cancel"; notes?: string };
  if (!decision) return res.status(400).json({ error: "decision required" });
  const result = await applyDecision(id, decision, notes);
  if ("error" in result) return res.status(404).json({ error: result.error });
  return res.json({ ok: true, call: result.call });
});

callsRouter.post("/api/calls/:id/recall", async (req, res) => {
  const id = req.params.id;
  const { date, timePreferred, partySize, notes } = req.body as { date?: string; timePreferred?: string; partySize?: number; notes?: string };
  const result = await runRecall(id, { date, timePreferred, partySize }, notes);
  if ("error" in result) return res.status(result.error === "Call not found" ? 404 : 502).json({ error: result.error });
  return res.json({ ok: true, ...result });
});

callsRouter.get("/api/calls/:id", async (req, res) => {
  const call = await getCall(req.params.id);
  if (!call) return res.status(404).json({ error: "Call not found" });
  return res.json({ call });
});

callsRouter.post("/api/mock/proposed-outcome/:id", async (req, res) => {
  const id = req.params.id;
  const call = await getCall(id);
  if (!call) return res.status(404).json({ error: "Call not found" });

  const note = String(req.body?.note || "No risk noted");
  const requireApproval = needsHumanConfirmation(note, call.reservation.policy?.allowAutoConfirm ?? false);
  await setOutcome(id, {
    status: "pending",
    needsUserApproval: requireApproval,
    confidence: 0.78,
    reason: note,
    confirmedDetails: {
      date: call.reservation.date,
      time: call.reservation.timePreferred,
      partySize: call.reservation.partySize,
      name: call.reservation.nameForBooking,
      notes: note,
    },
  });
  await updateStatus(id, requireApproval ? "WAITING_USER_APPROVAL" : "PROPOSED_OUTCOME");
  return res.json({ ok: true, call: await getCall(id) });
});
