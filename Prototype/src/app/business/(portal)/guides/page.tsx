import Link from "next/link";
import { Plus, User } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";

export default async function GuidesPage() {
  const { businessId } = await requireBusinessSession();

  const guides = await db.guide.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHero
          variant="portal"
          eyebrow="Business portal"
          title="Guides"
          description="Manage guides that can be assigned to your tours."
        />
        <Button asChild>
          <Link href="/business/guides/new">
            <Plus className="mr-2 h-4 w-4" />
            Add guide
          </Link>
        </Button>
      </div>

      <div>
        {guides.length === 0 ? (
          <EmptyState
            title="No guides yet"
            description="Add your first guide to assign them to tours."
            action={
              <Button asChild variant="secondary">
                <Link href="/business/guides/new">Add guide</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Card key={guide.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {guide.photoUrl ? (
                      <img src={guide.photoUrl} alt={guide.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold leading-tight">{guide.name}</h3>
                      <p className="text-xs text-muted-foreground">{guide.specialization.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>{guide.experienceYears} years experience</p>
                    <p>{guide.languages.join(", ")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
