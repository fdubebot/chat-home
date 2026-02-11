import { randomUUID } from "node:crypto";
import type { CallRecord, ReservationRequest, CallStatus, CallOutcome } from "../types/reservation.js";

const calls = new Map<string, CallRecord>();

export function createCall(reservation: ReservationRequest): CallRecord {
  const now = new Date().toISOString();
  const id = reservation.requestId || randomUUID();
  const rec: CallRecord = {
    id,
    reservation: { ...reservation, requestId: id },
    status: "INIT",
    createdAt: now,
    updatedAt: now,
    transcript: [{ at: now, speaker: "system", text: "Call created" }],
  };
  calls.set(id, rec);
  return rec;
}

export function getCall(id: string): CallRecord | undefined {
  return calls.get(id);
}

export function updateStatus(id: string, status: CallStatus) {
  const rec = calls.get(id);
  if (!rec) return;
  rec.status = status;
  rec.updatedAt = new Date().toISOString();
}

export function addTranscript(id: string, speaker: "assistant" | "business" | "system", text: string) {
  const rec = calls.get(id);
  if (!rec) return;
  rec.transcript.push({ at: new Date().toISOString(), speaker, text });
  rec.updatedAt = new Date().toISOString();
}

export function setOutcome(id: string, outcome: CallOutcome) {
  const rec = calls.get(id);
  if (!rec) return;
  rec.outcome = outcome;
  rec.updatedAt = new Date().toISOString();
}

export function attachTwilioSid(id: string, sid: string) {
  const rec = calls.get(id);
  if (!rec) return;
  rec.twilioCallSid = sid;
  rec.updatedAt = new Date().toISOString();
}

export function listCalls() {
  return Array.from(calls.values());
}
