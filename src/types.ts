export type CdnProvider = "jsdelivr" | "unpkg";

export type IconType = "file" | "folder";

export type FallbackMode = "file" | "folder" | "none";

export type ResolveSource =
  | "fileNamesWithPath"
  | "fileNames"
  | "fileExtensions"
  | "languageIds"
  | "rootFolderNames"
  | "folderNames"
  | "default";

export type ResolveMaterialIconOptions = {
  type?: IconType;
  cdn?: CdnProvider;
  version?: string;
  fallback?: FallbackMode;
  open?: boolean;
  baseUrl?: string;
  languageId?: string;
};

export type ResolveByLanguageIdOptions = Omit<
  ResolveMaterialIconOptions,
  "type" | "open" | "languageId"
>;

export type ResolvedMaterialIcon = {
  name: string;
  filename: string;
  cdnUrl: string;
  type: IconType;
  source: ResolveSource;
};
