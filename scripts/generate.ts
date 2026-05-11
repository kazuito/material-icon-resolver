#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { languageIdAssociations } from "./language-id-extensions.ts";

const DEFAULT_ACTIVE_ICON_PACK = "angular";
const FOLDER_THEME = "specific";
const SUBMODULE_PATH = "vendor/vscode-material-icon-theme";

function expandTilde(p: string): string {
  return p.startsWith("~") ? p.replace(/^~/, homedir()) : p;
}

function loadUpstream(sourceDir: string) {
  const fileIconsUrl = pathToFileURL(
    resolve(sourceDir, "src/core/icons/fileIcons.ts"),
  ).href;
  const folderIconsUrl = pathToFileURL(
    resolve(sourceDir, "src/core/icons/folderIcons.ts"),
  ).href;
  const languageIconsUrl = pathToFileURL(
    resolve(sourceDir, "src/core/icons/languageIcons.ts"),
  ).href;
  return Promise.all([
    import(fileIconsUrl) as Promise<{
      fileIcons: {
        defaultIcon: { name: string };
        icons: Array<{
          name: string;
          fileNames?: string[];
          fileExtensions?: string[];
          disabled?: boolean;
          enabledFor?: string[];
          clone?: unknown;
        }>;
      };
    }>,
    import(folderIconsUrl) as Promise<{
      folderIcons: Array<{
        name: string;
        defaultIcon: { name: string };
        rootFolder?: { name: string };
        icons?: Array<{
          name: string;
          folderNames?: string[];
          rootFolderNames?: string[];
          disabled?: boolean;
          enabledFor?: string[];
          clone?: unknown;
        }>;
      }>;
    }>,
    import(languageIconsUrl) as Promise<{
      languageIcons: Array<{
        name: string;
        ids: string[];
        disabled?: boolean;
        enabledFor?: string[];
        clone?: unknown;
      }>;
    }>,
  ]);
}

function isEnabled(icon: {
  disabled?: boolean;
  enabledFor?: string[];
  clone?: unknown;
}) {
  if (icon.disabled) return false;
  // Clone icons are dynamically generated at runtime by upstream and not
  // published as static SVGs, so they cannot be served from CDN.
  if (icon.clone !== undefined) return false;
  if (!icon.enabledFor) return true;
  return icon.enabledFor.includes(DEFAULT_ACTIVE_ICON_PACK);
}

const folderNameVariants = (n: string) => [
  n,
  `.${n}`,
  `_${n}`,
  `-${n}`,
  `__${n}__`,
];

function buildFileMaps(
  fileIcons: {
    icons: Array<{
      name: string;
      fileNames?: string[];
      fileExtensions?: string[];
      disabled?: boolean;
      enabledFor?: string[];
    }>;
  },
  languageIcons: Array<{
    name: string;
    ids: string[];
    disabled?: boolean;
    enabledFor?: string[];
    clone?: unknown;
  }>,
) {
  const fileNames: Record<string, string> = {};
  const fileNamesWithPath: Record<string, string> = {};
  const fileExtensions: Record<string, string> = {};

  for (const icon of fileIcons.icons) {
    if (!isEnabled(icon)) continue;
    for (const raw of icon.fileNames ?? []) {
      const key = raw.toLowerCase();
      if (key.includes("/")) fileNamesWithPath[key] = icon.name;
      else fileNames[key] = icon.name;
    }
    for (const raw of icon.fileExtensions ?? []) {
      const key = raw.toLowerCase();
      // Upstream occasionally registers full filenames here (e.g. ".ncurc.js").
      // The runtime lookup builds extension candidates without a leading dot,
      // so dotted keys would be unreachable in fileExtensions. Route them to
      // fileNames where they will actually match.
      if (key.startsWith(".")) {
        if (key.includes("/")) fileNamesWithPath[key] = icon.name;
        else fileNames[key] = icon.name;
      } else {
        fileExtensions[key] = icon.name;
      }
    }
  }

  // Merge in associations derived from VS Code language IDs.
  // Explicit fileExtensions / fileNames from fileIcons.ts take precedence.
  const seenLanguageIds = new Set<string>();
  const missingLanguageIds: string[] = [];
  for (const icon of languageIcons) {
    if (!isEnabled(icon)) continue;
    for (const id of icon.ids) {
      seenLanguageIds.add(id);
      const assoc = languageIdAssociations[id];
      if (!assoc) {
        missingLanguageIds.push(id);
        continue;
      }
      for (const raw of assoc.extensions ?? []) {
        const key = raw.toLowerCase();
        if (!(key in fileExtensions)) fileExtensions[key] = icon.name;
      }
      for (const raw of assoc.fileNames ?? []) {
        const key = raw.toLowerCase();
        if (key.includes("/")) {
          if (!(key in fileNamesWithPath)) fileNamesWithPath[key] = icon.name;
        } else if (!(key in fileNames)) {
          fileNames[key] = icon.name;
        }
      }
    }
  }

  // Warn about language IDs in our static map that upstream no longer references.
  const stale = Object.keys(languageIdAssociations).filter(
    (id) => !seenLanguageIds.has(id),
  );
  if (stale.length > 0) {
    console.warn(
      `note: ${stale.length} language id(s) in language-id-extensions.ts are not referenced by upstream languageIcons.ts: ${stale.join(", ")}`,
    );
  }
  if (missingLanguageIds.length > 0) {
    console.warn(
      `note: ${missingLanguageIds.length} upstream language id(s) have no entry in language-id-extensions.ts: ${[...new Set(missingLanguageIds)].sort().join(", ")}`,
    );
  }

  return { fileNames, fileNamesWithPath, fileExtensions };
}

function buildLanguageIdMap(
  languageIcons: Array<{
    name: string;
    ids: string[];
    disabled?: boolean;
    enabledFor?: string[];
    clone?: unknown;
  }>,
): Record<string, string> {
  const languageIds: Record<string, string> = {};
  for (const icon of languageIcons) {
    if (!isEnabled(icon)) continue;
    for (const id of icon.ids) {
      languageIds[id.toLowerCase()] = icon.name;
    }
  }
  return languageIds;
}

function buildFolderMaps(theme: {
  defaultIcon: { name: string };
  rootFolder?: { name: string };
  icons?: Array<{
    name: string;
    folderNames?: string[];
    rootFolderNames?: string[];
    disabled?: boolean;
    enabledFor?: string[];
  }>;
}) {
  const folderNames: Record<string, string> = {};

  // The `specific` theme produces no `rootFolderNames` today and the runtime
  // does not consult them. We deliberately don't ship them — re-add the
  // collection here if a future theme starts using them.
  for (const icon of theme.icons ?? []) {
    if (!isEnabled(icon)) continue;
    for (const raw of icon.folderNames ?? []) {
      for (const v of folderNameVariants(raw)) {
        folderNames[v.toLowerCase()] = icon.name;
      }
    }
  }
  return { folderNames };
}


// Folder-name compression --------------------------------------------------
//
// Most upstream folder names produce 5 sibling keys via `folderNameVariants`
// (bare, `.x`, `_x`, `-x`, `__x__`) that all map to the same icon. Storing
// them inflates the bundle ~5x for no information gain. We compress by
// extracting bases whose 5 variants survived to the FINAL map untouched
// (no overwrite by a different icon) and re-expanding at runtime.
//
// Behavior is byte-identical to a verbose map: a verifier below builds the
// expanded map from PACKED + EXTRAS and asserts deep equality with the
// source. If anything ever drifts, generation fails.

const VARIANT_PREFIX_SUFFIX: ReadonlyArray<readonly [string, string]> = [
  ["", ""],
  [".", ""],
  ["_", ""],
  ["-", ""],
  ["__", "__"],
];

// Forbidden characters in any packed key/value. Defensive — neither current
// upstream icon names nor any folder/file/extension/language id key contains
// these, but we route any future intruder to the EXTRAS map instead of
// silently corrupting the packed string.
const PACKED_DELIMITERS = /[,;:|]/;

function compressFolderNames(folderNames: Record<string, string>): {
  packed: string;
  extras: Record<string, string>;
} {
  const remaining = new Map(Object.entries(folderNames));
  const grouped = new Map<string, string[]>();

  // Sort base candidates so output is deterministic across runs.
  for (const base of [...remaining.keys()].sort()) {
    if (!remaining.has(base)) continue;
    if (PACKED_DELIMITERS.test(base)) continue;

    const icon = remaining.get(base);
    if (icon === undefined) continue;
    if (PACKED_DELIMITERS.test(icon)) continue;

    const variants = VARIANT_PREFIX_SUFFIX.map(
      ([pre, suf]) => `${pre}${base}${suf}`,
    );

    let allMatch = true;
    for (const v of variants) {
      if (remaining.get(v) !== icon) {
        allMatch = false;
        break;
      }
    }
    if (!allMatch) continue;

    for (const v of variants) remaining.delete(v);
    let list = grouped.get(icon);
    if (!list) {
      list = [];
      grouped.set(icon, list);
    }
    list.push(base);
  }

  const sortedGroups = [...grouped.entries()]
    .map(([icon, bases]) => [icon, [...bases].sort()] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const packed = sortedGroups
    .map(([icon, bases]) => `${icon}:${bases.join(",")}`)
    .join(";");

  const extrasSorted = [...remaining.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const extras: Record<string, string> = {};
  for (const [k, v] of extrasSorted) extras[k] = v;

  return { packed, extras };
}

function expandPacked(
  packed: string,
  extras: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (packed.length > 0) {
    for (const group of packed.split(";")) {
      const c = group.indexOf(":");
      const icon = group.slice(0, c);
      for (const base of group.slice(c + 1).split(",")) {
        for (const [pre, suf] of VARIANT_PREFIX_SUFFIX) {
          out[`${pre}${base}${suf}`] = icon;
        }
      }
    }
  }
  for (const k of Object.keys(extras)) out[k] = extras[k] as string;
  return out;
}

function assertCompressionRoundTrip(
  source: Record<string, string>,
  packed: string,
  extras: Record<string, string>,
): void {
  const rebuilt = expandPacked(packed, extras);
  const srcKeys = Object.keys(source).sort();
  const rebuiltKeys = Object.keys(rebuilt).sort();
  if (srcKeys.length !== rebuiltKeys.length) {
    throw new Error(
      `folderNames compression key-count mismatch: source=${srcKeys.length} rebuilt=${rebuiltKeys.length}`,
    );
  }
  for (let i = 0; i < srcKeys.length; i++) {
    if (srcKeys[i] !== rebuiltKeys[i]) {
      throw new Error(
        `folderNames compression key mismatch at index ${i}: source=${srcKeys[i]} rebuilt=${rebuiltKeys[i]}`,
      );
    }
  }
  for (const k of srcKeys) {
    if (source[k] !== rebuilt[k]) {
      throw new Error(
        `folderNames compression value mismatch for key="${k}": source=${source[k]} rebuilt=${rebuilt[k]}`,
      );
    }
  }
}

function serializeCompressedFolderNames(
  folderNames: Record<string, string>,
): string {
  const { packed, extras } = compressFolderNames(folderNames);
  assertCompressionRoundTrip(folderNames, packed, extras);

  const extrasLines = Object.entries(extras)
    .map(([k, v]) => `\t${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  const extrasBody = extrasLines.length > 0 ? `\n${extrasLines}\n` : "";

  return (
    "// PACKED stores bases whose 5 variants (bare, .x, _x, -x, __x__) all\n" +
    "// map to one icon — they are re-expanded at module load. EXTRAS holds\n" +
    "// any leftover keys that didn't fit the variant pattern. The runtime\n" +
    "// `folderNames` export is identical to the pre-compression source map.\n" +
    `const PACKED =\n\t${JSON.stringify(packed)};\n\n` +
    `const EXTRAS: Record<string, string> = {${extrasBody}};\n\n` +
    "const VARIANTS: ReadonlyArray<readonly [string, string]> = [\n" +
    '\t["", ""],\n' +
    '\t[".", ""],\n' +
    '\t["_", ""],\n' +
    '\t["-", ""],\n' +
    '\t["__", "__"],\n' +
    "];\n\n" +
    "function expandFolderNames(): Record<string, string> {\n" +
    "\tconst out: Record<string, string> = {};\n" +
    "\tif (PACKED.length > 0) {\n" +
    '\t\tfor (const group of PACKED.split(";")) {\n' +
    '\t\t\tconst c = group.indexOf(":");\n' +
    "\t\t\tconst icon = group.slice(0, c);\n" +
    '\t\t\tfor (const base of group.slice(c + 1).split(",")) {\n' +
    "\t\t\t\tfor (const [pre, suf] of VARIANTS) {\n" +
    "\t\t\t\t\tout[pre + base + suf] = icon;\n" +
    "\t\t\t\t}\n" +
    "\t\t\t}\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\tfor (const k of Object.keys(EXTRAS)) {\n" +
    "\t\tout[k] = EXTRAS[k] as string;\n" +
    "\t}\n" +
    "\treturn out;\n" +
    "}\n\n" +
    "export const folderNames: Record<string, string> = expandFolderNames();\n"
  );
}

// File-side map compression ------------------------------------------------
//
// fileNames, fileNamesWithPath, fileExtensions, languageIds all share the
// same shape: many keys collapse onto the same icon name (e.g. dozens of
// .babelrc.* files all → "babel"). We invert the map to
// `icon|key1,key2,...` groups joined by `;`. Identical icon names appear
// once, which both compresses raw bytes and gzips well.
//
// As with folder-name compression, a round-trip assertion fails the build
// if the rebuilt map ever drifts from the source, so this is provably
// lossless rather than merely hopefully so.

const VG_GROUP_SEP = ";";
const VG_KEY_SEP = ",";
const VG_ICON_SEP = "|";

function compressValueGrouped(source: Record<string, string>): {
  packed: string;
  extras: Record<string, string>;
} {
  const grouped = new Map<string, string[]>();
  const extras: Record<string, string> = {};

  for (const key of Object.keys(source).sort()) {
    const value = source[key] as string;
    if (PACKED_DELIMITERS.test(key) || PACKED_DELIMITERS.test(value)) {
      extras[key] = value;
      continue;
    }
    let list = grouped.get(value);
    if (!list) {
      list = [];
      grouped.set(value, list);
    }
    list.push(key);
  }

  const sortedGroups = [...grouped.entries()]
    .map(([icon, keys]) => [icon, [...keys].sort()] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const packed = sortedGroups
    .map(([icon, keys]) => `${icon}${VG_ICON_SEP}${keys.join(VG_KEY_SEP)}`)
    .join(VG_GROUP_SEP);

  return { packed, extras };
}

function expandValueGrouped(
  packed: string,
  extras: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (packed.length > 0) {
    for (const group of packed.split(VG_GROUP_SEP)) {
      const c = group.indexOf(VG_ICON_SEP);
      const icon = group.slice(0, c);
      for (const key of group.slice(c + 1).split(VG_KEY_SEP)) {
        out[key] = icon;
      }
    }
  }
  for (const k of Object.keys(extras)) out[k] = extras[k] as string;
  return out;
}

function assertValueGroupedRoundTrip(
  name: string,
  source: Record<string, string>,
  packed: string,
  extras: Record<string, string>,
): void {
  const rebuilt = expandValueGrouped(packed, extras);
  const srcKeys = Object.keys(source).sort();
  const rebuiltKeys = Object.keys(rebuilt).sort();
  if (srcKeys.length !== rebuiltKeys.length) {
    throw new Error(
      `${name} compression key-count mismatch: source=${srcKeys.length} rebuilt=${rebuiltKeys.length}`,
    );
  }
  for (let i = 0; i < srcKeys.length; i++) {
    if (srcKeys[i] !== rebuiltKeys[i]) {
      throw new Error(
        `${name} compression key mismatch at index ${i}: source=${srcKeys[i]} rebuilt=${rebuiltKeys[i]}`,
      );
    }
  }
  for (const k of srcKeys) {
    if (source[k] !== rebuilt[k]) {
      throw new Error(
        `${name} compression value mismatch for key="${k}": source=${source[k]} rebuilt=${rebuilt[k]}`,
      );
    }
  }
}

function serializeValueGrouped(
  exportName: string,
  packedConst: string,
  extrasConst: string,
  source: Record<string, string>,
): string {
  const { packed, extras } = compressValueGrouped(source);
  assertValueGroupedRoundTrip(exportName, source, packed, extras);

  const extrasLines = Object.entries(extras)
    .map(([k, v]) => `\t${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  const extrasBody = extrasLines.length > 0 ? `\n${extrasLines}\n` : "";

  return (
    `const ${packedConst} =\n\t${JSON.stringify(packed)};\n\n` +
    `const ${extrasConst}: Record<string, string> = {${extrasBody}};\n\n` +
    `export const ${exportName}: Record<string, string> = unpack(${packedConst}, ${extrasConst});\n`
  );
}

const FILE_ICONS_UNPACK_HELPER =
  "// Inverse of the value-grouped packed format used for the file-side maps.\n" +
  "// Each `;`-separated group is `icon|key1,key2,...`; EXTRAS holds keys that\n" +
  "// contained a delimiter and were stored verbatim. Behavior is identical to\n" +
  "// the verbose object literal these maps used to be.\n" +
  "function unpack(\n" +
  "\tpacked: string,\n" +
  "\textras: Record<string, string>,\n" +
  "): Record<string, string> {\n" +
  "\tconst out: Record<string, string> = {};\n" +
  "\tif (packed.length > 0) {\n" +
  '\t\tfor (const group of packed.split(";")) {\n' +
  '\t\t\tconst c = group.indexOf("|");\n' +
  "\t\t\tconst icon = group.slice(0, c);\n" +
  '\t\t\tfor (const key of group.slice(c + 1).split(",")) {\n' +
  "\t\t\t\tout[key] = icon;\n" +
  "\t\t\t}\n" +
  "\t\t}\n" +
  "\t}\n" +
  "\tfor (const k of Object.keys(extras)) {\n" +
  "\t\tout[k] = extras[k] as string;\n" +
  "\t}\n" +
  "\treturn out;\n" +
  "}\n";

function gitHeadCommit(repo: string): string {
  try {
    // `^{commit}` peels annotated tags so we always record a commit SHA.
    return execSync("git rev-parse HEAD^{commit}", { cwd: repo })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const repoRaw = process.env.MATERIAL_ICON_THEME_REPO;
  const repo = repoRaw ? expandTilde(repoRaw) : resolve(root, SUBMODULE_PATH);

  if (!existsSync(resolve(repo, "package.json"))) {
    throw new Error(
      `upstream repo not found at ${repo}.\n` +
        (repoRaw
          ? "Check MATERIAL_ICON_THEME_REPO points at a valid clone of vscode-material-icon-theme."
          : `Run 'git submodule update --init --recursive' to fetch ${SUBMODULE_PATH}.`),
    );
  }

  const upstreamPkg = JSON.parse(
    readFileSync(resolve(repo, "package.json"), "utf8"),
  ) as { version: string };

  const upstreamCommit = gitHeadCommit(repo);
  console.log(
    `upstream repo: ${repo}, version: ${upstreamPkg.version}, commit: ${upstreamCommit.slice(0, 12)}`,
  );

  const [{ fileIcons }, { folderIcons }, { languageIcons }] =
    await loadUpstream(repo);

  const fileMaps = buildFileMaps(fileIcons, languageIcons);
  const languageIds = buildLanguageIdMap(languageIcons);
  const theme = folderIcons.find((t) => t.name === FOLDER_THEME);
  if (!theme) throw new Error(`folder theme '${FOLDER_THEME}' not found`);
  const folderMaps = buildFolderMaps(theme);

  const generatedAt = new Date().toISOString();

  const header =
    "// AUTO-GENERATED by `pnpm generate`. Do not edit by hand.\n" +
    `// upstream: material-icon-theme@${upstreamPkg.version}\n\n`;

  const fileIconsTs =
    header +
    FILE_ICONS_UNPACK_HELPER +
    "\n" +
    serializeValueGrouped(
      "fileNames",
      "FILE_NAMES_PACKED",
      "FILE_NAMES_EXTRAS",
      fileMaps.fileNames,
    ) +
    "\n" +
    serializeValueGrouped(
      "fileNamesWithPath",
      "FILE_NAMES_WITH_PATH_PACKED",
      "FILE_NAMES_WITH_PATH_EXTRAS",
      fileMaps.fileNamesWithPath,
    ) +
    "\n" +
    serializeValueGrouped(
      "fileExtensions",
      "FILE_EXTENSIONS_PACKED",
      "FILE_EXTENSIONS_EXTRAS",
      fileMaps.fileExtensions,
    ) +
    "\n" +
    serializeValueGrouped(
      "languageIds",
      "LANGUAGE_IDS_PACKED",
      "LANGUAGE_IDS_EXTRAS",
      languageIds,
    ) +
    "\n" +
    `export const defaultFile = ${JSON.stringify(fileIcons.defaultIcon.name)};\n`;

  const folderIconsTs =
    header +
    serializeCompressedFolderNames(folderMaps.folderNames) +
    "\n" +
    `export const defaultFolder = ${JSON.stringify(theme.defaultIcon.name)};\n`;

  const metadataTs =
    header +
    "/**\n" +
    " * Provenance of the bundled icon lookup tables.\n" +
    " *\n" +
    " * `upstreamVersion` is also the default `version` used when building CDN\n" +
    " * URLs — it's the exact `material-icon-theme` release whose SVG inventory\n" +
    " * the lookup tables were generated against. Pinning to it (rather than\n" +
    " * `latest`) keeps resolved URLs and table entries in sync.\n" +
    " */\n" +
    "export const metadata = {\n" +
    `\t/** Upstream \`material-icon-theme\` release the tables were generated from. */\n` +
    `\tupstreamVersion: ${JSON.stringify(upstreamPkg.version)},\n` +
    `\t/** Full git commit SHA of the upstream release tag. */\n` +
    `\tupstreamCommit: ${JSON.stringify(upstreamCommit)},\n` +
    `\t/** Upstream GitHub repo, in \`owner/name\` form. */\n` +
    `\tupstreamRepo: ${JSON.stringify("material-extensions/vscode-material-icon-theme")},\n` +
    `\t/** ISO 8601 timestamp of when these tables were generated. */\n` +
    `\tgeneratedAt: ${JSON.stringify(generatedAt)},\n` +
    "} as const;\n";

  writeFileSync(resolve(root, "src/generated/file-icons.ts"), fileIconsTs);
  writeFileSync(resolve(root, "src/generated/folder-icons.ts"), folderIconsTs);
  writeFileSync(resolve(root, "src/generated/metadata.ts"), metadataTs);

  console.log(
    `fileNames=${Object.keys(fileMaps.fileNames).length} ` +
      `fileNamesWithPath=${Object.keys(fileMaps.fileNamesWithPath).length} ` +
      `fileExtensions=${Object.keys(fileMaps.fileExtensions).length} ` +
      `languageIds=${Object.keys(languageIds).length}`,
  );
  console.log(`folderNames=${Object.keys(folderMaps.folderNames).length}`);
  console.log("done");
}

void main();
