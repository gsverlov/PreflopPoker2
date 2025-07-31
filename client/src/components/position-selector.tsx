import { Position, positions, PositionCategory } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PositionSelectorProps {
  selectedPosition: Position;
  onPositionSelect: (position: Position) => void;
  stackSize: number;
  onStackSizeChange: (size: number) => void;
}

export function PositionSelector({ 
  selectedPosition, 
  onPositionSelect, 
  stackSize, 
  onStackSizeChange 
}: PositionSelectorProps) {
  
  const getPositionCategory = (position: Position): PositionCategory => {
    if (['UTG', 'UTG+1'].includes(position)) return 'Early Position';
    if (['MP1', 'MP2'].includes(position)) return 'Middle Position';
    if (['CO', 'BTN'].includes(position)) return 'Late Position';
    return 'Blinds';
  };
  
  const getPositionDescription = (position: Position): string => {
    const category = getPositionCategory(position);
    const descriptions = {
      'Early Position': 'Play tight, premium hands only',
      'Middle Position': 'Slightly wider range than early',
      'Late Position': 'Widest range, positional advantage',
      'Blinds': 'Defend based on pot odds'
    };
    return descriptions[category];
  };
  
  const getStackCategory = (size: number) => {
    if (size < 30) return { category: 'Short Stack', advice: 'Push/fold strategy, limited post-flop play' };
    if (size < 80) return { category: 'Medium Stack', advice: 'Standard play, some flexibility for speculative hands' };
    return { category: 'Deep Stack', advice: 'Maximum flexibility, implied odds important' };
  };
  
  const positionGroups = [
    { category: 'Early Position', positions: ['UTG', 'UTG+1'] },
    { category: 'Middle Position', positions: ['MP1', 'MP2'] },
    { category: 'Late Position', positions: ['CO', 'BTN'] },
    { category: 'Blinds', positions: ['SB', 'BB'] }
  ];

  return (
    <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">Game Context</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium mb-3 text-white">Table Position</label>
          <div className="space-y-2">
            {positionGroups.map((group) => (
              <div key={group.category} className="space-y-1">
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  {group.category}
                </div>
                {group.positions.map((position) => (
                  <button
                    key={position}
                    onClick={() => onPositionSelect(position as Position)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors",
                      selectedPosition === position
                        ? "bg-poker-green text-white"
                        : "bg-gray-700 hover:bg-poker-green text-white"
                    )}
                  >
                    <div className="font-medium">{position}</div>
                    <div className="text-xs opacity-75">
                      {getPositionDescription(position as Position)}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stack Size */}
        <div>
          <label className="block text-sm font-medium mb-3 text-white">Stack Size</label>
          <div className="space-y-3">
            <div>
              <input
                type="range"
                min="10"
                max="200"
                value={stackSize}
                onChange={(e) => onStackSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10 BB</span>
                <span className="text-white font-medium">{stackSize} BB</span>
                <span>200 BB</span>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm font-medium text-white">
                {getStackCategory(stackSize).category}
              </div>
              <div className="text-xs text-gray-400">
                {getStackCategory(stackSize).advice}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
