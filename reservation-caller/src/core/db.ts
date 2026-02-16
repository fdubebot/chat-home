import { Pool } from "pg";
import { env } from "../config/env.js";

let pool: Pool | null = null;

export function hasDatabaseConfig() {
  return Boolean(env.databaseUrl);
}

export function getDbPool() {
  if (!env.databaseUrl) return null;
  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }
  return pool;
}

export const CALLS_SCHEMA_SQL = `
  create table if not exists calls (
    id text primary key,
    reservation jsonb not null,
    status text not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    transcript jsonb not null,
    outcome jsonb null,
    twilio_call_sid text null
  );
`;

export async function initDb() {
  const p = getDbPool();
  if (!p) return;
  await p.query(CALLS_SCHEMA_SQL);
}
