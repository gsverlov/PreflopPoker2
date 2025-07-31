import { z } from "zod";
import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const cardRanks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export const cardSuits = ['♠', '♥', '♦', '♣'] as const;
export const positions = ['UTG', 'UTG+1', 'MP1', 'MP2', 'CO', 'BTN', 'SB', 'BB'] as const;
export const positionCategories = ['Early Position', 'Middle Position', 'Late Position', 'Blinds'] as const;
export const actions = ['FOLD', 'CHECK', 'CALL', 'RAISE', 'ALL_IN'] as const;
export const stackCategories = ['SHORT', 'MEDIUM', 'DEEP'] as const;
export const handStrengths = ['TRASH', 'WEAK', 'MARGINAL', 'GOOD', 'STRONG', 'PREMIUM'] as const;

export const cardSchema = z.object({
  rank: z.enum(cardRanks),
  suit: z.enum(cardSuits)
});

export const playerActionSchema = z.object({
  position: z.enum(positions),
  action: z.enum(['FOLD', 'CHECK', 'CALL', 'RAISE', 'ALL_IN']),
  amount: z.number().min(0), // in big blinds
  stackSize: z.number().min(0) // remaining stack after action
});

export const gameContextSchema = z.object({
  position: z.enum(positions),
  stackSize: z.number().min(1).max(500), // in big blinds
  totalPlayers: z.number().min(2).max(9).default(6),
  playerActions: z.array(playerActionSchema).default([]),
  potSize: z.number().default(1.5), // in big blinds
  bigBlind: z.number().default(1),
  isHeadsUp: z.boolean().default(false)
});

export const handAnalysisSchema = z.object({
  cards: z.array(cardSchema).length(2),
  context: gameContextSchema,
  handStrength: z.enum(handStrengths),
  winRate: z.number().min(0).max(100),
  playabilityScore: z.number().min(0).max(10),
  recommendation: z.object({
    primaryAction: z.enum(actions),
    actionSize: z.string().optional(),
    confidence: z.number().min(0).max(100),
    reasoning: z.array(z.string()),
    alternatives: z.array(z.object({
      action: z.enum(actions),
      percentage: z.number().min(0).max(100)
    }))
  })
});

export const positionStatsSchema = z.object({
  position: z.enum(positionCategories),
  vpipRange: z.string(),
  pfrRange: z.string(),
  threeBetRange: z.string(),
  foldTo3BetRange: z.string(),
  proTip: z.string()
});

// Database Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const handHistories = pgTable("hand_histories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  cards: jsonb("cards").notNull(), // Array of Card objects
  gameContext: jsonb("game_context").notNull(), // GameContext object
  handAnalysis: jsonb("hand_analysis").notNull(), // HandAnalysis object
  actualAction: text("actual_action"), // What the user actually did
  result: text("result"), // WIN, LOSE, FOLD
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  preferredStrategy: text("preferred_strategy").default("GTO"), // GTO, LAG, TAG, etc.
  riskTolerance: integer("risk_tolerance").default(5), // 1-10 scale
  preferredPositions: jsonb("preferred_positions"), // Array of preferred positions
  stakesLevel: text("stakes_level").default("MICRO"), // MICRO, LOW, MID, HIGH
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  handHistories: many(handHistories),
  preferences: many(userPreferences),
}));

export const handHistoriesRelations = relations(handHistories, ({ one }) => ({
  user: one(users, {
    fields: [handHistories.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertHandHistorySchema = createInsertSchema(handHistories).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type HandHistory = typeof handHistories.$inferSelect;
export type InsertHandHistory = z.infer<typeof insertHandHistorySchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type Card = z.infer<typeof cardSchema>;
export type PlayerAction = z.infer<typeof playerActionSchema>;
export type GameContext = z.infer<typeof gameContextSchema>;
export type HandAnalysis = z.infer<typeof handAnalysisSchema>;
export type PositionStats = z.infer<typeof positionStatsSchema>;
export type CardRank = typeof cardRanks[number];
export type CardSuit = typeof cardSuits[number];
export type Position = typeof positions[number];
export type PositionCategory = typeof positionCategories[number];
export type Action = typeof actions[number];
export type StackCategory = typeof stackCategories[number];
export type HandStrength = typeof handStrengths[number];
