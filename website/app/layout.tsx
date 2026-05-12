import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { siteConfig, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  category: "technology",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteUrl,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    creator: siteConfig.author.twitter,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: "en-US",
      publisher: { "@id": `${siteUrl}/#person` },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/try#webapp`,
      url: `${siteUrl}/try`,
      name: `${siteConfig.name} — Playground`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      inLanguage: "en-US",
      isPartOf: { "@id": `${siteUrl}/#website` },
      creator: { "@id": `${siteUrl}/#person` },
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": `${siteUrl}/#package`,
      name: siteConfig.shortName,
      codeRepository: siteConfig.repo,
      programmingLanguage: "TypeScript",
      license: "https://opensource.org/licenses/MIT",
      author: { "@id": `${siteUrl}/#person` },
      description: siteConfig.description,
      keywords: siteConfig.keywords.join(", "),
      url: siteConfig.npm,
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: schema.org JSON-LD must be serialized as raw JSON
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
