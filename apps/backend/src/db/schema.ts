import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
  date,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table with roles and manager relationship
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // Nullable pour les utilisateurs Facebook
  role: varchar('role', { length: 50 }).notNull().default('fbo'), // 'manager' | 'fbo'
  managerId: integer('manager_id').references(() => users.id),
  // Champs pour l'authentification Facebook
  facebookId: varchar('facebook_id', { length: 255 }).unique(),
  facebookAccessToken: varchar('facebook_access_token', { length: 1000 }),
  profilePicture: varchar('profile_picture', { length: 500 }),
  authProvider: varchar('auth_provider', { length: 50 })
    .notNull()
    .default('local'), // 'local' | 'facebook'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Campaigns table - Global campaigns shared between managers
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // 'draft' | 'active' | 'completed' | 'cancelled'
  archived: boolean('archived').notNull().default(false), // true si archivée
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
  valueInEuro: decimal('value_in_euro', { precision: 10, scale: 2 })
    .notNull()
    .default('0.50'), // Valeur en euros pour le défi complet
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

// Campaign Bonus Configuration - Manager-configurable bonus amounts per campaign
export const campaignBonusConfig = pgTable('campaign_bonus_config', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  basketBonusAmount: decimal('basket_bonus_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('1.00'), // Montant en euros pour un panier
  sponsorshipBonusAmount: decimal('sponsorship_bonus_amount', {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default('5.00'), // Montant en euros pour un parrainage
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Daily Bonus - FBO daily bonus declarations
export const dailyBonus = pgTable('daily_bonus', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  bonusDate: date('bonus_date').notNull(), // Date de déclaration du bonus
  bonusType: varchar('bonus_type', { length: 50 }).notNull(), // 'basket' | 'sponsorship'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Montant du bonus
  proofUrl: varchar('proof_url', { length: 500 }), // URL de la preuve photo
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  reviewedBy: integer('reviewed_by').references(() => users.id), // Manager qui a validé
  reviewedAt: timestamp('reviewed_at'),
  reviewComment: text('review_comment'), // Commentaire du manager
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
  dailyBonuses: many(dailyBonus),
  reviewedDailyBonuses: many(dailyBonus),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  challenges: many(challenges),
  bonusConfig: one(campaignBonusConfig),
  dailyBonuses: many(dailyBonus),
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

export const campaignBonusConfigRelations = relations(
  campaignBonusConfig,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignBonusConfig.campaignId],
      references: [campaigns.id],
    }),
  }),
);

export const dailyBonusRelations = relations(dailyBonus, ({ one }) => ({
  user: one(users, {
    fields: [dailyBonus.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [dailyBonus.campaignId],
    references: [campaigns.id],
  }),
  reviewer: one(users, {
    fields: [dailyBonus.reviewedBy],
    references: [users.id],
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
export type CampaignBonusConfig = typeof campaignBonusConfig.$inferSelect;
export type NewCampaignBonusConfig = typeof campaignBonusConfig.$inferInsert;
export type DailyBonus = typeof dailyBonus.$inferSelect;
export type NewDailyBonus = typeof dailyBonus.$inferInsert;
