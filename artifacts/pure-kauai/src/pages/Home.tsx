import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import PasswordGate from "@/components/PasswordGate";
import { format } from "date-fns";
import {
  CalendarIcon, Loader2, Sparkles, Check,
  Minus, Plus, Users, Car, ShoppingBag, Home as HomeIcon,
  Flower2, ChefHat, Compass, ClipboardList, LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PureKauaiLogo } from "@/components/PureKauaiLogo";
import type { LucideIcon } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon: Icon,
  count,
}: {
  title: string;
  icon?: LucideIcon;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" style={{ color: "#37729A" }} />
        )}
        <h2
          className="font-light leading-tight"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "1.3rem", color: "#053E50" }}
        >
          {title}
        </h2>
      </div>
      {count !== undefined && count > 0 && (
        <span
          className="text-xs font-medium px-2.5 py-1 tracking-wide"
          style={{ background: "#053E50", color: "#EBE2E0", borderRadius: "2px" }}
        >
          {count} selected
        </span>
      )}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ border: "1px solid #E8E0DB", borderRadius: "2px", color: "#053E50" }}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-base font-medium tabular-nums" style={{ color: "#1A2E35" }}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ border: "1px solid #E8E0DB", borderRadius: "2px", color: "#053E50" }}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
  sublabel,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  sublabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 py-3 px-4 text-left transition-colors duration-150"
      style={{
        background: checked ? "rgba(5,62,80,0.045)" : "transparent",
        border: `1px solid ${checked ? "rgba(5,62,80,0.25)" : "#E8E0DB"}`,
        borderRadius: "2px",
      }}
    >
      <div>
        <span className="text-sm font-medium" style={{ color: checked ? "#053E50" : "#2D3748" }}>
          {label}
        </span>
        {sublabel && (
          <p className="text-xs mt-0.5" style={{ color: "#A5948D" }}>{sublabel}</p>
        )}
      </div>
      <div
        className="relative flex-shrink-0 rounded-full transition-colors duration-200"
        style={{ width: "2.5rem", height: "1.375rem", background: checked ? "#053E50" : "#D6CFC9" }}
      >
        <div
          className="absolute top-[2px] rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{
            width: "1.0rem",
            height: "1.0rem",
            transform: checked ? "translateX(1.3rem)" : "translateX(0.2rem)",
          }}
        />
      </div>
    </button>
  );
}

function TileButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full text-left px-3 py-2.5 text-sm transition-all duration-150"
      style={{
        border: selected ? "1.5px solid #053E50" : "1px solid #E8E0DB",
        borderRadius: "2px",
        background: selected ? "rgba(5,62,80,0.06)" : "#FDFCFB",
        color: selected ? "#053E50" : "#3D3533",
        fontWeight: selected ? 500 : 400,
        lineHeight: "1.35",
      }}
    >
      {selected && (
        <span className="absolute top-2 right-2">
          <Check className="h-3 w-3" style={{ color: "#053E50" }} />
        </span>
      )}
      <span className="pr-4">{label}</span>
    </button>
  );
}

function TileGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const selectedInGroup = items.filter((i) => selected.includes(i));
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs tracking-[0.18em] uppercase font-medium" style={{ color: "#37729A" }}>
          {title}
        </p>
        {selectedInGroup.length > 0 && (
          <button
            type="button"
            onClick={() => selectedInGroup.forEach((i) => onToggle(i))}
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ color: "#A5948D" }}
          >
            Clear {selectedInGroup.length}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {items.map((item) => (
          <TileButton
            key={item}
            label={item}
            selected={selected.includes(item)}
            onClick={() => onToggle(item)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Service lists ─────────────────────────────────────────────────────────────

const PRE_ARRIVAL_SERVICES = [
  "Villa Greeting & Orientation",
];

const TRANSPORT_SERVICES = [
  "Airport Pickup & Transportation",
  "Vehicle Delivery",
  "Private Transportation (daily driver)",
];

const GROCERY_SERVICES = [
  "Pre-Arrival Grocery Stocking",
];

const HOUSEKEEPING_SERVICES = [
  "Daily Housekeeping",
  "Evening Turndown Service",
  "Butler & Personal Assistants",
  "Childcare & Nanny Service",
];

const IN_VILLA_DINING = [
  "Private Chef — Breakfast",
  "Private Chef — Lunch",
  "Private Chef — Dinner",
  "Sushi & Omakase Chef",
  "Private Bartender & Mixologist",
  "Wine Sommelier & Cellar Curation",
  "Private Cooking Class with Chef",
];

const IN_VILLA_WELLNESS = [
  "Lomilomi Massage (Traditional Hawaiian)",
  "Couples Massage",
  "Massage & Facial Fusion",
  "Sound Bath & Healing Ceremony",
  "Restorative Yoga",
  "Private Pilates Session",
  "Meditation & Breathwork",
  "Reiki & Energy Healing",
];

const IN_VILLA_ENTERTAINMENT = [
  "Private Luau & Fire Show",
  "Hula Performance & Cultural Ceremony",
  "Ukulele Lesson & Hawaiian Storytelling",
  "Lei Making & Cultural Workshop",
  "Recording Studio Session",
  "Private Outdoor Movie Night",
  "Live Hawaiian Music at the Villa",
  "Sunset Bonfire on the Beach",
];

const EXCURSIONS_AIR = [
  "Sightseeing Helicopter Charter",
  "Doors-Off Helicopter — Na Pali & Waimea Canyon",
];

const EXCURSIONS_SEA = [
  "Na Pali Coast Private Boat Charter",
  "Sunset Sailing Cruise",
  "Deep Sea Fishing Charter",
  "Whale Watching Charter",
  "Private Snorkeling Tour",
  "Kayaking & Stand Up Paddleboarding",
];

const EXCURSIONS_LAND = [
  "North Shore Waterfall Hike (private guide)",
  "Waimea Canyon Guided Tour",
  "North Shore Wildlife & Botanical Hike",
  "ATV Adventure Tour",
  "Ziplining — North Shore",
  "Mountain Tubing",
  "Horseback Riding",
];

const EXCURSIONS_FAMILY = [
  "Family Surf Lesson at Hanalei Bay",
  "Kids Surf Camp",
  "Family Lifestyle & Portrait Photoshoot",
  "Drone Photography & Videography",
  "Tide Pool & Starfish Exploration",
  "Junior Chef Cooking Class",
];

const EXCURSIONS_GEAR = [
  "Gear Rentals (snorkel, paddleboard, bikes)",
  "Private Golf Tee Times — Princeville Makai",
  "Stargazing Experience with Astronomer",
];

// ─── Form schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
  hostName:  z.string().min(2, "Your name is required"),
  hostEmail: z.string().email("A valid email is required"),
  hostPhone: z.string().min(7, "A phone number is required"),

  guestName:      z.string().min(2, "Guest name is required"),
  checkIn:        z.date({ required_error: "Check-in date is required" }),
  checkOut:       z.date({ required_error: "Check-out date is required" }),

  adults:         z.coerce.number().min(1, "At least 1 adult required"),
  children:       z.coerce.number().min(0),
  childrenAges:   z.string().optional(),
  hasPets:        z.boolean().default(false),
  specialOccasion: z.enum([
    "None", "Anniversary", "Honeymoon", "Birthday", "Vow Renewal", "Proposal",
    "Bachelorette or Bachelor Party", "Babymoon", "Family Reunion", "Friendship Reunion",
    "Corporate Retreat", "Creative Retreat", "Wellness Retreat", "Celebration of Life",
    "Milestone — Other", "Just Because",
  ]),
  occasionDetails:        z.string().optional(),
  occasionDate:           z.string().optional(),
  occasionAcknowledgement: z.string().optional(),
  specialNotes:   z.string().optional(),
  groceryNotes:   z.string().optional(),

  villaServices:      z.array(z.string()).default([]),
  inVillaExperiences: z.array(z.string()).default([]),
  excursions:         z.array(z.string()).default([]),
  customRequest:      z.string().optional(),
}).refine((d) => !d.checkIn || !d.checkOut || d.checkOut > d.checkIn, {
  message: "Check-out must be after check-in",
  path: ["checkOut"],
});

type FormValues = z.infer<typeof formSchema>;

// ─── Generating Screen ────────────────────────────────────────────────────────

const MESSAGES = [
  "Crafting their Kauai journey…",
  "Curating their private experiences…",
  "Personalizing every moment…",
  "Their island story is taking shape…",
  "Almost ready to preview…",
];

function GeneratingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#053E50" }}
    >
      {/* Logo */}
      <PureKauaiLogo variant="light" size="xl" className="mb-14" />

      {/* Rotating ring animation */}
      <div className="relative mb-14" style={{ width: 64, height: 64 }}>
        {/* Outer slow ring */}
        <div
          className="absolute inset-0 rounded-full border opacity-20"
          style={{ borderColor: "#EBE2E0" }}
        />
        {/* Spinning arc */}
        <div
          className="absolute inset-0 rounded-full border-t border-r animate-spin"
          style={{
            borderColor: "transparent",
            borderTopColor: "#EBE2E0",
            borderRightColor: "#EBE2E0",
            opacity: 0.7,
            animationDuration: "2.4s",
            animationTimingFunction: "linear",
          }}
        />
        {/* Inner pulse dot */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#EBE2E0", opacity: 0.6 }}
          />
        </div>
      </div>

      {/* Rotating message */}
      <p
        className="text-center text-lg font-light tracking-wide transition-opacity duration-500"
        style={{
          fontFamily: "'Source Serif 4', Georgia, serif",
          color: "#EBE2E0",
          opacity: visible ? 1 : 0,
          minHeight: "2rem",
        }}
      >
        {MESSAGES[msgIndex]}
      </p>

      {/* Seconds counter */}
      <p
        className="mt-6 text-xs tracking-[0.25em] uppercase tabular-nums"
        style={{ color: "rgba(235,226,224,0.35)" }}
      >
        {seconds}s
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hostName: "", hostEmail: "", hostPhone: "",
      guestName: "", adults: 2, children: 0,
      hasPets: false,
      specialOccasion: "None",
      villaServices: [], inVillaExperiences: [], excursions: [],
    },
  });

  const children        = form.watch("children") ?? 0;
  const hasPets         = form.watch("hasPets") ?? false;
  const specialOccasion = form.watch("specialOccasion") ?? "None";
  const villaServs  = form.watch("villaServices") ?? [];
  const inVilla     = form.watch("inVillaExperiences") ?? [];
  const excursions  = form.watch("excursions") ?? [];
  const groceryOn   = villaServs.includes("Pre-Arrival Grocery Stocking");

  const totalSelected = villaServs.length + inVilla.length + excursions.length;

  function toggleField(field: "villaServices" | "inVillaExperiences" | "excursions", name: string) {
    const current = form.getValues(field) ?? [];
    form.setValue(field, current.includes(name) ? current.filter((s) => s !== name) : [...current, name]);
  }

  async function onSubmit(values: FormValues) {
    const notes = [values.specialNotes, values.groceryNotes ? `Grocery notes: ${values.groceryNotes}` : null]
      .filter(Boolean).join("\n") || null;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: values.guestName,
          checkIn:   format(values.checkIn,  "yyyy-MM-dd"),
          checkOut:  format(values.checkOut, "yyyy-MM-dd"),
          adults:    values.adults,
          children:  values.children,
          childrenAges:   values.childrenAges   || null,
          hasPets:        values.hasPets,
          specialOccasion: values.specialOccasion,
          occasionDetails:        values.occasionDetails        || null,
          occasionDate:           values.occasionDate           || null,
          occasionAcknowledgement: values.occasionAcknowledgement || null,
          specialNotes:    notes,
          villaServices:      values.villaServices,
          inVillaExperiences: values.inVillaExperiences,
          excursions:         values.excursions,
          customRequest: values.customRequest || null,
          hostName:  values.hostName  || null,
          hostEmail: values.hostEmail || null,
          hostPhone: values.hostPhone || null,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Server error — please try again.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let eventData = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: "))  eventData = line.slice(6);
          }

          if (eventType === "complete" && eventData) {
            const itinerary = JSON.parse(eventData) as { slug: string };
            setIsGenerating(false);
            setLocation(`/trip/${itinerary.slug}?host=1`);
            return;
          } else if (eventType === "error" && eventData) {
            const { error } = JSON.parse(eventData) as { error: string };
            throw new Error(error || "Generation failed.");
          }
        }
      }
      throw new Error("Connection closed unexpectedly — please try again.");
    } catch (err) {
      setIsGenerating(false);
      setGenerationError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    }
  }

  // ── Generating overlay ─────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <GeneratingScreen />
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <PasswordGate>
    <div className="min-h-screen pb-28 px-4 sm:px-6 lg:px-8 pt-10" style={{ background: "#FAF8F6" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.30em] uppercase mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border" style={{ color: "#937C66", borderColor: "#E0D8D4", background: "#FBF7F5" }}>
            ✦ Host Portal
          </p>
          <PureKauaiLogo variant="dark" size="xl" className="mx-auto mb-4" />
          <p className="text-sm tracking-[0.22em] uppercase mb-3" style={{ color: "#937C66" }}>
            Guest Journey Builder
          </p>
          <p className="text-sm max-w-sm mx-auto" style={{ color: "#8A7F7D", lineHeight: 1.6 }}>
            Complete this form to craft a personalized itinerary for your arriving guests.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 mt-4 text-xs tracking-[0.10em] uppercase transition-opacity hover:opacity-70"
            style={{ color: "#37729A" }}
          >
            <LayoutDashboard className="h-3 w-3" />
            View Dashboard
          </Link>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">

            {/* ══ GUEST PROFILE ══════════════════════════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader title="Guest Profile" icon={Users} />

              {/* Name */}
              <FormField control={form.control} name="guestName" render={({ field }) => (
                <FormItem className="mb-5">
                  <FormLabel className="form-label">Guest Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. The Harrison Family" className="form-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <FormField control={form.control} name="checkIn" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Check-in</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal form-input", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="checkOut" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Check-out</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal form-input", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Adults / Children — steppers */}
              <div className="grid grid-cols-2 gap-6 mb-5">
                <FormField control={form.control} name="adults" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Adults</FormLabel>
                    <FormControl>
                      <Stepper value={Number(field.value)} onChange={(v) => field.onChange(v)} min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="children" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Children</FormLabel>
                    <FormControl>
                      <Stepper value={Number(field.value)} onChange={(v) => field.onChange(v)} min={0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Children's ages — conditional */}
              {children > 0 && (
                <FormField control={form.control} name="childrenAges" render={({ field }) => (
                  <FormItem className="mb-5">
                    <FormLabel className="form-label">Children's Ages</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 4, 7, 12" className="form-input" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              )}

              {/* Pets */}
              <div className="mb-5">
                <p className="form-label mb-2">Pets</p>
                <ToggleSwitch
                  label="Bringing pet(s)"
                  checked={hasPets}
                  onChange={(v) => form.setValue("hasPets", v)}
                />
              </div>

              {/* Special Occasion */}
              <FormField control={form.control} name="specialOccasion" render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel className="form-label">Special Occasion</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Select occasion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        "None", "Anniversary", "Honeymoon", "Birthday", "Vow Renewal", "Proposal",
                        "Bachelorette or Bachelor Party", "Babymoon", "Family Reunion", "Friendship Reunion",
                        "Corporate Retreat", "Creative Retreat", "Wellness Retreat", "Celebration of Life",
                        "Milestone — Other", "Just Because",
                      ].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              {/* Occasion details — always visible */}
              <FormField control={form.control} name="occasionDetails" render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel className="form-label">Tell us more about the occasion <span style={{ color: "#8A7F7D", fontWeight: 400 }}>(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 50th birthday, product launch, retirement, divorce celebration, IPO, girls trip, returning guests"
                      className="form-input"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )} />

              {/* Occasion date + acknowledgement — only when occasion is set */}
              {specialOccasion !== "None" && (
                <>
                  <FormField control={form.control} name="occasionDate" render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel className="form-label">Date of Occasion</FormLabel>
                      <FormControl>
                        <Input type="date" className="form-input" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="occasionAcknowledgement" render={({ field }) => (
                    <FormItem className="mb-5">
                      <FormLabel className="form-label">How would you like us to acknowledge it? <span style={{ color: "#8A7F7D", fontWeight: 400 }}>(optional)</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. rose petals on arrival, surprise setup, custom cake, private sunset dinner"
                          className="form-input"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </>
              )}

              {/* Notes */}
              <FormField control={form.control} name="specialNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Guest Notes & Preferences</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dietary requirements, interests, pace of travel, allergies, favourite wines, anything the team should know…"
                      className="form-input min-h-[90px] resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {/* ══ PRE-ARRIVAL PLANNING ═══════════════════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader
                title="Pre-Arrival Planning"
                icon={ClipboardList}
                count={PRE_ARRIVAL_SERVICES.filter(s => villaServs.includes(s)).length || undefined}
              />
              <div className="space-y-2">
                {PRE_ARRIVAL_SERVICES.map((service) => (
                  <ToggleSwitch
                    key={service}
                    label={service}
                    sublabel="Complimentary"
                    checked={villaServs.includes(service)}
                    onChange={() => toggleField("villaServices", service)}
                  />
                ))}
              </div>
            </div>

            {/* ══ AIRPORT PICKUP & TRANSPORTATION ═══════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader
                title="Airport Pickup & Transportation"
                icon={Car}
                count={TRANSPORT_SERVICES.filter(s => villaServs.includes(s)).length || undefined}
              />
              <div className="space-y-2">
                {TRANSPORT_SERVICES.map((service) => (
                  <ToggleSwitch
                    key={service}
                    label={service}
                    checked={villaServs.includes(service)}
                    onChange={() => toggleField("villaServices", service)}
                  />
                ))}
              </div>
            </div>

            {/* ══ GROCERY SHOPPING & STOCKING ════════════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader
                title="Grocery Shopping & Stocking"
                icon={ShoppingBag}
                count={GROCERY_SERVICES.filter(s => villaServs.includes(s)).length || undefined}
              />
              <div className="space-y-2">
                {GROCERY_SERVICES.map((service) => (
                  <div key={service}>
                    <ToggleSwitch
                      label={service}
                      sublabel="Complimentary"
                      checked={villaServs.includes(service)}
                      onChange={() => toggleField("villaServices", service)}
                    />
                    {service === "Pre-Arrival Grocery Stocking" && groceryOn && (
                      <div className="mt-2">
                        <FormField control={form.control} name="groceryNotes" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Dietary requirements, preferences, favourite items, wines…"
                                className="form-input min-h-[70px] resize-none text-sm"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ══ DAILY HOUSEKEEPING ═════════════════════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader
                title="Daily Housekeeping"
                icon={HomeIcon}
                count={HOUSEKEEPING_SERVICES.filter(s => villaServs.includes(s)).length || undefined}
              />
              <div className="space-y-2">
                {HOUSEKEEPING_SERVICES
                  .filter((s) => s !== "Childcare & Nanny Service" || children > 0)
                  .map((service) => (
                    <ToggleSwitch
                      key={service}
                      label={service}
                      checked={villaServs.includes(service)}
                      onChange={() => toggleField("villaServices", service)}
                    />
                  ))}
              </div>
            </div>

            {/* ══ SPA & FITNESS SERVICES ═════════════════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader
                title="Spa & Fitness Services"
                icon={Flower2}
                count={inVilla.filter(s => IN_VILLA_WELLNESS.includes(s)).length || undefined}
              />
              <TileGroup
                title="Wellness & Restoration"
                items={IN_VILLA_WELLNESS}
                selected={inVilla}
                onToggle={(n) => toggleField("inVillaExperiences", n)}
              />
            </div>

            {/* ══ PRIVATE CHEFS & LUAUS ══════════════════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader
                title="Private Chefs & Luaus"
                icon={ChefHat}
                count={inVilla.filter(s => [...IN_VILLA_DINING, ...IN_VILLA_ENTERTAINMENT].includes(s)).length || undefined}
              />
              <TileGroup
                title="Private Dining"
                items={IN_VILLA_DINING}
                selected={inVilla}
                onToggle={(n) => toggleField("inVillaExperiences", n)}
              />
              <TileGroup
                title="Entertainment & Culture"
                items={IN_VILLA_ENTERTAINMENT}
                selected={inVilla}
                onToggle={(n) => toggleField("inVillaExperiences", n)}
              />
            </div>

            {/* ══ PERSONALIZED ACTIVITIES & ADVENTURES ══════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-2" style={{ background: "#FFFFFF", boxShadow: "0 1px 12px rgba(5,62,80,0.07)" }}>
              <SectionHeader
                title="Personalized Activities & Adventures"
                icon={Compass}
                count={excursions.length || undefined}
              />
              <TileGroup title="By Air"       items={EXCURSIONS_AIR}    selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="By Sea"       items={EXCURSIONS_SEA}    selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="By Land"      items={EXCURSIONS_LAND}   selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="Family & Kids" items={EXCURSIONS_FAMILY} selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="Gear & Extras" items={EXCURSIONS_GEAR}  selected={excursions} onToggle={(n) => toggleField("excursions", n)} />

              <div className="mt-2">
                <div className="h-px mb-5" style={{ background: "#EBE2E0" }} />
                <FormField control={form.control} name="customRequest" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Additional Requests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Special arrangements, private beaches, surprise setups, custom proposals…"
                        className="form-input min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ══ CONCIERGE DETAILS ══════════════════════════════════════════ */}
            <div className="rounded-sm p-6 sm:p-8 mb-6" style={{ background: "#053E50" }}>
              <div className="mb-6">
                <h2 className="font-light" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "1.3rem", color: "#EBE2E0" }}>
                  Your Details
                </h2>
                <p className="mt-1 text-xs" style={{ color: "rgba(235,226,224,0.5)" }}>
                  Shown on the guest itinerary so they can reach you directly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="hostName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="concierge-label">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Malia Fonoti" className="concierge-input" {...field} />
                    </FormControl>
                    <FormMessage style={{ color: "#f87171" }} />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hostEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="concierge-label">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@purekauai.com" className="concierge-input" {...field} />
                    </FormControl>
                    <FormMessage style={{ color: "#f87171" }} />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hostPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="concierge-label">Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 808 000 0000" className="concierge-input" {...field} />
                    </FormControl>
                    <FormMessage style={{ color: "#f87171" }} />
                  </FormItem>
                )} />
              </div>
            </div>

          </form>
        </Form>
      </div>

      {/* ── Sticky bottom bar ──────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4 border-t"
        style={{ background: "rgba(250,248,246,0.97)", borderColor: "#E8E0DB", backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {totalSelected > 0 && (
            <p className="text-xs whitespace-nowrap" style={{ color: "#8A7F7D" }}>
              <span className="font-medium" style={{ color: "#053E50" }}>{totalSelected}</span> service{totalSelected !== 1 ? "s" : ""} selected
            </p>
          )}
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="flex-1 py-5 text-sm tracking-[0.14em] uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#053E50", borderRadius: "2px" }}
            disabled={isGenerating}
          >
            <Sparkles className="mr-2.5 h-4 w-4" />
            Generate Itinerary
          </Button>
          {generationError && (
            <p className="text-xs whitespace-nowrap" style={{ color: "#B45309" }}>
              {generationError}
            </p>
          )}
        </div>
      </div>

      <style>{`
        .form-label { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: #6B7280; font-weight: 500; margin-bottom: 6px; display: block; }
        .form-input { border-color: #E8E0DB; border-radius: 2px; background: #FDFCFB; font-size: 0.9rem; }
        .form-input:focus { border-color: rgba(5,62,80,0.4); box-shadow: none; outline: none; }
        .concierge-label { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(235,226,224,0.6); font-weight: 500; margin-bottom: 6px; display: block; }
        .concierge-input { font-size: 0.875rem; background: rgba(255,255,255,0.1) !important; border: 1px solid rgba(235,226,224,0.2) !important; color: #EBE2E0 !important; border-radius: 2px; }
      `}</style>
    </div>
    </PasswordGate>
  );
}
