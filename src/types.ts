/**
 * CDN provider used to build {@link ResolvedMaterialIcon.cdnUrl}.
 *
 * - `"jsdelivr"` — `https://cdn.jsdelivr.net/npm/material-icon-theme@<version>/icons/<file>` (default)
 * - `"unpkg"` — `https://unpkg.com/material-icon-theme@<version>/icons/<file>`
 */
export type CdnProvider = "jsdelivr" | "unpkg";

/**
 * Whether a path should be resolved as a file or a folder.
 */
export type IconType = "file" | "folder";

/**
 * Behavior when no icon matches the input.
 *
 * - `"file"` — return the default file icon.
 * - `"folder"` — return the default folder icon.
 * - `"none"` — return `null` instead of a default icon.
 */
export type FallbackMode = "file" | "folder" | "none";

/**
 * Which lookup table produced the resolved icon. Useful for debugging or
 * tweaking resolution priority in your own UI.
 *
 * - `"fileNamesWithPath"` — matched a `parent/basename` pair (e.g. `.github/workflows/ci.yml`).
 * - `"fileNames"` — matched a full filename (e.g. `package.json`).
 * - `"fileExtensions"` — matched the longest known extension (e.g. `.ts`, `.d.ts`).
 * - `"languageIds"` — matched a VS Code language id (e.g. `"rust"`).
 * - `"rootFolderNames"` — matched a top-level folder name.
 * - `"folderNames"` — matched a generic folder name.
 * - `"default"` — no match; the default file/folder icon was returned via `fallback`.
 */
export type ResolveSource =
  | "fileNamesWithPath"
  | "fileNames"
  | "fileExtensions"
  | "languageIds"
  | "rootFolderNames"
  | "folderNames"
  | "default";

/**
 * Options for {@link resolveMaterialIcon}, {@link getMaterialIconName}, and
 * {@link getMaterialIconCdnUrl}.
 */
export type ResolveMaterialIconOptions = {
  /**
   * Resolve the input as a file or a folder.
   *
   * @default "file"
   */
  type?: IconType;

  /**
   * CDN provider used to build {@link ResolvedMaterialIcon.cdnUrl}.
   * Ignored when {@link ResolveMaterialIconOptions.baseUrl} is set.
   *
   * @default "jsdelivr"
   */
  cdn?: CdnProvider;

  /**
   * `material-icon-theme` package version embedded in the CDN URL.
   *
   * The default is **pinned** to the upstream version this package was
   * generated against, not `"latest"`, because the bundled lookup tables only
   * match that exact release's SVG inventory. Pass an explicit version (or
   * `"latest"`) to opt out.
   *
   * Ignored when {@link ResolveMaterialIconOptions.baseUrl} is set.
   *
   * @default metadata.upstreamVersion
   */
  version?: string;

  /**
   * What to return when no icon matches the input. Defaults to a default icon
   * matching {@link ResolveMaterialIconOptions.type} — i.e. `"file"` for files
   * and `"folder"` for folders. Set to `"none"` to get `null` instead.
   *
   * @default Matches `type`
   */
  fallback?: FallbackMode;

  /**
   * For folders, append `-open` to the SVG filename to get the expanded variant
   * (e.g. `folder-src-open.svg`). Has no effect when `type` is `"file"`.
   *
   * @default false
   */
  open?: boolean;

  /**
   * Use this base URL for {@link ResolvedMaterialIcon.cdnUrl} instead of a CDN.
   * The filename is appended to it (a single trailing slash is normalized).
   *
   * Useful when self-hosting the icon SVGs. When set, both `cdn` and `version`
   * are ignored.
   *
   * @example
   * ```ts
   * resolveMaterialIcon("src/index.ts", { baseUrl: "/icons" });
   * // cdnUrl: "/icons/typescript.svg"
   * ```
   */
  baseUrl?: string;

  /**
   * VS Code [language id](https://code.visualstudio.com/docs/languages/identifiers)
   * (e.g. `"typescript"`, `"rust"`, `"shellscript"`) used as a fallback when
   * the path itself doesn't match any specific filename or extension.
   *
   * Specific filename / path matches still win over the language id. Ignored
   * when `type` is `"folder"`.
   */
  languageId?: string;
};

/**
 * Options for {@link resolveMaterialIconByLanguageId}.
 *
 * Same as {@link ResolveMaterialIconOptions} minus the path-specific fields
 * (`type`, `open`, `languageId`), which don't apply when resolving directly
 * from a language id.
 */
export type ResolveByLanguageIdOptions = Omit<
  ResolveMaterialIconOptions,
  "type" | "open" | "languageId"
>;

/**
 * The result returned by {@link resolveMaterialIcon} and
 * {@link resolveMaterialIconByLanguageId}.
 */
export type ResolvedMaterialIcon = {
  /**
   * Icon name as defined by the Material Icon Theme (e.g. `"typescript"`,
   * `"folder-src"`). Does not include the `.svg` extension or the `-open`
   * suffix.
   */
  name: string;

  /**
   * SVG filename, including the `.svg` extension and the `-open` suffix for
   * expanded folder icons (e.g. `"typescript.svg"`, `"folder-src-open.svg"`).
   */
  filename: string;

  /**
   * Full URL to the SVG. Built from `cdn` + `version`, or from `baseUrl`
   * when one is provided in the options.
   */
  cdnUrl: string;

  /**
   * Whether this icon represents a file or a folder.
   */
  type: IconType;

  /**
   * Which lookup table produced this match. See {@link ResolveSource}.
   */
  source: ResolveSource;
};
