import type { CdnProvider } from "./types.ts";

export const MATERIAL_ICON_THEME_PACKAGE = "material-icon-theme";

export function buildCdnUrl(input: {
  cdn: CdnProvider;
  version: string;
  filename: string;
}): string {
  const { cdn, version, filename } = input;
  if (cdn === "unpkg") {
    return `https://unpkg.com/${MATERIAL_ICON_THEME_PACKAGE}@${version}/icons/${filename}`;
  }
  return `https://cdn.jsdelivr.net/npm/${MATERIAL_ICON_THEME_PACKAGE}@${version}/icons/${filename}`;
}

export function buildBaseUrl(baseUrl: string, filename: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${filename}`;
}
