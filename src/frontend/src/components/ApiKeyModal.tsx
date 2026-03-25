import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSaveApiKey } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingKey?: string;
  required?: boolean;
}

export default function ApiKeyModal({
  open,
  onOpenChange,
  existingKey,
  required,
}: Props) {
  const [key, setKey] = useState(existingKey ?? "");
  const [show, setShow] = useState(false);
  const { mutateAsync, isPending } = useSaveApiKey();

  useEffect(() => {
    if (existingKey) setKey(existingKey);
  }, [existingKey]);

  const handleSave = async () => {
    if (!key.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    try {
      await mutateAsync(key.trim());
      toast.success("API key saved securely");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save API key");
    }
  };

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onOpenChange}>
      <DialogContent
        className="max-w-md"
        style={{
          background: "oklch(0.11 0.015 265)",
          border: "1px solid oklch(0.22 0.02 265)",
        }}
        data-ocid="apikey.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 trade-green" />
            {required ? "Set Up API Key" : "API Key Settings"}
          </DialogTitle>
          <DialogDescription>
            {required
              ? "Enter your OpenAI API key to start analyzing charts with AI."
              : "Update your OpenAI API key. It is stored securely on the blockchain."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                data-ocid="apikey.input"
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-..."
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
            Your key is encrypted and stored on the Internet Computer. It is
            never exposed client-side.
          </p>
        </div>

        <DialogFooter>
          {!required && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="apikey.cancel_button"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isPending}
            data-ocid="apikey.save_button"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.17 175), oklch(0.65 0.18 210))",
              color: "oklch(0.08 0.012 270)",
            }}
          >
            {isPending ? "Saving..." : "Save Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
