import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const WRITING_DIR = path.join(process.cwd(), "content", "essays");

export type WritingType = "essay";

export interface PostFrontmatter {
  slug: string;
  title: string;
  date: string;
  type: WritingType;
  summary: string;
  draft: boolean;
  framework?: string;
  /** Set when an essay is substantially rewritten after first publication. */
  revised?: string;
}

export interface Post extends PostFrontmatter {
  file: string;
  wordCount: number;
  readingMinutes: number;
  raw: string;
}

export interface PostWithHtml extends Post {
  html: string;
}

function requireField<K extends string>(obj: Record<string, unknown>, key: K, file: string): string {
  const v = obj[key];
  if (typeof v === "string" && v.length > 0) return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return String(v);
  throw new Error(`Missing required frontmatter field "${key}" in ${file}`);
}

function parseType(v: unknown, file: string): WritingType {
  if (v === "essay") return v;
  throw new Error(`Invalid "type" in ${file}: expected "essay", got ${JSON.stringify(v)}`);
}

export function wordCount(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    // Figures are diagram labels, not prose; other raw HTML contributes only its text.
    .replace(/<figure[\s\S]*?<\/figure>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\^[^\]]+\]:?/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function readOne(file: string): Post {
  return parsePost(file, fs.readFileSync(path.join(WRITING_DIR, file), "utf8"));
}

/** Validates frontmatter and derives word count and reading time. Throws, naming the file, on a missing field. */
export function parsePost(file: string, raw: string): Post {
  const { data, content } = matter(raw);

  const fm: PostFrontmatter = {
    slug: requireField(data, "slug", file),
    title: requireField(data, "title", file),
    date: requireField(data, "date", file),
    type: parseType(data.type, file),
    summary: requireField(data, "summary", file),
    draft: Boolean(data.draft),
    framework: typeof data.framework === "string" ? data.framework : undefined,
    revised: data.revised === undefined ? undefined : requireField(data, "revised", file),
  };

  const wc = wordCount(content);

  return {
    ...fm,
    file,
    wordCount: wc,
    readingMinutes: Math.max(1, Math.round(wc / 220)),
    raw: content,
  };
}

let cache: Post[] | null = null;

function loadAll(): Post[] {
  if (cache) return cache;
  if (!fs.existsSync(WRITING_DIR)) {
    cache = [];
    return cache;
  }
  const files = fs.readdirSync(WRITING_DIR).filter((f) => f.endsWith(".md"));
  const posts = files
    .map((f) => {
      try {
        return readOne(f);
      } catch (err) {
        if (process.env.NODE_ENV === "production") throw err;
        console.warn(`[writing] skipping ${f}:`, (err as Error).message);
        return null;
      }
    })
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  cache = posts;
  return cache;
}

export function getAllPosts(opts: { includeDrafts?: boolean } = {}): Post[] {
  const { includeDrafts = false } = opts;
  const posts = loadAll();
  return includeDrafts ? posts : posts.filter((p) => !p.draft);
}

export function getPostBySlug(slug: string, opts: { includeDrafts?: boolean } = {}): Post | null {
  const posts = getAllPosts(opts);
  return posts.find((p) => p.slug === slug) ?? null;
}

export function getAdjacent(slug: string): { prev: Post | null; next: Post | null } {
  const posts = getAllPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i < posts.length - 1 ? posts[i + 1] : null,
    next: i > 0 ? posts[i - 1] : null,
  };
}

type MdNode = { type: string; value?: string; children?: MdNode[] };

/**
 * Wraps every table in a focusable scroll region, so a wide table scrolls
 * inside the column on a phone instead of widening the page.
 */
export function remarkScrollableTables() {
  const wrap = (node: MdNode) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child) => {
      if (child.type !== "table") {
        wrap(child);
        return [child];
      }
      return [
        { type: "html", value: '<div class="table-scroll" role="region" aria-label="Table, scrolls sideways" tabindex="0">' },
        child,
        { type: "html", value: "</div>" },
      ];
    });
  };
  return (tree: MdNode) => wrap(tree);
}

const OPENS = /[\s([{\u2014\u2013/\u201c\u2018-]/;

/**
 * Typographer's quotes in prose: "a" becomes “a” and it's becomes it’s.
 * Straight quotes render as slanted closing marks in the site's grotesk, so a
 * quotation reads as ”a”. Only text nodes change: code,
 * inline code, raw HTML (the figures) and link targets keep their characters.
 * The character before a quote decides its side, carried across nodes in
 * document order so a quote that opens before *emphasis* still opens.
 */
export function remarkSmartQuotes() {
  let prev = " ";
  const curl = (text: string) => {
    let out = "";
    for (const ch of text) {
      if (ch === '"') out += OPENS.test(prev) ? "\u201c" : "\u201d";
      else if (ch === "'") out += OPENS.test(prev) ? "\u2018" : "\u2019";
      else out += ch;
      prev = ch;
    }
    return out;
  };
  const walk = (node: MdNode) => {
    if (node.type === "text" && typeof node.value === "string") node.value = curl(node.value);
    else if (node.type === "inlineCode" || node.type === "code") prev = "x";
    else if (node.type === "html") prev = " ";
    if (node.children) for (const child of node.children) walk(child);
    // A block ends a line of prose: the next quote opens.
    if (node.type === "paragraph" || node.type === "heading" || node.type === "listItem" || node.type === "tableCell") prev = " ";
  };
  return (tree: MdNode) => {
    prev = " ";
    walk(tree);
  };
}

export async function renderPostHtml(post: Post): Promise<PostWithHtml> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkSmartQuotes)
    .use(remarkScrollableTables)
    // Raw HTML is kept on purpose: essays are authored here (figures, the bottom-line box), never user input.
    .use(remarkHtml, { sanitize: false })
    .process(post.raw);
  // U+FE0E keeps the footnote back-arrow as text; iOS otherwise draws "↩" as an emoji.
  const html = String(processed).replace(/(class="data-footnote-backref">)↩/g, "$1↩︎");
  return { ...post, html };
}
