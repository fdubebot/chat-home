import express from "express";
import twilio from "twilio";
import { z } from "zod";
import { env, hasTwilioConfig } from "../../config/env.js";
import { logEvent } from "../../core/log.js";
import { notifyOpenClaw } from "../../core/notify.js";
import { sendMessage } from "../../core/telegram.js";
import { getTwilioClient } from "../../core/twilio.js";

export const smsRouter = express.Router();

const sendSmsSchema = z.object({
  to: z.string().min(3),
  message: z.string().min(1),
  from: z.string().optional(),
});

const inboundSmsSchema = z.object({
  From: z.string().optional(),
  To: z.string().optional(),
  Body: z.string().optional(),
  MessageSid: z.string().optional(),
  SmsStatus: z.string().optional(),
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

smsRouter.post("/api/sms/send", async (req, res) => {
  const parsed = sendSmsSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!hasTwilioConfig()) return res.status(503).json({ error: "Twilio is not configured" });

  const from = parsed.data.from || env.twilioPhoneNumber;

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      to: parsed.data.to,
      from,
      body: parsed.data.message,
      statusCallback: `${env.appBaseUrl}/api/twilio/sms-status`,
    });

    logEvent("twilio.sms.sent", { to: parsed.data.to, from, sid: message.sid, status: message.status });
    return res.json({ ok: true, sid: message.sid, status: message.status });
  } catch (error) {
    logEvent("twilio.sms.send_failed", { to: parsed.data.to, from, error: error instanceof Error ? error.message : "unknown" });
    return res.status(502).json({ error: "Failed to send SMS" });
  }
});

smsRouter.post("/api/twilio/sms", verifyTwilioRequest, async (req, res) => {
  const parsed = inboundSmsSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid twilio sms payload" });

  const from = parsed.data.From || "unknown";
  const to = parsed.data.To || "unknown";
  const body = parsed.data.Body || "";
  const sid = parsed.data.MessageSid || "";

  logEvent("twilio.sms.received", { from, to, sid, length: body.length });
  void notifyOpenClaw("sms_received", { from, to, sid, body });

  if (env.telegramChatId) {
    void sendMessage(env.telegramChatId, `💬 SMS received\nFrom: ${from}\nTo: ${to}\nSID: ${sid || "n/a"}\n\n${body || "(empty)"}`);
  }

  const twiml = new twilio.twiml.MessagingResponse();
  return res.type("text/xml").send(twiml.toString());
});

smsRouter.post("/api/twilio/sms-status", verifyTwilioRequest, async (req, res) => {
  const parsed = inboundSmsSchema.safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: "invalid twilio sms status payload" });

  logEvent("twilio.sms.status", {
    sid: parsed.data.MessageSid,
    status: parsed.data.SmsStatus,
    from: parsed.data.From,
    to: parsed.data.To,
  });

  return res.json({ ok: true });
});
