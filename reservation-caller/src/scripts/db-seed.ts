import { randomUUID } from "node:crypto";
import { getDbPool, hasDatabaseConfig } from "../core/db.js";

async function main() {
  if (!hasDatabaseConfig()) {
    console.error("DATABASE_URL is not set. Skipping seed.");
    process.exit(1);
  }

  const pool = getDbPool();
  if (!pool) {
    console.error("Failed to initialize Postgres pool.");
    process.exit(1);
  }

  const id = `seed-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const reservation = {
    requestId: id,
    businessName: "Seed Bistro",
    businessPhone: "+15145550123",
    date: "2026-02-22",
    timePreferred: "20:00",
    partySize: 2,
    nameForBooking: "Felix",
  };
  const transcript = [{ at: now, speaker: "system", text: "Seed call created" }];

  await pool.query(
    `insert into calls (id, reservation, status, created_at, updated_at, transcript, outcome, twilio_call_sid)
     values ($1, $2::jsonb, $3, $4::timestamptz, $5::timestamptz, $6::jsonb, $7::jsonb, $8)
     on conflict (id) do nothing`,
    [id, JSON.stringify(reservation), "INIT", now, now, JSON.stringify(transcript), null, null],
  );

  console.log(`Seed complete: inserted ${id}`);
  await pool.end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
