import express from "express";
import { applyDecision } from "../../core/decision.js";
import { getCall } from "../../core/store.js";

export const openclawRouter = express.Router();

openclawRouter.post("/api/openclaw/callback", async (req, res) => {
  const event = String(req.body?.event || "");
  const callId = String(req.body?.callId || "");
  if (!event) return res.status(400).json({ error: "event required" });

  if (event === "approval_required") {
    const call = await getCall(callId);
    if (!call) return res.status(404).json({ error: "Call not found" });

    return res.json({
      ok: true,
      message: `Approval needed: ${call.reservation.businessName} for ${call.reservation.partySize} on ${call.reservation.date} ${call.reservation.timePreferred}.`,
      actions: [
        { label: "Approve", method: "POST", path: "/api/openclaw/decision", body: { callId, decision: "approve" } },
        { label: "Revise", method: "POST", path: "/api/openclaw/decision", body: { callId, decision: "revise" } },
        { label: "Cancel", method: "POST", path: "/api/openclaw/decision", body: { callId, decision: "cancel" } },
      ],
    });
  }

  return res.json({ ok: true, event, callId });
});

openclawRouter.post("/api/openclaw/decision", async (req, res) => {
  const callId = String(req.body?.callId || "");
  const decision = String(req.body?.decision || "") as "approve" | "revise" | "cancel";
  const notes = typeof req.body?.notes === "string" ? req.body.notes : undefined;

  if (!callId || !decision) return res.status(400).json({ error: "callId and decision required" });
  if (!["approve", "revise", "cancel"].includes(decision)) return res.status(400).json({ error: "Invalid decision" });

  const result = await applyDecision(callId, decision, notes);
  if ("error" in result) return res.status(404).json({ error: result.error });
  return res.json({ ok: true, call: result.call });
});
