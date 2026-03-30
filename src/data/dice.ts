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

const heavy: DiceDef = {
  id: 'heavy',
  name: '铅骰子',
  element: 'normal',
  faces: [3, 3, 4, 4, 5, 5],
  description: '点数偏高，无极端值',
  rarity: 'common',
};

const light: DiceDef = {
  id: 'light',
  name: '木骰子',
  element: 'normal',
  faces: [1, 1, 2, 2, 3, 3],
  description: '点数偏低，但稳定',
  rarity: 'common',
};

// ============================================================
// 元素骰子 (uncommon)
// ============================================================

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
  description: '出牌时施加2层虚弱(2回合)',
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
  description: '出牌时施加2层中毒',
  rarity: 'uncommon',
  onPlay: { statusToEnemy: { type: 'poison', value: 2 } },
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

const shadow: DiceDef = {
  id: 'shadow',
  name: '暗影骰子',
  element: 'shadow',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时施加1层易伤(2回合)',
  rarity: 'uncommon',
  onPlay: { statusToEnemy: { type: 'vulnerable', value: 1, duration: 2 } },
};

// ============================================================
// 高级骰子 (rare)
// ============================================================

const stone: DiceDef = {
  id: 'stone',
  name: '石骰子',
  element: 'normal',
  faces: [4, 4, 5, 5, 6, 6],
  description: '纯高数值骰子',
  rarity: 'rare',
};

const blade: DiceDef = {
  id: 'blade',
  name: '锋刃骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时+5伤害',
  rarity: 'rare',
  onPlay: { bonusDamage: 5 },
};

const inferno: DiceDef = {
  id: 'inferno',
  name: '烈焰骰子',
  element: 'fire',
  faces: [2, 3, 4, 5, 5, 6],
  description: '出牌时施加4层灼烧',
  rarity: 'rare',
  onPlay: { statusToEnemy: { type: 'burn', value: 4 } },
};

const blizzard: DiceDef = {
  id: 'blizzard',
  name: '暴风雪骰子',
  element: 'ice',
  faces: [2, 3, 3, 4, 4, 5],
  description: '出牌时施加3层虚弱(3回合)',
  rarity: 'rare',
  onPlay: { statusToEnemy: { type: 'weak', value: 3, duration: 3 } },
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

// ============================================================
// 传说骰子 (legendary)
// ============================================================

const phoenix: DiceDef = {
  id: 'phoenix',
  name: '凤凰骰子',
  element: 'fire',
  faces: [3, 4, 5, 5, 6, 6],
  description: '出牌时施加5层灼烧+回复5HP',
  rarity: 'legendary',
  onPlay: { statusToEnemy: { type: 'burn', value: 5 }, heal: 5 },
};

const voidDice: DiceDef = {
  id: 'void',
  name: '虚空骰子',
  element: 'shadow',
  faces: [5, 5, 5, 5, 5, 5],
  description: '固定5点，出牌时施加2层易伤(3回合)',
  rarity: 'legendary',
  onPlay: { statusToEnemy: { type: 'vulnerable', value: 2, duration: 3 } },
};

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
  standard, heavy, light,
  fire, ice, thunder, poison, holy, shadow,
  stone, blade, inferno, blizzard, amplify,
  phoenix, void: voidDice, chaos,
  cursed, cracked,
};

/** 按稀有度分组 */
export const DICE_BY_RARITY: Record<DiceRarity, DiceDef[]> = {
  common: [standard, heavy, light],
  uncommon: [fire, ice, thunder, poison, holy, shadow],
  rare: [stone, blade, inferno, blizzard, amplify],
  legendary: [phoenix, voidDice, chaos],
  curse: [cursed, cracked],
};

/** 初始骰子库 (骰子定义ID列表) — 8颗: 6普通 + 1铅 + 1火 */
export const INITIAL_DICE_BAG: string[] = [
  'standard', 'standard', 'standard', 'standard',
  'standard', 'standard', 'standard', 'standard',
  'heavy',
  'fire',
];

/** 根据骰子定义掷骰 — 从faces中随机取一个 */
export const rollDiceDef = (def: DiceDef): number => {
  return def.faces[Math.floor(Math.random() * def.faces.length)];
};

/** 获取骰子定义，找不到返回普通骰子 */
export const getDiceDef = (id: string): DiceDef => {
  return ALL_DICE[id] || ALL_DICE['standard'];
};
