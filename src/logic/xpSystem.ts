/**
 * xpSystem.ts — 经验 / 等级系统
 * 纯函数，不产生副作用。用于在击杀结算时计算经验增益并处理升级。
 */

import type { GameState } from '../types/game';

/** 按节点类型（击杀敌人来源）给出单次击杀 XP 随机区间 [min, max]。 */
export function getKillXpRange(nodeType: string | undefined): [number, number] {
  switch (nodeType) {
    case 'elite': return [25, 45];   // 精英：25~45
    case 'boss':  return [70, 110];  // Boss：70~110
    default:      return [6, 14];    // 普通小怪：6~14
  }
}

/** 随机区间内取整数 XP */
export function rollKillXp(nodeType: string | undefined): number {
  const [lo, hi] = getKillXpRange(nodeType);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** 兼容旧调用：固定平均值 × killedCount（仅保留给老代码，不推荐继续用） */
export function getKillXp(nodeType: string | undefined, killedCount: number): number {
  const [lo, hi] = getKillXpRange(nodeType);
  const avg = Math.round((lo + hi) / 2);
  return avg * Math.max(1, killedCount);
}

/**
 * 升到下一级所需 XP：
 * Lv1->30, Lv2->50, Lv3->75, Lv4->110, Lv5->155, Lv6->210, Lv7->275,
 * Lv8+ 每级 +90
 * （前期更快升级，让玩家早期就能感受到成长节奏）
 */
export function nextLevelThreshold(nextLevel: number): number {
  const table = [0, 30, 50, 75, 110, 155, 210, 275];
  if (nextLevel < table.length) return table[nextLevel];
  return 275 + (nextLevel - 7) * 90;
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

/** 升级奖励类别（每次升级从三类各抽一张，共 3 选 1） */
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
 * 奖励池：每类多张，等级 3 选 1 时每类随机抽一张。
 * 刘叔定调：
 *  - 只能是"永久累加成长"，不能是即时治疗/临时 buff/影响出牌节奏（+手牌/+重投）
 *  - 禁：暴击系（与倍率同质）
 */
export const LEVEL_REWARD_POOL: LevelRewardDef[] = [
  // === 生存 ===
  {
    id: 'survival_hp',
    category: 'survival',
    title: '血之韧性',
    description: '最大生命 +8（永久叠加）',
    apply: (g) => ({
      levelMaxHpBonus: (g.levelMaxHpBonus || 0) + 8,
      maxHp: g.maxHp + 8,
      hp: g.hp + 8, // 同步不破血条上限
    }),
  },
  {
    id: 'survival_armor_start',
    category: 'survival',
    title: '壁垒之心',
    description: '每场战斗开始时获得 +3 初始护甲（永久叠加）',
    apply: (g) => ({
      levelStartArmor: (g.levelStartArmor || 0) + 3,
    }),
  },
  {
    id: 'survival_regen',
    category: 'survival',
    title: '生息印记',
    description: '每层地图结束后回复 +4 HP（永久叠加）',
    apply: (g) => ({
      levelMapHeal: (g.levelMapHeal || 0) + 4,
    }),
  },

  // === 攻击 ===
  {
    id: 'offense_damage',
    category: 'offense',
    title: '利刃精通',
    description: '每次出牌的基础伤害 +2（永久叠加）',
    apply: (g) => ({
      levelDamageBonus: (g.levelDamageBonus || 0) + 2,
    }),
  },
  {
    id: 'offense_mult',
    category: 'offense',
    title: '战意共鸣',
    description: '所有出牌伤害 +8%（永久叠加）',
    apply: (g) => ({
      levelDamageMultBonus: (g.levelDamageMultBonus || 0) + 0.08,
    }),
  },
  {
    id: 'offense_pierce',
    category: 'offense',
    title: '破甲之怒',
    description: '每次出牌附加 +1 穿透伤害（永久叠加）',
    apply: (g) => ({
      levelPierceBonus: (g.levelPierceBonus || 0) + 1,
    }),
  },

  // === 资源 ===
  {
    id: 'resource_gold',
    category: 'resource',
    title: '贪婪之眼',
    description: '金币收益 +15%（永久叠加）',
    apply: (g) => ({
      levelGoldBonus: (g.levelGoldBonus || 0) + 0.15,
    }),
  },
  {
    id: 'resource_soul',
    category: 'resource',
    title: '魂晶共振',
    description: '魂晶倍率 +10%（永久叠加）',
    apply: (g) => ({
      levelSoulBonus: (g.levelSoulBonus || 0) + 0.10,
    }),
  },
  {
    id: 'resource_xp',
    category: 'resource',
    title: '智慧印记',
    description: '获得经验值 +15%（永久叠加）',
    apply: (g) => ({
      levelXpBonus: (g.levelXpBonus || 0) + 0.15,
    }),
  },
];

/** 取出三类奖励（每次升级：三类各随机抽一张 = 3 选 1） */
export function getLevelUpChoices(): LevelRewardDef[] {
  const pick = (cat: LevelRewardCategory): LevelRewardDef => {
    const pool = LEVEL_REWARD_POOL.filter(r => r.category === cat);
    return pool[Math.floor(Math.random() * pool.length)];
  };
  return [pick('survival'), pick('offense'), pick('resource')];
}

// 兼容旧 import（若有外部使用）：固定三张字典仍保留
export const LEVEL_UP_REWARDS = {
  survival: LEVEL_REWARD_POOL.find(r => r.id === 'survival_hp')!,
  offense:  LEVEL_REWARD_POOL.find(r => r.id === 'offense_damage')!,
  resource: LEVEL_REWARD_POOL.find(r => r.id === 'resource_gold')!,
} as const;
