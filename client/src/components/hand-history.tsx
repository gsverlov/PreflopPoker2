import { useQuery, useMutation } from "@tanstack/react-query";
import { HandHistory, HandAnalysis } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HandHistoryProps {
  currentAnalysis: HandAnalysis | null;
  userId?: number;
}

export function HandHistoryComponent({ currentAnalysis, userId }: HandHistoryProps) {
  const { toast } = useToast();

  // Get hand history
  const { data: handHistory, isLoading } = useQuery<HandHistory[]>({
    queryKey: ['/api/hand-history', userId],
    enabled: true
  });

  // Save hand history mutation
  const saveHandMutation = useMutation({
    mutationFn: async (data: { analysis: HandAnalysis; actualAction?: string; result?: string }) => {
      const handHistoryData = {
        userId: userId || null,
        cards: data.analysis.cards,
        gameContext: data.analysis.context,
        handAnalysis: data.analysis,
        actualAction: data.actualAction,
        result: data.result
      };
      
      const response = await apiRequest('POST', '/api/hand-history', handHistoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hand-history'] });
      toast({
        title: "Hand saved",
        description: "Hand analysis has been saved to your history"
      });
    },
    onError: () => {
      toast({
        title: "Failed to save hand",
        description: "Could not save hand to history",
        variant: "destructive"
      });
    }
  });

  const saveCurrentHand = () => {
    if (!currentAnalysis) return;
    saveHandMutation.mutate({ analysis: currentAnalysis });
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'RAISE': 'text-green-400',
      'CALL': 'text-yellow-400',
      'FOLD': 'text-red-400',
      'ALL_IN': 'text-orange-400',
      'CHECK': 'text-gray-400'
    };
    return colors[action] || 'text-gray-400';
  };

  const getHandStrengthColor = (strength: string) => {
    const colors: { [key: string]: string } = {
      'PREMIUM': 'text-green-400 bg-green-900/20',
      'STRONG': 'text-blue-400 bg-blue-900/20',
      'GOOD': 'text-yellow-400 bg-yellow-900/20',
      'MARGINAL': 'text-orange-400 bg-orange-900/20',
      'WEAK': 'text-red-400 bg-red-900/20',
      'TRASH': 'text-gray-400 bg-gray-900/20'
    };
    return colors[strength] || 'text-gray-400 bg-gray-900/20';
  };

  const formatCards = (cards: any[]) => {
    return cards.map(card => `${card.rank}${card.suit}`).join(' ');
  };

  return (
    <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Hand History</h2>
        {currentAnalysis && (
          <Button
            onClick={saveCurrentHand}
            disabled={saveHandMutation.isPending}
            className="bg-poker-green hover:bg-green-600"
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Hand
          </Button>
        )}
      </div>

      {/* Current Analysis Summary */}
      {currentAnalysis && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Current Analysis</span>
            <span className={cn("text-xs px-2 py-1 rounded", getHandStrengthColor(currentAnalysis.handStrength))}>
              {currentAnalysis.handStrength}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">
              {formatCards(currentAnalysis.cards)} • {currentAnalysis.context.position}
            </span>
            <span className={getActionColor(currentAnalysis.recommendation.primaryAction)}>
              {currentAnalysis.recommendation.primaryAction}
            </span>
          </div>
        </div>
      )}

      {/* Hand History List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-4">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : handHistory && handHistory.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {handHistory.map((hand, index) => {
            const analysis = hand.handAnalysis as HandAnalysis;
            const cards = hand.cards as any[];
            const context = hand.gameContext as any;
            
            return (
              <div key={hand.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-white">
                      {formatCards(cards)}
                    </span>
                    <span className="text-sm text-gray-400">
                      {context.position}
                    </span>
                    <span className={cn("text-xs px-2 py-1 rounded", getHandStrengthColor(analysis.handStrength))}>
                      {analysis.handStrength}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {new Date(hand.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400">
                      Recommended: <span className={getActionColor(analysis.recommendation.primaryAction)}>
                        {analysis.recommendation.primaryAction}
                      </span>
                    </span>
                    {hand.actualAction && (
                      <span className="text-gray-400">
                        Played: <span className={getActionColor(hand.actualAction)}>
                          {hand.actualAction}
                        </span>
                      </span>
                    )}
                  </div>
                  
                  {hand.result && (
                    <span className={cn("text-xs px-2 py-1 rounded", 
                      hand.result === 'WIN' ? 'text-green-400 bg-green-900/20' :
                      hand.result === 'LOSE' ? 'text-red-400 bg-red-900/20' :
                      'text-gray-400 bg-gray-900/20'
                    )}>
                      {hand.result}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Win Rate: {analysis.winRate}% • Confidence: {analysis.recommendation.confidence}%
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No hand history yet</p>
          <p className="text-sm">Start analyzing hands to build your history</p>
        </div>
      )}

      {/* Stats Summary */}
      {handHistory && handHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">{handHistory.length}</div>
              <div className="text-xs text-gray-400">Total Hands</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">
                {handHistory.filter(h => h.result === 'WIN').length}
              </div>
              <div className="text-xs text-gray-400">Wins</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">
                {handHistory.filter(h => h.result === 'LOSE').length}
              </div>
              <div className="text-xs text-gray-400">Losses</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {handHistory.filter(h => h.result === 'FOLD').length}
              </div>
              <div className="text-xs text-gray-400">Folds</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}