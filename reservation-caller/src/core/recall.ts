import { hasTwilioConfig } from "../config/env.js";
import { createOutboundCall } from "./twilio.js";
import { addTranscript, attachTwilioSid, getCall, updateReservation, updateStatus } from "./store.js";

export async function runRecall(callId: string, patch: { date?: string; timePreferred?: string; partySize?: number }, notes?: string) {
  const call = await getCall(callId);
  if (!call) return { error: "Call not found" as const };

  await updateReservation(callId, {
    ...(patch.date ? { date: patch.date } : {}),
    ...(patch.timePreferred ? { timePreferred: patch.timePreferred } : {}),
    ...(typeof patch.partySize === "number" ? { partySize: patch.partySize } : {}),
  });

  await addTranscript(callId, "system", `Recall requested with updates: ${JSON.stringify({ ...patch, notes })}`);
  await updateStatus(callId, "DIALING");

  if (!hasTwilioConfig()) return { simulated: true, call: await getCall(callId) };

  const updated = await getCall(callId);
  if (!updated) return { error: "Call not found after update" as const };

  try {
    const outbound = await createOutboundCall({ to: updated.reservation.businessPhone, callId });
    await attachTwilioSid(callId, outbound.sid);
    await addTranscript(callId, "system", `Twilio recall created: ${outbound.sid}`);
    return { simulated: false, call: await getCall(callId), twilioCallSid: outbound.sid };
  } catch (error) {
    await updateStatus(callId, "FAILED");
    await addTranscript(callId, "system", `Twilio recall error: ${error instanceof Error ? error.message : "unknown"}`);
    return { error: "Failed to create recall" as const };
  }
}
