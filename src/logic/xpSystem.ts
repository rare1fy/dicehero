/**
 * xpSystem.ts — 经验 / 等级系统
 * 纯函数，不产生副作用。用于在击杀结算时计算经验增益并处理升级。
 */

import type { GameState } from '../types/game';

/** 按节点类型（击杀敌人来源）给出单次击杀 XP。Boss 是整场战斗的结算奖励。*/
export function getKillXp(nodeType: string | undefined, killedCount: number): number {
  const perKill = (() => {
    switch (nodeType) {
      case 'elite': return 30;
      case 'boss':  return 80;
      default:      return 10; // enemy / 其他
    }
  })();
  return perKill * Math.max(1, killedCount);
}

/** 升到下一级所需 XP：Lv1->50, Lv2->80, Lv3->120, Lv4->170, Lv5->230, Lv6->300, Lv7->380, >=Lv8 每级 +100 */
export function nextLevelThreshold(nextLevel: number): number {
  const table = [0, 50, 80, 120, 170, 230, 300, 380];
  if (nextLevel < table.length) return table[nextLevel];
  return 380 + (nextLevel - 7) * 100;
}

/**
 * 应用一次经验增益。返回新的 level/xp/xpToNext，以及本次触发的升级级数数组（用于后续弹窗/提示）。
 * 一次增益可跨多级。
 */
export interface XpApplyResult {
  level: number;
  xp: number;
  xpToNext: number;
  levelsGained: number[];  // 如 [5,6] 表示这一次跳了 2 级
}

export function applyXpGain(game: GameState, gain: number): XpApplyResult {
  let level = game.level || 1;
  let xp = (game.xp || 0) + gain;
  let xpToNext = game.xpToNext || nextLevelThreshold(level + 1);
  const levelsGained: number[] = [];

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    levelsGained.push(level);
    xpToNext = nextLevelThreshold(level + 1);
  }

  return { level, xp, xpToNext, levelsGained };
}