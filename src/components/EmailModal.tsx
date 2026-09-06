import React, { useState } from "react";
import { ProposalItem } from "../types";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: ProposalItem | null;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, proposal }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const recipient = proposal?.contactEmail || "maria.lindqvist@nordictech.se";
  const contactName = proposal?.contactName || "Maria Lindqvist";
  const clientName = proposal?.clientName || "Nordic Tech AB";
  const proposalUrl = proposal?.proposalUrl || "https://proposales.com/p/grand-hotel/nordic-tech-offsite-2027";

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-secondary/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">mark_email_read</span>
            <h3 className="text-lg font-semibold text-on-primary-container">Luxury Email Dispatch</h3>
          </div>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-secondary-container transition-colors"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-surface-container p-3 rounded-xl">
            <span className="text-xs text-on-secondary-container block font-medium">Recipient</span>
            <span className="text-sm text-on-primary-container font-semibold">{recipient}</span>
          </div>

          <div className="bg-surface-container p-3 rounded-xl">
            <span className="text-xs text-on-secondary-container block font-medium">Subject</span>
            <span className="text-sm text-on-primary-container font-semibold">
              Noir Hôtel Stockholm · Bespoke Proposal for {clientName}
            </span>
          </div>

          <div className="bg-surface-container p-4 rounded-xl text-xs text-on-secondary-container leading-relaxed space-y-2">
            <p>Dear {contactName},</p>
            <p>
              It was a pleasure speaking with you regarding your upcoming corporate offsite. We have crafted a personalized proposal encompassing our Waterfront Deluxe rooms and the Grand Ballroom.
            </p>
            <div className="p-2.5 bg-surface-container rounded-lg border border-primary/20 text-primary font-medium">
              View Proposal &amp; E-Sign:{" "}
              <a href={proposalUrl} target="_blank" rel="noreferrer" className="underline break-all">
                {proposalUrl}
              </a>
            </div>
            <p className="text-[11px] opacity-75">Noir Hôtel Stockholm · Södra Blasieholmshamnen 8</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container text-on-primary-container text-sm font-semibold transition-colors"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-70"
            onClick={handleSend}
            disabled={isSending || isSent}
            type="button"
          >
            {isSending ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">autorenew</span>
                <span>Transmitting...</span>
              </>
            ) : isSent ? (
              <>
                <span className="material-symbols-outlined text-[18px]">done</span>
                <span>Sent Successfully!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Send Branded Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
