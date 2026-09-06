import React, { useState } from "react";
import confetti from "canvas-confetti";
import { ProposalItem } from "../types";
import { EmailModal } from "./EmailModal";
import { ProposalPdfModal } from "./ProposalPdfModal";

interface ProposalCreatedViewProps {
  proposal: ProposalItem;
  onCreateAnother: () => void;
  onReturnDashboard: () => void;
}

export const ProposalCreatedView: React.FC<ProposalCreatedViewProps> = ({
  proposal,
  onCreateAnother,
  onReturnDashboard,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const proposalUrl = proposal.proposalUrl;
  const clientName = proposal.clientName;
  const contactPhone = proposal.contactPhone;
  const isLive = !!proposal.externalSync;

  // Trigger festive confetti on first render or copy
  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#005c55", "#80d5cb", "#a6f2d1", "#ffdbca"],
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(proposalUrl);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp link
  const waText = encodeURIComponent(
    `Hej ${proposal.contactName}, here is your tailored proposal from Grand Hôtel Stockholm for ${proposal.title}: ${proposalUrl}`
  );
  const waUrl = `https://wa.me/${contactPhone.replace(/[^0-9]/g, "")}?text=${waText}`;

  // SMS link
  const smsUrl = `sms:${contactPhone.replace(/[^0-9+]/g, "")}?&body=${waText}`;

  return (
    <div className="flex flex-col w-full max-w-[800px] mx-auto py-8 px-4 sm:px-6 relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-secondary-container/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Status 201 Created Banner */}
      <div className="w-full bg-surface-container rounded-2xl p-6 sm:p-7 shadow-sm mb-6 border border-secondary/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-secondary-container" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[32px]">task_alt</span>
            </div>
            <div>
              <h1 className="text-[24px] sm:text-[28px] font-bold text-on-primary-container tracking-tight">
                {isLive ? "Proposal Created in Proposales!" : "Request Submitted to Proposales"}
              </h1>
              <p className="text-xs sm:text-sm text-on-secondary-container mt-1">
                {isLive ? "Live draft published for " : "Filed in the hotel's inbox for "}
                <strong className="text-on-primary-container">{proposal.title}</strong> ·{" "}
                {isLive ? "Total Contract" : "Estimated Budget"}:{" "}
                <strong className="text-primary font-semibold">{proposal.totalAmountSEK.toLocaleString()} SEK</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Reference Card */}
      <div className="w-full bg-surface-container rounded-2xl p-6 shadow-sm mb-6 border border-secondary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">link</span>
            <h2 className="text-sm font-semibold text-on-primary-container">
              {isLive ? "Client Public Proposal Link" : "Proposal Reference"}
            </h2>
          </div>
          {isLive ? (
            <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 px-2 py-0.5 rounded-full bg-success-container text-on-success" />
              Live in Proposales
            </span>
          ) : (
            <span className="text-xs text-amber-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-800" />
              Submitted to Proposales — Awaiting Quote
            </span>
          )}
        </div>

        {/* URL Box with Quick Copy */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-surface-container rounded-xl border border-secondary/25">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 text-xs font-mono text-on-primary-container truncate min-w-0">
            <span className="material-symbols-outlined text-on-secondary-container text-[16px] shrink-0">lock</span>
            <span className="truncate">{proposalUrl}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              id="btn-view-pdf-created"
              onClick={() => setIsPdfModalOpen(true)}
              className="h-10 px-3.5 sm:px-4 rounded-lg bg-secondary-container hover:bg-secondary-container text-on-primary text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              type="button"
              title="Preview and print official proposal PDF"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>View PDF</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="h-10 px-4 rounded-lg bg-secondary-container hover:bg-surface-container text-on-primary-container text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? "check" : "content_copy"}
              </span>
              <span>{copied ? (isLive ? "Link Copied!" : "Reference Copied!") : (isLive ? "Copy Link" : "Copy Reference")}</span>
            </button>

            {isLive && (
              <a
                href={proposalUrl}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 rounded-lg bg-primary text-on-secondary hover:bg-primary-container hover:text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Open in Proposales</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            )}
          </div>
        </div>

        {!isLive && (
          <p className="text-[11px] text-on-secondary-container mt-2.5">
            This request has been filed in Grand Hôtel's Proposales inbox. A team member will review it and send the client a live, signable proposal from Proposales directly — this reference link is for this app's own PDF preview only, not a public client-facing page.
          </p>
        )}

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-secondary/15 text-xs">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-secondary-container">Capacity</span>
            <span className="font-semibold text-on-primary-container mt-0.5">{proposal.guestsCount} Pax</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-secondary-container">Accommodation</span>
            <span className="font-semibold text-on-primary-container mt-0.5">{proposal.roomQuantity} Deluxe Rooms</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-secondary-container">Meeting &amp; Dining</span>
            <span className="font-semibold text-on-primary-container mt-0.5">Ballroom &amp; Catering</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-secondary-container">Validity</span>
            <span className="font-semibold px-2 py-0.5 rounded-full bg-success-container text-on-success mt-0.5">Valid until 15 Jan 2027</span>
          </div>
        </div>
      </div>

      {/* 1-Click Instant Distribution Bar */}
      <div className="w-full bg-surface-container rounded-2xl p-6 shadow-sm mb-6 border border-secondary/20">
        <h3 className="text-xs uppercase tracking-wider text-on-secondary-container font-bold mb-3">
          1-Click Instant Distribution &amp; Review
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* View / Print PDF (First-class action) */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary-container/30 hover:bg-secondary-container/60 transition-colors group cursor-pointer border border-secondary/20 text-left"
            type="button"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-primary-container group-hover:text-primary transition-colors">
                View &amp; Print PDF
              </span>
              <span className="text-[11px] text-on-secondary-container truncate">Official A4 quotation</span>
            </div>
          </button>

          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container hover:bg-surface-container transition-colors group cursor-pointer border border-secondary/15"
          >
            <div className="w-9 h-9 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-on-primary-container group-hover:text-primary transition-colors">
                WhatsApp
              </span>
              <span className="text-[11px] text-on-secondary-container truncate">
                Message to {proposal.contactName.split(" ")[0]}
              </span>
            </div>
          </a>

          {/* SMS Mobile */}
          <a
            href={smsUrl}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container hover:bg-surface-container transition-colors group cursor-pointer border border-secondary/15"
          >
            <div className="w-9 h-9 rounded-lg bg-primary text-on-tertiary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">sms</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-on-primary-container group-hover:text-primary transition-colors">
                SMS Mobile
              </span>
              <span className="text-[11px] text-on-secondary-container truncate">
                Dispatch text to contact
              </span>
            </div>
          </a>

          {/* Email dispatch */}
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container hover:bg-surface-container transition-colors group cursor-pointer border border-secondary/15 text-left"
            type="button"
          >
            <div className="w-9 h-9 rounded-lg bg-primary text-on-tertiary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-on-primary-container group-hover:text-primary transition-colors">
                Send Email Copy
              </span>
              <span className="text-[11px] text-on-secondary-container truncate">Stockholm branded layout</span>
            </div>
          </button>
        </div>
      </div>

      {/* Client Live Experience Preview Inside Proposales */}
      <div className="w-full bg-surface-container rounded-2xl p-6 shadow-sm mb-6 border border-secondary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">devices</span>
            <h3 className="text-sm font-semibold text-on-primary-container">Client Live Experience Preview</h3>
          </div>
          <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                previewDevice === "desktop" ? "bg-surface-container text-on-primary-container shadow-xs" : "text-on-secondary-container"
              }`}
              type="button"
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                previewDevice === "mobile" ? "bg-surface-container text-on-primary-container shadow-xs" : "text-on-secondary-container"
              }`}
              type="button"
            >
              Mobile
            </button>
          </div>
        </div>

        {/* Mock Proposal Page Browser Frame */}
        <div
          className={`mx-auto rounded-xl overflow-hidden border border-secondary/30 shadow-md bg-white transition-all duration-300 ${
            previewDevice === "mobile" ? "max-w-xs" : "w-full"
          }`}
        >
          {/* Mock Browser Header */}
          <div className="bg-surface-container px-4 py-2 flex items-center gap-2 border-b border-secondary/20">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-error/70 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary/70 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-secondary/70 inline-block" />
            </div>
            <div className="flex-1 text-center font-mono text-[10px] text-on-secondary-container/70 truncate bg-surface-container/80 py-0.5 px-2 rounded">
              proposales.com/p/grand-hotel/{clientName.toLowerCase().replace(/\s+/g, "-")}
            </div>
          </div>

          {/* Proposal Document Body */}
          <div className="p-5 sm:p-6 bg-[#fafafa]">
            {/* Noir Hôtel Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#005c55] flex items-center justify-center text-white font-bold text-xs">
                  NH
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#005c55]">Grand Hôtel</div>
                  <div className="text-[10px] text-gray-500">Stockholm · Established 1874</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                Official Proposal
              </span>
            </div>

            {/* Document Hero */}
            <div className="my-4">
              <span className="text-[10px] uppercase font-bold text-gray-400">Exclusive Event Proposal</span>
              <h4 className="text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {proposal.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Prepared for {proposal.contactName} ({clientName}) · Dates: {proposal.datesText}
              </p>
            </div>

            {/* Proposal Specs Summary */}
            <div className="grid grid-cols-3 gap-2 my-4 bg-white p-3 rounded-lg border border-gray-200 text-center">
              <div>
                <span className="text-[10px] text-gray-400 block">Delegates</span>
                <span className="text-xs font-bold text-gray-800">{proposal.guestsCount} Guests</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Rooms</span>
                <span className="text-xs font-bold text-gray-800">{proposal.roomQuantity} Deluxe</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Contract Total</span>
                <span className="text-xs font-bold text-[#005c55]">{proposal.totalAmountSEK.toLocaleString()} SEK</span>
              </div>
            </div>

            {/* Proposal Sections */}
            <div className="space-y-2 text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span>Accommodation ({proposal.nights} nights)</span>
                <span className="font-semibold">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plenary Conference Room + A/V</span>
                <span className="font-semibold">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Breakfast, Lunch &amp; Welcome Dinner</span>
                <span className="font-semibold">Included</span>
              </div>
            </div>

            {/* E-Sign Action Mock */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-[10px] text-gray-500">BankID &amp; Digital Signature Enabled</div>
              <button
                className="px-4 py-1.5 rounded-md bg-[#005c55] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
                onClick={() => alert("This opens the BankID / Proposales electronic signature flow for client!")}
                type="button"
              >
                Sign &amp; Accept Proposal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        proposal={proposal}
      />

      {/* PDF Document Preview & Print Modal */}
      <ProposalPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        proposal={proposal}
        payload={proposal.rawJson}
      />
    </div>
  );
};
