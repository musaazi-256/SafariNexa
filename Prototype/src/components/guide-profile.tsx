import Link from "next/link";
import { Languages, Medal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GuideProfile({
  id,
  name,
  experienceYears,
  languages,
  bio
}: {
  id?: string;
  name: string;
  experienceYears: number;
  languages: string[];
  bio: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className="text-base">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Your guide</p>
          <h3 className="text-lg font-bold">{name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1">
              <Medal className="h-3.5 w-3.5" />
              {experienceYears} years guiding
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Languages className="h-3.5 w-3.5" />
              {languages.join(", ")}
            </Badge>
          </div>
          {id ? (
            <Link href={`/guides/${id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              View full profile
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
