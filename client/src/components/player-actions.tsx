import { useState } from "react";
import { PlayerAction, Position, positions, Action, actions } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";

interface PlayerActionsProps {
  totalPlayers: number;
  onTotalPlayersChange: (count: number) => void;
  playerActions: PlayerAction[];
  onPlayerActionsChange: (actions: PlayerAction[]) => void;
  yourPosition: Position;
}

export function PlayerActions({ 
  totalPlayers, 
  onTotalPlayersChange, 
  playerActions, 
  onPlayerActionsChange,
  yourPosition 
}: PlayerActionsProps) {
  const [editingAction, setEditingAction] = useState<Partial<PlayerAction> | null>(null);

  const getPositionOrder = () => {
    const allPositions = positions.slice(0, totalPlayers);
    const yourIndex = allPositions.indexOf(yourPosition);
    
    // Return positions before you in betting order
    return allPositions.slice(0, yourIndex);
  };

  const getAvailablePositions = () => {
    const usedPositions = playerActions.map(action => action.position);
    return getPositionOrder().filter(pos => !usedPositions.includes(pos));
  };

  const addPlayerAction = () => {
    if (!editingAction?.position || !editingAction?.action) return;
    
    const newAction: PlayerAction = {
      position: editingAction.position,
      action: editingAction.action,
      amount: editingAction.amount || 0,
      stackSize: editingAction.stackSize || 100
    };

    const updatedActions = [...playerActions, newAction];
    // Sort by position order
    const positionOrder = getPositionOrder();
    updatedActions.sort((a, b) => 
      positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position)
    );
    
    onPlayerActionsChange(updatedActions);
    setEditingAction(null);
  };

  const removePlayerAction = (index: number) => {
    const updatedActions = playerActions.filter((_, i) => i !== index);
    onPlayerActionsChange(updatedActions);
  };

  const getActionColor = (action: Action) => {
    const colors = {
      'FOLD': 'text-red-400 bg-red-900/20',
      'CHECK': 'text-gray-400 bg-gray-900/20',
      'CALL': 'text-yellow-400 bg-yellow-900/20',
      'RAISE': 'text-green-400 bg-green-900/20',
      'ALL_IN': 'text-orange-400 bg-orange-900/20'
    };
    return colors[action] || 'text-gray-400 bg-gray-900/20';
  };

  const calculatePotSize = () => {
    const blinds = 1.5; // SB + BB
    const actionContributions = playerActions.reduce((sum, action) => sum + action.amount, 0);
    return blinds + actionContributions;
  };

  return (
    <div className="bg-surface-dark rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Player Actions</h2>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Pot: {calculatePotSize().toFixed(1)}BB</span>
        </div>
      </div>

      {/* Total Players Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-white">Players at Table</label>
        <Select value={totalPlayers.toString()} onValueChange={(value) => onTotalPlayersChange(Number(value))}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6, 7, 8, 9].map(count => (
              <SelectItem key={count} value={count.toString()}>
                {count} Players
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Existing Actions */}
      {playerActions.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white">Actions Before You</label>
          <div className="space-y-2">
            {playerActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-white">{action.position}</span>
                  <span className={cn("text-xs px-2 py-1 rounded", getActionColor(action.action))}>
                    {action.action}
                  </span>
                  {action.amount > 0 && (
                    <span className="text-sm text-gray-300">{action.amount}BB</span>
                  )}
                  <span className="text-xs text-gray-500">Stack: {action.stackSize}BB</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlayerAction(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Action */}
      {getAvailablePositions().length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">Add Player Action</label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Position */}
            <Select 
              value={editingAction?.position || ""} 
              onValueChange={(value) => setEditingAction(prev => ({ ...prev, position: value as Position }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                {getAvailablePositions().map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action */}
            <Select 
              value={editingAction?.action || ""} 
              onValueChange={(value) => setEditingAction(prev => ({ 
                ...prev, 
                action: value as Action,
                amount: value === 'FOLD' || value === 'CHECK' ? 0 : prev?.amount || 0
              }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Amount */}
            <Input
              type="number"
              placeholder="Amount (BB)"
              value={editingAction?.amount || ""}
              onChange={(e) => setEditingAction(prev => ({ ...prev, amount: Number(e.target.value) }))}
              disabled={editingAction?.action === 'FOLD' || editingAction?.action === 'CHECK'}
              className="bg-gray-700 border-gray-600 text-white"
              min="0"
              step="0.5"
            />

            {/* Stack Size */}
            <Input
              type="number"
              placeholder="Stack (BB)"
              value={editingAction?.stackSize || ""}
              onChange={(e) => setEditingAction(prev => ({ ...prev, stackSize: Number(e.target.value) }))}
              className="bg-gray-700 border-gray-600 text-white"
              min="0"
            />
          </div>

          <Button
            onClick={addPlayerAction}
            disabled={!editingAction?.position || !editingAction?.action}
            className="w-full bg-poker-green hover:bg-green-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Action
          </Button>
        </div>
      )}

      {getAvailablePositions().length === 0 && playerActions.length < totalPlayers - 1 && (
        <div className="text-center text-gray-400 py-4">
          <p className="text-sm">All positions before you have been assigned actions</p>
        </div>
      )}

      {/* Action Summary */}
      {playerActions.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Action Summary</div>
          <div className="text-sm text-white">
            {playerActions.filter(a => a.action === 'FOLD').length} folds, 
            {playerActions.filter(a => a.action === 'RAISE' || a.action === 'ALL_IN').length} raises,
            {playerActions.filter(a => a.action === 'CALL').length} calls
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Current pot: {calculatePotSize().toFixed(1)}BB | 
            To call: {Math.max(...playerActions.map(a => a.amount), 1) - 0}BB
          </div>
        </div>
      )}
    </div>
  );
}