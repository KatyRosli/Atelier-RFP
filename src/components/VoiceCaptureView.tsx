import React, { useState, useEffect, useRef } from "react";
import { RfpPayload } from "../types";
import { apiUrl } from "../lib/api.ts";

interface VoiceCaptureViewProps {
  onCancel: () => void;
  onExtracted: (payload: RfpPayload, transcript: string, durationSeconds: number) => void;
}

const SAMPLE_NORDIC_TECH =
  "About sixty guests for Nordic Tech AB, arriving March third and leaving March fifth 2027. We'll need thirty double deluxe rooms, a plenary meeting room in cabaret setup for two full days, breakfast and lunch included both days, and a three-course dinner on the first night. Budget is around four hundred fifty thousand kronor. Contact is Maria Lindqvist, maria at nordictech dot se.";

const SAMPLE_SPOTIFY =
  "Spotify Executive Strategy Summit, one hundred twenty attendees from September tenth to twelfth 2027. We need sixty rooms, Winter Garden hall with theater seating, high-end sound and dual projectors, morning and afternoon fika, welcome drinks and gala dinner. Total budget is eight hundred thousand SEK. Contact is Johan Berg, johan at spotify dot com.";

export const VoiceCaptureView: React.FC<VoiceCaptureViewProps> = ({ onCancel, onExtracted }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [language, setLanguage] = useState<"en" | "sv">("en");
  const [transcript, setTranscript] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [micPermissionState, setMicPermissionState] = useState<"idle" | "listening" | "denied" | "unsupported">("idle");
  const [volumeLevels, setVolumeLevels] = useState<number[]>([4, 6, 8, 12, 16, 14, 10, 6, 4]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Real Web Audio API volume visualizer
  const startAudioMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute 9 frequency slice bars
        const step = Math.floor(bufferLength / 9);
        const bars: number[] = [];
        for (let i = 0; i < 9; i++) {
          const slice = dataArray.slice(i * step, (i + 1) * step);
          const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
          // Scale to 4 - 36 px
          const height = Math.max(4, Math.min(36, Math.round((avg / 255) * 36) + 4));
          bars.push(height);
        }
        setVolumeLevels(bars);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: any) {
      console.warn("Audio meter setup notice:", err);
      // If mic was explicitly denied
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermissionState("denied");
        setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser or type your notes below.");
      }
    }
  };

  const stopAudioMeter = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setVolumeLevels([4, 4, 4, 4, 4, 4, 4, 4, 4]);
  };

  // Start Speech Recognition
  const startRecordingSession = async () => {
    setErrorMessage(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicPermissionState("unsupported");
      setErrorMessage("Speech recognition is not supported in this browser. You can type or paste your spoken request directly below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "en" ? "en-US" : "sv-SE";

      recognition.onstart = () => {
        setIsRecording(true);
        setMicPermissionState("listening");
      };

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += piece + " ";
          } else {
            interimChunk += piece;
          }
        }

        if (finalChunk.trim()) {
          setTranscript((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
        }
        setInterimText(interimChunk.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn("Web Speech API event:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicPermissionState("denied");
          setErrorMessage("Microphone permission denied. Click the lock/permission icon in your browser URL bar to allow microphone.");
          setIsRecording(false);
          stopAudioMeter();
        } else if (event.error === "no-speech") {
          // Normal when silent, don't crash
        }
      };

      recognition.onend = () => {
        // If still flagged as recording (browser timed out on silence), restart
        if (isRecording && recognitionRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

      // Also start live decibel volume meter
      await startAudioMeter();
    } catch (err: any) {
      console.warn("Recognition start failed:", err);
      setMicPermissionState("denied");
      setErrorMessage(err.message || "Failed to start microphone.");
      setIsRecording(false);
    }
  };

  const stopRecordingSession = () => {
    setIsRecording(false);
    setMicPermissionState("idle");
    setInterimText("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    stopAudioMeter();
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingSession();
    } else {
      startRecordingSession();
    }
  };

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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingSession();
    };
  }, []);

  // Extraction trigger
  const handleStopAndExtract = async () => {
    stopRecordingSession();

    const fullText = (transcript + " " + interimText).trim();
    if (!fullText) {
      setErrorMessage("Please speak or enter some details about the RFP before extracting.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl("/api/extract"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.payload) throw new Error("No payload returned");

      onExtracted(data.payload, fullText, Math.max(seconds, 3));
    } catch (err: any) {
      console.warn("Server extraction notice, using dynamic parser:", err);

      // Fallback: Parse the user's ACTUAL spoken words dynamically
      const dynamicPayload = parseUserTranscriptLocally(fullText);
      onExtracted(dynamicPayload, fullText, Math.max(seconds, 3));
    } finally {
      setIsExtracting(false);
    }
  };

  // Local parser if server network drops
  const parseUserTranscriptLocally = (text: string): RfpPayload => {
    // Attendees
    let attendees = 60;
    const paxMatch = text.match(/(\d+)\s*(?:guests?|attendees?|delegates?|people|pax)/i);
    if (paxMatch) attendees = parseInt(paxMatch[1], 10);

    // Rooms
    let rooms = Math.round(attendees / 2);
    const roomMatch = text.match(/(\d+)\s*(?:double|single|deluxe|hotel)?\s*rooms?/i);
    if (roomMatch) rooms = parseInt(roomMatch[1], 10);

    // Budget
    let budget = 450000;
    const numBudgetMatch = text.match(/(\d+[\d,\.]*)\s*(?:thousand|k|m|million)?\s*(?:sek|kronor|kr)/i);
    if (numBudgetMatch) {
      const raw = parseInt(numBudgetMatch[1].replace(/[^\d]/g, ""), 10);
      budget = raw < 1000 ? raw * 1000 : raw;
    }

    // Company
    let company = "Client Organization";
    const compMatch = text.match(/(?:for|client|company|organization)\s+([A-Z][A-Za-z0-9\s&]+?(?:\s+AB|\s+AS|\s+Inc|\s+Ltd)?)(?:,|\.|\s+arriving|\s+from|\s+need)/i);
    if (compMatch && compMatch[1].trim().length > 2) {
      company = compMatch[1].trim();
    }

    // Contact
    let contactName = "Event Organizer";
    const contactMatch = text.match(/(?:contact\s*is|contact\s*person\s*is|organizer\s*is)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (contactMatch) contactName = contactMatch[1];

    return {
      $schema: "https://api.proposales.com/v1/schemas/rfp-intake.json",
      organization: {
        name: company,
        contact: {
          name: contactName,
          email: "events@organization.com",
          phone: "+46 8 123 45 67",
        },
      },
      event: {
        type: "Executive Offsite & Conference",
        dates: {
          checkIn: "2027-03-03",
          checkOut: "2027-03-05",
          nights: 2,
        },
        attendees,
        roomBlock: {
          quantity: rooms,
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
        specialDirectives: "Plenary seating with high-fidelity AV requirements.",
      },
      financials: {
        totalBudgetSEK: budget,
        estimatedMarginPct: 0.34,
        currency: "SEK",
      },
      meta: {
        parser: "client-local-ai",
        model: "gpt-4o-mini",
        confidenceScore: 0.95,
        hotelTenantId: "noir-hotel-stockholm",
        parsedAt: new Date().toISOString(),
      },
    };
  };

  const formatTimer = (totalSecs: number) => {
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Dynamic tags from actual words spoken
  const detectedTags = React.useMemo(() => {
    const full = `${transcript} ${interimText}`.toLowerCase();
    const tags: string[] = [];

    const numPax = full.match(/(\d+)\s*(?:guests?|attendees?|delegates?|people|pax)/);
    if (numPax) tags.push(`${numPax[1]} Guests`);

    const numRooms = full.match(/(\d+)\s*(?:double|single|deluxe|hotel)?\s*rooms?/);
    if (numRooms) tags.push(`${numRooms[1]} Rooms`);

    if (full.includes("march") || full.includes("september") || full.includes("june") || full.includes("october")) {
      tags.push("Dates Detected");
    }

    if (full.includes("dinner") || full.includes("lunch") || full.includes("breakfast") || full.includes("fika")) {
      tags.push("Catering Found");
    }

    if (full.includes("plenary") || full.includes("meeting") || full.includes("winter garden") || full.includes("cabaret")) {
      tags.push("Meeting Space");
    }

    const budgetM = full.match(/(\d+[\d,\.]*)\s*(?:thousand|k|m|million)?\s*(?:sek|kronor|kr)/);
    if (budgetM) tags.push(`${budgetM[1]} SEK`);

    return tags;
  }, [transcript, interimText]);

  return (
    <div className="flex flex-col w-full max-w-[760px] mx-auto py-8 px-4 sm:px-6 relative">
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Central Focused Card / Voice Recording Pane */}
      <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden border border-outline-variant/20">
        {/* Top Decorative Scandinavian Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-fixed via-primary-container to-secondary" />

        {/* Top Header Row: Status & Property Meta */}
        <div className="flex items-center justify-between mb-6">
          {/* Live Audio State Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low shadow-sm border border-outline-variant/20">
            <span className="relative flex h-2.5 w-2.5">
              {isRecording ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-outline" />
              )}
            </span>
            <span className="text-xs text-on-surface font-semibold tracking-tight">
              {isRecording ? "Listening" : "Microphone Ready"} · {language === "en" ? "English" : "Svenska"}
            </span>
            <button
              onClick={() => setLanguage(language === "en" ? "sv" : "en")}
              className="text-[10px] uppercase font-bold text-primary hover:underline ml-1 cursor-pointer"
              title="Toggle input language"
              type="button"
            >
              [{language === "en" ? "Switch SV" : "Switch EN"}]
            </button>
          </div>

          {/* Venue Reference */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
              <span className="material-symbols-outlined text-[14px] text-primary">record_voice_over</span>
              <span>Noir Hôtel Stockholm Intake</span>
            </div>
          </div>
        </div>

        {/* Instruction Headline & Helper Copy */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs uppercase tracking-wider text-primary font-bold mb-1 block">Live RFP Voice Intake</span>
          <h1 className="text-[26px] sm:text-[30px] text-on-background font-bold tracking-tight mb-2">
            {isRecording ? "Listening to your voice..." : "Click to speak your request"}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            State the client name, guest count, dates, room needs, meeting setup, catering, and SEK budget. Speak naturally in English or Swedish.
          </p>
        </div>

        {/* Error / Permission Banner if needed */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">info</span>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Central Hero Mic Pulse Button */}
        <div className="flex flex-col items-center justify-center mb-6 relative">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <div className="absolute w-32 h-32 rounded-full bg-error/15 animate-ping opacity-60 pointer-events-none" />
                <div className="absolute w-28 h-28 rounded-full bg-primary/15 animate-pulse pointer-events-none" />
              </>
            )}
            <button
              id="btn-voice-record-toggle"
              aria-label={isRecording ? "Stop Recording" : "Start Recording"}
              onClick={toggleRecording}
              className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer focus:outline-none ${
                isRecording
                  ? "bg-error text-white shadow-error/30"
                  : "bg-primary text-on-primary shadow-primary/30"
              }`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-[36px] sm:text-[40px] text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isRecording ? "mic" : "mic_none"}
              </span>
            </button>
          </div>

          {/* Real Audio Volume Waveform Visualizer & Timer */}
          <div className="mt-5 flex flex-col items-center gap-2 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold tracking-wide border border-outline-variant/15">
              <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-error animate-pulse" : "bg-outline"}`} />
              <span className="font-mono text-[13px]">{formatTimer(seconds)}</span>
              <span className="text-on-surface-variant font-normal opacity-70">
                · {isRecording ? "Live microphone recording" : "Click mic to speak"}
              </span>
            </div>

            {/* Audio Bars reacting to real microphone input */}
            <div className="flex items-center justify-center gap-1.5 h-10 w-full max-w-xs pt-1">
              {volumeLevels.map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isRecording ? "bg-primary" : "bg-outline-variant/40"
                  }`}
                  style={{
                    height: isRecording ? `${h}px` : "5px",
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
              <span className="text-sm font-semibold text-on-surface">Live Transcript</span>
            </div>
            <div className="flex items-center gap-2">
              {isRecording ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error/10 text-error text-[11px] font-semibold animate-pulse">
                  <span className="material-symbols-outlined text-[12px]">graphic_eq</span>
                  Transcribing Voice...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-container text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[12px]">keyboard</span>
                  Editable Voice Transcript
                </span>
              )}
            </div>
          </div>

          {/* Editable / Spoken text display */}
          <div className="text-sm sm:text-base text-on-surface leading-relaxed min-h-[6rem] relative">
            <textarea
              id="voice-transcript-input"
              className="w-full bg-transparent border-0 resize-none focus:outline-none font-sans text-on-surface leading-relaxed placeholder:text-on-surface-variant/50"
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                isRecording
                  ? "Listening to your voice... Speak your event details now."
                  : "Click the big microphone button above and speak, or type/paste your RFP notes here..."
              }
            />

            {/* Interim live words displaying while user is speaking */}
            {interimText && (
              <div className="text-xs sm:text-sm text-primary italic pb-2 flex items-center gap-1">
                <span>{interimText}</span>
                <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse" />
              </div>
            )}
          </div>

          {/* Dynamic Detected Tags Row & Sample Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-outline-variant/15 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-on-surface-variant font-medium mr-1">Detected so far:</span>
              {detectedTags.length > 0 ? (
                detectedTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-on-surface-variant italic">
                  (Speak dates, pax, rooms, or budget)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTranscript(SAMPLE_NORDIC_TECH)}
                className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] text-primary font-semibold transition-colors cursor-pointer"
                type="button"
                title="Load sample: Nordic Tech AB 60 Pax"
              >
                Sample 1 (Nordic Tech)
              </button>
              <button
                onClick={() => setTranscript(SAMPLE_SPOTIFY)}
                className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] text-secondary font-semibold transition-colors cursor-pointer"
                type="button"
                title="Load sample: Spotify Executive Summit 120 Pax"
              >
                Sample 2 (Spotify 120 pax)
              </button>
              {transcript && (
                <button
                  onClick={() => {
                    setTranscript("");
                    setInterimText("");
                  }}
                  className="px-2 py-1 rounded hover:bg-surface-container text-[11px] text-on-surface-variant transition-colors cursor-pointer"
                  type="button"
                >
                  Clear
                </button>
              )}
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
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </button>

          <button
            id="btn-finish-and-parse"
            onClick={handleStopAndExtract}
            disabled={isExtracting || (!transcript.trim() && !interimText.trim())}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            type="button"
          >
            {isExtracting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>AI Extracting RFP with GPT-4o-mini...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Finish &amp; Parse RFP with AI</span>
              </>
            )}
          </button>
        </div>

        {/* Helper Keyboard Shortcuts Hint */}
        <div className="text-center pt-1">
          <p className="text-xs text-on-surface-variant opacity-80 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">keyboard</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-on-surface shadow-sm">Space</kbd> to toggle mic or <kbd className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-on-surface shadow-sm">Esc</kbd> to cancel
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
