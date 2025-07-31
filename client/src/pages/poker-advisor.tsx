import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, GameContext, HandAnalysis, PositionStats, Position, PlayerAction } from "@shared/schema";
import { PokerEngine } from "@/lib/poker-engine";
import { HandSelector } from "@/components/hand-selector";
import { PositionSelector } from "@/components/position-selector";
import { PlayerActions } from "@/components/player-actions";
import { RecommendationPanel } from "@/components/recommendation-panel";
import { HandHistoryComponent } from "@/components/hand-history";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Spade, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PokerAdvisor() {
  const [selectedCards, setSelectedCards] = useState<(Card | null)[]>([null, null]);
  const [position, setPosition] = useState<Position>('BTN');
  const [stackSize, setStackSize] = useState<number>(75);
  const [totalPlayers, setTotalPlayers] = useState<number>(6);
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [currentUserId] = useState<number>(1); // For demo purposes - would normally come from auth
  
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
        totalPlayers,
        playerActions,
        potSize: 1.5 + playerActions.reduce((sum, action) => sum + action.amount, 0),
        bigBlind: 1,
        isHeadsUp: totalPlayers === 2
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
  }, [selectedCards, position, stackSize, totalPlayers, playerActions]);

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
        <Tabs defaultValue="analyzer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="analyzer" className="flex items-center space-x-2">
              <Spade className="h-4 w-4" />
              <span>Hand Analyzer</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Hand History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer" className="mt-6">
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
                
                <PlayerActions
                  totalPlayers={totalPlayers}
                  onTotalPlayersChange={setTotalPlayers}
                  playerActions={playerActions}
                  onPlayerActionsChange={setPlayerActions}
                  yourPosition={position}
                />
              </div>
              
              {/* Recommendation Panel */}
              <div className="space-y-6">
                <RecommendationPanel
                  analysis={analysis}
                  positionStats={positionStats || null}
                  isLoading={analyzeMutation.isPending}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <HandHistoryComponent
                  currentAnalysis={analysis}
                  userId={currentUserId}
                />
              </div>
              
              {/* Quick Analysis Summary */}
              <div className="space-y-6">
                {analysis && (
                  <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Current Analysis Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hand:</span>
                        <span className="text-white font-medium">
                          {analysis.cards.map(c => `${c.rank}${c.suit}`).join(' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Position:</span>
                        <span className="text-white">{analysis.context.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stack Size:</span>
                        <span className="text-white">{analysis.context.stackSize}BB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Win Rate:</span>
                        <span className="text-green-400">{analysis.winRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recommendation:</span>
                        <span className="text-blue-400 font-medium">
                          {analysis.recommendation.primaryAction}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-yellow-400">{analysis.recommendation.confidence}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {positionStats && (
                  <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Position Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">VPIP Range:</span>
                        <span className="text-green-400">{positionStats.vpipRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">PFR Range:</span>
                        <span className="text-blue-400">{positionStats.pfrRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">3-Bet Range:</span>
                        <span className="text-purple-400">{positionStats.threeBetRange}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Pro Tip</div>
                      <div className="text-sm text-white">{positionStats.proTip}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
