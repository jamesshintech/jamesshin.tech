import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { absoluteUrl, siteConfig } from "@/data/config";
import { getShippingLog, groupByMonth, type ShippingEntry } from "@/lib/shipping-log";

export const metadata: Metadata = {
  title: "Shipping log",
  description: `What ${siteConfig.name} shipped, by date, with the source for every entry.`,
  alternates: { canonical: absoluteUrl("/log") },
  openGraph: {
    title: `Shipping log — ${siteConfig.name}`,
    description: `What ${siteConfig.name} shipped, by date, with the source for every entry.`,
    url: absoluteUrl("/log"),
  },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function Entry({ e }: { e: ShippingEntry }) {
  const heading = e.url ? (
    <a href={e.url} target={e.url.startsWith("https://jamesshin.tech") ? undefined : "_blank"} rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      {e.title}
    </a>
  ) : (
    e.title
  );
  return (
    <li style={{ display: "grid", gridTemplateColumns: "5.5rem minmax(0, 1fr)", gap: "6px 18px", padding: "18px 0", borderTop: "1px solid var(--rule)" }}>
      <span className="meta" style={{ paddingTop: 6 }}>
        {formatDate(e.date)}
      </span>
      <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <span className="eyebrow" style={{ fontSize: 11 }}>
          {e.product}
          {e.version ? ` · v${e.version}` : ""}
          {e.ref ? ` · ${e.ref}` : ""}
        </span>
        <h3 style={{ fontSize: "clamp(20px, 2.4vw, 26px)", lineHeight: 1.15 }}>{heading}</h3>
        {e.body && (
          <p className="line" style={{ fontSize: 15 }}>
            {e.body}
          </p>
        )}
        <p className="src">{e.source}</p>
      </div>
    </li>
  );
}

export default function ShippingLogPage() {
  const entries = getShippingLog();
  const months = groupByMonth(entries);
  return (
    <div className="reader">
      <Nav current="log" />
      <header>
        <div className="wrap">
          <p className="eyebrow">Shipping log</p>
          <h1>What shipped, when.</h1>
          <p className="line">
            Every release note, merged change and essay since the first product, newest first. Each entry names where it
            comes from: App Store release notes, the product repositories, or this site. {entries.length} entries.
          </p>
        </div>
      </header>
      <main>
        <div className="wrap" style={{ maxWidth: 820, paddingBottom: 64 }}>
          {months.map((m) => (
            <section key={m.month} aria-labelledby={`m-${m.month}`} style={{ marginTop: 36 }}>
              <h2 id={`m-${m.month}`} style={{ fontSize: "clamp(26px, 3.4vw, 36px)", marginBottom: 8 }}>
                {m.label}
              </h2>
              <ol className="log" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {m.entries.map((e) => (
                  <Entry key={`${e.date}-${e.product}-${e.title}`} e={e} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
