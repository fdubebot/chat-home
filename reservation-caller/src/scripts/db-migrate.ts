import { getDbPool, hasDatabaseConfig, CALLS_SCHEMA_SQL } from "../core/db.js";

async function main() {
  if (!hasDatabaseConfig()) {
    console.error("DATABASE_URL is not set. Skipping migration.");
    process.exit(1);
  }

  const pool = getDbPool();
  if (!pool) {
    console.error("Failed to initialize Postgres pool.");
    process.exit(1);
  }

  await pool.query(CALLS_SCHEMA_SQL);
  console.log("Migration complete: calls table is ready.");
  await pool.end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
