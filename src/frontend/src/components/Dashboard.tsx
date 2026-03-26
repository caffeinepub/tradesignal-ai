import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "../hooks/use-mobile";
import {
  useAnalyzeChart,
  useGetProviderApiKey,
  useSaveProviderApiKey,
} from "../hooks/useQueries";
import ApiKeyModal from "./ApiKeyModal";
import IndicatorsPanel, { computeIndicators } from "./IndicatorsPanel";
import Navbar from "./Navbar";
import SignalHistory from "./SignalHistory";
import SignalPanel from "./SignalPanel";
import type { SignalResult } from "./SignalPanel";
import TradingViewChart from "./TradingViewChart";

const AI_MODELS = [
  {
    id: "openai",
    name: "GPT-4o",
    abbr: "GPT",
    provider: "OpenAI",
    color: "oklch(0.72 0.17 175)",
  },
  {
    id: "anthropic",
    name: "Claude 3.5",
    abbr: "Claude",
    provider: "Anthropic",
    color: "oklch(0.65 0.18 210)",
  },
  {
    id: "google",
    name: "Gemini 1.5 Pro",
    abbr: "Gemini",
    provider: "Google",
    color: "oklch(0.78 0.17 75)",
  },
  {
    id: "xai",
    name: "Grok-2",
    abbr: "Grok",
    provider: "xAI",
    color: "oklch(0.72 0.15 300)",
  },
  {
    id: "groq",
    name: "Llama 3.1 70B",
    abbr: "Llama",
    provider: "Groq",
    color: "oklch(0.7 0.18 30)",
  },
] as const;

type ModelId = (typeof AI_MODELS)[number]["id"];
type MobileTab = "signal" | "indicators" | "history";

const QUICK_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AAPL",
  "TSLA",
  "NVDA",
  "SPX",
  "GOLD",
  "OIL",
];

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"];

function parseSignalFromResponse(
  responseStr: string,
  provider: string,
): SignalResult {
  let text = responseStr;
  try {
    const outer = JSON.parse(responseStr);
    if (provider === "anthropic") {
      text = outer?.content?.[0]?.text ?? responseStr;
    } else if (provider === "google") {
      text = outer?.candidates?.[0]?.content?.parts?.[0]?.text ?? responseStr;
    } else {
      text = outer?.choices?.[0]?.message?.content ?? responseStr;
    }
  } catch {
    text = responseStr;
  }
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    throw new Error("Could not parse AI response");
  }
}

export default function Dashboard() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1H");
  const [selectedModel, setSelectedModel] = useState<ModelId>("openai");
  const [signalResult, setSignalResult] = useState<SignalResult | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("signal");
  const autoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  const { data: providerApiKey = "" } = useGetProviderApiKey(selectedModel);
  const { mutateAsync: analyzeChart, isPending: isAnalyzing } =
    useAnalyzeChart();
  const { mutateAsync: saveProviderKey } = useSaveProviderApiKey();

  const selectedModelInfo = AI_MODELS.find((m) => m.id === selectedModel)!;

  const runAnalysis = useCallback(
    async (
      sym: string,
      tf: string,
      model: string,
      apiKey: string,
      silent: boolean,
    ) => {
      const iv = computeIndicators(sym, tf);
      const marketData = JSON.stringify({
        symbol: sym,
        timeframe: tf,
        currentPrice: iv.currentPrice.toFixed(2),
        indicators: {
          rsi: {
            value: iv.rsi.toFixed(1),
            signal: iv.rsi >= 70 ? "SELL" : iv.rsi <= 30 ? "BUY" : "NEUTRAL",
          },
          macd: {
            line: iv.macdLine.toFixed(3),
            signal: iv.macdSignal.toFixed(3),
            trend: iv.macdLine > iv.macdSignal ? "bullish" : "bearish",
          },
          bollingerBands: {
            upper: iv.bbUpper.toFixed(2),
            lower: iv.bbLower.toFixed(2),
            mid: iv.bbMid.toFixed(2),
          },
          ema: {
            ema20: iv.ema20.toFixed(2),
            ema50: iv.ema50.toFixed(2),
            trend: iv.ema20 > iv.ema50 ? "bullish" : "bearish",
          },
          stochastic: {
            value: iv.stoch.toFixed(1),
            signal:
              iv.stoch >= 80 ? "SELL" : iv.stoch <= 20 ? "BUY" : "NEUTRAL",
          },
          volume: {
            trend: iv.volumeAboveAvg ? "above_average" : "below_average",
          },
          atr: { value: iv.atr.toFixed(4) },
        },
        instruction: `Analyze the above market data for ${sym} on ${tf} timeframe. Return ONLY a JSON object with these exact fields: {"signal":"BUY"|"SELL"|"HOLD","confidence":number(0-100),"entry":number,"target1":number,"target2":number,"stopLoss":number,"reasoning":"string(2-3 sentences)","indicatorConsensus":"string(1-2 sentences)"}`,
      });

      try {
        const responseStr = await analyzeChart({
          symbol: sym,
          timeframe: tf,
          marketData,
          provider: model,
          apiKey,
        });
        const parsed = parseSignalFromResponse(responseStr, model);
        setSignalResult(parsed);
        if (!silent)
          toast.success(
            `Signal: ${parsed.signal} (${parsed.confidence}% confidence)`,
          );
      } catch (err: any) {
        if (!silent) toast.error(err?.message ?? "Analysis failed");
      }
    },
    [analyzeChart],
  );

  const handleAnalyze = useCallback(() => {
    if (!providerApiKey) {
      toast.error(`Set your ${selectedModelInfo.provider} API key in Settings`);
      setApiKeyModalOpen(true);
      return;
    }
    runAnalysis(symbol, timeframe, selectedModel, providerApiKey, false);
  }, [
    providerApiKey,
    selectedModelInfo.provider,
    runAnalysis,
    symbol,
    timeframe,
    selectedModel,
  ]);

  // Auto-analyze with debounce
  useEffect(() => {
    if (!providerApiKey) return;
    if (autoDebounceRef.current) clearTimeout(autoDebounceRef.current);
    setAutoAnalyzing(true);
    autoDebounceRef.current = setTimeout(async () => {
      await runAnalysis(symbol, timeframe, selectedModel, providerApiKey, true);
      setAutoAnalyzing(false);
    }, 1000);
    return () => {
      if (autoDebounceRef.current) clearTimeout(autoDebounceRef.current);
    };
  }, [symbol, timeframe, selectedModel, providerApiKey, runAnalysis]);

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: "signal", label: "Signal" },
    { id: "indicators", label: "Indicators" },
    { id: "history", label: "History" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background grid-bg overflow-hidden">
      <Navbar
        selectedModel={selectedModelInfo}
        onSettings={() => setApiKeyModalOpen(true)}
      />

      {/* Top controls bar */}
      <div
        className="shrink-0 border-b border-border overflow-x-auto"
        style={{ background: "oklch(0.09 0.013 268)" }}
      >
        {/* Row 1: Symbol + Quick Symbols + Timeframes */}
        <div className="flex items-center gap-2 px-3 py-1.5 min-w-0">
          {/* Symbol input */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              Symbol
            </span>
            <input
              data-ocid="topbar.symbol.input"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-24 px-2 py-1 rounded text-xs font-mono bg-card border border-border text-foreground outline-none focus:border-primary transition-colors"
              placeholder="BTCUSDT"
            />
          </div>

          {/* Quick symbols */}
          <div className="flex items-center gap-1">
            {QUICK_SYMBOLS.map((s) => (
              <button
                type="button"
                key={s}
                data-ocid={`topbar.${s.toLowerCase()}.button`}
                onClick={() => setSymbol(s)}
                className="px-2 py-0.5 text-xs rounded font-mono whitespace-nowrap transition-all"
                style={{
                  background:
                    symbol === s
                      ? "oklch(0.72 0.17 175 / 0.15)"
                      : "oklch(0.15 0.018 265)",
                  color: symbol === s ? "oklch(0.72 0.17 175)" : undefined,
                  border:
                    symbol === s
                      ? "1px solid oklch(0.72 0.17 175 / 0.4)"
                      : "1px solid oklch(0.22 0.02 265)",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border mx-1 shrink-0" />

          {/* Timeframe buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {TIMEFRAMES.map((tf) => (
              <button
                type="button"
                key={tf}
                data-ocid={`topbar.${tf.toLowerCase()}.tab`}
                onClick={() => setTimeframe(tf)}
                className="px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all"
                style={{
                  background:
                    timeframe === tf
                      ? "oklch(0.72 0.17 175)"
                      : "oklch(0.15 0.018 265)",
                  color: timeframe === tf ? "oklch(0.08 0.012 270)" : undefined,
                  border:
                    timeframe === tf
                      ? "none"
                      : "1px solid oklch(0.22 0.02 265)",
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: AI Model selector + Analyze */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 min-w-0">
          {/* AI Model selector */}
          <div className="flex items-center gap-1">
            {AI_MODELS.map((model) => (
              <button
                type="button"
                key={model.id}
                data-ocid={`topbar.${model.id}.button`}
                onClick={() => setSelectedModel(model.id)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background:
                    selectedModel === model.id
                      ? `${model.color.replace(")", " / 0.15)")}`
                      : "oklch(0.15 0.018 265)",
                  color: selectedModel === model.id ? model.color : undefined,
                  border:
                    selectedModel === model.id
                      ? `1px solid ${model.color.replace(")", " / 0.5)")}`
                      : "1px solid oklch(0.22 0.02 265)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: model.color }}
                />
                <span className="hidden sm:inline">{model.name}</span>
                <span className="sm:hidden">{model.abbr}</span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            {autoAnalyzing && !isAnalyzing && (
              <span className="text-xs text-muted-foreground animate-pulse-slow hidden sm:inline">
                ● Auto...
              </span>
            )}
            {!providerApiKey && (
              <button
                type="button"
                className="text-xs underline underline-offset-2"
                style={{ color: selectedModelInfo.color }}
                onClick={() => setApiKeyModalOpen(true)}
                data-ocid="topbar.set_api_key.button"
              >
                Set API key
              </button>
            )}
            <button
              type="button"
              data-ocid="topbar.analyze.primary_button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, ${selectedModelInfo.color}, ${selectedModelInfo.color.replace(")", " / 0.7)")})`,
                color: "oklch(0.08 0.012 270)",
              }}
            >
              {isAnalyzing ? (
                <>
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  ⚡ <span className="hidden sm:inline">Analyze</span>
                </>
              )}
            </button>
            <button
              type="button"
              data-ocid="topbar.history.toggle"
              onClick={() => setHistoryOpen((v) => !v)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all hidden md:block"
              style={{
                background: historyOpen
                  ? "oklch(0.22 0.02 265)"
                  : "oklch(0.15 0.018 265)",
                border: "1px solid oklch(0.22 0.02 265)",
              }}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      {!isMobile ? (
        <main className="flex-1 overflow-hidden flex min-h-0">
          {/* Center: Chart + Indicators */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2 gap-2">
            {/* Chart */}
            <div className="flex-1 min-h-0">
              <TradingViewChart symbol={symbol} timeframe={timeframe} />
            </div>
            {/* Indicators */}
            <div className="shrink-0">
              <IndicatorsPanel symbol={symbol} timeframe={timeframe} />
            </div>
          </div>

          {/* Right panel: Signal + History */}
          <aside
            className="w-[300px] shrink-0 flex flex-col gap-2 p-2 border-l border-border overflow-hidden"
            style={{ background: "oklch(0.09 0.013 268)" }}
          >
            <div className="flex-1 min-h-0">
              <SignalPanel
                result={signalResult}
                symbol={symbol}
                timeframe={timeframe}
                isLoading={isAnalyzing}
              />
            </div>

            {historyOpen && (
              <div className="shrink-0 max-h-[280px] overflow-hidden">
                <SignalHistory />
              </div>
            )}
          </aside>
        </main>
      ) : (
        /* Mobile layout */
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Chart takes ~50% of remaining height */}
          <div className="h-[50%] shrink-0">
            <TradingViewChart symbol={symbol} timeframe={timeframe} />
          </div>

          {/* Tab strip */}
          <div
            className="shrink-0 flex border-t border-b border-border"
            style={{ background: "oklch(0.09 0.013 268)" }}
          >
            {mobileTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                data-ocid={`mobile.${tab.id}.tab`}
                onClick={() => setMobileTab(tab.id)}
                className="flex-1 py-2 text-xs font-medium transition-all"
                style={{
                  color:
                    mobileTab === tab.id
                      ? selectedModelInfo.color
                      : "oklch(0.55 0.01 270)",
                  borderBottom:
                    mobileTab === tab.id
                      ? `2px solid ${selectedModelInfo.color}`
                      : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-2">
            {mobileTab === "signal" && (
              <SignalPanel
                result={signalResult}
                symbol={symbol}
                timeframe={timeframe}
                isLoading={isAnalyzing}
              />
            )}
            {mobileTab === "indicators" && (
              <IndicatorsPanel symbol={symbol} timeframe={timeframe} />
            )}
            {mobileTab === "history" && <SignalHistory />}
          </div>
        </main>
      )}

      <ApiKeyModal
        open={apiKeyModalOpen}
        onOpenChange={setApiKeyModalOpen}
        initialProvider={selectedModel}
        onSave={async (provider, key) => {
          await saveProviderKey({ provider, apiKey: key });
        }}
      />
    </div>
  );
}
