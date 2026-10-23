import { absoluteUrl, siteConfig } from "@/data/config";
import { getAllPosts, renderPostHtml } from "@/lib/writing";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const posts = getAllPosts();
  const rendered = await Promise.all(posts.slice(0, 50).map((p) => renderPostHtml(p)));

  const lastBuildDate = posts[0] ? new Date(posts[0].date).toUTCString() : new Date().toUTCString();

  const items = rendered
    .map((p) => {
      const url = absoluteUrl(`/writing/${p.slug}`);
      const pubDate = new Date(p.date).toUTCString();
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.summary)}</description>
      <category>${escapeXml(p.type)}</category>
      ${p.framework ? `<category>${escapeXml(p.framework)}</category>` : ""}
      <content:encoded>${cdata(p.html)}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} — Writing</title>
    <link>${absoluteUrl("/writing")}</link>
    <atom:link href="${absoluteUrl("/writing/rss.xml")}" rel="self" type="application/rss+xml" />
    <description>Essays by ${escapeXml(siteConfig.name)}.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
