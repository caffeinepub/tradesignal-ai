import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, MessageSquare, Send, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useChatWithAI } from "../hooks/useQueries";
import type { SignalResult } from "./SignalPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  apiKey: string;
  selectedModel: string;
  lastSignal: SignalResult | null;
  symbol: string;
}

const QUICK_QUESTIONS = [
  "What's the risk on this trade?",
  "When should I enter?",
  "What are alternative scenarios?",
  "How strong is this signal?",
];

export default function ChatPanel({
  apiKey,
  selectedModel,
  lastSignal,
  symbol,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const { mutateAsync, isPending } = useChatWithAI();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildSystemContext = () => {
    if (!lastSignal)
      return "You are a professional trading assistant. Help traders make informed decisions.";
    return `You are a professional trading assistant. The latest analysis for ${symbol} shows:
- Signal: ${lastSignal.signal}
- Confidence: ${lastSignal.confidence}%
- Entry Price: ${lastSignal.entryPrice}
- Target Price: ${lastSignal.targetPrice}
- Stop Loss: ${lastSignal.stopLoss}
- Reasoning: ${lastSignal.reasoning}

Help the trader understand this analysis and answer questions about risk, entry timing, and strategy.`;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isPending) return;
    if (!apiKey) {
      toast.error("Please set an API key in Settings");
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content.trim(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    const payload = [
      { role: "system", content: buildSystemContext() },
      ...updatedMessages.map(({ role, content: c }) => ({ role, content: c })),
    ];

    try {
      const response = await mutateAsync({
        messages: JSON.stringify(payload),
        provider: selectedModel,
        apiKey,
      });
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: response },
      ]);
    } catch {
      toast.error("Failed to get AI response");
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Card
      className="flex flex-col h-full"
      style={{
        background: "oklch(0.11 0.015 265)",
        border: "1px solid oklch(0.22 0.02 265)",
      }}
      data-ocid="chat.panel"
    >
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 trade-green" />
          AI Trading Chat
          {lastSignal && (
            <span className="text-xs text-muted-foreground ml-auto">
              {symbol} · {lastSignal.signal}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 pb-3">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
          {messages.length === 0 ? (
            <div
              data-ocid="chat.empty_state"
              className="flex flex-col items-center justify-center h-24 text-center"
            >
              <Bot className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Ask me anything about trading analysis
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  data-ocid={`chat.message.${i + 1}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "oklch(0.72 0.17 175 / 0.15)" }}
                    >
                      <Bot className="w-3 h-3 trade-green" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-3 py-2 text-xs max-w-[85%] leading-relaxed ${
                      msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                    }`}
                    style={
                      msg.role === "user"
                        ? {
                            background: "oklch(0.72 0.17 175)",
                            color: "oklch(0.08 0.012 270)",
                          }
                        : {
                            background: "oklch(0.15 0.018 265)",
                            border: "1px solid oklch(0.22 0.02 265)",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "oklch(0.65 0.18 210 / 0.2)" }}
                    >
                      <User className="w-3 h-3 trade-blue" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isPending && (
            <div className="flex gap-2" data-ocid="chat.loading_state">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.72 0.17 175 / 0.15)" }}
              >
                <Bot className="w-3 h-3 trade-green" />
              </div>
              <div
                className="rounded-xl px-3 py-2 text-xs"
                style={{
                  background: "oklch(0.15 0.018 265)",
                  border: "1px solid oklch(0.22 0.02 265)",
                }}
              >
                <Loader2 className="w-3 h-3 animate-spin trade-green" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick questions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1 shrink-0">
            {QUICK_QUESTIONS.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                style={{
                  background: "oklch(0.15 0.018 265)",
                  border: "1px solid oklch(0.22 0.02 265)",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <Textarea
            data-ocid="chat.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this trade..."
            rows={2}
            className="resize-none text-xs"
            style={{
              background: "oklch(0.15 0.018 265)",
              borderColor: "oklch(0.22 0.02 265)",
            }}
          />
          <Button
            type="button"
            data-ocid="chat.send.button"
            onClick={() => sendMessage(input)}
            disabled={isPending || !input.trim()}
            size="icon"
            className="h-auto"
            style={{
              background: "oklch(0.72 0.17 175)",
              color: "oklch(0.08 0.012 270)",
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
