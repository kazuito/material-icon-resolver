import {
  resolveMaterialFileIcon,
  resolveMaterialFileIconByLanguageId,
} from "./file.ts";
import { resolveMaterialFolderIcon } from "./folder.ts";
import type {
  ResolveByLanguageIdOptions,
  ResolvedMaterialIcon,
  ResolveMaterialIconOptions,
} from "./types.ts";

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
 * //   cdnUrl: "https://cdn.jsdelivr.net/npm/material-icon-theme@5.35.0/icons/typescript.svg",
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

  const hit =
    type === "file"
      ? resolveMaterialFileIcon(path, { ...opts, fallback: "none" })
      : resolveMaterialFolderIcon(path, { ...opts, fallback: "none" });
  if (hit) return hit;

  const fallback = opts.fallback ?? type;
  if (fallback === "none") return null;

  if (fallback === "file") {
    return resolveMaterialFileIcon("", {
      ...opts,
      fallback: "file",
      languageId: undefined,
    });
  }

  return resolveMaterialFolderIcon("", { ...opts, fallback: "folder", open });
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
  const hit = resolveMaterialFileIconByLanguageId(languageId, {
    ...opts,
    fallback: "none",
  });
  if (hit) return hit;

  const fallback = opts.fallback ?? "file";
  if (fallback === "none") return null;

  if (fallback === "folder") {
    return resolveMaterialFolderIcon("", { ...opts, fallback: "folder" });
  }

  return resolveMaterialFileIconByLanguageId("", { ...opts, fallback: "file" });
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
 * // "https://cdn.jsdelivr.net/npm/material-icon-theme@5.35.0/icons/nodejs.svg"
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
