import Link from "next/link";
import { siteConfig } from "@/data/config";

export function Footer() {
  return (
    <footer className="footer">
      <div className="g">
        <span>
          © {new Date().getFullYear()} {siteConfig.name}
        </span>
        <ul>
          <li>
            <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
          </li>
          {siteConfig.socials.github && (
            <li>
              <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
          )}
          <li>
            <Link href="/writing/rss.xml">RSS</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
