export interface ItineraryActivity {
  time: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  pricePerPerson: number;
  unsplashKeyword: string;
  photoUrl: string | null;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: ItineraryActivity[];
}

export interface Itinerary {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  interests: string[];
  budgetTier: string;
  specialOccasion: string;
  specialNotes: string | null;
  hostName: string | null;
  hostEmail: string | null;
  hostPhone: string | null;
  welcomeMessage: string | null;
  days: ItineraryDay[];
  approved: boolean;
  createdAt: string;
}
