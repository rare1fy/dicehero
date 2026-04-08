import React from 'react';
import type { Die, Augment, MapNode, Enemy, GameState, Relic } from '../types/game';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'damage' | 'heal' | 'gold' | 'buff';
}

export interface GameContextType {
  // State
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  enemy: Enemy | null;
  setEnemy: React.Dispatch<React.SetStateAction<Enemy | null>>;
  dice: Die[];
  setDice: React.Dispatch<React.SetStateAction<Die[]>>;
  showTutorial: boolean;
  setShowTutorial: React.Dispatch<React.SetStateAction<boolean>>;
  showHandGuide: boolean;
  setShowHandGuide: React.Dispatch<React.SetStateAction<boolean>>;
  showDiceGuide: boolean;
  setShowDiceGuide: React.Dispatch<React.SetStateAction<boolean>>;
  rerollFlash: boolean;
  pendingLootAugment: { id: string; options: Augment[] } | null;
  setPendingLootAugment: React.Dispatch<React.SetStateAction<{ id: string; options: Augment[] } | null>>;
  startingRelicChoices: Relic[];
  pendingBattleNode: MapNode | null;
  
  // Actions
  startNode: (node: MapNode) => void;
  startBattle: (node: MapNode) => void;
  collectLoot: (id: string) => void;
  finishLoot: () => void;
  selectLootAugment: (aug: Augment) => void;
  replaceAugment: (newAug: Augment, replaceIdx: number) => void;
  pickReward: (aug: Augment) => void;
  nextNode: () => void;
  addToast: (message: string, type?: 'info' | 'damage' | 'heal' | 'gold' | 'buff') => void;
  addLog: (msg: string) => void;
  handleSelectStartingRelic: (relic: Relic) => void;
  handleSkipStartingRelic: () => void;
  resetGame: () => void;
}

export const GameContext = React.createContext<GameContextType>(null!);

export const useGameContext = () => {
  const ctx = React.useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameContext.Provider');
  return ctx;
};

export type { Toast };
