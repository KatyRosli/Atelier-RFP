import React, { useState } from "react";
import { ProposalItem } from "../types";

interface OverviewViewProps {
  proposals: ProposalItem[];
  onStartVoice: () => void;
  onSelectProposal: (proposal: ProposalItem) => void;
  onReviewAiFields: (proposal: ProposalItem) => void;
  onViewAllHistory: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  proposals,
  onStartVoice,
  onSelectProposal,
  onReviewAiFields,
  onViewAllHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="flex flex-col w-full max-w-[800px] mx-auto py-6 sm:py-8 px-3 sm:px-6 relative">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 left-10 w-64 h-64 bg-secondary-fixed/15 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Header & Salutation Section */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-primary text-[11px] font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            E-Commerce &amp; Sales Desk
          </span>
          <span className="text-on-surface-variant/40 text-xs">/</span>
          <span className="text-on-surface-variant text-xs font-medium">Grand Hôtel Stockholm</span>
        </div>

        <div className="mt-3">
          <p className="text-[18px] text-on-surface-variant font-medium tracking-tight">Good afternoon, Elin</p>
          <h1 className="text-[32px] sm:text-[36px] text-on-background font-bold tracking-tight mt-1 leading-tight">
            Turn a conversation into an RFP in seconds
          </h1>
          <p className="text-[15px] sm:text-[16px] text-on-surface-variant max-w-xl mt-2 leading-relaxed">
            Speak the request the way a guest gave it to you. We'll structure it and send it straight to Proposales.
          </p>
        </div>
      </div>

      {/* Main Hero Action Card (Voice Capture Entry) */}
      <div className="relative group mb-8">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-secondary/15 to-transparent rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300" />
        <div className="relative bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Mic Button + Trigger Copy */}
            <button
              className="flex items-center gap-4 flex-1 text-left cursor-pointer"
              onClick={onStartVoice}
              type="button"
            >
              {/* Mic circular icon with Nordic precision styling */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-inverse-surface flex items-center justify-center text-inverse-on-surface shadow-md group-hover:scale-105 group-hover:bg-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mic
                  </span>
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed-dim opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary" />
                </span>
              </div>

              {/* Headline & Context */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[20px] text-on-surface font-semibold group-hover:text-primary transition-colors">
                    Start a voice request
                  </h2>
                  <span className="material-symbols-outlined text-primary text-[20px] transition-transform duration-200 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </div>
                <p className="text-[13px] text-on-surface-variant mt-0.5">
                  About 30 seconds · works in Swedish and English
                </p>
              </div>
            </button>

            {/* Right: Status indicator pills */}
            <div className="flex flex-wrap md:flex-col lg:flex-row items-start md:items-end gap-2 flex-shrink-0 pt-2 md:pt-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium">
                <span className="material-symbols-outlined text-[14px] text-primary">sensors</span>
                Browser Web Speech API ready
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-container text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Live auto-sync
              </span>
            </div>
          </div>

          {/* Micro waveform visualizer preview strip */}
          <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between gap-1 text-on-surface-variant/50">
            <span className="text-[11px] text-on-surface-variant/70 font-medium">Audio buffer idle</span>
            <div className="flex items-center gap-1 h-3 flex-1 max-w-[200px] justify-end">
              <span className="w-0.5 h-1.5 bg-primary/30 rounded-full" />
              <span className="w-0.5 h-2 bg-primary/40 rounded-full" />
              <span className="w-0.5 h-3 bg-primary/60 rounded-full" />
              <span className="w-0.5 h-1.5 bg-primary/40 rounded-full" />
              <span className="w-0.5 h-2.5 bg-primary/70 rounded-full" />
              <span className="w-0.5 h-1 bg-primary/20 rounded-full" />
              <span className="w-0.5 h-2 bg-primary/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Grand Hôtel Stockholm Visual Context Accent Banner */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm mb-8 bg-surface-container border border-outline-variant/20">
        <img
          alt="Grand Hôtel Stockholm banquet suite and proposal overview setting"
          className="w-full h-44 object-cover object-center"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPcBvcehPIxJihPFOKt6GuHh6m63WmvqApMDMq3OUW0bEBGFHyClK8239Dm3-B7aziVhaM7R7_wTWlNE88lXUNVjmo4VxDxQqZ--CBDwz3YgLlI9EdDStxdM94p76On4XAPrlXnwjSQSzSPbqlecvanpgYvRhG3iv_VOgStH2DsUtx7Ch4_o79D8LOkm9mSX_nhAoxjx-TwV3UpTtY7B2vnjnzTvY8Th2m8X9PSQurjGZ4rsIWFKsKcZL_zRb5tHBDjOQ"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/35 to-transparent flex items-end p-5 sm:p-6">
          <div className="flex items-center justify-between w-full text-inverse-on-surface">
            <div>
              <span className="text-[11px] text-secondary-fixed uppercase tracking-wider font-bold">Venue Context</span>
              <p className="text-[18px] text-inverse-on-surface font-semibold">Vinterträdgården &amp; Spegelsalen</p>
              <p className="text-[13px] text-inverse-on-surface/85">Default inventory mapped to current Grand Hôtel Stockholm seasonal pricing</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-surface-container-lowest/15 backdrop-blur-md px-3 py-1.5 rounded-xl text-inverse-on-surface border border-white/10">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="text-xs font-semibold">Tier 1 Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[18px] text-on-surface font-semibold tracking-tight">Recent requests</h3>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
            {proposals.length}
          </span>
        </div>
        <button
          onClick={onViewAllHistory}
          className="group inline-flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary-container transition-colors"
          type="button"
        >
          <span>View all</span>
          <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
            chevron_right
          </span>
        </button>
      </div>

      {/* Request List Stack */}
      <div className="flex flex-col gap-3 mb-8">
        {proposals.slice(0, 4).map((p) => {
          const isSent = p.status === "sent_to_proposales";
          return (
            <div
              key={p.id}
              onClick={() => {
                if (isSent) onSelectProposal(p);
                else onReviewAiFields(p);
              }}
              className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/20 cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSent
                      ? "bg-surface-container text-primary"
                      : "bg-tertiary-fixed/30 text-tertiary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {p.title.includes("Wedding")
                      ? "celebration"
                      : p.title.includes("Dinner") || p.title.includes("FinTech")
                      ? "restaurant"
                      : p.title.includes("Kickoff")
                      ? "groups"
                      : "apartment"}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="text-[15px] text-on-surface font-semibold truncate hover:text-primary transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {p.guestsCount} guests · {p.datesText}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                <div className="flex flex-col sm:items-end">
                  {isSent ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#065F46]" />
                      Sent to Proposales
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]" />
                      Needs review
                    </span>
                  )}
                  <span className="text-[11px] text-on-surface-variant/70 mt-0.5">{p.createdAtFormatted}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSent ? (
                    <>
                      <button
                        className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold flex items-center gap-1 transition-colors"
                        onClick={(e) => handleCopy(p.id, p.proposalUrl, e)}
                        title="Copy proposal share link"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedId === p.id ? "done" : "link"}
                        </span>
                        <span className="hidden md:inline">{copiedId === p.id ? "Copied" : "Share"}</span>
                      </button>
                      <a
                        href={p.proposalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-lg hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
                        title="Open live Proposales URL"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </a>
                    </>
                  ) : (
                    <button
                      className="h-9 px-3 rounded-lg bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReviewAiFields(p);
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>Review AI fields</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Status Banner */}
      <div className="rounded-2xl bg-surface-container-high/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-outline-variant/20 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs sm:text-sm text-on-surface font-semibold">
                Voice-to-Proposal Pipeline Active
              </p>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-[10px] font-mono text-primary font-bold">
                GPT-4o-mini · Vercel AI SDK
              </span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-on-surface-variant mt-0.5">
              Browser Web Speech API ➔ Vercel AI SDK (generateObject) ➔ Live Proposales API Sync.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-semibold text-on-surface border border-outline-variant/20 flex-shrink-0 self-end sm:self-center">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>Proposales Ready</span>
        </div>
      </div>
    </div>
  );
};
