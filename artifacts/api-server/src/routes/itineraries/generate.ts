import Anthropic from "@anthropic-ai/sdk";
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

export async function generateItinerary(input: GuestInput): Promise<GeneratedItinerary> {
  const checkInDate = new Date(input.checkIn);
  const checkOutDate = new Date(input.checkOut);
  const numDays = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalGuests = input.adults + input.children;

  const prompt = `You are the head concierge for Pure Kauai, an ultra-luxury travel company in Kauai, Hawaii. You create bespoke, personalized itineraries for the world's most discerning travelers.

Create a complete day-by-day itinerary for the following guest:

Guest Name: ${input.guestName}
Check-in: ${input.checkIn}
Check-out: ${input.checkOut}
Number of Days: ${numDays}
Adults: ${input.adults}
Children: ${input.children}
Interests: ${input.interests.join(", ")}
Budget Tier: ${input.budgetTier}
Special Occasion: ${input.specialOccasion}
Special Notes: ${input.specialNotes || "None"}

Guidelines:
- Write in warm, luxurious, deeply personalized language befitting a world-class concierge
- Create 2-4 activities per day that match the guest's interests
- For ${input.budgetTier === "Ultra-Luxury" ? "Ultra-Luxury" : "Premium"} tier, price activities between ${input.budgetTier === "Ultra-Luxury" ? "$300-$1200" : "$150-$500"} per person
- If it's a ${input.specialOccasion !== "None" ? input.specialOccasion : "regular"} trip, weave that theme throughout
- Time activities as Morning, Afternoon, or Evening
- Each activity description should be 2-3 sentences, evocative and sensory
- Include a mix of activities across their stated interests

Respond ONLY with valid JSON in this exact format:
{
  "welcomeMessage": "A warm, personal 3-4 sentence welcome message addressing ${input.guestName} by name, acknowledging any special occasion, and setting the tone for their Kauai journey.",
  "days": [
    {
      "day": 1,
      "date": "${input.checkIn}",
      "activities": [
        {
          "time": "Morning",
          "name": "Activity Name",
          "description": "Evocative 2-3 sentence description.",
          "duration": "X hours",
          "pricePerPerson": 000,
          "unsplashKeyword": "specific search keyword for Unsplash photo"
        }
      ]
    }
  ]
}

Generate exactly ${numDays} days. Make it extraordinary.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
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

  // Add photoUrls using Unsplash source (no API key needed)
  for (const day of parsed.days) {
    for (const activity of day.activities) {
      const keyword = encodeURIComponent(activity.unsplashKeyword);
      activity.photoUrl = `https://source.unsplash.com/800x500/?${keyword}`;
    }
  }

  return parsed;
}
