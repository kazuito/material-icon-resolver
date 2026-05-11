import { ArrowUpRight } from "lucide-react";
import type {
  IconType,
  ResolvedMaterialIcon,
  ResolveSource,
} from "material-icon-resolver";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ResolvedItem = {
  raw: string;
  type: IconType;
  result: ResolvedMaterialIcon | null;
};

type Props = {
  item: ResolvedItem;
  open: boolean;
};

export function ResultRow({ item, open }: Props) {
  const isDefault = item.result?.source === "default";

  return (
    <div className="flex items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-border hover:bg-card/60">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md bg-card",
          isDefault &&
            "border border-dashed border-muted-foreground/40 bg-transparent",
        )}
      >
        {item.result && (
          // biome-ignore lint/performance/noImgElement: external CDN, no Next optimizer needed
          <img
            src={item.result.cdnUrl}
            alt={item.result.name}
            loading="lazy"
            className="size-5"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-1 break-all font-mono text-sm text-muted-foreground">
        <span>
          {pathSegments(item.raw).map((seg, j) => (
            <span
              key={`${seg.cls}-${j}`}
              className={
                seg.cls === "p"
                  ? "text-foreground"
                  : seg.cls === "trail"
                    ? "text-lime"
                    : "text-muted-foreground/70"
              }
            >
              {seg.text}
            </span>
          ))}
        </span>
        <span className="text-xs text-muted-foreground/40">→</span>
        {item.result ? (
          <span
            className={cn("font-medium", isDefault ? "text-warn" : "text-lime")}
          >
            {item.result.name}
          </span>
        ) : (
          <span className="text-danger">null</span>
        )}
      </div>

      <SourceBadge source={item.result?.source ?? null} />

      <span className="hidden whitespace-nowrap font-mono text-xs text-muted-foreground sm:inline">
        {item.type}
        {item.type === "folder" && open ? " · open" : ""}
      </span>

      {item.result ? (
        <a
          href={item.result.cdnUrl}
          target="_blank"
          rel="noreferrer"
          title={item.result.cdnUrl}
          className="flex size-6 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-lime-soft hover:text-lime"
        >
          <ArrowUpRight className="size-3.5" />
        </a>
      ) : (
        <span className="invisible size-6" />
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: ResolveSource | null }) {
  if (source === null) {
    return (
      <Badge
        variant="outline"
        className="font-mono text-xs uppercase tracking-widest border-danger/40 text-danger"
      >
        null
      </Badge>
    );
  }
  const tone =
    source === "fileNamesWithPath" || source === "rootFolderNames"
      ? "lime"
      : source === "default"
        ? "warn"
        : "muted";
  const cls =
    tone === "lime"
      ? "border-lime-dim text-lime"
      : tone === "warn"
        ? "border-warn/40 text-warn"
        : "border-border text-muted-foreground";
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-xs uppercase tracking-widest", cls)}
    >
      {source}
    </Badge>
  );
}

function pathSegments(raw: string) {
  const isFolder = raw.endsWith("/");
  const body = isFolder ? raw.slice(0, -1) : raw;
  const out: { text: string; cls: "p" | "sep" | "trail" }[] = [];
  const parts = body.split("/");
  parts.forEach((part, i) => {
    if (i > 0) out.push({ text: "/", cls: "sep" });
    out.push({ text: part, cls: "p" });
  });
  if (isFolder) out.push({ text: "/", cls: "trail" });
  return out;
}
