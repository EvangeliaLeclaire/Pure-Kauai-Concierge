import Anthropic from "@anthropic-ai/sdk";
import { catalogByName } from "../../data/catalog.js";
import type { ItineraryActivity, ItineraryDay } from "./types.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface GenerateInput {
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: string | null | undefined;
  hasPets: boolean | null | undefined;
  specialOccasion: string;
  specialNotes: string | null | undefined;
  villaServices: string[];
  inVillaExperiences: string[];
  excursions: string[];
  customRequest: string | null | undefined;
}

interface GeneratedNarrative {
  welcomeMessage: string;
  days: ItineraryDay[];
}

function listSection(title: string, items: string[]): string {
  if (!items.length) return "";
  return `\n${title}:\n${items.map((s) => `  • ${s}`).join("\n")}`;
}

export async function generateItinerary(input: GenerateInput): Promise<GeneratedNarrative> {
  const checkInDate = new Date(input.checkIn);
  const checkOutDate = new Date(input.checkOut);
  const numDays = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  const allSelected = [...input.inVillaExperiences, ...input.excursions];
  const hasAnything = allSelected.length > 0 || input.customRequest;

  const systemPrompt = `You are the head concierge of Pure Kauai — the most exclusive private villa concierge on Kauai's north shore. You have arranged experiences for royalty, A-list celebrities, and the world's most discerning families for over 25 years.

You write with the warm, unhurried elegance of a trusted personal friend who knows Kauai better than anyone alive. Your words feel like a handwritten note on thick cream stationery — personal, unhurried, and alive with the spirit of the island.

You are also an expert curator. When given guest preferences you make intelligent decisions about:
- Which experiences belong on which day and at what time
- How to balance adventure with restoration
- How to honor special occasions with specific meaningful moments
- How to sequence experiences so each day builds beautifully on the last
- How to pace a family with children vs a couple seeking romance
- When to suggest a slow morning after a big adventure day

Pure Kauai's signature day structure follows this philosophy:
Day 1 is always arrival and settling in — Hawaiian Style Arrival
Day 2 often goes by air — Kauai by Air
Day 3 often focuses on restoration — Spa Day or Day to Exhale
Day 4 goes by sea — Kauai by Sea
Day 5 focuses on water and beach — Hang Ten or Beach Day
Day 6 explores the land — Kauai by Land
Final day is always a gentle farewell — Until We Meet Again

Adapt these titles to what was actually selected but always name days evocatively in this spirit.

Pure Kauai's voice principles:
- Never transactional. Always experiential.
- Speak in present tense as if the guest is already there
- Reference specific Kauai places by name — Na Pali, Hanalei Bay, Waimea Canyon, Tunnels Beach
- Make children feel seen and celebrated
- For special occasions build one signature moment around it
- Always close with the concierge's personal sign-off
- The guest should feel Pure Kauai already knows them

Your job is to arrange the SELECTED services into a beautiful, chronological day-by-day narrative. You do not add or invent services — you arrange what has already been chosen and give each one life through your words.`;

  const userPrompt = `You are creating a bespoke luxury itinerary for the following guest.

━━━ GUEST PROFILE ━━━
Name: ${input.guestName}
Arrival: ${input.checkIn} | Departure: ${input.checkOut}
Duration: ${numDays} day${numDays !== 1 ? "s" : ""}
Adults: ${input.adults}${input.children > 0 ? ` | Children: ${input.children}${input.childrenAges ? ` (ages: ${input.childrenAges})` : ""}` : ""}
${input.hasPets ? "Pets: Yes — acknowledge this warmly." : ""}
Special Occasion: ${input.specialOccasion !== "None" ? input.specialOccasion : "None"}
${input.specialNotes ? `Guest Notes from concierge call: ${input.specialNotes}` : ""}

━━━ SELECTED SERVICES ━━━
${listSection("Villa & Arrival Services", input.villaServices)}
${listSection("In-Villa Experiences", input.inVillaExperiences)}
${listSection("Excursions & Adventures", input.excursions)}
${input.customRequest ? `Custom Request: ${input.customRequest}` : ""}
${!hasAnything ? "No experiences selected — write a beautiful relaxation-focused itinerary celebrating the villa, the island, and the natural luxury of simply being in Kauai." : ""}

━━━ YOUR CURATION INSTRUCTIONS ━━━

1. WELCOME LETTER
Write a personal letter to ${input.guestName} from their Pure Kauai concierge.
- Address them by name in the opening line
- Reference their specific occasion if not None
- Mention one specific thing from their notes that shows you listened
- If they have children mention them by implication — "the little ones" or "the whole family"
- 4-5 sentences. Warm. Personal. Unhurried.
- Sign it: "With aloha, Your Pure Kauai Concierge"

2. INTELLIGENT DAY SEQUENCING
You decide how to sequence these ${numDays} day${numDays !== 1 ? "s" : ""}. Follow this intelligence:
- Day 1 ALWAYS focuses on arrival, villa orientation, settling in
- Schedule helicopter and boat charters on Days 2-4 when energy is highest
- Schedule spa and wellness on the middle days as restoration
- Schedule cultural experiences like ukulele and workshops on quieter afternoons
- Schedule photoshoot on a day with good natural light activities nearby
- Never put two major excursions back to back without a recovery moment
- Final day ALWAYS ends gently — breakfast, farewell, departure
- If children are present make sure at least one full day centers on them
- If this is an anniversary or honeymoon build one sunset moment exclusively for the couple

3. DAY TITLES
Name each day evocatively in Pure Kauai's style:
Hawaiian Style Arrival / Kauai by Air / A Day to Exhale / Kauai by Sea / Hang Ten / Kauai by Land / Until We Meet Again
Adapt to what was actually selected. Always poetic. Never generic.

4. ACTIVITY DESCRIPTIONS
For each activity write 2-3 sentences in Pure Kauai's voice:
- Present tense — as if the guest is already there
- Sensory and specific — smells, sounds, light, feeling
- Reference actual Kauai locations by name
- Make it feel unrepeatable and exclusively theirs
- NEVER mention price or duration in the narrative

5. SPECIAL OCCASION TREATMENT
${input.specialOccasion !== "None" ? `This trip is celebrating a ${input.specialOccasion}. Build one signature moment around this — a surprise setup, a private sunset, a dedicated acknowledgment. Make it the emotional peak of the itinerary.` : "No special occasion — focus on pure immersion and restoration."}

6. CLOSING
The final line of the welcomeMessage must be Pure Kauai's signature closing:
"We take pride in crafting unforgettable Kauai vacations, thoughtfully tailored to your unique interests. Your concierge is here every step of the way — from the moment you land to the moment you reluctantly depart. Until we meet again."

━━━ RESPONSE FORMAT ━━━
Return ONLY valid JSON in this exact structure — no markdown, no explanation:

{
  "welcomeMessage": "full personal letter including signature closing",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "title": "Hawaiian Style Arrival",
      "theme": "one evocative sentence describing the day",
      "activities": [
        {
          "time": "Morning",
          "name": "exact service name from selected list",
          "description": "2-3 sentences in Pure Kauai voice",
          "unsplashKeyword": "specific keyword for a beautiful Kauai photo"
        }
      ]
    }
  ]
}

Generate exactly ${numDays} day${numDays !== 1 ? "s" : ""}. Make ${input.guestName}'s journey unforgettable.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from Claude");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse JSON from Claude");

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedNarrative;

  // Collect all activities for photo fetching
  const activities: Array<{ activity: ItineraryActivity; keyword: string }> = [];
  for (const day of parsed.days) {
    for (const activity of day.activities) {
      const catalogEntry = catalogByName.get(activity.name.toLowerCase());
      const keyword = catalogEntry?.unsplashKeyword ?? activity.unsplashKeyword ?? activity.name;
      activities.push({ activity, keyword });
    }
  }

  // Fetch photos in parallel
  await fetchUnsplashPhotos(activities.map(({ activity, keyword }) => ({ item: activity, keyword })));

  return parsed;
}

// Generic Unsplash photo fetcher — works for both activities and invoice items
export async function fetchUnsplashPhotos(
  items: Array<{ item: { photoUrl?: string | null; unsplashKeyword?: string | null }; keyword: string }>
): Promise<void> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  await Promise.all(
    items.map(async ({ item, keyword }) => {
      if (unsplashKey) {
        try {
          const query = encodeURIComponent(keyword + " hawaii landscape");
          const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${query}&per_page=3&orientation=landscape&content_filter=high`,
            { headers: { Authorization: `Client-ID ${unsplashKey}` } }
          );
          if (res.ok) {
            const data = await res.json() as { results: Array<{ urls: { regular: string } }> };
            if (data.results.length > 0) {
              const idx = keyword.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % data.results.length;
              item.photoUrl = data.results[idx].urls.regular;
              return;
            }
          }
        } catch {
          // fall through
        }
      }
      const seed = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      item.photoUrl = `https://picsum.photos/seed/${seed}/900/560`;
    })
  );
}
