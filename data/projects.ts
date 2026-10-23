// Every number here must trace to a source a visitor can check; the
// `source` on each receipt is printed as fine print. Every visual is a
// recording of the real app (see `loop`): no static product images.

export type ProjectStatus = "live" | "in-review";

export interface Receipt {
  /** The value, e.g. "30,000+" or "5.0". */
  value: string;
  /** What the value is, e.g. "US high schools covered". */
  label: string;
  /** Where a visitor can verify it. */
  source: string;
}

export interface Loop {
  webm: string;
  mp4: string;
  /** First frame of the same recording, for reduced motion and before play. */
  poster: string;
  width: number;
  height: number;
  /** Seconds. */
  seconds: number;
  /** Printed under the panel: which build, how, when. */
  provenance: string;
  alt: string;
}

export interface Project {
  slug: string;
  name: string;
  /** Takeaway headline. */
  headline: string;
  /** One or two sentences. */
  line: string;
  status: ProjectStatus;
  /** First public release, or the App Store submission date. */
  date: string;
  /** Spec strip: key → value, in order. */
  spec: [string, string][];
  receipts: Receipt[];
  links: { label: string; url: string }[];
  loop: Loop;
}

export const projects: Project[] = [
  {
    slug: "yonmoku",
    name: "Yonmoku: 3D Four in a Row",
    headline: "Four in a row, in three dimensions.",
    line:
      "Sixteen pegs, beads that stack from the bottom, 76 lines to watch at once. A quiet pass-and-play board game at a low table in a ryokan at dusk. No account, no ads, no network.",
    status: "in-review",
    date: "2026-10-19",
    spec: [
      ["Platform", "iPhone · iPad"],
      ["Engine", "Unity 6 · C#"],
      ["Players", "2, one device"],
      ["Status", "In App Store review"],
    ],
    receipts: [
      { value: "76", label: "winning lines on a 4×4×4 board", source: "the rules of the game" },
      { value: "64", label: "cells, 16 pegs of 4", source: "the rules of the game" },
      { value: "1.0.0", label: "build submitted to App Review, 2026-10-19", source: "App Store Connect; this line changes when Apple approves it" },
    ],
    links: [{ label: "Support site", url: "https://jjfisherdev.github.io/yonmoku-site/" }],
    loop: {
      webm: "/video/yonmoku-loop.webm",
      mp4: "/video/yonmoku-loop.mp4",
      poster: "/video/yonmoku-loop.webp",
      width: 604,
      height: 1314,
      seconds: 14,
      provenance: "Recorded from the 1.0.0 simulator build, 2026-10-23: the last four plies, the handoffs, the win",
      alt: "Yonmoku gameplay: beads lifted from the dish and dropped onto pegs, the camera easing home at each handoff, then the win card.",
    },
  },
  {
    slug: "squeeze",
    name: "Squeeze: The Estimation Duel",
    headline: "Bet how close you can get. Two players, one phone.",
    line:
      "A real question appears. Bet how close you can get (“±300 feet”), squeeze the claim tighter, or call your rival's bluff and make them prove it. A bridge in the clouds, a fox and a dog. Version 2.0 rebuilt the world in Unity.",
    status: "live",
    date: "2026-08-31",
    spec: [
      ["Platform", "iPhone · iPad"],
      ["Engine", "Unity 6 · C# (2.0) · SwiftUI (1.x)"],
      ["Players", "2, one device"],
      ["Languages", "EN · FR"],
    ],
    receipts: [
      { value: "5.0", label: "App Store rating, 2 ratings", source: "Apple iTunes Lookup API, US storefront, 2026-10-23" },
      { value: "2.0", label: "released 2026-10-23, a full rebuild of the 1.x game", source: "Apple iTunes Lookup API, US storefront, 2026-10-23" },
      { value: "EN · FR", label: "two languages, iPhone and iPad", source: "Apple iTunes Lookup API, US storefront, 2026-10-23" },
    ],
    links: [{ label: "App Store", url: "https://apps.apple.com/us/app/squeeze-the-estimation-duel/id6803632348" }],
    loop: {
      webm: "/video/squeeze-loop.webm",
      mp4: "/video/squeeze-loop.mp4",
      poster: "/video/squeeze-loop.webp",
      width: 660,
      height: 1434,
      seconds: 13,
      provenance: "Recorded from the 2.0 (17) simulator build, the commit the App Store build came from, 2026-10-23: the dog calls above, the reveal lands at 1,083 feet",
      alt: "Squeeze 2.0 gameplay: the dog calls the bluff and picks above, the fox's window sits on the bridge, the reveal lands inside it at 1,083 feet.",
    },
  },
  {
    slug: "vitality-weeks",
    name: "Vitality Weeks",
    headline: "Your life in 4,680 weeks, one square each.",
    line:
      "A grid of every week you have lived and every week ahead. A short reflection each week, a message to yourself that opens in 52 weeks, and a fact each week about someone who did something remarkable at your exact age.",
    status: "live",
    date: "2026-03-06",
    spec: [
      ["Platform", "iPhone"],
      ["Stack", "SwiftUI · WidgetKit · StoreKit"],
      ["Languages", "5"],
      ["Status", "Live"],
    ],
    receipts: [
      { value: "5.0", label: "App Store rating, 4 ratings", source: "Apple iTunes Lookup API, US storefront, 2026-10-23" },
      { value: "1.3.4", label: "current version, updated 2026-08-20", source: "Apple iTunes Lookup API, US storefront, 2026-10-23" },
      { value: "~12,000", label: "age-matched facts in 5 languages", source: "the app's App Store description" },
    ],
    links: [{ label: "App Store", url: "https://apps.apple.com/us/app/vitality-weeks/id6759621537" }],
    loop: {
      webm: "/video/vtw-loop.webm",
      mp4: "/video/vtw-loop.mp4",
      poster: "/video/vtw-loop.webp",
      width: 602,
      height: 1310,
      seconds: 12,
      provenance: "Recorded from the 1.3.4 simulator build with the app's default profile, 2026-10-23: the grid, a reflection, the fact card",
      alt: "Vitality Weeks: the 52-column grid of weeks with lived weeks filled in, a week tooltip, the reflections row and an At Your Age fact card.",
    },
  },
  {
    slug: "highschooltrends",
    name: "HighSchoolTrends.org",
    headline: "Rankings for 30,000+ high schools, with the trend, not just the rank.",
    line:
      "U.S. News publishes a number once a year. This shows how it moved across up to twelve editions for every state, city and school, free, with the sourcing rule printed under every chart.",
    status: "live",
    date: "2025-08-26",
    spec: [
      ["Platform", "Web"],
      ["Stack", "React · TypeScript · Cloudflare Workers · SQL"],
      ["Status", "Live"],
      ["Since", "2025"],
    ],
    receipts: [
      { value: "30,000+", label: "US high schools covered", source: "highschooltrends.org home page, 2026-10-23" },
      { value: "12", label: "editions of trend data", source: "highschooltrends.org home page, 2026-10-23" },
      { value: "675", label: "schools ranked in Illinois alone", source: "highschooltrends.org/schools/by-state/IL, 2026-10-23" },
    ],
    links: [{ label: "highschooltrends.org", url: "https://highschooltrends.org" }],
    loop: {
      webm: "/video/hst-loop.webm",
      mp4: "/video/hst-loop.mp4",
      poster: "/video/hst-loop.webp",
      width: 1280,
      height: 800,
      seconds: 14,
      provenance: "Recorded from the live Illinois page, 2026-10-23: the waffle, the state map, the biggest moves, the comparison bars",
      alt: "The live HighSchoolTrends Illinois page scrolling: a waffle of 675 ranked schools, a tile map of states, arrows for the biggest rank moves, comparison bars.",
    },
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
  for (const p of projects) for (const r of p.receipts) set.add(r.source);
  return Array.from(set);
}
