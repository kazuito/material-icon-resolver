import { metadata } from "material-icon-resolver";

export function Header({ entries }: { entries: number }) {
  return (
    <header className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-baseline sm:justify-between">
      <div className="flex items-baseline gap-2.5">
        <h1 className="font-mono text-sm font-medium tracking-tight text-foreground">
          material-icon-resolver
        </h1>
        <span className="text-muted-foreground">Live</span>
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
