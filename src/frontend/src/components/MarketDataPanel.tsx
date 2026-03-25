import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BarChart2, Loader2 } from "lucide-react";
import { useState } from "react";

export interface MarketData {
  price: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  rsi: number;
  macdValue: string;
  macdSignal: string;
  ma50: string;
  ma200: string;
}

interface Props {
  onAnalyze: (data: MarketData) => void;
  isLoading: boolean;
  symbol: string;
  timeframe: string;
}

const defaultData: MarketData = {
  price: "",
  open: "",
  high: "",
  low: "",
  close: "",
  volume: "",
  rsi: 50,
  macdValue: "",
  macdSignal: "",
  ma50: "",
  ma200: "",
};

export default function MarketDataPanel({
  onAnalyze,
  isLoading,
  symbol,
  timeframe,
}: Props) {
  const [data, setData] = useState<MarketData>(defaultData);

  const set =
    (key: keyof MarketData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setData((prev) => ({ ...prev, [key]: e.target.value }));

  const inputStyle = {
    background: "oklch(0.15 0.018 265)",
    borderColor: "oklch(0.22 0.02 265)",
  };

  const getRsiColor = () => {
    if (data.rsi >= 70) return "oklch(0.6 0.22 25)";
    if (data.rsi <= 30) return "oklch(0.72 0.17 175)";
    return "oklch(0.78 0.17 75)";
  };

  return (
    <Card
      className="flex flex-col h-full"
      style={{
        background: "oklch(0.11 0.015 265)",
        border: "1px solid oklch(0.22 0.02 265)",
      }}
      data-ocid="market.panel"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart2 className="w-4 h-4 trade-green" />
          Market Data — <span className="font-mono trade-green">{symbol}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {timeframe}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin space-y-4">
        {/* Price */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Current Price</Label>
          <Input
            data-ocid="market.price.input"
            value={data.price}
            onChange={set("price")}
            placeholder="0.00"
            type="number"
            className="font-mono text-sm"
            style={inputStyle}
          />
        </div>

        {/* OHLC grid */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            OHLC
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(["open", "high", "low", "close"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs text-muted-foreground capitalize">
                  {field}
                </Label>
                <Input
                  data-ocid={`market.${field}.input`}
                  value={data[field]}
                  onChange={set(field)}
                  placeholder="0.00"
                  type="number"
                  className="font-mono text-xs"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Volume</Label>
          <Input
            data-ocid="market.volume.input"
            value={data.volume}
            onChange={set("volume")}
            placeholder="0"
            type="number"
            className="font-mono text-sm"
            style={inputStyle}
          />
        </div>

        {/* RSI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">RSI (14)</Label>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: getRsiColor() }}
            >
              {data.rsi}
            </span>
          </div>
          <Slider
            data-ocid="market.rsi.input"
            min={0}
            max={100}
            step={1}
            value={[data.rsi]}
            onValueChange={([v]) => setData((prev) => ({ ...prev, rsi: v }))}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>

        {/* MACD */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            MACD
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                data-ocid="market.macd.input"
                value={data.macdValue}
                onChange={set("macdValue")}
                placeholder="0.00"
                type="number"
                className="font-mono text-xs"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Signal</Label>
              <Input
                data-ocid="market.macdsignal.input"
                value={data.macdSignal}
                onChange={set("macdSignal")}
                placeholder="0.00"
                type="number"
                className="font-mono text-xs"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            Moving Averages
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">MA 50</Label>
              <Input
                data-ocid="market.ma50.input"
                value={data.ma50}
                onChange={set("ma50")}
                placeholder="0.00"
                type="number"
                className="font-mono text-xs"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">MA 200</Label>
              <Input
                data-ocid="market.ma200.input"
                value={data.ma200}
                onChange={set("ma200")}
                placeholder="0.00"
                type="number"
                className="font-mono text-xs"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Analyze button */}
        <Button
          data-ocid="market.analyze.primary_button"
          onClick={() => onAnalyze(data)}
          disabled={isLoading}
          className="w-full font-semibold py-5"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.17 175), oklch(0.65 0.18 210))",
            color: "oklch(0.08 0.012 270)",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze with AI"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
