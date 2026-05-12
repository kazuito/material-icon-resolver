import { Separator } from "@/components/ui/separator";

export type StatsValue = {
  total: number;
  resolved: number;
  defaulted: number;
  nulled: number;
  files: number;
  folders: number;
};

export function Stats({ stats }: { stats: StatsValue }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-2.5 font-mono text-xs">
      <Item label="total" value={stats.total} />
      <Sep />
      <Item label="matched" value={stats.resolved} tone="lime" />
      <Item label="fallback" value={stats.defaulted} tone="warn" />
      <Item label="null" value={stats.nulled} tone="danger" />
      <Sep />
      <Item label="files" value={stats.files} />
      <Item label="folders" value={stats.folders} />
    </div>
  );
}

function Sep() {
  return <Separator orientation="vertical" className="hidden h-3.5 sm:block" />;
}

function Item({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "lime" | "warn" | "danger";
}) {
  const toneClass =
    tone === "lime"
      ? "text-lime"
      : tone === "warn"
        ? "text-warn"
        : tone === "danger"
          ? "text-danger"
          : "text-foreground";
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={`font-medium ${toneClass}`}>{value}</span>
    </span>
  );
}
