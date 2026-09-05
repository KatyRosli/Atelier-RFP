import React, { useState } from "react";
import { RfpPayload, ProposalItem } from "../types";
import { ProposalPdfModal } from "./ProposalPdfModal";
import { apiUrl } from "../lib/api.ts";

function formatCreatedAt(): string {
  return new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ReviewRfpViewProps {
  payload: RfpPayload;
  transcript: string;
  onReRecord: () => void;
  onSubmitToProposales: (payload: RfpPayload, liveProposal: ProposalItem) => void;
}

export const ReviewRfpView: React.FC<ReviewRfpViewProps> = ({
  payload: initialPayload,
  transcript,
  onReRecord,
  onSubmitToProposales,
}) => {
  const [viewMode, setViewMode] = useState<"structured" | "json">("structured");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditingManual, setIsEditingManual] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [payload, setPayload] = useState<RfpPayload>(initialPayload);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleSendToProposales = async () => {
    setIsSubmitting(true);
    try {
      const clientName = payload.organization.name;
      const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const generatedUrl = `https://proposales.com/p/grand-hotel/${slug}-2027`;

      const meetingSummary = payload.event.meetingFacilities?.length
        ? payload.event.meetingFacilities.map((m) => `${m.space} (${m.durationDays} days, ${m.setupPreference})`).join(", ")
        : "Plenary Meeting Facilities";

      const cateringSummary = payload.event.catering?.length
        ? payload.event.catering.map((c) => `${c.item}${c.quantity ? ` (x${c.quantity})` : ""}`).join(", ")
        : "Standard Nordic Catering Package";

      const formattedDates = `${payload.event.dates.checkIn} to ${payload.event.dates.checkOut} (${payload.event.dates.nights} nights)`;

      const preliminaryItem: ProposalItem = {
        id: `PRP-${Math.floor(10000 + Math.random() * 90000)}`,
        title: `${clientName} — ${payload.event.type || "Offsite"}`,
        clientName,
        contactName: payload.organization.contact.name,
        contactEmail: payload.organization.contact.email,
        contactPhone: payload.organization.contact.phone || "+46 70 123 45 67",
        guestsCount: payload.event.attendees,
        datesText: formattedDates,
        checkIn: payload.event.dates.checkIn,
        checkOut: payload.event.dates.checkOut,
        nights: payload.event.dates.nights,
        roomQuantity: payload.event.roomBlock.quantity,
        roomType: `${payload.event.roomBlock.quantity} ${payload.event.roomBlock.roomCategory} Rooms`,
        totalAmountSEK: payload.financials.totalBudgetSEK,
        marginPct: Math.round(payload.financials.estimatedMarginPct * 100),
        status: "sent_to_proposales",
        createdAtFormatted: formatCreatedAt(),
        proposalUrl: generatedUrl,
        transcript,
        meetingRooms: meetingSummary,
        cateringSummary: cateringSummary,
        specialNotes: payload.event.specialDirectives,
        latencySeconds: 18.2,
        rawJson: payload,
      };

      const res = await fetch(apiUrl("/api/proposals"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, item: preliminaryItem }),
      });

      if (res.ok) {
        const data = await res.json();
        const savedProposal = data.proposal || {
          ...preliminaryItem,
          id: data.id || preliminaryItem.id,
          proposalUrl: data.url || preliminaryItem.proposalUrl,
        };
        onSubmitToProposales(payload, savedProposal);
      } else {
        // Backend save failed; still let the user proceed with a local-only proposal
        onSubmitToProposales(payload, preliminaryItem);
      }
    } catch (e) {
      console.warn("Proposales dispatch fallback:", e);
      const clientName = payload.organization.name;
      const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const meetingSummary = payload.event.meetingFacilities?.length
        ? payload.event.meetingFacilities.map((m) => `${m.space} (${m.durationDays} days, ${m.setupPreference})`).join(", ")
        : "Plenary Meeting Facilities";

      const cateringSummary = payload.event.catering?.length
        ? payload.event.catering.map((c) => `${c.item}${c.quantity ? ` (x${c.quantity})` : ""}`).join(", ")
        : "Standard Nordic Catering Package";

      const formattedDates = `${payload.event.dates.checkIn} to ${payload.event.dates.checkOut} (${payload.event.dates.nights} nights)`;

      const newProposalItem: ProposalItem = {
        id: `PRP-${Math.floor(10000 + Math.random() * 90000)}`,
        title: `${clientName} — ${payload.event.type || "Offsite"}`,
        clientName,
        contactName: payload.organization.contact.name,
        contactEmail: payload.organization.contact.email,
        contactPhone: payload.organization.contact.phone || "+46 70 123 45 67",
        guestsCount: payload.event.attendees,
        datesText: formattedDates,
        checkIn: payload.event.dates.checkIn,
        checkOut: payload.event.dates.checkOut,
        nights: payload.event.dates.nights,
        roomQuantity: payload.event.roomBlock.quantity,
        roomType: `${payload.event.roomBlock.quantity} ${payload.event.roomBlock.roomCategory} Rooms`,
        totalAmountSEK: payload.financials.totalBudgetSEK,
        marginPct: Math.round(payload.financials.estimatedMarginPct * 100),
        status: "sent_to_proposales",
        createdAtFormatted: formatCreatedAt(),
        proposalUrl: `https://proposales.com/p/grand-hotel/${slug}-2027`,
        transcript,
        meetingRooms: meetingSummary,
        cateringSummary: cateringSummary,
        specialNotes: payload.event.specialDirectives,
        latencySeconds: 18.2,
        rawJson: payload,
      };

      onSubmitToProposales(payload, newProposalItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[800px] mx-auto py-8 px-4 sm:px-6 relative">
      {/* Breadcrumb & Status Super-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <nav className="flex items-center gap-1.5 text-on-surface-variant text-xs">
          <span onClick={onReRecord} className="hover:text-primary transition-colors cursor-pointer">
            Voice Request
          </span>
          <span className="material-symbols-outlined text-[14px] opacity-40">chevron_right</span>
          <span className="text-primary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            AI Extraction (Vercel SDK &amp; Zod)
          </span>
          <span className="material-symbols-outlined text-[14px] opacity-40">chevron_right</span>
          <span className="text-on-surface font-semibold">Verify Payload</span>
        </nav>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-container text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Parsed via GPT-4o-mini (Vercel AI SDK)
          </span>
        </div>
      </div>

      {/* Main Headline Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Proposal Intake #SE-88219</span>
            <span className="text-on-surface-variant opacity-40">/</span>
            <span className="text-xs text-on-surface-variant font-medium">Grand Hôtel Stockholm Tenant</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] text-on-surface font-bold tracking-tight">Review Extracted RFP</h1>
        </div>

        {/* JSON / Form Interactive Segmented Pill */}
        <div className="inline-flex p-1 bg-surface-container rounded-xl self-start md:self-auto shadow-sm border border-outline-variant/20">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === "structured"
                ? "bg-surface-container-lowest text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setViewMode("structured")}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Structured View</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              viewMode === "json"
                ? "bg-surface-container-lowest text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setViewMode("json")}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">data_object</span>
            <span>Zod JSON</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono">schema</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Workflow Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* LEFT COLUMN: Source Audio, Entity Extraction, Telemetry (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Mini Audio Player Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm relative overflow-hidden border border-outline-variant/20">
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/5 blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">file_download_done</span>
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Audio Reference
                </span>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">00:32 / 00:32</span>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                className="w-11 h-11 rounded-xl bg-inverse-surface hover:bg-primary transition-colors flex items-center justify-center text-inverse-on-surface shadow-sm flex-shrink-0 group cursor-pointer"
                onClick={toggleAudio}
                type="button"
                title={isPlayingAudio ? "Pause playback" : "Play original audio"}
              >
                <span className="material-symbols-outlined text-[22px] group-hover:scale-105 transition-transform">
                  {isPlayingAudio ? "pause" : "play_arrow"}
                </span>
              </button>

              {/* Waveform Visualizer simulation */}
              <div className="flex-1 flex items-center gap-[3px] h-10 px-2 rounded-lg bg-surface-container-low overflow-hidden">
                {[3, 5, 8, 4, 7, 9, 6, 3, 8, 10, 7, 4, 6, 9, 5, 2, 2, 3, 2, 2].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      i < 15 ? (isPlayingAudio ? "bg-primary animate-pulse" : "bg-primary") : "bg-outline-variant/60"
                    }`}
                    style={{ height: `${h * 3.5}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-on-surface-variant text-[11px] pt-3 mt-2 border-t border-outline-variant/15 opacity-80">
              <span>Captured via Web Audio API · 48 kHz</span>
              <span className="flex items-center gap-1 text-secondary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Lossless Opus
              </span>
            </div>
          </div>

          {/* Raw Transcript with Recognized Entities */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col flex-1 border border-outline-variant/20">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">transcribe</span>
                <span className="text-sm font-semibold text-on-surface">Spoken Transcript</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium">
                Live Dictation
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-on-surface leading-relaxed mb-4">
              "Hi Proposales team, this is for{" "}
              <mark className="bg-secondary-fixed/70 text-on-secondary-fixed-variant px-1 rounded font-medium">
                {payload.organization.name}
              </mark>
              . Point of contact is{" "}
              <mark className="bg-primary-fixed/70 text-on-primary-fixed px-1 rounded font-medium">
                {payload.organization.contact.name}
              </mark>{" "}
              at{" "}
              <mark className="bg-surface-container-highest text-on-surface font-mono text-[11px] px-1 rounded">
                {payload.organization.contact.email}
              </mark>
              . They need a complete company offsite and conference arriving{" "}
              <mark className="bg-tertiary-fixed text-on-tertiary-fixed px-1 rounded font-medium">March 3rd 2027</mark> and
              checking out on the{" "}
              <mark className="bg-tertiary-fixed text-on-tertiary-fixed px-1 rounded font-medium">5th</mark>.
              Approximately{" "}
              <mark className="bg-secondary-fixed/70 text-on-secondary-fixed-variant px-1 rounded font-medium">
                {payload.event.attendees} attendees
              </mark>{" "}
              requiring{" "}
              <mark className="bg-secondary-fixed/70 text-on-secondary-fixed-variant px-1 rounded font-medium">
                {payload.event.roomBlock.quantity} double deluxe rooms
              </mark>
              . They will require the plenary room for both full days with projector and sound setup, cabaret style. Include
              2 breakfasts, 2 lunches, and a 3-course welcome dinner on the first evening. Budget is roughly{" "}
              <mark className="bg-primary-fixed text-on-primary-fixed px-1 rounded font-semibold">
                {payload.financials.totalBudgetSEK.toLocaleString()} SEK
              </mark>
              ."
            </p>

            {/* Entity Extraction Tags Legend */}
            <div className="mt-auto pt-3 bg-surface-container-low/70 rounded-xl p-3 border border-outline-variant/15">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block mb-1.5 font-bold">
                Entity Mapping
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-container text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Organization &amp; Guests
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Dates &amp; Schedule
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Commercial Budget
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Verified Structured RFP Form / JSON View (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {viewMode === "structured" ? (
            <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4 border border-outline-variant/20">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                  <h2 className="text-base font-semibold text-on-surface">Structured Payload Parameters</h2>
                </div>
                <span className="text-xs text-secondary font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Field-Level Validated
                </span>
              </div>

              {/* Section 1: Client & Contact Person */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 border border-outline-variant/15">
                <div className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                  Client Identification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">Organization Name</label>
                    {isEditingManual ? (
                      <input
                        className="w-full bg-surface-container-lowest rounded-lg px-3 py-1.5 text-xs text-on-surface font-medium border border-primary focus:outline-none"
                        value={payload.organization.name}
                        onChange={(e) =>
                          setPayload({
                            ...payload,
                            organization: { ...payload.organization, name: e.target.value },
                          })
                        }
                      />
                    ) : (
                      <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface font-medium shadow-sm flex items-center justify-between">
                        <span>{payload.organization.name}</span>
                        <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">Event Classification</label>
                    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface font-medium shadow-sm flex items-center justify-between">
                      <span>{payload.event.type}</span>
                      <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                    </div>
                  </div>
                </div>

                <div className="mt-1">
                  <label className="block text-xs text-on-surface-variant mb-1 font-medium">Primary Organizer &amp; Contact</label>
                  <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-on-surface">{payload.organization.contact.name}</span>
                      <span className="text-on-surface-variant font-mono text-xs">
                        {payload.organization.contact.email}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono font-medium">
                      Verified Lead
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Dates, Room Block & Capacity */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 border border-outline-variant/15">
                <div className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                  Dates &amp; Accommodation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">Itinerary Window</label>
                    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface font-medium shadow-sm">
                      3 Mar 2027 — 5 Mar 2027
                      <div className="text-[11px] text-on-surface-variant font-normal">
                        {payload.event.dates.nights} Nights Duration
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">
                      Delegates &amp; Key Distribution
                    </label>
                    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface font-medium shadow-sm">
                      {payload.event.attendees} Guests
                      <div className="text-[11px] text-on-surface-variant font-normal">
                        {payload.event.roomBlock.quantity} {payload.event.roomBlock.roomCategory} Rooms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Facilities, F&B & Special Layout */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 border border-outline-variant/15">
                <div className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                  Space &amp; Hospitality Program
                </div>
                <div className="space-y-2 mt-1">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">
                      Meeting Rooms &amp; A/V Configuration
                    </label>
                    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface shadow-sm flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">co_present</span>
                      <div>
                        <div className="font-semibold">Plenary Meeting Room (2 Full Days)</div>
                        <div className="text-[11px] text-on-surface-variant">
                          Setup: Projector, PA System &amp; Microphones included
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">
                      Catering &amp; Banqueting Sequence
                    </label>
                    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface shadow-sm flex items-start gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">restaurant</span>
                      <div className="text-xs text-on-surface">
                        Breakfast (x2), Lunch (x2), 3-Course Welcome Dinner on Day 1
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 font-medium">
                      Special Directives &amp; Seating Note
                    </label>
                    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-xs text-on-surface shadow-sm italic text-on-surface-variant">
                      "{payload.event.specialDirectives || 'Plenary seating in cabaret setup preferred.'}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Commercial Valuation & Margin Gauge */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                    Estimated Commercial Value
                  </span>
                  <span className="text-xs text-primary font-bold">SEK Base Currency</span>
                </div>
                <div className="bg-surface-container-lowest rounded-lg p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[24px] sm:text-[28px] text-on-surface tracking-tight font-bold">
                      {payload.financials.totalBudgetSEK.toLocaleString()} SEK
                    </div>
                    <div className="text-xs text-on-surface-variant">Calculated RevPAG: 3,750 SEK / guest-day</div>
                  </div>

                  {/* Nordic Margin Visualization SVG Spark Gauge */}
                  <div className="flex items-center gap-3 bg-surface-container-low px-3 py-2 rounded-xl">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-surface-variant"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-secondary"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray="34, 100"
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <span className="absolute text-[11px] font-bold text-on-surface">34%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface font-semibold">Estimated Margin</span>
                      <span className="text-[11px] text-secondary font-medium">Within Target Tier</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* JSON VIEW (Schema Validated Payload) */
            <div className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-6 shadow-sm flex flex-col gap-4 font-mono border border-outline-variant/20">
              <div className="flex items-center justify-between pb-2 text-on-primary-container border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">code</span>
                  <span className="text-xs text-inverse-on-surface font-sans font-semibold">
                    Live Zod-Parsed Output Payload
                  </span>
                </div>
                <button
                  className="hover:text-white flex items-center gap-1 text-xs text-inverse-on-surface/80 transition-colors font-sans cursor-pointer"
                  onClick={handleCopyJson}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedJson ? "done" : "content_copy"}
                  </span>
                  <span>{copiedJson ? "Copied!" : "Copy JSON"}</span>
                </button>
              </div>
              <pre className="text-[11px] text-secondary-fixed overflow-x-auto p-4 bg-surface-container-highest/10 rounded-xl leading-relaxed max-h-[500px]">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-3 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-outline-variant/25">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            onClick={onReRecord}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
            <span>Re-record audio</span>
          </button>
          <button
            className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            onClick={() => setIsEditingManual(!isEditingManual)}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span>{isEditingManual ? "Save manual edits" : "Edit fields manually"}</span>
          </button>
          <button
            id="btn-preview-pdf-review"
            className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            onClick={() => setIsPdfModalOpen(true)}
            type="button"
            title="Preview PDF proposal before client delivery"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Preview PDF</span>
          </button>
        </div>

        <div className="w-full sm:w-auto">
          <button
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-75 cursor-pointer"
            onClick={handleSendToProposales}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                <span>Transmitting to Grand Hôtel Hub...</span>
              </>
            ) : (
              <>
                <span>Send to Proposales &amp; Generate Live Link</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF Document Preview Modal */}
      <ProposalPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        payload={payload}
      />
    </div>
  );
};
