import { getDbPool, hasDatabaseConfig } from "../core/db.js";

async function main() {
  if (!hasDatabaseConfig()) {
    console.error("DATABASE_URL is not set. Skipping reset.");
    process.exit(1);
  }

  const pool = getDbPool();
  if (!pool) {
    console.error("Failed to initialize Postgres pool.");
    process.exit(1);
  }

  await pool.query("truncate table calls");
  console.log("Reset complete: calls table truncated.");
  await pool.end();
}

main().catch((error) => {
  console.error("Reset failed:", error);
  process.exit(1);
});
