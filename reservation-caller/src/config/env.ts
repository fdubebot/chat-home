import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 8787),
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:8787",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
};

export function hasTwilioConfig() {
  return Boolean(env.twilioAccountSid && env.twilioAuthToken && env.twilioPhoneNumber);
}
