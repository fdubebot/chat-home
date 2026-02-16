import express from "express";
import { env } from "../../config/env.js";
import { applyDecision } from "../../core/decision.js";
import { runRecall } from "../../core/recall.js";
import { clearPendingRevision, getPendingRevision, setPendingRevision } from "../../core/reviseSession.js";
import { answerCallbackQuery, editMessage, sendMessage } from "../../core/telegram.js";
import { parseRevisionText } from "../../core/helpers.js";

export const telegramRouter = express.Router();

telegramRouter.post("/api/telegram/webhook", async (req, res) => {
  if (env.telegramWebhookSecret) {
    const got = req.header("x-telegram-bot-api-secret-token") || "";
    if (got !== env.telegramWebhookSecret) return res.status(403).json({ error: "Invalid Telegram secret" });
  }

  const msg = req.body?.message;
  if (msg?.chat?.id && typeof msg?.text === "string") {
    const chatId = String(msg.chat.id);
    const pendingCallId = getPendingRevision(chatId);
    if (pendingCallId) {
      const patch = parseRevisionText(msg.text);
      if (!patch.date && !patch.timePreferred && typeof patch.partySize !== "number") {
        await sendMessage(chatId, "I couldn’t parse changes. Try: 2026-02-22 20:00 for 2");
        return res.json({ ok: true, message: "No revision fields parsed" });
      }

      const result = await runRecall(pendingCallId, patch, msg.text);
      clearPendingRevision(chatId);

      if ("error" in result) {
        await sendMessage(chatId, `❌ Revision failed for ${pendingCallId}: ${result.error}`);
        return res.json({ ok: true, message: `Revision failed: ${result.error}` });
      }

      const when = [patch.date, patch.timePreferred].filter(Boolean).join(" ") || "(unchanged)";
      const party = typeof patch.partySize === "number" ? String(patch.partySize) : "(unchanged)";
      await sendMessage(chatId, `🔁 Recall queued for ${pendingCallId}\nWhen: ${when}\nParty size: ${party}${result.simulated ? "\nMode: simulation" : ""}`);
      return res.json({ ok: true, message: "Revision accepted and recall queued", callId: pendingCallId, ...result });
    }
  }

  const cb = req.body?.callback_query;
  if (!cb) return res.json({ ok: true });

  const data = String(cb.data || "");
  const parts = data.split("|");
  if (parts.length !== 3 || parts[0] !== "rc") {
    await answerCallbackQuery(String(cb.id), "Unknown action");
    return res.json({ ok: true });
  }

  const decision = parts[1] as "approve" | "revise" | "cancel";
  const callId = parts[2];

  if (decision === "revise") {
    const chatId = String(cb.message?.chat?.id || "");
    if (chatId) setPendingRevision(chatId, callId);
    await answerCallbackQuery(String(cb.id), "Send new time/date, e.g. '2026-02-22 20:00 for 2'");
    const messageId = cb.message?.message_id;
    if (chatId && messageId) await editMessage(chatId, messageId, `✏️ Send revised details now (example: 2026-02-22 20:00 for 2). Call ${callId}`);
    return res.json({ ok: true, action: "revise_requested", callId });
  }

  const result = await applyDecision(callId, decision, undefined);
  if ("error" in result) {
    await answerCallbackQuery(String(cb.id), "Call not found");
    return res.json({ ok: true });
  }

  await answerCallbackQuery(String(cb.id), `Decision saved: ${decision}`);
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  if (chatId && messageId) await editMessage(chatId, messageId, `✅ Decision recorded: ${decision} (call ${callId})`);

  return res.json({ ok: true, call: result.call });
});
