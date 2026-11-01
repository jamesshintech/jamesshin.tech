import Link from "next/link";
import { siteConfig } from "@/data/config";

// The colophon says how the site is made, in facts a reader can check: each
// claim links to the file that makes it true.
const colophon = [
  { label: "Scroll engine: one listener, one rAF", path: "components/home/ScrollStory.tsx" },
  { label: "Recordings from the shipped builds", path: "components/story/VideoLoop.tsx" },
  { label: "Design notes", path: "DESIGN.md" },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="g">
        <span>
          © {new Date().getFullYear()} {siteConfig.name}
        </span>
        <ul>
          <li>
            <a href={`mailto:${siteConfig.contactEmail}`}>Contact me</a>
          </li>
          <li>
            <a href={siteConfig.socials.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
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
        <ul className="colophon mono" aria-label="How this site is made">
          {colophon.map((c) => (
            <li key={c.path}>
              <a href={`${siteConfig.repo}/blob/main/${c.path}`} target="_blank" rel="noopener noreferrer">
                {c.label}
              </a>
            </li>
          ))}
          <li>No cookies, no analytics</li>
        </ul>
      </div>
    </footer>
  );
}
