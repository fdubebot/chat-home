import express from "express";
import { metricsSnapshot } from "../../core/metrics.js";
import { env } from "../../config/env.js";

export const monitoringRouter = express.Router();

function authorized(req: express.Request): boolean {
  if (!env.metricsToken) return true;
  const header = String(req.header("authorization") || "");
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const query = String(req.query.token || "").trim();
  return bearer === env.metricsToken || query === env.metricsToken;
}

monitoringRouter.use((req, res, next) => {
  if (!authorized(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
});

monitoringRouter.get("/metrics", (_req, res) => {
  res.json({ ok: true, ...metricsSnapshot() });
});

monitoringRouter.get("/metrics/ui", (_req, res) => {
  const snapshot = metricsSnapshot();
  const rows = snapshot.routes
    .map(
      (r) => `
        <tr>
          <td>${r.route}</td>
          <td>${r.count}</td>
          <td>${r.errors}</td>
          <td>${r.avgMs}</td>
          <td>${r.maxMs}</td>
        </tr>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>reservation-caller metrics</title>
  <style>
    body { font-family: Inter, system-ui, Arial, sans-serif; margin: 20px; color: #111; }
    h1 { margin: 0 0 8px; }
    .muted { color: #666; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left; }
    th { background: #fafafa; }
    .err { color: #b00020; font-weight: 600; }
    .ok { color: #0a7a33; font-weight: 600; }
    .row { display: flex; gap: 12px; margin: 10px 0 18px; }
    .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 10px 12px; }
    code { background: #f5f5f5; padding: 1px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>reservation-caller metrics</h1>
  <div class="muted">Uptime: <strong>${snapshot.uptimeSec}s</strong> · JSON: <code>/metrics</code></div>

  <div class="row">
    <div class="card">Routes tracked: <strong>${snapshot.routes.length}</strong></div>
    <div class="card">Total requests: <strong>${snapshot.routes.reduce((a, r) => a + r.count, 0)}</strong></div>
    <div class="card">Total errors: <strong class="${snapshot.routes.reduce((a, r) => a + r.errors, 0) > 0 ? "err" : "ok"}">${snapshot.routes.reduce((a, r) => a + r.errors, 0)}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Route</th>
        <th>Count</th>
        <th>Errors</th>
        <th>Avg ms</th>
        <th>Max ms</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5">No traffic yet</td></tr>'}
    </tbody>
  </table>

  <script>
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>`;

  res.type("html").send(html);
});
