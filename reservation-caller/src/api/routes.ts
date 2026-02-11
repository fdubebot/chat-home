import express from "express";
import { z } from "zod";
import { createCall, getCall, updateStatus, addTranscript, setOutcome, attachTwilioSid, listCalls } from "../core/store.js";
import { buildAssistantIntro, needsHumanConfirmation } from "../core/policy.js";
import { hasTwilioConfig } from "../config/env.js";

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
});

export const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, twilioConfigured: hasTwilioConfig() });
});

router.get("/api/calls", (_req, res) => {
  res.json({ calls: listCalls() });
});

router.post("/api/calls/start", (req, res) => {
  const parsed = reservationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const call = createCall(parsed.data);
  updateStatus(call.id, "DIALING");
  addTranscript(call.id, "assistant", buildAssistantIntro(call.reservation));

  // Twilio outbound call creation goes here in next increment.
  // For now we simulate queued outbound dial.
  attachTwilioSid(call.id, `SIM-${call.id.slice(0, 8)}`);

  return res.status(202).json({
    message: "Call queued",
    callId: call.id,
    simulated: true,
  });
});

router.post("/api/twilio/status", (req, res) => {
  const { callId, status } = req.body as { callId?: string; status?: string };
  if (!callId || !status) return res.status(400).json({ error: "callId and status required" });
  updateStatus(callId, status as never);
  addTranscript(callId, "system", `Twilio status: ${status}`);
  return res.json({ ok: true });
});

router.post("/api/calls/:id/approve", (req, res) => {
  const id = req.params.id;
  const { decision, notes } = req.body as { decision?: "approve" | "revise" | "cancel"; notes?: string };
  const call = getCall(id);
  if (!call) return res.status(404).json({ error: "Call not found" });
  if (!decision) return res.status(400).json({ error: "decision required" });

  if (decision === "approve") {
    setOutcome(id, {
      status: "confirmed",
      needsUserApproval: false,
      confidence: 0.95,
      reason: "Approved by user",
      confirmedDetails: {
        date: call.reservation.date,
        time: call.reservation.timePreferred,
        partySize: call.reservation.partySize,
        name: call.reservation.nameForBooking,
        notes,
      },
    });
    updateStatus(id, "CONFIRMED");
  } else if (decision === "cancel") {
    setOutcome(id, { status: "failed", needsUserApproval: false, confidence: 1, reason: "Cancelled by user" });
    updateStatus(id, "FAILED");
  } else {
    updateStatus(id, "NEGOTIATION");
    addTranscript(id, "system", `User revision requested: ${notes || "(no notes)"}`);
  }

  return res.json({ ok: true, call: getCall(id) });
});

router.get("/api/calls/:id", (req, res) => {
  const call = getCall(req.params.id);
  if (!call) return res.status(404).json({ error: "Call not found" });
  return res.json({ call });
});

router.post("/api/mock/proposed-outcome/:id", (req, res) => {
  const id = req.params.id;
  const call = getCall(id);
  if (!call) return res.status(404).json({ error: "Call not found" });

  const note = String(req.body?.note || "No risk noted");
  const requireApproval = needsHumanConfirmation(note, call.reservation.policy?.allowAutoConfirm ?? false);
  setOutcome(id, {
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
  updateStatus(id, requireApproval ? "WAITING_USER_APPROVAL" : "PROPOSED_OUTCOME");

  return res.json({ ok: true, call: getCall(id) });
});
