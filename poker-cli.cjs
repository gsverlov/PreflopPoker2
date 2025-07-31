// Minimal Poker Strategy Advisor CLI
// Usage: node poker-cli.cjs

const readline = require('readline');

class PokerAdvisor {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Hand strength evaluation
  evaluateHand(card1, card2) {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    
    const rank1 = card1.rank;
    const rank2 = card2.rank;
    const suit1 = card1.suit;
    const suit2 = card2.suit;
    
    const val1 = rankValues[rank1];
    const val2 = rankValues[rank2];
    const suited = suit1 === suit2;
    const pocket = rank1 === rank2;
    
    // Premium hands
    if (pocket && val1 >= 10) return { strength: 'PREMIUM', winRate: 85 };
    if ((rank1 === 'A' && rank2 === 'K') || (rank1 === 'K' && rank2 === 'A')) return { strength: 'PREMIUM', winRate: suited ? 82 : 78 };
    if ((rank1 === 'A' && rank2 === 'Q') || (rank1 === 'Q' && rank2 === 'A')) return { strength: 'STRONG', winRate: suited ? 76 : 72 };
    
    // Strong hands
    if (pocket && val1 >= 7) return { strength: 'STRONG', winRate: 75 };
    if ((val1 === 14 && val2 >= 10) || (val2 === 14 && val1 >= 10)) return { strength: 'STRONG', winRate: suited ? 72 : 68 };
    
    // Good hands
    if (pocket && val1 >= 5) return { strength: 'GOOD', winRate: 65 };
    if (suited && Math.abs(val1 - val2) <= 1 && Math.max(val1, val2) >= 9) return { strength: 'GOOD', winRate: 62 };
    if ((val1 >= 10 && val2 >= 10)) return { strength: 'GOOD', winRate: suited ? 65 : 60 };
    
    // Marginal hands
    if (suited && Math.abs(val1 - val2) <= 2 && Math.max(val1, val2) >= 8) return { strength: 'MARGINAL', winRate: 55 };
    if (Math.max(val1, val2) >= 11) return { strength: 'MARGINAL', winRate: suited ? 58 : 52 };
    
    // Weak hands
    if (suited && Math.abs(val1 - val2) <= 3) return { strength: 'WEAK', winRate: 48 };
    if (Math.max(val1, val2) >= 9) return { strength: 'WEAK', winRate: 45 };
    
    return { strength: 'TRASH', winRate: 35 };
  }

  // Position-based adjustments
  getPositionMultiplier(position) {
    const multipliers = {
      'UTG': 0.7,    // Early position - tight
      'UTG+1': 0.75,
      'MP': 0.8,     // Middle position
      'MP+1': 0.85,
      'CO': 0.95,    // Cutoff - late position
      'BTN': 1.1,    // Button - best position
      'SB': 0.8,     // Small blind
      'BB': 0.9      // Big blind
    };
    return multipliers[position] || 0.8;
  }

  // Analyze opponent actions
  analyzeOpponentActions(actions) {
    let aggression = 0;
    let callers = 0;
    let raisers = 0;
    let totalBet = 0;

    actions.forEach(action => {
      if (action.includes('CALL')) callers++;
      if (action.includes('RAISE')) {
        raisers++;
        aggression += 2;
        const amount = action.match(/\d+/);
        if (amount) totalBet += parseInt(amount[0]);
      }
      if (action.includes('FOLD')) aggression -= 0.5;
    });

    return { aggression, callers, raisers, totalBet };
  }

  // Main decision logic
  makeDecision(hand, position, stackBB, playerCount, opponentActions) {
    const handEval = this.evaluateHand(hand.card1, hand.card2);
    const posMultiplier = this.getPositionMultiplier(position);
    const actionAnalysis = this.analyzeOpponentActions(opponentActions);
    
    const adjustedWinRate = handEval.winRate * posMultiplier;
    const potOdds = this.calculatePotOdds(actionAnalysis.totalBet, stackBB);
    
    // Decision matrix
    let decision = 'FOLD';
    let amount = 0;
    let confidence = 50;

    // Premium hands - almost always play
    if (handEval.strength === 'PREMIUM') {
      if (actionAnalysis.raisers === 0) {
        decision = 'RAISE';
        amount = Math.min(stackBB, 3 + actionAnalysis.callers);
        confidence = 90;
      } else if (actionAnalysis.aggression < 4) {
        decision = 'CALL';
        confidence = 85;
      } else {
        decision = 'RAISE';
        amount = Math.min(stackBB, actionAnalysis.totalBet * 1.5);
        confidence = 80;
      }
    }
    
    // Strong hands
    else if (handEval.strength === 'STRONG') {
      if (actionAnalysis.raisers === 0) {
        decision = 'RAISE';
        amount = Math.min(stackBB, 2.5 + actionAnalysis.callers * 0.5);
        confidence = 80;
      } else if (actionAnalysis.aggression < 3) {
        decision = 'CALL';
        confidence = 75;
      } else if (stackBB > 40) {
        decision = 'FOLD';
        confidence = 70;
      }
    }
    
    // Good hands
    else if (handEval.strength === 'GOOD') {
      if (actionAnalysis.raisers === 0 && position === 'BTN') {
        decision = 'RAISE';
        amount = Math.min(stackBB, 2.5);
        confidence = 70;
      } else if (actionAnalysis.aggression < 2) {
        decision = 'CALL';
        confidence = 65;
      }
    }
    
    // Marginal hands - position dependent
    else if (handEval.strength === 'MARGINAL') {
      if (actionAnalysis.raisers === 0 && ['BTN', 'CO'].includes(position)) {
        decision = 'RAISE';
        amount = Math.min(stackBB, 2.5);
        confidence = 60;
      } else if (actionAnalysis.aggression === 0 && potOdds > 3) {
        decision = 'CALL';
        confidence = 55;
      }
    }

    return {
      decision,
      amount,
      confidence,
      reasoning: this.getReasoningText(handEval, actionAnalysis, position, adjustedWinRate)
    };
  }

  calculatePotOdds(totalBet, stackBB) {
    if (totalBet === 0) return 1;
    return stackBB / totalBet;
  }

  getReasoningText(handEval, actionAnalysis, position, winRate) {
    let reasoning = `Hand strength: ${handEval.strength} (${winRate.toFixed(1)}% win rate)\\n`;
    reasoning += `Position: ${position}\\n`;
    reasoning += `Opponents: ${actionAnalysis.callers} callers, ${actionAnalysis.raisers} raisers\\n`;
    reasoning += `Aggression level: ${actionAnalysis.aggression}`;
    return reasoning;
  }

  // Input parsing
  parseCard(input) {
    const rank = input.charAt(0).toUpperCase();
    const suit = input.charAt(1).toUpperCase();
    if (!'23456789TJQKA'.includes(rank) || !'HDCS'.includes(suit)) {
      throw new Error('Invalid card format. Use format like: AH, KS, TC');
    }
    return { rank, suit };
  }

  async getUserInput() {
    try {
      console.log('\\n=== POKER STRATEGY ADVISOR ===\\n');
      
      const card1Input = await this.question('Enter first card (e.g., AH): ');
      const card2Input = await this.question('Enter second card (e.g., KS): ');
      const position = await this.question('Enter position (UTG/UTG+1/MP/MP+1/CO/BTN/SB/BB): ');
      const stackBB = parseInt(await this.question('Enter stack size in big blinds: '));
      const playerCount = parseInt(await this.question('Enter total players in hand: '));
      const actionsInput = await this.question('Enter opponent actions (e.g., FOLD,CALL,RAISE-5): ');
      
      const card1 = this.parseCard(card1Input);
      const card2 = this.parseCard(card2Input);
      const opponentActions = actionsInput.split(',').map(a => a.trim()).filter(a => a);
      
      const result = this.makeDecision(
        { card1, card2 },
        position.toUpperCase(),
        stackBB,
        playerCount,
        opponentActions
      );
      
      console.log('\\n=== RECOMMENDATION ===');
      console.log(`Action: ${result.decision}${result.amount > 0 ? ` ${result.amount}BB` : ''}`);
      console.log(`Confidence: ${result.confidence}%`);
      console.log(`\\nReasoning:\\n${result.reasoning}`);
      
      const again = await this.question('\\nAnalyze another hand? (y/n): ');
      if (again.toLowerCase() === 'y') {
        this.getUserInput();
      } else {
        this.rl.close();
      }
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
      this.getUserInput();
    }
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  start() {
    this.getUserInput();
  }
}

// Start the advisor
const advisor = new PokerAdvisor();
advisor.start();