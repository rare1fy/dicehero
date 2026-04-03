/**
 * relics.ts - 遗物定义表
 * 
 * 四大核心体系：
 * 1. 基础打工类 (Flat/Chips) - 提供基础数值保障
 * 2. 倍率起飞类 (Multiplier) - 提供指数级爆发
 * 3. 经济与续航类 (Economy & Health) - 运转引擎
 * 4. 机制突变类 (Rule Breakers) - 改变底层逻辑
 */

import type { Relic } from '../types/game';

// ============================================================
// 体系一：基础打工类
// ============================================================

const grindstone: Relic = {
  id: 'grindstone',
  name: '磨刀石',
  description: '打出≤2颗骰子的牌型时，额外+15基础伤害',
  icon: 'blade',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.diceCount || 0) <= 2 ? 12 : 0,
  }),
};

const ironBanner: Relic = {
  id: 'iron_banner',
  name: '铁血战旗',
  description: '本回合每次卖血重Roll，下次出牌+8基础伤害(可叠加)',
  icon: 'flag',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.rerollsThisTurn || 0) * 6,
  }),
};

const heavyMetalCore: Relic = {
  id: 'heavy_metal_core',
  name: '重金属核心',
  description: '牌型中每有1颗灌铅骰子，基础伤害+10',
  icon: 'weight',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.loadedDiceCount || 0) * 10,
  }),
};

const chaosPendulum: Relic = {
  id: 'chaos_pendulum',
  name: '混沌摆锤',
  description: '牌型点数总和为奇数时+12伤害；偶数时回复3HP',
  icon: 'pendulum',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => {
    const sum = ctx.pointSum || 0;
    return sum % 2 === 1 ? { damage: 12 } : { heal: 3 };
  },
};

// ============================================================
// 体系二：倍率起飞类
// ============================================================

const crimsonGrail: Relic = {
  id: 'crimson_grail',
  name: '猩红圣杯',
  description: '损失HP比例转化为最终伤害倍率(最高x3.0)',
  icon: 'grail',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const hpPercent = (ctx.currentHp || 100) / (ctx.maxHp || 100);
    const lostPercent = 1 - hpPercent;
    const mult = 1 + Math.min(1.5, lostPercent * 2.5);
    return { multiplier: mult };
  },
};

const arithmeticGauge: Relic = {
  id: 'arithmetic_gauge',
  name: '等差数列仪',
  description: '打出顺子时，长度每+1，倍率翻倍(3顺=x1.5, 4顺=x2, 5顺=x3, 6顺=x5)',
  icon: 'gauge',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    if (!ht.includes('顺')) return {};
    const count = ctx.diceCount || 0;
    const multMap: Record<number, number> = { 3: 1.5, 4: 2.0, 5: 3.0, 6: 5.0 };
    return { multiplier: multMap[count] || 1 };
  },
};

const mirrorPrism: Relic = {
  id: 'mirror_prism',
  name: '镜像棱镜',
  description: '分裂骰子触发时，分裂出的点数直接转化为全局倍率',
  icon: 'prism',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => ({
    multiplier: ctx.hasSplitDice ? 1 + (ctx.splitDiceValue || 0) * 0.5 : 1,
  }),
};

const elementalResonator: Relic = {
  id: 'elemental_resonator',
  name: '元素共鸣器',
  description: '本场战斗打出过3种不同元素时，所有伤害x2.5',
  icon: 'resonator',
  rarity: 'legendary',
  trigger: 'on_play',
  effect: (ctx) => ({
    multiplier: (ctx.elementsUsedThisBattle?.size || 0) >= 3 ? 2.5 : 1,
  }),
};

const perfectionist: Relic = {
  id: 'perfectionist',
  name: '完美主义强迫症',
  description: '打出葫芦/四条/五条且无特殊骰子(纯白板)时，伤害x5',
  icon: 'diamond',
  rarity: 'legendary',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    const isPureHand = (ht === '葫芦' || ht === '四条' || ht === '五条');
    const noSpecial = !ctx.hasSpecialDice;
    return { multiplier: isPureHand && noSpecial ? 4.0 : 1 };
  },
};

// ============================================================
// 体系三：经济与续航类
// ============================================================

const emergencyHourglass: Relic = {
  id: 'emergency_hourglass',
  name: '急救沙漏',
  description: '每场战斗前2次卖血重Roll不扣血',
  icon: 'hourglass',
  rarity: 'uncommon',
  trigger: 'passive',
  counter: 0,
  maxCounter: 2,
  counterLabel: '次',
  effect: () => ({ freeRerolls: 2 }),
};

const vampireFangs: Relic = {
  id: 'vampire_fangs',
  name: '吸血鬼假牙',
  description: '击杀时溢出伤害的30%转化为生命恢复',
  icon: 'fangs',
  rarity: 'rare',
  trigger: 'on_kill',
  effect: (ctx) => ({
    heal: Math.floor((ctx.overkillDamage || 0) * 0.25),
  }),
};

const blackMarketContract: Relic = {
  id: 'black_market_contract',
  name: '黑市合同',
  description: '每次卖血重Roll时，获得等同扣血值的金币',
  icon: 'contract',
  rarity: 'uncommon',
  trigger: 'on_reroll',
  effect: (ctx) => ({
    goldBonus: ctx.hpLostThisTurn || 0,
  }),
};

const scrapYard: Relic = {
  id: 'scrap_yard',
  name: '废品回收站',
  description: '战斗结束时，手中每有1颗诅咒/碎裂骰子，获得8金币',
  icon: 'recycle',
  rarity: 'uncommon',
  trigger: 'on_battle_end',
  effect: (ctx) => ({
    goldBonus: ((ctx.cursedDiceInHand || 0) + (ctx.crackedDiceInHand || 0)) * 10,
  }),
};

// ============================================================
// 体系四：机制突变类
// ============================================================

const sixthFinger: Relic = {
  id: 'sixth_finger',
  name: '第六根手指',
  description: '抽牌容量+1(4→5)',
  icon: 'hand',
  rarity: 'legendary',
  trigger: 'passive',
  effect: () => ({ drawCountBonus: 1 }),
};

const quantumObserver: Relic = {
  id: 'quantum_observer',
  name: '量子观测仪',
  description: '可以透视骰子库，并锁定骰子不被重Roll',
  icon: 'eye',
  rarity: 'legendary',
  trigger: 'passive',
  effect: () => ({ canLockDice: true }),
};

const limitBreaker: Relic = {
  id: 'limit_breaker',
  name: '底线突破',
  description: '小丑骰子最大点数解禁(不再受限于9)',
  icon: 'infinity',
  rarity: 'legendary',
  trigger: 'passive',
  effect: () => ({ maxPointsUnlocked: true }),
};

const schrodingerBag: Relic = {
  id: 'schrodinger_bag',
  name: '薛定谔的袋子',
  description: '回合结束时若未使用重Roll，下回合额外获得1颗临时元素骰子',
  icon: 'bag',
  rarity: 'rare',
  trigger: 'on_turn_end',
  effect: (ctx) => {
    if ((ctx.rerollsThisTurn || 0) === 0) {
      return { drawCountBonus: 1 };
    }
    return {};
  },
};

// ============================================================
// 遗物注册表
// ============================================================

export const ALL_RELICS: Record<string, Relic> = {
  grindstone,
  iron_banner: ironBanner,
  heavy_metal_core: heavyMetalCore,
  chaos_pendulum: chaosPendulum,
  crimson_grail: crimsonGrail,
  arithmetic_gauge: arithmeticGauge,
  mirror_prism: mirrorPrism,
  elemental_resonator: elementalResonator,
  perfectionist,
  emergency_hourglass: emergencyHourglass,
  vampire_fangs: vampireFangs,
  black_market_contract: blackMarketContract,
  scrap_yard: scrapYard,
  sixth_finger: sixthFinger,
  quantum_observer: quantumObserver,
  limit_breaker: limitBreaker,
  schrodinger_bag: schrodingerBag,
};

export const RELICS_BY_RARITY: Record<string, Relic[]> = {
  common: [grindstone, heavyMetalCore, chaosPendulum],
  uncommon: [ironBanner, emergencyHourglass, blackMarketContract, scrapYard],
  rare: [crimsonGrail, arithmeticGauge, mirrorPrism, vampireFangs, schrodingerBag],
  legendary: [elementalResonator, perfectionist, sixthFinger, quantumObserver, limitBreaker],
};

/** 获取遗物奖励池 */
export const getRelicRewardPool = (battleType: 'enemy' | 'elite' | 'boss'): Relic[] => {
  switch (battleType) {
    case 'enemy':
      return [...RELICS_BY_RARITY.common, ...RELICS_BY_RARITY.uncommon];
    case 'elite':
      return [...RELICS_BY_RARITY.uncommon, ...RELICS_BY_RARITY.rare];
    case 'boss':
      return [...RELICS_BY_RARITY.rare, ...RELICS_BY_RARITY.legendary];
  }
};

/** 随机抽取N个不重复遗物 */
export const pickRandomRelics = (pool: Relic[], count: number, owned: string[] = []): Relic[] => {
  const available = pool.filter(r => !owned.includes(r.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};