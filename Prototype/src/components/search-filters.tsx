"use client";

import { useRouter, useSearchParams } from "next/navigation";

export const PRICE_RANGES = [
  { value: "under-200000", label: "Under UGX 200,000" },
  { value: "200000-600000", label: "UGX 200,000 – 600,000" },
  { value: "600000-1500000", label: "UGX 600,000 – 1,500,000" },
  { value: "above-1500000", label: "Above UGX 1,500,000" }
];

export const RATING_TIERS = [
  { value: "exceptional", label: "Exceptional 4.7+" },
  { value: "excellent", label: "Excellent 4.3+" },
  { value: "very-good", label: "Very good 3.8+" }
];

function CheckboxGroup({ title, param, options }: { title: string; param: "price" | "rating"; options: Array<{ value: string; label: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = new Set(searchParams.getAll(param));

  function toggle(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    params.delete(param);
    for (const item of next) params.append(param, item);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-foreground/90">
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function SearchFilters() {
  return (
    <>
      <CheckboxGroup title="Price range" param="price" options={PRICE_RANGES} />
      <CheckboxGroup title="Guest rating" param="rating" options={RATING_TIERS} />
    </>
  );
}
