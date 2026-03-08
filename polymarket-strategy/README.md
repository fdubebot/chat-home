# Polymarket Strategy Project

This project implements the strategy from the shared video on a suitable Polymarket market.

## Goals

1. Convert the video strategy into explicit trading rules.
2. Select a market where those rules have edge and clean execution.
3. Build a repeatable workflow (manual first, automation-ready).
4. Add risk controls and clear stop conditions.

## Structure

- `strategy-spec.md` — exact entry/exit/invalidation logic from the video
- `market-selection.md` — shortlist and final market choice with rationale
- `execution-playbook.md` — step-by-step operational checklist
- `risk-management.md` — position sizing, max loss, halts
- `journal-template.md` — logging template for each trade

## Next step

Fill `strategy-spec.md` with the actual rules from the video (or transcript), then we map them to a Polymarket market and execute.
