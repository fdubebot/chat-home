# Strategy Spec (from video)

## 1) Core thesis
- Use the 9:30–9:35 AM ET opening 5-minute range as the day’s key structure.
- Only trade breaks of that range when momentum is confirmed by a Fair Value Gap (FVG) on 1-minute structure.
- Enter only after retest into FVG plus engulfing confirmation.

## 2) Market type this works on
- Event category: Short-dated crypto directional markets (Polymarket YES/NO on BTC/ETH levels)
- Time horizon: Intraday (entry shortly after 9:35 AM ET; resolution same day)
- Volatility profile: Moderate-to-high volatility around US market open

## 3) Entry conditions (must be objective)
- Trigger A: Mark high/low of 9:30–9:35 AM ET 5m candle on underlying (e.g., BTCUSDT spot/perp).
- Trigger B: On 1m chart, price breaks above high (long bias) or below low (short bias) and forms an FVG in breakout direction.
- Optional filter: Avoid entries if spread on target Polymarket contract is too wide or order book depth is thin.

## 4) Positioning
- Side: YES for bullish signal; NO for bearish signal (on selected contract).
- Initial size (% bankroll): 1.0% risk unit per setup (can scale later).
- Add-on rules: No add-ons until 20-trade sample validates edge.

## 5) Exit conditions
- Take-profit rule: Fixed 3:1 reward-to-risk based on invalidation distance translated into contract price move.
- Time-based exit: Close by end-of-day if target not hit and edge decays.
- Early cut rule: Exit immediately if setup structure is invalidated (see below).

## 6) Invalidation
- What would prove thesis wrong? Reclaim of broken range against the trade and failure to continue after FVG retest.
- Hard stop condition: Equivalent of stop below/above retest swing low/high mapped to max contract loss.

## 7) Risk constraints
- Max risk per trade: 1.0% bankroll
- Max exposure per market: 5.0% bankroll
- Daily/weekly drawdown limit: 3R daily halt; 6R weekly halt

## 8) Operational constraints
- Minimum liquidity needed: Prefer contracts with strong volume and visible depth near mid.
- Max spread allowed: <= 2 cents preferred (hard cap 3 cents).
- Slippage tolerance: <= 1 cent from planned fill.

## 9) Notes from video quotes
- "Mark high and low of 9:30–9:35 candle."
- "Wait for break + fair value gap confirmation."
- "Enter on retest into FVG after engulfing candle."
- "Stop below low, target fixed 3:1."
