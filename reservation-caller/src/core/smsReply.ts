import { env } from "../config/env.js";

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export function buildSmartSmsReply(inboundBody: string): string {
  const body = normalize(inboundBody || "");

  if (!body) {
    return "Thanks for your message — Felix got it. Could you share a bit more detail so I can pass it along accurately?";
  }

  // Availability-style replies
  if (/\b(yes|yep|sure|available|works|ok|okay|sounds good)\b/.test(body)) {
    if (/\b(3|3:00|3pm|15:00)\b/.test(body)) {
      return "Great, thanks! I’ll let Felix know you’re available around 3 PM. ☕";
    }
    return "Great, thanks! I’ll let Felix know you’re available.";
  }

  if (/\b(no|not available|can'?t|cannot|busy|unavailable)\b/.test(body)) {
    return "No worries, thanks for letting me know. I’ll pass that to Felix. If another time works, feel free to suggest it.";
  }

  // Time suggestions (simple extraction)
  if (/\b([01]?\d|2[0-3])[:h][0-5]\d\b/.test(body) || /\b(\d{1,2})\s?(am|pm)\b/.test(body)) {
    return "Thanks for the timing details — I’ll pass that to Felix right away.";
  }

  // Question from sender
  if (body.includes("?") || /\b(when|where|what time|who|why|how)\b/.test(body)) {
    return "Good question — I’ll forward this to Felix and he’ll reply shortly.";
  }

  // Affection / friendly responses
  if (/\b(love|❤️|😍|miss you|xoxo)\b/.test(body)) {
    return "Aww 💛 I’ll make sure Felix sees this right away.";
  }

  // Generic fallback (customizable via env)
  return env.smsAutoReplyMessage;
}
