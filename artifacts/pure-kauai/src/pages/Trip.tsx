import { Fragment, useState } from "react";
import { useParams } from "wouter";
import { format, parseISO } from "date-fns";
import {
  Clock, Users, MapPin, Calendar,
  Sun, Sunset, Moon,
  Printer, Check, Link2, Mail, X, ChevronRight,
} from "lucide-react";
import { useGetItinerary, useApproveItinerary, getGetItineraryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PureKauaiLogo } from "@/components/PureKauaiLogo";

// ─── Time-of-day icon ────────────────────────────────────────────────────────

function TimeIcon({ time }: { time: string }) {
  const t = time.toLowerCase();
  if (t.includes("morning"))   return <Sun    className="h-4 w-4 shrink-0" style={{ color: "#937C66" }} />;
  if (t.includes("afternoon")) return <Sunset className="h-4 w-4 shrink-0" style={{ color: "#37729A" }} />;
  return                               <Moon  className="h-4 w-4 shrink-0" style={{ color: "#053E50" }} />;
}

function timeBg(time: string) {
  const t = time.toLowerCase();
  if (t.includes("morning"))   return "bg-amber-50  text-amber-800  border-amber-200";
  if (t.includes("afternoon")) return "bg-sky-50    text-sky-800    border-sky-200";
  return                               "bg-[#053E50]/8 text-[#053E50] border-[#053E50]/20";
}

// ─── Approve modal ───────────────────────────────────────────────────────────

function ApproveModal({ guestName, onClose }: { guestName: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full max-w-md mx-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-300"
        style={{ borderRadius: "2px" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#A5948D] hover:text-[#053E50] transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-10 py-12 text-center">
          {/* Logo */}
          <div className="mb-8">
            <PureKauaiLogo variant="dark" size="md" />
          </div>

          {/* Check circle */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#053E50]/8 ring-1 ring-[#053E50]/15">
            <Check className="h-8 w-8 text-[#053E50]" />
          </div>

          <h2 className="text-2xl font-serif font-light text-[#053E50] mb-3">
            Itinerary Approved
          </h2>
          <p className="text-[#5C5350] leading-relaxed text-sm">
            Thank you, <span className="font-medium text-[#053E50]">{guestName}</span>.
            Your concierge will be in touch within 24 hours to confirm your
            experiences and arrange any final details. We look forward to
            welcoming you to Kauai.
          </p>

          <div className="mt-2 mx-auto w-10 h-px bg-[#EBE2E0]" />

          <p className="mt-4 text-xs tracking-[0.15em] text-[#A5948D] uppercase">
            Pure Kauai Concierge
          </p>

          <button
            onClick={onClose}
            className="mt-8 w-full border border-[#E8E0DB] hover:border-[#053E50]/30 text-[#053E50] text-sm tracking-[0.12em] uppercase py-3.5 transition-colors duration-200"
            style={{ borderRadius: "1px" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Trip() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: itinerary, isLoading } = useGetItinerary(id, {
    query: { enabled: !!id, queryKey: getGetItineraryQueryKey(id) },
  });

  const approveItinerary = useApproveItinerary();
  const [copied,      setCopied]      = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [activeTab,   setActiveTab]   = useState<"journey" | "invoice">("journey");

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F6]">
        <div className="h-[50vh] bg-[#053E50] flex flex-col items-center justify-center gap-6">
          <Skeleton className="h-5 w-32 bg-white/10 rounded-none" />
          <Skeleton className="h-12 w-64 bg-white/10 rounded-none" />
          <Skeleton className="h-4 w-48 bg-white/10 rounded-none" />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-[300px] w-full rounded-none" />
          <Skeleton className="h-[300px] w-full rounded-none" />
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <PureKauaiLogo variant="dark" size="lg" className="mx-auto mb-8" />
          <h2 className="text-2xl font-serif font-light text-[#053E50]">Itinerary not found</h2>
          <p className="text-[#8A7F7D] text-sm">The journey you're looking for does not exist.</p>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalGuests = itinerary.adults + itinerary.children;
  const subtotal = itinerary.days.reduce((acc, day) =>
    acc + day.activities.reduce((s, a) => s + a.pricePerPerson * totalGuests, 0), 0);
  const deposit  = subtotal * 0.5;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApprove = () => {
    approveItinerary.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItineraryQueryKey(id) });
        setShowModal(true);
      },
    });
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailGuest = () => {
    const subject = encodeURIComponent(`Your Pure Kauai Itinerary — ${itinerary.guestName}`);
    const body = encodeURIComponent(
      `Dear ${itinerary.guestName},\n\nYour bespoke Kauai itinerary is ready. Please find your personalized journey and quote at the link below:\n\n${window.location.href}\n\nWe look forward to welcoming you to the island.\n\nWarm aloha,\nPure Kauai Concierge`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePrint = () => window.print();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F6] font-sans">

      {/* ══ HERO (screen only) ══════════════════════════════════════════════ */}
      <header
        className="relative min-h-[58vh] flex flex-col justify-end overflow-hidden print-hide"
        style={{ background: "#053E50" }}
      >
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2400&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,62,80,0.55) 0%, rgba(5,62,80,0.65) 50%, rgba(2,40,52,0.92) 100%)" }} />

        {/* Logo — top center */}
        <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
          <PureKauaiLogo variant="light" size="md" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto w-full px-6 md:px-10 pb-16 pt-32">
          <div className="text-xs tracking-[0.28em] uppercase mb-4" style={{ color: "#EBE2E0", opacity: 0.7 }}>
            A Bespoke Journey · Kauai, Hawaii
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-light leading-tight mb-5"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#EBE2E0" }}
          >
            {itinerary.guestName}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mb-8" style={{ color: "rgba(235,226,224,0.72)" }}>
            <span className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" style={{ color: "#937C66" }} />
              {format(parseISO(itinerary.checkIn), "MMMM d")} — {format(parseISO(itinerary.checkOut), "MMMM d, yyyy")}
            </span>
            <span style={{ color: "rgba(235,226,224,0.3)" }}>·</span>
            <span className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" style={{ color: "#937C66" }} />
              {totalGuests} Guest{totalGuests !== 1 ? "s" : ""}
              {itinerary.children > 0 && ` (${itinerary.adults} adults, ${itinerary.children} children)`}
            </span>
          </div>

          {/* Welcome message */}
          {itinerary.welcomeMessage && (
            <div
              className="max-w-2xl border-l-2 pl-5 py-1"
              style={{ borderColor: "rgba(147,124,102,0.5)" }}
            >
              <p
                className="text-base leading-relaxed italic"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "rgba(235,226,224,0.85)", fontWeight: 300 }}
              >
                "{itinerary.welcomeMessage}"
              </p>
              <p className="mt-3 text-xs tracking-[0.18em] uppercase not-italic" style={{ color: "rgba(235,226,224,0.45)" }}>
                — Your Pure Kauai Concierge
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Print-only header */}
      <div className="hidden print-show py-10 border-b border-[#E8E0DB]">
        <div className="max-w-3xl mx-auto px-8 flex justify-between items-start">
          <PureKauaiLogo variant="dark" size="lg" />
          <div className="text-right">
            <p className="text-xs tracking-[0.2em] text-[#8A7F7D] uppercase">Travel Proposal</p>
            <p className="text-xs text-[#B0A9A6] mt-1">{format(new Date(), "MMMM d, yyyy")}</p>
          </div>
        </div>
      </div>

      {/* ══ TAB NAV (screen only) ════════════════════════════════════════════ */}
      <nav className="print-hide sticky top-0 z-20 bg-[#FAF8F6]/96 backdrop-blur-md border-b border-[#E8E0DB]">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="flex">
            {(["journey", "invoice"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-5 mr-8 text-sm transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-[#053E50] font-medium"
                    : "text-[#8A7F7D] hover:text-[#053E50]"
                }`}
              >
                {tab === "journey" ? "Your Journey" : "Quote & Invoice"}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#053E50]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ══ JOURNEY TAB ══════════════════════════════════════════════════════ */}
      <main
        className={`pb-36 ${activeTab === "journey" ? "block print-hide" : "hidden"}`}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16 space-y-16 md:space-y-20">
          {itinerary.days.map((day, dayIdx) => (
            <section key={day.day}>
              {/* Day header */}
              <div className="flex items-center gap-5 mb-8">
                <div className="shrink-0">
                  <div className="text-xs tracking-[0.22em] uppercase" style={{ color: "#37729A" }}>Day {day.day}</div>
                  <div
                    className="text-xl sm:text-2xl font-light mt-0.5"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}
                  >
                    {format(parseISO(day.date), "EEEE, MMMM d")}
                  </div>
                </div>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #E8E0DB, transparent)" }} />
                <div
                  className="shrink-0 text-5xl font-light leading-none select-none"
                  style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "rgba(5,62,80,0.07)" }}
                >
                  {String(dayIdx + 1).padStart(2, "0")}
                </div>
              </div>

              {/* Activity cards */}
              <div className="space-y-6">
                {day.activities.map((activity, idx) => (
                  <article
                    key={idx}
                    className="bg-white overflow-hidden group"
                    style={{ boxShadow: "0 2px 20px rgba(5,62,80,0.07)", borderRadius: "2px" }}
                  >
                    {/* Photo */}
                    <div className="relative h-56 sm:h-64 bg-[#E8E0DB] overflow-hidden">
                      {activity.photoUrl && (
                        <img
                          src={activity.photoUrl}
                          alt={activity.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            const seed = activity.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
                            el.src = `https://picsum.photos/seed/${seed}/900/560`;
                            el.onerror = null;
                          }}
                        />
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(5,62,80,0.35) 100%)" }} />

                      {/* Time badge */}
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium border px-3 py-1.5 ${timeBg(activity.time)}`} style={{ borderRadius: "1px" }}>
                          <TimeIcon time={activity.time} />
                          {activity.time}
                        </span>
                      </div>

                      {/* Category badge */}
                      {activity.category && (
                        <div className="absolute top-4 right-4">
                          <span className="text-xs tracking-[0.12em] uppercase px-3 py-1.5 bg-[#053E50]/75 backdrop-blur-sm" style={{ color: "#EBE2E0", borderRadius: "1px" }}>
                            {activity.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="px-6 py-7 sm:px-8 sm:py-8">
                      <h3
                        className="text-xl sm:text-2xl font-light mb-3 leading-snug"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}
                      >
                        {activity.name}
                      </h3>
                      <p className="text-sm leading-relaxed mb-5" style={{ color: "#5C5350" }}>
                        {activity.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#F0ECEA]">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#937C66" }}>
                          <Clock className="h-3.5 w-3.5" />
                          {activity.duration}
                        </span>
                        {activity.pricePerPerson > 0 && (
                          <span className="text-xs" style={{ color: "#A5948D" }}>
                            From <strong style={{ color: "#053E50" }}>${activity.pricePerPerson.toLocaleString()}</strong> per person
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {/* CTA to invoice */}
          <div className="text-center pt-4 border-t border-[#E8E0DB]">
            <p className="text-sm mb-5" style={{ color: "#8A7F7D" }}>Ready to make this journey official?</p>
            <button
              onClick={() => setActiveTab("invoice")}
              className="inline-flex items-center gap-3 text-sm tracking-[0.12em] uppercase text-white px-10 py-4 transition-colors duration-300 hover:opacity-90"
              style={{ background: "#053E50", borderRadius: "1px" }}
            >
              Review Quote & Approve
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* ══ INVOICE TAB ══════════════════════════════════════════════════════ */}
      <div id="invoice-document" className={`pb-36 ${activeTab === "invoice" ? "block" : "hidden print-show"}`}>
        <div className="max-w-3xl mx-auto px-6 sm:px-8 md:px-10 py-12 md:py-16">

          {/* Letterhead */}
          <div className="flex justify-between items-start pb-8 mb-10 border-b-2 border-[#053E50]">
            <div>
              <PureKauaiLogo variant="dark" size="lg" />
              <div className="mt-4 space-y-0.5">
                <p className="text-xs" style={{ color: "#8A7F7D" }}>North Shore, Kauai, Hawaii 96714</p>
                <p className="text-xs" style={{ color: "#8A7F7D" }}>concierge@purekauai.com · +1 808 826 0000</p>
              </div>
            </div>
            <div className="text-right">
              <h2
                className="text-2xl font-light"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}
              >
                Travel Proposal
              </h2>
              {itinerary.approved && (
                <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-[0.12em] uppercase px-3 py-1.5">
                  <Check className="h-3 w-3" />
                  Approved & Confirmed
                </div>
              )}
              <div className="mt-3 space-y-0.5">
                <p className="text-xs" style={{ color: "#B0A9A6" }}>Ref: {id?.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs" style={{ color: "#B0A9A6" }}>{format(new Date(), "MMMM d, yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Guest block */}
          <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-[#E8E0DB]">
            <div>
              <p className="text-xs tracking-[0.18em] uppercase mb-2" style={{ color: "#8A7F7D" }}>Prepared for</p>
              <p className="font-medium text-lg" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>{itinerary.guestName}</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.18em] uppercase mb-2" style={{ color: "#8A7F7D" }}>Travel Dates</p>
              <p className="text-sm font-medium" style={{ color: "#053E50" }}>
                {format(parseISO(itinerary.checkIn), "MMMM d")} — {format(parseISO(itinerary.checkOut), "MMMM d, yyyy")}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8A7F7D" }}>
                {totalGuests} Guest{totalGuests !== 1 ? "s" : ""}
                {itinerary.adults > 0 && ` (${itinerary.adults} adult${itinerary.adults !== 1 ? "s" : ""}${itinerary.children > 0 ? `, ${itinerary.children} child${itinerary.children !== 1 ? "ren" : ""}` : ""})`}
              </p>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #E8E0DB" }}>
                <th className="text-left pb-3 text-xs tracking-[0.18em] uppercase font-medium" style={{ color: "#8A7F7D" }}>Experience</th>
                <th className="text-right pb-3 text-xs tracking-[0.18em] uppercase font-medium px-3" style={{ color: "#8A7F7D" }}>Rate</th>
                <th className="text-right pb-3 text-xs tracking-[0.18em] uppercase font-medium px-3" style={{ color: "#8A7F7D" }}>Guests</th>
                <th className="text-right pb-3 text-xs tracking-[0.18em] uppercase font-medium pl-4" style={{ color: "#8A7F7D" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {itinerary.days.map((day) => (
                <Fragment key={day.day}>
                  <tr>
                    <td colSpan={4} className="pt-7 pb-2">
                      <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: "#37729A" }}>
                        {format(parseISO(day.date), "EEEE, MMMM d")}
                      </span>
                    </td>
                  </tr>
                  {day.activities.map((activity, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F4F0EE" }}>
                      <td className="py-4 pr-3">
                        <div className="font-medium text-sm" style={{ color: "#1A2E35" }}>{activity.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#8A7F7D" }}>{activity.time} · {activity.duration}</div>
                      </td>
                      <td className="py-4 px-3 text-right text-sm" style={{ color: "#5C5350" }}>
                        ${activity.pricePerPerson.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-right text-sm" style={{ color: "#5C5350" }}>
                        {totalGuests}
                      </td>
                      <td className="py-4 pl-4 text-right text-sm font-medium" style={{ color: "#1A2E35" }}>
                        ${(activity.pricePerPerson * totalGuests).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm pb-4 border-b border-[#E8E0DB]">
                <span style={{ color: "#8A7F7D" }}>Subtotal</span>
                <span className="font-medium" style={{ color: "#1A2E35" }}>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <div className="text-sm font-medium" style={{ color: "#053E50" }}>Deposit Due Now</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8A7F7D" }}>50% to confirm reservation</div>
                </div>
                <span
                  className="text-2xl font-light"
                  style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}
                >
                  ${deposit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <div>
                  <div className="text-sm" style={{ color: "#8A7F7D" }}>Balance Due</div>
                  <div className="text-xs mt-0.5" style={{ color: "#B0A9A6" }}>30 days prior to arrival</div>
                </div>
                <span className="text-sm font-medium" style={{ color: "#5C5350" }}>${deposit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Fine print */}
          <div className="mt-10 pt-8 border-t border-[#E8E0DB]">
            <p className="text-xs leading-relaxed" style={{ color: "#B0A9A6" }}>
              This proposal is prepared exclusively for {itinerary.guestName} and is valid for 14 days from the date above.
              All experiences are subject to availability and confirmed upon receipt of deposit. Rates are quoted in USD.
              Taxes, gratuities, and transportation not included unless stated.
            </p>
          </div>

          {/* Invoice action buttons (screen only) */}
          <div className="print-hide mt-10 flex flex-col sm:flex-row gap-3">
            {!itinerary.approved ? (
              <button
                onClick={handleApprove}
                disabled={approveItinerary.isPending}
                className="flex-1 flex items-center justify-center gap-2.5 text-white text-sm tracking-[0.12em] uppercase py-4 transition-opacity duration-200 disabled:opacity-60"
                style={{ background: "#053E50", borderRadius: "1px" }}
              >
                {approveItinerary.isPending ? (
                  <>
                    <span className="h-4 w-4 border border-white/40 border-t-white rounded-full animate-spin" />
                    Confirming…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Approve & Confirm Itinerary
                  </>
                )}
              </button>
            ) : (
              <div
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm tracking-[0.1em] uppercase py-4"
                style={{ borderRadius: "1px" }}
              >
                <Check className="h-4 w-4" />
                Approved & Confirmed
              </div>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 border border-[#E8E0DB] hover:border-[#053E50]/30 text-sm tracking-[0.1em] uppercase py-4 px-6 transition-colors duration-200"
              style={{ color: "#5C5350", borderRadius: "1px" }}
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      {/* ══ STICKY ACTION BAR (screen only) ════════════════════════════════ */}
      <div
        className="print-hide fixed bottom-0 left-0 right-0 z-30 border-t border-[#E8E0DB]"
        style={{ background: "rgba(250,248,246,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase border py-3.5 sm:px-6 transition-all duration-200 hover:border-[#053E50]/40"
            style={{
              borderColor: "#E8E0DB",
              color: copied ? "#37729A" : "#5C5350",
              borderRadius: "1px",
            }}
          >
            {copied ? <Check className="h-4 w-4 shrink-0" /> : <Link2 className="h-4 w-4 shrink-0" />}
            <span className="hidden xs:inline sm:inline">{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          {/* Email Guest */}
          <button
            onClick={handleEmailGuest}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase border py-3.5 sm:px-6 transition-all duration-200 hover:border-[#053E50]/40"
            style={{ borderColor: "#E8E0DB", color: "#5C5350", borderRadius: "1px" }}
          >
            <Mail className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">Email Guest</span>
          </button>

          {/* Spacer */}
          <div className="flex-1 hidden sm:block" />

          {/* Approve Itinerary */}
          {itinerary.approved ? (
            <div
              className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase py-3.5 px-5 sm:px-8 bg-emerald-50 border border-emerald-200 text-emerald-700"
              style={{ borderRadius: "1px" }}
            >
              <Check className="h-4 w-4 shrink-0" />
              <span>Confirmed</span>
            </div>
          ) : (
            <button
              onClick={handleApprove}
              disabled={approveItinerary.isPending}
              className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase text-white py-3.5 px-5 sm:px-8 transition-opacity duration-200 disabled:opacity-60 hover:opacity-90"
              style={{ background: "#053E50", borderRadius: "1px" }}
            >
              {approveItinerary.isPending ? (
                <span className="h-4 w-4 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4 shrink-0" />
              )}
              <span>Approve Itinerary</span>
            </button>
          )}
        </div>
      </div>

      {/* ══ APPROVE MODAL ═══════════════════════════════════════════════════ */}
      {showModal && (
        <ApproveModal
          guestName={itinerary.guestName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

