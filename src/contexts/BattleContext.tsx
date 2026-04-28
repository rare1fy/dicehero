import React from 'react';
import type { Die, Enemy, GameState, Relic, StatusEffect } from '../types/game';
import type { ExpectedOutcomeResult } from '../logic/expectedOutcomeTypes';

// === 结算演出状态 ===
export interface SettlementData {
  bestHand: string;
  selectedDice: Die[];
  diceScores: number[];
  baseValue: number;
  mult: number;
  currentBase: number;
  currentMult: number;
  triggeredEffects: {
    name: string;
    detail: string;
    icon?: string;
    type: 'damage' | 'mult' | 'status' | 'heal' | 'armor';
    rawValue?: number;
    rawMult?: number;
    relicId?: string;
  }[];
  currentEffectIdx: number;
  finalDamage: number;
  finalArmor: number;
  finalHeal: number;
  statusEffects: StatusEffect[];
  isSameElement?: boolean;
}

export type SettlementPhase = null | 'hand' | 'dice' | 'mult' | 'effects' | 'bounce' | 'damage';

export type EnemyEffectType = 'attack' | 'defend' | 'skill' | 'shake' | 'death' | 'speaking' | 'boss_entrance' | 'hit' | 'debuff' | null;

export type PlayerEffectType = 'attack' | 'defend' | 'flash' | 'death' | null;

export interface BattleContextType {
  // === 核心战斗状态 ===
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  enemies: Enemy[];
  targetEnemy: Enemy | null;
  dice: Die[];
  rerollCount: number;

  // === 战斗UI状态 ===
  enemyEffects: Record<string, EnemyEffectType>;
  playerEffect: PlayerEffectType;
  screenShake: boolean;
  hpGained: boolean;
  rerollFlash: boolean;
  floatingTexts: {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    icon?: React.ReactNode;
    target: 'player' | 'enemy';
    large?: boolean;
  }[];
  enemyQuotes: Record<string, string>;
  enemyInfoTarget: string | null;
  setEnemyInfoTarget: React.Dispatch<React.SetStateAction<string | null>>;
  selectedHandTypeInfo: { name: string; description: string } | null;
  setSelectedHandTypeInfo: React.Dispatch<React.SetStateAction<{ name: string; description: string } | null>>;

  // === 结算演出状态 ===
  settlementPhase: SettlementPhase;
  settlementData: SettlementData | null;
  showDamageOverlay: { damage: number; armor: number; heal: number } | null;
  showRelicPanel: boolean;
  setShowRelicPanel: React.Dispatch<React.SetStateAction<boolean>>;
  flashingRelicIds: string[];
  selectedRelic: Relic | null;
  setSelectedRelic: React.Dispatch<React.SetStateAction<Relic | null>>;

  // === 模态框开关 ===
  showCalcModal: boolean;
  setShowCalcModal: React.Dispatch<React.SetStateAction<boolean>>;
  showHandGuide: boolean;
  setShowHandGuide: React.Dispatch<React.SetStateAction<boolean>>;
  showDiceGuide: boolean;
  setShowDiceGuide: React.Dispatch<React.SetStateAction<boolean>>;
  showClassInfo: boolean;
  setShowClassInfo: React.Dispatch<React.SetStateAction<boolean>>;

  // === 转场/波次状态 ===
  battleTransition: 'none' | 'fadeIn' | 'hold' | 'fadeOut';
  bossEntrance: { visible: boolean; name: string; chapter: number };
  waveAnnouncement: number | null;
  setWaveAnnouncement: (n: number | null) => void;
  showWaveDetail: boolean;
  setShowWaveDetail: React.Dispatch<React.SetStateAction<boolean>>;
  showChallengeDetail: boolean;
  setShowChallengeDetail: React.Dispatch<React.SetStateAction<boolean>>;

  // === 战斗动画状态 ===
  handLeftThrow: boolean;
  shuffleAnimating: boolean;
  diceDiscardAnim: boolean;
  lastTappedDieId: number | null;
  setLastTappedDieId: React.Dispatch<React.SetStateAction<number | null>>;
  skillTriggerTexts: { id: string; name: string; icon: React.ReactNode; color: string; x: number; delay: number }[];
  targetEnemyUid: string | null;

  // === 计算属性 ===
  currentHands: { bestHand: string; allHands: string[]; activeHands: string[] };
  isNormalAttackMulti: boolean;
  handHintIds: Set<number>;
  expectedOutcome: ExpectedOutcomeResult | null; // 从 expectedOutcomeCalc 导入
  isAoeActive: boolean;
  canReroll: boolean;
  canAffordReroll: boolean;
  freeRerollsRemaining: number;
  currentRerollCost: number;

  // === 战斗动作 ===
  rollAllDice: (forceResetHand?: boolean) => Promise<void>;
  rerollSelected: () => Promise<void>;
  toggleSelect: (id: number) => void;
  playHand: () => Promise<void>;
  endTurn: () => Promise<void>;
  addToast: (message: string, type?: 'info' | 'damage' | 'heal' | 'gold' | 'buff') => void;
  addFloatingText: (text: string, color?: string, icon?: React.ReactNode, target?: 'player' | 'enemy', large?: boolean) => void;
  addLog: (msg: string) => void;
}

export const BattleContext = React.createContext<BattleContextType>(null!);

export const useBattleContext = () => {
  const ctx = React.useContext(BattleContext);
  if (!ctx) throw new Error('useBattleContext must be used within BattleContext.Provider');
  return ctx;
};
