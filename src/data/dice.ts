/**
 * dice.ts - 骰子定义表 v2
 * 
 * === 骰子体系 v2 ===
 * 1. 元素骰子：合并火/冰/雷/毒/圣为一种，抽到时随机坍缩
 * 2. 灌铅骰子：只能掷出 4/5/6，高下限
 * 3. 混沌骰子：只能掷出 1 和 6，极端分布
 * 4. 锋刃骰子：+20 基础伤害
 * 5. 倍增骰子：x1.5 倍率
 * 6. 小丑骰子：1-9 随机
 * 7. 分裂骰子：出牌时复制自身加入结算
 * 8. 诅咒骰子：0点，重Roll代价翻倍
 * 9. 碎裂骰子：固定1-2点，反噬伤害
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
  faces: [4, 4, 5, 5, 6, 6],
  description: '只能掷出4/5/6，稳定性极高的底牌',
  rarity: 'uncommon',
};

const elemental: DiceDef = {
  id: 'elemental',
  name: '元素骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '抽到时随机坍缩为火/冰/雷/毒/圣之一，重Roll会重置元素',
  rarity: 'uncommon',
  isElemental: true,
};

// ============================================================
// 高级骰子 (rare)
// ============================================================

const blade: DiceDef = {
  id: 'blade',
  name: '锋刃骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时额外 +20 基础伤害，前期打工神器',
  rarity: 'rare',
  onPlay: { bonusDamage: 15 },
};

const amplify: DiceDef = {
  id: 'amplify',
  name: '倍增骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时总伤害 x1.5，中后期核心乘区',
  rarity: 'rare',
  onPlay: { bonusMult: 1.5 },
};

const split: DiceDef = {
  id: 'split',
  name: '分裂骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时分裂出一个相同点数的临时骰子加入结算',
  rarity: 'rare',
};

const joker: DiceDef = {
  id: 'joker',
  name: '小丑骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  description: '点数1-9随机，突破六面限制',
  rarity: 'rare',
};

// ============================================================
// 传说骰子 (legendary)
// ============================================================

const chaos: DiceDef = {
  id: 'chaos',
  name: '混沌骰子',
  element: 'normal',
  faces: [1, 1, 1, 6, 6, 6],
  description: '只能掷出1和6，专为凑满堂红/多条服务',
  rarity: 'legendary',
};

// ============================================================
// 诅咒骰子 (curse)
// ============================================================

const cursed: DiceDef = {
  id: 'cursed',
  name: '诅咒骰子',
  element: 'normal',
  faces: [0, 0, 0, 0, 0, 0],
  description: '点数永远为0，重Roll代价翻倍',
  rarity: 'curse',
  isCursed: true,
};

const cracked: DiceDef = {
  id: 'cracked',
  name: '碎裂骰子',
  element: 'normal',
  faces: [1, 1, 1, 2, 2, 2],
  description: '打出后受到3点反噬伤害。回合结束时若未打出则自行销毁',
  rarity: 'curse',
  onPlay: { selfDamage: 2 },
  isCracked: true,
};

// ============================================================
// 骰子注册表
// ============================================================

export const ALL_DICE: Record<string, DiceDef> = {
  standard,
  heavy, elemental,
  blade, amplify, split, joker,
  chaos,
  cursed, cracked,
};

export const DICE_BY_RARITY: Record<DiceRarity, DiceDef[]> = {
  common: [standard],
  uncommon: [heavy, elemental],
  rare: [blade, amplify, split, joker],
  legendary: [chaos],
  curse: [cursed, cracked],
};

export const INITIAL_DICE_BAG: string[] = [
  'standard', 'standard', 'standard', 'standard',
  'heavy',
  'blade',
];

export const ELEMENTAL_COLLAPSE_ELEMENTS = ['fire', 'ice', 'thunder', 'poison', 'holy'] as const;
export type CollapseElement = typeof ELEMENTAL_COLLAPSE_ELEMENTS[number];

export const collapseElement = (): CollapseElement => {
  return ELEMENTAL_COLLAPSE_ELEMENTS[Math.floor(Math.random() * ELEMENTAL_COLLAPSE_ELEMENTS.length)];
};

export const rollDiceDef = (def: DiceDef): number => {
  return def.faces[Math.floor(Math.random() * def.faces.length)];
};

export const getDiceDef = (id: string): DiceDef => {
  return ALL_DICE[id] || ALL_DICE['standard'];
};

// ============================================================
// 骰子升级体系
// ============================================================

export const getUpgradedFaces = (def: DiceDef, level: number): number[] => {
  const bonus = Math.max(0, level - 1);
  return def.faces.map(f => f + bonus);
};

export const getDiceLevelScale = (level: number): number => {
  return 1 + (level - 1) * 0.5;
};

export const DICE_MAX_LEVEL = 3;

// ============================================================
// 骰子构筑奖励池
// ============================================================

export const getDiceRewardPool = (battleType: 'enemy' | 'elite' | 'boss'): DiceDef[] => {
  switch (battleType) {
    case 'enemy':
      return [...DICE_BY_RARITY.common, ...DICE_BY_RARITY.uncommon, ...DICE_BY_RARITY.rare.slice(0, 2)];
    case 'elite':
      return [...DICE_BY_RARITY.uncommon, ...DICE_BY_RARITY.rare];
    case 'boss':
      return [...DICE_BY_RARITY.rare, ...DICE_BY_RARITY.legendary];
  }
};

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

export const ELEMENT_EFFECT_DESC: Record<string, string> = {
  fire: '破甲爆燃：摧毁敌人所有护甲，附加真实伤害',
  ice: '绝对控制：冻结敌人1回合，点数结算减半',
  thunder: '传导AOE：对其他敌人造成等量穿透伤害',
  poison: '叠层斩杀：施加毒层，跨回合持续掉血',
  holy: '经济续航：恢复等同点数的生命值',
};