import { useEffect, useRef, useState } from "react";

declare const window: Window & { TradingView: any };

const TF_MAP: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1H": "60",
  "4H": "240",
  "1D": "D",
  "1W": "W",
};

function tvInterval(tf: string): string {
  return TF_MAP[tf] ?? "60";
}

function normSymbol(raw: string): string {
  const s = raw.toUpperCase().replace("/", "");
  if (s === "SPX") return "SP:SPX";
  if (s === "GOLD") return "TVC:GOLD";
  if (s === "OIL") return "TVC:USOIL";
  if (["AAPL", "TSLA", "MSFT", "AMZN", "NVDA", "GOOGL", "META"].includes(s))
    return `NASDAQ:${s}`;
  if (
    [
      "EURUSD",
      "GBPUSD",
      "USDJPY",
      "AUDUSD",
      "USDCAD",
      "NZDUSD",
      "USDCHF",
    ].includes(s)
  )
    return `FX:${s}`;
  if (s.endsWith("USDT") || s.endsWith("USD") || s.endsWith("BTC"))
    return `BINANCE:${s}`;
  return s;
}

let scriptLoaded = false;
let scriptLoading = false;
const scriptCallbacks: Array<() => void> = [];

function loadTradingViewScript(onLoad: () => void, onError: () => void) {
  if (scriptLoaded) {
    onLoad();
    return;
  }
  scriptCallbacks.push(onLoad);
  if (scriptLoading) return;
  scriptLoading = true;
  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/tv.js";
  script.async = true;
  script.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    for (const cb of scriptCallbacks) cb();
    scriptCallbacks.length = 0;
  };
  script.onerror = () => {
    scriptLoading = false;
    onError();
  };
  document.head.appendChild(script);
}

interface Props {
  symbol: string;
  timeframe: string;
}

export default function TradingViewChart({ symbol, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const counterRef = useRef(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let destroyed = false;
    const id = `tvwidget_${++counterRef.current}`;

    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${id}" style="width:100%;height:100%;"></div>`;
    }

    function createWidget() {
      if (destroyed || !containerRef.current) return;
      if (typeof window.TradingView === "undefined") {
        setHasError(true);
        return;
      }
      try {
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: normSymbol(symbol),
          interval: tvInterval(timeframe),
          container_id: id,
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0a0a14",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          studies: [
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies",
            "BB@tv-basicstudies",
          ],
        });
        setHasError(false);
      } catch {
        setHasError(true);
      }
    }

    loadTradingViewScript(
      () => {
        if (!destroyed) createWidget();
      },
      () => {
        if (!destroyed) setHasError(true);
      },
    );

    return () => {
      destroyed = true;
      if (widgetRef.current?.remove) widgetRef.current.remove();
      widgetRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  if (hasError) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center rounded-lg"
        style={{
          background: "oklch(0.11 0.015 265)",
          border: "1px solid oklch(0.22 0.02 265)",
        }}
      >
        <div className="text-4xl mb-3">📈</div>
        <p className="text-sm text-muted-foreground text-center px-6">
          TradingView chart unavailable.
          <br />
          Check your network connection.
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-mono">
          {normSymbol(symbol)} · {timeframe}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 0 }}
      data-ocid="chart.canvas_target"
    />
  );
}
