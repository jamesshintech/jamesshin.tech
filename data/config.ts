export const siteConfig = {
  domain: "jamesshin.tech",
  name: "James Shin",
  // One line, used in <title> suffixes and the OG image.
  role: "Builder",
  contactEmail: "jjhlee92@gmail.com",
  // The essay the home page offers as a work sample.
  workSample: "2026-w43-billing-controls-from-checklists-to-harnesses",
  // Path or URL of the resume PDF; the link renders only when this is set.
  resumeUrl: null as string | null,
  socials: {
    github: "https://github.com/jamesshintech" as string | null,
    linkedin: "https://www.linkedin.com/in/jamesshin2",
  },
  meta: {
    title: "James Shin — Builder",
    description:
      "I build things and ship them. Four products, all live, and essays.",
  },
  // The date the numbers on the home page were last checked against their
  // sources. Bump it whenever data/projects.ts changes.
  numbersAsOf: "2026-10-31",
} as const;

export function absoluteUrl(path = "/"): string {
  return `https://${siteConfig.domain}${path}`;
}
