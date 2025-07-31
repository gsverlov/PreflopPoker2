import { type HandAnalysis, type PositionStats, type PositionCategory, type HandHistory, type InsertHandHistory, type User, type InsertUser, handHistories, users } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  analyzeHand(cards: any[], context: any): Promise<HandAnalysis>;
  getPositionStats(position: PositionCategory): Promise<PositionStats>;
  saveHandHistory(handHistory: InsertHandHistory): Promise<HandHistory>;
  getHandHistory(userId?: number, limit?: number): Promise<HandHistory[]>;
  createUser(insertUser: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  async analyzeHand(cards: any[], context: any): Promise<HandAnalysis> {
    // This would normally call the poker engine, but for now we'll return a basic structure
    // The actual logic will be implemented in the frontend poker engine
    return {
      cards,
      context,
      handStrength: 'GOOD',
      winRate: 65,
      playabilityScore: 7.5,
      recommendation: {
        primaryAction: 'RAISE',
        actionSize: '2.5-3x BB',
        confidence: 80,
        reasoning: ['Solid hand strength', 'Good position', 'Appropriate stack depth'],
        alternatives: [
          { action: 'CALL', percentage: 25 },
          { action: 'FOLD', percentage: 5 }
        ]
      }
    } as HandAnalysis;
  }

  async getPositionStats(position: PositionCategory): Promise<PositionStats> {
    const stats = {
      'Early Position': {
        position,
        vpipRange: '15-18%',
        pfrRange: '12-15%',
        threeBetRange: '3-5%',
        foldTo3BetRange: '75-80%',
        proTip: 'Play tight in early position. Only premium hands should be played for value.'
      },
      'Middle Position': {
        position,
        vpipRange: '18-22%',
        pfrRange: '15-19%',
        threeBetRange: '4-6%',
        foldTo3BetRange: '70-75%',
        proTip: 'Slightly wider range than early position. Consider position relative to aggressive players.'
      },
      'Late Position': {
        position,
        vpipRange: '22-27%',
        pfrRange: '18-24%',
        threeBetRange: '5-8%',
        foldTo3BetRange: '65-70%',
        proTip: 'Use positional advantage to play a wider range and control pot size.'
      },
      'Blinds': {
        position,
        vpipRange: '20-35%',
        pfrRange: '8-15%',
        threeBetRange: '6-10%',
        foldTo3BetRange: '60-70%',
        proTip: 'Defend based on pot odds and position. Consider squeeze opportunities.'
      }
    };

    return stats[position];
  }

  async saveHandHistory(handHistory: InsertHandHistory): Promise<HandHistory> {
    const [result] = await db
      .insert(handHistories)
      .values(handHistory)
      .returning();
    return result;
  }

  async getHandHistory(userId?: number, limit: number = 50): Promise<HandHistory[]> {
    if (userId) {
      return await db
        .select()
        .from(handHistories)
        .where(eq(handHistories.userId, userId))
        .orderBy(desc(handHistories.createdAt))
        .limit(limit);
    }
    
    return await db
      .select()
      .from(handHistories)
      .orderBy(desc(handHistories.createdAt))
      .limit(limit);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }
}

export const storage = new DatabaseStorage();
