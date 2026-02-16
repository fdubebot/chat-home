import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { logEvent } from "./log.js";

type RouteKey = string;

type Stats = {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
};

const routeStats = new Map<RouteKey, Stats>();

function keyOf(method: string, route: string) {
  return `${method.toUpperCase()} ${route}`;
}

function getOrCreate(key: string): Stats {
  const existing = routeStats.get(key);
  if (existing) return existing;
  const created: Stats = { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
  routeStats.set(key, created);
  return created;
}

function routeLabel(req: Request): string {
  // originalUrl preserves path/query; strip query for grouping
  return (req.path || req.originalUrl || "unknown").split("?")[0] || "unknown";
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = String(req.header("x-request-id") || randomUUID());
  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const start = Date.now();
  const method = req.method;
  const route = routeLabel(req);

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const key = keyOf(method, route);
    const stat = getOrCreate(key);
    stat.count += 1;
    stat.totalMs += durationMs;
    stat.maxMs = Math.max(stat.maxMs, durationMs);
    if (res.statusCode >= 500) stat.errors += 1;

    logEvent("http.request", {
      requestId,
      method,
      route,
      status: res.statusCode,
      durationMs,
    });
  });

  next();
}

export function metricsSnapshot() {
  const routes = Array.from(routeStats.entries()).map(([route, stat]) => ({
    route,
    count: stat.count,
    errors: stat.errors,
    avgMs: stat.count ? Number((stat.totalMs / stat.count).toFixed(2)) : 0,
    maxMs: stat.maxMs,
  }));

  return {
    uptimeSec: Math.round(process.uptime()),
    routes,
  };
}
