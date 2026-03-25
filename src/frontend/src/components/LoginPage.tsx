import { Button } from "@/components/ui/button";
import { Activity, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const features = [
    {
      icon: Activity,
      label: "Multi-AI Analysis",
      desc: "GPT-4 powered chart signals",
    },
    {
      icon: TrendingUp,
      label: "Real-time Signals",
      desc: "BUY / SELL / HOLD with confidence",
    },
    { icon: Zap, label: "Instant Insights", desc: "MACD, RSI, MA indicators" },
    { icon: Shield, label: "Secure Storage", desc: "Signals saved on-chain" },
  ];

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl"
        style={{ background: "oklch(0.72 0.17 175)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(0.72 0.17 175 / 0.15)",
              border: "1px solid oklch(0.72 0.17 175 / 0.4)",
            }}
          >
            <TrendingUp className="w-7 h-7 trade-green" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Trade<span className="trade-green">Signal</span> AI
          </h1>
        </div>

        <p className="text-lg text-muted-foreground mb-2">
          Professional AI-powered trading analysis
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          Leverage GPT-4 and advanced indicators to get real-time BUY/SELL
          signals for crypto, forex, and stocks.
        </p>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className="rounded-lg p-4 text-left flex gap-3 items-start"
              style={{
                background: "oklch(0.11 0.015 265)",
                border: "1px solid oklch(0.22 0.02 265)",
              }}
            >
              <f.icon className="w-5 h-5 trade-green mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          data-ocid="login.primary_button"
          onClick={() => login()}
          disabled={isLoggingIn}
          size="lg"
          className="px-10 py-6 text-base font-semibold rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.17 175), oklch(0.65 0.18 210))",
            color: "oklch(0.08 0.012 270)",
          }}
        >
          {isLoggingIn ? "Connecting..." : "Connect with Internet Identity"}
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Secured by Internet Computer blockchain
        </p>
      </motion.div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
