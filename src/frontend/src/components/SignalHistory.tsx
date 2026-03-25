import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, ChevronUp, History } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useGetSignalHistory } from "../hooks/useQueries";

interface ParsedSignal {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  symbol: string;
  timeframe: string;
  timestamp: number;
}

const signalColor = {
  BUY: "oklch(0.72 0.17 175)",
  SELL: "oklch(0.6 0.22 25)",
  HOLD: "oklch(0.78 0.17 75)",
};

export default function SignalHistory() {
  const { data: history, isLoading } = useGetSignalHistory();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const parsed: ParsedSignal[] = (history ?? [])
    .map((s) => {
      try {
        return JSON.parse(s) as ParsedSignal;
      } catch {
        return null;
      }
    })
    .filter((s): s is ParsedSignal => s !== null)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  return (
    <Card
      className=""
      style={{
        background: "oklch(0.11 0.015 265)",
        border: "1px solid oklch(0.22 0.02 265)",
      }}
      data-ocid="history.panel"
    >
      <CardHeader
        className="pb-2 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="w-4 h-4 trade-green" />
          Signal History
          <Badge variant="outline" className="text-xs ml-1">
            {parsed.length}
          </Badge>
          <span className="ml-auto text-muted-foreground">
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </CardTitle>
      </CardHeader>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              {isLoading ? (
                <div
                  data-ocid="history.loading_state"
                  className="text-xs text-muted-foreground py-4 text-center"
                >
                  Loading history...
                </div>
              ) : parsed.length === 0 ? (
                <div
                  data-ocid="history.empty_state"
                  className="text-xs text-muted-foreground py-4 text-center"
                >
                  No signals saved yet. Analyze a chart and save your first
                  signal.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {parsed.map((sig, i) => {
                    const key = `${sig.symbol}-${sig.timestamp}-${i}`;
                    const color = signalColor[sig.signal] ?? signalColor.HOLD;
                    return (
                      <div
                        key={key}
                        data-ocid={`history.item.${i + 1}`}
                        className="rounded-lg overflow-hidden"
                        style={{
                          background: "oklch(0.15 0.018 265)",
                          border: "1px solid oklch(0.22 0.02 265)",
                        }}
                      >
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 p-3 hover:bg-accent/20 transition-colors text-left"
                          onClick={() =>
                            setExpanded(expanded === key ? null : key)
                          }
                        >
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                            style={{
                              background: `${color}22`,
                              color,
                              border: `1px solid ${color}44`,
                            }}
                          >
                            {sig.signal}
                          </span>
                          <span className="text-xs font-mono font-medium">
                            {sig.symbol}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {sig.timeframe}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {sig.confidence}% conf.
                          </span>
                          {expanded === key ? (
                            <ChevronUp className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>

                        <AnimatePresence>
                          {expanded === key && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 grid grid-cols-3 gap-2 text-xs">
                                {[
                                  { label: "Entry", value: sig.entryPrice },
                                  { label: "Target", value: sig.targetPrice },
                                  { label: "Stop Loss", value: sig.stopLoss },
                                ].map((item) => (
                                  <div key={item.label}>
                                    <p className="text-muted-foreground">
                                      {item.label}
                                    </p>
                                    <p className="font-mono font-semibold">
                                      {item.value?.toLocaleString?.() ?? "—"}
                                    </p>
                                  </div>
                                ))}
                                {sig.reasoning && (
                                  <div className="col-span-3 mt-1">
                                    <p className="text-muted-foreground leading-relaxed">
                                      {sig.reasoning}
                                    </p>
                                  </div>
                                )}
                                {sig.timestamp && (
                                  <div className="col-span-3 text-muted-foreground/60">
                                    {new Date(sig.timestamp).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
