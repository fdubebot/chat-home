import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CallRecord, ReservationRequest, CallStatus, CallOutcome } from "../types/reservation.js";
import { env } from "../config/env.js";
import { getDbPool, hasDatabaseConfig } from "./db.js";
import { canTransition } from "./stateMachine.js";
import { logEvent } from "./log.js";

const calls = new Map<string, CallRecord>();

function persistFile() {
  const filePath = path.resolve(env.dataFile);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(Array.from(calls.values()), null, 2));
}

function loadFile() {
  const filePath = path.resolve(env.dataFile);
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) return;
  const parsed = JSON.parse(raw) as CallRecord[];
  for (const rec of parsed) calls.set(rec.id, rec);
}

function isTerminalStatus(status: CallStatus) {
  return status === "CONFIRMED" || status === "FAILED" || status === "ENDED";
}

function rowToCall(row: any): CallRecord {
  return {
    id: row.id,
    reservation: row.reservation,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    transcript: row.transcript || [],
    outcome: row.outcome || undefined,
    twilioCallSid: row.twilio_call_sid || undefined,
  };
}

loadFile();

export async function createCall(reservation: ReservationRequest): Promise<CallRecord> {
  const now = new Date().toISOString();
  const id = reservation.requestId || randomUUID();

  if (hasDatabaseConfig()) {
    const pool = getDbPool();
    if (!pool) throw new Error("DATABASE_URL configured but pool unavailable");

    const existing = await getCall(id);
    if (existing) return existing;

    const rec: CallRecord = {
      id,
      reservation: { ...reservation, requestId: id },
      status: "INIT",
      createdAt: now,
      updatedAt: now,
      transcript: [{ at: now, speaker: "system", text: "Call created" }],
    };

    await pool.query(
      `insert into calls (id, reservation, status, created_at, updated_at, transcript, outcome, twilio_call_sid)
       values ($1, $2::jsonb, $3, $4::timestamptz, $5::timestamptz, $6::jsonb, $7::jsonb, $8)
       on conflict (id) do nothing`,
      [rec.id, JSON.stringify(rec.reservation), rec.status, rec.createdAt, rec.updatedAt, JSON.stringify(rec.transcript), null, null],
    );

    const inserted = await getCall(id);
    if (!inserted) throw new Error("Failed to create call");
    return inserted;
  }

  const existing = calls.get(id);
  if (existing) return existing;

  const rec: CallRecord = {
    id,
    reservation: { ...reservation, requestId: id },
    status: "INIT",
    createdAt: now,
    updatedAt: now,
    transcript: [{ at: now, speaker: "system", text: "Call created" }],
  };
  calls.set(id, rec);
  persistFile();
  return rec;
}

export async function getCall(id: string): Promise<CallRecord | undefined> {
  if (hasDatabaseConfig()) {
    const pool = getDbPool();
    if (!pool) return undefined;
    const r = await pool.query(`select * from calls where id = $1`, [id]);
    if (r.rowCount === 0) return undefined;
    return rowToCall(r.rows[0]);
  }

  return calls.get(id);
}

export async function updateStatus(id: string, status: CallStatus, options?: { force?: boolean }) {
  const force = options?.force === true;

  if (hasDatabaseConfig()) {
    const pool = getDbPool();
    if (!pool) return;

    const existing = await pool.query(`select status from calls where id = $1`, [id]);
    if (existing.rowCount === 0) return;
    const current = existing.rows[0]?.status as CallStatus;

    if (!force && !canTransition(current, status)) {
      logEvent("call.status.transition_blocked", { callId: id, from: current, to: status });
      return;
    }

    await pool.query(`update calls set status = $2, updated_at = now() where id = $1`, [id, status]);
    return;
  }

  const rec = calls.get(id);
  if (!rec) return;

  if (!force && !canTransition(rec.status, status)) {
    logEvent("call.status.transition_blocked", { callId: id, from: rec.status, to: status });
    return;
  }

  rec.status = status;
  rec.updatedAt = new Date().toISOString();
  persistFile();
}

export async function addTranscript(id: string, speaker: "assistant" | "business" | "system", text: string) {
  const dedupeWindowMs = 15_000;

  if (hasDatabaseConfig()) {
    const call = await getCall(id);
    if (!call) return;

    const last = call.transcript[call.transcript.length - 1];
    if (last && last.speaker === speaker && last.text === text) {
      const delta = Date.now() - Date.parse(last.at);
      if (!Number.isNaN(delta) && delta >= 0 && delta <= dedupeWindowMs) return;
    }

    const transcript = [...call.transcript, { at: new Date().toISOString(), speaker, text }];
    const pool = getDbPool();
    if (!pool) return;
    await pool.query(`update calls set transcript = $2::jsonb, updated_at = now() where id = $1`, [id, JSON.stringify(transcript)]);
    return;
  }

  const rec = calls.get(id);
  if (!rec) return;

  const last = rec.transcript[rec.transcript.length - 1];
  if (last && last.speaker === speaker && last.text === text) {
    const delta = Date.now() - Date.parse(last.at);
    if (!Number.isNaN(delta) && delta >= 0 && delta <= dedupeWindowMs) return;
  }

  rec.transcript.push({ at: new Date().toISOString(), speaker, text });
  rec.updatedAt = new Date().toISOString();
  persistFile();
}

export async function setOutcome(id: string, outcome: CallOutcome) {
  if (hasDatabaseConfig()) {
    const pool = getDbPool();
    if (!pool) return;
    await pool.query(`update calls set outcome = $2::jsonb, updated_at = now() where id = $1`, [id, JSON.stringify(outcome)]);
    return;
  }

  const rec = calls.get(id);
  if (!rec) return;
  rec.outcome = outcome;
  rec.updatedAt = new Date().toISOString();
  persistFile();
}

export async function attachTwilioSid(id: string, sid: string) {
  if (hasDatabaseConfig()) {
    const pool = getDbPool();
    if (!pool) return;
    await pool.query(`update calls set twilio_call_sid = $2, updated_at = now() where id = $1`, [id, sid]);
    return;
  }

  const rec = calls.get(id);
  if (!rec) return;
  rec.twilioCallSid = sid;
  rec.updatedAt = new Date().toISOString();
  persistFile();
}

export async function updateReservation(id: string, patch: Partial<CallRecord["reservation"]>) {
  const call = await getCall(id);
  if (!call) return;

  const nextReservation = { ...call.reservation, ...patch };
  if (hasDatabaseConfig()) {
    const pool = getDbPool();
    if (!pool) return;
    await pool.query(`update calls set reservation = $2::jsonb, updated_at = now() where id = $1`, [id, JSON.stringify(nextReservation)]);
    return;
  }

  call.reservation = nextReservation;
  call.updatedAt = new Date().toISOString();
  calls.set(id, call);
  persistFile();
}

export async function failStaleCalls(): Promise<{ updated: number; staleCallIds: string[] }> {
  const all = await listCalls();
  const nowMs = Date.now();
  const staleCallIds: string[] = [];

  for (const rec of all) {
    if (isTerminalStatus(rec.status)) continue;

    const updatedAtMs = Date.parse(rec.updatedAt);
    if (Number.isNaN(updatedAtMs)) continue;

    const ageMs = nowMs - updatedAtMs;
    const limitMs = rec.status === "DIALING" || rec.status === "CONNECTED" ? env.callDialTimeoutMs : env.callConversationTimeoutMs;

    if (ageMs > limitMs) {
      const timedOutStatus = rec.status;
      await updateStatus(rec.id, "FAILED");
      await setOutcome(rec.id, {
        status: "failed",
        needsUserApproval: false,
        confidence: 0.2,
        reason: `Timed out in ${timedOutStatus} after ${Math.round(ageMs / 1000)}s`,
      });
      await addTranscript(rec.id, "system", `Auto-timeout: call marked FAILED after ${Math.round(ageMs / 1000)}s without progress`);
      staleCallIds.push(rec.id);
    }
  }

  return { updated: staleCallIds.length, staleCallIds };
}

export async function listCalls() {
  if (hasDatabaseConfig()) {
    const pool = getDbPool();
    if (!pool) return [];
    const r = await pool.query(`select * from calls order by created_at desc`);
    return r.rows.map(rowToCall);
  }

  return Array.from(calls.values());
}
