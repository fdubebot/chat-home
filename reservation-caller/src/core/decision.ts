import { addTranscript, attachTwilioSid, getCall, setOutcome, updateReservation, updateStatus } from "./store.js";
import { notifyOpenClaw } from "./notify.js";
import { createOutboundCall } from "./twilio.js";
import { hasTwilioConfig } from "../config/env.js";

export async function applyDecision(id: string, decision: "approve" | "revise" | "cancel", notes: string | undefined) {
  const call = await getCall(id);
  if (!call) return { error: "Call not found" as const };

  if (decision === "approve") {
    const proposedTime = call.outcome?.confirmedDetails?.time;
    const approvedTime = proposedTime || call.reservation.timePreferred;
    const needsRecall = Boolean(proposedTime && proposedTime !== call.reservation.timePreferred);

    await setOutcome(id, {
      status: "confirmed",
      needsUserApproval: false,
      confidence: 0.95,
      reason: needsRecall ? "Approved by user (with callback to confirm alternate time)" : "Approved by user",
      confirmedDetails: {
        date: call.reservation.date,
        time: approvedTime,
        partySize: call.reservation.partySize,
        name: call.reservation.nameForBooking,
        notes,
      },
    });

    if (needsRecall) {
      await updateReservation(id, { timePreferred: approvedTime });
      await addTranscript(id, "system", `User approved alternate time ${approvedTime}; scheduling callback confirmation.`);
      await updateStatus(id, "DIALING");

      if (hasTwilioConfig()) {
        try {
          const outbound = await createOutboundCall({ to: call.reservation.businessPhone, callId: id });
          await attachTwilioSid(id, outbound.sid);
          await addTranscript(id, "system", `Twilio callback call created after approval: ${outbound.sid}`);
          void notifyOpenClaw("call_recalled", { callId: id, businessName: call.reservation.businessName, approvedTime });
        } catch (error) {
          await updateStatus(id, "FAILED");
          await addTranscript(id, "system", `Twilio callback error after approval: ${error instanceof Error ? error.message : "unknown"}`);
          return { error: "Failed to create callback call after approval" as const };
        }
      } else {
        await addTranscript(id, "system", "Twilio not configured: callback after approval skipped (simulation mode).");
      }
    } else {
      await updateStatus(id, "CONFIRMED");
      void notifyOpenClaw("call_confirmed", {
        callId: id,
        businessName: call.reservation.businessName,
        confirmed: {
          date: call.reservation.date,
          time: approvedTime,
          partySize: call.reservation.partySize,
          name: call.reservation.nameForBooking,
        },
      });
    }
  } else if (decision === "cancel") {
    await setOutcome(id, { status: "failed", needsUserApproval: false, confidence: 1, reason: "Cancelled by user" });
    await updateStatus(id, "FAILED");
    void notifyOpenClaw("call_cancelled", { callId: id, businessName: call.reservation.businessName });
  } else {
    await updateStatus(id, "NEGOTIATION");
    await addTranscript(id, "system", `User revision requested: ${notes || "(no notes)"}`);
  }

  return { call: await getCall(id) };
}
