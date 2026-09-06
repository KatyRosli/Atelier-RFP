import React, { useState } from "react";
import { ProposalItem } from "../types";

interface OverviewViewProps {
  proposals: ProposalItem[];
  firstName?: string;
  onStartVoice: () => void;
  onSelectProposal: (proposal: ProposalItem) => void;
  onReviewAiFields: (proposal: ProposalItem) => void;
  onViewAllHistory: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  proposals,
  firstName,
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
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-primary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 left-10 w-64 h-64 bg-secondary-container/15 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Header & Salutation Section */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 py-1 text-on-secondary-container text-[11px] font-semibold tracking-wider">
            Sales Manager
          </span>
          <span className="text-on-secondary-container/40 text-xs">/</span>
          <span className="text-on-secondary-container text-xs font-medium">Noir Hôtel Stockholm</span>
        </div>

        <div className="mt-3">
          <p className="text-[18px] text-on-secondary-container font-medium tracking-tight">
            {firstName?.trim() ? `Hi ${firstName.trim()}` : "Hi"}
          </p>
          <h1 className="text-[32px] sm:text-[36px] text-on-primary-container font-bold tracking-tight mt-1 leading-tight">
            Turn a conversation into an RFP in seconds
          </h1>
          <p className="text-[15px] sm:text-[16px] text-on-secondary-container max-w-xl mt-2 leading-relaxed">
            Speak the request the way a guest gave it to you. We'll structure it and send it straight to Proposales.
          </p>
        </div>
      </div>

      {/* Main Hero Action Card (Voice Capture Entry) */}
      <div className="relative group mb-8">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-secondary/15 to-transparent rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300" />
        <div className="relative bg-surface-container rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-secondary/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Mic Button + Trigger Copy */}
            <button
              className="flex items-center gap-4 flex-1 text-left cursor-pointer"
              onClick={onStartVoice}
              type="button"
            >
              {/* Mic circular icon with Nordic precision styling */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-secondary">
                  <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mic
                  </span>
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-container opacity-50" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-success" />
                </span>
              </div>

              {/* Headline & Context */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[20px] text-on-primary-container font-semibold group-hover:text-primary transition-colors">
                    Start a voice request
                  </h2>
                  <span className="material-symbols-outlined text-primary text-[20px] transition-transform duration-200 group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </div>
                <p className="text-[13px] text-on-secondary-container mt-0.5">
                  About 30 seconds · works in Swedish and English
                </p>
              </div>
            </button>

            {/* Right: Status indicator pills */}
            <div className="flex flex-wrap md:flex-col lg:flex-row items-start md:items-end gap-2 flex-shrink-0 pt-2 md:pt-0">
              <span className="inline-flex items-center text-on-secondary-container text-[11px] font-semibold">
                Live auto-sync
              </span>
            </div>
          </div>

          {/* Micro waveform visualizer preview strip */}
          <div className="mt-4 pt-3 border-t border-secondary/15 flex items-center justify-between gap-1 text-on-secondary-container/50">
            <span className="text-[11px] text-on-secondary-container/70 font-medium">Audio buffer idle</span>
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

      {/* Recent Requests Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[18px] text-on-primary-container font-semibold tracking-tight">Recent requests</h3>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-secondary-container text-xs font-semibold">
            {proposals.length}
          </span>
        </div>
        <button
          onClick={onViewAllHistory}
          className="group inline-flex items-center gap-1 text-xs text-tertiary font-semibold"
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
        {proposals.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-8 text-center text-on-secondary-container text-sm border border-secondary/20">
            Start your recordings today and save it to RFP.
          </div>
        ) : (
          proposals.slice(0, 4).map((p) => {
          const isSent = p.status === "sent_to_proposales";
          return (
            <div
              key={p.id}
              onClick={() => {
                if (isSent) onSelectProposal(p);
                else onReviewAiFields(p);
              }}
              className="bg-surface-container rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-secondary/20 cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSent
                      ? "bg-tertiary text-on-secondary"
                      : "bg-tertiary-container text-tertiary"
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
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className="text-[15px] text-on-primary-container font-semibold truncate hover:text-tertiary transition-colors">
                      {p.title}
                    </h4>
                    <span className="text-[10px] font-mono text-on-secondary-container bg-surface-container px-1.5 py-0.5 rounded flex-shrink-0">
                      {p.id}
                    </span>
                  </div>
                  <p className="text-xs text-on-secondary-container">
                    {p.guestsCount} guests · {p.datesText}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                <div className="flex flex-col sm:items-end">
                  {isSent ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-container text-on-success text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-success" />
                      Proposal Created
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]" />
                      Needs review
                    </span>
                  )}
                  <span className="text-[11px] text-on-secondary-container/70 mt-0.5">{p.createdAtFormatted}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSent ? (
                    <>
                      <button
                        className="h-9 px-3 rounded-lg text-tertiary text-xs font-semibold flex items-center gap-1"
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
                        className="w-9 h-9 rounded-lg text-tertiary flex items-center justify-center"
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
        })
        )}
      </div>
    </div>
  );
};
