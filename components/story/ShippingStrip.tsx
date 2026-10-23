import type { ShippingEntry } from "@/lib/shipping-log";

/** Patch-notes rows: mono date, mono product, serif title; newest date in accent. */
export function PatchNotes({ entries, bodies = false }: { entries: ShippingEntry[]; bodies?: boolean }) {
  if (entries.length === 0) return null;
  const newest = entries[0]?.date;
  return (
    <ol className="patch" aria-label="Log">
      {entries.map((e) => (
        <li key={`${e.date}-${e.product}-${e.title}`}>
          <span className={`d${e.date === newest ? " now" : ""}`}>{e.date}</span>
          <span className="p">
            {e.product}
            {e.version ? ` ${e.version}` : ""}
            {e.ref ? ` #${e.ref}` : ""}
          </span>
          <span>
            <p className="t">
              {e.url ? (
                <a href={e.url} target="_blank" rel="noopener noreferrer">
                  {e.title}
                </a>
              ) : (
                e.title
              )}
            </p>
            {bodies && e.body && <p className="b">{e.body}</p>}
            {bodies && <p className="b mono" style={{ fontSize: 11, textTransform: "uppercase" }}>§ {e.source}</p>}
          </span>
        </li>
      ))}
    </ol>
  );
}
