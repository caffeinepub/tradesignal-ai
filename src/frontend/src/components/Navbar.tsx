import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings, TrendingUp } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const TIMEFRAMES = ["1H", "4H", "1D", "1W"];
const SYMBOLS = ["BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "TSLA", "EUR/USD"];

interface Props {
  symbol: string;
  setSymbol: (s: string) => void;
  timeframe: string;
  setTimeframe: (t: string) => void;
  onSettings: () => void;
}

export default function Navbar({
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  onSettings,
}: Props) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : "";

  return (
    <header className="h-14 flex items-center gap-4 px-4 border-b border-border bg-card shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: "oklch(0.72 0.17 175 / 0.15)",
            border: "1px solid oklch(0.72 0.17 175 / 0.4)",
          }}
        >
          <TrendingUp className="w-4 h-4 trade-green" />
        </div>
        <span className="font-bold text-sm tracking-tight hidden sm:block">
          Trade<span className="trade-green">Signal</span> AI
        </span>
      </div>

      {/* Symbol selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin">
        {SYMBOLS.map((s) => (
          <button
            type="button"
            key={s}
            data-ocid={`navbar.${s.replace("/", "").toLowerCase()}.button`}
            onClick={() => setSymbol(s)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              symbol === s
                ? "text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={symbol === s ? { background: "oklch(0.72 0.17 175)" } : {}}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Timeframe pills */}
      <div className="flex gap-1 ml-auto">
        {TIMEFRAMES.map((tf) => (
          <button
            type="button"
            key={tf}
            data-ocid={`navbar.${tf.toLowerCase()}.tab`}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
              timeframe === tf
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-mono hidden md:flex">
          {shortPrincipal}
        </Badge>
        <Button
          size="icon"
          variant="ghost"
          onClick={onSettings}
          data-ocid="navbar.settings.button"
          className="w-8 h-8"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleLogout}
          data-ocid="navbar.logout.button"
          className="w-8 h-8"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
