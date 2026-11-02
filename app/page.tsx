import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { VideoLoop } from "@/components/story/VideoLoop";
import { ScrollStory } from "@/components/home/ScrollStory";
import { MotionToggle } from "@/components/home/MotionToggle";
import { absoluteUrl, siteConfig } from "@/data/config";
import { getProjects, type Project } from "@/data/projects";
import { getAllPosts } from "@/lib/writing";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
};

// The page is a story read at your own pace: chapter 0 is the name, the line,
// both work samples and the first product; chapters 1 to 3 are one product
// each; then the footer. Pinning is CSS (`position: sticky`) and only turns
// on when JavaScript runs and motion is wanted, so the class below is set
// before first paint (no layout shift once the engine loads), and taken off
// again if the engine never starts. Without it the chapters are plain
// stacked sections. It also restores the visitor's "pause motion" choice
// (lib/motion.ts) before first paint, so nothing starts moving and stops.
const PIN_GATE = `(function(){var d=document.documentElement;try{if(localStorage.getItem("motion-paused")==="1")d.setAttribute("data-motion","paused")}catch(e){}if(!matchMedia("(prefers-reduced-motion: no-preference)").matches)return;d.classList.add("js-story");setTimeout(function(){if(!document.querySelector("[data-story][data-ready]"))d.classList.remove("js-story")},6000)})();`;

/** "4.1 MB": the size of a file under public/, read at build time so the label never drifts from the file. */
function fileSize(href: string): string {
  const bytes = fs.statSync(path.join(process.cwd(), "public", href)).size;
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} kB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** The last word carries the chevron and never splits from it. A long last
    word with dots ("HighSchoolTrends.org") may break before a dot, never
    mid-word, so only its final part is pinned to the chevron. */
function Chevroned({ text }: { text: string }) {
  const words = text.split(" ");
  const last = words.pop() ?? "";
  const parts = last.length > 12 ? last.split(/(?=\.)/) : [last];
  const tail = parts.pop();
  return (
    <>
      {words.length > 0 && words.join(" ") + " "}
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          <wbr />
        </span>
      ))}
      <span className="nb">{tail}</span>
    </>
  );
}

function Meta({ p }: { p: Project }) {
  return (
    <p className="tile-meta mono">
      <span>{p.status === "live" ? "Live" : "In review"}</span>
      <span className="sep"> · </span>
      <span>{formatDate(p.date)}</span>
      <span className="sep"> · </span>
      <span>{p.platform}</span>
    </p>
  );
}

function Recording({ p }: { p: Project }) {
  return (
    <figure className="fig">
      <div className="frame">
        <VideoLoop loop={p.loop} className="ch-loop" href={p.url} />
      </div>
    </figure>
  );
}

function Title({ p, id }: { p: Project; id: string }) {
  return (
    <h2 className="ch-name" id={id}>
      <a href={p.url} target="_blank" rel="noopener noreferrer">
        <Chevroned text={p.name} />
      </a>
    </h2>
  );
}

export default function Home() {
  const projects = getProjects();
  const [first, ...rest] = projects;
  const posts = getAllPosts();
  const total = pad2(projects.length);
  const chapterLinks = projects.map((p) => ({ href: `#${p.slug}`, name: p.name, short: p.name.split(":")[0] }));

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PIN_GATE }} />
      <Nav current="home" />

      {/* The chapter rail: where you are, and every chapter one click away,
          including the way back to the intro and its work samples. Names show
          beside the numbers on wide screens and on hover or focus elsewhere;
          they are always in the accessible name. */}
      <nav className="rail" aria-label="Chapters">
        <ol>
          <li data-rail={-1} className="is-current">
            <a className="mono" href="#intro">
              <span className="rail-num">00</span> <span className="rail-name">Intro</span>
            </a>
          </li>
          {chapterLinks.map((c, i) => (
            <li key={c.href} data-rail={i}>
              <a className="mono" href={c.href}>
                <span className="rail-num">{pad2(i + 1)}</span> <span className="rail-name">{c.short}</span>
              </a>
            </li>
          ))}
        </ol>
        <MotionToggle className="rail-toggle" />
      </nav>

      <main id="main">
        <div className="story" id="work" data-story>
          {/* Chapter 0: the name, the line, both work samples, the first product. */}
          <section id={first.slug} className="chapter c0 is-current" data-chapter tabIndex={-1} aria-labelledby="intro-h">
            <div className="chapter-inner">
              <div className="g chapter-grid">
                <div className="c0-a" id="intro">
                  <h1 id="intro-h" className="c0-h">
                    {siteConfig.name}
                  </h1>
                  <p className="intro-line">{siteConfig.intro}</p>
                  <ul className="samples" aria-label="Work samples">
                    {siteConfig.workSamples.map((s) => {
                      if (s.kind === "essay") {
                        const post = posts.find((p) => p.slug === s.slug);
                        if (!post) return null;
                        return (
                          <li key={s.slug} className="sample">
                            <Link href={`/writing/${post.slug}`} className="btn">
                              <span className="sample-kind">
                                <span className="mono">Work sample</span>
                                <span className="mono">Essay · {post.readingMinutes} min</span>
                              </span>
                              <span className="sample-title">
                                <Chevroned text={post.title} />
                              </span>
                            </Link>
                            <p className="sample-note">{post.summary}</p>
                          </li>
                        );
                      }
                      return (
                        <li key={s.href} className="sample">
                          <a href={s.href} className="btn" type="application/pdf">
                            <span className="sample-kind">
                              <span className="mono">Work sample</span>
                              <span className="mono">
                                PDF · {s.pages} pages · {fileSize(s.href)}
                              </span>
                            </span>
                            <span className="sample-title">
                              <Chevroned text={s.title} />
                            </span>
                          </a>
                          <p className="sample-note">{s.note}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <nav className="contents" aria-label="Contents" data-wordcount="skip">
                  <div className="contents-head">
                    <p className="contents-h mono">Contents</p>
                    <MotionToggle className="contents-toggle" />
                  </div>
                  <ol>
                    {chapterLinks.map((c, i) => (
                      <li key={c.href} data-rail={i}>
                        <a href={c.href}>
                          <span className="mono">{pad2(i + 1)}</span>
                          <span className="contents-name">{c.name}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>

                <Recording p={first} />

                <div className="c0-b">
                  <p className="ch-mark mono">01 of {total}</p>
                  <Title p={first} id={`${first.slug}-h`} />
                  <p className="tile-line ch-tag">{first.tagline}</p>
                  <Meta p={first} />
                </div>
              </div>
            </div>
          </section>

          {/* Chapters 1 to 3: one product each, the recording on alternating
              sides; the last has no Next, the footer follows it. */}
          {rest.map((p, i) => {
            const next = chapterLinks[i + 2];
            return (
              <section
                key={p.slug}
                id={p.slug}
                className={`chapter ch${i % 2 === 1 ? " ch-right" : ""}`}
                data-chapter
                tabIndex={-1}
                aria-labelledby={`${p.slug}-h`}
              >
                <div className="chapter-inner">
                  <div className="g chapter-grid">
                    <Recording p={p} />
                    <div className="ch-copy">
                      <p className="ch-mark mono">
                        {pad2(i + 2)} of {total}
                      </p>
                      <div className="ch-body">
                        <Title p={p} id={`${p.slug}-h`} />
                        <p className="tile-line ch-tag">{p.tagline}</p>
                      </div>
                      <div className="ch-foot">
                        <Meta p={p} />
                        {next && (
                          <a className="ch-next" href={next.href}>
                            <span className="mono">Next</span>
                            <span className="mono">{next.short}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

        </div>
      </main>

      <Footer />
      <ScrollStory />
    </>
  );
}
