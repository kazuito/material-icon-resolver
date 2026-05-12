"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PRESETS } from "./presets";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function PathInput({ value, onChange }: Props) {
  return (
    <section className="space-y-2 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          paths
          <span className="ml-2 text-xs normal-case tracking-normal text-foreground/40">
            trailing{" "}
            <code className="rounded bg-lime-soft px-1 text-lime">/</code> =
            folder
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {value && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onChange("")}
              className="font-mono text-muted-foreground"
            >
              clear
            </Button>
          )}
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              size="xs"
              variant="outline"
              onClick={() => onChange(p.paths.join("\n"))}
              className="font-mono text-muted-foreground hover:border-lime/40 hover:text-lime"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="one path per line — append / for folders"
        rows={9}
        className="min-h-40 resize-y px-3 py-2.5 font-mono text-sm leading-relaxed caret-lime pointer-coarse:text-base max-md:h-60"
      />
    </section>
  );
}
