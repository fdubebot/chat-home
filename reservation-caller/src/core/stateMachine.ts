import type { CallStatus } from "../types/reservation.js";

const allowed: Record<CallStatus, CallStatus[]> = {
  INIT: ["DIALING", "FAILED"],
  DIALING: ["CONNECTED", "DISCOVERY", "NEGOTIATION", "WAITING_USER_APPROVAL", "FAILED", "ENDED", "CONFIRMED"],
  CONNECTED: ["DISCOVERY", "NEGOTIATION", "WAITING_USER_APPROVAL", "FAILED", "ENDED", "CONFIRMED"],
  DISCOVERY: ["NEGOTIATION", "WAITING_USER_APPROVAL", "FAILED", "ENDED", "CONFIRMED"],
  NEGOTIATION: ["WAITING_USER_APPROVAL", "FAILED", "ENDED", "CONFIRMED", "DIALING"],
  PROPOSED_OUTCOME: ["WAITING_USER_APPROVAL", "CONFIRMED", "FAILED", "DIALING"],
  WAITING_USER_APPROVAL: ["CONFIRMED", "FAILED", "DIALING", "NEGOTIATION", "ENDED"],
  CONFIRMED: ["DIALING", "ENDED"],
  FAILED: ["DIALING"],
  ENDED: ["DIALING", "FAILED", "CONFIRMED"],
};

export function canTransition(from: CallStatus, to: CallStatus): boolean {
  if (from === to) return true;
  return allowed[from]?.includes(to) ?? false;
}
