export const siteConfig = {
  domain: "jamesshin.tech",
  name: "James Shin",
  // One line, used in <title> suffixes and the OG image.
  role: "Builder",
  contactEmail: "contact@jamesshin.tech",
  socials: {
    // Set once a public showcase repo is pinned.
    github: null as string | null,
  },
  meta: {
    title: "James Shin — Builder",
    description:
      "I find a real need and ship the whole thing, alone: a rankings site for 30,000+ US high schools and three iOS apps, idea to App Store.",
  },
  // The date the numbers on the home page were last checked against their
  // sources. Bump it whenever data/projects.ts changes.
  numbersAsOf: "2026-10-23",
} as const;

export function absoluteUrl(path = "/"): string {
  return `https://${siteConfig.domain}${path}`;
}
