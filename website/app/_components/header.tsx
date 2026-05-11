import { metadata } from "material-icon-resolver";

export function Header({ entries }: { entries: number }) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-baseline sm:justify-between">
      <div className="flex items-baseline gap-2.5">
        <span className="inline-block size-2 -translate-y-px rounded-full bg-lime ring-4 ring-lime-soft" />
        <h1 className="font-mono text-sm font-medium tracking-tight text-foreground">
          material-icon-resolver
        </h1>
        <span className="text-xs text-muted-foreground">
          live icon resolver
        </span>
      </div>
      <div className="flex gap-4 font-mono text-xs text-muted-foreground">
        <span>
          upstream{" "}
          <span className="text-foreground/80">{metadata.upstreamVersion}</span>
        </span>
        <span>{entries} entries</span>
      </div>
    </header>
  );
}
