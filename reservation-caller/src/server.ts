import express from "express";
import path from "node:path";
import { env } from "./config/env.js";
import { router } from "./api/routes.js";
import { initDb, hasDatabaseConfig } from "./core/db.js";
import { requestContextMiddleware } from "./core/metrics.js";
import { logEvent } from "./core/log.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestContextMiddleware);
app.use("/audio", express.static(path.resolve(env.audioCacheDir)));
app.use(router);

let server: ReturnType<typeof app.listen> | undefined;

async function main() {
  await initDb();
  server = app.listen(env.port, () => {
    logEvent("app.started", {
      port: env.port,
      mode: hasDatabaseConfig() ? "postgres" : "file",
      audioCacheDir: env.audioCacheDir,
    });
    console.log(`reservation-caller listening on :${env.port} (${hasDatabaseConfig() ? "postgres" : "file"} mode)`);
  });
}

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logEvent("app.shutdown", { signal });

  await new Promise<void>((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
    setTimeout(() => resolve(), 8_000);
  });

  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

main().catch((error) => {
  console.error("Failed to start reservation-caller", error);
  logEvent("app.start_failed", { error: error instanceof Error ? error.message : "unknown" });
  process.exit(1);
});
