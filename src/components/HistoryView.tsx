import React, { useState } from "react";
import { ProposalItem } from "../types";

interface HistoryViewProps {
  proposals: ProposalItem[];
  onSelectProposal: (proposal: ProposalItem) => void;
  onReviewAiFields: (proposal: ProposalItem) => void;
  onStartVoice: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  proposals,
  onSelectProposal,
  onReviewAiFields,
  onStartVoice,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "sent_to_proposales" | "needs_review">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleCopy = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="flex flex-col w-full max-w-[800px] mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-[11px] tracking-widest text-on-secondary-container font-bold">RFP Repository</span>
            <span className="text-on-secondary-container opacity-40">/</span>
            <span className="text-on-secondary-container text-xs font-medium">Noir Hôtel Stockholm</span>
          </div>
          <h1 className="text-[28px] font-bold text-on-primary-container tracking-tight">Proposals &amp; Intakes</h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-sm mb-6 border border-secondary/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-[20px] text-on-secondary-container absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by client, event title, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary-container rounded-xl pl-10 pr-4 py-2 text-xs text-on-primary-container focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-secondary-container/60"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface-container p-1 rounded-xl">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === "all" ? "bg-primary-container text-on-primary-container shadow-xs" : "text-on-secondary-container"
            }`}
            type="button"
          >
            All ({proposals.length})
          </button>
          <button
            onClick={() => setFilter("sent_to_proposales")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === "sent_to_proposales"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "bg-primary-container text-on-secondary-container"
            }`}
            type="button"
          >
            Sent
          </button>
          <button
            onClick={() => setFilter("needs_review")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === "needs_review"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "bg-primary-container text-on-secondary-container"
            }`}
            type="button"
          >
            Needs Review
          </button>
        </div>
      </div>

      {/* Proposals Listing */}
      <div className="flex flex-col gap-3">
        {proposals.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-8 text-center text-on-secondary-container text-sm border border-secondary/20">
            Start your recordings today and save it to RFP.
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-8 text-center text-on-secondary-container text-xs border border-secondary/20">
            No proposal requests match your criteria.
          </div>
        ) : (
          filtered.map((p) => {
            const isSent = p.status === "sent_to_proposales";
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (isSent) onSelectProposal(p);
                  else onReviewAiFields(p);
                }}
                className="bg-surface-container rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-secondary/20 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSent ? "bg-tertiary text-on-tertiary" : "bg-tertiary-container/30 text-tertiary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {p.title.includes("Wedding")
                        ? "celebration"
                        : p.title.includes("Dinner") || p.title.includes("FinTech")
                        ? "restaurant"
                        : "apartment"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-on-primary-container truncate">{p.title}</h3>
                      <span className="text-[10px] font-mono text-on-secondary-container bg-surface-container px-1.5 py-0.5 rounded">
                        {p.id}
                      </span>
                    </div>
                    <p className="text-xs text-on-secondary-container mt-0.5">
                      {p.guestsCount} guests · {p.datesText} · {p.roomQuantity} Rooms ·{" "}
                      <strong className="text-on-primary-container font-semibold">
                        {p.totalAmountSEK.toLocaleString()} SEK
                      </strong>
                    </p>
                    <p className="text-[11px] text-on-secondary-container/70 mt-0.5 truncate">
                      Contact: {p.contactName} ({p.contactEmail})
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                  <div className="flex flex-col sm:items-end">
                    {isSent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-container text-on-success text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-success" />
                        Proposal Created
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]" />
                        Needs review
                      </span>
                    )}
                    <span className="text-[10px] text-on-secondary-container/70 mt-0.5">{p.createdAtFormatted}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSent ? (
                      <>
                        <button
                          onClick={(e) => handleCopy(p.id, p.proposalUrl, e)}
                          className="h-8 px-2.5 rounded-lg text-tertiary text-xs font-semibold flex items-center gap-1"
                          type="button"
                          title="Copy proposal URL"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {copiedId === p.id ? "done" : "link"}
                          </span>
                          <span>{copiedId === p.id ? "Copied" : "Copy"}</span>
                        </button>
                        <a
                          href={p.proposalUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-lg text-tertiary flex items-center justify-center"
                          title="Open live Proposales link"
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </a>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReviewAiFields(p);
                        }}
                        className="h-8 px-3 rounded-lg bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1 shadow-sm"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit_note</span>
                        <span>Review</span>
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
