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
  rarity: 'rare',
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
  description: '出牌时额外 +5 基础伤害，随战斗阶段升级增加',
  rarity: 'rare',
  onPlay: { bonusDamage: 5 },
};

const amplify: DiceDef = {
  id: 'amplify',
  name: '倍增骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时总伤害 x1.2，随战斗阶段升级增加',
  rarity: 'rare',
  onPlay: { bonusMult: 1.2 },
};

const split: DiceDef = {
  id: 'split',
  name: '分裂骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时分裂出一个相同点数的临时骰子加入结算',
  rarity: 'rare',
};


const magnet: DiceDef = {
  id: 'magnet',
  name: '磁吸骰子',
  element: 'normal',
  faces: [1, 2, 3, 4, 5, 6],
  description: '出牌时随机同化一颗同伴骰子的点数为自身点数，实时影响牌型',
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
  blade, amplify, split, magnet, joker,
  chaos,
  cursed, cracked,
};

export const DICE_BY_RARITY: Record<DiceRarity, DiceDef[]> = {
  common: [standard],
  uncommon: [heavy],
  rare: [blade, amplify, split, magnet, joker, elemental],
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

export const getUpgradedFaces = (def: DiceDef, _level: number): number[] => {
  // 升级不再改变点数面，而是强化骰子的特殊效果
  return def.faces;
};

export const getDiceLevelScale = (level: number): number => {
  return 1 + (level - 1) * 0.5;
};


/** 获取升级后的onPlay效果（强化特殊效果，而非点数） */
export const getUpgradedOnPlay = (def: DiceDef, level: number): DiceDef['onPlay'] => {
  if (level <= 1) return def.onPlay;
  const bonus = level - 1; // Lv2 = +1, Lv3 = +2
  
  if (!def.onPlay) {
    // 无特殊效果的骰子：升级后获得额外伤害
    // 普通骰子 Lv2=+3, Lv3=+6; 灌铅 Lv2=+4, Lv3=+8
    const baseBonusDmg = def.id === 'heavy' ? 4 : def.id === 'elemental' ? 3 : 3;
    return { bonusDamage: bonus * baseBonusDmg };
  }
  
  const op = { ...def.onPlay };
  // 锋刃骰子: Lv1=5, Lv2=8, Lv3=11（每级+3）
  if (op.bonusDamage) op.bonusDamage = op.bonusDamage + bonus * 3;
  // 倍增骰子: Lv1=1.2, Lv2=1.35, Lv3=1.5（每级+0.15）
  if (op.bonusMult) op.bonusMult = Number((op.bonusMult + bonus * 0.15).toFixed(2));
  if (op.selfDamage) op.selfDamage = Math.max(1, op.selfDamage - bonus); // 减少副作用
  return op;
};

/** 获取升级后的元素效果倍率 */
export const getElementLevelBonus = (level: number): number => {
  return 1 + (level - 1) * 0.5; // Lv1=1x, Lv2=1.5x, Lv3=2x
};

export const DICE_MAX_LEVEL = 3;

// ============================================================
// 骰子构筑奖励池 — 加权随机，所有骰子都有机会
// ============================================================

export const getDiceRewardPool = (battleType: 'enemy' | 'elite' | 'boss'): DiceDef[] => {
  // 权重表：[普通战, 精英战, Boss战]
  const weights: Record<string, [number, number, number]> = {
    heavy:     [4, 3, 1],
    elemental: [3, 3, 2],
    blade:     [3, 3, 2],
    amplify:   [3, 3, 2],
    split:     [1, 3, 3],
    magnet:    [1, 3, 3],
    joker:     [1, 2, 3],
    chaos:     [0.3, 1, 3],
  };
  const idx = battleType === 'enemy' ? 0 : battleType === 'elite' ? 1 : 2;
  const pool: DiceDef[] = [];
  for (const [id, w] of Object.entries(weights)) {
    const def = ALL_DICE[id];
    if (!def) continue;
    const count = Math.max(1, Math.round(w[idx]));
    for (let i = 0; i < count; i++) pool.push(def);
  }
  return pool;
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
  fire: '破甲爆燃：摧毁敌人所有护甲，附加真实伤害，并施加点数灼烧',
  ice: '绝对控制：冻结敌人1回合，点数结算减半',
  thunder: '传导AOE：对其他敌人造成等量穿透伤害',
  poison: '叠层斩杀：施加毒层，跨回合持续掉血',
  holy: '经济续航：恢复等同点数的生命值',
};
