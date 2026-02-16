import twilio from "twilio";
import { env, hasTwilioConfig } from "../config/env.js";

export function getTwilioClient() {
  if (!hasTwilioConfig()) throw new Error("Twilio credentials are not configured");
  return twilio(env.twilioAccountSid, env.twilioAuthToken);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function createOutboundCall(params: { to: string; callId: string }) {
  if (!hasTwilioConfig()) {
    throw new Error("Twilio credentials are not configured");
  }

  const client = getTwilioClient();

  const voiceUrl = `${env.appBaseUrl}/api/twilio/voice?callId=${encodeURIComponent(params.callId)}`;
  const statusCallback = `${env.appBaseUrl}/api/twilio/status?callId=${encodeURIComponent(params.callId)}`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= env.twilioCreateMaxAttempts; attempt += 1) {
    try {
      const call = await withTimeout(
        client.calls.create({
          to: params.to,
          from: env.twilioPhoneNumber,
          url: voiceUrl,
          statusCallback,
          statusCallbackMethod: "POST",
          statusCallbackEvent: ["initiated", "ringing", "answered", "completed", "busy", "no-answer", "failed", "canceled"],
          ...(env.twilioMachineDetection === "enable"
            ? { machineDetection: "Enable" as const }
            : env.twilioMachineDetection === "detect-message-end"
              ? { machineDetection: "DetectMessageEnd" as const }
              : {}),
        }),
        env.twilioCreateTimeoutMs,
        "Twilio call creation",
      );

      return call;
    } catch (error) {
      lastError = error;
      if (attempt < env.twilioCreateMaxAttempts) {
        const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 5000);
        await sleep(backoffMs);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to create outbound Twilio call");
}
