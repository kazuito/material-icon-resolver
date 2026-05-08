import {
  defaultFile,
  fileExtensions,
  fileNames,
  fileNamesWithPath,
  languageIds,
} from "./generated/file-icons.ts";
import {
  getBasename,
  getExtensionCandidates,
  getParentName,
  normalizePath,
} from "./normalize.ts";
import { type Hit, makeResult } from "./result.ts";
import type {
  FallbackMode,
  ResolveByLanguageIdOptions,
  ResolvedMaterialIcon,
  ResolveMaterialIconOptions,
} from "./types.ts";

export type ResolveMaterialFileIconOptions = Omit<
  ResolveMaterialIconOptions,
  "fallback" | "open" | "type"
> & {
  /**
   * What to return when no file icon matches the input.
   *
   * File-only imports intentionally do not load folder lookup tables, so the
   * file entry supports only file fallback or `null`.
   *
   * @default "file"
   */
  fallback?: Extract<FallbackMode, "file" | "none">;
};

export type ResolveFileByLanguageIdOptions = Omit<
  ResolveByLanguageIdOptions,
  "fallback"
> & {
  /**
   * What to return when no language id matches the input.
   *
   * @default "file"
   */
  fallback?: Extract<FallbackMode, "file" | "none">;
};

function lookupFile(path: string): Hit | null {
  const normalized = normalizePath(path);
  const basename = getBasename(normalized).toLowerCase();
  const parent = getParentName(normalized).toLowerCase();

  if (parent.length > 0) {
    const key = `${parent}/${basename}`;
    const hit = fileNamesWithPath[key];
    if (hit) return { name: hit, source: "fileNamesWithPath" };
  }

  const nameHit = fileNames[basename];
  if (nameHit) return { name: nameHit, source: "fileNames" };

  for (const ext of getExtensionCandidates(basename)) {
    const extHit = fileExtensions[ext];
    if (extHit) return { name: extHit, source: "fileExtensions" };
  }

  return null;
}

function lookupLanguageId(languageId: string): Hit | null {
  const hit = languageIds[languageId.toLowerCase()];
  return hit ? { name: hit, source: "languageIds" } : null;
}

/**
 * Resolve a Material Icon Theme file icon from a file path.
 *
 * This entry only imports file icon lookup data. Use
 * `material-icon-resolver/folder` for folder-only resolution, or the root
 * entry for the combined resolver.
 */
export function resolveMaterialFileIcon(
  path: string,
  options?: ResolveMaterialFileIconOptions,
): ResolvedMaterialIcon | null {
  const opts = options ?? {};
  let hit = lookupFile(path);

  if (!hit && opts.languageId) {
    hit = lookupLanguageId(opts.languageId);
  }

  if (hit) return makeResult(hit, "file", false, opts);

  const fallback = opts.fallback ?? "file";
  if (fallback === "none") return null;

  return makeResult(
    { name: defaultFile, source: "default" },
    "file",
    false,
    opts,
  );
}

/**
 * Resolve a Material Icon Theme file icon directly from a VS Code language id.
 */
export function resolveMaterialFileIconByLanguageId(
  languageId: string,
  options?: ResolveFileByLanguageIdOptions,
): ResolvedMaterialIcon | null {
  const opts = options ?? {};
  const hit = lookupLanguageId(languageId);

  if (hit) return makeResult(hit, "file", false, opts);

  const fallback = opts.fallback ?? "file";
  if (fallback === "none") return null;

  return makeResult(
    { name: defaultFile, source: "default" },
    "file",
    false,
    opts,
  );
}

/**
 * Convenience wrapper around {@link resolveMaterialFileIcon} that returns just
 * the icon name.
 */
export function getMaterialFileIconName(
  path: string,
  options?: ResolveMaterialFileIconOptions,
): string | null {
  return resolveMaterialFileIcon(path, options)?.name ?? null;
}

/**
 * Convenience wrapper around {@link resolveMaterialFileIcon} that returns just
 * the resolved CDN URL.
 */
export function getMaterialFileIconCdnUrl(
  path: string,
  options?: ResolveMaterialFileIconOptions,
): string | null {
  return resolveMaterialFileIcon(path, options)?.cdnUrl ?? null;
}
