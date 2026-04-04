import React from 'react';
import type { Die, Augment, MapNode, Enemy, GameState } from '../types/game';

interface SkillModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  augment: Augment;
  cost: { type: 'maxHp' | 'reroll' | 'plays' | 'hp' | 'addNormalDice'; value: number; label: string };
}

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
  skillModuleOptions: SkillModule[];
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
  handleSelectSkillModule: (module: SkillModule) => void;
  handleSkipSkillModule: () => void;
}

export const GameContext = React.createContext<GameContextType>(null!);

export const useGameContext = () => {
  const ctx = React.useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameContext.Provider');
  return ctx;
};

export type { SkillModule, Toast };
