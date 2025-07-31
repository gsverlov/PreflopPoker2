import { HandAnalysis, PositionStats } from "@shared/schema";
import { cn } from "@/lib/utils";
import { TrendingUp, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RecommendationPanelProps {
  analysis: HandAnalysis | null;
  positionStats: PositionStats | null;
  isLoading: boolean;
}

export function RecommendationPanel({ analysis, positionStats, isLoading }: RecommendationPanelProps) {
  const { toast } = useToast();
  
  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'RAISE': 'text-green-400 border-green-500 bg-green-900',
      'CALL': 'text-yellow-400 border-yellow-500 bg-yellow-900',
      'FOLD': 'text-red-400 border-red-500 bg-red-900',
      'ALL_IN': 'text-orange-400 border-orange-500 bg-orange-900'
    };
    return colors[action] || 'text-gray-400 border-gray-500 bg-gray-900';
  };
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'RAISE': return '↑';
      case 'CALL': return '=';
      case 'FOLD': return '×';
      case 'ALL_IN': return '🔥';
      default: return '?';
    }
  };
  
  const getStrengthColor = (strength: string) => {
    const colors: { [key: string]: string } = {
      'PREMIUM': 'border-green-600 bg-green-900',
      'STRONG': 'border-blue-600 bg-blue-900',
      'GOOD': 'border-yellow-600 bg-yellow-900',
      'MARGINAL': 'border-orange-600 bg-orange-900',
      'WEAK': 'border-red-600 bg-red-900',
      'TRASH': 'border-gray-600 bg-gray-900'
    };
    return colors[strength] || 'border-gray-600 bg-gray-900';
  };
  
  const copyRecommendation = () => {
    if (!analysis) return;
    
    const text = `Poker Recommendation: ${analysis.recommendation.primaryAction} ${analysis.recommendation.actionSize || ''}\nReasoning: ${analysis.recommendation.reasoning.join(', ')}`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Recommendation copied successfully"
      });
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
          <div className="text-center text-gray-400 py-8">
            <Info className="mx-auto h-12 w-12 mb-4" />
            <p>Select your cards and position to get a recommendation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hand Strength Card */}
      <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Hand Analysis</h2>
        
        <div className="space-y-4">
          <div className={cn("border rounded-lg p-4", getStrengthColor(analysis.handStrength))}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Hand Strength</span>
              <span className="text-lg font-bold text-white capitalize">
                {analysis.handStrength.toLowerCase()}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${analysis.playabilityScore * 10}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Playability Score: {analysis.playabilityScore.toFixed(1)}/10
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {analysis.winRate}%
              </div>
              <div className="text-xs text-gray-400">Win Rate vs Random</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {analysis.playabilityScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400">Playability Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Card */}
      <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Recommended Action</h2>
        
        <div className={cn("border-2 rounded-lg p-4 mb-4", getActionColor(analysis.recommendation.primaryAction))}>
          <div className="text-center">
            <div className="text-4xl mb-2">
              {getActionIcon(analysis.recommendation.primaryAction)}
            </div>
            <div className="text-2xl font-bold text-white">
              {analysis.recommendation.primaryAction}
            </div>
            {analysis.recommendation.actionSize && (
              <div className="text-sm text-gray-300">
                {analysis.recommendation.actionSize}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-sm font-medium mb-2 text-white">Reasoning</div>
            <ul className="text-sm text-gray-300 space-y-1">
              {analysis.recommendation.reasoning.map((reason, index) => (
                <li key={index}>• {reason}</li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-sm font-medium mb-2 text-white">Alternative Actions</div>
            <div className="space-y-2">
              {analysis.recommendation.alternatives.map((alt, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-white">{alt.action}</span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    alt.percentage > 70 ? "bg-green-600" :
                    alt.percentage > 40 ? "bg-yellow-600" :
                    alt.percentage > 20 ? "bg-orange-600" : "bg-red-600"
                  )}>
                    {alt.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button 
          onClick={copyRecommendation}
          className="w-full mt-4 bg-poker-green hover:bg-green-600"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Recommendation
        </Button>
      </div>

      {/* Position Stats Card */}
      {positionStats && (
        <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Position Stats</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">VPIP Range</span>
              <span className="text-sm font-medium text-green-400">
                {positionStats.vpipRange}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">PFR Range</span>
              <span className="text-sm font-medium text-blue-400">
                {positionStats.pfrRange}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">3-Bet Range</span>
              <span className="text-sm font-medium text-purple-400">
                {positionStats.threeBetRange}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Fold to 3-Bet</span>
              <span className="text-sm font-medium text-orange-400">
                {positionStats.foldTo3BetRange}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Pro Tip</div>
            <div className="text-sm text-white">{positionStats.proTip}</div>
          </div>
        </div>
      )}
    </div>
  );
}
