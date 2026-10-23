import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { absoluteUrl, siteConfig } from "@/data/config";
import { getAllPosts, getAdjacent, getPostBySlug, renderPostHtml } from "@/lib/writing";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  const url = absoluteUrl(`/writing/${post.slug}`);
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      url,
      publishedTime: post.date,
      authors: [siteConfig.name],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.summary },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const base = getPostBySlug(slug);
  if (!base) notFound();
  const post = await renderPostHtml(base);
  const { prev, next } = getAdjacent(slug);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: siteConfig.name, url: absoluteUrl() },
    publisher: { "@type": "Person", name: siteConfig.name, url: absoluteUrl() },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/writing/${post.slug}`) },
    wordCount: post.wordCount,
  };

  return (
    <div className="reader">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Nav current="writing" />
      <article>
        <header>
          <div className="wrap">
            <p className="eyebrow">
              {post.type}
              {post.framework ? ` · ${post.framework}` : ""}
            </p>
            <h1>{post.title}</h1>
            <p className="line" style={{ fontSize: 18, fontStyle: "italic" }}>
              {post.summary}
            </p>
            <p className="meta">
              {formatDate(post.date)} · {post.wordCount.toLocaleString("en-US")} words · {post.readingMinutes} min read
            </p>
          </div>
        </header>
        <div className="wrap">
          <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
        {(prev || next) && (
          <nav aria-label="More essays" style={{ borderTop: "1px solid var(--rule)" }}>
            <div className="wrap" style={{ paddingBlock: 32, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {next && (
                <Link href={`/writing/${next.slug}`} style={{ textDecoration: "none" }}>
                  <span className="meta">← Newer</span>
                  <h3 style={{ fontSize: 22 }}>{next.title}</h3>
                </Link>
              )}
              {prev && (
                <Link href={`/writing/${prev.slug}`} style={{ textDecoration: "none" }}>
                  <span className="meta">Older →</span>
                  <h3 style={{ fontSize: 22 }}>{prev.title}</h3>
                </Link>
              )}
            </div>
          </nav>
        )}
      </article>
      <Footer />
    </div>
  );
}
