// Shared between the client (ProposalPdfModal's local preview) and the server
// (the real Proposales proposal it creates), so both always quote the same numbers.
// If either drifts from the other independently, the client sees a different total
// than what actually gets billed - keeping them as one module prevents that.

export const ROOM_NIGHT_RATE_SEK = 3200; // SEK per deluxe room / night
export const DAILY_CONFERENCE_PACKAGE_SEK = 1250; // SEK per delegate / day (space + A/V + lunch + fika)
export const CATERING_RATE_SEK = 1850; // SEK per guest / catering occasion

interface MeetingFacilityLike {
  durationDays?: number;
}

export function getConferenceDays(meetingFacilities?: MeetingFacilityLike[] | null): number {
  return meetingFacilities?.length
    ? meetingFacilities.reduce((sum, m) => sum + (m.durationDays || 1), 0)
    : 2;
}

export function getCateringOccasions(catering?: unknown[] | null): number {
  return catering?.length || 1;
}

export function calculateAccommodationTotal(roomQuantity: number, nights: number): number {
  return roomQuantity * nights * ROOM_NIGHT_RATE_SEK;
}

export function calculateConferenceTotal(attendees: number, conferenceDays: number): number {
  return attendees * conferenceDays * DAILY_CONFERENCE_PACKAGE_SEK;
}

export function calculateCateringTotal(attendees: number, cateringOccasions: number): number {
  return attendees * cateringOccasions * CATERING_RATE_SEK;
}

export function calculateMiscAndService(totalBudgetSEK: number, knownItemsTotal: number): number {
  return Math.max(0, totalBudgetSEK - knownItemsTotal);
}
