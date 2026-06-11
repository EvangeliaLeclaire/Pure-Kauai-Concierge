import { Router } from "express";
import { randomUUID } from "crypto";
import { saveItinerary, getItinerary, updateItinerary } from "./store.js";
import { generateItinerary } from "./generate.js";
import type { Itinerary } from "./types.js";

const router = Router();

router.post("/itineraries", async (req, res) => {
  const {
    guestName,
    checkIn,
    checkOut,
    adults,
    children,
    interests,
    budgetTier,
    specialOccasion,
    specialNotes,
    hostName,
    hostEmail,
    hostPhone,
  } = req.body as {
    guestName: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    interests: string[];
    budgetTier: string;
    specialOccasion: string;
    specialNotes?: string | null;
    hostName?: string | null;
    hostEmail?: string | null;
    hostPhone?: string | null;
  };

  if (!guestName || !checkIn || !checkOut || !adults || !interests || !budgetTier || !specialOccasion) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const generated = await generateItinerary({
    guestName,
    checkIn,
    checkOut,
    adults,
    children: children ?? 0,
    interests,
    budgetTier,
    specialOccasion,
    specialNotes,
  });

  const itinerary: Itinerary = {
    id: randomUUID(),
    guestName,
    checkIn,
    checkOut,
    adults,
    children: children ?? 0,
    interests,
    budgetTier,
    specialOccasion,
    specialNotes: specialNotes ?? null,
    hostName: hostName ?? null,
    hostEmail: hostEmail ?? null,
    hostPhone: hostPhone ?? null,
    welcomeMessage: generated.welcomeMessage,
    days: generated.days,
    approved: false,
    createdAt: new Date().toISOString(),
  };

  saveItinerary(itinerary);
  res.status(201).json(itinerary);
});

router.get("/itineraries/:id", (req, res) => {
  const itinerary = getItinerary(req.params.id);
  if (!itinerary) {
    res.status(404).json({ error: "Itinerary not found" });
    return;
  }
  res.json(itinerary);
});

router.post("/itineraries/:id/approve", (req, res) => {
  const updated = updateItinerary(req.params.id, { approved: true });
  if (!updated) {
    res.status(404).json({ error: "Itinerary not found" });
    return;
  }
  res.json(updated);
});

export default router;
