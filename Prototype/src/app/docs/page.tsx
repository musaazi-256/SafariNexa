import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { DOC_META, type DocSlug } from "@/lib/docs";

export const metadata = {
  title: "Engineering docs - SafariNexa",
  description: "Internal engineering documentation: recent changes and a module-by-module project reference."
};

const SLUGS: DocSlug[] = ["changelog", "overview"];

export default function DocsIndexPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <PageHero
            eyebrow="Engineering"
            title="Docs"
            description="Internal reference for the engineering team — recent changes and a full module-by-module map of the platform."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {SLUGS.map((slug) => (
              <Link key={slug} href={`/docs/${slug}`}>
                <Card className="h-full transition-shadow hover:shadow-card-hover">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-foreground">{DOC_META[slug].title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{DOC_META[slug].description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
