"use client";

import {
  metadata,
  type ResolveMaterialIconOptions,
  resolveMaterialIcon,
} from "material-icon-resolver";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useMemo, useState } from "react";
import { Header } from "./header";
import { PathInput } from "./path-input";
import { DEFAULT_PATHS } from "./presets";
import { type ResolvedItem, ResultRow } from "./result-row";
import { Stats, type StatsValue } from "./stats";
import { Toolbar } from "./toolbar";

const CDN_VALUES = ["jsdelivr", "unpkg"] as const;
const FALLBACK_VALUES = ["match", "file", "folder", "none"] as const;

const queryParsers = {
  cdn: parseAsStringLiteral(CDN_VALUES).withDefault("jsdelivr"),
  fallback: parseAsStringLiteral(FALLBACK_VALUES).withDefault("match"),
  version: parseAsString.withDefault(""),
  open: parseAsBoolean.withDefault(false),
};

export function IconResolver() {
  const [paths, setPaths] = useState(DEFAULT_PATHS);
  const [{ cdn, fallback, version, open }, setOptions] =
    useQueryStates(queryParsers);

  const items = useMemo<ResolvedItem[]>(() => {
    const lines = paths
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return lines.map((raw) => {
      const isFolder = raw.endsWith("/");
      const cleanPath = isFolder ? raw.slice(0, -1) : raw;
      const type = isFolder ? "folder" : "file";
      const fb = fallback === "match" ? type : fallback;
      if (!cleanPath) {
        return { raw, type, result: null };
      }
      const opts: ResolveMaterialIconOptions = {
        type,
        cdn,
        fallback: fb,
        open,
      };
      if (version) opts.version = version;
      const result = resolveMaterialIcon(cleanPath, opts);
      return { raw, type, result };
    });
  }, [paths, cdn, fallback, version, open]);

  const stats = useMemo<StatsValue>(() => {
    let resolved = 0;
    let defaulted = 0;
    let nulled = 0;
    let files = 0;
    let folders = 0;
    for (const it of items) {
      if (it.type === "file") files++;
      else folders++;
      if (it.result === null) nulled++;
      else if (it.result.source === "default") defaulted++;
      else resolved++;
    }
    return { total: items.length, resolved, defaulted, nulled, files, folders };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5 lg:items-start lg:gap-8">
        <div className="space-y-4 lg:sticky lg:top-6 lg:col-span-2">
          <Header entries={stats.total} />

          <Toolbar
            cdn={cdn}
            onCdnChange={(v) => setOptions({ cdn: v })}
            fallback={fallback}
            onFallbackChange={(v) => setOptions({ fallback: v })}
            version={version}
            onVersionChange={(v) => setOptions({ version: v })}
            open={open}
            onOpenChange={(v) => setOptions({ open: v })}
            versionPlaceholder={metadata.upstreamVersion}
          />
          <PathInput value={paths} onChange={setPaths} />
        </div>

        <div className="space-y-3 lg:col-start-3 lg:col-span-3">
          <Stats stats={stats} />
          <div className="flex flex-col gap-px">
            {items.length === 0 ? (
              <div className="py-14 text-center font-mono text-xs text-muted-foreground">
                no paths
              </div>
            ) : (
              items.map((item, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: index disambiguates duplicate raw entries in the user-typed list
                <ResultRow key={`${item.raw}-${i}`} item={item} open={open} />
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="mt-6 flex justify-between border-t border-border pt-4 font-mono text-xs tracking-wider text-muted-foreground/60">
        <span>material-icon-resolver</span>
        <span>
          {stats.resolved}/{stats.total} resolved
        </span>
      </footer>
    </div>
  );
}
