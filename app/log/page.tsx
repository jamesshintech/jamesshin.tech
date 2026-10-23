import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { PatchNotes } from "@/components/story/ShippingStrip";
import { absoluteUrl } from "@/data/config";
import { getShippingLog, groupByMonth } from "@/lib/shipping-log";

export const metadata: Metadata = {
  title: "Patch notes",
  description: "Every release note, merged change and essay since the first product, newest first, each with its source.",
  alternates: { canonical: absoluteUrl("/log") },
};

export default function LogPage() {
  const entries = getShippingLog();
  const months = groupByMonth(entries);
  return (
    <div className="reader">
      <Nav current="log" />
      <header>
        <div className="g">
          <p className="lab" style={{ margin: 0 }}>
            Patch notes
          </p>
          <h1 className="disp" style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}>
            What shipped, when.
          </h1>
          <p className="line">
            Every release note, merged change and essay since the first product, newest first. Each entry names where it
            comes from: App Store release notes, the product repositories, or this site. {entries.length} entries.
          </p>
        </div>
      </header>
      <main>
        <div className="g" style={{ paddingBottom: 64, maxWidth: 1100 }}>
          {months.map((m) => (
            <section key={m.month} style={{ marginTop: 40 }} aria-labelledby={`m-${m.month}`}>
              <h2 id={`m-${m.month}`} className="h" style={{ fontSize: 28, marginBottom: 12 }}>
                {m.label}
              </h2>
              <PatchNotes entries={m.entries} bodies />
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
