import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetProviderApiKey } from "../hooks/useQueries";

const AI_MODELS = [
  {
    id: "openai",
    name: "GPT-4o",
    provider: "OpenAI",
    color: "oklch(0.72 0.17 175)",
    placeholder: "sk-...",
  },
  {
    id: "anthropic",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    color: "oklch(0.65 0.18 210)",
    placeholder: "sk-ant-...",
  },
  {
    id: "google",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    color: "oklch(0.78 0.17 75)",
    placeholder: "AIza...",
  },
  {
    id: "xai",
    name: "Grok-2",
    provider: "xAI",
    color: "oklch(0.72 0.15 300)",
    placeholder: "xai-...",
  },
  {
    id: "groq",
    name: "Llama 3.1 70B",
    provider: "Groq",
    color: "oklch(0.7 0.18 30)",
    placeholder: "gsk_...",
  },
];

function ProviderTab({
  model,
  onSave,
}: {
  model: (typeof AI_MODELS)[0];
  onSave: (provider: string, key: string) => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: existing = "" } = useGetProviderApiKey(model.id);

  useEffect(() => {
    if (existing) setKey(existing);
  }, [existing]);

  const handleSave = async () => {
    if (!key.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    setSaving(true);
    try {
      await onSave(model.id, key.trim());
      toast.success(`${model.provider} API key saved`);
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 py-3">
      <div
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{
          background: `${model.color.replace(")", " / 0.08)")}`,
          border: `1px solid ${model.color.replace(")", " / 0.3)")}`,
        }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: model.color }}
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: model.color }}>
            {model.name}
          </p>
          <p className="text-xs text-muted-foreground">{model.provider}</p>
        </div>
        {existing && (
          <span className="ml-auto text-xs text-muted-foreground">
            ✓ Key set
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`key-${model.id}`}>{model.provider} API Key</Label>
        <div className="relative">
          <Input
            id={`key-${model.id}`}
            data-ocid={`apikey.${model.id}.input`}
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={model.placeholder}
            className="pr-10 font-mono text-sm"
            style={{
              background: "oklch(0.15 0.018 265)",
              borderColor: "oklch(0.22 0.02 265)",
            }}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Stored securely on the Internet Computer blockchain.
      </p>

      <Button
        onClick={handleSave}
        disabled={saving}
        data-ocid={`apikey.${model.id}.save_button`}
        className="w-full"
        style={{
          background: model.color,
          color: "oklch(0.08 0.012 270)",
        }}
      >
        {saving ? "Saving..." : `Save ${model.provider} Key`}
      </Button>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialProvider?: string;
  onSave: (provider: string, key: string) => Promise<void>;
}

export default function ApiKeyModal({
  open,
  onOpenChange,
  initialProvider = "openai",
  onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        style={{
          background: "oklch(0.11 0.015 265)",
          border: "1px solid oklch(0.22 0.02 265)",
        }}
        data-ocid="apikey.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 trade-green" />
            API Key Settings
          </DialogTitle>
          <DialogDescription>
            Configure API keys for the top 5 AI models. Set at least one key to
            enable chart analysis.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialProvider}>
          <TabsList className="w-full grid grid-cols-5 h-auto">
            {AI_MODELS.map((model) => (
              <TabsTrigger
                key={model.id}
                value={model.id}
                className="text-xs py-1.5 flex flex-col gap-0.5"
                data-ocid={`apikey.${model.id}.tab`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: model.color }}
                />
                <span className="hidden sm:block">{model.provider}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {AI_MODELS.map((model) => (
            <TabsContent key={model.id} value={model.id}>
              <ProviderTab model={model} onSave={onSave} />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
