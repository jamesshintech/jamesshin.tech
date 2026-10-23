import Link from "next/link";
import type { ShippingEntry } from "@/lib/shipping-log";
import styles from "./ShippingStrip.module.css";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** The latest few shipping-log entries, for the home page. */
export function ShippingStrip({ entries }: { entries: ShippingEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className={styles.strip}>
      <ol className={styles.list} aria-label="Latest shipped changes">
        {entries.map((e) => (
          <li key={`${e.date}-${e.product}-${e.title}`} className={styles.row}>
            <span className={styles.date}>{formatDate(e.date)}</span>
            <span className={styles.product}>{e.product}</span>
            <span className={styles.title}>{e.title}</span>
          </li>
        ))}
      </ol>
      <Link href="/log" className={styles.more}>
        Full log →
      </Link>
    </div>
  );
}
