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
  // One line, used in the Person JSON-LD and the OG image header.
  role: "Finance systems",
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
      note: "Written for an enterprise-architect interview at Reddit, September 2026, from public information.",
    },
  ] as WorkSample[],
  socials: {
    github: "https://github.com/jamesshintech" as string | null,
    linkedin: "https://www.linkedin.com/in/jamesshin2",
  },
  meta: {
    title: "James Shin",
    description:
      "13 years in finance systems, from contract to ledger. On the side, games and small apps: four products, all live, and essays.",
  },
  // The date the numbers on the home page were last checked against their
  // sources. Bump it whenever data/projects.ts changes.
  numbersAsOf: "2026-10-31",
} as const;

export function absoluteUrl(path = "/"): string {
  return `https://${siteConfig.domain}${path}`;
}
