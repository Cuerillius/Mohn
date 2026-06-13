import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isTauri } from "@/lib/platform";
import { fetchTorboxPlan } from "@/services/torbox";
import { apiPatch } from "@/services/api";
import { keys } from "@/lib/queryKeys";

export const PLAN_LABELS: Record<number, string> = {
  0: "Free",
  1: "Essential",
  2: "Pro",
  3: "Standard",
};

export function openExternal(url: string) {
  if (isTauri) {
    import("@tauri-apps/plugin-opener").then(({ openUrl }) => openUrl(url));
  } else {
    window.open(url, "_blank", "noopener");
  }
}

export function TorboxInfo() {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      Mohn relies on <span className="text-foreground font-medium">TorBox</span>{" "}
      to stream torrents instantly at full speed, no downloading, no waiting for
      peers. By connecting your key, you bypass public peer-to-peer limitations
      completely.
    </p>
  );
}

export function TorboxKeySection({
  torboxKey,
  onSave,
  onRemove,
}: {
  torboxKey: string;
  onSave: (key: string) => void;
  onRemove: () => void;
}) {
  const queryClient = useQueryClient();
  const [keyDraft, setKeyDraft] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(!!torboxKey);

  const { data: plan = null, isLoading: fetchingPlan } = useQuery({
    queryKey: keys.torboxPlan(),
    queryFn: fetchTorboxPlan,
    enabled: !!torboxKey && verified,
    retry: false,
  });

  const handleVerify = async () => {
    const key = keyDraft.trim();
    if (!key) return;
    setVerifying(true);
    setError("");
    try {
      await apiPatch("/api/settings", { torboxKey: key });
      onSave(key);
      setVerified(true);
      queryClient.invalidateQueries({ queryKey: keys.torboxPlan() });
    } catch {
      setError("Invalid API key. Couldn't verify with TorBox.");
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    queryClient.removeQueries({ queryKey: keys.torboxPlan() });
    setKeyDraft("");
    setError("");
    setVerified(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Paste your TorBox API key here..."
            value={verified ? "placeholder-encrypted" : keyDraft}
            readOnly={verified}
            onChange={(e) => {
              setKeyDraft(e.target.value);
              setVerified(false);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !verified) handleVerify();
            }}
            className={cn(
              "text-sm",
              verified && "text-muted-foreground cursor-default select-none",
            )}
            autoComplete="off"
          />
          {verified ? (
            <Button
              variant="secondary"
              onClick={handleRemove}
              className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
            >
              Remove
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={!keyDraft.trim() || verifying}
              onClick={handleVerify}
            >
              {verifying ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
            </Button>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
        {!verified && (
          <div className="flex flex-col gap-2 pt-1">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              onClick={() =>
                openExternal(
                  "https://www.torbox.app/subscription?referral=1255f72c-84de-4d54-bfb1-7860af4bb703",
                )
              }
            >
              Purchase TorBox
            </Button>
            <button
              type="button"
              onClick={() =>
                openExternal("https://www.torbox.app/settings?section=account")
              }
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors self-center"
            >
              Already have an account? Get your key
            </button>
          </div>
        )}
        {verified && !fetchingPlan && plan !== null && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            Verified on the{" "}
            <Badge className="text-xs bg-emerald-500 text-foreground">
              {PLAN_LABELS[plan]}
            </Badge>{" "}
            plan
          </p>
        )}
        {verified && fetchingPlan && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin shrink-0" />
            Checking plan…
          </p>
        )}
      </div>
    </div>
  );
}
