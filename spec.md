# TradeSignal AI

## Current State
New project build (no existing src directory).

## Requested Changes (Diff)

### Add
- TradingView widget with any symbol and any time window support
- Technical indicators panel: RSI, MACD, Bollinger Bands, EMA, SMA, Stochastic, ATR, Volume
- AI-powered signal analysis using top 5 AI models (GPT-4o, Claude 3.5, Gemini 1.5 Pro, Grok-2, Llama 3.1)
- Shop entry indicators: visual entry zones overlaid on chart
- Trade signals panel: BUY/SELL/HOLD with Entry Price, Target 1, Target 2, Stop Loss
- Indicator summary panel showing current values and signal direction for each indicator
- Settings page for API key management per AI provider
- Symbol search input supporting stocks, crypto, forex, commodities
- Time window selector: 1m, 5m, 15m, 1h, 4h, 1D, 1W, 1M
- Auto-analysis trigger on symbol/timeframe/AI model change
- Internet Identity login

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store user API keys per provider, serve indicator data via HTTP outcalls to price APIs
2. Frontend: TradingView chart widget, indicators sidebar, AI signal panel, settings modal
3. Indicators computed client-side from OHLCV data fetched via backend HTTP outcalls
4. AI analysis sends indicator snapshot + price context to selected AI model
5. Shop entry points displayed as horizontal lines on chart based on AI signal levels
