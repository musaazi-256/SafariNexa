import fs from "fs/promises";
import path from "path";

export type DocSlug = "changelog" | "overview";

export const DOC_META: Record<DocSlug, { title: string; description: string }> = {
  changelog: {
    title: "Engineering changelog",
    description: "What changed across the most recent active development sessions, commit by commit."
  },
  overview: {
    title: "Project documentation",
    description: "Every module, by portal — customer, business, and admin — with what's real versus simulated."
  }
};

/** Reads a doc's markdown source from content/docs. process.cwd() is the
 * Next.js project root at request time in both dev and a deployed build. */
export async function readDoc(slug: DocSlug): Promise<string> {
  const filePath = path.join(process.cwd(), "content", "docs", `${slug}.md`);
  return fs.readFile(filePath, "utf-8");
}
