import { Card, GameContext, HandAnalysis, HandStrength, Action, PositionCategory } from "@shared/schema";

export class PokerEngine {
  
  // Hand strength evaluation based on starting hand charts
  static evaluateHandStrength(cards: Card[]): { strength: HandStrength; winRate: number; playabilityScore: number } {
    if (cards.length !== 2) throw new Error("Must provide exactly 2 cards");
    
    const [card1, card2] = cards;
    const ranks = [card1.rank, card2.rank];
    const suited = card1.suit === card2.suit;
    
    // Premium hands (AA, KK, QQ, AK)
    if (this.isPair(ranks) && ['A', 'K', 'Q'].includes(ranks[0])) {
      return { strength: 'PREMIUM', winRate: ranks[0] === 'A' ? 85 : ranks[0] === 'K' ? 82 : 78, playabilityScore: 9.5 };
    }
    
    if (this.isAceKing(ranks)) {
      return { strength: 'PREMIUM', winRate: suited ? 73 : 65, playabilityScore: suited ? 9.2 : 8.8 };
    }
    
    // Strong hands
    if (this.isPair(ranks) && ['J', 'T'].includes(ranks[0])) {
      return { strength: 'STRONG', winRate: ranks[0] === 'J' ? 75 : 71, playabilityScore: 8.5 };
    }
    
    if (this.isAceQueen(ranks) || this.isAceJack(ranks)) {
      const baseWinRate = this.isAceQueen(ranks) ? 63 : 59;
      return { strength: 'STRONG', winRate: suited ? baseWinRate + 8 : baseWinRate, playabilityScore: suited ? 8.2 : 7.8 };
    }
    
    if (this.isKingQueen(ranks)) {
      return { strength: 'STRONG', winRate: suited ? 67 : 59, playabilityScore: suited ? 8.0 : 7.4 };
    }
    
    // Good hands
    if (this.isPair(ranks) && ['9', '8'].includes(ranks[0])) {
      return { strength: 'GOOD', winRate: ranks[0] === '9' ? 68 : 66, playabilityScore: 7.5 };
    }
    
    if (this.isAceTen(ranks) || this.isKingJack(ranks)) {
      const baseWinRate = this.isAceTen(ranks) ? 58 : 57;
      return { strength: 'GOOD', winRate: suited ? baseWinRate + 6 : baseWinRate, playabilityScore: suited ? 7.6 : 7.0 };
    }
    
    // Marginal hands
    if (this.isPair(ranks) && ['7', '6'].includes(ranks[0])) {
      return { strength: 'MARGINAL', winRate: ranks[0] === '7' ? 64 : 62, playabilityScore: 6.8 };
    }
    
    if (this.isSuitedConnector(cards) || this.isSuitedGapper(cards)) {
      return { strength: 'MARGINAL', winRate: 52, playabilityScore: 6.5 };
    }
    
    // Weak hands
    if (this.isPair(ranks) && ['5', '4', '3', '2'].includes(ranks[0])) {
      return { strength: 'WEAK', winRate: 58, playabilityScore: 5.5 };
    }
    
    // Check for other playable hands
    if (this.hasAce(ranks) && suited) {
      return { strength: 'WEAK', winRate: 48, playabilityScore: 5.8 };
    }
    
    // Trash hands
    return { strength: 'TRASH', winRate: 35, playabilityScore: 2.0 };
  }
  
  // Position-based decision making
  static getRecommendation(cards: Card[], context: GameContext): HandAnalysis['recommendation'] {
    const handEval = this.evaluateHandStrength(cards);
    const position = this.getPositionCategory(context.position);
    const stackCategory = this.getStackCategory(context.stackSize);
    
    let primaryAction: Action = 'FOLD';
    let actionSize = '';
    let confidence = 50;
    let reasoning: string[] = [];
    let alternatives = [
      { action: 'FOLD' as Action, percentage: 0 },
      { action: 'CALL' as Action, percentage: 0 },
      { action: 'RAISE' as Action, percentage: 0 }
    ];
    
    // Decision tree based on hand strength and position
    if (handEval.strength === 'PREMIUM') {
      primaryAction = 'RAISE';
      actionSize = context.previousAction?.includes('RAISE') || context.previousAction?.includes('BET') ? '3-4x BB' : '2.5-3x BB';
      confidence = 90;
      reasoning = [
        `Premium hand (${cards[0].rank}${cards[1].rank}) - top tier starting hand`,
        `${position} allows for aggressive play`,
        `Stack depth (${context.stackSize}BB) supports post-flop play`
      ];
      alternatives = [
        { action: 'RAISE', percentage: 90 },
        { action: 'CALL', percentage: 8 },
        { action: 'FOLD', percentage: 2 }
      ];
    } else if (handEval.strength === 'STRONG') {
      if (position === 'Late Position' || position === 'Middle Position') {
        primaryAction = 'RAISE';
        actionSize = '2.5-3x BB';
        confidence = 80;
        reasoning = [
          `Strong hand with good playability`,
          `${position} provides positional advantage`,
          `Good spot to build pot with strong holding`
        ];
      } else {
        primaryAction = context.previousAction ? 'CALL' : 'RAISE';
        actionSize = primaryAction === 'RAISE' ? '2.5x BB' : '';
        confidence = 70;
        reasoning = [
          `Strong hand but ${position} requires caution`,
          context.previousAction ? 'Previous action limits aggression' : 'No action before allows for value raise'
        ];
      }
      alternatives = [
        { action: primaryAction, percentage: 70 },
        { action: primaryAction === 'RAISE' ? 'CALL' : 'RAISE', percentage: 25 },
        { action: 'FOLD', percentage: 5 }
      ];
    } else if (handEval.strength === 'GOOD') {
      if (position === 'Late Position' && !context.previousAction) {
        primaryAction = 'RAISE';
        actionSize = '2.5x BB';
        confidence = 75;
        reasoning = [
          `Decent hand in excellent position`,
          `No previous action allows for stealing blinds`,
          `Good post-flop playability`
        ];
      } else if (context.previousAction) {
        primaryAction = 'CALL';
        confidence = 60;
        reasoning = [
          `Good hand but facing action`,
          `Pot odds justify a call`,
          `Position consideration in play`
        ];
      } else {
        primaryAction = position === 'Early Position' ? 'FOLD' : 'CALL';
        confidence = 55;
        reasoning = [
          `Marginal spot with good hand`,
          `${position} influences decision`,
          `Stack depth allows for speculation`
        ];
      }
      alternatives = [
        { action: primaryAction, percentage: 60 },
        { action: primaryAction === 'FOLD' ? 'CALL' : 'FOLD', percentage: 30 },
        { action: 'RAISE', percentage: 10 }
      ];
    } else {
      primaryAction = 'FOLD';
      confidence = 80;
      reasoning = [
        handEval.strength === 'MARGINAL' ? 'Marginal hand strength' : 'Weak hand - not profitable long-term',
        context.previousAction ? 'Facing action with weak holding' : 'Poor risk/reward ratio',
        `${position} doesn't provide enough value`
      ];
      alternatives = [
        { action: 'FOLD', percentage: 85 },
        { action: 'CALL', percentage: 15 },
        { action: 'RAISE', percentage: 0 }
      ];
    }
    
    return {
      primaryAction,
      actionSize,
      confidence,
      reasoning,
      alternatives
    };
  }
  
  // Helper methods
  private static isPair(ranks: string[]): boolean {
    return ranks[0] === ranks[1];
  }
  
  private static isAceKing(ranks: string[]): boolean {
    return (ranks[0] === 'A' && ranks[1] === 'K') || (ranks[0] === 'K' && ranks[1] === 'A');
  }
  
  private static isAceQueen(ranks: string[]): boolean {
    return (ranks[0] === 'A' && ranks[1] === 'Q') || (ranks[0] === 'Q' && ranks[1] === 'A');
  }
  
  private static isAceJack(ranks: string[]): boolean {
    return (ranks[0] === 'A' && ranks[1] === 'J') || (ranks[0] === 'J' && ranks[1] === 'A');
  }
  
  private static isAceTen(ranks: string[]): boolean {
    return (ranks[0] === 'A' && ranks[1] === 'T') || (ranks[0] === 'T' && ranks[1] === 'A');
  }
  
  private static isKingQueen(ranks: string[]): boolean {
    return (ranks[0] === 'K' && ranks[1] === 'Q') || (ranks[0] === 'Q' && ranks[1] === 'K');
  }
  
  private static isKingJack(ranks: string[]): boolean {
    return (ranks[0] === 'K' && ranks[1] === 'J') || (ranks[0] === 'J' && ranks[1] === 'K');
  }
  
  private static hasAce(ranks: string[]): boolean {
    return ranks.includes('A');
  }
  
  private static isSuitedConnector(cards: Card[]): boolean {
    if (cards[0].suit !== cards[1].suit) return false;
    const rankValues = cards.map(c => this.getRankValue(c.rank));
    return Math.abs(rankValues[0] - rankValues[1]) === 1;
  }
  
  private static isSuitedGapper(cards: Card[]): boolean {
    if (cards[0].suit !== cards[1].suit) return false;
    const rankValues = cards.map(c => this.getRankValue(c.rank));
    const gap = Math.abs(rankValues[0] - rankValues[1]);
    return gap === 2 || gap === 3;
  }
  
  private static getRankValue(rank: string): number {
    const values: { [key: string]: number } = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
      '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return values[rank] || 0;
  }
  
  private static getPositionCategory(position: string): PositionCategory {
    if (['UTG', 'UTG+1'].includes(position)) return 'Early Position';
    if (['MP1', 'MP2'].includes(position)) return 'Middle Position';
    if (['CO', 'BTN'].includes(position)) return 'Late Position';
    return 'Blinds';
  }
  
  private static getStackCategory(stackSize: number): string {
    if (stackSize < 30) return 'SHORT';
    if (stackSize < 80) return 'MEDIUM';
    return 'DEEP';
  }
}
