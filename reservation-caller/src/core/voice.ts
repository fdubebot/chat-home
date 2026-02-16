import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";

function hasElevenLabsConfig() {
  return Boolean(env.elevenlabsApiKey && env.elevenlabsVoiceId);
}

function cacheName(text: string) {
  return `${createHash("sha256").update(`${env.elevenlabsVoiceId}:${env.elevenlabsModelId}:${text}`).digest("hex")}.mp3`;
}

export async function getSpeechAudioUrl(text: string): Promise<string | null> {
  if (!hasElevenLabsConfig()) return null;

  const fileName = cacheName(text);
  const absDir = path.resolve(env.audioCacheDir);
  const absPath = path.join(absDir, fileName);

  try {
    await fs.access(absPath);
    return `${env.appBaseUrl}/audio/${fileName}`;
  } catch {
    // cache miss
  }

  await fs.mkdir(absDir, { recursive: true });

  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env.elevenlabsVoiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": env.elevenlabsApiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: env.elevenlabsModelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
      },
    }),
  });

  if (!resp.ok) return null;
  const audio = Buffer.from(await resp.arrayBuffer());
  await fs.writeFile(absPath, audio);
  return `${env.appBaseUrl}/audio/${fileName}`;
}
