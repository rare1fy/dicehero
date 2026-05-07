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

// ============ 升级三选一奖励系统 ============

/** 升级奖励类别（每次升级三类各抽一个，共 3 选 1） */
export type LevelRewardCategory = 'survival' | 'offense' | 'resource';

export interface LevelRewardDef {
  id: string;
  category: LevelRewardCategory;
  title: string;
  description: string;
  /** 纯函数：返回要 patch 到 GameState 的字段（永久累加） */
  apply: (game: GameState) => Partial<GameState>;
}

/**
 * 固定三张（每类 1 张），等级越高，同一张牌叠加效果线性成长。
 * 刘叔定调：
 *  - 生存：+最大生命（同步补满）
 *  - 攻击：+基础伤害（所有出牌最终伤害累加）
 *  - 资源：+金币收益百分比
 * 禁：暴击、临时 buff、+手牌/重投（这些影响出牌节奏）
 */
export const LEVEL_UP_REWARDS: Record<LevelRewardCategory, LevelRewardDef> = {
  survival: {
    id: 'survival_hp',
    category: 'survival',
    title: '血之韧性',
    description: '最大生命 +8，并立即回复 8 点生命',
    apply: (g) => ({
      levelMaxHpBonus: (g.levelMaxHpBonus || 0) + 8,
      maxHp: g.maxHp + 8,
      hp: Math.min(g.maxHp + 8, g.hp + 8),
    }),
  },
  offense: {
    id: 'offense_damage',
    category: 'offense',
    title: '利刃精通',
    description: '每次出牌的基础伤害 +2',
    apply: (g) => ({
      levelDamageBonus: (g.levelDamageBonus || 0) + 2,
    }),
  },
  resource: {
    id: 'resource_gold',
    category: 'resource',
    title: '贪婪之眼',
    description: '金币收益 +15%（永久叠加）',
    apply: (g) => ({
      levelGoldBonus: (g.levelGoldBonus || 0) + 0.15,
    }),
  },
};

/** 取出三类奖励（每次升级 1 类 × 3 = 3 选 1） */
export function getLevelUpChoices(): LevelRewardDef[] {
  return [
    LEVEL_UP_REWARDS.survival,
    LEVEL_UP_REWARDS.offense,
    LEVEL_UP_REWARDS.resource,
  ];
}
