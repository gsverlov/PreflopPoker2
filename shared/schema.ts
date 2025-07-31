import { z } from "zod";

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

export const gameContextSchema = z.object({
  position: z.enum(positions),
  stackSize: z.number().min(1).max(500), // in big blinds
  previousAction: z.enum(['FOLD', 'CHECK', 'CALL', 'RAISE_2BB', 'RAISE_3BB', 'RAISE_4BB', '3BET', '4BET']).optional(),
  potSize: z.number().default(1.5), // in big blinds
  playersInHand: z.number().min(2).max(9).default(6)
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

export type Card = z.infer<typeof cardSchema>;
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
