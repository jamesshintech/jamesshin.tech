import Link from "next/link";
import { siteConfig } from "@/data/config";

type Current = "home" | "writing" | "log" | null;

export function Nav({ current = null }: { current?: Current }) {
  return (
    <nav className="nav" aria-label="Site">
      <div className="g">
        <Link href="/" className="brand lab">
          {siteConfig.name} · Players 1
        </Link>
        <ul>
          <li>
            <Link href="/#work" aria-current={current === "home" ? "page" : undefined}>
              Titles
            </Link>
          </li>
          <li>
            <Link href="/log" aria-current={current === "log" ? "page" : undefined}>
              Patch notes
            </Link>
          </li>
          <li>
            <Link href="/writing" aria-current={current === "writing" ? "page" : undefined}>
              Manual
            </Link>
          </li>
          <li>
            <a href={`mailto:${siteConfig.contactEmail}`}>Contact</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
