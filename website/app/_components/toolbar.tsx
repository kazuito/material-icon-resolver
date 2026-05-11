"use client";

import type { CdnProvider, FallbackMode } from "material-icon-resolver";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type FallbackChoice = FallbackMode | "match";

type Props = {
  cdn: CdnProvider;
  onCdnChange: (v: CdnProvider) => void;
  fallback: FallbackChoice;
  onFallbackChange: (v: FallbackChoice) => void;
  version: string;
  onVersionChange: (v: string) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  versionPlaceholder: string;
};

const CDN_OPTIONS: CdnProvider[] = ["jsdelivr", "unpkg"];
const FALLBACK_OPTIONS: FallbackChoice[] = ["match", "file", "folder", "none"];

export function Toolbar(p: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border py-3 font-mono">
      <Field label="cdn">
        <ToggleGroup
          value={[p.cdn]}
          onValueChange={(v) => {
            const next = v[0] as CdnProvider | undefined;
            if (next) p.onCdnChange(next);
          }}
          size="sm"
          className="border border-input bg-input/30 p-0.5"
        >
          {CDN_OPTIONS.map((v) => (
            <ToggleGroupItem key={v} value={v} className="font-mono">
              {v}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field label="fallback">
        <ToggleGroup
          value={[p.fallback]}
          onValueChange={(v) => {
            const next = v[0] as FallbackChoice | undefined;
            if (next) p.onFallbackChange(next);
          }}
          size="sm"
          className="border border-input bg-input/30 p-0.5"
        >
          {FALLBACK_OPTIONS.map((v) => (
            <ToggleGroupItem key={v} value={v} className="font-mono">
              {v}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field label="version">
        <Input
          value={p.version}
          onChange={(e) => p.onVersionChange(e.target.value)}
          placeholder={p.versionPlaceholder}
          spellCheck={false}
          className="h-7 w-28 font-mono text-xs"
        />
      </Field>

      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        <Switch
          checked={p.open}
          onCheckedChange={(v) => p.onOpenChange(Boolean(v))}
          size="sm"
          aria-label="folder · open"
        />
        <span className={p.open ? "text-foreground" : ""}>folder · open</span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
