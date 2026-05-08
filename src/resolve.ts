import { buildBaseUrl, buildCdnUrl } from "./cdn.ts";
import {
  defaultFile,
  fileExtensions,
  fileNames,
  fileNamesWithPath,
  languageIds,
} from "./generated/file-icons.ts";
import {
  defaultFolder,
  folderNames,
  folderNamesExpanded,
  rootFolderNames,
  rootFolderNamesExpanded,
} from "./generated/folder-icons.ts";
import { metadata } from "./generated/metadata.ts";
import {
  getBasename,
  getExtensionCandidates,
  getParentName,
  normalizePath,
} from "./normalize.ts";
import type {
  ResolveByLanguageIdOptions,
  ResolvedMaterialIcon,
  ResolveMaterialIconOptions,
  ResolveSource,
} from "./types.ts";

type Hit = { name: string; source: ResolveSource };

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

function lookupFolder(path: string, open: boolean): Hit | null {
  const normalized = normalizePath(path);
  const basename = getBasename(normalized).toLowerCase();
  if (basename.length === 0) return null;

  const rootMap = open ? rootFolderNamesExpanded : rootFolderNames;
  const rootHit = rootMap[basename];
  if (rootHit) return { name: rootHit, source: "rootFolderNames" };

  const folderMap = open ? folderNamesExpanded : folderNames;
  const folderHit = folderMap[basename];
  if (folderHit) return { name: folderHit, source: "folderNames" };

  return null;
}

function makeResult(
  hit: Hit,
  type: "file" | "folder",
  open: boolean,
  options: ResolveMaterialIconOptions,
): ResolvedMaterialIcon {
  const filename =
    type === "folder" && open ? `${hit.name}-open.svg` : `${hit.name}.svg`;
  const version = options.version ?? metadata.upstreamVersion;
  const cdnUrl = options.baseUrl
    ? buildBaseUrl(options.baseUrl, filename)
    : buildCdnUrl({ cdn: options.cdn ?? "jsdelivr", version, filename });
  return { name: hit.name, filename, cdnUrl, type, source: hit.source };
}

/**
 * Resolve a Material Icon Theme icon from a file or folder path.
 *
 * Returns the matching {@link ResolvedMaterialIcon}, or `null` only when
 * `options.fallback` is `"none"` and nothing matched. With the default
 * `fallback`, a default file or folder icon is always returned.
 *
 * Resolution order (case-insensitive):
 *
 * - **Files** — `parent/basename` exact → `basename` exact → longest known
 *   extension → {@link ResolveMaterialIconOptions.languageId} (when provided)
 *   → fallback.
 * - **Folders** — root folder name → generic folder name → fallback. The
 *   `-open` suffix is appended to the SVG filename when
 *   {@link ResolveMaterialIconOptions.open} is `true`.
 *
 * @param path - File or folder path. Both POSIX and Windows separators are accepted.
 * @param options - See {@link ResolveMaterialIconOptions}.
 *
 * @example
 * ```ts
 * resolveMaterialIcon("src/index.ts");
 * // {
 * //   name: "typescript",
 * //   filename: "typescript.svg",
 * //   cdnUrl: "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/typescript.svg",
 * //   type: "file",
 * //   source: "fileExtensions",
 * // }
 *
 * resolveMaterialIcon("src", { type: "folder", open: true });
 * // { name: "folder-src", filename: "folder-src-open.svg", ... }
 *
 * resolveMaterialIcon("scratch.unknown-ext", { languageId: "rust" });
 * // → rust (path miss, languageId wins)
 *
 * resolveMaterialIcon("anything.weird", { fallback: "none" });
 * // null
 * ```
 */
export function resolveMaterialIcon(
  path: string,
  options?: ResolveMaterialIconOptions,
): ResolvedMaterialIcon | null {
  const opts = options ?? {};
  const type = opts.type ?? "file";
  const open = opts.open ?? false;

  let hit = type === "file" ? lookupFile(path) : lookupFolder(path, open);

  if (!hit && type === "file" && opts.languageId) {
    hit = lookupLanguageId(opts.languageId);
  }

  if (hit) return makeResult(hit, type, open, opts);

  const fallback = opts.fallback ?? type;
  if (fallback === "none") return null;

  if (fallback === "file") {
    return makeResult(
      { name: defaultFile, source: "default" },
      "file",
      false,
      opts,
    );
  }

  return makeResult(
    { name: defaultFolder, source: "default" },
    "folder",
    open,
    opts,
  );
}

/**
 * Resolve a Material Icon Theme icon directly from a VS Code
 * [language id](https://code.visualstudio.com/docs/languages/identifiers).
 *
 * Useful when you already have a language identifier in hand (e.g. from a
 * Monaco editor model) and the file path may be synthetic or unhelpful.
 *
 * Returns a {@link ResolvedMaterialIcon} with `type: "file"`, or `null` only
 * when `options.fallback` is `"none"` and the language id has no associated
 * icon. With the default `fallback`, the default file icon is returned.
 *
 * @param languageId - VS Code language id (e.g. `"typescript"`, `"rust"`, `"shellscript"`). Matched case-insensitively.
 * @param options - See {@link ResolveByLanguageIdOptions}.
 *
 * @example
 * ```ts
 * resolveMaterialIconByLanguageId("rust");
 * // { name: "rust", filename: "rust.svg", ..., source: "languageIds" }
 *
 * resolveMaterialIconByLanguageId("plaintext", { fallback: "none" });
 * // null
 * ```
 */
export function resolveMaterialIconByLanguageId(
  languageId: string,
  options?: ResolveByLanguageIdOptions,
): ResolvedMaterialIcon | null {
  const opts = options ?? {};
  const hit = lookupLanguageId(languageId);

  if (hit) return makeResult(hit, "file", false, opts);

  const fallback = opts.fallback ?? "file";
  if (fallback === "none") return null;

  if (fallback === "folder") {
    return makeResult(
      { name: defaultFolder, source: "default" },
      "folder",
      false,
      opts,
    );
  }

  return makeResult(
    { name: defaultFile, source: "default" },
    "file",
    false,
    opts,
  );
}

/**
 * Convenience wrapper around {@link resolveMaterialIcon} that returns just the
 * icon `name` (e.g. `"typescript"`, `"folder-src"`), without the `.svg`
 * extension or `-open` suffix.
 *
 * @returns The icon name, or `null` when `options.fallback` is `"none"` and nothing matched.
 *
 * @example
 * ```ts
 * getMaterialIconName("package.json"); // "nodejs"
 * getMaterialIconName("src", { type: "folder" }); // "folder-src"
 * ```
 */
export function getMaterialIconName(
  path: string,
  options?: ResolveMaterialIconOptions,
): string | null {
  return resolveMaterialIcon(path, options)?.name ?? null;
}

/**
 * Convenience wrapper around {@link resolveMaterialIcon} that returns just the
 * resolved CDN URL.
 *
 * @returns The full SVG URL, or `null` when `options.fallback` is `"none"` and nothing matched.
 *
 * @example
 * ```ts
 * getMaterialIconCdnUrl("package.json");
 * // "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/nodejs.svg"
 *
 * getMaterialIconCdnUrl("src/index.ts", { baseUrl: "/icons" });
 * // "/icons/typescript.svg"
 * ```
 */
export function getMaterialIconCdnUrl(
  path: string,
  options?: ResolveMaterialIconOptions,
): string | null {
  return resolveMaterialIcon(path, options)?.cdnUrl ?? null;
}
