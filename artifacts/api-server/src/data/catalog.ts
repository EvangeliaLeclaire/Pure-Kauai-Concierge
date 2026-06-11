export interface CatalogActivity {
  name: string;
  category: string;
  description: string;
  duration: string;
  pricePerPerson: number;
  bestFor: string[];
  timeOfDay: string;
  occasion: string[];
  unsplashKeyword: string;
}

export const ACTIVITY_CATALOG: CatalogActivity[] = [
  {
    name: "Sightseeing Helicopter Charter",
    category: "Adventure",
    description: "A private doors-off helicopter charter soaring over the dramatic Na Pali cliffs, Waimea Canyon, and Jurassic Park filming locations. Your pilot narrates the island's most breathtaking secrets from above.",
    duration: "1 hour",
    pricePerPerson: 395,
    bestFor: ["adventure", "couples", "photographers", "first-time visitors"],
    timeOfDay: "morning",
    occasion: ["anniversary", "honeymoon", "birthday"],
    unsplashKeyword: "Na Pali Coast aerial Kauai helicopter"
  },
  {
    name: "Na Pali Coast Private Boat Charter",
    category: "Adventure",
    description: "An exclusive private boat charter along the legendary Na Pali coastline. Snorkel in hidden sea caves, watch spinner dolphins dance in your wake, and anchor in secluded coves only accessible by sea.",
    duration: "5 hours",
    pricePerPerson: 450,
    bestFor: ["adventure", "families", "couples", "beach"],
    timeOfDay: "morning",
    occasion: ["anniversary", "family reunion", "birthday"],
    unsplashKeyword: "Na Pali Coast boat Kauai ocean"
  },
  {
    name: "Private Chef Dinner at the Villa",
    category: "Dining",
    description: "Your Pure Kauai private chef arrives at the villa with the finest locally sourced ingredients — Kauai-grown produce, freshly caught fish, and Hawaiian delicacies — to craft a bespoke multi-course dinner experience under the stars.",
    duration: "3 hours",
    pricePerPerson: 275,
    bestFor: ["dining", "couples", "families", "wellness"],
    timeOfDay: "evening",
    occasion: ["anniversary", "honeymoon", "birthday", "family reunion"],
    unsplashKeyword: "luxury private chef dinner Hawaii villa"
  },
  {
    name: "Massage & Facial Fusion at the Villa",
    category: "Wellness",
    description: "Pure Kauai's elite massage therapists arrive at your villa for a deeply restorative lomilomi massage and facial fusion treatment. Surrender to the rhythm of the island as the ocean breeze carries your stress away.",
    duration: "2 hours",
    pricePerPerson: 295,
    bestFor: ["wellness", "couples", "beach"],
    timeOfDay: "afternoon",
    occasion: ["anniversary", "honeymoon"],
    unsplashKeyword: "luxury spa massage Hawaii tropical"
  },
  {
    name: "Sunrise Restorative Yoga",
    category: "Wellness",
    description: "A private yoga instructor leads your group through a restorative sunrise session on the villa lanai or beach. Grounded in Hawaiian mindfulness, this practice connects you to the land, the ocean, and each other.",
    duration: "1.5 hours",
    pricePerPerson: 95,
    bestFor: ["wellness", "beach", "couples", "families"],
    timeOfDay: "morning",
    occasion: ["none", "honeymoon", "anniversary"],
    unsplashKeyword: "sunrise yoga beach Hawaii ocean"
  },
  {
    name: "Sound Bath & Healing Ceremony",
    category: "Wellness",
    description: "A certified Hawaiian sound healing practitioner brings crystal singing bowls and native instruments to your villa for a private sound bath ceremony. A profoundly moving experience that resets the nervous system and awakens the spirit.",
    duration: "1.5 hours",
    pricePerPerson: 150,
    bestFor: ["wellness", "couples", "culture"],
    timeOfDay: "evening",
    occasion: ["none", "anniversary", "honeymoon"],
    unsplashKeyword: "sound bath meditation Hawaii spiritual"
  },
  {
    name: "Private Luau & Fire Show at the Villa",
    category: "Culture",
    description: "Pure Kauai brings the celebration to you. A full private luau with authentic hula dancers, live Hawaiian music, fire performers, and a traditional feast prepared by your private chef — exclusively for your group.",
    duration: "4 hours",
    pricePerPerson: 350,
    bestFor: ["culture", "families", "adventure"],
    timeOfDay: "evening",
    occasion: ["birthday", "family reunion", "anniversary"],
    unsplashKeyword: "Hawaiian luau fire dance hula night"
  },
  {
    name: "North Shore Guided Waterfall Hike",
    category: "Adventure",
    description: "Your expert Pure Kauai guide leads you through lush jungle trails to hidden waterfalls on Kauai's magnificent north shore. Swim in pristine natural pools surrounded by tropical flora found nowhere else on earth.",
    duration: "4 hours",
    pricePerPerson: 175,
    bestFor: ["adventure", "families", "culture", "beach"],
    timeOfDay: "morning",
    occasion: ["none", "family reunion", "birthday"],
    unsplashKeyword: "Kauai waterfall jungle hike tropical"
  },
  {
    name: "Private Surf Lesson at Hanalei Bay",
    category: "Adventure",
    description: "A world-class Pure Kauai surf instructor takes you and your group into the legendary waters of Hanalei Bay for a private lesson. From first-timers to intermediate surfers, this experience is tailored entirely to your group.",
    duration: "2 hours",
    pricePerPerson: 150,
    bestFor: ["adventure", "families", "beach"],
    timeOfDay: "morning",
    occasion: ["none", "family reunion", "birthday"],
    unsplashKeyword: "surf lesson Hanalei Bay Kauai beach"
  },
  {
    name: "Ukulele Lesson & Hawaiian Storytelling",
    category: "Culture",
    description: "A master Hawaiian musician visits your villa for an intimate ukulele lesson woven together with the oral traditions and legends of Kauai. Leave with a song in your heart and a deeper connection to the spirit of the island.",
    duration: "2 hours",
    pricePerPerson: 120,
    bestFor: ["culture", "families", "wellness"],
    timeOfDay: "afternoon",
    occasion: ["none", "family reunion"],
    unsplashKeyword: "ukulele Hawaii music culture lesson"
  },
  {
    name: "Lifestyle & Portrait Photoshoot",
    category: "Culture",
    description: "Pure Kauai's preferred photographer captures your family or couple against the island's most spectacular backdrops — golden cliffs, secret beaches, and lush valleys. A curated gallery of memories delivered within 48 hours.",
    duration: "2 hours",
    pricePerPerson: 250,
    bestFor: ["families", "couples", "beach", "culture"],
    timeOfDay: "morning",
    occasion: ["anniversary", "honeymoon", "family reunion", "birthday"],
    unsplashKeyword: "family photo shoot beach Hawaii sunset"
  },
  {
    name: "Pre-Arrival Grocery Stocking",
    category: "In-Villa",
    description: "Your villa is stocked before you arrive with everything you requested — fresh tropical fruits, locally sourced provisions, fine wines, and any dietary-specific items — so your first moments on island feel like coming home.",
    duration: "N/A",
    pricePerPerson: 0,
    bestFor: ["families", "wellness", "dining"],
    timeOfDay: "arrival",
    occasion: ["none", "anniversary", "honeymoon", "family reunion"],
    unsplashKeyword: "luxury villa kitchen fresh fruit Hawaii"
  },
  {
    name: "Private Pilates Session at the Villa",
    category: "Wellness",
    description: "A certified Pilates instructor brings portable equipment to your villa for a private session tailored to your fitness level and goals. Begin your morning with intention and strength overlooking the Pacific.",
    duration: "1 hour",
    pricePerPerson: 120,
    bestFor: ["wellness", "couples"],
    timeOfDay: "morning",
    occasion: ["none", "honeymoon"],
    unsplashKeyword: "pilates workout luxury villa ocean view"
  },
  {
    name: "Cultural Workshop: Lei Making & Hawaiian Arts",
    category: "Culture",
    description: "A native Hawaiian cultural practitioner guides your group through the ancient art of lei making, traditional weaving, and the stories behind Hawaii's most sacred customs. A deeply meaningful connection to the living culture of Kauai.",
    duration: "2 hours",
    pricePerPerson: 110,
    bestFor: ["culture", "families", "wellness"],
    timeOfDay: "afternoon",
    occasion: ["none", "family reunion"],
    unsplashKeyword: "Hawaiian lei making cultural workshop flowers"
  },
  {
    name: "Private Sushi Chef Dinner",
    category: "Dining",
    description: "A renowned sushi chef arrives at your villa with the day's freshest catch from local Kauai waters. Watch as extraordinary omakase unfolds before you — each course a reflection of the island's ocean bounty.",
    duration: "3 hours",
    pricePerPerson: 325,
    bestFor: ["dining", "couples", "adventure"],
    timeOfDay: "evening",
    occasion: ["anniversary", "honeymoon", "birthday"],
    unsplashKeyword: "omakase sushi private chef luxury dinner"
  }
];

export const catalogByName = new Map<string, CatalogActivity>(
  ACTIVITY_CATALOG.map((a) => [a.name.toLowerCase(), a])
);
