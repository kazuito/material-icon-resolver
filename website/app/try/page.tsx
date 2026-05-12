import type { Metadata } from "next";
import { Suspense } from "react";
import { IconResolver } from "@/app/_components/icon-resolver";
import { siteConfig } from "@/lib/site";

const TRY_TITLE = "Online playground";
const TRY_DESCRIPTION =
  "Paste file or folder paths and instantly see which Material Icon Theme icon each one resolves to. Switch CDN, fallback strategy, version, and open-folder mode in real time.";

export const metadata: Metadata = {
  title: TRY_TITLE,
  description: TRY_DESCRIPTION,
  alternates: { canonical: "/try" },
  openGraph: {
    type: "website",
    url: "/try",
    siteName: siteConfig.name,
    title: `${TRY_TITLE} — ${siteConfig.name}`,
    description: TRY_DESCRIPTION,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${TRY_TITLE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TRY_TITLE} — ${siteConfig.name}`,
    description: TRY_DESCRIPTION,
    images: [siteConfig.ogImage],
  },
};

export default function TryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 sm:px-6">
      <h1 className="sr-only">
        Material Icon Resolver — interactive online playground
      </h1>
      <Suspense>
        <IconResolver />
      </Suspense>
    </main>
  );
}
