import { db, itinerariesTable } from "@workspace/db";
import { eq, or, desc } from "drizzle-orm";
import type { Itinerary, ItineraryListItem } from "./types.js";

export async function countApprovedItineraries(): Promise<number> {
  const rows = await db
    .select({ id: itinerariesTable.id })
    .from(itinerariesTable)
    .where(eq(itinerariesTable.approved, true));
  return rows.length;
}

export async function saveItinerary(itinerary: Itinerary): Promise<void> {
  await db.insert(itinerariesTable).values({
    id:       itinerary.id,
    slug:     itinerary.slug,
    data:     itinerary as unknown as Record<string, unknown>,
    approved: itinerary.approved,
  });
}

export async function getItinerary(idOrSlug: string): Promise<Itinerary | undefined> {
  const rows = await db
    .select()
    .from(itinerariesTable)
    .where(or(eq(itinerariesTable.id, idOrSlug), eq(itinerariesTable.slug, idOrSlug)))
    .limit(1);
  return rows[0]?.data as Itinerary | undefined;
}

export async function updateItinerary(
  idOrSlug: string,
  patch: Partial<Itinerary>
): Promise<Itinerary | undefined> {
  const existing = await getItinerary(idOrSlug);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  await db
    .update(itinerariesTable)
    .set({ data: updated as unknown as Record<string, unknown>, approved: updated.approved })
    .where(eq(itinerariesTable.id, existing.id));
  return updated;
}

export async function listItineraries(): Promise<ItineraryListItem[]> {
  const rows = await db
    .select()
    .from(itinerariesTable)
    .orderBy(desc(itinerariesTable.createdAt));

  return rows.map((row) => {
    const data = row.data as Itinerary;
    return {
      id: row.id,
      slug: row.slug,
      guestName: data.guestName,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      specialOccasion: data.specialOccasion,
      approved: row.approved,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function slugExists(slug: string): Promise<boolean> {
  const rows = await db
    .select({ id: itinerariesTable.id })
    .from(itinerariesTable)
    .where(eq(itinerariesTable.slug, slug))
    .limit(1);
  return rows.length > 0;
}
