# reservation-caller (MVP)

Voice-calling workflow skeleton for phone reservations.

## What is implemented

- API skeleton for reservation call orchestration
- Call state machine + JSON persistence (`DATA_FILE`)
- Guardrail policy hooks
- Real Twilio outbound call creation (when env vars are set)
- TwiML voice loop endpoints (`/api/twilio/voice`, `/api/twilio/gather`)
- Twilio webhook signature verification
- OpenClaw callback hook for approval/confirmation events
- OpenClaw receiver endpoints (`/api/openclaw/callback`, `/api/openclaw/decision`)
- Telegram approval buttons via webhook (`/api/telegram/webhook`)
- Negotiation parser + policy decision engine (`core/extract.ts`, `core/negotiate.ts`)
- Clarification retry loop with escalation after repeated ambiguity
- User approval endpoint before final confirmation

## Quickstart

```bash
npm install
cp .env.example .env
npm run dev
```

Health:

```bash
curl http://localhost:8787/health
```

Optional callbacks to OpenClaw session:

- `OPENCLAW_CALLBACK_URL` — webhook endpoint you control
- `OPENCLAW_CALLBACK_TOKEN` — optional bearer token

When a call needs approval, the service sends an `approval_required` event with call details.

Telegram inline-button approvals:

- set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, optional `TELEGRAM_WEBHOOK_SECRET`
- point your Telegram bot webhook to: `https://<your-host>/api/telegram/webhook`
- on approval_required, the bot posts buttons (Approve / Revise / Cancel)

## Example flow

1. Start a call request:
```bash
curl -X POST http://localhost:8787/api/calls/start \
  -H 'content-type: application/json' \
  -d '{
    "businessName":"Test Bistro",
    "businessPhone":"+15145550123",
    "date":"2026-02-15",
    "timePreferred":"19:30",
    "partySize":2,
    "nameForBooking":"Felix"
  }'
```

2. Simulate a risky outcome (requires approval):
```bash
curl -X POST http://localhost:8787/api/mock/proposed-outcome/<CALL_ID> \
  -H 'content-type: application/json' \
  -d '{"note":"Requires card deposit"}'
```

3. Approve/revise/cancel:
```bash
curl -X POST http://localhost:8787/api/calls/<CALL_ID>/approve \
  -H 'content-type: application/json' \
  -d '{"decision":"approve","notes":"Proceed"}'
```

## Next coding steps

- Add real Twilio outbound call creation in `/api/calls/start`
- Implement Twilio Voice webhook XML responses
- Integrate real-time STT/TTS loop
- Persist state in Postgres/Redis
- Add OpenClaw callback hook for user approvals
