import { db } from './index.ts';
import { proposals } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { ProposalItem } from '../types.ts';

export async function getProposals(userId?: string): Promise<ProposalItem[]> {
  try {
    const rows = userId
      ? await db.select().from(proposals).where(eq(proposals.userId, userId)).orderBy(desc(proposals.createdAt))
      : await db.select().from(proposals).orderBy(desc(proposals.createdAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      clientName: r.clientName,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone || "",
      guestsCount: r.guestsCount,
      datesText: r.datesText || "",
      checkIn: r.checkIn || "",
      checkOut: r.checkOut || "",
      nights: r.nights ?? 1,
      roomQuantity: r.roomQuantity ?? 0,
      roomType: r.roomType || "",
      totalAmountSEK: r.totalAmountSEK,
      marginPct: r.marginPct ?? 0.34,
      status: (r.status as "sent_to_proposales" | "needs_review") || "sent_to_proposales",
      createdAtFormatted: r.createdAtFormatted || "",
      proposalUrl: r.proposalUrl || "",
      transcript: r.transcript || "",
      meetingRooms: r.meetingRooms || "",
      cateringSummary: r.cateringSummary || "",
      specialNotes: r.specialNotes || undefined,
      latencySeconds: r.latencySeconds || undefined,
      rawJson: r.rawJson ? JSON.parse(r.rawJson) : undefined,
      externalSync: r.externalSync ?? false,
    }));
  } catch (error) {
    console.error("Database query failed in getProposals:", error);
    throw new Error("Failed to fetch proposals from database", { cause: error });
  }
}

export async function upsertProposal(item: ProposalItem, userId: string): Promise<ProposalItem> {
  try {
    const rawJsonStr = item.rawJson ? JSON.stringify(item.rawJson) : null;
    await db.insert(proposals)
      .values({
        id: item.id,
        userId,
        title: item.title,
        clientName: item.clientName,
        contactName: item.contactName,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone,
        guestsCount: item.guestsCount,
        datesText: item.datesText,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        nights: item.nights,
        roomQuantity: item.roomQuantity,
        roomType: item.roomType,
        totalAmountSEK: item.totalAmountSEK,
        marginPct: item.marginPct,
        status: item.status,
        createdAtFormatted: item.createdAtFormatted,
        proposalUrl: item.proposalUrl,
        transcript: item.transcript,
        meetingRooms: item.meetingRooms,
        cateringSummary: item.cateringSummary,
        specialNotes: item.specialNotes,
        latencySeconds: item.latencySeconds,
        rawJson: rawJsonStr,
        externalSync: item.externalSync ?? false,
      })
      .onConflictDoUpdate({
        target: proposals.id,
        set: {
          title: item.title,
          clientName: item.clientName,
          contactName: item.contactName,
          contactEmail: item.contactEmail,
          contactPhone: item.contactPhone,
          guestsCount: item.guestsCount,
          datesText: item.datesText,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          nights: item.nights,
          roomQuantity: item.roomQuantity,
          roomType: item.roomType,
          totalAmountSEK: item.totalAmountSEK,
          marginPct: item.marginPct,
          status: item.status,
          createdAtFormatted: item.createdAtFormatted,
          proposalUrl: item.proposalUrl,
          transcript: item.transcript,
          meetingRooms: item.meetingRooms,
          cateringSummary: item.cateringSummary,
          specialNotes: item.specialNotes,
          latencySeconds: item.latencySeconds,
          rawJson: rawJsonStr,
          externalSync: item.externalSync ?? false,
        },
      });

    return item;
  } catch (error) {
    console.error("Database query failed in upsertProposal:", error);
    throw new Error("Failed to save proposal to database", { cause: error });
  }
}
