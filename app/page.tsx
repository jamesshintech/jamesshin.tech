import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { VideoLoop } from "@/components/story/VideoLoop";
import { Threads } from "@/components/home/Threads";
import { Reveal } from "@/components/home/Reveal";
import { ScrollStory } from "@/components/home/ScrollStory";
import { absoluteUrl, siteConfig } from "@/data/config";
import { getProjects, type Project } from "@/data/projects";
import { getAllPosts } from "@/lib/writing";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
};

// The page is a story read at your own pace: chapter 0 is the name, the line,
// both work samples and the first product; chapters 1 to 3 are one product
// each; then the essays. Pinning is CSS (`position: sticky`) and only turns
// on when JavaScript runs and motion is wanted, so the class below is set
// before first paint (no layout shift once the engine loads), and taken off
// again if the engine never starts. Without it the chapters are plain
// stacked sections.
const PIN_GATE = `(function(){var d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: no-preference)").matches)return;d.classList.add("js-story");setTimeout(function(){if(!document.querySelector("[data-story][data-ready]"))d.classList.remove("js-story")},6000)})();`;

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

/** The entrance: each character (or word) rises once, staggered. CSS does the
    rest, so the text is there without JavaScript and under reduced motion. */
function Rise({ text, by, from = 0, each }: { text: string; by: "char" | "word"; from?: number; each: number }) {
  const words = text.split(" ");
  let i = 0;
  const delay = (): CSSProperties => ({ "--d": from + each * i++ } as CSSProperties);
  return (
    <>
      {words.map((word, w) => (
        <span key={w}>
          {w > 0 && " "}
          {by === "word" ? (
            <span className="rise-w" style={delay()}>
              {word}
            </span>
          ) : (
            <span className="rise-wd">
              {Array.from(word).map((ch, c) => (
                <span key={c} className="rise-c" style={delay()}>
                  {ch}
                </span>
              ))}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

/** A chapter title, one clipped piece per word for the scrubbed rise. A long
    word with dots breaks before its last dot ("HighSchoolTrends" ".org"). */
function TitleWords({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, w) => (
        <span key={w}>
          {w > 0 && " "}
          {(word.length > 12 ? word.split(/(?=\.[^.]+$)/) : [word]).map((part, k) => (
            <span key={k} className="sr-word">
              <span className="sr-piece">{part}</span>
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

/** A tagline, one span per word for the scrubbed text reveal. */
function RevealWords({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, w) => (
        <span key={w}>
          {w > 0 && " "}
          <span className="tr-word">{word}</span>
        </span>
      ))}
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

function Recording({ p, className = "", style }: { p: Project; className?: string; style?: CSSProperties }) {
  return (
    <figure className={`fig ${className}`.trim()} style={style}>
      <div className="frame">
        <VideoLoop loop={p.loop} className="ch-loop" href={p.url} />
        <div className="beam" aria-hidden="true" />
      </div>
    </figure>
  );
}

function Title({ p, id }: { p: Project; id: string }) {
  return (
    <h2 className="ch-name" id={id}>
      <a href={p.url} target="_blank" rel="noopener noreferrer">
        <TitleWords text={p.name} />
      </a>
    </h2>
  );
}

export default function Home() {
  const projects = getProjects();
  const [first, ...rest] = projects;
  const posts = getAllPosts();
  const total = pad2(projects.length);
  const chapterLinks = [
    ...projects.map((p) => ({ href: `#${p.slug}`, name: p.name, short: p.name.split(":")[0] })),
    { href: "#essays", name: "Essays", short: "Essays" },
  ];

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PIN_GATE }} />
      <Nav current="home" />
      <div className="progress" aria-hidden="true" />

      {/* The chapter rail: where you are, and every chapter one click away. */}
      <nav className="rail" aria-label="Chapters">
        <ol>
          {chapterLinks.map((c, i) => (
            <li key={c.href} data-rail={i} className={i === 0 ? "is-current" : undefined}>
              <a className="mono" href={c.href} aria-label={c.name}>
                {i < projects.length ? pad2(i + 1) : c.short}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main id="work">
        <div className="story" data-story>
          {/* Chapter 0: the name, the line, both work samples, the first product. */}
          <section id={first.slug} className="chapter c0 is-current" data-chapter tabIndex={-1} aria-labelledby="intro-h">
            <div className="chapter-inner">
              <svg className="grid-bg" aria-hidden="true">
                <defs>
                  <pattern id="gp" width="40" height="40" patternUnits="userSpaceOnUse" x="-1" y="-1">
                    <path d="M.5 40V.5H40" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#gp)" />
                <svg x="-1" y="-1" style={{ overflow: "visible" }}>
                  <rect strokeWidth="0" width="39" height="39" x="161" y="41" />
                  <rect strokeWidth="0" width="39" height="39" x="441" y="121" />
                  <rect strokeWidth="0" width="39" height="39" x="81" y="281" />
                  <rect strokeWidth="0" width="39" height="39" x="681" y="201" />
                </svg>
              </svg>
              <Threads className="threads" pauseWhenCovered />

              <div className="g chapter-grid">
                <div className="c0-a">
                  <h1 id="intro-h" className="c0-h" aria-label={siteConfig.name}>
                    <span aria-hidden="true">
                      <Rise text={siteConfig.name} by="char" each={0.03} />
                    </span>
                  </h1>
                  <p className="intro-line">
                    <Rise text={siteConfig.intro} by="word" from={0.15} each={0.02} />
                  </p>
                  <ul className="samples enter" style={{ "--d": 0.45 } as CSSProperties} aria-label="Work samples">
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
                          </li>
                        );
                      }
                      return (
                        <li key={s.href} className="sample">
                          <a href={s.href} className="btn" type="application/pdf">
                            <span className="sample-kind">
                              <span className="mono">Work sample</span>
                              <span className="mono">PDF, {s.pages} pages</span>
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

                <Recording p={first} className="enter" style={{ "--d": 0.3 } as CSSProperties} />

                <div className="c0-b">
                  <p className="ch-mark mono">01 of {total}</p>
                  <Title p={first} id={`${first.slug}-h`} />
                  <p className="tile-line ch-tag">
                    <RevealWords text={first.tagline} />
                  </p>
                  <Meta p={first} />
                </div>

                <nav className="contents enter" style={{ "--d": 0.6 } as CSSProperties} aria-label="Contents">
                  <p className="contents-h mono">Contents</p>
                  <ol>
                    {chapterLinks.map((c, i) => (
                      <li key={c.href} data-rail={i} className={i === 0 ? "is-current" : undefined}>
                        <a href={c.href}>
                          <span className="mono">{pad2(i + 1)}</span>
                          <span className="contents-name">{c.name}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </div>
          </section>

          {/* Chapters 1 to 3: one product each, the recording on alternating sides. */}
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
                        <p className="tile-line ch-tag">
                          <RevealWords text={p.tagline} />
                        </p>
                      </div>
                      <div className="ch-foot">
                        <Meta p={p} />
                        <a className="ch-next" href={next.href}>
                          <span className="mono">Next</span>
                          <span className="mono">{next.short}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          {/* Chapter 4: the essays. */}
          <section className="essays" id="essays" tabIndex={-1} aria-labelledby="essays-h">
            <div className="g essays-inner">
              <h2 id="essays-h" className="essays-h mono">
                Essays
              </h2>
              <Reveal as="ol" className="essay-list">
                {posts.map((e, i) => (
                  <li key={e.slug} className="essay">
                    <span className="mono">{pad2(i + 1)}</span>
                    <h3 className="essay-title">
                      <Link href={`/writing/${e.slug}`}>
                        <Chevroned text={e.title} />
                      </Link>
                    </h3>
                    <span className="mono">
                      {formatDate(e.date)} · {e.readingMinutes} min
                    </span>
                  </li>
                ))}
              </Reveal>
            </div>
          </section>
        </div>
      </main>

      <Reveal>
        <Footer />
      </Reveal>
      <ScrollStory />
    </>
  );
}
