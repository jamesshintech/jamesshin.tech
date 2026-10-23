import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Lit, CountUp, ProgressBar } from "@/components/story/Motion";
import { Frame } from "@/components/story/Visuals";
import { BoardViewer } from "@/components/story/BoardViewer";
import { SqueezeRound } from "@/components/story/SqueezeRound";
import { siteConfig, absoluteUrl } from "@/data/config";
import { getProjects, getLiveCount, getInReviewCount, getUniqueSources, type Project } from "@/data/projects";
import { getLatestPosts } from "@/lib/writing";
import { getLatestShipping } from "@/lib/shipping-log";
import { ShippingStrip } from "@/components/story/ShippingStrip";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
};

/** Renders "*text*" inside a string as <em>. */
function Em({ text }: { text: string }) {
  const parts = text.split("*");
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part))}
    </>
  );
}

function statusLabel(p: Project): string {
  return p.status === "live" ? "Live" : "In review";
}

function year(iso: string): string {
  return iso.slice(0, 4);
}

export default function Home() {
  const projects = getProjects();
  const live = getLiveCount();
  const inReview = getInReviewCount();
  const [essay] = getLatestPosts(1);
  const sources = getUniqueSources();
  const shipping = getLatestShipping(5);

  return (
    <>
      <ProgressBar />
      <Nav current="home" />

      <Lit as="header" className="hero">
        <div className="wrap">
          <p className="eyebrow rise">
            {siteConfig.name} · {siteConfig.role}
          </p>
          <h1 className="rise d1">
            I ship the <em>whole</em> thing.
            <span className="h1-sub">Idea to App Store, alone.</span>
          </h1>
          <p className="line rise d2">
            {live} products live and {inReview} in App Store review: a rankings site that covers 30,000+ US high
            schools, and three iOS apps, each designed, built, tested and submitted by one person. The numbers
            below link to where they come from.
          </p>
          <ol className="ledger" aria-label="Projects on this page">
            {projects.map((p, i) => (
              <li key={p.slug} style={{ ["--d" as string]: `${i * 0.1}s` }}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <a href={`#${p.slug}`}>{p.name}</a>
                  <span className="meta">
                    {p.eyebrow.split(" · ").slice(0, 2).join(" · ")} · {year(p.date)}
                  </span>
                </span>
                <span className={`status ${p.status}`}>{statusLabel(p)}</span>
              </li>
            ))}
          </ol>
        </div>
      </Lit>

      <main id="work">
        {projects.map((p, i) => (
          <Lit key={p.slug} as="section" id={p.slug} className={`ch${i % 2 === 1 ? " flip" : ""}`} aria-labelledby={`${p.slug}-h`}>
            <span className="num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="wrap">
              <div className="text">
                <p className="eyebrow rise">{p.eyebrow}</p>
                <h2 id={`${p.slug}-h`} className="rise d1">
                  <Em text={p.headline} />
                </h2>
                <p className="line rise d2">{p.line}</p>
                <ul className="receipts">
                  {p.receipts.map((r, k) => (
                    <li key={r.label} style={{ ["--d" as string]: `${k * 0.12}s` }}>
                      <span className="n">
                        <CountUp text={r.value} />
                      </span>
                      <span className="k">{r.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="stack rise d4">
                  Built with <b>{p.stack.join(" · ")}</b>
                </p>
                <p className="links rise d4">
                  {p.links.map((l, k) => (
                    <a key={l.url} href={l.url} className={`btn${k === 0 ? " solid" : ""}`} target="_blank" rel="noopener noreferrer">
                      {l.label} ↗
                    </a>
                  ))}
                </p>
              </div>
              <figure className="panel">
                {p.slug === "yonmoku" ? (
                  <BoardViewer poster={p.frame} />
                ) : p.slug === "squeeze" ? (
                  <SqueezeRound />
                ) : (
                  <Frame frame={p.frame} phone={p.frame.height > p.frame.width} />
                )}
                <figcaption className="src">{p.visualSource}</figcaption>
              </figure>
            </div>
          </Lit>
        ))}

        <Lit as="section" id="shipping" className="ch" aria-labelledby="shipping-h">
          <div className="wrap" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            <div className="text">
              <p className="eyebrow rise">Shipping log</p>
              <h2 id="shipping-h" className="rise d1" style={{ fontSize: "clamp(26px, 3.4vw, 40px)" }}>
                What shipped lately, with the receipt for each line.
              </h2>
              <div className="rise d2">
                <ShippingStrip entries={shipping} />
              </div>
            </div>
          </div>
        </Lit>

        {essay && (
          <Lit as="section" id="writing" className="band" aria-labelledby="writing-h">
            <div className="wrap">
              <p className="eyebrow rise">Writing · {essay.type} · {essay.date.slice(0, 4)}</p>
              <h2 id="writing-h" className="rise d1">
                {essay.title}
              </h2>
              <p className="line rise d2">{essay.summary}</p>
              <p className="links rise d3">
                <Link href={`/writing/${essay.slug}`} className="btn">
                  Read it · {essay.readingMinutes} min
                </Link>
              </p>
            </div>
          </Lit>
        )}

        <Lit as="section" id="sources" className="foot" aria-labelledby="sources-h">
          <div className="wrap">
            <p className="eyebrow rise">Where these numbers come from</p>
            <h2 id="sources-h" className="rise d1" style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>
              Checked {siteConfig.numbersAsOf}. Every figure above has a source you can open.
            </h2>
            <dl className="rise d2">
              {sources.map((s) => (
                <div key={s}>
                  <dt>{s}</dt>
                  <dd>
                    {projects
                      .flatMap((p) => p.receipts.filter((r) => r.source === s).map((r) => `${p.name}: ${r.value} ${r.label}`))
                      .join(" · ")}
                  </dd>
                </div>
              ))}
              <div>
                <dt>What is not here</dt>
                <dd>
                  No download counts, revenue or traffic: I only publish numbers a visitor can verify without taking my word
                  for it. App Store ratings are shown with their count because two ratings are two ratings.
                </dd>
              </div>
            </dl>
          </div>
        </Lit>
      </main>

      <Footer />
    </>
  );
}
