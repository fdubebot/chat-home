import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 8787),
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:8787",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  openclawCallbackUrl: process.env.OPENCLAW_CALLBACK_URL || "",
  openclawCallbackToken: process.env.OPENCLAW_CALLBACK_TOKEN || "",
  dataFile: process.env.DATA_FILE || "./data/calls.json",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  callDialTimeoutMs: Number(process.env.CALL_DIAL_TIMEOUT_MS || 120000),
  callConversationTimeoutMs: Number(process.env.CALL_CONVERSATION_TIMEOUT_MS || 600000),
  twilioCreateTimeoutMs: Number(process.env.TWILIO_CREATE_TIMEOUT_MS || 12000),
  twilioCreateMaxAttempts: Number(process.env.TWILIO_CREATE_MAX_ATTEMPTS || 3),
  twilioMachineDetection: (process.env.TWILIO_MACHINE_DETECTION || "detect-message-end").toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || "",
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || "",
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || "",
  elevenlabsModelId: process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5",
  audioCacheDir: process.env.AUDIO_CACHE_DIR || "./data/audio-cache",
  metricsToken: process.env.METRICS_TOKEN || "",
};

export function hasTwilioConfig() {
  return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioPhoneNumber);
}
