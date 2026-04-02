/**
 * dice.ts - 骰子定义表
 * 
 * 所有骰子的模板定义。每颗骰子有独立的元素类型、面值分布、稀有度和出牌效果。
 * 骰子是核心构筑单元，通过骰子库(deck) + 弃骰库(discard) 循环运转。
 */

import type { DiceDef, DiceRarity } from '../types/game';

// ============================================================
// 普通骰子 (common)
// ============================================================

const standard: DiceDef = {
  id: 'standard',
  name: '普通骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '标准六面骰，均值3.5',
  rarity: 'common',
};

// ============================================================
// 进阶骰子 (uncommon)
// ============================================================

const heavy: DiceDef = {
  id: 'heavy',
  name: '灌铅骰子',
  element: 'normal',
  faces: [3, 3, 4, 4, 5, 5],
  description: '点数偏高，无极端值',
  rarity: 'uncommon',
};

const fire: DiceDef = {
  id: 'fire',
  name: '火焰骰子',
  element: 'fire',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时施加2层灼烧',
  rarity: 'uncommon',
  onPlay: { statusToEnemy: { type: 'burn', value: 2 } },
};

const ice: DiceDef = {
  id: 'ice',
  name: '冰霜骰子',
  element: 'ice',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时施加1层冰冻',
  rarity: 'uncommon',
  onPlay: { statusToEnemy: { type: 'weak', value: 2, duration: 2 } },
};

const thunder: DiceDef = {
  id: 'thunder',
  name: '雷电骰子',
  element: 'thunder',
  faces: [1, 1, 1, 6, 6, 6],
  description: '极端分布，出牌时+3穿透伤害',
  rarity: 'uncommon',
  onPlay: { pierce: 3 },
};

const poison: DiceDef = {
  id: 'poison',
  name: '剧毒骰子',
  element: 'poison',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时施加3层中毒',
  rarity: 'uncommon',
  onPlay: { statusToEnemy: { type: 'poison', value: 3 } },
};

const holy: DiceDef = {
  id: 'holy',
  name: '圣光骰子',
  element: 'holy',
  faces: [2, 3, 3, 4, 4, 5],
  description: '出牌时回复3HP',
  rarity: 'uncommon',
  onPlay: { heal: 3 },
};

// ============================================================
// 高级骰子 (rare)
// ============================================================

const blade: DiceDef = {
  id: 'blade',
  name: '锋刃骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时+5伤害',
  rarity: 'rare',
  onPlay: { bonusDamage: 5 },
};

const amplify: DiceDef = {
  id: 'amplify',
  name: '增幅骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时总伤害x1.3',
  rarity: 'rare',
  onPlay: { bonusMult: 1.3 },
};

const split: DiceDef = {
  id: 'split',
  name: '分裂骰子',
  element: 'normal',
  faces: [2, 2, 3, 3, 4, 4],
  description: '出牌后复制1个自己加入牌型（升级后复制更多）',
  rarity: 'rare',
  // 分裂效果在DiceHeroGame中特殊处理
};

const joker: DiceDef = {
  id: 'joker',
  name: '小丑骰子',
  element: 'normal',
  faces: [1, 1, 1, 1, 1, 1],
  description: '每回合六面变为同一随机点数，天然凑对子/三条',
  rarity: 'rare',
  // 小丑效果在DiceHeroGame中特殊处理：每回合随机1个点数，六面全为该点数
};

// ============================================================
// 传说骰子 (legendary)
// ============================================================

const chaos: DiceDef = {
  id: 'chaos',
  name: '混沌骰子',
  element: 'normal',
  faces: [1, 1, 6, 6, 6, 6],
  description: '极端分布，出牌时总伤害x1.5',
  rarity: 'legendary',
  onPlay: { bonusMult: 1.5 },
};

// ============================================================
// 诅咒骰子 (curse)
// ============================================================

const cursed: DiceDef = {
  id: 'cursed',
  name: '诅咒骰子',
  element: 'normal',
  faces: [1, 1, 1, 2, 2, 2],
  description: '点数极低的诅咒',
  rarity: 'curse',
};

const cracked: DiceDef = {
  id: 'cracked',
  name: '碎裂骰子',
  element: 'normal',
  faces: [0, 1, 1, 2, 2, 3],
  description: '有一面是0点',
  rarity: 'curse',
};

// ============================================================
// 骰子注册表
// ============================================================

/** 所有骰子定义的字典 */
export const ALL_DICE: Record<string, DiceDef> = {
  standard,
  heavy, fire, ice, thunder, poison, holy,
  blade, amplify, split, joker,
  chaos,
  cursed, cracked,
};

/** 按稀有度分组 */
export const DICE_BY_RARITY: Record<DiceRarity, DiceDef[]> = {
  common: [standard],
  uncommon: [heavy, fire, ice, thunder, poison, holy],
  rare: [blade, amplify, split, joker],
  legendary: [chaos],
  curse: [cursed, cracked],
};

/** 初始骰子库: 5普通 + 3灌铅，纯普通起步 */
export const INITIAL_DICE_BAG: string[] = [
  'standard', 'standard', 'standard', 'standard', 'standard',
  'heavy', 'heavy', 'heavy',
];

/** 根据骰子定义掷骰 */
export const rollDiceDef = (def: DiceDef): number => {
  return def.faces[Math.floor(Math.random() * def.faces.length)];
};

/** 获取骰子定义，找不到返回普通骰子 */
export const getDiceDef = (id: string): DiceDef => {
  return ALL_DICE[id] || ALL_DICE['standard'];
};

// ============================================================
// 骰子升级体系
// ============================================================

/** 骰子升级：每面+N点 */
export const getUpgradedFaces = (def: DiceDef, level: number): number[] => {
  const bonus = Math.max(0, level - 1); // Lv1=+0, Lv2=+1, Lv3=+2
  return def.faces.map(f => f + bonus);
};

/** 骰子升级：onPlay效果增强系数 */
export const getDiceLevelScale = (level: number): number => {
  return 1 + (level - 1) * 0.5; // Lv1=1.0, Lv2=1.5, Lv3=2.0
};

/** 骰子最大等级 */
export const DICE_MAX_LEVEL = 3;

// ============================================================
// 骰子构筑奖励池
// ============================================================

/** 根据战斗类型获取骰子奖励池 */
export const getDiceRewardPool = (battleType: 'enemy' | 'elite' | 'boss'): DiceDef[] => {
  switch (battleType) {
    case 'enemy':
      return [...DICE_BY_RARITY.uncommon];
    case 'elite':
      return [...DICE_BY_RARITY.uncommon, ...DICE_BY_RARITY.rare];
    case 'boss':
      return [...DICE_BY_RARITY.rare, ...DICE_BY_RARITY.legendary];
  }
};

/** 从池中随机抽取N个不重复骰子 */
export const pickRandomDice = (pool: DiceDef[], count: number): DiceDef[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const seen = new Set<string>();
  const result: DiceDef[] = [];
  for (const d of shuffled) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      result.push(d);
      if (result.length >= count) break;
    }
  }
  return result;
};
