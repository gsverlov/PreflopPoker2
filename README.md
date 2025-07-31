# Minimal Poker Strategy Advisor

Two simple command-line versions of the poker strategy advisor for easy use in Visual Studio or any text editor.

## Files

1. **poker_advisor.py** - Python version (recommended)
2. **poker-cli.cjs** - JavaScript/Node.js version

## Usage

### Python Version
```bash
python3 poker_advisor.py
```

### JavaScript Version
```bash
node poker-cli.cjs
```

## Input Format

The program will prompt you for:

1. **First card**: e.g., `AH` (Ace of Hearts)
2. **Second card**: e.g., `KS` (King of Spades)
3. **Position**: `UTG`, `UTG+1`, `MP`, `MP+1`, `CO`, `BTN`, `SB`, `BB`
4. **Stack size**: Number of big blinds (e.g., `100`)
5. **Total players**: Number of players in the hand (e.g., `6`)
6. **Opponent actions**: Comma-separated actions before you (e.g., `FOLD,CALL,RAISE-5`)

## Card Format

- **Ranks**: `2, 3, 4, 5, 6, 7, 8, 9, T, J, Q, K, A`
- **Suits**: `H` (Hearts), `D` (Diamonds), `C` (Clubs), `S` (Spades)
- **Examples**: `AH`, `KS`, `TC`, `9D`

## Position Abbreviations

- **UTG**: Under the Gun (early position)
- **UTG+1**: Under the Gun + 1
- **MP**: Middle Position
- **MP+1**: Middle Position + 1
- **CO**: Cutoff (late position)
- **BTN**: Button (best position)
- **SB**: Small Blind
- **BB**: Big Blind

## Opponent Actions Format

- **FOLD**: Player folded
- **CALL**: Player called
- **RAISE-X**: Player raised to X big blinds (e.g., `RAISE-5`)

## Example Session

```
=== POKER STRATEGY ADVISOR ===

Enter first card (e.g., AH): AH
Enter second card (e.g., KS): KS
Enter position (UTG/UTG+1/MP/MP+1/CO/BTN/SB/BB): BTN
Enter stack size in big blinds: 100
Enter total players in hand: 6
Enter opponent actions (e.g., FOLD,CALL,RAISE-5): FOLD,CALL,RAISE-5

=== RECOMMENDATION ===
Action: CALL
Confidence: 85%

Reasoning:
Hand strength: PREMIUM (85.8% win rate)
Position: BTN
Opponents: 1 callers, 1 raisers
Aggression level: 2
```

## Decision Logic

The advisor considers:
- Hand strength (Premium, Strong, Good, Marginal, Weak, Trash)
- Position advantage (Button > Cutoff > Middle > Early)
- Opponent aggression and betting patterns
- Stack depth and pot odds
- Number of players in the pot

Output recommendations:
- **FOLD**: Fold your cards
- **CALL**: Call the current bet
- **RAISE X**: Raise to X big blinds