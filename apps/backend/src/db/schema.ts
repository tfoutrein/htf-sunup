import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table with roles and manager relationship
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('fbo'), // 'marraine' | 'manager' | 'fbo'
  managerId: integer('manager_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Campaigns table - Global campaigns shared between marraine and managers
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft' | 'active' | 'completed' | 'cancelled'
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Challenges table - Daily challenges within a campaign
export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  date: date('date').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Actions table - Individual actions within a challenge (1-6 per challenge)
export const actions = pgTable('actions', {
  id: serial('id').primaryKey(),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challenges.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'vente' | 'recrutement' | 'reseaux_sociaux'
  order: integer('order').notNull().default(1), // Position in challenge (1-6)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Actions (completion tracking)
export const userActions = pgTable('user_actions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  actionId: integer('action_id')
    .notNull()
    .references(() => actions.id),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challenges.id), // For traceability
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  proofUrl: varchar('proof_url', { length: 500 }), // URL for uploaded proof
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
  }),
  teamMembers: many(users),
  createdCampaigns: many(campaigns),
  userActions: many(userActions),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  challenges: many(challenges),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [challenges.campaignId],
    references: [campaigns.id],
  }),
  actions: many(actions),
  userActions: many(userActions),
}));

export const actionsRelations = relations(actions, ({ one, many }) => ({
  challenge: one(challenges, {
    fields: [actions.challengeId],
    references: [challenges.id],
  }),
  userActions: many(userActions),
}));

export const userActionsRelations = relations(userActions, ({ one }) => ({
  user: one(users, {
    fields: [userActions.userId],
    references: [users.id],
  }),
  action: one(actions, {
    fields: [userActions.actionId],
    references: [actions.id],
  }),
  challenge: one(challenges, {
    fields: [userActions.challengeId],
    references: [challenges.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;
export type UserAction = typeof userActions.$inferSelect;
export type NewUserAction = typeof userActions.$inferInsert;
