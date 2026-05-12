const FALLBACK_URL = "https://material-icon-resolver.vercel.app";

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_ENV === "production") {
    return FALLBACK_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return FALLBACK_URL;
}

export const siteConfig = {
  name: "Material Icon Resolver",
  shortName: "material-icon-resolver",
  tagline: "Resolve Material Icon Theme icons from any path",
  description:
    "Resolve Material Icon Theme icon names, filenames, and CDN URLs from any file path, folder path, or language id. Open-source TypeScript library with an interactive playground.",
  url: resolveBaseUrl(),
  ogImage: "/opengraph-image",
  locale: "en_US",
  author: {
    name: "Kazuma Ito",
    url: "https://github.com/kazuito",
    twitter: "@kzito",
  },
  repo: "https://github.com/kazuito/material-icon-resolver",
  npm: "https://www.npmjs.com/package/material-icon-resolver",
  keywords: [
    "material icon theme",
    "material icon resolver",
    "material icons",
    "vscode icons",
    "file icons",
    "folder icons",
    "icon resolver",
    "icon lookup",
    "file type icons",
    "folder type icons",
    "language id icons",
    "jsdelivr",
    "unpkg",
    "typescript",
    "javascript library",
    "npm package",
  ],
} as const;

export const siteUrl = siteConfig.url;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
