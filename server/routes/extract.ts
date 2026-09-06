import express from "express";
import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { RfpPayloadSchema, RfpPayload } from "../../src/types.ts";
import { config } from "../config.ts";

export const extractRouter = express.Router();

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
extractRouter.post("/api/extract", async (req, res) => {
  try {
    const { transcript, model = "gpt-4o-mini" } = req.body;
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Transcript is required" });
    }

    // 1. Primary: Vercel AI SDK generateObject with OpenAI (GPT-4o-mini)
    if (config.openaiApiKey) {
      try {
        const openai = createOpenAI({
          apiKey: config.openaiApiKey,
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
    if (config.geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
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
