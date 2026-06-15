import { Router } from "express";
import { randomUUID } from "crypto";
import { saveItinerary, getItinerary, updateItinerary, slugExists, listItineraries, countApprovedItineraries } from "./store.js";
import { generateItinerary, fetchUnsplashPhotos } from "./generate.js";
import { catalogByName } from "../../data/catalog.js";
import { streamQuotePDF, streamInvoicePDF } from "./pdf.js";
import type { Itinerary, InvoiceItem } from "./types.js";

// ── Slug generation ──────────────────────────────────────────────────────────

const MONTH_ABBR = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

async function generateSlug(guestName: string, checkIn: string): Promise<string> {
  const stripped = guestName.replace(/^(the|a|an)\s+/i, "");
  const namePart = stripped
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const d = new Date(checkIn + "T00:00:00");
  const datePart = MONTH_ABBR[d.getMonth()] + d.getDate();
  const base = `${namePart}-${datePart}`;
  if (!(await slugExists(base))) return base;
  let n = 2;
  while (await slugExists(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

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

router.get("/itineraries", async (_req, res) => {
  const items = await listItineraries();
  res.json(items);
});

router.post("/itineraries", async (req, res) => {
  const {
    guestName, checkIn, checkOut, adults, children,
    childrenAges, hasPets, specialOccasion, occasionDetails, occasionDate, occasionAcknowledgement,
    specialNotes, villaServices, inVillaExperiences, excursions, customRequest,
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
    occasionDetails?: string | null;
    occasionDate?: string | null;
    occasionAcknowledgement?: string | null;
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

  // Stream SSE to keep the proxy connection alive during Claude generation (~30–120s)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const keepAlive = setInterval(() => {
    res.write("event: ping\ndata: {}\n\n");
  }, 15000);

  const numNights = Math.max(1, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const safeVillaServices   = villaServices       ?? [];
  const safeInVilla         = inVillaExperiences  ?? [];
  const safeExcursions      = excursions          ?? [];

  const invoice = buildInvoice(
    [...safeVillaServices, ...safeInVilla, ...safeExcursions],
    adults,
    children ?? 0,
    numNights
  );

  // Fetch photos for invoice items in background (don't block the response)
  const photoFetch = fetchUnsplashPhotos(
    invoice.map((item) => ({ item, keyword: item.unsplashKeyword ?? item.name }))
  );

  // Generate narrative from Claude
  let generated;
  try {
    generated = await generateItinerary({
      guestName,
      checkIn,
      checkOut,
      adults,
      children: children ?? 0,
      childrenAges: childrenAges ?? null,
      hasPets: hasPets ?? null,
      specialOccasion,
      occasionDetails: occasionDetails ?? null,
      occasionDate: occasionDate ?? null,
      occasionAcknowledgement: occasionAcknowledgement ?? null,
      specialNotes: specialNotes ?? null,
      villaServices: safeVillaServices,
      inVillaExperiences: safeInVilla,
      excursions: safeExcursions,
      customRequest: customRequest ?? null,
    });
  } catch (err) {
    clearInterval(keepAlive);
    req.log.error({ err }, "Claude generation failed");
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Unable to generate itinerary. Please try again in a moment." })}\n\n`);
    res.end();
    return;
  }

  const slug = await generateSlug(guestName, checkIn);

  const itinerary: Itinerary = {
    id: randomUUID(),
    slug,
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
    invoice,
    approved: false,
    createdAt: new Date().toISOString(),
  };

  await saveItinerary(itinerary);

  // Resolve photos after saving — update activity photoUrls in background
  photoFetch.then(async () => {
    const withPhotos = { ...itinerary, invoice: invoice.map(i => ({ ...i })) };
    try { await updateItinerary(itinerary.id, { invoice: withPhotos.invoice }); } catch { /* best-effort */ }
  });

  clearInterval(keepAlive);
  res.write(`event: complete\ndata: ${JSON.stringify(itinerary)}\n\n`);
  res.end();
});

router.get("/itineraries/:id", async (req, res) => {
  const itinerary = await getItinerary(req.params.id);
  if (!itinerary) { res.status(404).json({ error: "Itinerary not found" }); return; }
  res.json(itinerary);
});

router.patch("/itineraries/:id", async (req, res) => {
  const { welcomeMessage, days, invoice } = req.body as {
    welcomeMessage?: string | null;
    days?: Itinerary["days"];
    invoice?: Itinerary["invoice"];
  };
  const patch: Partial<Itinerary> = {};
  if (welcomeMessage !== undefined) patch.welcomeMessage = welcomeMessage;
  if (days !== undefined) patch.days = days;
  if (invoice !== undefined) patch.invoice = invoice;
  const updated = await updateItinerary(req.params.id, patch);
  if (!updated) { res.status(404).json({ error: "Itinerary not found" }); return; }
  res.json(updated);
});

router.post("/itineraries/:id/approve", async (req, res) => {
  const existing = await getItinerary(req.params.id);
  if (!existing) { res.status(404).json({ error: "Itinerary not found" }); return; }
  if (existing.approved) {
    res.json(existing);
    return;
  }
  const count = await countApprovedItineraries();
  const year = new Date().getFullYear();
  const invoiceNumber = `PK-${year}-${String(count + 1).padStart(4, "0")}`;
  const approvedAt = new Date().toISOString().split("T")[0];
  const updated = await updateItinerary(req.params.id, { approved: true, invoiceNumber, approvedAt });
  if (!updated) { res.status(404).json({ error: "Itinerary not found" }); return; }
  res.json(updated);
});

router.get("/itineraries/:id/quote-pdf", async (req, res) => {
  const itinerary = await getItinerary(req.params.id);
  if (!itinerary) { res.status(404).json({ error: "Itinerary not found" }); return; }
  try {
    streamQuotePDF(itinerary, res);
  } catch (err) {
    req.log.error({ err }, "quote-pdf generation failed");
    if (!res.headersSent) res.status(500).json({ error: "PDF generation failed" });
  }
});

router.get("/itineraries/:id/invoice-pdf", async (req, res) => {
  const itinerary = await getItinerary(req.params.id);
  if (!itinerary) { res.status(404).json({ error: "Itinerary not found" }); return; }
  if (!itinerary.approved) { res.status(400).json({ error: "Itinerary not yet approved" }); return; }
  try {
    streamInvoicePDF(itinerary, res);
  } catch (err) {
    req.log.error({ err }, "invoice-pdf generation failed");
    if (!res.headersSent) res.status(500).json({ error: "PDF generation failed" });
  }
});

export default router;
