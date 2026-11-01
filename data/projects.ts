// Four products. Each row on the home page is a recording of the real app,
// the product's own one-line description (its App Store listing or its
// site's meta description, not prose written for this page), and a link.

export type ProjectStatus = "live" | "in-review";
export type Platform = "iOS" | "Web";

export interface Loop {
  webm: string;
  mp4: string;
  /** First frame of the same recording, for reduced motion and before play. */
  poster: string;
  width: number;
  height: number;
  /** Seconds. */
  seconds: number;
  alt: string;
}

export interface Project {
  slug: string;
  name: string;
  /** One line, taken from the product's own listing. */
  tagline: string;
  status: ProjectStatus;
  platform: Platform;
  /** First public release, or the App Store submission date. */
  date: string;
  url: string;
  loop: Loop;
}

export const projects: Project[] = [
  {
    slug: "yonmoku",
    name: "Yonmoku: 3D Four in a Row",
    tagline: "Four in a row, in three dimensions. Two people, one phone.",
    status: "live",
    platform: "iOS",
    date: "2026-10-31",
    url: "https://apps.apple.com/us/app/yonmoku-3d-four-in-a-row/id6821935069",
    loop: {
      webm: "/video/yonmoku-loop.webm",
      mp4: "/video/yonmoku-loop.mp4",
      poster: "/video/yonmoku-loop.webp",
      width: 520,
      height: 1130,
      seconds: 39,
      alt: "A full game of Yonmoku: beads dropped onto the pegs one move at a time, the camera easing home at each handoff, until Dark wins.",
    },
  },
  {
    slug: "squeeze",
    name: "Squeeze: The Estimation Duel",
    tagline: "A head-to-head estimation duel for two players on one iPhone or iPad.",
    status: "live",
    platform: "iOS",
    date: "2026-08-31",
    url: "https://apps.apple.com/us/app/squeeze-the-estimation-duel/id6803632348",
    loop: {
      webm: "/video/squeeze-loop.webm",
      mp4: "/video/squeeze-loop.mp4",
      poster: "/video/squeeze-loop.webp",
      width: 660,
      height: 1434,
      seconds: 13,
      alt: "Squeeze 2.0 gameplay: the dog calls the bluff, the fox's window sits on the bridge, the reveal lands inside it.",
    },
  },
  {
    slug: "vitality-weeks",
    name: "Vitality Weeks",
    tagline: "Your life in weeks. See every week at a glance.",
    status: "live",
    platform: "iOS",
    date: "2026-03-06",
    url: "https://apps.apple.com/us/app/vitality-weeks/id6759621537",
    loop: {
      webm: "/video/vtw-loop.webm",
      mp4: "/video/vtw-loop.mp4",
      poster: "/video/vtw-loop.webp",
      width: 602,
      height: 1310,
      seconds: 12,
      alt: "Vitality Weeks: the grid of weeks with lived weeks filled in, a reflection row and an At Your Age fact card.",
    },
  },
  {
    slug: "highschooltrends",
    name: "HighSchoolTrends.org",
    tagline: "Free multi-year trend data for 30,000+ US high schools.",
    status: "live",
    platform: "Web",
    date: "2025-08-26",
    url: "https://highschooltrends.org",
    loop: {
      webm: "/video/hst-loop.webm",
      mp4: "/video/hst-loop.mp4",
      poster: "/video/hst-loop.webp",
      width: 392,
      height: 852,
      seconds: 16,
      alt: "The live HighSchoolTrends Illinois page on a phone, scrolling: a waffle of ranked schools, the top five, a tile map of states, rank-move arrows, sparklines.",
    },
  },
];

export function getProjects(): Project[] {
  return projects;
}
