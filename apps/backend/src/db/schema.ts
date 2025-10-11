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
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for campaign validation status
export const validationStatusEnum = pgEnum('validation_status', [
  'pending',
  'approved',
  'rejected',
]);

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

// Proofs table - Multiple proofs for user actions and daily bonuses
export const proofs = pgTable('proofs', {
  id: serial('id').primaryKey(),
  url: varchar('url', { length: 500 }).notNull(), // URL de la preuve stockée
  type: varchar('type', { length: 50 }).notNull(), // 'image' | 'video'
  originalName: varchar('original_name', { length: 255 }).notNull(), // Nom original du fichier
  size: integer('size').notNull(), // Taille en bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(), // Type MIME du fichier
  // Relations - une preuve appartient soit à une action utilisateur soit à un bonus
  userActionId: integer('user_action_id').references(() => userActions.id, {
    onDelete: 'cascade',
  }),
  dailyBonusId: integer('daily_bonus_id').references(() => dailyBonus.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// App Versions table - For release notes and version tracking
export const appVersions = pgTable('app_versions', {
  id: serial('id').primaryKey(),
  version: varchar('version', { length: 20 }).notNull().unique(), // e.g., "1.2.0"
  title: varchar('title', { length: 255 }).notNull(), // e.g., "Nouvelles fonctionnalités d'été"
  releaseDate: date('release_date').notNull(),
  isActive: boolean('is_active').notNull().default(true), // Si cette version est active
  isMajor: boolean('is_major').notNull().default(false), // Si c'est une version majeure
  shortDescription: text('short_description').notNull(), // Description courte pour la popup
  fullReleaseNotes: text('full_release_notes'), // Release notes complètes (optionnel)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Version Tracking - Track which versions users have seen
export const userVersionTracking = pgTable('user_version_tracking', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  versionId: integer('version_id')
    .notNull()
    .references(() => appVersions.id, { onDelete: 'cascade' }),
  hasSeenPopup: boolean('has_seen_popup').notNull().default(false), // Si l'utilisateur a vu la popup
  seenAt: timestamp('seen_at'), // Quand l'utilisateur l'a vue
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Campaign Validations - Manager validation of FBO campaigns
export const campaignValidations = pgTable('campaign_validations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // FBO being validated
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }), // Campaign being validated
  status: validationStatusEnum('status').notNull().default('pending'), // Validation status
  validatedBy: integer('validated_by').references(() => users.id), // Manager who validated (nullable if not validated yet)
  validatedAt: timestamp('validated_at'), // When validation occurred
  comment: text('comment'), // Optional validation comment
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Campaign Unlock Conditions - Conditions required to unlock campaign payout
export const campaignUnlockConditions = pgTable('campaign_unlock_conditions', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }), // Campaign these conditions belong to
  description: text('description').notNull(), // Free text description of the condition (e.g., "Présence à toutes les formations")
  displayOrder: integer('display_order').notNull().default(1), // Order in which conditions are displayed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Campaign Validation Conditions - Tracking of which conditions are fulfilled during validation
export const campaignValidationConditions = pgTable(
  'campaign_validation_conditions',
  {
    id: serial('id').primaryKey(),
    validationId: integer('validation_id')
      .notNull()
      .references(() => campaignValidations.id, { onDelete: 'cascade' }), // Validation this belongs to
    conditionId: integer('condition_id')
      .notNull()
      .references(() => campaignUnlockConditions.id, { onDelete: 'cascade' }), // Condition being checked
    isFulfilled: boolean('is_fulfilled').notNull().default(false), // Whether the condition is met
    fulfilledAt: timestamp('fulfilled_at'), // When the condition was marked as fulfilled
    fulfilledBy: integer('fulfilled_by').references(() => users.id), // Manager who marked it as fulfilled
    comment: text('comment'), // Optional comment for this specific condition
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
);

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
  versionTracking: many(userVersionTracking),
  campaignValidations: many(campaignValidations),
  validatedCampaigns: many(campaignValidations),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  challenges: many(challenges),
  bonusConfig: one(campaignBonusConfig),
  dailyBonuses: many(dailyBonus),
  validations: many(campaignValidations),
  unlockConditions: many(campaignUnlockConditions),
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

export const userActionsRelations = relations(userActions, ({ one, many }) => ({
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
  proofs: many(proofs),
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

export const dailyBonusRelations = relations(dailyBonus, ({ one, many }) => ({
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
  proofs: many(proofs),
}));

export const proofsRelations = relations(proofs, ({ one }) => ({
  userAction: one(userActions, {
    fields: [proofs.userActionId],
    references: [userActions.id],
  }),
  dailyBonus: one(dailyBonus, {
    fields: [proofs.dailyBonusId],
    references: [dailyBonus.id],
  }),
}));

export const appVersionsRelations = relations(appVersions, ({ many }) => ({
  userTracking: many(userVersionTracking),
}));

export const userVersionTrackingRelations = relations(
  userVersionTracking,
  ({ one }) => ({
    user: one(users, {
      fields: [userVersionTracking.userId],
      references: [users.id],
    }),
    version: one(appVersions, {
      fields: [userVersionTracking.versionId],
      references: [appVersions.id],
    }),
  }),
);

export const campaignValidationsRelations = relations(
  campaignValidations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [campaignValidations.userId],
      references: [users.id],
    }),
    campaign: one(campaigns, {
      fields: [campaignValidations.campaignId],
      references: [campaigns.id],
    }),
    validator: one(users, {
      fields: [campaignValidations.validatedBy],
      references: [users.id],
    }),
    conditionFulfillments: many(campaignValidationConditions),
  }),
);

export const campaignUnlockConditionsRelations = relations(
  campaignUnlockConditions,
  ({ one, many }) => ({
    campaign: one(campaigns, {
      fields: [campaignUnlockConditions.campaignId],
      references: [campaigns.id],
    }),
    fulfillments: many(campaignValidationConditions),
  }),
);

export const campaignValidationConditionsRelations = relations(
  campaignValidationConditions,
  ({ one }) => ({
    validation: one(campaignValidations, {
      fields: [campaignValidationConditions.validationId],
      references: [campaignValidations.id],
    }),
    condition: one(campaignUnlockConditions, {
      fields: [campaignValidationConditions.conditionId],
      references: [campaignUnlockConditions.id],
    }),
    fulfilledByUser: one(users, {
      fields: [campaignValidationConditions.fulfilledBy],
      references: [users.id],
    }),
  }),
);

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
export type Proof = typeof proofs.$inferSelect;
export type NewProof = typeof proofs.$inferInsert;
export type AppVersion = typeof appVersions.$inferSelect;
export type NewAppVersion = typeof appVersions.$inferInsert;
export type UserVersionTracking = typeof userVersionTracking.$inferSelect;
export type NewUserVersionTracking = typeof userVersionTracking.$inferInsert;
export type CampaignValidation = typeof campaignValidations.$inferSelect;
export type NewCampaignValidation = typeof campaignValidations.$inferInsert;
export type CampaignUnlockCondition =
  typeof campaignUnlockConditions.$inferSelect;
export type NewCampaignUnlockCondition =
  typeof campaignUnlockConditions.$inferInsert;
export type CampaignValidationCondition =
  typeof campaignValidationConditions.$inferSelect;
export type NewCampaignValidationCondition =
  typeof campaignValidationConditions.$inferInsert;
