import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Loader2,
  Plus,
  AlertCircle,
  Settings2,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSortable } from "@dnd-kit/sortable";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { keys } from "@/lib/queryKeys";

export interface AddonManifest {
  name: string;
  description?: string;
  logo?: string;
  version?: string;
  behaviorHints?: { configurable?: boolean };
  resources?: (string | { name: string })[];
}

// ── Single row ────────────────────────────────────────────────────────────────

export default function SortableAddonRow({
  url,
  meta,
  enabled,
  onToggle,
  onRemove,
  simple = false,
}: {
  url: string;
  meta: AddonManifest | null;
  enabled: boolean;
  onToggle: () => void;
  onRemove: () => void;
  simple?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url, disabled: simple });
  const name = meta?.name ?? new URL(url).hostname;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-background transition-opacity",
        simple ? "px-3 py-2.5" : "px-4 py-3.5",
        !enabled && "opacity-45",
        isDragging && "shadow-lg opacity-80 z-10",
      )}
    >
      {!simple && (
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      )}

      {meta?.logo ? (
        <img
          src={meta.logo}
          alt={name}
          className={cn(
            "rounded-lg object-contain shrink-0 border border-border/40",
            simple ? "size-7 rounded-md" : "size-9",
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-lg bg-muted flex items-center justify-center font-medium text-muted-foreground shrink-0",
            simple ? "size-7 rounded-md text-xs" : "size-9 text-sm",
          )}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <p className="text-sm font-medium truncate">{name}</p>
          {meta?.version && (
            <span className="text-[11px] text-muted-foreground/60 shrink-0">
              v{meta.version}
            </span>
          )}
        </div>
        {!simple && meta?.description && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            {meta.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {simple ? (
          <>
            <CheckCircle2 className="size-4 text-emerald-500" />
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={onRemove}
              aria-label="Remove"
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground hover:bg-background transition-all"
              onClick={() => {}}
              aria-label="Configure"
            >
              <Settings2 className="size-3.5" />
            </Button>
            <Switch checked={enabled} onCheckedChange={onToggle} />
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={onRemove}
              aria-label="Remove"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Manager (list + add input) ────────────────────────────────────────────────

export function AddonManager({
  addonUrls,
  inactiveAddonUrls = [],
  onAdd,
  onRemove,
  onToggle,
  onReorder,
  simple = false,
}: {
  addonUrls: string[];
  inactiveAddonUrls?: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  onToggle?: (url: string) => void;
  onReorder?: (urls: string[]) => void;
  simple?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [addUrl, setAddUrl] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const manifestResults = useQueries({
    queries: addonUrls.map((url) => ({
      queryKey: keys.addonManifest(url),
      queryFn: async (): Promise<AddonManifest> => {
        const res = await fetch(`${url}/manifest.json`);
        if (!res.ok) throw new Error(`Failed to fetch manifest (${res.status})`);
        return res.json() as Promise<AddonManifest>;
      },
      retry: false,
      staleTime: 10 * 60 * 1000,
    })),
  });

  const manifests: Record<string, AddonManifest | null> = Object.fromEntries(
    addonUrls.map((url, i) => [url, manifestResults[i]?.data ?? null]),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      const oldIndex = addonUrls.indexOf(active.id as string);
      const newIndex = addonUrls.indexOf(over.id as string);
      onReorder(arrayMove(addonUrls, oldIndex, newIndex));
    }
  };

  const handleAdd = async () => {
    const url = addUrl.trim().replace(/\/manifest\.json$/i, "");
    if (!url.startsWith("https://")) {
      setAddError("URL must start with https://");
      return;
    }
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch(`${url}/manifest.json`);
      if (!res.ok) throw new Error(`Could not reach addon (${res.status})`);
      const manifest = (await res.json()) as AddonManifest;
      const hasStream = manifest.resources?.some(
        (r) => (typeof r === "string" ? r : r.name) === "stream",
      );
      if (!hasStream)
        throw new Error("Addon does not provide stream resources");
      onAdd(url);
      setAddUrl("");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add addon");
    } finally {
      setAddLoading(false);
    }
  };

  const list = (
    <div className="flex flex-col gap-2">
      {addonUrls.map((url) => (
        <SortableAddonRow
          key={url}
          url={url}
          meta={manifests[url] ?? null}
          enabled={!inactiveAddonUrls.includes(url)}
          onToggle={() => onToggle?.(url)}
          onRemove={() => onRemove(url)}
          simple={simple}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {addonUrls.length > 0 &&
        (simple ? (
          list
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={addonUrls}
              strategy={verticalListSortingStrategy}
            >
              {list}
            </SortableContext>
          </DndContext>
        ))}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="https://your-addon.example.com/..."
            value={addUrl}
            disabled={addLoading}
            onChange={(e) => {
              setAddUrl(e.target.value);
              setAddError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            className="text-sm"
          />
          <Button
            variant="secondary"
            onClick={handleAdd}
            disabled={addLoading || !addUrl.trim()}
            className="shrink-0 gap-1.5"
          >
            {addLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="size-4" /> Add
              </>
            )}
          </Button>
        </div>
        {addError && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {addError}
          </p>
        )}
      </div>
    </div>
  );
}
