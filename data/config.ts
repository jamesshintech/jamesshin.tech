export type WorkSample =
  | { kind: "essay"; slug: string }
  | {
      kind: "pdf";
      title: string;
      href: string;
      pages: number;
      /** Provenance, printed under the link. Says what the document is and is not. */
      note: string;
    };

export const siteConfig = {
  domain: "jamesshin.tech",
  name: "James Shin",
  // One line: under the name on the home page, the Person JSON-LD jobTitle
  // and the OG image header. Generic by choice; the site never names an
  // employer (the owner's call, 2026-11-02).
  role: "Business and finance systems leader",
  contactEmail: "jjhlee92@gmail.com",
  // The line under the name on the home page.
  intro:
    "13 years in finance systems, from contract to ledger: order-to-cash, billing, the close and its controls. On the side, I build games and small apps.",
  // Offered on the home page, in this order. Each is a real document the
  // reader can open; a PDF carries a note saying where it came from.
  workSamples: [
    { kind: "essay", slug: "2026-w43-billing-controls-from-checklists-to-harnesses" },
    {
      kind: "pdf",
      title: "Finance Data Studio: a self-service front door for certified finance data",
      href: "/work/finance-data-studio.pdf",
      pages: 12,
      note: "Interview take-home, September 2026, built from public information.",
    },
  ] as WorkSample[],
  // The site's own source, linked from the footer colophon.
  repo: "https://github.com/jamesshintech/jamesshin.tech",
  socials: {
    github: "https://github.com/jamesshintech" as string | null,
    linkedin: "https://www.linkedin.com/in/jamesshin2",
  },
  meta: {
    title: "James Shin",
    description:
      "13 years in finance systems, from contract to ledger. On the side, games and small apps: four products, all live, and an essay.",
  },
  // The date the numbers on the home page were last checked against their
  // sources. Bump it whenever data/projects.ts changes.
  numbersAsOf: "2026-10-31",
} as const;

export function absoluteUrl(path = "/"): string {
  return `https://${siteConfig.domain}${path}`;
}

// The site-wide preview card (app/opengraph-image.tsx). A page that sets its
// own openGraph replaces the inherited one whole, image included, so pages
// that do must list it again.
export const ogImage = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: `${siteConfig.name} — ${siteConfig.role}`,
};

// The JS mark (the life-in-weeks grid, this week in amber): the Person
// JSON-LD image and the profile picture on X. Not drawn on the page.
export const markImage = absoluteUrl("/jamesshin-mark.png");
