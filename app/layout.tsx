import type { Metadata } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import localFont from "next/font/local";
import { jsonLd } from "@/lib/json-ld";
import { siteConfig, absoluteUrl } from "@/data/config";
import "./globals.css";

// Archivo carries two voices through its width axis: 125 for headlines,
// 80 for labels. Martian Mono sets anything that is a fact. Sentient
// (Fontshare, ITF Free Font License, self-hosted) is the reading face.
const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
  adjustFontFallback: true,
});

const martian = Martian_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-martian",
});

const sentient = localFont({
  src: [
    { path: "../public/fonts/sentient-400.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/sentient-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/sentient-500.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sentient",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  title: {
    default: siteConfig.meta.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.meta.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.meta.title,
    description: siteConfig.meta.description,
    url: absoluteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.meta.title,
    description: siteConfig.meta.description,
  },
  alternates: {
    canonical: absoluteUrl(),
    types: {
      "application/rss+xml": [{ url: absoluteUrl("/writing/rss.xml"), title: `${siteConfig.name} — Writing` }],
    },
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  url: absoluteUrl(),
  email: `mailto:${siteConfig.contactEmail}`,
  jobTitle: siteConfig.role,
  description: siteConfig.meta.description,
  sameAs: Object.values(siteConfig.socials).filter((url): url is string => Boolean(url)),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${martian.variable} ${sentient.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
