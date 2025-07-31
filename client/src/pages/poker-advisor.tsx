import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, GameContext, HandAnalysis, PositionStats, Position } from "@shared/schema";
import { PokerEngine } from "@/lib/poker-engine";
import { HandSelector } from "@/components/hand-selector";
import { PositionSelector } from "@/components/position-selector";
import { ActionContext } from "@/components/action-context";
import { RecommendationPanel } from "@/components/recommendation-panel";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Spade } from "lucide-react";

export default function PokerAdvisor() {
  const [selectedCards, setSelectedCards] = useState<(Card | null)[]>([null, null]);
  const [position, setPosition] = useState<Position>('BTN');
  const [stackSize, setStackSize] = useState<number>(75);
  const [previousAction, setPreviousAction] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  
  // Get position category for stats query
  const getPositionCategory = (pos: Position) => {
    if (['UTG', 'UTG+1'].includes(pos)) return 'Early Position';
    if (['MP1', 'MP2'].includes(pos)) return 'Middle Position';
    if (['CO', 'BTN'].includes(pos)) return 'Late Position';
    return 'Blinds';
  };

  // Query position stats
  const { data: positionStats } = useQuery<PositionStats>({
    queryKey: ['/api/position-stats', getPositionCategory(position)],
    enabled: true
  });

  // Analyze hand mutation
  const analyzeMutation = useMutation({
    mutationFn: async (data: { cards: Card[]; context: GameContext }) => {
      const response = await apiRequest('POST', '/api/analyze-hand', data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
    }
  });

  // Real-time analysis using frontend poker engine
  useEffect(() => {
    if (selectedCards[0] && selectedCards[1]) {
      const cards = selectedCards as Card[];
      const context: GameContext = {
        position,
        stackSize,
        previousAction: previousAction as any,
        potSize: 1.5,
        playersInHand: 6
      };

      try {
        const handEval = PokerEngine.evaluateHandStrength(cards);
        const recommendation = PokerEngine.getRecommendation(cards, context);
        
        const newAnalysis: HandAnalysis = {
          cards,
          context,
          handStrength: handEval.strength,
          winRate: handEval.winRate,
          playabilityScore: handEval.playabilityScore,
          recommendation
        };
        
        setAnalysis(newAnalysis);
      } catch (error) {
        console.error('Analysis error:', error);
        setAnalysis(null);
      }
    } else {
      setAnalysis(null);
    }
  }, [selectedCards, position, stackSize, previousAction]);

  const handleCardSelect = (card: Card, index: number) => {
    const newCards = [...selectedCards];
    newCards[index] = card;
    setSelectedCards(newCards);
  };

  const handleClearHand = () => {
    setSelectedCards([null, null]);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="bg-surface-dark border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Spade className="text-poker-green text-2xl h-8 w-8" />
              <h1 className="text-2xl font-bold text-white">Poker Decision Advisor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Texas Hold'em Strategy Tool</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            <HandSelector
              selectedCards={selectedCards}
              onCardSelect={handleCardSelect}
              onClear={handleClearHand}
            />
            
            <PositionSelector
              selectedPosition={position}
              onPositionSelect={setPosition}
              stackSize={stackSize}
              onStackSizeChange={setStackSize}
            />
            
            <ActionContext
              previousAction={previousAction}
              onActionSelect={setPreviousAction}
            />
          </div>
          
          {/* Recommendation Panel */}
          <div className="space-y-6">
            <RecommendationPanel
              analysis={analysis}
              positionStats={positionStats}
              isLoading={analyzeMutation.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
