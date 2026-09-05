import { z } from "zod";

export const OrganizationContactSchema = z.object({
  name: z.string().default("Maria Lindqvist"),
  email: z.string().email().default("maria@nordictech.se"),
  phone: z.string().optional().default("+46 70 123 45 67"),
});

export const OrganizationSchema = z.object({
  name: z.string().default("Nordic Tech AB"),
  contact: OrganizationContactSchema,
});

export const EventDatesSchema = z.object({
  checkIn: z.string().default("2027-03-03"),
  checkOut: z.string().default("2027-03-05"),
  nights: z.number().default(2),
});

export const RoomBlockSchema = z.object({
  quantity: z.number().default(30),
  roomCategory: z.string().default("Double Deluxe"),
});

export const MeetingFacilitySchema = z.object({
  space: z.string().default("Plenary Hall"),
  durationDays: z.number().default(2),
  avRequirements: z.array(z.string()).default(["projector", "integrated_sound_system", "microphones"]),
  setupPreference: z.string().default("Cabaret"),
});

export const CateringItemSchema = z.object({
  item: z.string(),
  quantity: z.number().optional(),
  day: z.number().optional(),
});

export const EventSchema = z.object({
  type: z.string().default("Company Offsite & Conference"),
  dates: EventDatesSchema,
  attendees: z.number().default(60),
  roomBlock: RoomBlockSchema,
  meetingFacilities: z.array(MeetingFacilitySchema).default([
    {
      space: "Plenary Hall",
      durationDays: 2,
      avRequirements: ["projector", "integrated_sound_system", "microphones"],
      setupPreference: "Cabaret",
    },
  ]),
  catering: z.array(CateringItemSchema).default([
    { item: "Breakfast", quantity: 2 },
    { item: "Lunch", quantity: 2 },
    { item: "3-Course Welcome Dinner", day: 1 },
  ]),
  specialDirectives: z.string().optional().default("Plenary seating in cabaret setup preferred."),
});

export const FinancialsSchema = z.object({
  totalBudgetSEK: z.number().default(450000),
  estimatedMarginPct: z.number().default(0.34),
  currency: z.string().default("SEK"),
});

export const RfpMetaSchema = z.object({
  parser: z.string().default("vercel-ai-sdk@4.1"),
  model: z.string().default("gpt-4o-mini"),
  confidenceScore: z.number().default(0.98),
  hotelTenantId: z.string().default("grand-hotel-stockholm"),
  parsedAt: z.string().optional(),
});

export const RfpPayloadSchema = z.object({
  $schema: z.string().optional().default("https://api.proposales.com/v1/schemas/rfp-intake.json"),
  organization: OrganizationSchema,
  event: EventSchema,
  financials: FinancialsSchema,
  meta: RfpMetaSchema,
});

export type RfpPayload = z.infer<typeof RfpPayloadSchema>;

export interface ProposalItem {
  id: string;
  title: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  guestsCount: number;
  datesText: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomQuantity: number;
  roomType: string;
  totalAmountSEK: number;
  marginPct: number;
  status: "sent_to_proposales" | "needs_review";
  createdAtFormatted: string;
  proposalUrl: string;
  transcript: string;
  meetingRooms: string;
  cateringSummary: string;
  specialNotes?: string;
  latencySeconds?: number;
  rawJson?: RfpPayload;
}
