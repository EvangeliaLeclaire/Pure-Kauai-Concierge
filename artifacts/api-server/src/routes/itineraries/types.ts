export interface InvoiceItem {
  name: string;
  category: string;
  description: string;
  duration: string | null;
  pricePerUnit: number;
  quantity: number;
  unit: string;
  totalPrice: number;
  unsplashKeyword: string | null;
  photoUrl: string | null;
  notes: string | null;
}

export interface ItineraryActivity {
  time: string;
  name: string;
  description: string;
  unsplashKeyword: string;
  photoUrl: string | null;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  theme: string;
  date: string;
  activities: ItineraryActivity[];
}

export interface ItineraryListItem {
  id: string;
  slug: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  specialOccasion: string;
  approved: boolean;
  createdAt: string;
}

export interface Itinerary {
  id: string;
  slug: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: string | null;
  hasPets: boolean | null;
  specialOccasion: string;
  specialNotes: string | null;
  villaServices: string[];
  inVillaExperiences: string[];
  excursions: string[];
  customRequest: string | null;
  hostName: string | null;
  hostEmail: string | null;
  hostPhone: string | null;
  welcomeMessage: string | null;
  days: ItineraryDay[];
  invoice: InvoiceItem[];
  approved: boolean;
  invoiceNumber: string | null;
  approvedAt: string | null;
  viewCount?: number;
  lastViewedAt?: string | null;
  createdAt: string;
}
