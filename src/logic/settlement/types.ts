/**
 * settlement/types.ts — 结算演出接口定义
 *
 * ARCH-17 从 settlementAnimation.ts 拆出
 * 原文件 L20-L72：SettlementContext + SettlementData
 */

import type React from 'react';
import type { Die, GameState, Enemy, HandResult, StatusEffect } from '../../types/game';
import type { ExpectedOutcomeResult } from '../expectedOutcomeTypes';

// ============================================================
// Context 接口
// ============================================================

export interface SettlementContext {
  // State 快照
  game: GameState;
  gameRef: React.MutableRefObject<GameState>;
  enemies: Enemy[];
  dice: Die[];
  currentHands: HandResult;
  selected: Die[];
  outcome: ExpectedOutcomeResult;
  targetEnemy: Enemy;
  comboFinisherBonus: number;
  straightUpgrade: number;
  isAoeActive: boolean;

  // Callbacks — React setState 稳定引用
  setSettlementData: React.Dispatch<React.SetStateAction<SettlementData | null>>;
  setSettlementPhase: React.Dispatch<React.SetStateAction<string | null>>;
  setShowRelicPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDamageOverlay: React.Dispatch<React.SetStateAction<{ damage: number; armor: number; heal: number } | null>>;
  setScreenShake: React.Dispatch<React.SetStateAction<boolean>>;
  setFlashingRelicIds: React.Dispatch<React.SetStateAction<string[]>>;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string) => void;
  addToast: (msg: string, type?: string) => void;
  addFloatingText: (text: string, color: string, icon?: React.ReactNode, target?: string, persistent?: boolean) => void;
  playSound: (id: string) => void;
  playSettlementTick: (idx: number) => void;
  playMultiplierTick: (idx: number) => void;
  playHeavyImpact: (intensity: number) => void;
}

/** 结算面板数据（与 DiceHeroGame 中 useState 内联类型一致） */
export interface SettlementData {
  bestHand: string;
  selectedDice: Die[];
  diceScores: number[];
  baseValue: number;
  mult: number;
  currentBase: number;
  currentMult: number;
  triggeredEffects: { name: string; detail: string; icon?: string; type: 'damage' | 'mult' | 'status' | 'heal' | 'armor'; rawValue?: number; rawMult?: number; relicId?: string }[];
  currentEffectIdx: number;
  finalDamage: number;
  finalArmor: number;
  finalHeal: number;
  statusEffects: StatusEffect[];
  isSameElement?: boolean;
}