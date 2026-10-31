import Link from "next/link";
import { siteConfig } from "@/data/config";

type Current = "home" | "writing" | null;

export function Nav({ current = null }: { current?: Current }) {
  return (
    <nav className="nav" aria-label="Site">
      <div className="g">
        <Link href="/" className="brand lab">
          {siteConfig.name}
        </Link>
        <ul>
          <li>
            <Link href="/#work" aria-current={current === "home" ? "page" : undefined}>
              Work
            </Link>
          </li>
          <li>
            <Link href="/writing" aria-current={current === "writing" ? "page" : undefined}>
              Writing
            </Link>
          </li>
          <li className="nav-wide">
            <a href={siteConfig.socials.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={`mailto:${siteConfig.contactEmail}`}>Contact</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
