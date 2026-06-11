import { Fragment, useState } from "react";
import { useParams } from "wouter";
import { format, parseISO } from "date-fns";
import { Clock, Users, MapPin, Printer, Check, Link2, Mail, ChevronRight } from "lucide-react";
import { useGetItinerary, useApproveItinerary, getGetItineraryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Trip() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: itinerary, isLoading } = useGetItinerary(id, {
    query: {
      enabled: !!id,
      queryKey: getGetItineraryQueryKey(id),
    },
  });

  const approveItinerary = useApproveItinerary();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"journey" | "invoice">("journey");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F6]">
        <div className="h-[55vh] bg-[#053E50]" />
        <div className="max-w-4xl mx-auto px-6 -mt-24 space-y-6 pb-24">
          <Skeleton className="h-16 w-72 rounded-none bg-white/20" />
          <Skeleton className="h-6 w-56 rounded-none bg-white/10" />
          <div className="mt-20 space-y-6">
            <Skeleton className="h-[360px] w-full rounded-none" />
            <Skeleton className="h-[360px] w-full rounded-none" />
          </div>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xs tracking-[0.25em] text-[#37729A] uppercase mb-6">Pure Kauai</div>
          <h2 className="text-3xl font-serif font-light text-[#053E50]">Itinerary not found</h2>
          <p className="text-[#8A7F7D] mt-3">The journey you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    approveItinerary.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetItineraryQueryKey(id) });
        },
      }
    );
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

  const totalGuests = itinerary.adults + itinerary.children;

  const subtotal = itinerary.days.reduce((total, day) => {
    return total + day.activities.reduce((sum, act) => sum + act.pricePerPerson * totalGuests, 0);
  }, 0);
  const deposit = subtotal * 0.5;

  return (
    <div className="min-h-screen bg-[#FAF8F6] font-sans">

      {/* ── CINEMATIC HERO ── */}
      <div className="relative min-h-[62vh] flex flex-col justify-end overflow-hidden print-hide">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2400&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#053E50]/40 via-[#053E50]/50 to-[#042E3C]/90" />

        {/* Wordmark */}
        <div className="absolute top-10 left-0 right-0 flex justify-center">
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] text-white/60 uppercase">Pure Kauai</div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto w-full px-8 pb-14">
          <div className="text-xs tracking-[0.25em] text-[#C9B8A8] uppercase mb-5">A Bespoke Journey</div>
          <h1 className="text-5xl md:text-6xl font-serif font-light text-white leading-tight mb-6">
            {itinerary.guestName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70 mb-8">
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#C9B8A8]" />
              Kauai, Hawaii
            </span>
            <span className="text-white/30">·</span>
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#C9B8A8]" />
              {format(parseISO(itinerary.checkIn), "MMM d")} — {format(parseISO(itinerary.checkOut), "MMM d, yyyy")}
            </span>
            <span className="text-white/30">·</span>
            <span className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-[#C9B8A8]" />
              {totalGuests} Guests
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase border border-white/25 hover:border-white/50 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white rounded-full px-5 py-2.5 transition-all duration-300"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Share Link"}
            </button>
            <button
              onClick={handleEmailGuest}
              className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase border border-white/25 hover:border-white/50 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white rounded-full px-5 py-2.5 transition-all duration-300"
            >
              <Mail className="h-3.5 w-3.5" />
              Email Guest
            </button>
          </div>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print-show text-center py-12 border-b border-[#E8E0DB]">
        <div className="text-xs tracking-[0.35em] text-[#8A7F7D] uppercase mb-3">Pure Kauai</div>
        <h1 className="text-3xl font-serif font-light text-[#053E50] mb-2">{itinerary.guestName}</h1>
        <p className="text-sm text-[#8A7F7D]">
          {format(parseISO(itinerary.checkIn), "MMMM d")} — {format(parseISO(itinerary.checkOut), "MMMM d, yyyy")} · {totalGuests} Guests
        </p>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="print-hide sticky top-0 z-20 bg-[#FAF8F6]/95 backdrop-blur-md border-b border-[#E8E0DB]">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex gap-0">
            {(["journey", "invoice"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-5 px-1 mr-10 text-sm tracking-[0.08em] transition-colors duration-200 ${
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
      </div>

      {/* ── JOURNEY TAB ── */}
      {activeTab === "journey" && (
        <div className="print-show">
          {/* Welcome message */}
          {itinerary.welcomeMessage && (
            <div className="bg-[#053E50] px-8 py-16 print-hide">
              <div className="max-w-3xl mx-auto text-center">
                <div className="text-[#C9B8A8] text-2xl font-serif font-light italic leading-relaxed mb-6">
                  "{itinerary.welcomeMessage}"
                </div>
                <div className="w-8 h-px bg-[#C9B8A8]/50 mx-auto mb-4" />
                <div className="text-xs tracking-[0.2em] text-white/50 uppercase">Your Pure Kauai Concierge</div>
              </div>
            </div>
          )}

          {/* Days */}
          <div className="max-w-5xl mx-auto px-8 py-16 space-y-24">
            {itinerary.days.map((day, dayIdx) => (
              <div key={day.day}>
                {/* Day header */}
                <div className="flex items-baseline gap-6 mb-10">
                  <span className="text-[7rem] font-serif font-light leading-none text-[#053E50]/8 select-none -ml-1">
                    {String(dayIdx + 1).padStart(2, "0")}
                  </span>
                  <div className="-ml-12">
                    <div className="text-xs tracking-[0.25em] text-[#37729A] uppercase mb-1">Day {day.day}</div>
                    <div className="text-2xl font-serif font-light text-[#053E50]">
                      {format(parseISO(day.date), "EEEE, MMMM d")}
                    </div>
                  </div>
                </div>

                {/* Activity cards */}
                <div className="space-y-8">
                  {day.activities.map((activity, idx) => (
                    <div
                      key={idx}
                      className="bg-white shadow-[0_2px_24px_rgba(5,62,80,0.07)] overflow-hidden group"
                      style={{ borderRadius: "2px" }}
                    >
                      {/* Photo */}
                      <div className="relative h-72 overflow-hidden bg-[#E8E0DB]">
                        {activity.photoUrl && (
                          <img
                            src={activity.photoUrl}
                            alt={activity.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        <div className="absolute top-5 left-5 flex gap-2">
                          <span className="text-xs tracking-[0.12em] uppercase bg-white/90 backdrop-blur-sm text-[#053E50] px-3 py-1.5 font-medium">
                            {activity.time}
                          </span>
                        </div>
                        {activity.category && (
                          <div className="absolute top-5 right-5">
                            <span className="text-xs tracking-[0.12em] uppercase bg-[#053E50]/80 backdrop-blur-sm text-white/90 px-3 py-1.5">
                              {activity.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-8 md:p-10">
                        <div className="md:flex md:items-start md:justify-between gap-8">
                          <div className="flex-1">
                            <h3 className="text-2xl font-serif font-light text-[#053E50] mb-3 leading-snug">
                              {activity.name}
                            </h3>
                            <p className="text-[#5C5350] leading-relaxed text-[0.95rem]">
                              {activity.description}
                            </p>
                          </div>
                          <div className="mt-6 md:mt-0 md:shrink-0 md:text-right">
                            <div className="inline-flex items-center gap-2 text-sm text-[#37729A]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{activity.duration}</span>
                            </div>
                            {activity.pricePerPerson > 0 && (
                              <div className="mt-3">
                                <div className="text-xs tracking-[0.1em] text-[#8A7F7D] uppercase mb-1">From</div>
                                <div className="text-2xl font-serif font-light text-[#053E50]">
                                  ${activity.pricePerPerson.toLocaleString()}
                                </div>
                                <div className="text-xs text-[#8A7F7D]">per person</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* CTA to invoice */}
            <div className="print-hide pt-8 border-t border-[#E8E0DB] text-center">
              <p className="text-[#8A7F7D] text-sm mb-6 tracking-wide">Ready to make it official?</p>
              <button
                onClick={() => setActiveTab("invoice")}
                className="inline-flex items-center gap-3 bg-[#053E50] text-white text-sm tracking-[0.12em] uppercase px-10 py-4 hover:bg-[#042E3C] transition-colors duration-300"
                style={{ borderRadius: "1px" }}
              >
                Review Quote & Approve
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE TAB ── */}
      {activeTab === "invoice" && (
        <div className="print-show max-w-4xl mx-auto px-8 py-16">

          {/* Document header */}
          <div className="flex justify-between items-start mb-14 pb-10 border-b border-[#E8E0DB]">
            <div>
              <div className="text-xs tracking-[0.35em] text-[#8A7F7D] uppercase mb-4">Pure Kauai</div>
              <h2 className="text-3xl font-serif font-light text-[#053E50] mb-1">Travel Proposal</h2>
              <p className="text-[#8A7F7D] text-sm mt-2">Prepared exclusively for {itinerary.guestName}</p>
            </div>
            <div className="text-right">
              {itinerary.approved ? (
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-[0.15em] uppercase px-4 py-2">
                  <Check className="h-3.5 w-3.5" />
                  Confirmed
                </div>
              ) : (
                <div className="text-xs tracking-[0.12em] text-[#8A7F7D] uppercase">Awaiting Approval</div>
              )}
              <div className="text-xs text-[#B0A9A6] mt-3">
                Ref: {id?.slice(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-[#B0A9A6] mt-1">
                {format(new Date(), "MMMM d, yyyy")}
              </div>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E0DB]">
                <th className="text-left pb-4 text-xs tracking-[0.2em] text-[#8A7F7D] uppercase font-medium pr-8">Experience</th>
                <th className="text-right pb-4 text-xs tracking-[0.2em] text-[#8A7F7D] uppercase font-medium px-4">Rate</th>
                <th className="text-right pb-4 text-xs tracking-[0.2em] text-[#8A7F7D] uppercase font-medium px-4">Guests</th>
                <th className="text-right pb-4 text-xs tracking-[0.2em] text-[#8A7F7D] uppercase font-medium pl-8">Amount</th>
              </tr>
            </thead>
            <tbody>
              {itinerary.days.map((day) => (
                <Fragment key={day.day}>
                  <tr>
                    <td colSpan={4} className="pt-8 pb-3">
                      <div className="text-xs tracking-[0.2em] text-[#37729A] uppercase font-medium">
                        {format(parseISO(day.date), "EEEE, MMMM d")}
                      </div>
                    </td>
                  </tr>
                  {day.activities.map((activity, idx) => (
                    <tr key={idx} className="border-b border-[#F0ECEA] group">
                      <td className="py-4 pr-8">
                        <div className="font-medium text-[#1A2E35]">{activity.name}</div>
                        <div className="text-xs text-[#8A7F7D] mt-0.5">{activity.time} · {activity.duration}</div>
                      </td>
                      <td className="py-4 px-4 text-right text-[#5C5350]">
                        ${activity.pricePerPerson.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-[#5C5350]">{totalGuests}</td>
                      <td className="py-4 pl-8 text-right font-medium text-[#1A2E35]">
                        ${(activity.pricePerPerson * totalGuests).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>

          {/* Totals block */}
          <div className="mt-10 ml-auto max-w-xs">
            <div className="space-y-3 pb-5 border-b border-[#E8E0DB]">
              <div className="flex justify-between text-sm">
                <span className="text-[#8A7F7D]">Subtotal</span>
                <span className="text-[#1A2E35] font-medium">${subtotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="pt-5 space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-sm font-medium text-[#053E50]">Deposit Due Now</div>
                  <div className="text-xs text-[#8A7F7D] mt-0.5">50% to confirm reservation</div>
                </div>
                <span className="text-2xl font-serif font-light text-[#053E50]">${deposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-4">
                <div>
                  <span className="text-[#8A7F7D]">Balance Due</span>
                  <div className="text-xs text-[#8A7F7D] mt-0.5">30 days prior to arrival</div>
                </div>
                <span className="text-[#5C5350] font-medium">${deposit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Fine print */}
          <div className="mt-12 pt-8 border-t border-[#E8E0DB]">
            <p className="text-xs text-[#B0A9A6] leading-relaxed max-w-lg">
              This proposal is prepared exclusively for {itinerary.guestName} and is valid for 14 days from the date above. 
              All experiences are subject to availability. Rates are quoted in USD per person unless otherwise noted.
            </p>
          </div>

          {/* Action bar */}
          <div className="print-hide mt-14 space-y-4">
            {!itinerary.approved ? (
              <>
                <button
                  onClick={handleApprove}
                  disabled={approveItinerary.isPending}
                  className="w-full bg-[#053E50] hover:bg-[#042E3C] disabled:opacity-60 text-white py-5 text-sm tracking-[0.15em] uppercase transition-colors duration-300 flex items-center justify-center gap-3"
                  style={{ borderRadius: "1px" }}
                >
                  {approveItinerary.isPending ? (
                    <>
                      <span className="inline-block w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    <>
                      Approve & Confirm Itinerary
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-[#B0A9A6]">
                  By approving, you confirm your intent to proceed. A deposit invoice will follow.
                </p>
              </>
            ) : (
              <div
                className="w-full bg-emerald-50 border border-emerald-200 py-5 flex items-center justify-center gap-3"
                style={{ borderRadius: "1px" }}
              >
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-sm tracking-[0.12em] uppercase text-emerald-700 font-medium">
                  Itinerary Approved & Confirmed
                </span>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="w-full border border-[#E8E0DB] hover:border-[#053E50]/30 text-[#5C5350] hover:text-[#053E50] py-4 text-xs tracking-[0.15em] uppercase transition-colors duration-300 flex items-center justify-center gap-2"
              style={{ borderRadius: "1px" }}
            >
              <Printer className="h-4 w-4" />
              Download / Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
