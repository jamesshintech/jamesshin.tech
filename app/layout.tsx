import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { siteConfig, absoluteUrl } from "@/data/config";
import "./globals.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
  adjustFontFallback: true,
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  variable: "--font-mono",
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
  sameAs: siteConfig.socials.github ? [siteConfig.socials.github] : [],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
