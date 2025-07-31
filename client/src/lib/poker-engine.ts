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
  
  // Enhanced decision making with detailed player actions
  static getRecommendation(cards: Card[], context: GameContext): HandAnalysis['recommendation'] {
    const handEval = this.evaluateHandStrength(cards);
    const position = this.getPositionCategory(context.position);
    const stackCategory = this.getStackCategory(context.stackSize);
    const actionSummary = this.analyzePlayerActions(context);
    
    let primaryAction: Action = 'FOLD';
    let actionSize = '';
    let confidence = 50;
    let reasoning: string[] = [];
    let alternatives = [
      { action: 'FOLD' as Action, percentage: 0 },
      { action: 'CALL' as Action, percentage: 0 },
      { action: 'RAISE' as Action, percentage: 0 }
    ];
    
    // Calculate required amount to call
    const amountToCall = actionSummary.maxBet - actionSummary.currentBet;
    const potOdds = amountToCall / (context.potSize + amountToCall);
    const activePlayers = actionSummary.playersRemaining;
    
    // Decision tree based on hand strength, position, and action
    if (handEval.strength === 'PREMIUM') {
      if (actionSummary.raisersCount >= 2) {
        primaryAction = actionSummary.maxBet > context.stackSize * 0.3 ? 'ALL_IN' : 'RAISE';
        actionSize = primaryAction === 'RAISE' ? `${Math.min(actionSummary.maxBet * 2.5, context.stackSize)}BB` : '';
        confidence = 95;
        reasoning = [
          `Premium hand (${cards[0].rank}${cards[1].rank}) - excellent in multiway pot`,
          `Multiple raisers indicate strong opposition but hand can handle`,
          `${activePlayers} players active - value betting essential`
        ];
      } else if (actionSummary.raisersCount === 1) {
        primaryAction = 'RAISE';
        actionSize = `${Math.min(actionSummary.maxBet * 3, context.stackSize)}BB`;
        confidence = 90;
        reasoning = [
          `Premium hand against single raiser`,
          `Re-raise for value and protection`,
          `Stack depth (${context.stackSize}BB) allows aggression`
        ];
      } else {
        primaryAction = 'RAISE';
        actionSize = `${Math.min(context.bigBlind * 3, context.stackSize)}BB`;
        confidence = 90;
        reasoning = [
          `Premium hand - standard value raise`,
          `${position} provides good control`,
          `Build pot with strongest holdings`
        ];
      }
      alternatives = [
        { action: primaryAction, percentage: 90 },
        { action: 'CALL', percentage: 8 },
        { action: 'FOLD', percentage: 2 }
      ];
    } else if (handEval.strength === 'STRONG') {
      if (actionSummary.raisersCount >= 2) {
        primaryAction = position === 'Late Position' ? 'CALL' : 'FOLD';
        confidence = position === 'Late Position' ? 70 : 60;
        reasoning = [
          `Strong hand but multiple raisers ahead`,
          `${position} ${position === 'Late Position' ? 'allows call' : 'makes call difficult'}`,
          `Pot odds: ${(potOdds * 100).toFixed(1)}% - ${potOdds < 0.25 ? 'favorable' : 'marginal'}`
        ];
      } else if (actionSummary.raisersCount === 1) {
        primaryAction = position === 'Early Position' ? 'CALL' : 'RAISE';
        actionSize = primaryAction === 'RAISE' ? `${Math.min(actionSummary.maxBet * 2.5, context.stackSize)}BB` : '';
        confidence = 75;
        reasoning = [
          `Strong hand against single raiser`,
          `${position} ${position === 'Early Position' ? 'suggests caution' : 'allows aggression'}`,
          `Good playability post-flop`
        ];
      } else {
        primaryAction = 'RAISE';
        actionSize = `${Math.min(context.bigBlind * 2.5, context.stackSize)}BB`;
        confidence = 80;
        reasoning = [
          `Strong hand with no action`,
          `${position} provides good control`,
          `Value raise opportunity`
        ];
      }
      alternatives = [
        { action: primaryAction, percentage: 75 },
        { action: primaryAction === 'RAISE' ? 'CALL' : 'RAISE', percentage: 20 },
        { action: 'FOLD', percentage: 5 }
      ];
    } else if (handEval.strength === 'GOOD') {
      if (actionSummary.raisersCount >= 1) {
        if (potOdds < 0.2 && position === 'Late Position') {
          primaryAction = 'CALL';
          confidence = 65;
          reasoning = [
            `Good hand with excellent pot odds (${(potOdds * 100).toFixed(1)}%)`,
            `Late position provides post-flop advantage`,
            `${activePlayers} players - speculative value`
          ];
        } else {
          primaryAction = 'FOLD';
          confidence = 70;
          reasoning = [
            `Good hand but facing aggression`,
            `Poor pot odds (${(potOdds * 100).toFixed(1)}%) for speculative call`,
            `${position} doesn't compensate for poor odds`
          ];
        }
      } else {
        primaryAction = position === 'Early Position' ? 'CALL' : 'RAISE';
        actionSize = primaryAction === 'RAISE' ? `${Math.min(context.bigBlind * 2.5, context.stackSize)}BB` : '';
        confidence = position === 'Late Position' ? 75 : 60;
        reasoning = [
          `Good hand with no action`,
          `${position} ${position === 'Late Position' ? 'excellent for steal' : 'requires caution'}`,
          `Decent playability post-flop`
        ];
      }
      alternatives = [
        { action: primaryAction, percentage: 65 },
        { action: primaryAction === 'FOLD' ? 'CALL' : 'FOLD', percentage: 25 },
        { action: 'RAISE', percentage: 10 }
      ];
    } else {
      if (actionSummary.raisersCount === 0 && position === 'Late Position' && activePlayers <= 3) {
        primaryAction = 'RAISE';
        actionSize = `${Math.min(context.bigBlind * 2.2, context.stackSize)}BB`;
        confidence = 60;
        reasoning = [
          `Weak hand but excellent steal spot`,
          `Late position vs ${activePlayers} players`,
          `Fold equity likely high`
        ];
        alternatives = [
          { action: 'RAISE', percentage: 60 },
          { action: 'FOLD', percentage: 40 },
          { action: 'CALL', percentage: 0 }
        ];
      } else {
        primaryAction = 'FOLD';
        confidence = 85;
        reasoning = [
          handEval.strength === 'MARGINAL' ? 'Marginal hand strength' : 'Weak hand - not profitable',
          actionSummary.raisersCount > 0 ? `Facing ${actionSummary.raisersCount} raiser(s)` : 'Poor risk/reward even unopened',
          `${position} with ${activePlayers} players - insufficient value`
        ];
        alternatives = [
          { action: 'FOLD', percentage: 85 },
          { action: 'CALL', percentage: 15 },
          { action: 'RAISE', percentage: 0 }
        ];
      }
    }
    
    return {
      primaryAction,
      actionSize,
      confidence,
      reasoning,
      alternatives
    };
  }

  // Analyze player actions to get betting summary
  static analyzePlayerActions(context: GameContext) {
    const actions = context.playerActions;
    let maxBet = context.bigBlind; // Big blind is minimum bet
    let raisersCount = 0;
    let playersRemaining = context.totalPlayers;
    let currentBet = 0; // What we've invested so far
    let potContribution = 0;

    // Process each action
    actions.forEach(action => {
      if (action.action === 'FOLD') {
        playersRemaining--;
      } else if (action.action === 'RAISE') {
        raisersCount++;
        maxBet = Math.max(maxBet, action.amount);
      } else if (action.action === 'ALL_IN') {
        raisersCount++;
        maxBet = Math.max(maxBet, action.amount);
      } else if (action.action === 'CALL') {
        // Calling matches the current max bet
      }
      potContribution += action.amount;
    });

    return {
      maxBet,
      raisersCount,
      playersRemaining,
      currentBet,
      potContribution,
      hasAction: actions.length > 0,
      lastAction: actions.length > 0 ? actions[actions.length - 1] : null
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
