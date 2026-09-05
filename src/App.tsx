import React, { useState, useEffect } from "react";
import { NavigationRail, NavTab } from "./components/NavigationRail";
import { AppHeader } from "./components/AppHeader";
import { OverviewView } from "./components/OverviewView";
import { VoiceCaptureView } from "./components/VoiceCaptureView";
import { ReviewRfpView } from "./components/ReviewRfpView";
import { ProposalCreatedView } from "./components/ProposalCreatedView";
import { HistoryView } from "./components/HistoryView";
import { ProfileView, UserProfileData } from "./components/ProfileView";
import { INITIAL_PROPOSALS, INITIAL_NORDIC_PAYLOAD } from "./data/mockProposals";
import { ProposalItem, RfpPayload } from "./types";
import { useAuth } from "./context/AuthContext.tsx";

export default function App() {
  const { user, idToken } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS);
  const [currentPayload, setCurrentPayload] = useState<RfpPayload>(INITIAL_NORDIC_PAYLOAD);
  const [currentTranscript, setCurrentTranscript] = useState<string>(
    INITIAL_PROPOSALS[0]?.transcript || ""
  );
  const [activeProposal, setActiveProposal] = useState<ProposalItem>(INITIAL_PROPOSALS[0]);
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_profile");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // If the profile was previously saved with the legacy template name "Alex", upgrade it to "Elin"
          if (parsed && parsed.firstName === "Alex") {
            parsed.firstName = "Elin";
            if (parsed.email === "alex.lindell@grandhotel.se") {
              parsed.email = "elin.lindell@grandhotel.se";
            }
            localStorage.setItem("user_profile", JSON.stringify(parsed));
          }
          return parsed;
        } catch {}
      }
    }
    return {
      firstName: "Elin",
      lastName: "Lindell",
      companyName: "Grand Hôtel Stockholm",
      email: "elin.lindell@grandhotel.se",
    };
  });

  // Ensure theme preference is loaded
  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Fetch proposals from PostgreSQL backend when authenticated
  useEffect(() => {
    async function loadProposalsFromDatabase() {
      if (!idToken) return;
      try {
        const res = await fetch("/api/proposals", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.proposals && Array.isArray(data.proposals) && data.proposals.length > 0) {
            setProposals(data.proposals);
            setActiveProposal(data.proposals[0]);
          } else {
            // Seed initial proposals to the user's PostgreSQL database
            for (const initial of INITIAL_PROPOSALS) {
              await fetch("/api/proposals", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ item: initial }),
              });
            }
            setProposals(INITIAL_PROPOSALS);
          }
        }
      } catch (err) {
        console.warn("Could not fetch proposals from PostgreSQL:", err);
      }
    }

    loadProposalsFromDatabase();
  }, [idToken]);

  // Transitions
  const handleStartVoice = () => {
    setActiveTab("voice-capture");
  };

  const handleVoiceExtracted = (payload: RfpPayload, transcript: string, durationSeconds: number) => {
    setCurrentPayload(payload);
    setCurrentTranscript(transcript);
    setActiveTab("review-rfp");
  };

  const handleSubmitToProposales = (payload: RfpPayload, liveProposal: ProposalItem) => {
    setProposals((prev) => [liveProposal, ...prev.filter((p) => p.id !== liveProposal.id)]);
    setActiveProposal(liveProposal);
    setActiveTab("proposal-created");
  };

  const handleSelectProposal = (proposal: ProposalItem) => {
    setActiveProposal(proposal);
    setActiveTab("proposal-created");
  };

  const handleReviewAiFields = (proposal: ProposalItem) => {
    setCurrentTranscript(proposal.transcript);
    if (proposal.rawJson) {
      setCurrentPayload(proposal.rawJson);
    }
    setActiveTab("review-rfp");
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {/* Navigation Rail (Left on desktop, Bottom bar on mobile) */}
      <NavigationRail activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-0 md:pl-[4.5rem] min-h-screen w-full">
        {/* App Header (Responsive on mobile, tablet & desktop) */}
        <AppHeader
          userProfile={userProfile}
          onOpenProfile={() => setActiveTab("profile")}
        />

        {/* Scrollable View Area with safe-area bottom padding for mobile bar */}
        <main className="flex-1 pt-16 pb-24 md:pb-12 w-full">
          {activeTab === "overview" && (
            <OverviewView
              proposals={proposals}
              firstName={userProfile.firstName}
              onStartVoice={handleStartVoice}
              onSelectProposal={handleSelectProposal}
              onReviewAiFields={handleReviewAiFields}
              onViewAllHistory={() => setActiveTab("rfp-history")}
            />
          )}

          {activeTab === "voice-capture" && (
            <VoiceCaptureView
              onCancel={() => setActiveTab("overview")}
              onExtracted={handleVoiceExtracted}
            />
          )}

          {activeTab === "review-rfp" && (
            <ReviewRfpView
              payload={currentPayload}
              transcript={currentTranscript}
              onReRecord={() => setActiveTab("voice-capture")}
              onSubmitToProposales={handleSubmitToProposales}
            />
          )}

          {activeTab === "proposal-created" && (
            <ProposalCreatedView
              proposal={activeProposal}
              onCreateAnother={() => setActiveTab("voice-capture")}
              onReturnDashboard={() => setActiveTab("overview")}
            />
          )}

          {activeTab === "rfp-history" && (
            <HistoryView
              proposals={proposals}
              onSelectProposal={handleSelectProposal}
              onReviewAiFields={handleReviewAiFields}
              onStartVoice={handleStartVoice}
            />
          )}

          {activeTab === "profile" && (
            <ProfileView
              userProfile={userProfile}
              onUpdateProfile={setUserProfile}
            />
          )}
        </main>
      </div>
    </div>
  );
}
