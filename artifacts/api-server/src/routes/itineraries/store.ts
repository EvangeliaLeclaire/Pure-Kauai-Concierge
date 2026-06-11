import type { Itinerary } from "./types.js";

const byId   = new Map<string, Itinerary>();
const bySlug = new Map<string, Itinerary>();

export function saveItinerary(itinerary: Itinerary): void {
  byId.set(itinerary.id, itinerary);
  bySlug.set(itinerary.slug, itinerary);
}

export function getItinerary(idOrSlug: string): Itinerary | undefined {
  return byId.get(idOrSlug) ?? bySlug.get(idOrSlug);
}

export function updateItinerary(idOrSlug: string, patch: Partial<Itinerary>): Itinerary | undefined {
  const existing = byId.get(idOrSlug) ?? bySlug.get(idOrSlug);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  byId.set(updated.id, updated);
  bySlug.set(updated.slug, updated);
  return updated;
}

export function slugExists(slug: string): boolean {
  return bySlug.has(slug);
}
