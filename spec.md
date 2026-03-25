# TradeSignal AI

## Current State
New project. Empty workspace.

## Requested Changes (Diff)

### Add
- Trading signal analysis app with AI-powered chart analysis
- OpenAI GPT-4 integration via HTTP outcalls for chart/market analysis
- User authentication (authorization component)
- Dashboard with market symbol input and AI analysis panel
- Trading signals display: BUY/SELL/HOLD with confidence levels, entry/exit price targets, stop loss
- AI chat interface where users can ask follow-up questions about analysis
- Multiple timeframe selection (1H, 4H, 1D, 1W)
- Indicator inputs: price, volume, RSI, MACD, moving averages (user inputs these)
- Signal history log
- API key management (users provide their own OpenAI API key stored in their session)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend (Motoko):
   - HTTP outcalls to OpenAI GPT-4 API for trading analysis
   - Endpoint: analyzeChart(symbol, timeframe, priceData, indicators, apiKey) -> SignalResult
   - Endpoint: chatWithAI(messages, apiKey) -> AIResponse
   - SignalResult type: { signal, confidence, entryPrice, targetPrice, stopLoss, reasoning, timestamp }
   - Store signal history per user (last 20 signals)
   - getSignalHistory() -> [SignalResult]
   - Authorization for user management

2. Frontend (React):
   - Dark trading theme
   - Landing/login page
   - Main dashboard:
     - Symbol input + timeframe selector
     - Market data input form (OHLCV + indicators)
     - "Analyze" button triggering AI analysis
     - Signal card: BUY/SELL/HOLD badge, confidence meter, entry/target/stop
     - AI reasoning text
     - Chat panel for follow-up questions
     - Signal history sidebar
   - API key settings modal
