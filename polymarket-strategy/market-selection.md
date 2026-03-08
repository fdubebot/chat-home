# Market Selection

## Selection criteria
- Same-day resolution (to match intraday 9:35 setup)
- Strong liquidity and tight bid/ask
- Contract tied directly to BTC/ETH spot level by a fixed time
- Clear, objective resolution source

## Candidate markets
1. **BTC above/below specific level by end of day (ET/UTC)**
2. **ETH above/below specific level by end of day (ET/UTC)**
3. **BTC hourly close above/below level (if available and liquid)**

## Final pick
- Market: **"Will Bitcoin be above $X at 11:59 PM ET today?"** (same-day BTC level contract)
- Strike selection rule (fixed): pick the listed strike closest to current BTC spot at 9:35 AM ET, then only trade that contract for the session.
- Why this one:
  - Best fit for your one-candle intraday structure
  - Direct YES/NO mapping to directional signal
  - Typically the deepest crypto order books on Polymarket
- Why not alternatives:
  - ETH alternatives are acceptable but usually thinner
  - Multi-day macro markets don’t match your intraday edge window

## Execution notes
- Entry windows: Primary 9:35 AM–11:00 AM ET after valid break/FVG/retest/engulfing sequence
- Exit windows: TP at 3R equivalent, invalidation exit, or time stop into close
- Potential news/event risks: CPI/FOMC/Fed speakers, ETF flow headlines, exchange incident news
