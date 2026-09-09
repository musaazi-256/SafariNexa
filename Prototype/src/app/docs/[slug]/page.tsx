import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/page-hero";
import { DOC_META, readDoc, type DocSlug } from "@/lib/docs";

const SLUGS = Object.keys(DOC_META) as DocSlug[];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const meta = DOC_META[params.slug as DocSlug];
  if (!meta) return {};
  return { title: `${meta.title} - SafariNexa docs`, description: meta.description };
}

export default async function DocPage({ params }: { params: { slug: string } }) {
  const slug = params.slug as DocSlug;
  if (!SLUGS.includes(slug)) notFound();

  const meta = DOC_META[slug];
  const content = await readDoc(slug);

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6 max-w-4xl">
          <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> All docs
          </Link>
          <PageHero eyebrow="Engineering" title={meta.title} description={meta.description} />

          <article className="prose prose-slate max-w-none pb-12 prose-headings:font-extrabold prose-a:text-primary prose-table:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
