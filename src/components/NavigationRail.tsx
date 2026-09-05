import React from "react";

export type NavTab =
  | "overview"
  | "voice-capture"
  | "review-rfp"
  | "proposal-created"
  | "rfp-history"
  | "profile";

interface NavigationRailProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({ activeTab, onSelectTab }) => {
  return (
    <>
      {/* DESKTOP & TABLET: Left Vertical Rail */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[4.5rem] bg-surface-container-lowest z-50 flex-col items-center py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-outline-variant/30">
        {/* Brand Icon */}
        <div className="mb-6">
          <button
            onClick={() => onSelectTab("overview")}
            className="w-10 h-10 rounded-xl bg-inverse-surface flex items-center justify-center shadow-sm text-inverse-on-surface hover:scale-105 transition-all cursor-pointer"
            title="Atelier RFP for Proposales"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
          </button>
        </div>

        {/* Main Nav Items */}
        <nav className="flex-1 flex flex-col items-center gap-2 w-full px-2">
          {/* Voice Capture (Primary Action) */}
          <button
            onClick={() => onSelectTab("voice-capture")}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
              activeTab === "voice-capture"
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
            title="New Voice Capture"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">mic</span>
          </button>

          {/* Overview Dashboard */}
          <button
            onClick={() => onSelectTab("overview")}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
              activeTab === "overview"
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
            title="Overview Dashboard"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">home</span>
          </button>

          {/* RFP History */}
          <button
            onClick={() => onSelectTab("rfp-history")}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
              activeTab === "rfp-history"
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
            title="RFP History"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">schedule</span>
          </button>
        </nav>

        {/* Profile */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <button
            onClick={() => onSelectTab("profile")}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
              activeTab === "profile"
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
            title="Profile & Appearance"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">person</span>
          </button>
        </div>
      </aside>

      {/* MOBILE: Bottom Navigation Bar (thumb-friendly, Voice in the exact middle) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/30 z-50 px-6 items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        {/* Home */}
        <button
          onClick={() => onSelectTab("overview")}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] px-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === "overview" ? "text-primary font-bold" : "text-on-primary-container"
          }`}
          type="button"
          aria-label="Home Overview"
        >
          <span className="material-symbols-outlined text-[22px]">home</span>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
        </button>

        {/* Voice (raised, centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center pointer-events-auto">
          <button
            onClick={() => onSelectTab("voice-capture")}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-surface-container-lowest ${
              activeTab === "voice-capture"
                ? "bg-primary text-on-primary ring-primary/30 scale-105"
                : "bg-primary text-on-primary hover:bg-primary-container"
            }`}
            type="button"
            aria-label="Record Voice Memo"
          >
            <span className="material-symbols-outlined text-[28px]">mic</span>
          </button>
          <span className="text-[10px] text-primary font-bold mt-1 tracking-tight">Voice</span>
        </div>

        {/* RFPs */}
        <button
          onClick={() => onSelectTab("rfp-history")}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] px-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === "rfp-history" ? "text-primary font-bold" : "text-on-primary-container"
          }`}
          type="button"
          aria-label="RFP History"
        >
          <span className="material-symbols-outlined text-[22px]">schedule</span>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">History</span>
        </button>
      </nav>
    </>
  );
};
