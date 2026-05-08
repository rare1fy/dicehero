/**
 * rogueComboEffects.ts — 影锋刺客连击效果处理
 *
 * ARCH-I: 从 useBattleCombat.tsx playHand 中提取的影锋刺客职业专属连击逻辑。
 * 包含连击预备（增加免费重投次数）和连击终击（伤害加成提示）。
 *
 * Bug-19 修复：连击预备从 "rerollCount -= 1"（减法，仅退回已用重投）改为
 * "comboFreeReroll += 1"（加法，无条件给+1免费重投），确保第二次出牌前
 * 总是获得1次额外免费重投，与"重掷骰子应算回合内"的设计意图一致。
 */

import React from 'react';
import type { GameState } from '../types/game';
import { PixelRefresh } from '../components/PixelIcons';
import { emitReward } from './rewardEvents';

/** 奖励类飘字统一金色 */
const REWARD_COLOR = 'text-amber-200';

/** 连击效果回调集合 */
export interface RogueComboCallbacks {
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  addFloatingText: (text: string, className: string, icon: unknown, target: string) => void;
}

/**
 * 处理影锋刺客连击预备效果（连击第0击）
 *
 * 条件：影锋刺客 + 当前连击数为0
 * 效果：同步 comboFreeReroll +1 + 浮动文字提示
 *
 * 修复说明（Bug-19）：
 * - 旧逻辑：setTimeout 200ms 后 rerollCount -= 1（仅退回已用重投，且 setTimeout 引入竞态）
 * - 新逻辑：同步 comboFreeReroll += 1（无条件增加1次免费重投，纳入 effectiveFreeRerollsPerTurn）
 * - 设计意图：第一次出牌应作为"连击预备"为第二次出牌提供免费重投机会，
 *   不应因第一次出牌前未使用重投而浪费这个加成
 * - 移除 setTimeout：函数式更新 prev => ({ ...prev, comboFreeReroll: ... }) 是原子的，
 *   不需要延迟等待其他 state 更新；浮动文字用 200ms setTimeout 延迟显示以避免与出牌动画冲突
 */
export function handleRogueComboPrep(
  playerClass: string,
  currentCombo: number,
  cb: RogueComboCallbacks,
): void {
  if (playerClass === 'rogue' && currentCombo === 0) {
    cb.setGame(prev => ({ ...prev, comboFreeReroll: (prev.comboFreeReroll || 0) + 1 }));
    setTimeout(() => {
      cb.addFloatingText('连击袖箭: +1', REWARD_COLOR, React.createElement(PixelRefresh, { size: 1.5 }), 'player');
      emitReward('reroll', 1);
    }, 200);
  }
}

/**
 * 处理影锋刺客连击终击效果（连击第1击且非普通攻击）
 *
 * 条件：影锋刺客 + 当前连击数为1 + 牌型非普通攻击
 * 效果：200ms 后浮动文字提示 +20%伤害
 */
export function handleRogueComboHit(
  playerClass: string,
  currentCombo: number,
  thisHandType: string,
  addFloatingText: (text: string, className: string, icon: unknown, target: string) => void,
): void {
  if (playerClass === 'rogue' && currentCombo === 1 && thisHandType !== '普通攻击') {
    setTimeout(() => {
      addFloatingText('连击! +20%伤害', REWARD_COLOR, undefined, 'player');
    }, 200);
  }
}
