import { Fragment, useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { format, parseISO } from "date-fns";
import {
  Clock, Users, Calendar,
  Sun, Sunset, Moon,
  Printer, Check, Link2, Mail, X, ChevronRight,
  Phone, MessageSquare, Pencil, Trash2, MoveRight,
} from "lucide-react";
import { useGetItinerary, useApproveItinerary, useUpdateItinerary, getGetItineraryQueryKey } from "@workspace/api-client-react";
import type { InvoiceItem, ItineraryPatch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PureKauaiLogo } from "@/components/PureKauaiLogo";

const CHAPTERS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TimeIcon({ time }: { time: string }) {
  const t = time.toLowerCase();
  if (t.includes("morning"))   return <Sun    className="h-3.5 w-3.5 shrink-0" style={{ color: "#937C66" }} />;
  if (t.includes("afternoon")) return <Sunset className="h-3.5 w-3.5 shrink-0" style={{ color: "#37729A" }} />;
  return                               <Moon  className="h-3.5 w-3.5 shrink-0" style={{ color: "#053E50" }} />;
}

function timeBg(time: string) {
  const t = time.toLowerCase();
  if (t.includes("morning"))   return "bg-amber-50/80  text-amber-800  border-amber-200/60";
  if (t.includes("afternoon")) return "bg-sky-50/80    text-sky-800    border-sky-200/60";
  return                               "bg-[#053E50]/8 text-[#053E50] border-[#053E50]/20";
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "PK";
  return name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ─── Request Change Modal ─────────────────────────────────────────────────────

function RequestChangeModal({
  activityName, hostEmail, guestName, tripId, message, onMessageChange, onClose,
}: {
  activityName: string;
  hostEmail: string | null | undefined;
  guestName: string;
  tripId: string;
  message: string;
  onMessageChange: (v: string) => void;
  onClose: () => void;
}) {
  const handleSend = () => {
    if (!hostEmail) { onClose(); return; }
    const subject = encodeURIComponent(`Change Request — ${guestName}: ${activityName}`);
    const body = encodeURIComponent(
      `Trip ID: ${tripId}\nGuest: ${guestName}\nActivity: ${activityName}\n\nRequest:\n${message}`
    );
    window.location.href = `mailto:${hostEmail}?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md mx-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-300" style={{ borderRadius: "2px" }}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[#A5948D] hover:text-[#053E50] transition-colors" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="px-8 py-10">
          <p className="text-xs tracking-[0.18em] uppercase mb-1.5" style={{ color: "#937C66" }}>Request a Change</p>
          <h2 className="text-xl font-light mb-1 leading-snug pr-8" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>
            {activityName}
          </h2>
          <p className="text-xs mb-6" style={{ color: "#A5948D" }}>
            Describe what you'd like adjusted. Your concierge will follow up personally.
          </p>
          <textarea
            className="w-full border border-[#E8E0DB] focus:border-[#053E50]/40 outline-none resize-none text-sm leading-relaxed px-4 py-3 transition-colors"
            style={{ borderRadius: "1px", color: "#1A2E35", minHeight: "120px", background: "#FAF8F6" }}
            placeholder="e.g. Could we move this to the morning? Or swap for something else?"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 border border-[#E8E0DB] hover:border-[#053E50]/30 text-sm tracking-[0.10em] uppercase py-3 transition-colors" style={{ borderRadius: "1px", color: "#8A7F7D" }}>
              Cancel
            </button>
            <button onClick={handleSend} disabled={!message.trim()} className="flex-1 text-white text-sm tracking-[0.10em] uppercase py-3 transition-opacity disabled:opacity-40" style={{ background: "#053E50", borderRadius: "1px" }}>
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Approve Modal ────────────────────────────────────────────────────────────

function ApproveModal({ guestName, onClose }: { guestName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md mx-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-300" style={{ borderRadius: "2px" }}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[#A5948D] hover:text-[#053E50] transition-colors" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="px-10 py-12 text-center">
          <div className="mb-8 flex justify-center">
            <PureKauaiLogo variant="dark" size="md" />
          </div>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#053E50]/8 ring-1 ring-[#053E50]/15">
            <Check className="h-8 w-8 text-[#053E50]" />
          </div>
          <h2 className="text-2xl font-serif font-light text-[#053E50] mb-3">Itinerary Approved</h2>
          <p className="text-[#5C5350] leading-relaxed text-sm">
            Thank you, <span className="font-medium text-[#053E50]">{guestName}</span>.
            Your concierge will be in touch within 24 hours to confirm all experiences and arrange any final details.
            We look forward to welcoming you to Kauai.
          </p>
          <div className="mt-5 mx-auto w-10 h-px bg-[#EBE2E0]" />
          <p className="mt-4 text-xs tracking-[0.15em] text-[#A5948D] uppercase">Pure Kauai Concierge</p>
          <button onClick={onClose} className="mt-8 w-full border border-[#E8E0DB] hover:border-[#053E50]/30 text-[#053E50] text-sm tracking-[0.12em] uppercase py-3.5 transition-colors duration-200" style={{ borderRadius: "1px" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Panel ────────────────────────────────────────────────────────────

function InvoicePanel({
  title, items, guestName, checkIn, checkOut, adults, children,
  hostName, hostEmail, hostPhone, itineraryId, approved,
  onApprove, isPending, isHostMode,
}: {
  title: string;
  items: InvoiceItem[];
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  hostName: string | null | undefined;
  hostEmail: string | null | undefined;
  hostPhone: string | null | undefined;
  itineraryId: string;
  approved: boolean;
  onApprove: () => void;
  isPending: boolean;
  isHostMode?: boolean;
}) {
  const totalGuests = adults + children;
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const deposit  = subtotal * 0.5;

  // Group by category (fall back to "Services" if category is missing)
  const grouped = items.reduce<Record<string, InvoiceItem[]>>((acc, item) => {
    const cat = item.category || "Services";
    acc[cat] = acc[cat] ?? [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  return (
    <div className="pb-40">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 md:px-10 py-12 md:py-16">

        {/* Letterhead */}
        <div className="flex justify-between items-start pb-8 mb-10 border-b-2 border-[#053E50]">
          <div>
            <PureKauaiLogo variant="dark" size="lg" />
            <div className="mt-5 space-y-0.5">
              <p className="text-xs" style={{ color: "#8A7F7D" }}>North Shore, Kauai, Hawaii 96714</p>
              <p className="text-xs" style={{ color: "#8A7F7D" }}>
                {hostEmail ?? "concierge@purekauai.com"} · {hostPhone ?? "+1 808 826 0000"}
              </p>
              {hostName && <p className="text-xs font-medium" style={{ color: "#053E50" }}>{hostName}, Pure Kauai Concierge</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-light" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>
              {title}
            </h2>
            {approved && (
              <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-[0.12em] uppercase px-3 py-1.5">
                <Check className="h-3 w-3" />
                Approved
              </div>
            )}
            <div className="mt-3 space-y-0.5">
              <p className="text-xs" style={{ color: "#B0A9A6" }}>Ref: {itineraryId.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs" style={{ color: "#B0A9A6" }}>{format(new Date(), "MMMM d, yyyy")}</p>
            </div>
          </div>
        </div>

        {/* Guest block */}
        <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-[#E8E0DB]">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase mb-2" style={{ color: "#8A7F7D" }}>Prepared for</p>
            <p className="font-medium text-lg" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>{guestName}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase mb-2" style={{ color: "#8A7F7D" }}>Travel Dates</p>
            <p className="text-sm font-medium" style={{ color: "#053E50" }}>
              {format(parseISO(checkIn), "MMMM d")} — {format(parseISO(checkOut), "MMMM d, yyyy")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8A7F7D" }}>
              {totalGuests} Guest{totalGuests !== 1 ? "s" : ""}
              {adults > 0 && ` (${adults} adult${adults !== 1 ? "s" : ""}${children > 0 ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""})`}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "#A5948D" }}>No services selected for this category.</p>
          </div>
        )}

        {/* Line items by category */}
        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <p className="text-xs tracking-[0.22em] uppercase mb-4 font-medium pb-2 border-b border-[#F0ECEA]" style={{ color: "#37729A" }}>
              {cat}
            </p>
            {grouped[cat].map((item, i) => (
              <div
                key={i}
                className="flex gap-4 py-5 border-b border-[#F7F3F1] items-start"
              >
                {/* Photo */}
                {item.photoUrl && (
                  <div className="shrink-0 w-20 h-16 overflow-hidden" style={{ borderRadius: "2px" }}>
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.src = `https://picsum.photos/seed/${item.name.replace(/\s+/g,"-").toLowerCase()}/160/128`;
                        el.onerror = null;
                      }}
                    />
                  </div>
                )}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm leading-snug" style={{ color: "#1A2E35" }}>{item.name}</p>
                      <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: "#8A7F7D" }}>{item.description}</p>
                      {item.duration && item.duration !== "N/A" && (
                        <p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: "#B0A9A6" }}>
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium" style={{ color: "#1A2E35" }}>
                        {item.pricePerUnit === 0 ? "Complimentary" : fmt(item.totalPrice)}
                      </p>
                      {item.pricePerUnit > 0 && item.unit === "flat rate" && (
                        <p className="text-xs mt-0.5" style={{ color: "#A5948D" }}>Flat rate</p>
                      )}
                      {item.pricePerUnit > 0 && item.unit === "per couple" && (
                        <p className="text-xs mt-0.5" style={{ color: "#A5948D" }}>
                          {fmt(item.pricePerUnit)} × {item.quantity} {item.quantity !== 1 ? "couples" : "couple"}
                        </p>
                      )}
                      {item.pricePerUnit > 0 && item.unit !== "flat rate" && item.unit !== "per couple" && (
                        <p className="text-xs mt-0.5" style={{ color: "#A5948D" }}>
                          {fmt(item.pricePerUnit)} ×{" "}
                          {item.unit === "per guest"  ? `${item.quantity} guest${item.quantity !== 1 ? "s" : ""}` :
                           item.unit === "per adult"  ? `${item.quantity} adult${item.quantity !== 1 ? "s" : ""}` :
                           item.unit === "per child"  ? `${item.quantity} ${item.quantity !== 1 ? "children" : "child"}` :
                           item.unit === "per night"  ? `${item.quantity} night${item.quantity !== 1 ? "s" : ""}` :
                           item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Totals */}
        {items.length > 0 && (
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm pb-4 border-b border-[#E8E0DB]">
                <span style={{ color: "#8A7F7D" }}>Subtotal</span>
                <span className="font-medium" style={{ color: "#1A2E35" }}>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <div className="text-sm font-medium" style={{ color: "#053E50" }}>Deposit Due Now</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8A7F7D" }}>50% to confirm reservation</div>
                </div>
                <span className="text-2xl font-light" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>
                  {fmt(deposit)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <div>
                  <div className="text-sm" style={{ color: "#8A7F7D" }}>Balance Due</div>
                  <div className="text-xs mt-0.5" style={{ color: "#B0A9A6" }}>30 days prior to arrival</div>
                </div>
                <span className="text-sm font-medium" style={{ color: "#5C5350" }}>{fmt(deposit)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fine print */}
        <div className="mt-10 pt-8 border-t border-[#E8E0DB]">
          <p className="text-xs leading-relaxed" style={{ color: "#B0A9A6" }}>
            This proposal is prepared exclusively for {guestName} and is valid for 14 days from the date above.
            All experiences are subject to availability and confirmed upon receipt of deposit.
            Rates are quoted in USD. Taxes, gratuities, and transportation not included unless stated.
          </p>
        </div>

        {/* Invoice actions */}
        <div className="print-hide mt-10 flex flex-col sm:flex-row gap-3">
          {isHostMode ? (
            /* Host: print only — approval is the guest's action */
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 border border-[#E8E0DB] hover:border-[#053E50]/30 text-sm tracking-[0.1em] uppercase py-4 transition-colors duration-200"
              style={{ color: "#5C5350", borderRadius: "1px" }}
            >
              <Printer className="h-4 w-4" />Print Quote
            </button>
          ) : !approved ? (
            <button
              onClick={onApprove}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2.5 text-white text-sm tracking-[0.12em] uppercase py-4 transition-opacity duration-200 disabled:opacity-60"
              style={{ background: "#053E50", borderRadius: "1px" }}
            >
              {isPending ? (
                <><span className="h-4 w-4 border border-white/40 border-t-white rounded-full animate-spin" />Confirming…</>
              ) : (
                <><Check className="h-4 w-4" />Approve & Confirm Itinerary</>
              )}
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm tracking-[0.1em] uppercase py-4" style={{ borderRadius: "1px" }}>
              <Check className="h-4 w-4" />Approved & Confirmed
            </div>
          )}
          {!isHostMode && (
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 border border-[#E8E0DB] hover:border-[#053E50]/30 text-sm tracking-[0.1em] uppercase py-4 px-6 transition-colors duration-200"
              style={{ color: "#5C5350", borderRadius: "1px" }}
            >
              <Printer className="h-4 w-4" />Print
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "journey" | "invoice";

export default function Trip() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const isHostMode = new URLSearchParams(search).get("host") === "1";
  const queryClient = useQueryClient();
  const { data: itinerary, isLoading } = useGetItinerary(id, {
    query: { enabled: !!id, queryKey: getGetItineraryQueryKey(id) },
  });

  const approveItinerary = useApproveItinerary();
  const patchItinerary   = useUpdateItinerary();
  const [copied,              setCopied]              = useState(false);
  const [hostBannerDismissed, setHostBannerDismissed] = useState(false);
  const [showModal,           setShowModal]           = useState(false);
  const [activeTab,           setActiveTab]           = useState<Tab>("journey");
  const [requestModal,        setRequestModal]        = useState<string | null>(null);
  const [requestMsg,          setRequestMsg]          = useState("");
  const [editingKey,          setEditingKey]          = useState<string | null>(null);
  const [editDraft,           setEditDraft]           = useState("");
  const [deletingKey,         setDeletingKey]         = useState<string | null>(null);

  // ── Dynamic meta tags (must be before any early returns) ─────────────────
  useEffect(() => {
    if (!itinerary) return;
    const pageTitle = `Your Pure Kauai Journey — ${itinerary.guestName}`;
    const pageDesc  = "Your personalized Kauai experience, crafted exclusively for you by Pure Kauai's concierge team.";

    document.title = pageTitle;

    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };

    setMeta('meta[name="description"]',         "content", pageDesc);
    setMeta('meta[property="og:title"]',        "content", pageTitle);
    setMeta('meta[property="og:description"]',  "content", pageDesc);
    setMeta('meta[name="twitter:title"]',       "content", pageTitle);
    setMeta('meta[name="twitter:description"]', "content", pageDesc);

    return () => {
      document.title = "Pure Kauai";
      setMeta('meta[name="description"]',         "content", "Bespoke luxury villa concierge on Kauai's north shore.");
      setMeta('meta[property="og:title"]',        "content", "Pure Kauai");
      setMeta('meta[property="og:description"]',  "content", "Bespoke luxury villa concierge on Kauai's north shore.");
      setMeta('meta[name="twitter:title"]',       "content", "Pure Kauai");
      setMeta('meta[name="twitter:description"]', "content", "Bespoke luxury villa concierge on Kauai's north shore.");
    };
  }, [itinerary?.guestName]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F6]">
        <div className="h-[60vh] bg-[#053E50] flex flex-col items-center justify-center gap-6">
          <PureKauaiLogo variant="light" size="md" className="opacity-60" />
          <Skeleton className="h-12 w-72 bg-white/10 rounded-none mt-4" />
          <Skeleton className="h-4 w-48 bg-white/10 rounded-none" />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
          <Skeleton className="h-[200px] w-full rounded-none" />
          <Skeleton className="h-[300px] w-full rounded-none" />
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
        <div className="text-center px-6 max-w-sm">
          <PureKauaiLogo variant="dark" size="lg" className="mx-auto mb-8" />
          <h2 className="text-2xl font-serif font-light text-[#053E50] mb-3">Journey Not Found</h2>
          <p className="text-[#8A7F7D] text-sm leading-relaxed mb-6">
            This itinerary link may have expired. Itineraries are stored temporarily — if the server restarted since it was generated, you'll need to regenerate it.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm tracking-[0.12em] uppercase text-white px-8 py-4 transition-opacity hover:opacity-80"
            style={{ background: "#053E50", borderRadius: "1px" }}
          >
            Generate New Itinerary
          </a>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalGuests = itinerary.adults + itinerary.children;
  const hasHost = !!(itinerary.hostName || itinerary.hostEmail || itinerary.hostPhone);
  const grandTotal = (itinerary.invoice ?? []).reduce((s, i) => s + i.totalPrice, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApprove = () => {
    approveItinerary.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItineraryQueryKey(id) });
        setShowModal(true);
      },
    });
  };

  // ── Host inline editing ───────────────────────────────────────────────────
  const handleSaveEdit = (key: string) => {
    let patch: ItineraryPatch = {};
    if (key === "welcome") {
      patch = { welcomeMessage: editDraft };
    } else if (key.startsWith("title-")) {
      const dayIdx = parseInt(key.slice(6));
      patch = {
        days: itinerary.days.map((d, di) =>
          di !== dayIdx ? d : { ...d, title: editDraft }
        ),
      };
    } else if (key.startsWith("desc-")) {
      const [, di, ai] = key.split("-").map(Number);
      patch = {
        days: itinerary.days.map((d, dIdx) =>
          dIdx !== di ? d : {
            ...d,
            activities: d.activities.map((a, aIdx) =>
              aIdx !== ai ? a : { ...a, description: editDraft }
            ),
          }
        ),
      };
    }
    patchItinerary.mutate({ id, data: patch }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItineraryQueryKey(id) });
        setEditingKey(null);
      },
    });
  };

  const startEdit = (key: string, initialValue: string) => {
    setEditingKey(key);
    setEditDraft(initialValue);
  };

  const handleDeleteActivity = (dayIdx: number, actIdx: number) => {
    const newDays = itinerary!.days.map((d, di) => {
      if (di !== dayIdx) return d;
      return { ...d, activities: d.activities.filter((_, ai) => ai !== actIdx) };
    });
    patchItinerary.mutate({ id, data: { days: newDays } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItineraryQueryKey(id) });
        setDeletingKey(null);
      },
    });
  };

  const handleMoveActivity = (fromDayIdx: number, actIdx: number, toDayIdx: number) => {
    const activity = itinerary!.days[fromDayIdx].activities[actIdx];
    const newDays = itinerary!.days.map((d, di) => {
      if (di === fromDayIdx) return { ...d, activities: d.activities.filter((_, ai) => ai !== actIdx) };
      if (di === toDayIdx)   return { ...d, activities: [...d.activities, activity] };
      return d;
    });
    patchItinerary.mutate({ id, data: { days: newDays } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItineraryQueryKey(id) });
      },
    });
  };

  // Clean guest URL always strips ?host=1 so guests see a pristine page
  const guestUrl = (() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("host");
    return url.toString();
  })();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl);
    } catch {
      // Clipboard API blocked — fall back to execCommand
      const ta = document.createElement("textarea");
      ta.value = guestUrl;
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmailGuest = () => {
    const subject = encodeURIComponent(`Your Pure Kauai Itinerary — ${itinerary.guestName}`);
    const body = encodeURIComponent(
      `Dear ${itinerary.guestName},\n\nYour bespoke Kauai itinerary is ready. Please find your personalized journey at the link below:\n\n${guestUrl}\n\nWarm aloha,\n${itinerary.hostName ?? "Pure Kauai Concierge"}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "journey", label: "Your Journey" },
    { id: "invoice", label: "Services & Quote", count: itinerary.invoice?.length ?? 0 },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: "#FAF8F6" }}>

      <style>{`
        @keyframes pkFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pkFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Modals */}
      {showModal && <ApproveModal guestName={itinerary.guestName} onClose={() => setShowModal(false)} />}
      {requestModal && (
        <RequestChangeModal
          activityName={requestModal}
          hostEmail={itinerary.hostEmail}
          guestName={itinerary.guestName}
          tripId={id}
          message={requestMsg}
          onMessageChange={setRequestMsg}
          onClose={() => setRequestModal(null)}
        />
      )}

      {/* ══ HOST PREVIEW BANNER ═════════════════════════════════════════════ */}
      {isHostMode && !hostBannerDismissed && (
        <div className="print-hide fixed top-0 left-0 right-0 z-50" style={{ background: "#022430", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
            <span className="text-xs tracking-[0.22em] uppercase font-medium shrink-0" style={{ color: "#937C66" }}>
              ✦ Host Preview
            </span>
            <span className="text-xs hidden sm:block" style={{ color: "rgba(235,226,224,0.5)" }}>·</span>
            <span className="text-xs hidden sm:block truncate" style={{ color: "rgba(235,226,224,0.55)" }}>
              Review this itinerary before sharing with {itinerary?.guestName ?? "your guest"}
            </span>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase py-1.5 px-3 transition-all"
                style={{ color: copied ? "#4ade80" : "#EBE2E0", border: "1px solid rgba(235,226,224,0.2)", borderRadius: "2px" }}
              >
                {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy Guest Link"}
              </button>
              <button
                onClick={handleEmailGuest}
                className="flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase py-1.5 px-3 transition-all"
                style={{ color: "#EBE2E0", border: "1px solid rgba(235,226,224,0.2)", borderRadius: "2px" }}
              >
                <Mail className="h-3 w-3" />
                Email Guest
              </button>
              <button
                onClick={() => setHostBannerDismissed(true)}
                className="ml-1 p-1 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: "#EBE2E0" }}
                aria-label="Dismiss host banner"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offset for banner height in host mode */}
      {isHostMode && !hostBannerDismissed && <div className="print-hide h-10" />}

      {/* ══ CINEMATIC HERO ══════════════════════════════════════════════════ */}
      <header
        className="relative h-screen max-h-[700px] min-h-[520px] flex flex-col justify-end overflow-hidden print-hide"
        style={{ background: "#053E50", animation: "pkFadeIn 1s ease-out both" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2400&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,62,80,0.6) 0%, rgba(5,62,80,0.15) 30%, rgba(5,62,80,0.1) 55%, rgba(2,36,48,0.92) 100%)" }} />

        <div className="absolute top-8 left-0 right-0 flex justify-center z-10 px-6">
          <PureKauaiLogo variant="light" size="md" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full px-6 sm:px-10 md:px-16 pb-14 md:pb-20">
          <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "rgba(235,226,224,0.55)" }}>
            A Bespoke Journey · Kauai, Hawaii
          </p>
          <h1
            className="font-light leading-[1.05] mb-6"
            style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              color: "#EBE2E0",
              letterSpacing: "-0.01em",
            }}
          >
            {itinerary.guestName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: "rgba(235,226,224,0.65)" }}>
            <span className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: "#937C66" }} />
              {format(parseISO(itinerary.checkIn), "MMMM d")} — {format(parseISO(itinerary.checkOut), "MMMM d, yyyy")}
            </span>
            <span style={{ color: "rgba(235,226,224,0.25)" }}>·</span>
            <span className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0" style={{ color: "#937C66" }} />
              {totalGuests} Guest{totalGuests !== 1 ? "s" : ""}
              {itinerary.children > 0 && ` (${itinerary.adults} adults, ${itinerary.children} children)`}
            </span>
            {itinerary.specialOccasion && itinerary.specialOccasion !== "None" && (
              <>
                <span style={{ color: "rgba(235,226,224,0.25)" }}>·</span>
                <span style={{ color: "rgba(235,226,224,0.65)" }}>{itinerary.specialOccasion}</span>
              </>
            )}
            {grandTotal > 0 && (
              <>
                <span style={{ color: "rgba(235,226,224,0.25)" }}>·</span>
                <span style={{ color: "rgba(235,226,224,0.65)" }}>{fmt(grandTotal)} total</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══ PERSONAL LETTER + CONCIERGE ═════════════════════════════════════ */}
      {(itinerary.welcomeMessage || hasHost) && (
        <section className="print-hide" style={{ background: "linear-gradient(180deg, #EDE5DF 0%, #F5EFE9 40%, #FAF8F6 100%)", animation: "pkFadeUp 0.9s ease-out 0.6s both" }}>
          <div className="max-w-3xl mx-auto px-6 sm:px-10 md:px-12 py-16 md:py-20">

            {/* Concierge byline */}
            {hasHost && (
              <div className="flex items-center gap-4 mb-10">
                <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#053E50" }}>
                  <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "1.25rem", fontWeight: 300, color: "#EBE2E0", lineHeight: 1 }}>
                    {getInitials(itinerary.hostName)}
                  </span>
                </div>
                <div>
                  <p className="text-xs tracking-[0.22em] uppercase mb-0.5" style={{ color: "#937C66" }}>Your Personal Concierge</p>
                  <p className="text-lg font-light" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>
                    {itinerary.hostName ?? "Pure Kauai Concierge"}
                  </p>
                </div>
              </div>
            )}

            {/* The Letter */}
            {itinerary.welcomeMessage && (
              <div>
                <div aria-hidden="true" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "5rem", lineHeight: 0.75, color: "#937C66", opacity: 0.25, marginBottom: "1rem", userSelect: "none" }}>"</div>
                <p className="mb-4 text-xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", fontWeight: 300, color: "#053E50" }}>
                  Dear {itinerary.guestName},
                </p>

                {isHostMode && editingKey === "welcome" ? (
                  <div className="mb-6">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="w-full border border-[#C5B9AF] focus:border-[#053E50]/50 outline-none resize-none p-4 transition-colors"
                      style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.9, color: "#2D4A55", background: "#FDFCFB", borderRadius: "1px", minHeight: "200px" }}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleSaveEdit("welcome")}
                        disabled={patchItinerary.isPending}
                        className="flex items-center gap-1.5 text-white text-xs tracking-[0.12em] uppercase px-4 py-2.5 transition-opacity disabled:opacity-50"
                        style={{ background: "#053E50", borderRadius: "1px" }}
                      >
                        {patchItinerary.isPending ? "Saving…" : "Save Letter"}
                      </button>
                      <button onClick={() => setEditingKey(null)} className="text-xs tracking-[0.1em] uppercase px-4 py-2.5 border border-[#E8E0DB] hover:border-[#053E50]/30 transition-colors" style={{ color: "#8A7F7D", borderRadius: "1px" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group/letter mb-6">
                    <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.1rem", lineHeight: 1.9, color: "#2D4A55" }}>
                      {itinerary.welcomeMessage}
                    </p>
                    {isHostMode && (
                      <button
                        onClick={() => startEdit("welcome", itinerary.welcomeMessage ?? "")}
                        className="print-hide absolute top-0 right-0 opacity-0 group-hover/letter:opacity-100 transition-opacity flex items-center gap-1 text-xs px-2 py-1 border border-[#E8E0DB] hover:border-[#053E50]/30"
                        style={{ color: "#937C66", background: "#FAF8F6", borderRadius: "1px" }}
                        title="Edit welcome letter"
                      >
                        <Pencil className="h-3 w-3" />Edit
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm mb-2" style={{ color: "#A5948D" }}>With warm aloha,</p>
                  <p className="text-xl font-light" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>
                    {itinerary.hostName ?? "Your Pure Kauai Concierge"}
                  </p>
                </div>
              </div>
            )}

            {/* Contact */}
            {hasHost && (
              <div className="mt-10 pt-8 border-t border-[#DDD5CF] flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex flex-wrap gap-x-6 gap-y-2 flex-1">
                  {itinerary.hostPhone && (
                    <a href={`tel:${itinerary.hostPhone}`} className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: "#37729A" }}>
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {itinerary.hostPhone}
                    </a>
                  )}
                  {itinerary.hostEmail && (
                    <a href={`mailto:${itinerary.hostEmail}`} className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: "#37729A" }}>
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {itinerary.hostEmail}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  {itinerary.hostPhone && (
                    <a href={`tel:${itinerary.hostPhone}`} className="inline-flex items-center gap-2 text-sm tracking-[0.10em] uppercase px-5 py-2.5 border transition-colors duration-200 hover:bg-white" style={{ borderColor: "#C9BAB0", color: "#053E50", borderRadius: "1px" }}>
                      <Phone className="h-3.5 w-3.5" />Call
                    </a>
                  )}
                  {itinerary.hostEmail && (
                    <a href={`mailto:${itinerary.hostEmail}`} className="inline-flex items-center gap-2 text-sm tracking-[0.10em] uppercase px-5 py-2.5 transition-colors duration-200 hover:opacity-90" style={{ background: "#053E50", color: "#EBE2E0", borderRadius: "1px" }}>
                      <Mail className="h-3.5 w-3.5" />Email
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ PRINT-ONLY HEADER ════════════════════════════════════════════════ */}
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
      <nav className="print-hide sticky top-0 z-20 bg-[#FAF8F6]/97 backdrop-blur-md border-b border-[#E8E0DB]">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-5 mr-6 sm:mr-8 text-sm tracking-wide transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id ? "text-[#053E50] font-medium" : "text-[#8A7F7D] hover:text-[#053E50]"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: activeTab === tab.id ? "#053E50" : "#E8E0DB",
                      color:      activeTab === tab.id ? "#EBE2E0"  : "#8A7F7D",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#053E50" }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ══ YOUR JOURNEY TAB ═════════════════════════════════════════════════ */}
      <main className={`pb-40 ${activeTab === "journey" ? "block print-hide" : "hidden"}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-10 py-14 md:py-20">
          <div className="space-y-20 md:space-y-28">

            {itinerary.days.map((day, dayIdx) => (
              <section
                key={day.dayNumber}
                style={{ animation: `pkFadeUp 0.7s ease-out ${1.0 + dayIdx * 0.2}s both` }}
              >
                {/* Chapter header */}
                <div className="mb-10 group/dayheader">
                  <p className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: "#937C66" }}>
                    Day {day.dayNumber}
                  </p>

                  {isHostMode && editingKey === `title-${dayIdx}` ? (
                    <div className="flex items-start gap-2 mb-1">
                      <input
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(`title-${dayIdx}`); if (e.key === "Escape") setEditingKey(null); }}
                        className="flex-1 border-b-2 border-[#053E50]/40 focus:border-[#053E50] outline-none bg-transparent pb-1 font-light"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)", color: "#053E50" }}
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(`title-${dayIdx}`)} disabled={patchItinerary.isPending} className="shrink-0 text-white text-xs px-3 py-2 mt-1 disabled:opacity-50" style={{ background: "#053E50", borderRadius: "1px" }}>
                        {patchItinerary.isPending ? "…" : "Save"}
                      </button>
                      <button onClick={() => setEditingKey(null)} className="shrink-0 text-xs px-3 py-2 mt-1 border border-[#E8E0DB]" style={{ color: "#8A7F7D", borderRadius: "1px" }}>✕</button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 mb-1">
                      <h2
                        className="font-light leading-tight"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", color: "#053E50" }}
                      >
                        {day.title ?? format(parseISO(day.date), "EEEE, MMMM d")}
                      </h2>
                      {isHostMode && (
                        <button
                          onClick={() => startEdit(`title-${dayIdx}`, day.title ?? format(parseISO(day.date), "EEEE, MMMM d"))}
                          className="print-hide shrink-0 mt-2 opacity-0 group-hover/dayheader:opacity-100 transition-opacity p-1.5 border border-[#E8E0DB] hover:border-[#053E50]/30"
                          style={{ color: "#937C66", borderRadius: "1px" }}
                          title="Edit day title"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-sm mb-1" style={{ color: "#8A7F7D" }}>
                    {format(parseISO(day.date), "EEEE, MMMM d")}
                  </p>
                  {day.theme && (
                    <p className="text-sm italic mb-4" style={{ color: "#937C66", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                      {day.theme}
                    </p>
                  )}
                  <div className="h-[2px] w-12" style={{ background: "#937C66" }} />
                </div>

                {/* Activity cards */}
                <div className="space-y-8">
                  {day.activities.map((activity, idx) => (
                    <article
                      key={idx}
                      className="bg-white overflow-hidden group"
                      style={{ boxShadow: "0 4px 32px rgba(5,62,80,0.08)", borderRadius: "2px" }}
                    >
                      {/* Photo */}
                      <div className="relative overflow-hidden" style={{ height: "clamp(200px, 35vw, 300px)" }}>
                        <div className="absolute inset-0" style={{ background: "#D4C9C1" }} />
                        {activity.photoUrl && (
                          <img
                            src={activity.photoUrl}
                            alt={activity.name}
                            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.04]"
                            style={{ opacity: 0 }}
                            onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                            onError={(e) => {
                              const el = e.currentTarget as HTMLImageElement;
                              const seed = activity.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
                              el.src = `https://picsum.photos/seed/${seed}/900/560`;
                              el.onerror = null;
                            }}
                          />
                        )}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 45%, rgba(5,62,80,0.4) 100%)" }} />

                        {/* Time badge */}
                        <div className="absolute top-4 left-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium border px-3 py-1.5 backdrop-blur-sm ${timeBg(activity.time)}`} style={{ borderRadius: "1px" }}>
                            <TimeIcon time={activity.time} />
                            {activity.time}
                          </span>
                        </div>

                      </div>

                      {/* Card content */}
                      <div className="px-7 py-8 sm:px-9 sm:py-9">
                        <h3
                          className="font-light mb-3 leading-snug"
                          style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "clamp(1.2rem, 3vw, 1.5rem)", color: "#053E50" }}
                        >
                          {activity.name}
                        </h3>
                        {isHostMode && editingKey === `desc-${dayIdx}-${idx}` ? (
                          <div className="mb-6">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              className="w-full border border-[#C5B9AF] focus:border-[#053E50]/50 outline-none resize-none p-4 transition-colors"
                              style={{ fontSize: "0.925rem", color: "#4A4340", lineHeight: 1.75, background: "#FDFCFB", borderRadius: "1px", minHeight: "120px" }}
                              autoFocus
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleSaveEdit(`desc-${dayIdx}-${idx}`)}
                                disabled={patchItinerary.isPending}
                                className="flex items-center gap-1.5 text-white text-xs tracking-[0.12em] uppercase px-4 py-2.5 transition-opacity disabled:opacity-50"
                                style={{ background: "#053E50", borderRadius: "1px" }}
                              >
                                {patchItinerary.isPending ? "Saving…" : "Save Changes"}
                              </button>
                              <button onClick={() => setEditingKey(null)} className="text-xs tracking-[0.1em] uppercase px-4 py-2.5 border border-[#E8E0DB] hover:border-[#053E50]/30 transition-colors" style={{ color: "#8A7F7D", borderRadius: "1px" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed mb-6" style={{ fontSize: "0.925rem", color: "#4A4340", lineHeight: 1.75 }}>
                            {activity.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-5 border-t border-[#F0ECEA] flex-wrap">
                          {isHostMode ? (
                            editingKey !== `desc-${dayIdx}-${idx}` && (
                              <>
                                {/* Move to day */}
                                {itinerary.days.length > 1 && deletingKey !== `${dayIdx}-${idx}` && (
                                  <div className="print-hide flex items-center gap-1.5">
                                    <MoveRight className="h-3 w-3 shrink-0" style={{ color: "#B0A9A6" }} />
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        const to = parseInt(e.target.value);
                                        if (!isNaN(to)) handleMoveActivity(dayIdx, idx, to);
                                      }}
                                      className="text-xs outline-none cursor-pointer py-1 pl-2 pr-5 border border-[#E8E0DB] hover:border-[#053E50]/30 transition-colors appearance-none bg-transparent"
                                      style={{ color: "#8A7F7D", borderRadius: "1px" }}
                                    >
                                      <option value="" disabled>Move to day…</option>
                                      {itinerary.days.map((d, di) =>
                                        di !== dayIdx ? (
                                          <option key={di} value={di}>
                                            Day {d.dayNumber}{d.title ? ` — ${d.title.slice(0, 28)}` : ""}
                                          </option>
                                        ) : null
                                      )}
                                    </select>
                                  </div>
                                )}

                                {/* Right-side actions */}
                                <div className="ml-auto flex items-center gap-3">
                                  {deletingKey === `${dayIdx}-${idx}` ? (
                                    /* Confirm delete */
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs" style={{ color: "#8A7F7D" }}>Remove this activity?</span>
                                      <button
                                        onClick={() => handleDeleteActivity(dayIdx, idx)}
                                        disabled={patchItinerary.isPending}
                                        className="text-xs tracking-[0.08em] uppercase px-3 py-1.5 text-white transition-opacity disabled:opacity-50"
                                        style={{ background: "#A04040", borderRadius: "1px" }}
                                      >
                                        {patchItinerary.isPending ? "…" : "Remove"}
                                      </button>
                                      <button
                                        onClick={() => setDeletingKey(null)}
                                        className="text-xs tracking-[0.08em] uppercase px-3 py-1.5 border border-[#E8E0DB] hover:border-[#053E50]/30 transition-colors"
                                        style={{ color: "#8A7F7D", borderRadius: "1px" }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setDeletingKey(`${dayIdx}-${idx}`)}
                                        className="print-hide inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                                        style={{ color: "#B0A9A6" }}
                                        title="Delete activity"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => startEdit(`desc-${dayIdx}-${idx}`, activity.description)}
                                        className="print-hide inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                                        style={{ color: "#937C66" }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit Activity
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )
                          ) : (
                            <button
                              onClick={() => { setRequestModal(activity.name); setRequestMsg(""); }}
                              className="ml-auto inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
                              style={{ color: "#B0A9A6" }}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Request Change
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

          </div>

          {/* Journey CTA */}
          <div className="mt-20 text-center pt-12 border-t border-[#E8E0DB]">
            <p className="text-sm mb-2" style={{ color: "#A5948D" }}>
              {itinerary.days.length} days · {itinerary.days.reduce((a, d) => a + d.activities.length, 0)} curated experiences
            </p>
            <p className="text-lg font-light mb-8" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#053E50" }}>
              Ready to review the details?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {(itinerary.invoice?.length ?? 0) > 0 && (
                <button onClick={() => setActiveTab("invoice")} className="inline-flex items-center gap-3 text-sm tracking-[0.14em] uppercase text-white px-8 py-4 transition-opacity duration-300 hover:opacity-85" style={{ background: "#053E50", borderRadius: "1px" }}>
                  Services &amp; Quote <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ══ SERVICES & PRICING TAB ══════════════════════════════════════════ */}
      <div className={activeTab === "invoice" ? "block" : "hidden"}>
        <InvoicePanel
          title="Services & Quote"
          items={itinerary.invoice ?? []}
          guestName={itinerary.guestName}
          checkIn={itinerary.checkIn}
          checkOut={itinerary.checkOut}
          adults={itinerary.adults}
          children={itinerary.children}
          hostName={itinerary.hostName}
          hostEmail={itinerary.hostEmail}
          hostPhone={itinerary.hostPhone}
          itineraryId={id}
          approved={itinerary.approved}
          onApprove={handleApprove}
          isPending={approveItinerary.isPending}
          isHostMode={isHostMode}
        />
      </div>

      {/* ══ STICKY ACTION BAR ════════════════════════════════════════════════ */}
      <div
        className="print-hide fixed bottom-0 left-0 right-0 z-30 border-t border-[#E8E0DB]"
        style={{ background: "rgba(250,248,246,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">

          {isHostMode ? (
            /* ── HOST BAR: sharing tools ─────────────────────────────── */
            <>
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase border py-3.5 sm:px-6 transition-all duration-200 hover:border-[#053E50]/40"
                style={{ borderColor: "#E8E0DB", color: copied ? "#37729A" : "#5C5350", borderRadius: "1px" }}
              >
                {copied ? <Check className="h-4 w-4 shrink-0" /> : <Link2 className="h-4 w-4 shrink-0" />}
                <span>{copied ? "Copied!" : "Copy Guest Link"}</span>
              </button>

              <button
                onClick={handleEmailGuest}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase border py-3.5 sm:px-6 transition-all duration-200 hover:border-[#053E50]/40"
                style={{ borderColor: "#E8E0DB", color: "#5C5350", borderRadius: "1px" }}
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span>Email Guest</span>
              </button>

              <div className="flex-1" />

              {grandTotal > 0 && (
                <div className="hidden sm:flex flex-col items-end mr-3">
                  <span className="text-xs" style={{ color: "#A5948D" }}>Total estimate</span>
                  <span className="text-sm font-medium" style={{ color: "#053E50" }}>{fmt(grandTotal)}</span>
                </div>
              )}

              <div
                className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase py-3.5 px-5 sm:px-8 border"
                style={{ borderColor: "#E8E0DB", color: "#8A7F7D", borderRadius: "1px" }}
              >
                <span className="hidden sm:inline">Awaiting guest approval</span>
                <span className="sm:hidden">Host Preview</span>
              </div>
            </>
          ) : (
            /* ── GUEST BAR: approve + print ──────────────────────────── */
            <>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase border py-3.5 px-4 sm:px-6 transition-all duration-200 hover:border-[#053E50]/40"
                style={{ borderColor: "#E8E0DB", color: "#5C5350", borderRadius: "1px" }}
              >
                <Printer className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <div className="flex-1" />

              {grandTotal > 0 && (
                <div className="hidden sm:flex flex-col items-end mr-3">
                  <span className="text-xs" style={{ color: "#A5948D" }}>Journey total</span>
                  <span className="text-sm font-medium" style={{ color: "#053E50" }}>{fmt(grandTotal)}</span>
                </div>
              )}

              {itinerary.approved ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase py-3.5 px-5 sm:px-8 bg-emerald-50 border border-emerald-200 text-emerald-700" style={{ borderRadius: "1px" }}>
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Confirmed</span>
                </div>
              ) : (
                <button
                  onClick={handleApprove}
                  disabled={approveItinerary.isPending}
                  className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.08em] uppercase text-white py-3.5 px-5 sm:px-8 transition-opacity duration-200 disabled:opacity-60"
                  style={{ background: "#053E50", borderRadius: "1px" }}
                >
                  {approveItinerary.isPending ? (
                    <span className="h-4 w-4 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                  <span>Approve &amp; Confirm</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
