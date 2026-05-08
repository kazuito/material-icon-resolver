export {
	MATERIAL_ICON_THEME_PACKAGE,
	buildBaseUrl,
	buildCdnUrl,
} from "./cdn.ts";
export { metadata } from "./generated/metadata.ts";
export {
	getMaterialIconCdnUrl,
	getMaterialIconName,
	resolveMaterialIcon,
	resolveMaterialIconByLanguageId,
} from "./resolve.ts";
export type {
	CdnProvider,
	FallbackMode,
	IconType,
	ResolveByLanguageIdOptions,
	ResolveMaterialIconOptions,
	ResolveSource,
	ResolvedMaterialIcon,
} from "./types.ts";
