#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { metadata } from "../src/generated/metadata.ts";

const PACKAGE = "material-icon-theme";

async function loadGenerated() {
	const root = resolve(import.meta.dirname, "..");
	const file = await import(
		pathToFileURL(resolve(root, "src/generated/file-icons.ts")).href
	);
	const folder = await import(
		pathToFileURL(resolve(root, "src/generated/folder-icons.ts")).href
	);
	return { file, folder };
}

async function fetchIcons(version: string): Promise<Set<string>> {
	const dir = mkdtempSync(resolve(tmpdir(), "mir-validate-"));
	console.log(`fetching ${PACKAGE}@${version} into ${dir}`);

	const meta = (await (
		await fetch(`https://registry.npmjs.org/${PACKAGE}/${version}`)
	).json()) as { dist: { tarball: string } };
	const tarballUrl = meta.dist.tarball;

	const tarballPath = resolve(dir, "pkg.tgz");
	const buf = Buffer.from(await (await fetch(tarballUrl)).arrayBuffer());
	(await import("node:fs")).writeFileSync(tarballPath, buf);

	execSync(`tar -xzf ${tarballPath}`, { cwd: dir, stdio: "pipe" });
	const iconsDir = resolve(dir, "package", "icons");
	return new Set(readdirSync(iconsDir));
}

async function main() {
	const { file, folder } = await loadGenerated();
	const fileIconNames = new Set<string>([
		file.defaultFile,
		...Object.values<string>(file.fileNames),
		...Object.values<string>(file.fileNamesWithPath),
		...Object.values<string>(file.fileExtensions),
	]);
	const folderIconNames = new Set<string>([
		folder.defaultFolder,
		folder.defaultRootFolder,
		...Object.values<string>(folder.folderNames),
		...Object.values<string>(folder.rootFolderNames),
	]);

	const expectedFilenames = new Set<string>();
	for (const n of fileIconNames) expectedFilenames.add(`${n}.svg`);
	for (const n of folderIconNames) {
		expectedFilenames.add(`${n}.svg`);
		expectedFilenames.add(`${n}-open.svg`);
	}

	const present = await fetchIcons(metadata.upstreamVersion);

	const missing: string[] = [];
	for (const f of expectedFilenames) {
		if (!present.has(f)) missing.push(f);
	}

	if (missing.length > 0) {
		console.error(`missing ${missing.length} icon files:`);
		for (const m of missing.sort()) console.error(`  ${m}`);
		process.exit(1);
	}

	console.log(
		`OK: ${expectedFilenames.size} icon filenames present in ${PACKAGE}@${metadata.upstreamVersion}`,
	);
}

void main();
