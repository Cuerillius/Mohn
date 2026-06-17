import { useSettings } from "@/context/SettingsContext";
import { TorboxInfo, TorboxKeySection } from "./TorboxKey";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "./ui/button";
import { AddonManager } from "./Addon";
import { ProfileManager } from "./ProfileManager";

export function StepTorBox({ onNext }: { onNext: () => void }) {
  const { torboxKeySet, setTorboxKey } = useSettings();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 mb-1">
          <img
            src="/torbox.png"
            alt="TorBox"
            className="size-9 rounded-xl object-contain shrink-0"
          />
          <h2 className="text-xl font-semibold tracking-tight">
            Connect TorBox
          </h2>
        </div>
        <TorboxInfo />
      </div>

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {[
          "Pre-cached torrents start playing immediately",
          "Enjoy smooth streaming directly from TorBox's servers",
          "Effortlessly stream high-bitrate files that normally struggle on standard clients",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check className="size-3.5 mt-0.5 shrink-0 text-foreground/40" />
            {item}
          </li>
        ))}
      </ul>

      <TorboxKeySection
        torboxKeySet={torboxKeySet}
        onSave={setTorboxKey}
        onRemove={() => setTorboxKey("")}
      />

      <div className="flex justify-end pt-1">
        <div className="flex items-center gap-3">
          {!torboxKeySet && (
            <button
              onClick={onNext}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Skip for now
            </button>
          )}
          <Button onClick={onNext} disabled={!torboxKeySet} className="gap-2">
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StepAddons({ onNext }: { onNext: () => void }) {
  const { addonUrls, addAddonUrl, removeAddonUrl } = useSettings();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Add Addons</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mohn uses{" "}
          <span className="text-foreground font-medium">Stremio addons</span> to
          source your content. Without at least one, Mohn won't find anything to
          stream.
        </p>
      </div>

      <AddonManager
        simple
        addonUrls={addonUrls}
        onAdd={addAddonUrl}
        onRemove={removeAddonUrl}
      />

      <div className="flex justify-end pt-1">
        <div className="flex items-center gap-3">
          {addonUrls.length === 0 && (
            <button
              onClick={onNext}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Skip for now
            </button>
          )}
          <Button
            onClick={onNext}
            disabled={addonUrls.length === 0}
            className="gap-2"
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StepProfiles({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight">
          Set up profiles
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Profiles let everyone keep their own watch history, continue-watching
          list, and recommendations, all under one account.
        </p>
      </div>

      <ProfileManager simple />

      <p className="text-xs text-muted-foreground/50">
        You can rename or add more profiles any time in Settings.
      </p>

      <div className="flex justify-end pt-1">
        <Button onClick={onFinish} className="gap-2">
          Finish setup <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
