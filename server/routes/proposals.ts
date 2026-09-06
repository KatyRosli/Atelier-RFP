import express from "express";
import { RfpPayloadSchema, ProposalItem } from "../../src/types.ts";
import { getOrCreateUser } from "../../src/db/users.ts";
import { getProposals, upsertProposal } from "../../src/db/proposals.ts";
import {
  ROOM_NIGHT_RATE_SEK,
  DAILY_CONFERENCE_PACKAGE_SEK,
  CATERING_RATE_SEK,
  getConferenceDays,
  getCateringOccasions,
} from "../../src/lib/pricing.ts";
import { config } from "../config.ts";
import { createProposalesProposal, submitProposalesRfp } from "../services/proposales-client.ts";

export const proposalsRouter = express.Router();


proposalsRouter.get("/api/proposals", async (_req, res) => {
  try {
    await getOrCreateUser(config.defaultUserId, config.defaultUserEmail);

    const dbProposals = await getProposals(config.defaultUserId);
    res.json({ success: true, proposals: dbProposals });
  } catch (error: any) {
    console.error("Failed to fetch proposals:", error);
    res.status(500).json({ error: error.message || "Failed to fetch proposals from database" });
  }
});


proposalsRouter.post("/api/proposals", async (req, res) => {
  try {
    const uid = config.defaultUserId;
    await getOrCreateUser(uid, config.defaultUserEmail);

    const { payload: rawPayload, item, language } = req.body;

    // Boundary check: the same shape /api/extract already validates on the way out
    // (RfpPayloadSchema) should also hold on the way back in here. This is intentionally
    // observability-only (log and continue with the raw value) rather than a hard 400,
    // so no previously-working request can start failing because of it.
    let payload = rawPayload;
    if (rawPayload !== undefined) {
      const result = RfpPayloadSchema.safeParse(rawPayload);
      if (result.success) {
        payload = result.data;
      } else {
        console.warn("POST /api/proposals: payload did not match RfpPayloadSchema, proceeding with raw value:", result.error.message);
      }
    }

    const proposalId = item?.id || `PRP-${Math.floor(10000 + Math.random() * 90000)}`;
    const clientName = payload?.organization?.name || item?.clientName || "Nordic Tech AB";
    const slug = clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    // This app's own placeholder link for its local demo UI (PDF preview, share buttons).
    // Overwritten below with a real Proposales URL when the Create Proposal call succeeds.
    const generatedUrl = item?.proposalUrl || `https://proposales.com/p/grand-hotel/${slug}-2027`;

    const language_ = language === "sv" ? "sv" : "en";
    const contactName = payload?.organization?.contact?.name || item?.contactName || "";
    const [firstName, ...restName] = contactName.split(" ");
    const contactEmail = payload?.organization?.contact?.email || item?.contactEmail;
    const contactPhone = payload?.organization?.contact?.phone || item?.contactPhone;
    const attendees = payload?.event?.attendees ?? item?.guestsCount ?? 60;
    const roomQuantity = payload?.event?.roomBlock?.quantity ?? item?.roomQuantity ?? 30;
    const roomCategory = payload?.event?.roomBlock?.roomCategory || "Double Deluxe";
    const nights = payload?.event?.dates?.nights ?? item?.nights ?? 2;
    const totalBudgetSEK = payload?.financials?.totalBudgetSEK ?? item?.totalAmountSEK ?? 450000;

    const meetingSummary = payload?.event?.meetingFacilities?.length
      ? payload.event.meetingFacilities.map((m: any) => `${m.space} (${m.durationDays} days, ${m.setupPreference})`).join(", ")
      : item?.meetingRooms || "Plenary Meeting Facilities";

    const cateringSummary = payload?.event?.catering?.length
      ? payload.event.catering.map((c: any) => `${c.item}${c.quantity ? ` (x${c.quantity})` : ""}`).join(", ")
      : item?.cateringSummary || "Standard Nordic Catering Package";

    const formattedDates = payload?.event?.dates
      ? `${payload.event.dates.checkIn} to ${payload.event.dates.checkOut} (${payload.event.dates.nights} nights)`
      : item?.datesText || "2027-03-03 to 2027-03-05 (2 nights)";

    let finalId = proposalId;
    let finalUrl = generatedUrl;
    let submittedToProposales = false;

    const apiKey = config.proposales.apiKey;
    const companyId = config.proposales.companyId;
    const inboxToken = config.proposales.inboxToken;
    const isTestSubmission = config.proposales.isTestSubmission;

    if (apiKey && companyId) {
      // Author a real proposal directly (requires Bearer auth + company_id). Pricing
      // mirrors the same per-unit rates used in the local PDF preview, so both are consistent.
      const conferenceDays = getConferenceDays(payload?.event?.meetingFacilities);
      const cateringOccasions = getCateringOccasions(payload?.event?.catering);

      try {
        const response = await createProposalesProposal(apiKey, {
          company_id: Number(companyId),
          language: language_,
          title_md: `${clientName} — ${payload?.event?.type || "Offsite"}`,
          description_md: item?.transcript ? `Captured from voice request:\n\n${item.transcript}` : undefined,
          recipient: contactEmail
            ? { first_name: firstName || undefined, last_name: restName.join(" ") || undefined, email: contactEmail, phone: contactPhone, company_name: clientName }
            : undefined,
          blocks: [
            {
              type: "product-block",
              title: `${roomCategory} Accommodation`,
              description: `${nights} nights inclusive of breakfast`,
              currency: "SEK",
              quantity: roomQuantity * nights,
              unit_value_without_discount_with_tax: ROOM_NIGHT_RATE_SEK,
            },
            {
              type: "product-block",
              title: "Conference Package & A/V",
              description: meetingSummary,
              currency: "SEK",
              quantity: attendees * conferenceDays,
              unit_value_without_discount_with_tax: DAILY_CONFERENCE_PACKAGE_SEK,
            },
            {
              type: "product-block",
              title: "Catering",
              description: cateringSummary,
              currency: "SEK",
              quantity: attendees * cateringOccasions,
              unit_value_without_discount_with_tax: CATERING_RATE_SEK,
            },
          ],
        });

        if (response.ok) {
          const { proposal } = await response.json();
          if (proposal?.url) {
            finalUrl = proposal.url;
            finalId = proposal.uuid || finalId;
            submittedToProposales = true;
            console.log("Created real Proposales proposal:", proposal.url);
          }
        } else {
          const errorText = await response.text();
          console.warn(`Proposales Create Proposal API returned ${response.status}:`, errorText);
        }
      } catch (extErr) {
        console.warn("Proposales Create Proposal request failed:", extErr);
      }
    } else if (inboxToken) {
      // Fallback: no company_id available, so just file the request into the public
      // inbox instead (POST /v1/inbox/{token}) - no auth, no client-facing URL returned.
      try {
        const messageLines = [
          `Event type: ${payload?.event?.type || "N/A"}`,
          `Guests: ${attendees}`,
          `Rooms: ${roomQuantity} ${roomCategory}`.trim(),
          `Meeting facilities: ${meetingSummary}`,
          `Catering: ${cateringSummary}`,
          payload?.event?.specialDirectives ? `Special directives: ${payload.event.specialDirectives}` : null,
          `Budget: ${totalBudgetSEK} SEK`,
          "",
          `Original voice transcript: ${item?.transcript || ""}`,
        ].filter(Boolean);

        const response = await submitProposalesRfp(inboxToken, {
          email: contactEmail,
          company_name: clientName,
          first_name: firstName || undefined,
          last_name: restName.join(" ") || undefined,
          phone_number: contactPhone,
          message: messageLines.join("\n"),
          language: language_,
          start_date: payload?.event?.dates?.checkIn || item?.checkIn,
          end_date: payload?.event?.dates?.checkOut || item?.checkOut,
          is_test: String(isTestSubmission),
        });

        if (response.ok) {
          const { id: proposalesRfpId } = await response.json();
          console.log("Submitted to Proposales inbox, RFP id:", proposalesRfpId);
          submittedToProposales = true;
        } else {
          const errorText = await response.text();
          console.warn(`Proposales inbox API returned ${response.status}:`, errorText);
        }
      } catch (extErr) {
        console.warn("Proposales inbox submission failed:", extErr);
      }
    }

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
      externalSync: submittedToProposales,
    };

    // Save directly to PostgreSQL via Drizzle ORM
    await upsertProposal(proposalItem, uid);

    res.status(201).json({
      success: true,
      statusCode: 201,
      id: proposalItem.id,
      url: proposalItem.proposalUrl,
      totalSEK: proposalItem.totalAmountSEK,
      clientName: proposalItem.clientName,
      proposal: proposalItem,
      externalSync: submittedToProposales,
    });
  } catch (err: any) {
    console.error("Proposales submission error:", err);
    res.status(500).json({ error: err.message || "Proposales API dispatch error" });
  }
});
