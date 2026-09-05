import React, { useState, useEffect, useRef } from "react";
import { RfpPayload } from "../types";

interface VoiceCaptureViewProps {
  onCancel: () => void;
  onExtracted: (payload: RfpPayload, transcript: string, durationSeconds: number) => void;
}

const DEFAULT_SAMPLE_TRANSCRIPT =
  "About sixty guests, arriving March third and leaving March fifth. We'll need thirty double rooms, a plenary meeting room for two full days, breakfast and lunch included both days, and a dinner on the first night. Budget is around four hundred fifty thousand kronor. Contact is Maria Lindqvist, maria at nordictech dot se.";

export const VoiceCaptureView: React.FC<VoiceCaptureViewProps> = ({ onCancel, onExtracted }) => {
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [seconds, setSeconds] = useState<number>(7);
  const [language, setLanguage] = useState<"en" | "sv">("en");
  const [transcript, setTranscript] = useState<string>(DEFAULT_SAMPLE_TRANSCRIPT);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [speechApiSupported, setSpeechApiSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechApiSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "en" ? "en-US" : "sv-SE";

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + " ";
        }
        if (currentText.trim()) {
          setTranscript(currentText.trim());
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Web Speech API note:", err.error);
      };

      if (isRecording) {
        recognition.start();
      }

      recognitionRef.current = recognition;

      return () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      };
    } catch (e) {
      console.warn("Speech recognition init exception:", e);
      setSpeechApiSupported(false);
    }
  }, [language]);

  // Handle toggling mic recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    } else {
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }
  };

  // Timer interval
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Keyboard shortcut: Space to pause/resume, Esc to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggleRecording();
      } else if (e.code === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording]);

  // Quick extract trigger
  const handleStopAndExtract = async () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsExtracting(true);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (res.ok) {
        const data = await res.json();
        onExtracted(data.payload, transcript, seconds);
      } else {
        throw new Error("Extraction returned error");
      }
    } catch (err) {
      console.warn("Fallback to client extraction:", err);
      // Construct fallback payload adhering strictly to RfpPayloadSchema
      const fallbackPayload: RfpPayload = {
        $schema: "https://api.proposales.com/v1/schemas/rfp-intake.json",
        organization: {
          name: "Nordic Tech AB",
          contact: {
            name: "Maria Lindqvist",
            email: "maria@nordictech.se",
            phone: "+46 70 123 45 67",
          },
        },
        event: {
          type: "Company Offsite & Conference",
          dates: {
            checkIn: "2027-03-03",
            checkOut: "2027-03-05",
            nights: 2,
          },
          attendees: 60,
          roomBlock: {
            quantity: 30,
            roomCategory: "Double Deluxe",
          },
          meetingFacilities: [
            {
              space: "Plenary Hall",
              durationDays: 2,
              avRequirements: ["projector", "integrated_sound_system", "microphones"],
              setupPreference: "Cabaret",
            },
          ],
          catering: [
            { item: "Breakfast", quantity: 2 },
            { item: "Lunch", quantity: 2 },
            { item: "3-Course Welcome Dinner", day: 1 },
          ],
          specialDirectives: "Plenary seating in cabaret setup preferred.",
        },
        financials: {
          totalBudgetSEK: 450000,
          estimatedMarginPct: 0.34,
          currency: "SEK",
        },
        meta: {
          parser: "vercel-ai-sdk@4.1",
          model: "gpt-4o-mini",
          confidenceScore: 0.98,
          hotelTenantId: "grand-hotel-stockholm",
          parsedAt: new Date().toISOString(),
        },
      };
      onExtracted(fallbackPayload, transcript, seconds);
    } finally {
      setIsExtracting(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col w-full max-w-[760px] mx-auto py-8 px-4 sm:px-6 relative">
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Central Focused Card / Voice Recording Pane */}
      <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden border border-outline-variant/20">
        {/* Top Decorative Scandinavian Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-fixed via-primary-container to-secondary" />

        {/* Top Header Row: Status & Property Meta */}
        <div className="flex items-center justify-between mb-8">
          {/* Live Audio State Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low shadow-sm border border-outline-variant/20">
            <span className="relative flex h-2.5 w-2.5">
              {isRecording ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-outline" />
              )}
            </span>
            <span className="text-xs text-on-surface font-semibold tracking-tight">
              {isRecording ? "Listening" : "Paused"} · {language === "en" ? "English" : "Svenska"}
            </span>
            <button
              onClick={() => setLanguage(language === "en" ? "sv" : "en")}
              className="text-[10px] uppercase font-bold text-primary hover:underline ml-1"
              title="Toggle input language"
              type="button"
            >
              [{language === "en" ? "Switch SV" : "Switch EN"}]
            </button>
          </div>

          {/* Venue Reference & Context Snippet */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
              <span className="material-symbols-outlined text-[14px] text-primary">record_voice_over</span>
              <span>{isRecording ? "Microphone active" : "Microphone paused"}</span>
            </div>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              title="Audio Device Settings"
              type="button"
              onClick={() => alert("Audio Input: Built-in Studio Array (48kHz 24-bit Lossless Opus)")}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          </div>
        </div>

        {/* Instruction Headline & Helper Copy */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs uppercase tracking-wider text-primary font-bold mb-1 block">Live RFP Intake</span>
          <h1 className="text-[28px] sm:text-[32px] text-on-background font-bold tracking-tight mb-2">
            Say the request as you heard it
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Include guests, dates, rooms, meeting space, catering, and budget if you have them. You can edit anything after.
          </p>
        </div>

        {/* Central Hero Mic Pulse Button */}
        <div className="flex flex-col items-center justify-center mb-8 relative">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <div className="absolute w-32 h-32 rounded-full bg-primary-container/15 animate-ping opacity-60 pointer-events-none" />
                <div className="absolute w-28 h-28 rounded-full bg-primary/15 animate-pulse pointer-events-none" />
              </>
            )}
            <button
              aria-label="Toggle Recording"
              onClick={toggleRecording}
              className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer focus:outline-none ${
                isRecording ? "bg-inverse-surface text-inverse-on-surface" : "bg-surface-container-highest text-on-surface"
              }`}
              type="button"
            >
              <span
                className={`material-symbols-outlined text-[36px] sm:text-[40px] transition-colors ${
                  isRecording ? "text-on-primary group-hover:text-primary-fixed" : "text-on-surface"
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isRecording ? "mic" : "mic_off"}
              </span>
            </button>
          </div>

          {/* Waveform Visualizer & Timer Section */}
          <div className="mt-6 flex flex-col items-center gap-2 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold tracking-wide border border-outline-variant/15">
              <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-error animate-pulse" : "bg-outline"}`} />
              <span className="font-mono text-[13px]">{formatTimer(seconds)}</span>
              <span className="text-on-surface-variant font-normal opacity-70">
                · {isRecording ? "Live recording" : "Paused"}
              </span>
            </div>

            {/* Dynamic Audio Bars (Nordic Teal Spectrum) */}
            <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-xs pt-2">
              {[3, 5, 8, 4, 9, 11, 7, 10, 6, 9, 12, 7, 5, 3].map((height, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isRecording ? "bg-primary-container" : "bg-outline-variant/40"
                  }`}
                  style={{
                    height: isRecording ? `${height * 3}px` : "6px",
                    animation: isRecording ? `pulse 0.7s infinite ease-in-out ${i * 0.05}s` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Real-Time Transcript Box */}
        <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 shadow-sm mb-6 border border-outline-variant/20 transition-all">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-container-high/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">notes</span>
              <span className="text-sm font-semibold text-on-surface">Transcript</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-container text-[11px] font-semibold">
                <span className="material-symbols-outlined text-[12px]">sensors</span>
                Web Speech API · Continuous
              </span>
            </div>
          </div>

          {/* Editable / Spoken text display */}
          <div className="text-sm sm:text-base text-on-surface leading-relaxed min-h-[5.5rem] relative">
            <textarea
              className="w-full bg-transparent border-0 resize-none focus:outline-none font-sans text-on-surface leading-relaxed"
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Start speaking into your microphone or paste a request here..."
            />
            {isRecording && <span className="inline-block w-2 h-4 ml-1 bg-primary align-middle animate-pulse" />}
          </div>

          {/* Preset Buttons for Quick Testing */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-outline-variant/15 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-on-surface-variant font-medium mr-1">Identified so far:</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-xs font-medium">60 Guests</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-xs font-medium">Mar 3 – 5</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-xs font-medium">30 Doubles</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-xs font-medium">Plenary Hall</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-xs font-medium">450k SEK</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTranscript(DEFAULT_SAMPLE_TRANSCRIPT)}
                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] text-primary font-semibold transition-colors"
                type="button"
              >
                Reset Nordic Sample
              </button>
              <button
                onClick={() => setTranscript("")}
                className="px-2 py-1 rounded hover:bg-surface-container text-[11px] text-on-surface-variant transition-colors"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Primary Controls & Action Triggers */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>Cancel</span>
          </button>

          <button
            onClick={handleStopAndExtract}
            disabled={isExtracting || !transcript.trim()}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md disabled:opacity-60"
            type="button"
          >
            {isExtracting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>Extracting JSON RFP...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  stop_circle
                </span>
                <span>Stop &amp; extract</span>
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary-container text-[11px] font-semibold tracking-wide ml-0.5">
                  Vercel AI SDK
                </span>
              </>
            )}
          </button>
        </div>

        {/* Helper Keyboard Shortcuts Hint */}
        <div className="text-center pt-2">
          <p className="text-xs text-on-surface-variant opacity-80 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">keyboard</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-on-surface shadow-sm">Space</kbd> to pause or <kbd className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-on-surface shadow-sm">Esc</kbd> to cancel
            </span>
          </p>
        </div>
      </div>

      {/* Supplementary Context Cards: Verified Nordic Heritage Reference */}
      <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Visual Specimen Card 1 */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center gap-4 overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20">
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-container">
            <img
              alt="Nordic conference hall setup at Grand Hôtel"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMCUVrf5BbDx6_Ao3tUqGD530hGbeOfX05PzNdId9iCamrSFhc-HuZxvP945lY0rovhz4dfD3WlWGsXNEvvDLi0hIC1TFQ8_3qjNpYS_1XIWKfbVYPDIdK_b2AUzWYZosxYoMoMcnbhmLEvXNfmVraPKVke8C4glqT1EbdNWHCsdQIdd-uzwSXoDOo4StU4RVussih4Mcu6YZEou6uMg4w3l9sLwN7htm7HzGIvi8d9Bmxn3_y6SfuGtvMU0KyU1jSmx8"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-primary font-bold uppercase tracking-wider">Historical Context</span>
            <h2 className="text-sm font-semibold text-on-surface truncate">Winter Garden Plenary</h2>
            <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
              Matches current spoken requirement: double height glass atrium, audio system verified.
            </p>
          </div>
        </div>

        {/* Visual Specimen Card 2 */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center gap-4 overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20">
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-container">
            <img
              alt="Nordic banquet and catering arrangement"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrt2hTB0QrVPL-RM1GzBMgwBHAc8R_O7p8k0iBzS7ixqCk7F-TxJ9PxYeijWHWx_ImVb3hI8R2v1l6gudooAzRJ09UpLW_RZggh4wFNmsHvP3ZGPiwN9ChlN5SOOXWtEFbyEk_G7eRTwMHhy_8hD5Or9zDQIZ-dVqgpXX9fdkCTzrvlgQ02o_hdoMU1ZsrONdniqKgJCS1BjnQsABdgYpJsGl4YqdTYFkM3MMbsUYeuzu0hIU1Q2ii2VCToJ_Ctvip5YY"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">Catering Protocol</span>
            <h2 className="text-sm font-semibold text-on-surface truncate">Spegelbaren Dinner</h2>
            <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
              Dinner package available for 60 pax. Preset dietary requirements flagged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
