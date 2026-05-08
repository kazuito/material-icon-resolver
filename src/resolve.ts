import { buildBaseUrl, buildCdnUrl } from "./cdn.ts";
import {
	defaultFile,
	fileExtensions,
	fileNames,
	fileNamesWithPath,
} from "./generated/file-icons.ts";
import {
	defaultFolder,
	folderNames,
	folderNamesExpanded,
	rootFolderNames,
	rootFolderNamesExpanded,
} from "./generated/folder-icons.ts";
import { metadata } from "./generated/metadata.ts";
import {
	getBasename,
	getExtensionCandidates,
	getParentName,
	normalizePath,
} from "./normalize.ts";
import type {
	ResolveMaterialIconOptions,
	ResolveSource,
	ResolvedMaterialIcon,
} from "./types.ts";

type Hit = { name: string; source: ResolveSource };

function lookupFile(path: string): Hit | null {
	const normalized = normalizePath(path);
	const basename = getBasename(normalized).toLowerCase();
	const parent = getParentName(normalized).toLowerCase();

	if (parent.length > 0) {
		const key = `${parent}/${basename}`;
		const hit = fileNamesWithPath[key];
		if (hit) return { name: hit, source: "fileNamesWithPath" };
	}

	const nameHit = fileNames[basename];
	if (nameHit) return { name: nameHit, source: "fileNames" };

	for (const ext of getExtensionCandidates(basename)) {
		const extHit = fileExtensions[ext];
		if (extHit) return { name: extHit, source: "fileExtensions" };
	}

	return null;
}

function lookupFolder(path: string, open: boolean): Hit | null {
	const normalized = normalizePath(path);
	const basename = getBasename(normalized).toLowerCase();
	if (basename.length === 0) return null;

	const rootMap = open ? rootFolderNamesExpanded : rootFolderNames;
	const rootHit = rootMap[basename];
	if (rootHit) return { name: rootHit, source: "rootFolderNames" };

	const folderMap = open ? folderNamesExpanded : folderNames;
	const folderHit = folderMap[basename];
	if (folderHit) return { name: folderHit, source: "folderNames" };

	return null;
}

function makeResult(
	hit: Hit,
	type: "file" | "folder",
	open: boolean,
	options: ResolveMaterialIconOptions,
): ResolvedMaterialIcon {
	const filename =
		type === "folder" && open ? `${hit.name}-open.svg` : `${hit.name}.svg`;
	const version = options.version ?? metadata.upstreamVersion;
	const cdnUrl = options.baseUrl
		? buildBaseUrl(options.baseUrl, filename)
		: buildCdnUrl({ cdn: options.cdn ?? "jsdelivr", version, filename });
	return { name: hit.name, filename, cdnUrl, type, source: hit.source };
}

export function resolveMaterialIcon(
	path: string,
	options?: ResolveMaterialIconOptions,
): ResolvedMaterialIcon | null {
	const opts = options ?? {};
	const type = opts.type ?? "file";
	const open = opts.open ?? false;

	const hit = type === "file" ? lookupFile(path) : lookupFolder(path, open);

	if (hit) return makeResult(hit, type, open, opts);

	const fallback = opts.fallback ?? type;
	if (fallback === "none") return null;

	if (fallback === "file") {
		return makeResult(
			{ name: defaultFile, source: "default" },
			"file",
			false,
			opts,
		);
	}

	return makeResult(
		{ name: defaultFolder, source: "default" },
		"folder",
		open,
		opts,
	);
}

export function getMaterialIconName(
	path: string,
	options?: ResolveMaterialIconOptions,
): string | null {
	return resolveMaterialIcon(path, options)?.name ?? null;
}

export function getMaterialIconCdnUrl(
	path: string,
	options?: ResolveMaterialIconOptions,
): string | null {
	return resolveMaterialIcon(path, options)?.cdnUrl ?? null;
}
