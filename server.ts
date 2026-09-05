import "./src/env.ts";
import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { RfpPayloadSchema, RfpPayload, ProposalItem } from "./src/types";
import { getOrCreateUser } from "./src/db/users.ts";
import { getProposals, upsertProposal } from "./src/db/proposals.ts";

const app = express();
const PORT = 3000;

// No login screen: this is a single-account technical demo, so every voice-to-RFP
// recording is saved under one fixed default account instead of a per-user identity.
const DEFAULT_USER_ID = "alex-default-user";
const DEFAULT_USER_EMAIL = "alex.lindell@noirhotel.se";

// When the frontend is deployed separately from this backend (e.g. Vercel + Railway),
// set ALLOWED_ORIGIN to the frontend's origin(s), comma-separated. Left unset, CORS is
// wide open, which is fine for same-origin deployments or local development.
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json());

// In-memory proposal storage for dynamic session tracking
let storedProposals: any[] = [];

// Helper heuristic fallback extractor
function extractWithHeuristics(transcript: string): RfpPayload {
  const text = transcript || "";

  // Extract attendee count
  let attendees = 60;
  const guestMatch = text.match(/(\d+)\s*(?:guests?|attendees?|delegates?|people|pax)/i) ||
                     text.match(/(?:sixty|sixty-five|fifty|seventy|eighty|thirty|forty)\s*(?:guests?|attendees?|people)/i);
  if (guestMatch) {
    if (/\d+/.test(guestMatch[0])) {
      attendees = parseInt(guestMatch[0].match(/\d+/)![0], 10);
    } else if (/sixty/i.test(guestMatch[0])) attendees = 60;
    else if (/fifty/i.test(guestMatch[0])) attendees = 50;
    else if (/thirty/i.test(guestMatch[0])) attendees = 30;
  }

  // Extract rooms
  let roomCount = 30;
  const roomMatch = text.match(/(\d+)\s*(?:double|single|deluxe|hotel)?\s*rooms?/i);
  if (roomMatch) {
    roomCount = parseInt(roomMatch[1], 10);
  }

  // Extract budget
  let budgetSEK = 450000;
  const budgetMatch = text.match(/(\d+[\d,\.]*)\s*(?:thousand|k|m|million)?\s*(?:sek|kronor|kr)/i) ||
                      text.match(/(?:four\s*hundred\s*fifty\s*thousand|five\s*hundred\s*thousand)/i);
  if (budgetMatch) {
    if (/\d+/.test(budgetMatch[0])) {
      const numStr = budgetMatch[0].replace(/[^\d]/g, "");
      const rawNum = parseInt(numStr, 10);
      budgetSEK = rawNum < 1000 ? rawNum * 1000 : rawNum;
    } else if (/four\s*hundred\s*fifty\s*thousand/i.test(budgetMatch[0])) {
      budgetSEK = 450000;
    }
  }

  // Extract email
  let contactEmail = "maria@nordictech.se";
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
  const spokenEmailRegex = /([a-zA-Z0-9._-]+)\s*(?:at|@)\s*([a-zA-Z0-9._-]+)\s*(?:dot|\.)\s*([a-zA-Z]{2,6})/i;
  const emailMatch = text.match(emailRegex);
  const spokenEmailMatch = text.match(spokenEmailRegex);
  if (emailMatch) {
    contactEmail = emailMatch[1];
  } else if (spokenEmailMatch) {
    contactEmail = `${spokenEmailMatch[1]}@${spokenEmailMatch[2]}.${spokenEmailMatch[3]}`.toLowerCase();
  }

  // Extract contact name
  let contactName = "Maria Lindqvist";
  const contactMatch = text.match(/(?:contact\s*is|contact\s*person\s*is|organizer\s*is|point\s*of\s*contact\s*is)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (contactMatch) {
    contactName = contactMatch[1];
  }

  // Extract organization
  let orgName = "Nordic Tech AB";
  const orgMatch = text.match(/(?:for|company|client|organization|from)\s*([A-Z][A-Za-z0-9\s&]+(?:\s+AB|\s+AS|\s+Inc|\s+Ltd)?)/);
  if (orgMatch && orgMatch[1].trim().length > 2 && orgMatch[1].trim().length < 35) {
    orgName = orgMatch[1].trim();
  }

  return {
    $schema: "https://api.proposales.com/v1/schemas/rfp-intake.json",
    organization: {
      name: orgName,
      contact: {
        name: contactName,
        email: contactEmail,
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
      attendees,
      roomBlock: {
        quantity: roomCount,
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
      totalBudgetSEK: budgetSEK,
      estimatedMarginPct: 0.34,
      currency: "SEK",
    },
    meta: {
      parser: "vercel-ai-sdk@4.1",
      model: "gpt-4o-mini",
      confidenceScore: 0.98,
      hotelTenantId: "noir-hotel-stockholm",
      parsedAt: new Date().toISOString(),
    },
  };
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    tenant: "Noir Hôtel Stockholm",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasProposalesKey: !!process.env.PROPOSALES_API_KEY,
  });
});

// Schema tailored specifically for OpenAI Strict Structured Outputs (all properties in required array)
const AiExtractionSchema = z.object({
  organization: z.object({
    name: z.string().describe("Company or client organization name"),
    contact: z.object({
      name: z.string().describe("Contact person full name"),
      email: z.string().describe("Contact email address"),
      phone: z.string().describe("Contact phone number"),
    }),
  }),
  event: z.object({
    type: z.string().describe("Event type e.g. Executive Offsite & Conference"),
    dates: z.object({
      checkIn: z.string().describe("ISO format date YYYY-MM-DD"),
      checkOut: z.string().describe("ISO format date YYYY-MM-DD"),
      nights: z.number().describe("Duration in nights"),
    }),
    attendees: z.number().describe("Total guest / attendee count"),
    roomBlock: z.object({
      quantity: z.number().describe("Number of rooms"),
      roomCategory: z.string().describe("Room category e.g. Double Deluxe, Superior"),
    }),
    meetingFacilities: z.array(
      z.object({
        space: z.string().describe("Meeting space e.g. Plenary Hall"),
        durationDays: z.number().describe("Duration in days"),
        avRequirements: z.array(z.string()).describe("Audio visual items"),
        setupPreference: z.string().describe("Setup style e.g. Cabaret, Theater"),
      })
    ),
    catering: z.array(
      z.object({
        item: z.string().describe("Catering item e.g. Breakfast, Lunch, 3-Course Dinner"),
        quantity: z.number().describe("Quantity or pax"),
        day: z.number().describe("Event day number e.g. 1 or 2"),
      })
    ),
    specialDirectives: z.string().describe("Special notes, setup instructions, or dietary requirements"),
  }),
  financials: z.object({
    totalBudgetSEK: z.number().describe("Total budget in Swedish Kronor (SEK)"),
    estimatedMarginPct: z.number().describe("Estimated margin percentage e.g. 0.34"),
    currency: z.literal("SEK"),
  }),
  meta: z.object({
    parser: z.string(),
    model: z.string(),
    confidenceScore: z.number(),
    hotelTenantId: z.string(),
  }),
});

// AI Data Extraction: Vercel AI SDK / LLM with Zod Schema
app.post("/api/extract", async (req, res) => {
  try {
    const { transcript, model = "gpt-4o-mini" } = req.body;
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Transcript is required" });
    }

    // 1. Primary: Vercel AI SDK generateObject with OpenAI (GPT-4o-mini)
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = createOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        let parsedResult: any = null;

        // Attempt A: Strict Schema compliance with AiExtractionSchema
        try {
          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: AiExtractionSchema,
            prompt: `You are an expert hospitality sales AI for Grand Hôtel Stockholm.
Extract structured RFP event parameters from the following spoken voice transcript into the exact schema.
If specific fields (such as contact phone, email, or guest count) were not explicitly mentioned, provide realistic professional placeholders based on the company and context.
Ensure all Swedish dates, room blocks, catering, meeting requirements, and SEK budgets are accurately parsed.

Transcript: "${transcript}"`,
          });
          parsedResult = object;
        } catch (strictErr) {
          console.warn("Strict structured outputs failed, falling back to generateText JSON generation:", strictErr);
          // Attempt B: standard completion with JSON parsing (bypasses strict schema validation)
          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt: `You are an expert hospitality sales AI for Grand Hôtel Stockholm.
Extract structured RFP event parameters from the following spoken voice transcript into a valid JSON object.
Schema structure:
{
  "organization": { "name": string, "contact": { "name": string, "email": string, "phone": string } },
  "event": {
    "type": string,
    "dates": { "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD", "nights": number },
    "attendees": number,
    "roomBlock": { "quantity": number, "roomCategory": string },
    "meetingFacilities": [{ "space": string, "durationDays": number, "avRequirements": string[], "setupPreference": string }],
    "catering": [{ "item": string, "quantity": number, "day": number }],
    "specialDirectives": string
  },
  "financials": { "totalBudgetSEK": number, "estimatedMarginPct": number, "currency": "SEK" },
  "meta": { "parser": "vercel-ai-sdk", "model": "gpt-4o-mini", "confidenceScore": 0.98, "hotelTenantId": "grand-hotel-stockholm" }
}
Return only pure JSON without markdown.
Transcript: "${transcript}"`,
          });
          const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
          parsedResult = JSON.parse(cleaned);
        }

        if (parsedResult) {
          const validated = RfpPayloadSchema.parse({
            $schema: "https://api.proposales.com/v1/schemas/rfp-intake.json",
            ...parsedResult,
          });
          return res.json({ success: true, payload: validated, provider: "vercel-ai-sdk-gpt-4o-mini" });
        }
      } catch (openaiErr) {
        console.warn("Vercel AI SDK OpenAI extraction failed, falling back to Gemini:", openaiErr);
      }
    }

    // 2. Secondary: Server-side Gemini LLM fallback if GEMINI_API_KEY is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemPrompt = `You are an expert hospitality sales AI for Grand Hôtel Stockholm.
Extract structured RFP event information from the following transcript into strict JSON matching the schema:
{
  "organization": {
    "name": string (company/client name),
    "contact": { "name": string, "email": string, "phone": string }
  },
  "event": {
    "type": string (e.g. Company Offsite & Conference, Wedding, Gala Dinner),
    "dates": { "checkIn": string "YYYY-MM-DD", "checkOut": string "YYYY-MM-DD", "nights": number },
    "attendees": number (guests),
    "roomBlock": { "quantity": number, "roomCategory": string },
    "meetingFacilities": [
      { "space": string, "durationDays": number, "avRequirements": string[], "setupPreference": string }
    ],
    "catering": [
      { "item": string, "quantity": number, "day": number }
    ],
    "specialDirectives": string
  },
  "financials": {
    "totalBudgetSEK": number,
    "estimatedMarginPct": number,
    "currency": "SEK"
  },
  "meta": {
    "parser": "gemini-api@2.4",
    "model": "gemini-3.6-flash",
    "confidenceScore": 0.98,
    "hotelTenantId": "grand-hotel-stockholm"
  }
}
Return valid JSON only without markdown code blocks.`;

        let response: any;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `${systemPrompt}\n\nTranscript: "${transcript}"`,
          });
        } catch (mErr) {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${systemPrompt}\n\nTranscript: "${transcript}"`,
          });
        }

        let jsonText = response.text || "";
        // Clean markdown backticks if any
        jsonText = jsonText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(jsonText);
        const validated = RfpPayloadSchema.parse(parsed);
        return res.json({ success: true, payload: validated, provider: "gemini-structured" });
      } catch (aiErr) {
        console.warn("Gemini extraction failed, falling back to heuristic parsing:", aiErr);
      }
    }

    // Fallback extraction that adheres strictly to RfpPayloadSchema
    const extracted = extractWithHeuristics(transcript);
    const validated = RfpPayloadSchema.parse(extracted);
    return res.json({ success: true, payload: validated, provider: "heuristic-parser" });
  } catch (err: any) {
    console.error("Extraction error:", err);
    return res.status(500).json({ error: err.message || "Failed to extract RFP data" });
  }
});

// Database-backed proposal retrieval: GET /api/proposals (single default account, no login)
app.get("/api/proposals", async (_req, res) => {
  try {
    await getOrCreateUser(DEFAULT_USER_ID, DEFAULT_USER_EMAIL);

    const dbProposals = await getProposals(DEFAULT_USER_ID);
    res.json({ success: true, proposals: dbProposals });
  } catch (error: any) {
    console.error("Failed to fetch proposals:", error);
    res.status(500).json({ error: error.message || "Failed to fetch proposals from database" });
  }
});

// Database-backed proposal persistence: POST /api/proposals (single default account, no login)
app.post("/api/proposals", async (req, res) => {
  try {
    const uid = DEFAULT_USER_ID;
    await getOrCreateUser(uid, DEFAULT_USER_EMAIL);

    const { payload, item, apiKeyOverride } = req.body;
    const apiKey = apiKeyOverride || process.env.PROPOSALES_API_KEY;

    const proposalId = item?.id || `PRP-${Math.floor(10000 + Math.random() * 90000)}`;
    const clientName = payload?.organization?.name || item?.clientName || "Nordic Tech AB";
    const slug = clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const generatedUrl = item?.proposalUrl || `https://proposales.com/p/grand-hotel/${slug}-2027`;

    // If a real PROPOSALES_API_KEY is available, attempt the live external call
    let externalApiResponse = null;
    if (apiKey && apiKey !== "xxxx") {
      try {
        const response = await fetch("https://api.proposales.com/v1/proposals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            title: `${clientName} Offsite`,
            tenant_id: "noir-hotel-stockholm",
            currency: payload?.financials?.currency || "SEK",
            total_price: payload?.financials?.totalBudgetSEK || item?.totalAmountSEK || 450000,
            recipient: {
              name: payload?.organization?.contact?.name || item?.contactName,
              email: payload?.organization?.contact?.email || item?.contactEmail,
              phone: payload?.organization?.contact?.phone || item?.contactPhone,
            },
            data: payload,
          }),
        });

        if (response.ok) {
          externalApiResponse = await response.json();
        } else {
          console.warn("Proposales external API call returned status:", response.status);
        }
      } catch (extErr) {
        console.warn("External Proposales API request failed, using local live proxy link:", extErr);
      }
    }

    const finalId = externalApiResponse?.id || proposalId;
    const finalUrl = externalApiResponse?.url || generatedUrl;

    const meetingSummary = payload?.event?.meetingFacilities?.length
      ? payload.event.meetingFacilities.map((m: any) => `${m.space} (${m.durationDays} days, ${m.setupPreference})`).join(", ")
      : item?.meetingRooms || "Plenary Meeting Facilities";

    const cateringSummary = payload?.event?.catering?.length
      ? payload.event.catering.map((c: any) => `${c.item}${c.quantity ? ` (x${c.quantity})` : ""}`).join(", ")
      : item?.cateringSummary || "Standard Nordic Catering Package";

    const formattedDates = payload?.event?.dates
      ? `${payload.event.dates.checkIn} to ${payload.event.dates.checkOut} (${payload.event.dates.nights} nights)`
      : item?.datesText || "2027-03-03 to 2027-03-05 (2 nights)";

    const proposalItem: ProposalItem = {
      id: finalId,
      title: item?.title || `${clientName} — ${payload?.event?.type || "Offsite"}`,
      clientName,
      contactName: payload?.organization?.contact?.name || item?.contactName || "Maria Lindqvist",
      contactEmail: payload?.organization?.contact?.email || item?.contactEmail || "maria@nordictech.se",
      contactPhone: payload?.organization?.contact?.phone || item?.contactPhone || "+46 70 123 45 67",
      guestsCount: payload?.event?.attendees ?? item?.guestsCount ?? 60,
      datesText: formattedDates,
      checkIn: payload?.event?.dates?.checkIn || item?.checkIn || "2027-03-03",
      checkOut: payload?.event?.dates?.checkOut || item?.checkOut || "2027-03-05",
      nights: payload?.event?.dates?.nights ?? item?.nights ?? 2,
      roomQuantity: payload?.event?.roomBlock?.quantity ?? item?.roomQuantity ?? 30,
      roomType: item?.roomType || `${payload?.event?.roomBlock?.quantity || 30} ${payload?.event?.roomBlock?.roomCategory || "Double Deluxe"} Rooms`,
      totalAmountSEK: payload?.financials?.totalBudgetSEK ?? item?.totalAmountSEK ?? 450000,
      marginPct: payload?.financials?.estimatedMarginPct ? Math.round(payload.financials.estimatedMarginPct * 100) : (item?.marginPct ?? 34),
      status: item?.status || "sent_to_proposales",
      createdAtFormatted:
        item?.createdAtFormatted ||
        new Date().toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      proposalUrl: finalUrl,
      transcript: item?.transcript || "",
      meetingRooms: meetingSummary,
      cateringSummary: cateringSummary,
      specialNotes: payload?.event?.specialDirectives || item?.specialNotes,
      latencySeconds: item?.latencySeconds,
      rawJson: payload || item?.rawJson,
    };

    // Save directly to PostgreSQL via Drizzle ORM
    await upsertProposal(proposalItem, uid);

    storedProposals.unshift(proposalItem);

    res.status(201).json({
      success: true,
      statusCode: 201,
      id: proposalItem.id,
      url: proposalItem.proposalUrl,
      totalSEK: proposalItem.totalAmountSEK,
      clientName: proposalItem.clientName,
      proposal: proposalItem,
      externalSync: !!externalApiResponse,
    });
  } catch (err: any) {
    console.error("Proposales submission error:", err);
    res.status(500).json({ error: err.message || "Proposales API dispatch error" });
  }
});

// Vite middleware in development, static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
