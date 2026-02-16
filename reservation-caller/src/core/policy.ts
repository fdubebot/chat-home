import type { ReservationRequest } from "../types/reservation.js";

export function buildAssistantIntro(r: ReservationRequest) {
  if (r.script?.intro) return r.script.intro;
  return `Hi, I'm an assistant calling on behalf of ${r.nameForBooking}. We'd like a reservation for ${r.partySize} on ${r.date} around ${r.timePreferred}.`;
}

export function buildAssistantQuestion(r: ReservationRequest) {
  if (r.script?.question) return r.script.question;
  return "Could you confirm availability and any important conditions like deposit or cancellation policy?";
}

export function buildVoicemailMessage(r: ReservationRequest) {
  if (r.script?.voicemail) return r.script.voicemail;

  if (r.script?.mode === "personal") {
    return `Hi, this is an automated assistant calling on behalf of ${r.nameForBooking}. Sorry we missed you. This is a follow-up personal call. Please call or text ${r.nameForBooking} back when you can and mention you received this voicemail so we can continue from the same context. Thank you, and have a great day.`;
  }

  return `Hi, this is an assistant calling on behalf of ${r.nameForBooking} regarding a reservation request. We are looking for a table for ${r.partySize} on ${r.date} around ${r.timePreferred}. If that time is not available, nearby alternatives are welcome. Please call us back with availability, any important conditions, and whether a deposit or cancellation policy applies. Thank you very much.`;
}

export function needsHumanConfirmation(note: string, allowAutoConfirm = false) {
  if (allowAutoConfirm) return false;
  const risky = ["deposit", "card", "fee", "cancellation", "prepay"];
  const lower = note.toLowerCase();
  return risky.some((k) => lower.includes(k));
}
