"use client";

import * as React from "react";

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
        <nav className="selection-group">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              onClick={() => scrollTo(tab.id)}
              className="selection-control"
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {actionLabel && actionTargetId && (
          <button
            onClick={() => scrollTo(actionTargetId)}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
