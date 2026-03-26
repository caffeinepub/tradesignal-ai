import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings, TrendingUp } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  color: string;
}

interface Props {
  selectedModel: ModelInfo;
  onSettings: () => void;
}

export default function Navbar({ selectedModel, onSettings }: Props) {
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
        <span className="font-bold text-sm tracking-tight">
          Trade<span className="trade-green">Signal</span> AI
        </span>
      </div>

      {/* Active AI model badge */}
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
        data-ocid="navbar.active_model.badge"
        style={{
          background: `${selectedModel.color.replace(")", " / 0.12)")}`,
          border: `1px solid ${selectedModel.color.replace(")", " / 0.35)")}`,
          color: selectedModel.color,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: selectedModel.color }}
        />
        {selectedModel.name}
        <span className="text-muted-foreground">·</span>
        <span style={{ color: "oklch(0.65 0.01 270)" }}>
          {selectedModel.provider}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
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
