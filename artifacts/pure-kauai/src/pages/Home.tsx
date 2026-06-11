import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles, Check } from "lucide-react";
import { useCreateItinerary } from "@workspace/api-client-react";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2
        className="font-light leading-tight"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "1.55rem", color: "#053E50" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8A7F7D" }}>
          {subtitle}
        </p>
      )}
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
      className="w-full flex items-center justify-between gap-4 py-3.5 px-4 text-left transition-colors duration-150 group"
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
      {/* Toggle pill */}
      <div
        className="relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200"
        style={{
          width: "2.5rem",
          height: "1.375rem",
          background: checked ? "#053E50" : "#D6CFC9",
        }}
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
      className="relative w-full text-left px-4 py-3.5 text-sm transition-all duration-150 group"
      style={{
        border: selected ? "1.5px solid #053E50" : "1px solid #E8E0DB",
        borderRadius: "2px",
        background: selected ? "rgba(5,62,80,0.06)" : "#FDFCFB",
        color: selected ? "#053E50" : "#3D3533",
        fontWeight: selected ? 500 : 400,
      }}
    >
      {selected && (
        <span className="absolute top-2.5 right-2.5">
          <Check className="h-3 w-3" style={{ color: "#053E50" }} />
        </span>
      )}
      {label}
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
  return (
    <div className="mb-7">
      <p className="text-xs tracking-[0.18em] uppercase mb-3 font-medium" style={{ color: "#37729A" }}>
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
    "None", "Anniversary", "Honeymoon", "Birthday",
    "Family Reunion", "Corporate Retreat", "Vow Renewal", "Milestone Celebration",
  ]),
  specialNotes:   z.string().optional(),
  groceryNotes:   z.string().optional(),

  villaServices:      z.array(z.string()).default([]),
  inVillaExperiences: z.array(z.string()).default([]),
  excursions:         z.array(z.string()).default([]),
  customRequest:      z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [, setLocation] = useLocation();
  const createItinerary = useCreateItinerary();

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

  const isGenerating = createItinerary.isPending;
  const children    = form.watch("children") ?? 0;
  const hasPets     = form.watch("hasPets") ?? false;
  const villaServs  = form.watch("villaServices") ?? [];
  const inVilla     = form.watch("inVillaExperiences") ?? [];
  const excursions  = form.watch("excursions") ?? [];
  const groceryOn   = villaServs.includes("Pre-Arrival Grocery Stocking");

  function toggleField(field: "villaServices" | "inVillaExperiences" | "excursions", name: string) {
    const current = form.getValues(field) ?? [];
    form.setValue(field, current.includes(name) ? current.filter((s) => s !== name) : [...current, name]);
  }

  function onSubmit(values: FormValues) {
    const notes = [values.specialNotes, values.groceryNotes ? `Grocery notes: ${values.groceryNotes}` : null]
      .filter(Boolean).join("\n") || null;

    createItinerary.mutate(
      {
        data: {
          guestName: values.guestName,
          checkIn:   format(values.checkIn,  "yyyy-MM-dd"),
          checkOut:  format(values.checkOut, "yyyy-MM-dd"),
          adults:    values.adults,
          children:  values.children,
          childrenAges:   values.childrenAges   || null,
          hasPets:        values.hasPets,
          // @ts-ignore – enum values match
          specialOccasion: values.specialOccasion,
          specialNotes:    notes,
          villaServices:      values.villaServices,
          inVillaExperiences: values.inVillaExperiences,
          excursions:         values.excursions,
          customRequest: values.customRequest || null,
          hostName:  values.hostName  || null,
          hostEmail: values.hostEmail || null,
          hostPhone: values.hostPhone || null,
        },
      },
      { onSuccess: (data) => setLocation(`/trip/${data.id}`) }
    );
  }

  // ── Generating overlay ─────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F6" }}>
        <div className="text-center px-6">
          <PureKauaiLogo variant="dark" size="lg" className="mx-auto mb-10" />
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-5" style={{ color: "#937C66" }} />
          <p
            className="text-xl font-light"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}
          >
            Crafting your bespoke Kauai journey…
          </p>
          <p className="text-sm mt-3" style={{ color: "#8A7F7D" }}>
            This takes about 30 seconds
          </p>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: "#FAF8F6" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <PureKauaiLogo variant="dark" size="xl" className="mx-auto mb-4" />
          <p className="text-sm tracking-[0.22em] uppercase" style={{ color: "#937C66" }}>
            Concierge Services
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">

            {/* ══ SECTION 1: Guest Profile ════════════════════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Guest Profile"
                subtitle="Tell us about your guests so we can craft a truly personal experience."
              />

              {/* Guest Name */}
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
                    <FormLabel className="form-label">Check-in Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal form-input", !field.value && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            {field.value ? format(field.value, "MMMM d, yyyy") : "Select date"}
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
                    <FormLabel className="form-label">Check-out Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal form-input", !field.value && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            {field.value ? format(field.value, "MMMM d, yyyy") : "Select date"}
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

              {/* Adults / Children */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <FormField control={form.control} name="adults" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Adults</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} className="form-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="children" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Children</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} className="form-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Children's ages (conditional) */}
              {children > 0 && (
                <FormField control={form.control} name="childrenAges" render={({ field }) => (
                  <FormItem className="mb-5">
                    <FormLabel className="form-label">Children's Ages</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 4, 7, 12" className="form-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* Pets toggle */}
              <div className="mb-5">
                <p className="form-label mb-2">Bringing Pets?</p>
                <ToggleSwitch
                  label="Yes, we're bringing our pet(s)"
                  checked={hasPets}
                  onChange={(v) => form.setValue("hasPets", v)}
                />
              </div>

              {/* Special Occasion */}
              <FormField control={form.control} name="specialOccasion" render={({ field }) => (
                <FormItem className="mb-5">
                  <FormLabel className="form-label">Special Occasion</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Select occasion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["None", "Anniversary", "Honeymoon", "Birthday", "Family Reunion", "Corporate Retreat", "Vow Renewal", "Milestone Celebration"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Special Notes */}
              <FormField control={form.control} name="specialNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Tell us about your trip</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share anything that will help us create your perfect Kauai experience — dietary preferences, interests, pace of travel, anything that matters…"
                      className="form-input min-h-[110px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ══ SECTION 2: Pre-Arrival Planning ══════════════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Pre-Arrival Planning"
                subtitle="We handle every detail before you arrive so your villa is perfectly prepared and waiting."
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

            {/* ══ SECTION 3: Airport Pickup & Transportation ════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Airport Pickup & Transportation"
                subtitle="From the moment you land, your transportation is private, seamless, and entirely taken care of."
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

            {/* ══ SECTION 4: Grocery Shopping & Stocking ═══════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Grocery Shopping & Stocking"
                subtitle="Your villa stocked with everything you love — fresh provisions, fine wines, and any dietary needs."
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
                      <div className="mt-2 ml-1">
                        <FormField control={form.control} name="groceryNotes" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Dietary requirements, preferences, favorite items, wines…"
                                className="form-input min-h-[80px] resize-none text-sm"
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

            {/* ══ SECTION 5: Daily Housekeeping ════════════════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Daily Housekeeping"
                subtitle="Immaculate daily care so your villa always feels like the first moment you arrived."
              />
              <div className="space-y-2">
                {HOUSEKEEPING_SERVICES.filter((s) => s !== "Childcare & Nanny Service" || children > 0).map((service) => (
                  <ToggleSwitch
                    key={service}
                    label={service}
                    checked={villaServs.includes(service)}
                    onChange={() => toggleField("villaServices", service)}
                  />
                ))}
              </div>
            </div>

            {/* ══ SECTION 6: Spa & Fitness Services ════════════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Spa & Fitness Services"
                subtitle="World-class wellness brought directly to the villa — massages, healing ceremonies, yoga, and more."
              />
              <TileGroup title="Wellness & Restoration" items={IN_VILLA_WELLNESS} selected={inVilla} onToggle={(n) => toggleField("inVillaExperiences", n)} />
              {inVilla.filter((s) => IN_VILLA_WELLNESS.includes(s)).length > 0 && (
                <p className="mt-1 text-xs" style={{ color: "#937C66" }}>
                  {inVilla.filter((s) => IN_VILLA_WELLNESS.includes(s)).length} service{inVilla.filter((s) => IN_VILLA_WELLNESS.includes(s)).length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* ══ SECTION 7: Private Chefs & Luaus ═════════════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Private Chefs & Luaus"
                subtitle="From intimate candlelit dinners to full private luaus — your villa, your table, your moment."
              />
              <TileGroup title="Private Dining" items={IN_VILLA_DINING} selected={inVilla} onToggle={(n) => toggleField("inVillaExperiences", n)} />
              <TileGroup title="Entertainment & Culture" items={IN_VILLA_ENTERTAINMENT} selected={inVilla} onToggle={(n) => toggleField("inVillaExperiences", n)} />
              {inVilla.filter((s) => [...IN_VILLA_DINING, ...IN_VILLA_ENTERTAINMENT].includes(s)).length > 0 && (
                <p className="mt-1 text-xs" style={{ color: "#937C66" }}>
                  {inVilla.filter((s) => [...IN_VILLA_DINING, ...IN_VILLA_ENTERTAINMENT].includes(s)).length} experience{inVilla.filter((s) => [...IN_VILLA_DINING, ...IN_VILLA_ENTERTAINMENT].includes(s)).length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* ══ SECTION 8: Personalized Activities & Adventures ══════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-3"
              style={{ background: "#FFFFFF", boxShadow: "0 2px 20px rgba(5,62,80,0.07)" }}
            >
              <SectionHeader
                title="Personalized Activities & Adventures"
                subtitle="Private, exclusively arranged excursions across Kauai — by air, sea, and land."
              />
              <TileGroup title="By Air" items={EXCURSIONS_AIR} selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="By Sea" items={EXCURSIONS_SEA} selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="By Land" items={EXCURSIONS_LAND} selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="Family & Kids" items={EXCURSIONS_FAMILY} selected={excursions} onToggle={(n) => toggleField("excursions", n)} />
              <TileGroup title="Gear & Extras" items={EXCURSIONS_GEAR} selected={excursions} onToggle={(n) => toggleField("excursions", n)} />

              <div className="mt-4">
                <div className="h-px mb-6" style={{ background: "#EBE2E0" }} />
                <FormField control={form.control} name="customRequest" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="form-label">Anything Else?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="We can arrange almost anything — special deliveries, private beaches, custom proposals, surprise arrangements…"
                        className="form-input min-h-[90px] resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              {excursions.length > 0 && (
                <p className="mt-4 text-xs" style={{ color: "#937C66" }}>
                  {excursions.length} excursion{excursions.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* ══ CONCIERGE INFO ════════════════════════════════════════════════ */}
            <div
              className="rounded-sm p-8 sm:p-10 mb-8"
              style={{ background: "#053E50" }}
            >
              <div className="mb-8">
                <p className="text-xs tracking-[0.28em] uppercase mb-1.5" style={{ color: "rgba(235,226,224,0.5)" }}>
                  Concierge
                </p>
                <h2
                  className="font-light leading-tight"
                  style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "1.55rem", color: "#EBE2E0" }}
                >
                  Your Details
                </h2>
                <p className="mt-2 text-sm" style={{ color: "rgba(235,226,224,0.55)" }}>
                  Displayed on the guest itinerary so they can reach you directly.
                </p>
              </div>

              <div className="space-y-4">
                <FormField control={form.control} name="hostName" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(235,226,224,0.7)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Malia Fonoti"
                        className="text-sm"
                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(235,226,224,0.2)", color: "#EBE2E0", borderRadius: "2px" }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage style={{ color: "#f87171" }} />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="hostEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(235,226,224,0.7)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@purekauai.com"
                          className="text-sm"
                          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(235,226,224,0.2)", color: "#EBE2E0", borderRadius: "2px" }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="hostPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(235,226,224,0.7)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1 808 000 0000"
                          className="text-sm"
                          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(235,226,224,0.2)", color: "#EBE2E0", borderRadius: "2px" }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage style={{ color: "#f87171" }} />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full py-6 text-base tracking-[0.14em] uppercase text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: "#053E50", borderRadius: "2px" }}
              disabled={isGenerating}
            >
              <Sparkles className="mr-3 h-5 w-5" />
              Generate Itinerary
            </Button>

            {createItinerary.isError && (
              <p className="mt-4 text-sm text-center text-red-600">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </Form>
      </div>

      {/* Inline style for form labels */}
      <style>{`
        .form-label { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: #6B7280; font-weight: 500; margin-bottom: 6px; display: block; }
        .form-input { border-color: #E8E0DB; border-radius: 2px; background: #FDFCFB; font-size: 0.9rem; }
        .form-input:focus { border-color: rgba(5,62,80,0.4); box-shadow: none; outline: none; }
      `}</style>
    </div>
  );
}
