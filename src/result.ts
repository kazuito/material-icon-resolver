import { buildBaseUrl, buildCdnUrl } from "./cdn.ts";
import { metadata } from "./generated/metadata.ts";
import type {
  IconType,
  ResolvedMaterialIcon,
  ResolveMaterialIconOptions,
  ResolveSource,
} from "./types.ts";

export type Hit = { name: string; source: ResolveSource };

type ResultOptions = Pick<
  ResolveMaterialIconOptions,
  "baseUrl" | "cdn" | "version"
>;

export function makeResult(
  hit: Hit,
  type: IconType,
  open: boolean,
  options: ResultOptions,
): ResolvedMaterialIcon {
  const filename =
    type === "folder" && open ? `${hit.name}-open.svg` : `${hit.name}.svg`;
  const version = options.version ?? metadata.upstreamVersion;
  const cdnUrl = options.baseUrl
    ? buildBaseUrl(options.baseUrl, filename)
    : buildCdnUrl({ cdn: options.cdn ?? "jsdelivr", version, filename });
  return { name: hit.name, filename, cdnUrl, type, source: hit.source };
}
