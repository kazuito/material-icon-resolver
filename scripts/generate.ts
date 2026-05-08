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
  const rootFolderNames: Record<string, string> = {};

  for (const icon of theme.icons ?? []) {
    if (!isEnabled(icon)) continue;
    for (const raw of icon.folderNames ?? []) {
      for (const v of folderNameVariants(raw)) {
        folderNames[v.toLowerCase()] = icon.name;
      }
    }
    for (const raw of icon.rootFolderNames ?? []) {
      for (const v of folderNameVariants(raw)) {
        rootFolderNames[v.toLowerCase()] = icon.name;
      }
    }
  }
  // folderNamesExpanded / rootFolderNamesExpanded share the keys but the
  // caller appends `-open` to filename. We keep the value identical to the
  // regular map for consistency.
  return {
    folderNames,
    folderNamesExpanded: { ...folderNames },
    rootFolderNames,
    rootFolderNamesExpanded: { ...rootFolderNames },
  };
}

function sortRecord(r: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(r).sort()) out[k] = r[k] as string;
  return out;
}

function serializeRecord(name: string, r: Record<string, string>): string {
  const sorted = sortRecord(r);
  const lines = Object.entries(sorted).map(
    ([k, v]) => `\t${JSON.stringify(k)}: ${JSON.stringify(v)},`,
  );
  return `export const ${name}: Record<string, string> = {\n${lines.join("\n")}\n};\n`;
}

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
    serializeRecord("fileNames", fileMaps.fileNames) +
    "\n" +
    serializeRecord("fileNamesWithPath", fileMaps.fileNamesWithPath) +
    "\n" +
    serializeRecord("fileExtensions", fileMaps.fileExtensions) +
    "\n" +
    serializeRecord("languageIds", languageIds) +
    "\n" +
    `export const defaultFile = ${JSON.stringify(fileIcons.defaultIcon.name)};\n`;

  const folderIconsTs =
    header +
    serializeRecord("folderNames", folderMaps.folderNames) +
    "\n" +
    serializeRecord("folderNamesExpanded", folderMaps.folderNamesExpanded) +
    "\n" +
    serializeRecord("rootFolderNames", folderMaps.rootFolderNames) +
    "\n" +
    serializeRecord(
      "rootFolderNamesExpanded",
      folderMaps.rootFolderNamesExpanded,
    ) +
    "\n" +
    `export const defaultFolder = ${JSON.stringify(theme.defaultIcon.name)};\n` +
    `export const defaultRootFolder = ${JSON.stringify(theme.rootFolder?.name ?? "folder-root")};\n`;

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
  console.log(
    `folderNames=${Object.keys(folderMaps.folderNames).length} ` +
      `rootFolderNames=${Object.keys(folderMaps.rootFolderNames).length}`,
  );
  console.log("done");
}

void main();
