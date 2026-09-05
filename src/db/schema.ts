import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const proposals = pgTable('proposals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  clientName: text('client_name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  guestsCount: integer('guests_count').notNull().default(0),
  datesText: text('dates_text'),
  checkIn: text('check_in'),
  checkOut: text('check_out'),
  nights: integer('nights').default(1),
  roomQuantity: integer('room_quantity').default(0),
  roomType: text('room_type'),
  totalAmountSEK: integer('total_amount_sek').notNull().default(0),
  marginPct: real('margin_pct').default(0.34),
  status: text('status').notNull().default('sent_to_proposales'),
  createdAtFormatted: text('created_at_formatted'),
  proposalUrl: text('proposal_url'),
  transcript: text('transcript'),
  meetingRooms: text('meeting_rooms'),
  cateringSummary: text('catering_summary'),
  specialNotes: text('special_notes'),
  latencySeconds: real('latency_seconds'),
  rawJson: text('raw_json'),
  externalSync: boolean('external_sync').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  proposals: many(proposals),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  user: one(users, {
    fields: [proposals.userId],
    references: [users.uid],
  }),
}));
