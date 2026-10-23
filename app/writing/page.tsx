import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { absoluteUrl, siteConfig } from "@/data/config";
import { getAllPosts } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Writing",
  description: `Essays by ${siteConfig.name}.`,
  alternates: { canonical: absoluteUrl("/writing") },
  openGraph: {
    title: `Writing — ${siteConfig.name}`,
    description: `Essays by ${siteConfig.name}.`,
    url: absoluteUrl("/writing"),
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function WritingIndex() {
  const posts = getAllPosts();
  return (
    <div className="reader">
      <Nav current="writing" />
      <header>
        <div className="wrap">
          <p className="eyebrow">Writing</p>
          <h1>Essays</h1>
          <p className="line">
            Long-form, with the number, the bet and the counter-argument in every piece.{" "}
            {posts.length} {posts.length === 1 ? "essay" : "essays"} ·{" "}
            <Link href="/writing/rss.xml">RSS</Link>
          </p>
        </div>
      </header>
      <main>
        <div className="wrap" style={{ paddingBottom: 64 }}>
          <ul className="archive">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/writing/${p.slug}`}>
                  <span className="meta">
                    {formatDate(p.date)} · {p.readingMinutes} min read
                    {p.framework ? ` · ${p.framework}` : ""}
                  </span>
                  <h2>{p.title}</h2>
                  <span className="line">{p.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
