# reservation-caller (MVP)

Voice-calling workflow skeleton for phone reservations.

## What is implemented

- API skeleton for reservation call orchestration
- Call state machine + in-memory store
- Guardrail policy hooks
- Twilio webhook placeholders
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
