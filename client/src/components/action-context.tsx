import { cn } from "@/lib/utils";
import { Check, X, TrendingUp, Flame } from "lucide-react";

interface ActionContextProps {
  previousAction: string | null;
  onActionSelect: (action: string) => void;
}

export function ActionContext({ previousAction, onActionSelect }: ActionContextProps) {
  const actions = [
    { id: 'FOLD', label: 'Fold', icon: X, color: 'text-red-400' },
    { id: 'CHECK', label: 'Check/Call', icon: Check, color: 'text-yellow-400' },
    { id: 'RAISE_3BB', label: 'Raise (3BB)', icon: TrendingUp, color: 'text-green-400' },
    { id: '3BET', label: '3-Bet', icon: Flame, color: 'text-orange-400' }
  ];
  
  const getActionDescription = (action: string | null) => {
    if (!action) return 'No action taken yet';
    
    const descriptions: { [key: string]: string } = {
      'FOLD': 'All players folded to you',
      'CHECK': 'Player checked/called before you',
      'RAISE_3BB': 'Player raised to 3BB',
      '3BET': 'Player made a 3-bet'
    };
    
    return descriptions[action] || 'Unknown action';
  };

  return (
    <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">Action Before You</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onActionSelect(action.id)}
              className={cn(
                "p-3 rounded-lg text-center transition-colors",
                previousAction === action.id
                  ? "bg-poker-green text-white"
                  : "bg-gray-700 hover:bg-poker-green text-white"
              )}
            >
              <Icon className={cn("mx-auto mb-2 h-5 w-5", action.color)} />
              <div className="text-sm font-medium">{action.label}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-400">Previous Action</div>
        <div className="font-medium text-white">
          {getActionDescription(previousAction)}
        </div>
      </div>
    </div>
  );
}
