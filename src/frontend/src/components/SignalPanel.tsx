import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Save, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveSignal } from "../hooks/useQueries";

export interface SignalResult {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
}

interface Props {
  result: SignalResult | null;
  symbol: string;
  timeframe: string;
}

function CircularProgress({ value, color }: { value: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="90" height="90" className="-rotate-90" aria-hidden="true">
      <circle
        cx="45"
        cy="45"
        r={r}
        fill="none"
        strokeWidth="6"
        stroke="oklch(0.22 0.02 265)"
      />
      <circle
        cx="45"
        cy="45"
        r={r}
        fill="none"
        strokeWidth="6"
        stroke={color}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

export default function SignalPanel({ result, symbol, timeframe }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { mutateAsync: saveSignal, isPending: isSaving } = useSaveSignal();

  const signalColors = {
    BUY: {
      color: "oklch(0.72 0.17 175)",
      css: "trade-green",
      glow: "glow-green",
    },
    SELL: { color: "oklch(0.6 0.22 25)", css: "trade-red", glow: "glow-red" },
    HOLD: {
      color: "oklch(0.78 0.17 75)",
      css: "trade-amber",
      glow: "glow-amber",
    },
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await saveSignal(
        JSON.stringify({ ...result, symbol, timeframe, timestamp: Date.now() }),
      );
      toast.success("Signal saved to history");
    } catch {
      toast.error("Failed to save signal");
    }
  };

  const rr = result
    ? Math.abs(result.targetPrice - result.entryPrice) /
      Math.abs(result.entryPrice - result.stopLoss)
    : null;

  return (
    <Card
      className="flex flex-col h-full"
      style={{
        background: "oklch(0.11 0.015 265)",
        border: "1px solid oklch(0.22 0.02 265)",
      }}
      data-ocid="signal.panel"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 trade-green" />
          Signal Result
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
        {!result ? (
          <div
            data-ocid="signal.empty_state"
            className="flex flex-col items-center justify-center h-40 text-center"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ background: "oklch(0.15 0.018 265)" }}
            >
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Enter market data and click
              <br />
              "Analyze with AI" to get signals
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={result.signal + result.confidence}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Signal badge + confidence */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Badge
                    data-ocid="signal.type.badge"
                    className={`text-2xl font-bold px-6 py-3 rounded-xl ${signalColors[result.signal].glow}`}
                    style={{
                      background: `${signalColors[result.signal].color}22`,
                      color: signalColors[result.signal].color,
                      border: `1px solid ${signalColors[result.signal].color}66`,
                    }}
                  >
                    {result.signal}
                  </Badge>
                  <p className="text-xs text-muted-foreground pl-1">
                    {symbol} · {timeframe}
                  </p>
                </div>
                <div className="relative flex items-center justify-center">
                  <CircularProgress
                    value={result.confidence}
                    color={signalColors[result.signal].color}
                  />
                  <div className="absolute text-center">
                    <p
                      className="text-lg font-bold font-mono"
                      style={{ color: signalColors[result.signal].color }}
                    >
                      {result.confidence}%
                    </p>
                    <p className="text-xs text-muted-foreground">conf.</p>
                  </div>
                </div>
              </div>

              {/* Price cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Entry",
                    value: result.entryPrice,
                    color: "oklch(0.65 0.18 210)",
                  },
                  {
                    label: "Target",
                    value: result.targetPrice,
                    color: "oklch(0.72 0.17 175)",
                  },
                  {
                    label: "Stop Loss",
                    value: result.stopLoss,
                    color: "oklch(0.6 0.22 25)",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg p-3 text-center"
                    style={{
                      background: "oklch(0.15 0.018 265)",
                      border: `1px solid ${item.color}33`,
                    }}
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.label}
                    </p>
                    <p
                      className="text-sm font-mono font-bold"
                      style={{ color: item.color }}
                    >
                      {item.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </p>
                  </div>
                ))}
              </div>

              {/* R/R ratio */}
              {rr !== null && !Number.isNaN(rr) && Number.isFinite(rr) && (
                <div
                  className="rounded-lg p-3 flex items-center justify-between"
                  style={{
                    background: "oklch(0.15 0.018 265)",
                    border: "1px solid oklch(0.22 0.02 265)",
                  }}
                >
                  <span className="text-xs text-muted-foreground">
                    Risk / Reward Ratio
                  </span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      rr >= 2
                        ? "trade-green"
                        : rr >= 1.5
                          ? "trade-amber"
                          : "trade-red"
                    }`}
                  >
                    1 : {rr.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Reasoning */}
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  background: "oklch(0.15 0.018 265)",
                  border: "1px solid oklch(0.22 0.02 265)",
                }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-accent/30 transition-colors"
                  onClick={() => setExpanded(!expanded)}
                  data-ocid="signal.reasoning.toggle"
                >
                  AI Reasoning
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-muted-foreground p-3 pt-0 leading-relaxed">
                        {result.reasoning}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                type="button"
                data-ocid="signal.save.button"
                onClick={handleSave}
                disabled={isSaving}
                variant="outline"
                className="w-full"
                style={{ borderColor: "oklch(0.22 0.02 265)" }}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Signal"}
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
