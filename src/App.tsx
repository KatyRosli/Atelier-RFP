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

export default function App() {
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
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {
      firstName: "Alex",
      lastName: "Lindell",
      companyName: "Grand Hôtel Stockholm",
      email: "alex.lindell@grandhotel.se",
    };
  });

  // Ensure theme preference is loaded
  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

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
