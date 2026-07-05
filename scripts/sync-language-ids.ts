#!/usr/bin/env tsx
// Regenerates scripts/generated/vscode-language-map.json from the
// `contributes.languages` sections of VS Code's built-in extensions at a
// pinned release tag. Bump VSCODE_TAG and re-run `pnpm sync-language-ids`
// to pick up new built-in language associations.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const VSCODE_TAG = "1.127.0";
const OUTPUT_PATH = "scripts/generated/vscode-language-map.json";

type LanguageContribution = {
  id?: string;
  extensions?: string[];
  filenames?: string[];
};

type VscodePackageJson = {
  contributes?: {
    languages?: LanguageContribution[];
  };
};

async function fetchJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    "User-Agent": "material-icon-resolver sync-language-ids",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function listBuiltinExtensionDirs(): Promise<string[]> {
  const entries = await fetchJson<Array<{ name: string; type: string }>>(
    `https://api.github.com/repos/microsoft/vscode/contents/extensions?ref=${VSCODE_TAG}`,
  );
  return entries.filter((e) => e.type === "dir").map((e) => e.name);
}

async function fetchExtensionManifest(
  dir: string,
): Promise<VscodePackageJson | null> {
  const url = `https://raw.githubusercontent.com/microsoft/vscode/${VSCODE_TAG}/extensions/${dir}/package.json`;
  try {
    return await fetchJson<VscodePackageJson>(url);
  } catch {
    // Some directories (e.g. shared build helpers) have no package.json.
    return null;
  }
}

async function main() {
  console.log(`vscode tag: ${VSCODE_TAG}`);
  const dirs = await listBuiltinExtensionDirs();
  console.log(`built-in extension dirs: ${dirs.length}`);

  const manifests = await Promise.all(dirs.map(fetchExtensionManifest));

  const extensionsById = new Map<string, Set<string>>();
  const fileNamesById = new Map<string, Set<string>>();

  for (const manifest of manifests) {
    for (const lang of manifest?.contributes?.languages ?? []) {
      if (!lang.id) continue;
      for (const raw of lang.extensions ?? []) {
        const ext = raw.replace(/^\./, "").toLowerCase();
        // A few built-ins sneak glob patterns into `extensions`
        // (e.g. `.*.log.?`); those can never match a lookup key.
        if (ext.length === 0 || /[*?]/.test(ext)) continue;
        let set = extensionsById.get(lang.id);
        if (!set) {
          set = new Set();
          extensionsById.set(lang.id, set);
        }
        set.add(ext);
      }
      for (const raw of lang.filenames ?? []) {
        if (raw.length === 0) continue;
        let set = fileNamesById.get(lang.id);
        if (!set) {
          set = new Set();
          fileNamesById.set(lang.id, set);
        }
        set.add(raw);
      }
    }
  }

  // Ids that contribute neither extensions nor filenames (match by
  // firstLine/patterns only) are omitted so the generator's fallback
  // logic still applies to them.
  const ids = [
    ...new Set([...extensionsById.keys(), ...fileNamesById.keys()]),
  ].sort();

  const languages: Record<
    string,
    { extensions?: string[]; fileNames?: string[] }
  > = {};
  for (const id of ids) {
    const entry: { extensions?: string[]; fileNames?: string[] } = {};
    const exts = extensionsById.get(id);
    if (exts) entry.extensions = [...exts].sort();
    const names = fileNamesById.get(id);
    if (names) entry.fileNames = [...names].sort();
    languages[id] = entry;
  }

  const root = resolve(import.meta.dirname, "..");
  const outPath = resolve(root, OUTPUT_PATH);
  mkdirSync(resolve(root, "scripts/generated"), { recursive: true });
  writeFileSync(
    outPath,
    `${JSON.stringify({ vscodeTag: VSCODE_TAG, languages }, null, 2)}\n`,
  );

  console.log(`wrote ${OUTPUT_PATH}: ${ids.length} language ids`);
}

void main();
