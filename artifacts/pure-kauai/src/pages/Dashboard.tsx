import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Copy, Check, Plus, RefreshCw, ExternalLink } from "lucide-react";
import { PureKauaiLogo } from "@/components/PureKauaiLogo";
import { useListItineraries } from "@workspace/api-client-react";
import PasswordGate from "@/components/PasswordGate";

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/trip/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-[0.08em] uppercase border transition-all duration-150"
      style={{
        borderColor: copied ? "#16a34a" : "#E8E0DB",
        color: copied ? "#16a34a" : "#6B7280",
        borderRadius: "2px",
        background: copied ? "#f0fdf4" : "#FDFCFB",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? (
        <Check className="h-3 w-3 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 shrink-0" />
      )}
      {copied ? "Copied" : "Copy Link"}
    </button>
  );
}

function StatusBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <span
      className="inline-flex items-center px-2.5 py-1 text-xs tracking-[0.08em] uppercase font-medium"
      style={{
        background: "#f0fdf4",
        color: "#15803d",
        border: "1px solid #bbf7d0",
        borderRadius: "2px",
      }}
    >
      Confirmed
    </span>
  ) : (
    <span
      className="inline-flex items-center px-2.5 py-1 text-xs tracking-[0.08em] uppercase font-medium"
      style={{
        background: "#fffbeb",
        color: "#92400e",
        border: "1px solid #fde68a",
        borderRadius: "2px",
      }}
    >
      Pending
    </span>
  );
}

function OccasionTag({ occasion }: { occasion: string }) {
  if (occasion === "None" || !occasion) {
    return <span style={{ color: "#C5BCBA" }}>—</span>;
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs"
      style={{
        background: "rgba(55,114,154,0.08)",
        color: "#37729A",
        borderRadius: "2px",
      }}
    >
      {occasion}
    </span>
  );
}

function CopyDemoLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const stored = sessionStorage.getItem("pk_authed");
    if (!stored) return;
    const password = prompt("Enter the portal password to generate a demo link:");
    if (!password) return;
    const encoded = btoa(password);
    const url = `${window.location.origin}/access?p=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs tracking-[0.12em] uppercase px-4 py-2 border transition-colors"
      style={{
        borderColor: copied ? "#16a34a" : "#E8E0DB",
        color: copied ? "#16a34a" : "#6B7280",
        borderRadius: "2px",
        background: copied ? "#f0fdf4" : "#FDFCFB",
      }}
      title="Generate a one-click demo link"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Demo Link"}
    </button>
  );
}

export default function Dashboard() {
  const { data: itineraries, isLoading, refetch, isFetching } = useListItineraries();

  const openTrip = (slug: string) => {
    window.open(`/trip/${slug}`, "_blank");
  };

  return (
    <PasswordGate>
      <div className="min-h-screen" style={{ background: "#FAF8F6" }}>

        {/* Top nav */}
        <header
          className="sticky top-0 z-20 border-b"
          style={{ background: "rgba(255,255,255,0.97)", borderColor: "#E8E0DB", backdropFilter: "blur(8px)" }}
        >
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <PureKauaiLogo variant="dark" size="sm" />
              <div className="w-px h-4" style={{ background: "#E8E0DB" }} />
              <span className="text-xs tracking-[0.22em] uppercase" style={{ color: "#937C66" }}>
                Concierge Dashboard
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 transition-opacity disabled:opacity-40"
                title="Refresh"
                style={{ color: "#8A7F7D" }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </button>
              <CopyDemoLinkButton />
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs tracking-[0.12em] uppercase px-4 py-2 border transition-colors"
                style={{
                  borderColor: "#053E50",
                  color: "#053E50",
                  borderRadius: "2px",
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                New Itinerary
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Title row */}
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h1
                className="text-2xl font-light mb-1"
                style={{ fontFamily: "'Source Serif 4', serif", color: "#053E50" }}
              >
                All Itineraries
              </h1>
              {!isLoading && itineraries && (
                <p className="text-xs tracking-[0.08em]" style={{ color: "#8A7F7D" }}>
                  {itineraries.length} {itineraries.length === 1 ? "itinerary" : "itineraries"} total
                  {" · "}
                  {itineraries.filter(i => i.approved).length} confirmed
                  {" · "}
                  {itineraries.filter(i => !i.approved).length} pending
                </p>
              )}
            </div>
          </div>

          {/* Table card */}
          <div
            className="rounded-sm overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid #E8E0DB",
              boxShadow: "0 1px 16px rgba(5,62,80,0.06)",
            }}
          >
            {isLoading ? (
              <div className="py-20 text-center">
                <div
                  className="inline-block h-5 w-5 rounded-full border border-t-transparent animate-spin"
                  style={{ borderColor: "#E8E0DB", borderTopColor: "#053E50" }}
                />
              </div>
            ) : !itineraries || itineraries.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm mb-1" style={{ color: "#8A7F7D" }}>No itineraries yet.</p>
                <p className="text-xs" style={{ color: "#C5BCBA" }}>
                  Create the first one using the form.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F0EAE6", background: "#FDFCFB" }}>
                      {["Guest Name", "Check-In", "Check-Out", "Occasion", "Status", "Created", ""].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs tracking-[0.12em] uppercase font-medium"
                          style={{ color: "#8A7F7D" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itineraries.map((item, idx) => (
                      <tr
                        key={item.id}
                        onClick={() => openTrip(item.slug)}
                        className="cursor-pointer transition-colors"
                        style={{
                          borderBottom: idx < itineraries.length - 1 ? "1px solid #F5F0EE" : undefined,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAF8F6")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td className="px-5 py-4">
                          <span
                            className="font-medium"
                            style={{
                              fontFamily: "'Source Serif 4', serif",
                              color: "#053E50",
                              fontSize: "0.925rem",
                            }}
                          >
                            {item.guestName}
                          </span>
                        </td>
                        <td className="px-5 py-4 tabular-nums" style={{ color: "#4B5563" }}>
                          {format(new Date(item.checkIn + "T00:00:00"), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-4 tabular-nums" style={{ color: "#4B5563" }}>
                          {format(new Date(item.checkOut + "T00:00:00"), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-4">
                          <OccasionTag occasion={item.specialOccasion} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge approved={item.approved} />
                        </td>
                        <td className="px-5 py-4 tabular-nums text-xs" style={{ color: "#8A7F7D" }}>
                          {format(new Date(item.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <CopyLinkButton slug={item.slug} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PasswordGate>
  );
}
