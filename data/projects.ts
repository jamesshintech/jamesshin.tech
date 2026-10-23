// Every number here must trace to a source a visitor can check. The
// `source` on each receipt is printed in the "Where these numbers come
// from" section of the home page, so do not add a receipt without one.

export type ProjectStatus = "live" | "in-review";

export interface Frame {
  /** Path under public/. A real frame of the product: an App Store listing image or a live-page capture. */
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface Receipt {
  /** The headline value, e.g. "30,000+" or "5.0★". */
  value: string;
  /** What the value is. */
  label: string;
  /** Where a visitor can verify it. */
  source: string;
}

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  slug: string;
  name: string;
  /** Small mono line above the headline: "iOS · GAME · AUG 2026". */
  eyebrow: string;
  /** The takeaway. Wrap one phrase in *asterisks* to set it in gold italic. */
  headline: string;
  /** One supporting sentence or two. */
  line: string;
  status: ProjectStatus;
  /** ISO date of the first public release, or of the App Store submission. */
  date: string;
  receipts: Receipt[];
  stack: string[];
  links: ProjectLink[];
  frame: Frame;
  /** Printed under the visual with a leading §. */
  visualSource: string;
}

export const projects: Project[] = [
  {
    slug: "highschooltrends",
    name: "HighSchoolTrends.org",
    eyebrow: "Education data · Web · 2025–",
    headline: "Rankings for *30,000+* high schools, with the trend, not just the rank.",
    line:
      "U.S. News publishes a number once a year. HighSchoolTrends.org shows how that number has moved across up to twelve editions, for every state, city and school, free, with the sourcing rule printed under every chart.",
    status: "live",
    date: "2025-08-26",
    receipts: [
      { value: "30,000+", label: "US high schools covered", source: "highschooltrends.org home page" },
      { value: "12", label: "editions of trend data", source: "highschooltrends.org home page" },
      { value: "675", label: "schools ranked in Illinois alone", source: "highschooltrends.org/schools/by-state/IL" },
    ],
    stack: ["React", "TypeScript", "Cloudflare Workers", "SQL"],
    links: [{ label: "highschooltrends.org", url: "https://highschooltrends.org" }],
    frame: {
      src: "/frames/highschooltrends.webp",
      width: 1200,
      height: 844,
      alt: "The Illinois page on highschooltrends.org: a waffle chart with one square per ranked school, 675 in all, coloured by national-rank tier.",
    },
    visualSource: "highschooltrends.org/schools/by-state/IL, captured 2026-10-23",
  },
  {
    slug: "vitality-weeks",
    name: "Vitality Weeks",
    eyebrow: "iOS · Lifestyle · Released March 2026",
    headline: "Your life in *4,680* weeks, one square each.",
    line:
      "A grid of every week you have lived and every week ahead. Write a short reflection each week, seal a message to yourself that opens in 52 weeks, and get a fact each week about someone who did something remarkable at your exact age.",
    status: "live",
    date: "2026-03-06",
    receipts: [
      { value: "5.0★", label: "App Store rating, 4 ratings", source: "Apple iTunes Lookup API, US storefront" },
      { value: "v1.3.4", label: "current version, updated Aug 2026", source: "Apple iTunes Lookup API, US storefront" },
      { value: "~12,000", label: "age-matched facts in 5 languages", source: "the app's App Store description" },
    ],
    stack: ["SwiftUI", "WidgetKit", "StoreKit"],
    links: [{ label: "App Store", url: "https://apps.apple.com/us/app/vitality-weeks/id6759621537" }],
    frame: {
      src: "/frames/vitality-weeks.webp",
      width: 560,
      height: 1214,
      alt: "Vitality Weeks home screen: a 52-column grid of weeks, lived weeks filled in, milestones marked, and a fact about Marie Curie at the user's age.",
    },
    visualSource: "App Store listing image, US storefront, 2026-10-23",
  },
  {
    slug: "squeeze",
    name: "Squeeze: The Estimation Duel",
    eyebrow: "iPhone + iPad · Game · 2.0 released October 2026",
    headline: "Bet how *close* you can get. Two players, one phone.",
    line:
      "A head-to-head estimation duel on a bridge in the clouds. A real question appears; you bet how close you can get (\"±300 feet\"), squeeze the claim tighter, or call your rival's bluff and make them prove it. Version 2.0 rebuilt the whole game world in Unity. Offline, no accounts.",
    status: "live",
    date: "2026-08-31",
    receipts: [
      { value: "2.0", label: "released 2026-10-23, a full rebuild of the 1.x SwiftUI game", source: "Apple iTunes Lookup API, US storefront" },
      { value: "5.0★", label: "App Store rating, 2 ratings", source: "Apple iTunes Lookup API, US storefront" },
      { value: "EN · FR", label: "two languages, iPhone and iPad", source: "Apple iTunes Lookup API, US storefront" },
    ],
    stack: ["Unity 6", "C#", "SwiftUI (1.x)"],
    links: [{ label: "App Store", url: "https://apps.apple.com/us/app/squeeze-the-estimation-duel/id6803632348" }],
    frame: {
      src: "/frames/squeeze.webp",
      width: 560,
      height: 1217,
      alt: "Squeeze 2.0: the question Height of the Eiffel Tower in feet above a bridge in the clouds, a 300-feet-wide window on the bridge, the fox and the dog on their platforms, and the buttons Lock it in and Hold · Call bluff.",
    },
    visualSource: "One round of the 2.0 rules, playable here with 60 of the game's facts. Frame: App Store listing image, US storefront, 2026-10-23",
  },
  {
    slug: "yonmoku",
    name: "Yonmoku: 3D Four in a Row",
    eyebrow: "iPhone + iPad · Game · Submitted October 2026",
    headline: "Four in a row, in *three* dimensions.",
    line:
      "Sixteen pegs, beads that stack from the bottom, and 76 lines to watch at once. A quiet pass-and-play board game set at a low table in a ryokan at dusk. No account, no ads, no network. In App Store review.",
    status: "in-review",
    date: "2026-10-19",
    receipts: [
      { value: "76", label: "winning lines on a 4×4×4 board", source: "the rules of the game; count the rows, columns, pillars and diagonals" },
      { value: "64", label: "cells, 16 pegs of 4", source: "the rules of the game" },
      { value: "1.0.0", label: "build submitted to App Review", source: "App Store Connect; this line changes when Apple approves it" },
    ],
    stack: ["Unity 6", "C#"],
    links: [{ label: "Support site", url: "https://jjfisherdev.github.io/yonmoku-site/" }],
    frame: {
      src: "/frames/yonmoku.webp",
      width: 560,
      height: 1218,
      alt: "Yonmoku mid-game: a hinoki board with sixteen pegs on a low table on tatami, dark and light beads stacked, the turn label reading Dark to play.",
    },
    visualSource: "The board, pegs and beads exported from the game's own Unity project. Click to load it; drag to orbit. Poster: a frame from the submitted build, 2026-10-12",
  },
];

export function getProjects(): Project[] {
  return projects;
}

export function getLiveCount(): number {
  return projects.filter((p) => p.status === "live").length;
}

export function getInReviewCount(): number {
  return projects.filter((p) => p.status === "in-review").length;
}

export function getUniqueSources(): string[] {
  const set = new Set<string>();
  for (const p of projects) {
    for (const r of p.receipts) set.add(r.source);
  }
  return Array.from(set);
}
