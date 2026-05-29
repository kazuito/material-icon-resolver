---
name: bump-upstream
description: >-
  Safely bump the pinned upstream `vscode-material-icon-theme` version in this
  repo (material-icon-resolver) and regenerate the icon association data. Use
  this whenever the user asks to update, bump, upgrade, or sync the upstream /
  vendor / submodule version, regenerate icons, "update to the latest
  material-icon-theme", or mentions a new upstream release tag (e.g. "v5.35.0").
  Walks the full safe sequence: pin to a release tag (never main HEAD),
  regenerate, validate every SVG exists on the CDN, typecheck/test/build, and
  refresh stale version references in docs.
---

# Bump upstream version

This repo resolves VS Code Material Icon Theme icon names from a **pinned**
upstream version. The upstream lives as a git submodule at
`vendor/vscode-material-icon-theme`, and `src/generated/*.ts` is generated from
whatever tag that submodule points at. Bumping the version means moving the
submodule to a new release tag and regenerating — but doing it carelessly ships
icon names whose SVGs don't exist on the CDN, so the steps below exist to make
that impossible to miss.

Read `AGENTS.md` ("Generator Setup" and "Safety / Gotchas") if you need deeper
background; this skill is the operational checklist.

## The one rule that matters most

**Always pin to a release tag, never `main` HEAD.** Upstream's `main` regularly
contains unreleased icons whose SVGs aren't published to npm/the CDN yet. The
generated association table would then point at filenames that 404. The
`validate-icons` step (below) is the safety net that catches this, but choosing
a tag in the first place is what keeps you out of trouble.

## Workflow

Run these in order. Stop and surface the problem if any step fails — don't
paper over it.

### 1. Read the current state

```bash
git submodule status
grep upstreamVersion src/generated/metadata.ts
```

Note the currently pinned version (e.g. `5.34.0`). You'll use it later to find
stale doc references.

### 2. Fetch tags and pick the target version

```bash
cd vendor/vscode-material-icon-theme && git fetch --tags --quiet
git tag --sort=-v:refname | head -15
```

The top entry is the latest release tag. Unless the user named a specific
version, the target is the latest tag. Confirm the choice with the user if
there's any ambiguity (e.g. a fresh major bump, or several new tags since the
current pin).

> Bash note: the tool's working directory persists between calls and `cd`-ing
> into the submodule leaves you there. Use absolute paths, or `cd` back to the
> repo root before running repo-level commands — don't assume you're still at
> the root after stepping into the submodule.

### 3. Check out the tag and stage the submodule pointer

```bash
git checkout v<new-version>          # inside the submodule
git describe --tags                  # confirm it landed
```

Then from the repo root:

```bash
git add vendor/vscode-material-icon-theme
git submodule status                 # should show (v<new-version>)
```

### 4. Regenerate the association data

```bash
pnpm generate
```

Watch the output:
- It prints the version and submodule commit it read, plus row counts
  (`fileNames=… folderNames=…`). Sanity-check the version matches your target.
- **If it warns that a new language id in upstream `languageIcons.ts` is not
  referenced**, you must add that id to `scripts/language-id-extensions.ts`
  (mapping it to the right file extensions / fileNames) before continuing,
  otherwise those files lose their icon. A warning about ids that *we* have but
  upstream doesn't reference is harmless — that's the reverse direction.
- Never hand-edit `src/generated/*.ts`. They're build artifacts.

### 5. Validate every referenced SVG exists — the critical gate

```bash
pnpm validate-icons
```

This fetches the **published** `material-icon-theme@<new-version>` tarball from
the npm registry and asserts every SVG name the generated tables reference
actually exists in it. A clean run looks like `OK: <N> icon filenames present`.

**If this fails**, the tag you picked has association entries pointing at SVGs
that aren't published yet (often a sign you grabbed something too bleeding-edge,
or upstream renamed/removed an icon). Do not proceed. Re-pin to an earlier
release tag, or report the specific missing filenames to the user.

### 6. Typecheck, test, build

```bash
pnpm typecheck && pnpm test && pnpm build
```

All three must pass. Tests include CDN-URL assertions; if a test now fails
because an icon mapping legitimately changed upstream, update the test to the
new expected value — but confirm the change is real (check the generated data),
don't just rewrite the assertion to make it green.

### 7. Refresh stale version references in docs

The default `version` in the public API is pinned to the new
`metadata.upstreamVersion`, so any documentation example that shows **default**
output now prints an outdated version string. Find them:

```bash
grep -rn "<old-version>" README.md src/ --include="*.ts" --include="*.md"
```

Update references in:
- `README.md` — default-output examples
- `src/resolve.ts` — JSDoc `@example` blocks showing default output
- `src/cdn.ts` — JSDoc example + the `version` field doc (`e.g. "x.y.z"`)

**Leave test files alone** when they pass an explicit `version: "<old>"` — those
exercise explicit-version behavior and pass regardless of the literal value;
churning them adds noise without value.

### 8. Report

Summarize what changed: old → new version, the row counts and validate-icons
result, that typecheck/test/build passed, and which files changed (the submodule
pointer, the three generated files, and any doc/test edits). Don't commit unless
the user asks — and if you do, branch first if on `main` and stage the submodule
pointer along with the generated files.

## Quick reference: changed files after a clean bump

- `vendor/vscode-material-icon-theme` — submodule pointer
- `src/generated/{metadata,file-icons,folder-icons}.ts` — regenerated
- `README.md`, `src/resolve.ts`, `src/cdn.ts` — doc version strings (if any)

## Escape hatch

`MATERIAL_ICON_THEME_REPO=/path/to/clone pnpm generate` reads HEAD from an
external working copy instead of the submodule — useful for testing against a
local upstream branch. The caller is responsible for checking out a sensible
ref. The submodule + release-tag path is the normal one; reach for this only
when explicitly testing upstream changes that aren't tagged yet.
