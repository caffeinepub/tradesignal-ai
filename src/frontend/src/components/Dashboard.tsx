import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAnalyzeChart, useGetApiKey } from "../hooks/useQueries";
import ApiKeyModal from "./ApiKeyModal";
import ChatPanel from "./ChatPanel";
import MarketDataPanel from "./MarketDataPanel";
import type { MarketData } from "./MarketDataPanel";
import Navbar from "./Navbar";
import SignalHistory from "./SignalHistory";
import SignalPanel from "./SignalPanel";
import type { SignalResult } from "./SignalPanel";

export default function Dashboard() {
  const [symbol, setSymbol] = useState("BTC/USD");
  const [timeframe, setTimeframe] = useState("1H");
  const [signalResult, setSignalResult] = useState<SignalResult | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  const { data: apiKey = "", isLoading: apiKeyLoading } = useGetApiKey();
  const { mutateAsync: analyzeChart, isPending: isAnalyzing } =
    useAnalyzeChart();

  // Prompt for API key if not set
  const showKeyPrompt = !apiKeyLoading && apiKey === "";

  const handleAnalyze = async (data: MarketData) => {
    if (!apiKey) {
      toast.error("Please set your OpenAI API key in Settings");
      setApiKeyModalOpen(true);
      return;
    }

    const marketDataJson = JSON.stringify({
      price: data.price,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
      rsi: data.rsi,
      macd: { value: data.macdValue, signal: data.macdSignal },
      movingAverages: { ma50: data.ma50, ma200: data.ma200 },
    });

    try {
      const responseStr = await analyzeChart({
        symbol,
        timeframe,
        marketData: marketDataJson,
        apiKey,
      });

      let parsed: SignalResult;
      try {
        // Try to extract JSON from response
        const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseStr);
      } catch {
        // Fallback: parse as text
        toast.error("Could not parse AI response. Check your API key.");
        return;
      }

      setSignalResult(parsed);
      toast.success(`Signal generated: ${parsed.signal}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Analysis failed");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background grid-bg overflow-hidden">
      <Navbar
        symbol={symbol}
        setSymbol={setSymbol}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        onSettings={() => setApiKeyModalOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden p-3 flex flex-col gap-3 min-h-0">
        {/* Top row: Market Data + Signal + Chat */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
          <div className="min-h-0">
            <MarketDataPanel
              onAnalyze={handleAnalyze}
              isLoading={isAnalyzing}
              symbol={symbol}
              timeframe={timeframe}
            />
          </div>
          <div className="min-h-0">
            <SignalPanel
              result={signalResult}
              symbol={symbol}
              timeframe={timeframe}
            />
          </div>
          <div className="min-h-0">
            <ChatPanel
              apiKey={apiKey}
              lastSignal={signalResult}
              symbol={symbol}
            />
          </div>
        </div>

        {/* Signal History */}
        <div className="shrink-0">
          <SignalHistory />
        </div>
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        open={apiKeyModalOpen || showKeyPrompt}
        onOpenChange={setApiKeyModalOpen}
        existingKey={apiKey}
        required={showKeyPrompt && !apiKeyModalOpen}
      />
    </div>
  );
}
