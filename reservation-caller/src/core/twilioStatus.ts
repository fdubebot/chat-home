import type { CallStatus } from "../types/reservation.js";

export function mapTwilioStatusToCallStatus(status: string): CallStatus {
  const s = String(status || "").toLowerCase();
  if (s === "initiated" || s === "ringing") return "DIALING";
  if (s === "answered" || s === "in-progress") return "CONNECTED";
  if (s === "completed") return "ENDED";
  if (s === "busy" || s === "no-answer" || s === "failed" || s === "canceled") return "FAILED";
  return "NEGOTIATION";
}

export function isTwilioFailureStatus(status: string): boolean {
  const s = String(status || "").toLowerCase();
  return s === "busy" || s === "no-answer" || s === "failed" || s === "canceled";
}
