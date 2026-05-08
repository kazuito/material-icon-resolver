# material-icon-resolver

Resolve [VS Code Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) icon names, SVG filenames, and CDN URLs from file or folder paths.

ESM-only TypeScript library. No runtime dependencies. Works in Node, Bun, Deno, and the browser.

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

Convenience helpers:

```ts
import {
  getMaterialIconName,
  getMaterialIconCdnUrl,
} from "material-icon-resolver";

getMaterialIconName("package.json");
// "nodejs"

getMaterialIconCdnUrl("package.json");
// "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/package.json.svg"
```

## API

### `resolveMaterialIcon(path, options?)`

Returns a `ResolvedMaterialIcon` or `null` (when `fallback: "none"` and no match).

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
    | "rootFolderNames"
    | "folderNames"
    | "default";
};
```

### Options

| Option     | Type                                | Default                                  | Description |
| ---------- | ----------------------------------- | ---------------------------------------- | ----------- |
| `type`     | `"file" \| "folder"`                | `"file"`                                 | What to resolve `path` as. |
| `open`     | `boolean`                           | `false`                                  | For folders: append `-open` to the filename (expanded folder icon). |
| `fallback` | `"file" \| "folder" \| "none"`      | matches `type`                           | What to return when no match is found. `"none"` returns `null`. |
| `cdn`      | `"jsdelivr" \| "unpkg"`             | `"jsdelivr"`                             | CDN provider for `cdnUrl`. |
| `version`  | `string`                            | pinned upstream version (`metadata.upstreamVersion`) | `material-icon-theme` version on the CDN. |
| `baseUrl`  | `string`                            | —                                        | Use a custom base URL instead of a CDN. `cdn` and `version` are ignored when set. |

### Resolution order

**Files** — `fileNamesWithPath[parent/basename]` → `fileNames[basename]` → `fileExtensions[longest…shortest]` → fallback.

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

- VS Code language IDs, light/highContrast variants, custom icon associations, and `clone`-generated icons are out of scope.
- The default `version` is **pinned** to the upstream release the package was generated from, not `latest`. Pass `version: "latest"` (or a specific version) to opt out.
- The `activeIconPack` is fixed to `"angular"` (the upstream default). Icons gated by other packs (vue, react, qwik, …) are excluded.

## License

[MIT](./LICENSE) © kazuito
