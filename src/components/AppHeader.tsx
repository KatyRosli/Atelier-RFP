import React from "react";
import { UserProfileData } from "./ProfileView";
import { useAuth } from "../context/AuthContext.tsx";

interface AppHeaderProps {
  userProfile?: UserProfileData;
  onOpenProfile?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ userProfile, onOpenProfile }) => {
  const { user, signInWithGoogle, signOutUser } = useAuth();

  const firstName = userProfile?.firstName?.trim() || user?.displayName?.split(" ")[0] || "Elin";
  const lastName = userProfile?.lastName?.trim() || user?.displayName?.split(" ").slice(1).join(" ") || "Lindell";
  const companyName = userProfile?.companyName?.trim() || "Grand Hôtel Stockholm";
  const initials = `${firstName.charAt(0) || "E"}${lastName.charAt(0) || "L"}`.toUpperCase();

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
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-outline-variant/20">
          <span className="material-symbols-outlined text-primary text-[15px] sm:text-[16px]">hotel</span>
          <span className="text-[12px] sm:text-[13px] text-on-surface font-medium truncate max-w-[130px] sm:max-w-none">
            {companyName}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary ml-0.5 animate-pulse flex-shrink-0" />
        </div>

        {/* Database Sync Status / Google Sign-In */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>PostgreSQL Synced</span>
            </div>
            {/* User Badge */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-0.5 sm:pl-1 hover:opacity-85 transition-opacity cursor-pointer group"
              type="button"
              title="Open Profile Settings"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-sm object-cover border border-outline-variant/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-[11px] sm:text-xs shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                  {initials}
                </div>
              )}
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[12px] text-on-surface font-semibold leading-none">{firstName}</span>
                <span className="text-[11px] text-on-surface-variant opacity-80 leading-tight truncate max-w-[110px]">
                  {user.email || "Sales Manager"}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle().catch((e) => console.warn(e))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all shadow-sm cursor-pointer"
            type="button"
            title="Sign in with Google to sync voice proposals with Cloud SQL PostgreSQL"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
