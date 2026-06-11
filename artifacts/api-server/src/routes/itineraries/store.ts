import type { Itinerary } from "./types.js";

const store = new Map<string, Itinerary>();

export function saveItinerary(itinerary: Itinerary): void {
  store.set(itinerary.id, itinerary);
}

export function getItinerary(id: string): Itinerary | undefined {
  return store.get(id);
}

export function updateItinerary(id: string, patch: Partial<Itinerary>): Itinerary | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  store.set(id, updated);
  return updated;
}
