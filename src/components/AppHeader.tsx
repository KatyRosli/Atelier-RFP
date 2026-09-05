import React from "react";
import { UserProfileData } from "./ProfileView";

interface AppHeaderProps {
  userProfile?: UserProfileData;
  onOpenProfile?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ userProfile, onOpenProfile }) => {
  const firstName = userProfile?.firstName || "Alex";
  const lastName = userProfile?.lastName || "Lindell";
  const companyName = userProfile?.companyName || "Grand Hôtel Stockholm";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <header className="fixed top-0 left-0 md:left-[4.5rem] right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-3 sm:px-6 border-b border-outline-variant/30">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[16px] sm:text-[17px] font-bold text-on-surface tracking-tight truncate">
          Voice to RFP
        </span>
        <span className="hidden xs:inline text-on-surface-variant text-[12px] sm:text-[13px] opacity-70 truncate">
          for Proposales
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hotel Venue Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-outline-variant/20">
          <span className="material-symbols-outlined text-primary text-[15px] sm:text-[16px]">hotel</span>
          <span className="text-[12px] sm:text-[13px] text-on-surface font-medium truncate max-w-[130px] sm:max-w-none">
            {companyName}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary ml-0.5 animate-pulse flex-shrink-0" />
        </div>

        {/* User Badge (Clickable to open profile) */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-0.5 sm:pl-1 hover:opacity-85 transition-opacity cursor-pointer group"
          type="button"
          title="Open Profile Settings"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-[11px] sm:text-xs shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[12px] text-on-surface font-semibold leading-none">{firstName}</span>
            <span className="text-[11px] text-on-surface-variant opacity-80 leading-tight">Sales Manager</span>
          </div>
        </button>
      </div>
    </header>
  );
};
