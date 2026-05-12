import { metadata } from "material-icon-resolver";
import Link from "next/link";

export function Header({ entries }: { entries: number }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
      <div className="flex items-baseline gap-2.5">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight text-foreground">
          material-icon-resolver
        </Link>
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
