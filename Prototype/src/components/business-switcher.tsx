"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { setActiveBusiness } from "@/lib/actions";

export function BusinessSwitcher({
  businesses,
  activeBusinessId
}: {
  businesses: Array<{ id: string; name: string; type: string }>;
  activeBusinessId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const active = businesses.find((business) => business.id === activeBusinessId) ?? businesses[0];

  if (businesses.length === 0) return null;

  function handleSelect(businessId: string) {
    if (businessId === active?.id) return;
    startTransition(async () => {
      await setActiveBusiness(businessId);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={pending}>
        <SidebarMenuButton className="justify-between">
          <span className="flex min-w-0 items-center gap-2.5">
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col items-start">
              <span className="truncate text-sm font-bold leading-tight">{active?.name ?? "Select business"}</span>
              {businesses.length > 1 ? <span className="text-xs font-normal text-muted-foreground">{businesses.length} businesses</span> : null}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your businesses</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {businesses.map((business) => (
          <DropdownMenuItem key={business.id} onClick={() => handleSelect(business.id)}>
            <Building2 className="h-4 w-4" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">{business.name}</span>
              <span className="text-xs text-muted-foreground">{business.type}</span>
            </span>
            {business.id === active?.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
