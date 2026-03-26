import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

function hashStr(s: string): number {
  let h = 0;
  for (const c of s) {
    h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  }
  return h;
}

export interface IndicatorValues {
  rsi: number;
  macdLine: number;
  macdSignal: number;
  bbUpper: number;
  bbLower: number;
  bbMid: number;
  currentPrice: number;
  ema20: number;
  ema50: number;
  stoch: number;
  volumeAboveAvg: boolean;
  atr: number;
}

export function computeIndicators(
  symbol: string,
  timeframe: string,
): IndicatorValues {
  const seed1 = hashStr(symbol + timeframe);
  const seed2 = hashStr(symbol);
  const seed3 = hashStr(`${timeframe}${symbol}v2`);

  const basePrice = (seed2 % 50000) + 500;
  const priceNoise = ((seed3 % 400) - 200) / 10000;
  const currentPrice = basePrice * (1 + priceNoise);

  const rsi = 30 + (seed1 % 60);
  const macdLine = ((seed3 % 201) - 100) / 10;
  const macdSignal = macdLine * 0.85 + ((seed1 % 21) - 10) / 20;
  const bbMid = basePrice;
  const bbUpper = bbMid * (1 + 0.018 + (seed2 % 10) / 1000);
  const bbLower = bbMid * (1 - 0.018 - (seed2 % 10) / 1000);
  const ema20 = basePrice * (1 + ((seed1 % 101) - 50) / 5000);
  const ema50 = basePrice * (1 + ((seed3 % 81) - 40) / 5000);
  const stoch = seed1 % 101;
  const volumeAboveAvg = seed3 % 2 === 0;
  const atr = basePrice * (0.01 + (seed2 % 20) / 1000);

  return {
    rsi,
    macdLine,
    macdSignal,
    bbUpper,
    bbLower,
    bbMid,
    currentPrice,
    ema20,
    ema50,
    stoch,
    volumeAboveAvg,
    atr,
  };
}

type SignalType = "BUY" | "SELL" | "NEUTRAL";

interface IndicatorRow {
  name: string;
  value: string;
  signal: SignalType;
  detail?: string;
}

function buildRows(iv: IndicatorValues): IndicatorRow[] {
  const rsiSignal: SignalType =
    iv.rsi >= 70 ? "SELL" : iv.rsi <= 30 ? "BUY" : "NEUTRAL";
  const macdSignalType: SignalType =
    iv.macdLine > iv.macdSignal
      ? "BUY"
      : iv.macdLine < iv.macdSignal
        ? "SELL"
        : "NEUTRAL";
  const bbSignal: SignalType =
    iv.currentPrice > iv.bbUpper
      ? "SELL"
      : iv.currentPrice < iv.bbLower
        ? "BUY"
        : "NEUTRAL";
  const emaSignal: SignalType =
    iv.ema20 > iv.ema50 ? "BUY" : iv.ema20 < iv.ema50 ? "SELL" : "NEUTRAL";
  const stochSignal: SignalType =
    iv.stoch >= 80 ? "SELL" : iv.stoch <= 20 ? "BUY" : "NEUTRAL";
  const volSignal: SignalType = iv.volumeAboveAvg ? "BUY" : "NEUTRAL";

  const fmt = (n: number, d = 2) =>
    n >= 10000
      ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : n.toFixed(d);

  return [
    {
      name: "RSI (14)",
      value: iv.rsi.toFixed(1),
      signal: rsiSignal,
      detail:
        iv.rsi >= 70
          ? "Overbought"
          : iv.rsi <= 30
            ? "Oversold"
            : "Neutral zone",
    },
    {
      name: "MACD",
      value: `${iv.macdLine.toFixed(2)} / ${iv.macdSignal.toFixed(2)}`,
      signal: macdSignalType,
      detail:
        iv.macdLine > iv.macdSignal ? "Bullish crossover" : "Bearish crossover",
    },
    {
      name: "Bollinger Bands",
      value: `U:${fmt(iv.bbUpper)} L:${fmt(iv.bbLower)}`,
      signal: bbSignal,
      detail:
        iv.currentPrice > iv.bbUpper
          ? "Above upper band"
          : iv.currentPrice < iv.bbLower
            ? "Below lower band"
            : "Inside bands",
    },
    {
      name: "EMA 20/50",
      value: `${fmt(iv.ema20)} / ${fmt(iv.ema50)}`,
      signal: emaSignal,
      detail: iv.ema20 > iv.ema50 ? "Bullish trend" : "Bearish trend",
    },
    {
      name: "Stochastic",
      value: iv.stoch.toFixed(1),
      signal: stochSignal,
      detail:
        iv.stoch >= 80
          ? "Overbought"
          : iv.stoch <= 20
            ? "Oversold"
            : "Mid-range",
    },
    {
      name: "Volume",
      value: iv.volumeAboveAvg ? "Above Avg" : "Below Avg",
      signal: volSignal,
      detail: iv.volumeAboveAvg ? "Strong participation" : "Weak participation",
    },
    {
      name: "ATR (14)",
      value: fmt(iv.atr),
      signal: "NEUTRAL" as SignalType,
      detail: `Volatility: ${iv.atr > iv.currentPrice * 0.02 ? "High" : "Low"}`,
    },
  ];
}

const SIGNAL_STYLES: Record<
  SignalType,
  { bg: string; text: string; border: string; dot: string }
> = {
  BUY: {
    bg: "oklch(0.72 0.17 175 / 0.12)",
    text: "oklch(0.72 0.17 175)",
    border: "oklch(0.72 0.17 175 / 0.4)",
    dot: "oklch(0.72 0.17 175)",
  },
  SELL: {
    bg: "oklch(0.6 0.22 25 / 0.12)",
    text: "oklch(0.6 0.22 25)",
    border: "oklch(0.6 0.22 25 / 0.4)",
    dot: "oklch(0.6 0.22 25)",
  },
  NEUTRAL: {
    bg: "oklch(0.22 0.02 265 / 0.5)",
    text: "oklch(0.55 0.01 270)",
    border: "oklch(0.3 0.02 265 / 0.6)",
    dot: "oklch(0.45 0.015 265)",
  },
};

function countSignals(rows: IndicatorRow[]) {
  const buy = rows.filter((r) => r.signal === "BUY").length;
  const sell = rows.filter((r) => r.signal === "SELL").length;
  const neutral = rows.filter((r) => r.signal === "NEUTRAL").length;
  return { buy, sell, neutral };
}

interface Props {
  symbol: string;
  timeframe: string;
}

export default function IndicatorsPanel({ symbol, timeframe }: Props) {
  const iv = useMemo(
    () => computeIndicators(symbol, timeframe),
    [symbol, timeframe],
  );
  const rows = useMemo(() => buildRows(iv), [iv]);
  const counts = useMemo(() => countSignals(rows), [rows]);

  const consensusSignal: SignalType =
    counts.buy > counts.sell && counts.buy > counts.neutral
      ? "BUY"
      : counts.sell > counts.buy && counts.sell > counts.neutral
        ? "SELL"
        : "NEUTRAL";

  return (
    <Card
      className=""
      style={{
        background: "oklch(0.09 0.013 268)",
        border: "1px solid oklch(0.22 0.02 265)",
      }}
      data-ocid="indicators.panel"
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Activity
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.65 0.18 210)" }}
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Technical Indicators
          </span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span style={{ color: SIGNAL_STYLES.BUY.text }}>
              {counts.buy} BUY
            </span>
            <span style={{ color: SIGNAL_STYLES.SELL.text }}>
              {counts.sell} SELL
            </span>
            <span style={{ color: SIGNAL_STYLES.NEUTRAL.text }}>
              {counts.neutral} NTRL
            </span>
            <span
              className="px-2 py-0.5 rounded font-semibold font-mono text-xs"
              style={{
                background: SIGNAL_STYLES[consensusSignal].bg,
                color: SIGNAL_STYLES[consensusSignal].text,
                border: `1px solid ${SIGNAL_STYLES[consensusSignal].border}`,
              }}
            >
              {consensusSignal}
            </span>
          </div>
        </div>

        <AnimatePresence>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {rows.map((row, i) => {
              const s = SIGNAL_STYLES[row.signal];
              return (
                <motion.div
                  key={row.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-lg p-2.5 flex flex-col gap-1.5"
                  style={{
                    background: "oklch(0.13 0.015 265)",
                    border: `1px solid ${s.border}`,
                  }}
                  data-ocid={`indicators.${row.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.card`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-muted-foreground font-medium truncate">
                      {row.name}
                    </span>
                    <span
                      className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ background: s.dot }}
                    />
                  </div>
                  <p className="text-xs font-mono font-semibold text-foreground leading-tight">
                    {row.value}
                  </p>
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded self-start"
                    style={{
                      background: s.bg,
                      color: s.text,
                    }}
                    data-ocid={`indicators.${row.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.toggle`}
                  >
                    {row.signal}
                  </span>
                  {row.detail && (
                    <p
                      className="text-xs text-muted-foreground leading-tight"
                      style={{ fontSize: "10px" }}
                    >
                      {row.detail}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
