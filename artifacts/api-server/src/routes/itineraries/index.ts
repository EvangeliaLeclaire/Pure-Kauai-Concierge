import { Router } from "express";
import { randomUUID } from "crypto";
import { saveItinerary, getItinerary, updateItinerary } from "./store.js";
import { generateItinerary, fetchUnsplashPhotos } from "./generate.js";
import { catalogByName } from "../../data/catalog.js";
import type { Itinerary, InvoiceItem } from "./types.js";

const router = Router();

// ── Invoice builder ─────────────────────────────────────────────────────────

function buildInvoice(
  selectedNames: string[],
  adults: number,
  children: number,
  numNights: number
): InvoiceItem[] {
  const totalGuests = adults + children;

  return selectedNames.flatMap((name) => {
    const entry = catalogByName.get(name.toLowerCase());
    if (!entry) return [];

    let quantity: number;
    let unit: string;

    switch (entry.pricingModel) {
      case "per_person":
        quantity = totalGuests;
        unit = "per guest";
        break;
      case "per_adult":
        quantity = adults;
        unit = "per adult";
        break;
      case "per_child":
        quantity = Math.max(children, 1);
        unit = "per child";
        break;
      case "per_night":
        quantity = numNights;
        unit = "per night";
        break;
      case "per_couple":
        quantity = Math.max(1, Math.ceil(adults / 2));
        unit = "per couple";
        break;
      case "per_event":
        quantity = 1;
        unit = "flat rate";
        break;
      case "complimentary":
        quantity = 1;
        unit = "complimentary";
        break;
      default:
        quantity = 1;
        unit = "flat rate";
    }

    if (quantity === 0) return [];

    return [{
      name: entry.name,
      category: entry.invoiceCategory,
      description: entry.description,
      duration: entry.duration,
      pricePerUnit: entry.priceAmount,
      quantity,
      unit,
      totalPrice: entry.priceAmount * quantity,
      unsplashKeyword: entry.unsplashKeyword,
      photoUrl: null,
      notes: null,
    }];
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.post("/itineraries", async (req, res) => {
  const {
    guestName, checkIn, checkOut, adults, children,
    childrenAges, hasPets, specialOccasion, specialNotes,
    villaServices, inVillaExperiences, excursions, customRequest,
    hostName, hostEmail, hostPhone,
  } = req.body as {
    guestName: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAges?: string | null;
    hasPets?: boolean | null;
    specialOccasion: string;
    specialNotes?: string | null;
    villaServices?: string[];
    inVillaExperiences?: string[];
    excursions?: string[];
    customRequest?: string | null;
    hostName?: string | null;
    hostEmail?: string | null;
    hostPhone?: string | null;
  };

  if (!guestName || !checkIn || !checkOut || !adults || adults < 1 || !specialOccasion) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const numNights = Math.max(1, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const safeVillaServices   = villaServices       ?? [];
  const safeInVilla         = inVillaExperiences  ?? [];
  const safeExcursions      = excursions          ?? [];

  // Build invoices server-side from catalog pricing
  const inVillaInvoice = buildInvoice(
    [...safeVillaServices, ...safeInVilla],
    adults,
    children ?? 0,
    numNights
  );
  const excursionInvoice = buildInvoice(
    safeExcursions,
    adults,
    children ?? 0,
    numNights
  );

  // Fetch photos for invoice items in parallel (fire and forget order doesn't matter)
  const photoFetch = fetchUnsplashPhotos([
    ...inVillaInvoice.map((item) => ({ item, keyword: item.unsplashKeyword ?? item.name })),
    ...excursionInvoice.map((item) => ({ item, keyword: item.unsplashKeyword ?? item.name })),
  ]);

  // Generate narrative from Claude
  const generated = await generateItinerary({
    guestName,
    checkIn,
    checkOut,
    adults,
    children: children ?? 0,
    childrenAges: childrenAges ?? null,
    hasPets: hasPets ?? null,
    specialOccasion,
    specialNotes: specialNotes ?? null,
    villaServices: safeVillaServices,
    inVillaExperiences: safeInVilla,
    excursions: safeExcursions,
    customRequest: customRequest ?? null,
  });

  // Wait for invoice photos
  await photoFetch;

  const itinerary: Itinerary = {
    id: randomUUID(),
    guestName,
    checkIn,
    checkOut,
    adults,
    children: children ?? 0,
    childrenAges: childrenAges ?? null,
    hasPets: hasPets ?? null,
    specialOccasion,
    specialNotes: specialNotes ?? null,
    villaServices: safeVillaServices,
    inVillaExperiences: safeInVilla,
    excursions: safeExcursions,
    customRequest: customRequest ?? null,
    hostName: hostName ?? null,
    hostEmail: hostEmail ?? null,
    hostPhone: hostPhone ?? null,
    welcomeMessage: generated.welcomeMessage,
    days: generated.days,
    inVillaInvoice,
    excursionInvoice,
    approved: false,
    createdAt: new Date().toISOString(),
  };

  saveItinerary(itinerary);
  res.status(201).json(itinerary);
});

router.get("/itineraries/:id", (req, res) => {
  const itinerary = getItinerary(req.params.id);
  if (!itinerary) { res.status(404).json({ error: "Itinerary not found" }); return; }
  res.json(itinerary);
});

router.post("/itineraries/:id/approve", (req, res) => {
  const updated = updateItinerary(req.params.id, { approved: true });
  if (!updated) { res.status(404).json({ error: "Itinerary not found" }); return; }
  res.json(updated);
});

export default router;
