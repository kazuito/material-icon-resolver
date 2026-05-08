# material-icon-resolver

Resolve [VS Code Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) icon names, SVG filenames, and CDN URLs from file or folder paths — or directly from a VS Code language ID.

TypeScript library with ESM and CommonJS builds. No runtime dependencies. Works in Node, Bun, Deno, and the browser.

## Install

```sh
npm install material-icon-resolver
# or
pnpm add material-icon-resolver
# or
yarn add material-icon-resolver
```

## Usage

```ts
import { resolveMaterialIcon } from "material-icon-resolver";

resolveMaterialIcon("src/index.ts");
// {
//   name: "typescript",
//   filename: "typescript.svg",
//   cdnUrl: "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/typescript.svg",
//   type: "file",
//   source: "fileExtensions",
// }

resolveMaterialIcon("src", { type: "folder" });
// { name: "folder-src", filename: "folder-src.svg", ... }

resolveMaterialIcon("src", { type: "folder", open: true });
// { name: "folder-src", filename: "folder-src-open.svg", ... }
```

Resolve from a VS Code language ID (useful for editors like Monaco where you already have the language but the path may be synthetic):

```ts
import { resolveMaterialIconByLanguageId } from "material-icon-resolver";

resolveMaterialIconByLanguageId("rust");
// { name: "rust", filename: "rust.svg", ..., source: "languageIds" }
```

Or pass `languageId` as a hint to `resolveMaterialIcon`. It's used as a fallback when the path itself doesn't match anything specific:

```ts
resolveMaterialIcon("scratch.unknown-ext", { languageId: "rust" });
// → rust (path miss, languageId wins)

resolveMaterialIcon("package.json", { languageId: "rust" });
// → nodejs (specific filename match still wins over languageId)
```

Convenience helpers:

```ts
import {
  getMaterialIconName,
  getMaterialIconCdnUrl,
} from "material-icon-resolver";

getMaterialIconName("package.json");
// "nodejs"

getMaterialIconCdnUrl("package.json");
// "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/nodejs.svg"
```

## Split imports

The root entry exports the combined file/folder resolver and includes both lookup tables. If you only need one side, use a split entry so bundlers and runtimes can avoid loading the other large map:

```ts
import { resolveMaterialFileIcon } from "material-icon-resolver/file";

resolveMaterialFileIcon("src/index.ts");
// { name: "typescript", filename: "typescript.svg", type: "file", ... }
```

```ts
import { resolveMaterialFolderIcon } from "material-icon-resolver/folder";

resolveMaterialFolderIcon("src", { open: true });
// { name: "folder-src", filename: "folder-src-open.svg", type: "folder", ... }
```

CommonJS is also supported:

```js
const { resolveMaterialFileIcon } = require("material-icon-resolver/file");

resolveMaterialFileIcon("package.json");
```

## API

### `resolveMaterialIcon(path, options?)`

Resolve from a file or folder path. Returns a `ResolvedMaterialIcon` or `null` (when `fallback: "none"` and no match).

```ts
type ResolvedMaterialIcon = {
  name: string;       // icon name, e.g. "typescript"
  filename: string;   // SVG filename, e.g. "typescript.svg"
  cdnUrl: string;     // full URL to the SVG
  type: "file" | "folder";
  source:
    | "fileNamesWithPath"
    | "fileNames"
    | "fileExtensions"
    | "languageIds"
    | "rootFolderNames"
    | "folderNames"
    | "default";
};
```

### `resolveMaterialIconByLanguageId(languageId, options?)`

Resolve directly from a [VS Code language ID](https://code.visualstudio.com/docs/languages/identifiers) (e.g. `"typescript"`, `"rust"`, `"shellscript"`). Returns a `ResolvedMaterialIcon` (with `type: "file"`) or `null` (when `fallback: "none"` and no match). Accepts the same `cdn` / `version` / `baseUrl` / `fallback` options as `resolveMaterialIcon`.

### `resolveMaterialFileIcon(path, options?)`

Resolve from a file path via `material-icon-resolver/file`. This entry imports only file lookup data. It accepts `cdn` / `version` / `baseUrl` / `languageId` and `fallback: "file" | "none"`.

### `resolveMaterialFileIconByLanguageId(languageId, options?)`

Resolve directly from a VS Code language ID via `material-icon-resolver/file`. It accepts `cdn` / `version` / `baseUrl` and `fallback: "file" | "none"`.

### `resolveMaterialFolderIcon(path, options?)`

Resolve from a folder path via `material-icon-resolver/folder`. This entry imports only folder lookup data. It accepts `cdn` / `version` / `baseUrl` / `open` and `fallback: "folder" | "none"`.

### Options

| Option       | Type                                | Default                                  | Description |
| ------------ | ----------------------------------- | ---------------------------------------- | ----------- |
| `type`       | `"file" \| "folder"`                | `"file"`                                 | What to resolve `path` as. |
| `open`       | `boolean`                           | `false`                                  | For folders: append `-open` to the filename (expanded folder icon). |
| `languageId` | `string`                            | —                                        | VS Code language ID used as a fallback when path lookup misses. Ignored when `type` is `"folder"`. |
| `fallback`   | `"file" \| "folder" \| "none"`      | matches `type`                           | What to return when no match is found. `"none"` returns `null`. |
| `cdn`        | `"jsdelivr" \| "unpkg"`             | `"jsdelivr"`                             | CDN provider for `cdnUrl`. |
| `version`    | `string`                            | pinned upstream version (`metadata.upstreamVersion`) | `material-icon-theme` version on the CDN. |
| `baseUrl`    | `string`                            | —                                        | Use a custom base URL instead of a CDN. `cdn` and `version` are ignored when set. |

### Resolution order

**Files** — `fileNamesWithPath[parent/basename]` → `fileNames[basename]` → `fileExtensions[longest…shortest]` → `languageIds[languageId]` (when option provided) → fallback.

**Folders** — `rootFolderNames[basename]` → `folderNames[basename]` → fallback. Folder name maps include the upstream `extendFolderNames` aliases (`name`, `.name`, `_name`, `-name`, `__name__`).

All keys are matched case-insensitively.

### Other exports

```ts
import {
  metadata,                     // { upstreamVersion, upstreamCommit, ... }
  buildCdnUrl,                  // ({ cdn, version, filename }) => string
  buildBaseUrl,                 // (baseUrl, filename) => string
  MATERIAL_ICON_THEME_PACKAGE,  // "material-icon-theme"
} from "material-icon-resolver";
```

## Notes

- light/highContrast variants, custom icon associations, and `clone`-generated icons are out of scope.
- The default `version` is **pinned** to the upstream release the package was generated from, not `latest`. Pass `version: "latest"` (or a specific version) to opt out.
- The `activeIconPack` is fixed to `"angular"` (the upstream default). Icons gated by other packs (vue, react, qwik, …) are excluded.

## License

[MIT](./LICENSE) © kazuito
