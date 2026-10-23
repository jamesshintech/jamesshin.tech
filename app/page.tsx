import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Lit } from "@/components/story/Motion";
import { VideoLoop } from "@/components/story/VideoLoop";
import { BoardViewer } from "@/components/story/BoardViewer";
import { SqueezeRound } from "@/components/story/SqueezeRound";
import { PatchNotes } from "@/components/story/ShippingStrip";
import { siteConfig, absoluteUrl } from "@/data/config";
import { getProjects, getLiveCount, getInReviewCount, getUniqueSources, type Project } from "@/data/projects";
import { principles } from "@/data/principles";
import { getLatestPosts } from "@/lib/writing";
import { getLatestShipping } from "@/lib/shipping-log";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
};

function statusLabel(p: Project): string {
  return p.status === "live" ? "Live" : "In review";
}

export default function Home() {
  const projects = getProjects();
  const live = getLiveCount();
  const inReview = getInReviewCount();
  const [essay] = getLatestPosts(1);
  const sources = getUniqueSources();
  const shipping = getLatestShipping(5);
  const yonmoku = projects.find((p) => p.slug === "yonmoku")!;
  const squeeze = projects.find((p) => p.slug === "squeeze")!;

  return (
    <>
      <Nav current="home" />

      {/* The box front: headline, key art, spec strip. Pinned on wide screens;
          scrolling it poses the real board. */}
      <Lit as="header" className="hero pinned" id="top">
        <div className="stage">
          <div className="g top">
            <div className="copy">
              <h1 className="disp">I ship the whole thing.</h1>
              <p className="line" style={{ marginTop: 28, fontSize: 20 }}>
                Idea to App Store, alone. A rankings site for 30,000+ high schools and three iOS games, each designed,
                built, tested and submitted by one person. Every number below prints its source.
              </p>
              <p className="stampRow" style={{ margin: "24px 0 0" }}>
                <span className="stamp">Players: 1</span>
              </p>
            </div>
            <BoardViewer loop={yonmoku.loop} auto scrollPose />
          </div>
          <div className="g">
            <p className="spec" aria-label="Specifications">
              <span>
                <b>Players</b>1
              </span>
              <span>
                <b>Titles</b>
                {projects.length} · {live} live · {inReview} in review
              </span>
              <span>
                <b>Platforms</b>iOS · iPadOS · Web
              </span>
              <span>
                <b>Languages</b>EN · FR
              </span>
              <span>
                <b>Source</b>Apple iTunes Lookup API · {siteConfig.numbersAsOf}
              </span>
            </p>
          </div>
        </div>
      </Lit>

      <main id="work">
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Projects on this page">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <Lit as="section" id={p.slug} className={`ch${i % 2 === 1 ? " flip" : ""}`} aria-labelledby={`${p.slug}-h`}>
                <div className="g">
                  <div className="media">
                    {p.slug === "squeeze" ? (
                      <SqueezeRound />
                    ) : (
                      <VideoLoop loop={p.loop} className={p.loop.width > p.loop.height ? "key" : "phone"} />
                    )}
                    <p className="prov">
                      {p.slug === "squeeze" ? "One round of the 2.0 rules, playable here with 60 of the game's facts" : p.loop.provenance}
                    </p>
                  </div>
                  <div className="text">
                    <h2 id={`${p.slug}-h`} className="h">
                      {p.name}
                    </h2>
                    <p className="line" style={{ fontSize: 20 }}>
                      {p.headline}
                    </p>
                    <p className="line">{p.line}</p>
                    <p className="spec open">
                      {p.spec.map(([k, v]) => (
                        <span key={k}>
                          <b>{k}</b>
                          {v}
                        </span>
                      ))}
                      {!p.spec.some(([k]) => k === "Status") && (
                        <span>
                          <b>Status</b>
                          {statusLabel(p)}
                        </span>
                      )}
                    </p>
                    <p className="fine">
                      {p.receipts.map((r, k) => (
                        <span key={r.label}>
                          <b>{r.value}</b> {r.label}.{k < p.receipts.length - 1 ? " " : ""}
                        </span>
                      ))}{" "}
                      Sources: {Array.from(new Set(p.receipts.map((r) => r.source))).join("; ")}.
                    </p>
                    <p className="links">
                      {p.links.map((l) => (
                        <a key={l.url} href={l.url} className="btn" target="_blank" rel="noopener noreferrer">
                          {l.label} ↗
                        </a>
                      ))}
                      {p.slug === "squeeze" && (
                        <a href="#squeeze-loop" className="btn ghost">
                          Watch a round
                        </a>
                      )}
                    </p>
                    {p.slug === "squeeze" && (
                      <div id="squeeze-loop" style={{ scrollMarginTop: 60 }}>
                        <VideoLoop loop={squeeze.loop} className="phone" />
                        <p className="prov">{squeeze.loop.provenance}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Lit>
            </li>
          ))}
        </ol>

        <Lit as="section" id="notes" className="sec" aria-labelledby="notes-h">
          <div className="g">
            <p className="lab" style={{ margin: 0 }}>
              Manufacturer&apos;s notes
            </p>
            <h2 id="notes-h" className="h">
              How the work gets made.
            </h2>
            <ol className="notes">
              {principles.map((n) => (
                <li key={n.claim}>
                  <p className="claim">{n.claim}</p>
                  <p className="ev">{n.evidence}</p>
                </li>
              ))}
            </ol>
          </div>
        </Lit>

        <Lit as="section" id="patch" className="sec" aria-labelledby="patch-h">
          <div className="g">
            <p className="lab" style={{ margin: 0 }}>
              Patch notes
            </p>
            <h2 id="patch-h" className="h">
              What shipped, with the receipt for each line.
            </h2>
            <PatchNotes entries={shipping} />
            <p className="links">
              <Link href="/log" className="btn ghost">
                All entries
              </Link>
            </p>
          </div>
        </Lit>

        {essay && (
          <Lit as="section" id="manual" className="sec" aria-labelledby="manual-h">
            <div className="g split">
              <div className="aside">
                <p className="lab" style={{ margin: 0 }}>
                  Manual insert · essay · {essay.readingMinutes} min
                </p>
              </div>
              <div className="main">
                <h2 id="manual-h" className="h">
                  {essay.title}
                </h2>
                <p className="line">
                  <em>{essay.summary}</em>
                </p>
                <p className="links">
                  <Link href={`/writing/${essay.slug}`} className="btn ghost">
                    Read it
                  </Link>
                </p>
              </div>
            </div>
          </Lit>
        )}

        <section id="sources" className="sec" aria-labelledby="sources-h">
          <div className="g">
            <p className="lab" style={{ margin: 0 }}>
              Fine print
            </p>
            <h2 id="sources-h" className="h" style={{ fontSize: "clamp(22px, 2.6vw, 32px)" }}>
              Checked {siteConfig.numbersAsOf}. Every figure above has a source you can open.
            </h2>
            <p className="fine" style={{ maxWidth: "90ch" }}>
              {sources.map((s) => (
                <span key={s}>
                  <b>{s}:</b>{" "}
                  {projects
                    .flatMap((p) => p.receipts.filter((r) => r.source === s).map((r) => `${p.name} ${r.value} ${r.label}`))
                    .join("; ")}
                  . <br />
                </span>
              ))}
              <b>What is not here:</b> download counts, revenue or traffic. Only numbers a visitor can verify without
              taking my word for it; ratings carry their count because two ratings are two ratings. Every visual is a
              recording of the shipped build or the live model; nothing is a mock-up.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
