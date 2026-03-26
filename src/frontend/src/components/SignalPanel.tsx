import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Save, Target, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveSignal } from "../hooks/useQueries";

export interface SignalResult {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  entry?: number;
  entryPrice?: number;
  target1?: number;
  target2?: number;
  targetPrice?: number;
  stopLoss: number;
  reasoning: string;
  indicatorConsensus?: string;
}

interface Props {
  result: SignalResult | null;
  symbol: string;
  timeframe: string;
  isLoading?: boolean;
}

function CircularProgress({ value, color }: { value: number; color: string }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="80" height="80" className="-rotate-90" aria-hidden="true">
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="5"
        stroke="oklch(0.22 0.02 265)"
      />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="5"
        stroke={color}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

const SIGNAL_CONFIG = {
  BUY: {
    color: "oklch(0.72 0.17 175)",
    glow: "0 0 20px oklch(0.72 0.17 175 / 0.35)",
    label: "BUY",
  },
  SELL: {
    color: "oklch(0.6 0.22 25)",
    glow: "0 0 20px oklch(0.6 0.22 25 / 0.35)",
    label: "SELL",
  },
  HOLD: {
    color: "oklch(0.78 0.17 75)",
    glow: "0 0 20px oklch(0.78 0.17 75 / 0.35)",
    label: "HOLD",
  },
};

export default function SignalPanel({
  result,
  symbol,
  timeframe,
  isLoading,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { mutateAsync: saveSignal, isPending: isSaving } = useSaveSignal();

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

  const entryVal = result ? (result.entry ?? result.entryPrice ?? 0) : 0;
  const t1Val = result ? (result.target1 ?? result.targetPrice ?? 0) : 0;
  const t2Val = result ? (result.target2 ?? (t1Val ? t1Val * 1.02 : 0)) : 0;
  const slVal = result ? result.stopLoss : 0;

  const rr =
    entryVal && slVal && t1Val
      ? Math.abs(t1Val - entryVal) / Math.abs(entryVal - slVal)
      : null;

  return (
    <Card
      className="flex flex-col h-full"
      style={{
        background: "oklch(0.09 0.013 268)",
        border: "1px solid oklch(0.22 0.02 265)",
      }}
      data-ocid="signal.panel"
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs flex items-center gap-2">
          <Target
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.72 0.17 175)" }}
          />
          <span className="uppercase tracking-wider text-muted-foreground">
            AI Signal
          </span>
          {result && (
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              {symbol} · {timeframe}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 pt-0">
        {isLoading ? (
          <div
            data-ocid="signal.loading_state"
            className="flex flex-col items-center justify-center h-48 gap-3"
          >
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "oklch(0.72 0.17 175)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-xs text-muted-foreground animate-pulse-slow">
              AI analyzing market data...
            </p>
          </div>
        ) : !result ? (
          <div
            data-ocid="signal.empty_state"
            className="flex flex-col items-center justify-center h-48 text-center gap-3"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.15 0.018 265)",
                border: "1px solid oklch(0.22 0.02 265)",
              }}
            >
              <Zap className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-foreground font-medium mb-1">
                No signal yet
              </p>
              <p className="text-xs text-muted-foreground">
                Click Analyze to get AI trading signals
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={result.signal + result.confidence}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Big signal badge */}
              <div
                className="rounded-xl p-4 flex items-center justify-between"
                style={{
                  background: `${SIGNAL_CONFIG[result.signal].color.replace(")", " / 0.08)")}`,
                  border: `1px solid ${SIGNAL_CONFIG[result.signal].color.replace(")", " / 0.3)")}`,
                  boxShadow: SIGNAL_CONFIG[result.signal].glow,
                }}
              >
                <div>
                  <Badge
                    data-ocid="signal.type.badge"
                    className="text-3xl font-extrabold px-5 py-2 rounded-xl mb-1"
                    style={{
                      background: `${SIGNAL_CONFIG[result.signal].color.replace(")", " / 0.15)")}`,
                      color: SIGNAL_CONFIG[result.signal].color,
                      border: `1px solid ${SIGNAL_CONFIG[result.signal].color.replace(")", " / 0.5)")}`,
                    }}
                  >
                    {result.signal}
                  </Badge>
                  <p className="text-xs text-muted-foreground pl-1 mt-1">
                    {symbol} · {timeframe}
                  </p>
                </div>
                <div className="relative flex items-center justify-center">
                  <CircularProgress
                    value={result.confidence}
                    color={SIGNAL_CONFIG[result.signal].color}
                  />
                  <div className="absolute text-center">
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: SIGNAL_CONFIG[result.signal].color }}
                    >
                      {result.confidence}%
                    </p>
                    <p
                      className="text-xs text-muted-foreground"
                      style={{ fontSize: "9px" }}
                    >
                      CONF
                    </p>
                  </div>
                </div>
              </div>

              {/* Entry Zone (Shop Entry) */}
              <div
                className="rounded-lg p-3"
                style={{
                  background: "oklch(0.13 0.015 265)",
                  border: "1px solid oklch(0.65 0.18 210 / 0.4)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Shop Entry / Entry Zone
                    </p>
                    <p
                      className="text-lg font-mono font-bold"
                      style={{ color: "oklch(0.65 0.18 210)" }}
                    >
                      {entryVal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "oklch(0.65 0.18 210 / 0.15)" }}
                  >
                    <Target
                      className="w-4 h-4"
                      style={{ color: "oklch(0.65 0.18 210)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Targets + Stop Loss */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Target 1",
                    value: t1Val,
                    color: "oklch(0.72 0.17 175)",
                  },
                  {
                    label: "Target 2",
                    value: t2Val,
                    color: "oklch(0.68 0.18 145)",
                  },
                  {
                    label: "Stop Loss",
                    value: slVal,
                    color: "oklch(0.6 0.22 25)",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg p-2.5 text-center"
                    style={{
                      background: "oklch(0.13 0.015 265)",
                      border: `1px solid ${item.color.replace(")", " / 0.3)")}`,
                    }}
                  >
                    <p
                      className="text-xs text-muted-foreground mb-1"
                      style={{ fontSize: "10px" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-xs font-mono font-bold"
                      style={{ color: item.color }}
                    >
                      {item.value
                        ? item.value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })
                        : "—"}
                    </p>
                  </div>
                ))}
              </div>

              {/* R/R */}
              {rr !== null && !Number.isNaN(rr) && Number.isFinite(rr) && (
                <div
                  className="rounded-lg p-2.5 flex items-center justify-between"
                  style={{
                    background: "oklch(0.13 0.015 265)",
                    border: "1px solid oklch(0.22 0.02 265)",
                  }}
                >
                  <span className="text-xs text-muted-foreground">
                    Risk / Reward
                  </span>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{
                      color:
                        rr >= 2
                          ? "oklch(0.72 0.17 175)"
                          : rr >= 1.5
                            ? "oklch(0.78 0.17 75)"
                            : "oklch(0.6 0.22 25)",
                    }}
                  >
                    1 : {rr.toFixed(2)}
                  </span>
                </div>
              )}

              {/* AI Reasoning */}
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  background: "oklch(0.13 0.015 265)",
                  border: "1px solid oklch(0.22 0.02 265)",
                }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-2.5 text-xs font-medium hover:bg-accent/30 transition-colors"
                  onClick={() => setExpanded(!expanded)}
                  data-ocid="signal.reasoning.toggle"
                >
                  <span>AI Reasoning</span>
                  {expanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
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
                      <p className="text-xs text-muted-foreground p-2.5 pt-0 leading-relaxed">
                        {result.reasoning}
                      </p>
                      {result.indicatorConsensus && (
                        <p className="text-xs text-muted-foreground px-2.5 pb-2.5 leading-relaxed border-t border-border pt-2">
                          <span className="text-foreground font-medium">
                            Indicators:{" "}
                          </span>
                          {result.indicatorConsensus}
                        </p>
                      )}
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
                className="w-full text-xs"
                style={{ borderColor: "oklch(0.22 0.02 265)", height: "32px" }}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? "Saving..." : "Save Signal"}
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
