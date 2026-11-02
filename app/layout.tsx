import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { jsonLd } from "@/lib/json-ld";
import { siteConfig, absoluteUrl, markImage } from "@/data/config";
import "./globals.css";

// One grotesk for everything that is prose or a heading; one mono for
// anything that is a fact (dates, status, counts).
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-grotesk",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
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
  image: markImage,
  email: `mailto:${siteConfig.contactEmail}`,
  jobTitle: siteConfig.role,
  description: siteConfig.meta.description,
  sameAs: Object.values(siteConfig.socials).filter((url): url is string => Boolean(url)),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The home page adds a class (its pin gate) and maybe data-motion (the
    // visitor's saved pause) to <html> before first paint, so the client's
    // attributes never match the server's exactly.
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd) }} />
      </head>
      <body>
        {/* The first Tab stop: past the nav (and the home page's chapter rail) to the content. */}
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
