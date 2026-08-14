"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ListingTab = {
  id: string;
  label: string;
};

export function ListingTabs({
  tabs,
  actionLabel,
  actionTargetId
}: {
  tabs: ListingTab[];
  actionLabel?: string;
  actionTargetId?: string;
}) {
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.id ?? "");

  const scrollTo = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-[64px] z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <nav className="flex h-full items-center gap-6 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollTo(tab.id)}
              className={cn(
                "relative h-full flex items-center px-1 text-muted-foreground hover:text-foreground transition-colors",
                activeTab === tab.id && "text-blue-600 font-bold"
              )}
            >
              {tab.label}
              {activeTab === tab.id ? (
                <span className="absolute bottom-0 left-0 right-0 h-1 rounded-t-md bg-blue-600" />
              ) : null}
            </button>
          ))}
        </nav>
        {actionLabel && actionTargetId && (
          <button
            onClick={() => scrollTo(actionTargetId)}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
