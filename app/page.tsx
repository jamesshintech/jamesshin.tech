import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { StudyHome, type RoomItem } from "@/components/home/StudyHome";
import { absoluteUrl, siteConfig } from "@/data/config";
import { getProjects, type Project } from "@/data/projects";
import { getAllPosts } from "@/lib/writing";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
};

/** "4.1 MB": the size of a file under public/, read at build time so the label never drifts from the file. */
function fileSize(href: string): string {
  const bytes = fs.statSync(path.join(process.cwd(), "public", href)).size;
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} kB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

// Each product's object in the room.
const OBJECT: Record<string, RoomItem["key"]> = {
  yonmoku: "board",
  squeeze: "phone",
  "vitality-weeks": "weeks",
  highschooltrends: "map",
};

function productItem(p: Project): RoomItem {
  const key = OBJECT[p.slug];
  if (!key) throw new Error(`No object in the room for the project "${p.slug}"; add one to OBJECT in app/page.tsx and lib/room/scene.ts`);
  return {
    key,
    group: "products",
    kind: `${p.status === "live" ? "Live" : "In review"} · ${formatDate(p.date)} · ${p.platform}`,
    title: p.name,
    label: p.name.split(":")[0],
    line: p.tagline,
    href: p.url,
    linkType: "external",
    cta: p.platform === "iOS" ? "App Store" : "Visit the site",
    loop: p.loop,
  };
}

export default function Home() {
  const projects = getProjects();
  const posts = getAllPosts();

  const samples: RoomItem[] = siteConfig.workSamples.map((s) => {
    if (s.kind === "essay") {
      const post = posts.find((p) => p.slug === s.slug);
      if (!post) throw new Error(`The work sample essay "${s.slug}" is not published`);
      return {
        key: "essay",
        group: "samples",
        kind: `Essay · ${post.readingMinutes} min`,
        title: post.title,
        label: post.title.split(":")[0],
        line: post.summary,
        href: `/writing/${post.slug}`,
        linkType: "internal",
        cta: "Read the essay",
      };
    }
    return {
      key: "proposal",
      group: "samples",
      kind: `PDF · ${s.pages} pages · ${fileSize(s.href)}`,
      title: s.title,
      label: s.title.split(":")[0],
      line: s.note,
      href: s.href,
      linkType: "pdf",
      cta: "Open the PDF",
    };
  });

  const allLive = projects.every((p) => p.status === "live");

  return (
    <>
      <StudyHome
        name={siteConfig.name}
        role={siteConfig.role}
        intro={siteConfig.intro}
        items={[...samples, ...projects.map(productItem)]}
        productsHeading={allLive ? "Products, all live" : "Products"}
        contactEmail={siteConfig.contactEmail}
        linkedin={siteConfig.socials.linkedin}
        github={siteConfig.socials.github}
        year={new Date().getFullYear()}
      />
    </>
  );
}
