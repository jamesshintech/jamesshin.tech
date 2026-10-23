import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { VideoLoop } from "@/components/story/VideoLoop";
import { SqueezeRound } from "@/components/story/SqueezeRound";
import { absoluteUrl } from "@/data/config";
import { getProjects } from "@/data/projects";
import { getAllPosts } from "@/lib/writing";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function Home() {
  const projects = getProjects();
  const posts = getAllPosts();

  return (
    <>
      <Nav current="home" />

      <main id="work">
        <ol className="rows" aria-label="Products">
          {projects.map((p) => (
            <li key={p.slug} id={p.slug} className="row">
              <div className="media">
                <VideoLoop loop={p.loop} className={p.loop.width > p.loop.height ? "key" : "phone"} />
              </div>
              <div className="text">
                <h2 className="h">
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    {p.name}
                  </a>
                </h2>
                <p className="line">{p.tagline}</p>
                <p className="meta">
                  {p.status === "live" ? "Live" : "In App Store review"} · {formatDate(p.date)} ·{" "}
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    {new URL(p.url).hostname.replace(/^www\./, "")} ↗
                  </a>
                </p>
                {p.slug === "squeeze" && (
                  <details className="round-fold">
                    <summary className="btn ghost">Play a round</summary>
                    <SqueezeRound />
                  </details>
                )}
              </div>
            </li>
          ))}
        </ol>

        <section id="essays" className="sec" aria-labelledby="essays-h">
          <div className="g">
            <h2 id="essays-h" className="h">
              Essays
            </h2>
            <ul className="archive">
              {posts.map((e) => (
                <li key={e.slug}>
                  <Link href={`/writing/${e.slug}`}>
                    <span className="meta">
                      {formatDate(e.date)} · {e.readingMinutes} min
                    </span>
                    <h3 className="h" style={{ fontSize: "clamp(24px, 2.6vw, 34px)" }}>
                      {e.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
