import React from "react";
import { RfpPayload, ProposalItem } from "../types";

interface ProposalPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload?: RfpPayload;
  proposal?: ProposalItem;
}

export const ProposalPdfModal: React.FC<ProposalPdfModalProps> = ({
  isOpen,
  onClose,
  payload,
  proposal,
}) => {
  if (!isOpen) return null;

  // Derive consolidated fields whether invoked from Review stage (payload) or Created stage (proposal)
  const clientName =
    proposal?.clientName || payload?.organization?.name || "Nordic Tech AB";
  const contactName =
    proposal?.contactName || payload?.organization?.contact?.name || "Maria Lindqvist";
  const contactEmail =
    proposal?.contactEmail || payload?.organization?.contact?.email || "maria@nordictech.se";
  const contactPhone =
    proposal?.contactPhone || payload?.organization?.contact?.phone || "+46 70 123 45 67";

  const attendees =
    proposal?.guestsCount || payload?.event?.attendees || 60;
  const checkIn =
    proposal?.checkIn || payload?.event?.dates?.checkIn || "2027-03-03";
  const checkOut =
    proposal?.checkOut || payload?.event?.dates?.checkOut || "2027-03-05";
  const nights =
    proposal?.nights || payload?.event?.dates?.nights || 2;
  const roomQuantity =
    proposal?.roomQuantity || payload?.event?.roomBlock?.quantity || 30;
  const roomCategory =
    payload?.event?.roomBlock?.roomCategory || "Double Deluxe";

  const totalBudgetSEK =
    proposal?.totalAmountSEK || payload?.financials?.totalBudgetSEK || 450000;
  const estimatedMarginPct =
    proposal?.marginPct
      ? proposal.marginPct / 100
      : payload?.financials?.estimatedMarginPct || 0.34;

  const proposalId = proposal?.id || "GH-PRP-2027-88492";
  const issueDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Calculate itemized estimates for Grand Hôtel Stockholm quotation
  const roomNightRate = 3200; // SEK per deluxe room / night
  const accommodationTotal = roomQuantity * nights * roomNightRate;
  const dailyConferencePackage = 1250; // SEK per delegate / day (space + A/V + lunch + fika)
  const conferenceTotal = attendees * 2 * dailyConferencePackage;
  const dinnerRate = 1850; // 3-course welcome dinner per guest
  const dinnerTotal = attendees * dinnerRate;
  const miscAndService = Math.max(0, totalBudgetSEK - (accommodationTotal + conferenceTotal + dinnerTotal));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="proposal-pdf-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
    >
      {/* Background Overlay */}
      <div
        id="modal-backdrop"
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 z-10 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Control Bar (Screen Only) */}
        <div className="no-print flex items-center justify-between px-4 sm:px-6 py-3.5 bg-surface-container-low border-b border-outline-variant/30 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
                <span>PDF Proposal Document Preview</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider">
                  Client-Ready
                </span>
              </div>
              <div className="text-[11px] text-on-surface-variant hidden sm:block">
                Verify line items, pricing, and hotel signatures before sharing with your client
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-proposal-pdf"
              type="button"
              onClick={handlePrint}
              className="h-9 px-3.5 sm:px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print / Save as PDF</span>
            </button>

            <button
              id="btn-close-pdf-modal"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              title="Close Preview"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface-container-low/50">
          {/* THE PRINTABLE PROPOSAL PDF SHEET (Conforms to A4 standards) */}
          <div className="printable-proposal-pdf mx-auto max-w-[780px] bg-white text-slate-900 shadow-xl rounded-xl p-8 sm:p-12 border border-slate-200">
            {/* Header / Brand Letterhead */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif tracking-widest text-[#005c55] font-black uppercase">
                    GRAND HÔTEL
                  </span>
                </div>
                <div className="text-[11px] tracking-wider uppercase text-slate-500 font-medium mt-0.5">
                  Stockholm · Established 1874 · The Leading Hotels of the World
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Södra Blasieholmshamnen 8, Box 16424, 103 27 Stockholm · Tel: +46 (0)8 679 35 00
                </div>
              </div>

              <div className="sm:text-right flex flex-col sm:items-end">
                <span className="px-3 py-1 rounded bg-[#005c55]/10 text-[#005c55] text-xs font-bold uppercase tracking-wider">
                  Official Proposal
                </span>
                <div className="text-xs font-mono font-bold text-slate-900 mt-2">
                  REF: {proposalId}
                </div>
                <div className="text-[11px] text-slate-500">Date: {issueDate}</div>
                <div className="text-[11px] text-slate-500 font-medium">Valid until: 30 Days from Issue</div>
              </div>
            </div>

            {/* Recipient & Event Details Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  PREPARED EXCLUSIVELY FOR
                </span>
                <div className="text-sm font-bold text-slate-900">{clientName}</div>
                <div className="text-slate-600 mt-0.5">Attn: {contactName}</div>
                <div className="text-slate-600">Email: {contactEmail}</div>
                <div className="text-slate-600">Phone: {contactPhone}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  EVENT SPECIFICATIONS
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {payload?.event?.type || "Company Offsite & Executive Conference"}
                </div>
                <div className="text-slate-600 mt-0.5">
                  <strong>Dates:</strong> {checkIn} to {checkOut} ({nights} Nights)
                </div>
                <div className="text-slate-600">
                  <strong>Confirmed Attendance:</strong> {attendees} Delegates
                </div>
                <div className="text-slate-600">
                  <strong>Designated Host:</strong> Alex Lindell, Commercial Events Lead
                </div>
              </div>
            </div>

            {/* Section 1: Executive Itinerary & Overview */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#005c55] mb-2 pb-1 border-b border-slate-200">
                1. Event Program &amp; Venues
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Grand Hôtel Stockholm is pleased to present this custom itinerary for {clientName}. Our dedicated events team
                will manage every detail from arrival transfers to plenary keynote facilities and gala dining in our historic venues.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Accommodations</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {roomQuantity} {roomCategory}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {nights} nights · Waterfront views &amp; Nordic breakfast included
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Plenary Meeting Space</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {payload?.event?.meetingFacilities?.[0]?.space || "Plenary Hall / Spegelsalen"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Cabaret configuration · 4K A/V &amp; technician included
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Culinary Experience</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">Full Delegate Package</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Welcome cocktail reception &amp; 3-course dinner
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Meeting Facilities & Technology */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#005c55] mb-2 pb-1 border-b border-slate-200">
                2. Meeting Spaces &amp; A/V Configuration
              </h3>
              <div className="text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Plenary Hall (Full Day 1 &amp; Day 2)</span>
                  <span className="font-semibold text-slate-900">Cabaret Setup for {attendees} pax</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Audio-Visual Suite</span>
                  <span className="font-semibold text-slate-900">Integrated Sound, Dual Projectors &amp; Lapel Mics</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Connectivity</span>
                  <span className="font-semibold text-slate-900">Dedicated 1 Gbps Symmetric Event VLAN</span>
                </div>
                {payload?.event?.specialDirectives && (
                  <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] mt-2">
                    <strong>Special Directives:</strong> {payload.event.specialDirectives}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Itemized Financial Quotation */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#005c55] mb-2 pb-1 border-b border-slate-200">
                3. Financial Breakdown &amp; Investment (SEK)
              </h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-600">
                    <th className="py-2 font-bold">Line Item Description</th>
                    <th className="py-2 text-center font-bold">Qty / Units</th>
                    <th className="py-2 text-right font-bold">Unit Price</th>
                    <th className="py-2 text-right font-bold">Total (SEK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 text-slate-800">
                      <strong>{roomCategory} Accommodation</strong>
                      <span className="block text-[11px] text-slate-500">
                        {nights} nights inclusive of Nordic buffet breakfast &amp; Spa
                      </span>
                    </td>
                    <td className="py-2 text-center text-slate-600">{roomQuantity * nights} Room Nights</td>
                    <td className="py-2 text-right text-slate-600">{roomNightRate.toLocaleString()} SEK</td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {accommodationTotal.toLocaleString()} SEK
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 text-slate-800">
                      <strong>Full-Day Conference Package &amp; A/V</strong>
                      <span className="block text-[11px] text-slate-500">
                        Plenary hall, tech lead, 2 working lunches &amp; morning/afternoon fika
                      </span>
                    </td>
                    <td className="py-2 text-center text-slate-600">{attendees * 2} Delegate Days</td>
                    <td className="py-2 text-right text-slate-600">{dailyConferencePackage.toLocaleString()} SEK</td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {conferenceTotal.toLocaleString()} SEK
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 text-slate-800">
                      <strong>Welcome Cocktail &amp; 3-Course Dinner</strong>
                      <span className="block text-[11px] text-slate-500">
                        Day 1 Gala evening in the historic French Dining Room
                      </span>
                    </td>
                    <td className="py-2 text-center text-slate-600">{attendees} Guests</td>
                    <td className="py-2 text-right text-slate-600">{dinnerRate.toLocaleString()} SEK</td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {dinnerTotal.toLocaleString()} SEK
                    </td>
                  </tr>

                  {miscAndService > 0 && (
                    <tr>
                      <td className="py-2 text-slate-800">
                        <strong>Logistics, A/V Staging &amp; Ancillary Services</strong>
                        <span className="block text-[11px] text-slate-500">Dedicated concierge &amp; technician coverage</span>
                      </td>
                      <td className="py-2 text-center text-slate-600">1 Package</td>
                      <td className="py-2 text-right text-slate-600">{miscAndService.toLocaleString()} SEK</td>
                      <td className="py-2 text-right font-semibold text-slate-900">
                        {miscAndService.toLocaleString()} SEK
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold text-sm">
                    <td colSpan={3} className="py-3 text-right pr-4 text-slate-900">
                      TOTAL CONTRACT PROPOSAL:
                    </td>
                    <td className="py-3 text-right text-[#005c55] text-base">
                      {totalBudgetSEK.toLocaleString()} SEK
                    </td>
                  </tr>
                  <tr className="text-[11px] text-slate-500">
                    <td colSpan={4} className="text-right pt-0.5">
                      Prices are in Swedish Kronor (SEK), exclusive of Swedish VAT (moms).
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Section 4: Terms & Signatures */}
            <div className="pt-4 border-t border-slate-300 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
                {/* Grand Hôtel Representative */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    AUTHORIZED HOTEL REPRESENTATIVE
                  </span>
                  <div className="border-b border-slate-400 pb-8 mt-4">
                    <span className="font-serif italic text-base text-[#005c55]">Alex Lindell</span>
                  </div>
                  <div className="text-slate-800 font-semibold mt-1">Alex Lindell</div>
                  <div className="text-[11px] text-slate-500">Commercial Events Lead, Grand Hôtel Stockholm</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Digital Sign Timestamp: {issueDate}</div>
                </div>

                {/* Client Signature Acceptance */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    CLIENT ACCEPTANCE &amp; E-SIGN
                  </span>
                  <div className="border-b border-slate-400 border-dashed pb-8 mt-4 text-slate-400 text-[11px] flex items-end">
                    <span>E-Sign via Proposales BankID link</span>
                  </div>
                  <div className="text-slate-800 font-semibold mt-1">{contactName}</div>
                  <div className="text-[11px] text-slate-500">{clientName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Status: Pending Client Review</div>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">
                Grand Hôtel AB · Org.nr: 556006-2582 · VAT: SE556006258201 · Generated automatically via Proposales API Integration
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
