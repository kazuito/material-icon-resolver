# material-icon-resolver

Resolve VS Code Material Icon Theme icon names, SVG filenames, and CDN URLs from file or folder paths. ESM-only TypeScript library, distributed via npm.

## Repo Map

- `src/index.ts` — public API re-exports
- `src/resolve.ts` — `resolveMaterialIcon`, `getMaterialIconName`, `getMaterialIconCdnUrl`
- `src/normalize.ts` — path normalization, basename/parent split, extension candidates
- `src/cdn.ts` — jsDelivr / unpkg / `baseUrl` URL builders
- `src/types.ts` — public type definitions
- `src/generated/*.ts` — **auto-generated; do not edit by hand**. Re-run `pnpm generate`.
- `scripts/generate.ts` — pulls upstream `vscode-material-icon-theme` at the version tag and rebuilds `src/generated/*.ts`
- `scripts/validate-icons.ts` — fetches the published npm tarball and asserts every referenced SVG name actually exists
- `test/` — vitest suites (file resolver, folder resolver, CDN URL)
- `dist/` — tsdown output (`.mjs` + `.d.mts`); gitignored
- `PLAN.md` — original Japanese design doc, kept for context

## Commands

```bash
pnpm install
pnpm typecheck       # tsc --noEmit
pnpm test            # vitest run
pnpm build           # tsdown → dist/index.mjs + dist/index.d.mts
pnpm generate        # regenerate src/generated/*.ts from upstream tag
pnpm validate-icons  # fetch npm tarball, check every referenced SVG exists
pnpm lint            # biome lint
pnpm format          # biome format --write
```

## Workflow Expectations

- After editing source, run `pnpm typecheck && pnpm test && pnpm build` before declaring done.
- After bumping the upstream version: `pnpm generate` → `pnpm validate-icons` → `pnpm test` → update `metadata.upstreamVersion` consumers.
- Never hand-edit `src/generated/*.ts`; treat them like build artifacts that happen to be checked in.
- Internal relative imports must include the `.ts` extension (`./resolve.ts`, not `./resolve`). `tsconfig.json` enables `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`; tsdown rewrites them at build time.

## Generator Setup

- Generator requires a local clone of `material-extensions/vscode-material-icon-theme`.
- Default path: `~/dev/oss/vscode-material-icon-theme`. Override with `MATERIAL_ICON_THEME_REPO=/path/to/clone`.
- Generator reads `<repo>/package.json` to get the upstream version, then runs `git worktree add --detach` at tag `v<version>`, imports `src/core/icons/{fileIcons,folderIcons}.ts` from that worktree, and removes the worktree on exit. **Do not point it at upstream `main`** — HEAD often contains unreleased icons whose SVGs aren't yet on the CDN. Override the ref with `MATERIAL_ICON_THEME_REF=<tag-or-sha>` only when you know what you're doing.

## Codebase Rules

- File resolver order: `fileNamesWithPath[parent/basename]` → `fileNames[basename]` → `fileExtensions[longest…shortest]` → fallback. All keys lowercase.
- Folder resolver order: `rootFolderNames[basename]` → `folderNames[basename]` → fallback. Keys are pre-expanded with the upstream `extendFolderNames` rule (`name`, `.name`, `_name`, `-name`, `__name__`).
- The `-open` suffix for expanded folders is appended only at filename construction in `resolve.ts#makeResult`; map values store the bare icon name.
- Icons with `clone: { ... }` in upstream are **skipped** by the generator — upstream generates those SVGs at runtime and they aren't published in the npm package. Don't try to add them back.
- Default `activeIconPack` is `"angular"` (matches upstream `defaultConfig`). Icons gated by other packs (vue, react, qwik, …) are excluded.
- VS Code language IDs are not used. Custom icon associations, light/highContrast variants, and clone icons are intentionally out of scope (see `PLAN.md` §4).

## Safety / Gotchas

- `package.json#exports` points at `dist/index.mjs` / `dist/index.d.mts` because tsdown emits `.mjs`. If you change the build extension, update `exports` to match.
- pnpm needs `pnpm.onlyBuiltDependencies: ["esbuild"]` in `package.json` to allow esbuild's postinstall (used by tsx and tsdown). Removing it makes `pnpm install` fail with `ERR_PNPM_IGNORED_BUILDS`.
- `tsdown.config.ts` has `minify: true` for size; debugging the bundle requires reading source instead.
- Default `version` in `ResolveMaterialIconOptions` is pinned to `metadata.upstreamVersion`, not `latest`. Users opt into `latest` explicitly. Don't change this default — the generated association table only matches the pinned version's SVG inventory.
- The validator fetches the tarball from `registry.npmjs.org` directly (it does not call `npm pack`, which previously hit local cache permission issues).
