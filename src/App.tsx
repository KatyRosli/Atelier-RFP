import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Routes, Route, Navigate } from "react-router-dom";
import { NavigationRail, NavTab } from "./components/NavigationRail";
import { AppHeader } from "./components/AppHeader";
import { OverviewView } from "./components/OverviewView";
import { VoiceCaptureView } from "./components/VoiceCaptureView";
import { ReviewRfpView } from "./components/ReviewRfpView";
import { ProposalCreatedView } from "./components/ProposalCreatedView";
import { HistoryView } from "./components/HistoryView";
import { ProfileView, UserProfileData } from "./components/ProfileView";
import { ProposalItem, RfpPayload } from "./types";
import { apiUrl } from "./lib/api.ts";

const DEFAULT_PROFILE: UserProfileData = {
  firstName: "Alex",
  lastName: "Lindell",
  role: "Sales Manager",
  companyName: "Noir Hôtel Stockholm",
  email: "alex.lindell@noirhotel.se",
};

const TAB_TO_PATH: Record<NavTab, string> = {
  "overview": "/",
  "voice-capture": "/voice",
  "review-rfp": "/review",
  "proposal-created": "/proposals",
  "rfp-history": "/history",
  "profile": "/profile",
};

const PATH_TO_TAB: Record<string, NavTab> = {
  "/": "overview",
  "/voice": "voice-capture",
  "/review": "review-rfp",
  "/history": "rfp-history",
  "/profile": "profile",
};

interface ProposalCreatedRouteProps {
  proposals: ProposalItem[];
  proposalsLoaded: boolean;
  activeProposal: ProposalItem | null;
  onCreateAnother: () => void;
  onReturnDashboard: () => void;
}

// Resolves the proposal from the URL's :id so /proposal-created/:id is a real,
// shareable/reloadable link instead of relying only on in-memory state.
const ProposalCreatedRoute: React.FC<ProposalCreatedRouteProps> = ({
  proposals,
  proposalsLoaded,
  activeProposal,
  onCreateAnother,
  onReturnDashboard,
}) => {
  const { id } = useParams<{ id: string }>();
  const proposal =
    proposals.find((p) => p.id === id) || (activeProposal?.id === id ? activeProposal : undefined);

  if (proposal) {
    return (
      <ProposalCreatedView
        proposal={proposal}
        onCreateAnother={onCreateAnother}
        onReturnDashboard={onReturnDashboard}
      />
    );
  }

  // Proposals haven't finished loading from the database yet - wait rather than
  // bouncing the user back to "/" for a proposal that actually exists.
  if (!proposalsLoaded) {
    return null;
  }

  return <Navigate to="/" replace />;
};

// Redirects old-style /proposal-created/:id links to the canonical /proposals/:id
const LegacyProposalRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/proposals/${id}`} replace />;
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: NavTab = location.pathname.startsWith("/proposals")
    ? "proposal-created"
    : PATH_TO_TAB[location.pathname] || "overview";
  const goToTab = (tab: NavTab) => navigate(TAB_TO_PATH[tab]);

  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [proposalsLoaded, setProposalsLoaded] = useState<boolean>(false);
  const [currentPayload, setCurrentPayload] = useState<RfpPayload | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "sv">("en");
  const [activeProposal, setActiveProposal] = useState<ProposalItem | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_profile");
      if (saved) {
        try {
          return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return DEFAULT_PROFILE;
  });

  // Ensure theme preference is loaded
  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Fill in the real hotel name (and email domain) from Proposales once, if the
  // profile hasn't been customized yet. Proposales' API has no "current user"
  // endpoint, so a real person's name/email can't be fetched this way - only
  // company-level info (name, website) is available.
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("user_profile")) {
      return;
    }
    async function loadRealCompanyInfo() {
      try {
        const res = await fetch(apiUrl("/api/proposales/company"));
        if (!res.ok) return;
        const company = await res.json();
        setUserProfile((prev) => {
          let domain: string | null = null;
          try {
            domain = company.websiteUrl ? new URL(company.websiteUrl).hostname.replace(/^www\./, "") : null;
          } catch {}
          return {
            ...prev,
            companyName: company.name || prev.companyName,
            email: domain ? `${prev.firstName.toLowerCase()}.${prev.lastName.toLowerCase()}@${domain}` : prev.email,
          };
        });
      } catch (err) {
        console.warn("Could not fetch real company info from Proposales:", err);
      }
    }
    loadRealCompanyInfo();
  }, []);

  // Fetch proposals from PostgreSQL backend (single default account, no login required)
  useEffect(() => {
    async function loadProposalsFromDatabase() {
      try {
        const res = await fetch(apiUrl("/api/proposals"));
        if (res.ok) {
          const data = await res.json();
          const dbProposals: ProposalItem[] = Array.isArray(data.proposals) ? data.proposals : [];
          setProposals(dbProposals);
          if (dbProposals.length > 0) {
            setActiveProposal(dbProposals[0]);
          }
        }
      } catch (err) {
        console.warn("Could not fetch proposals from PostgreSQL:", err);
      } finally {
        setProposalsLoaded(true);
      }
    }

    loadProposalsFromDatabase();
  }, []);

  // Transitions
  const handleStartVoice = () => {
    goToTab("voice-capture");
  };

  const handleVoiceExtracted = (
    payload: RfpPayload,
    transcript: string,
    durationSeconds: number,
    language: "en" | "sv"
  ) => {
    setCurrentPayload(payload);
    setCurrentTranscript(transcript);
    setCurrentLanguage(language);
    goToTab("review-rfp");
  };

  const handleSubmitToProposales = (payload: RfpPayload, liveProposal: ProposalItem) => {
    setProposals((prev) => [liveProposal, ...prev.filter((p) => p.id !== liveProposal.id)]);
    setActiveProposal(liveProposal);
    navigate(`/proposals/${liveProposal.id}`);
  };

  const handleSelectProposal = (proposal: ProposalItem) => {
    setActiveProposal(proposal);
    navigate(`/proposals/${proposal.id}`);
  };

  const handleReviewAiFields = (proposal: ProposalItem) => {
    setCurrentTranscript(proposal.transcript);
    if (proposal.rawJson) {
      setCurrentPayload(proposal.rawJson);
    }
    goToTab("review-rfp");
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {/* Navigation Rail (Left on desktop, Bottom bar on mobile) */}
      <NavigationRail activeTab={activeTab} onSelectTab={goToTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-0 md:pl-[4.5rem] min-h-screen w-full">
        {/* App Header (Responsive on mobile, tablet & desktop) */}
        <AppHeader
          userProfile={userProfile}
          onOpenProfile={() => goToTab("profile")}
        />

        {/* Scrollable View Area with safe-area bottom padding for mobile bar */}
        <main className="flex-1 pt-16 pb-24 md:pb-12 w-full">
          <Routes>
            <Route
              path="/"
              element={
                <OverviewView
                  proposals={proposals}
                  firstName={userProfile.firstName}
                  onStartVoice={handleStartVoice}
                  onSelectProposal={handleSelectProposal}
                  onReviewAiFields={handleReviewAiFields}
                  onViewAllHistory={() => goToTab("rfp-history")}
                />
              }
            />

            <Route
              path="/voice"
              element={
                <VoiceCaptureView
                  onCancel={() => goToTab("overview")}
                  onExtracted={handleVoiceExtracted}
                />
              }
            />

            <Route
              path="/review"
              element={
                currentPayload ? (
                  <ReviewRfpView
                    payload={currentPayload}
                    transcript={currentTranscript}
                    language={currentLanguage}
                    onReRecord={() => goToTab("voice-capture")}
                    onSubmitToProposales={handleSubmitToProposales}
                  />
                ) : (
                  <Navigate to="/voice" replace />
                )
              }
            />

            <Route
              path="/proposals/:id"
              element={
                <ProposalCreatedRoute
                  proposals={proposals}
                  proposalsLoaded={proposalsLoaded}
                  activeProposal={activeProposal}
                  onCreateAnother={() => goToTab("voice-capture")}
                  onReturnDashboard={() => goToTab("overview")}
                />
              }
            />

            {/* Legacy path from before the /proposal-created -> /proposals rename */}
            <Route path="/proposal-created/:id" element={<LegacyProposalRedirect />} />

            <Route
              path="/history"
              element={
                <HistoryView
                  proposals={proposals}
                  onSelectProposal={handleSelectProposal}
                  onReviewAiFields={handleReviewAiFields}
                  onStartVoice={handleStartVoice}
                />
              }
            />

            <Route
              path="/profile"
              element={
                <ProfileView
                  userProfile={userProfile}
                  onUpdateProfile={setUserProfile}
                />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
