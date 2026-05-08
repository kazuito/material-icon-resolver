import type { CdnProvider } from "./types.ts";

/**
 * The npm package name of the upstream
 * [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme),
 * used as the path segment in CDN URLs.
 */
export const MATERIAL_ICON_THEME_PACKAGE = "material-icon-theme";

/**
 * Build a CDN URL for a Material Icon Theme SVG.
 *
 * You usually don't need to call this directly — {@link resolveMaterialIcon}
 * already returns a `cdnUrl`. Use it when you have a filename in hand and just
 * want the URL.
 *
 * @example
 * ```ts
 * buildCdnUrl({ cdn: "jsdelivr", version: "5.34.0", filename: "typescript.svg" });
 * // "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/typescript.svg"
 * ```
 */
export function buildCdnUrl(input: {
  /** CDN provider. */
  cdn: CdnProvider;
  /** `material-icon-theme` package version (e.g. `"5.34.0"` or `"latest"`). */
  version: string;
  /** SVG filename, including the `.svg` extension. */
  filename: string;
}): string {
  const { cdn, version, filename } = input;
  if (cdn === "unpkg") {
    return `https://unpkg.com/${MATERIAL_ICON_THEME_PACKAGE}@${version}/icons/${filename}`;
  }
  return `https://cdn.jsdelivr.net/npm/${MATERIAL_ICON_THEME_PACKAGE}@${version}/icons/${filename}`;
}

/**
 * Join a custom base URL with a filename. A single trailing slash on
 * `baseUrl` is normalized so you don't end up with `//`.
 *
 * @example
 * ```ts
 * buildBaseUrl("/icons", "typescript.svg");      // "/icons/typescript.svg"
 * buildBaseUrl("/icons/", "typescript.svg");     // "/icons/typescript.svg"
 * buildBaseUrl("https://cdn.example.com/i", "typescript.svg");
 * // "https://cdn.example.com/i/typescript.svg"
 * ```
 */
export function buildBaseUrl(baseUrl: string, filename: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${filename}`;
}
