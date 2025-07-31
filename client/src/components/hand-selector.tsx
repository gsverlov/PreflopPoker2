import { useState } from "react";
import { Card, CardRank, CardSuit, cardRanks, cardSuits } from "@shared/schema";
import { cn } from "@/lib/utils";

interface HandSelectorProps {
  selectedCards: (Card | null)[];
  onCardSelect: (card: Card, index: number) => void;
  onClear: () => void;
}

export function HandSelector({ selectedCards, onCardSelect, onClear }: HandSelectorProps) {
  const [selectingCard, setSelectingCard] = useState<number>(0);
  const [selectedRanks, setSelectedRanks] = useState<(CardRank | null)[]>([null, null]);
  
  const handleRankSelect = (rank: CardRank, cardIndex: number) => {
    const newRanks = [...selectedRanks];
    newRanks[cardIndex] = rank;
    setSelectedRanks(newRanks);
    setSelectingCard(cardIndex);
  };
  
  const handleSuitSelect = (suit: CardSuit, cardIndex: number) => {
    const rank = selectedRanks[cardIndex];
    if (rank) {
      const card: Card = { rank, suit };
      onCardSelect(card, cardIndex);
    }
  };
  
  const getCardColor = (suit: CardSuit) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-gray-900';
  };

  return (
    <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Your Pocket Cards</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClear}
            className="text-sm text-poker-green hover:text-green-400 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Selected Cards Display */}
      <div className="flex justify-center space-x-4 mb-6">
        {[0, 1].map((index) => (
          <div
            key={index}
            className={cn(
              "poker-card w-20 h-28 flex flex-col items-center justify-center text-lg font-bold cursor-pointer",
              selectedCards[index] ? "selected" : "bg-gray-700 border-gray-600"
            )}
            onClick={() => setSelectingCard(index)}
          >
            {selectedCards[index] ? (
              <>
                <span className={cn("text-2xl", getCardColor(selectedCards[index]!.suit))}>
                  {selectedCards[index]!.rank}
                </span>
                <span className={cn("text-lg", getCardColor(selectedCards[index]!.suit))}>
                  {selectedCards[index]!.suit}
                </span>
              </>
            ) : (
              <span className="text-gray-500 text-sm">Card {index + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Card Selector */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((cardIndex) => (
          <div key={cardIndex}>
            <label className="block text-sm font-medium mb-2 text-white">
              {cardIndex === 0 ? 'First Card' : 'Second Card'}
            </label>
            
            {/* Rank Selection */}
            <div className="grid grid-cols-4 gap-1 mb-2">
              {cardRanks.map((rank) => (
                <button
                  key={rank}
                  onClick={() => handleRankSelect(rank, cardIndex)}
                  className={cn(
                    "p-2 text-sm rounded transition-colors",
                    selectedRanks[cardIndex] === rank
                      ? "bg-poker-green text-white"
                      : "bg-gray-700 hover:bg-poker-green text-white"
                  )}
                >
                  {rank}
                </button>
              ))}
            </div>
            
            {/* Suit Selection */}
            <div className="flex space-x-1">
              {cardSuits.map((suit) => (
                <button
                  key={suit}
                  onClick={() => handleSuitSelect(suit, cardIndex)}
                  disabled={!selectedRanks[cardIndex]}
                  className={cn(
                    "flex-1 p-2 text-xs rounded transition-colors",
                    suit === '♥' || suit === '♦'
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-gray-600 hover:bg-gray-500 text-white",
                    !selectedRanks[cardIndex] && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {suit}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
