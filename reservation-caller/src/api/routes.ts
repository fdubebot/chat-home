import express from "express";
import { callsRouter } from "./routes/calls.js";
import { openclawRouter } from "./routes/openclaw.js";
import { telegramRouter } from "./routes/telegram.js";
import { twilioRouter } from "./routes/twilio.js";
import { monitoringRouter } from "./routes/monitoring.js";
import { smsRouter } from "./routes/sms.js";

export const router = express.Router();
router.use(callsRouter);
router.use(openclawRouter);
router.use(telegramRouter);
router.use(twilioRouter);
router.use(smsRouter);
router.use(monitoringRouter);
