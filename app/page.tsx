import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { VideoLoop } from "@/components/story/VideoLoop";
import { RoundDialog } from "@/components/story/RoundDialog";
import { absoluteUrl } from "@/data/config";
import { getProjects } from "@/data/projects";
import { getAllPosts } from "@/lib/writing";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
};

/** "HighSchoolTrends.org" may wrap before ".org", never mid-word. */
function breakable(name: string) {
  const parts = name.split(/(?=\.)/);
  return parts.map((part, i) => (
    <span key={i}>
      {i > 0 && <wbr />}
      {part}
    </span>
  ));
}

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
        <section className="g grid-wrap" aria-label="Products">
          <ol className="tiles">
            {projects.map((p) => (
              <li key={p.slug} id={p.slug} className="tile">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="tile-media" tabIndex={-1} aria-hidden="true">
                  <VideoLoop loop={p.loop} className="phone" />
                </a>
                <h2 className="tile-name">
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    {breakable(p.name)}
                  </a>
                </h2>
                <p className="tile-line">{p.tagline}</p>
                <p className="tile-meta">
                  {p.status === "live" ? "Live" : "In review"} · {formatDate(p.date)}
                </p>
                {p.slug === "squeeze" && <RoundDialog />}
              </li>
            ))}
          </ol>
        </section>

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
