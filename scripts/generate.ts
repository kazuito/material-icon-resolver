#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { languageIdAssociations } from "./language-id-extensions.ts";

const DEFAULT_ACTIVE_ICON_PACK = "angular";
const FOLDER_THEME = "specific";

function expandTilde(p: string): string {
	return p.startsWith("~") ? p.replace(/^~/, homedir()) : p;
}

function checkoutWorktree(repo: string, ref: string): string {
	const worktree = mkdtempSync(resolve(tmpdir(), "mir-upstream-"));
	console.log(`adding worktree at ${ref} → ${worktree}`);
	execSync(`git -C ${repo} worktree add --detach ${worktree} ${ref}`, {
		stdio: "pipe",
	});
	return worktree;
}

function removeWorktree(repo: string, worktree: string): void {
	try {
		execSync(`git -C ${repo} worktree remove --force ${worktree}`, {
			stdio: "pipe",
		});
	} catch (err) {
		console.warn(`failed to remove worktree ${worktree}: ${String(err)}`);
	}
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
			fileExtensions[key] = icon.name;
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

function gitCommit(repo: string, ref: string): string {
	try {
		return execSync(`git rev-parse ${ref}`, { cwd: repo }).toString().trim();
	} catch {
		return "";
	}
}

async function main() {
	const repoRaw =
		process.env.MATERIAL_ICON_THEME_REPO ??
		"~/dev/oss/vscode-material-icon-theme";
	const repo = expandTilde(repoRaw);

	const upstreamPkg = JSON.parse(
		readFileSync(resolve(repo, "package.json"), "utf8"),
	) as { version: string };

	const ref = process.env.MATERIAL_ICON_THEME_REF ?? `v${upstreamPkg.version}`;
	console.log(
		`upstream repo: ${repo}, version: ${upstreamPkg.version}, checkout: ${ref}`,
	);

	const worktree = checkoutWorktree(repo, ref);
	let result: Awaited<ReturnType<typeof loadUpstream>>;
	try {
		result = await loadUpstream(worktree);
	} finally {
		removeWorktree(repo, worktree);
	}
	const [{ fileIcons }, { folderIcons }, { languageIcons }] = result;

	const fileMaps = buildFileMaps(fileIcons, languageIcons);
	const theme = folderIcons.find((t) => t.name === FOLDER_THEME);
	if (!theme) throw new Error(`folder theme '${FOLDER_THEME}' not found`);
	const folderMaps = buildFolderMaps(theme);

	const generatedAt = new Date().toISOString();
	const upstreamCommit = gitCommit(repo, ref);

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
		"export const metadata = {\n" +
		`\tupstreamVersion: ${JSON.stringify(upstreamPkg.version)},\n` +
		`\tupstreamCommit: ${JSON.stringify(upstreamCommit)},\n` +
		`\tupstreamRepo: ${JSON.stringify("material-extensions/vscode-material-icon-theme")},\n` +
		`\tgeneratedAt: ${JSON.stringify(generatedAt)},\n` +
		"} as const;\n";

	const root = resolve(import.meta.dirname, "..");
	writeFileSync(resolve(root, "src/generated/file-icons.ts"), fileIconsTs);
	writeFileSync(resolve(root, "src/generated/folder-icons.ts"), folderIconsTs);
	writeFileSync(resolve(root, "src/generated/metadata.ts"), metadataTs);

	console.log(
		`fileNames=${Object.keys(fileMaps.fileNames).length} ` +
			`fileNamesWithPath=${Object.keys(fileMaps.fileNamesWithPath).length} ` +
			`fileExtensions=${Object.keys(fileMaps.fileExtensions).length}`,
	);
	console.log(
		`folderNames=${Object.keys(folderMaps.folderNames).length} ` +
			`rootFolderNames=${Object.keys(folderMaps.rootFolderNames).length}`,
	);
	console.log("done");
}

void main();
