#!/usr/bin/env python3
"""
Minimal Poker Strategy Advisor
Usage: python poker_advisor.py
"""

class PokerAdvisor:
    def __init__(self):
        self.rank_values = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, 
                           '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14}
        
        self.position_multipliers = {
            'UTG': 0.7, 'UTG+1': 0.75, 'MP': 0.8, 'MP+1': 0.85,
            'CO': 0.95, 'BTN': 1.1, 'SB': 0.8, 'BB': 0.9
        }

    def evaluate_hand(self, card1, card2):
        """Evaluate hand strength and return win rate"""
        rank1, suit1 = card1['rank'], card1['suit']
        rank2, suit2 = card2['rank'], card2['suit']
        
        val1 = self.rank_values[rank1]
        val2 = self.rank_values[rank2]
        suited = suit1 == suit2
        pocket = rank1 == rank2
        
        # Premium hands
        if pocket and val1 >= 10:
            return {'strength': 'PREMIUM', 'win_rate': 85}
        if {rank1, rank2} == {'A', 'K'}:
            return {'strength': 'PREMIUM', 'win_rate': 82 if suited else 78}
        if {rank1, rank2} == {'A', 'Q'}:
            return {'strength': 'STRONG', 'win_rate': 76 if suited else 72}
        
        # Strong hands
        if pocket and val1 >= 7:
            return {'strength': 'STRONG', 'win_rate': 75}
        if 14 in [val1, val2] and max(val1, val2) >= 10:
            return {'strength': 'STRONG', 'win_rate': 72 if suited else 68}
        
        # Good hands
        if pocket and val1 >= 5:
            return {'strength': 'GOOD', 'win_rate': 65}
        if suited and abs(val1 - val2) <= 1 and max(val1, val2) >= 9:
            return {'strength': 'GOOD', 'win_rate': 62}
        if val1 >= 10 and val2 >= 10:
            return {'strength': 'GOOD', 'win_rate': 65 if suited else 60}
        
        # Marginal hands
        if suited and abs(val1 - val2) <= 2 and max(val1, val2) >= 8:
            return {'strength': 'MARGINAL', 'win_rate': 55}
        if max(val1, val2) >= 11:
            return {'strength': 'MARGINAL', 'win_rate': 58 if suited else 52}
        
        # Weak hands
        if suited and abs(val1 - val2) <= 3:
            return {'strength': 'WEAK', 'win_rate': 48}
        if max(val1, val2) >= 9:
            return {'strength': 'WEAK', 'win_rate': 45}
        
        return {'strength': 'TRASH', 'win_rate': 35}

    def analyze_opponent_actions(self, actions):
        """Analyze opponent betting patterns"""
        aggression = 0
        callers = 0
        raisers = 0
        total_bet = 0
        
        for action in actions:
            action = action.upper()
            if 'CALL' in action:
                callers += 1
            elif 'RAISE' in action:
                raisers += 1
                aggression += 2
                # Extract bet amount if present
                import re
                amount_match = re.search(r'\d+', action)
                if amount_match:
                    total_bet += int(amount_match.group())
            elif 'FOLD' in action:
                aggression -= 0.5
        
        return {
            'aggression': aggression,
            'callers': callers,
            'raisers': raisers,
            'total_bet': total_bet
        }

    def make_decision(self, hand, position, stack_bb, player_count, opponent_actions):
        """Main decision-making logic"""
        hand_eval = self.evaluate_hand(hand['card1'], hand['card2'])
        pos_multiplier = self.position_multipliers.get(position, 0.8)
        action_analysis = self.analyze_opponent_actions(opponent_actions)
        
        adjusted_win_rate = hand_eval['win_rate'] * pos_multiplier
        pot_odds = stack_bb / action_analysis['total_bet'] if action_analysis['total_bet'] > 0 else 1
        
        # Decision logic
        decision = 'FOLD'
        amount = 0
        confidence = 50
        
        strength = hand_eval['strength']
        aggression = action_analysis['aggression']
        raisers = action_analysis['raisers']
        callers = action_analysis['callers']
        
        # Premium hands
        if strength == 'PREMIUM':
            if raisers == 0:
                decision = 'RAISE'
                amount = min(stack_bb, 3 + callers)
                confidence = 90
            elif aggression < 4:
                decision = 'CALL'
                confidence = 85
            else:
                decision = 'RAISE'
                amount = min(stack_bb, int(action_analysis['total_bet'] * 1.5))
                confidence = 80
        
        # Strong hands
        elif strength == 'STRONG':
            if raisers == 0:
                decision = 'RAISE'
                amount = min(stack_bb, int(2.5 + callers * 0.5))
                confidence = 80
            elif aggression < 3:
                decision = 'CALL'
                confidence = 75
            elif stack_bb > 40:
                decision = 'FOLD'
                confidence = 70
        
        # Good hands
        elif strength == 'GOOD':
            if raisers == 0 and position == 'BTN':
                decision = 'RAISE'
                amount = min(stack_bb, 3)
                confidence = 70
            elif aggression < 2:
                decision = 'CALL'
                confidence = 65
        
        # Marginal hands
        elif strength == 'MARGINAL':
            if raisers == 0 and position in ['BTN', 'CO']:
                decision = 'RAISE'
                amount = min(stack_bb, 3)
                confidence = 60
            elif aggression == 0 and pot_odds > 3:
                decision = 'CALL'
                confidence = 55
        
        reasoning = self._get_reasoning_text(hand_eval, action_analysis, position, adjusted_win_rate)
        
        return {
            'decision': decision,
            'amount': amount,
            'confidence': confidence,
            'reasoning': reasoning
        }

    def _get_reasoning_text(self, hand_eval, action_analysis, position, win_rate):
        """Generate explanation for the decision"""
        reasoning = f"Hand strength: {hand_eval['strength']} ({win_rate:.1f}% win rate)\\n"
        reasoning += f"Position: {position}\\n"
        reasoning += f"Opponents: {action_analysis['callers']} callers, {action_analysis['raisers']} raisers\\n"
        reasoning += f"Aggression level: {action_analysis['aggression']}"
        return reasoning

    def parse_card(self, card_input):
        """Parse card input like 'AH' into rank and suit"""
        if len(card_input) != 2:
            raise ValueError("Card must be 2 characters (e.g., AH, KS)")
        
        rank = card_input[0].upper()
        suit = card_input[1].upper()
        
        if rank not in '23456789TJQKA':
            raise ValueError("Invalid rank. Use 2-9, T, J, Q, K, A")
        if suit not in 'HDCS':
            raise ValueError("Invalid suit. Use H, D, C, S")
        
        return {'rank': rank, 'suit': suit}

    def get_user_input(self):
        """Get input from user and provide recommendation"""
        try:
            print("\\n=== POKER STRATEGY ADVISOR ===\\n")
            
            card1_input = input("Enter first card (e.g., AH): ").strip()
            card2_input = input("Enter second card (e.g., KS): ").strip()
            position = input("Enter position (UTG/UTG+1/MP/MP+1/CO/BTN/SB/BB): ").strip().upper()
            stack_bb = int(input("Enter stack size in big blinds: "))
            player_count = int(input("Enter total players in hand: "))
            actions_input = input("Enter opponent actions (e.g., FOLD,CALL,RAISE-5): ").strip()
            
            card1 = self.parse_card(card1_input)
            card2 = self.parse_card(card2_input)
            opponent_actions = [a.strip() for a in actions_input.split(',') if a.strip()]
            
            hand = {'card1': card1, 'card2': card2}
            result = self.make_decision(hand, position, stack_bb, player_count, opponent_actions)
            
            print("\\n=== RECOMMENDATION ===")
            action_text = result['decision']
            if result['amount'] > 0:
                action_text += f" {result['amount']}BB"
            print(f"Action: {action_text}")
            print(f"Confidence: {result['confidence']}%")
            print(f"\\nReasoning:\\n{result['reasoning']}")
            
            again = input("\\nAnalyze another hand? (y/n): ").strip().lower()
            if again == 'y':
                self.get_user_input()
                
        except ValueError as e:
            print(f"Error: {e}")
            self.get_user_input()
        except KeyboardInterrupt:
            print("\\nGoodbye!")

    def run(self):
        """Start the advisor"""
        self.get_user_input()

if __name__ == "__main__":
    advisor = PokerAdvisor()
    advisor.run()