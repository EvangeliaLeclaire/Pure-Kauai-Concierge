import Anthropic from "@anthropic-ai/sdk";
import { ACTIVITY_CATALOG, catalogByName } from "../../data/catalog.js";
import type { ItineraryActivity, ItineraryDay } from "./types.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GuestInput {
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  interests: string[];
  budgetTier: string;
  specialOccasion: string;
  specialNotes?: string | null;
}

interface GeneratedItinerary {
  welcomeMessage: string;
  days: ItineraryDay[];
}

// Format the catalog clearly for Claude
const catalogText = ACTIVITY_CATALOG.map((a) =>
  `- "${a.name}" | ${a.category} | ${a.duration} | $${a.pricePerPerson}/person | Best for: ${a.bestFor.join(", ")} | Time: ${a.timeOfDay}`
).join("\n");

export async function generateItinerary(input: GuestInput): Promise<GeneratedItinerary> {
  const checkInDate = new Date(input.checkIn);
  const checkOutDate = new Date(input.checkOut);
  const numDays = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
  const isUltraLuxury = input.budgetTier === "Ultra-Luxury";

  const systemPrompt = `You are the head concierge of Pure Kauai — the most exclusive private villa concierge service on the island. You have curated experiences for royalty, A-list celebrities, and the world's most discerning families. You know every hidden waterfall, every master chef, every secret cove.

You write with the warm, unhurried elegance of a trusted personal friend who happens to know Kauai better than anyone alive. You address guests by name. You weave in their occasion, their interests, their children's names if provided. Every word should feel handwritten on thick cream stationery.

Your itineraries are built EXCLUSIVELY from the Pure Kauai activity catalog. You select the most relevant experiences for each guest and describe them as if you personally arranged every detail — because you did.`;

  const userPrompt = `Create a complete bespoke itinerary for the following guest. Select activities ONLY from the Pure Kauai catalog below.

━━━ GUEST PROFILE ━━━
Name: ${input.guestName}
Arrival: ${input.checkIn}
Departure: ${input.checkOut}
Duration: ${numDays} night${numDays !== 1 ? "s" : ""}
Adults: ${input.adults}${input.children > 0 ? `\nChildren: ${input.children}` : ""}
Interests: ${input.interests.join(", ")}
Budget Tier: ${input.budgetTier}
Special Occasion: ${input.specialOccasion !== "None" ? input.specialOccasion : "None"}
Special Notes: ${input.specialNotes || "None"}

━━━ PURE KAUAI ACTIVITY CATALOG ━━━
${catalogText}

━━━ SELECTION RULES ━━━
1. Select 2–4 activities per day from the catalog above. Use EXACT activity names as they appear.
2. Match activities to the guest's stated interests and occasion. Do not repeat the same activity on multiple days.
3. Do not schedule the "Pre-Arrival Grocery Stocking" as a day activity — it is handled automatically on arrival.
${isUltraLuxury ? `4. ULTRA-LUXURY REQUIREMENT: You MUST include "Sightseeing Helicopter Charter" (Day 1 or 2), "Private Chef Dinner at the Villa" (at least once), and at least one wellness experience (Massage & Facial Fusion, Sunrise Restorative Yoga, Sound Bath & Healing Ceremony, or Private Pilates Session). These are non-negotiable for Ultra-Luxury guests.` : `4. Select activities appropriate for the ${input.budgetTier} budget tier.`}
${input.specialOccasion !== "None" ? `5. This is a ${input.specialOccasion} — weave that celebration through the welcome message and at least one special evening activity.` : ""}

━━━ WRITING VOICE ━━━
- Address ${input.guestName} by name in the welcome message
- Welcome message: 3–4 sentences, warm and personal, referencing their occasion and what awaits them
- Activity descriptions: rewrite each description in your personal concierge voice (2–3 evocative, sensory sentences). Do not copy catalog text verbatim.
- Use time-of-day: "Morning", "Afternoon", or "Evening"

━━━ RESPONSE FORMAT ━━━
Respond ONLY with valid JSON. No markdown. No explanation. Just the JSON object.

{
  "welcomeMessage": "...",
  "days": [
    {
      "day": 1,
      "date": "${input.checkIn}",
      "activities": [
        {
          "time": "Morning",
          "name": "EXACT activity name from catalog",
          "category": "category from catalog",
          "description": "Your personal concierge description in 2-3 sentences.",
          "duration": "duration from catalog",
          "pricePerPerson": 000,
          "unsplashKeyword": "unsplashKeyword from catalog"
        }
      ]
    }
  ]
}

Generate exactly ${numDays} day${numDays !== 1 ? "s" : ""}. Make ${input.guestName}'s journey extraordinary.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedItinerary;

  // For each activity, look up the catalog entry to get the canonical unsplashKeyword.
  // If Claude matched a known activity name, use the catalog's curated keyword.
  // Fall back to whatever Claude provided.
  for (const day of parsed.days) {
    for (const activity of day.activities) {
      const catalogEntry = catalogByName.get(activity.name.toLowerCase());
      const keyword = catalogEntry?.unsplashKeyword ?? activity.unsplashKeyword;

      // Attach category from catalog if not set
      if (catalogEntry && !activity.category) {
        activity.category = catalogEntry.category;
      }

      // Use picsum.photos with the keyword as a deterministic seed — reliable, no API key, beautiful photos
      const seed = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      activity.photoUrl = `https://picsum.photos/seed/${seed}/900/560`;
    }
  }

  return parsed;
}
