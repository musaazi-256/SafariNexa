import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";

export const reviewInclude = {
  accommodation: { include: { roomTypes: { orderBy: { id: "asc" as const } }, addOns: { orderBy: { id: "asc" as const } } } },
  tour: true, restaurant: true, transport: true, destination: true
} satisfies Prisma.ListingInclude;

export function listingSnapshot(listing: Record<string, unknown>): Prisma.InputJsonObject {
  // Exclude operational state; approval applies to the submitted catalogue content.
  const { status, publishedAt, createdAt, updatedAt, draftForm, draftSnapshot, ...content } = listing;
  void status; void publishedAt; void createdAt; void updatedAt;
  void draftForm; void draftSnapshot;
  return JSON.parse(JSON.stringify(content));
}

export function snapshotDigest(value: unknown): string {
  function canonical(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(canonical);
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
    return item;
  }
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function submissionErrors(listing: {title: string; description: string; address: string | null; city: string | null; coverImageUrl: string | null; basePriceMinor: number; type: string; accommodation?: {roomTypes: unknown[]} | null}): string[] {
  const errors: string[] = [];
  if (!listing.title.trim()) errors.push("Add a title.");
  if (listing.description.trim().length < 30) errors.push("Describe the service in at least 30 characters.");
  if (!listing.city || !listing.address) errors.push("Add the city and address.");
  if (!listing.coverImageUrl) errors.push("Upload a cover photo.");
  if (listing.basePriceMinor <= 0) errors.push("Enter a price greater than zero.");
  if (listing.type === "ACCOMMODATION" && !listing.accommodation?.roomTypes.length) errors.push("Add at least one room type.");
  return errors;
}
