/**
 * relics.ts - 遗物定义表（统一遗物池）
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
  description: '打出≤2颗骰子的牌型时，额外+12基础伤害',
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
  description: '本回合每次卖血Roll，下次出牌+6基础伤害(可叠加)',
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

const ironSkinRelic: Relic = {
  id: 'iron_skin_relic',
  name: '铁皮护符',
  description: '每次出牌获得5点护甲',
  icon: 'blade',
  rarity: 'common',
  trigger: 'on_play',
  effect: () => ({ armor: 5 }),
};

const scattershotRelic: Relic = {
  id: 'scattershot_relic',
  name: '散射弹幕',
  description: '普通攻击时，每颗选中骰子额外+4伤害',
  icon: 'blade',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.handType === '普通攻击') ? (ctx.diceCount || 0) * 4 : 0,
  }),
};

// ============================================================
// 体系二：倍率起飞类
// ============================================================

const crimsonGrail: Relic = {
  id: 'crimson_grail',
  name: '猩红圣杯',
  description: '损失HP比例转化为最终伤害倍率(最高x2.5)',
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
  description: '打出葫芦/四条/五条且无特殊骰子(纯白杆)时，伤害x4',
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

const twinStarsRelic: Relic = {
  id: 'twin_stars_relic',
  name: '双子星',
  description: '打出对子时，最终伤害x1.5',
  icon: 'diamond',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    multiplier: (ctx.handType === '对子') ? 1.5 : 1,
  }),
};

const voidEchoRelic: Relic = {
  id: 'void_echo_relic',
  name: '虚空回响',
  description: '打出连对时，最终伤害x1.8',
  icon: 'diamond',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    multiplier: (ctx.handType === '连对') ? 1.8 : 1,
  }),
};

const glassCannonRelic: Relic = {
  id: 'glass_cannon_relic',
  name: '玻璃大炮',
  description: '每次出牌：伤害x2.0，但损失4HP',
  icon: 'blade',
  rarity: 'rare',
  trigger: 'on_play',
  effect: () => ({
    multiplier: 2.0,
    heal: -4,
  }),
};

// ============================================================
// 体系三：经济与续航类
// ============================================================

const emergencyHourglass: Relic = {
  id: 'emergency_hourglass',
  name: '急救沙漏',
  description: '免疫一次致命伤害，当你即将死亡时，完全无视这次伤害(15节点CD)',
  icon: 'hourglass',
  rarity: 'rare',
  trigger: 'on_fatal',
  counter: 0,
  maxCounter: 15,
  counterLabel: '节点',
  effect: () => ({ preventDeath: true }),
};

const vampireFangs: Relic = {
  id: 'vampire_fangs',
  name: '吸血鬼假牙',
  description: '击杀时溢出伤害的25%转化为生命恢复',
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
  description: '每次卖血Roll时，获得等同扣血值的金币',
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
    goldBonus: ((ctx.cursedDiceInHand || 0) + (ctx.crackedDiceInHand || 0)) * 8,
  }),
};

const merchantsEyeRelic: Relic = {
  id: 'merchants_eye_relic',
  name: '商人之眼',
  description: '每次出牌额外获得3金币',
  icon: 'bag',
  rarity: 'common',
  trigger: 'on_play',
  effect: () => ({ goldBonus: 3 }),
};

const warProfiteerRelic: Relic = {
  id: 'war_profiteer_relic',
  name: '战争商人',
  description: '每击杀一个敌人，本场战斗每次出牌额外+5金币',
  icon: 'bag',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    goldBonus: (ctx.enemiesKilledThisBattle || 0) * 5,
  }),
};

const interestRelic: Relic = {
  id: 'interest_relic',
  name: '利息存款',
  description: '每场战斗结束时，每10金币产生1金币利息',
  icon: 'bag',
  rarity: 'uncommon',
  trigger: 'on_battle_end',
  effect: (ctx) => ({
    goldBonus: Math.floor((ctx.currentGold || 0) / 10),
  }),
};

const painAmplifierRelic: Relic = {
  id: 'pain_amplifier_relic',
  name: '痛觉放大器',
  description: '每次出牌：本场战斗已损失HP的15%转化为额外伤害',
  icon: 'blade',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: Math.floor((ctx.hpLostThisBattle || 0) * 0.15),
  }),
};

const masochistRelic: Relic = {
  id: 'masochist_relic',
  name: '受虐狂',
  description: '每次出牌：本回合损失HP的50%转化为护甲，20%回复',
  icon: 'blade',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => ({
    armor: Math.floor((ctx.hpLostThisTurn || 0) * 0.5),
    heal: Math.floor((ctx.hpLostThisTurn || 0) * 0.2),
  }),
};

// ============================================================
// 体系四：机制突变类
// ============================================================

const overflowConduit: Relic = {
  id: 'overflow_conduit',
  name: '溢出导管',
  description: '击杀敌人时，溢出伤害转移给另一个随机敌人',
  icon: 'prism',
  rarity: 'legendary',
  trigger: 'on_kill',
  effect: (ctx) => ({
    overflowDamage: ctx.overkillDamage || 0,
  }),
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
  description: '小丑骰子最大点数解锁(不再受限于9)',
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

const comboMasterRelic: Relic = {
  id: 'combo_master_relic',
  name: '连招大师',
  description: '连续使用普攻，每次伤害+5且倍率+0.1（非普攻出牌重置）',
  icon: 'blade',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.handType === '普通攻击') ? (ctx.consecutiveNormalAttacks || 0) * 5 : 0,
    multiplier: (ctx.handType === '普通攻击') ? 1 + (ctx.consecutiveNormalAttacks || 0) * 0.1 : 1,
  }),
};

// ============================================================
// 遗物注册表
// ============================================================

export const ALL_RELICS: Record<string, Relic> = {
  // 基础打工
  grindstone,
  iron_banner: ironBanner,
  heavy_metal_core: heavyMetalCore,
  chaos_pendulum: chaosPendulum,
  iron_skin_relic: ironSkinRelic,
  scattershot_relic: scattershotRelic,
  // 倍率起飞
  crimson_grail: crimsonGrail,
  arithmetic_gauge: arithmeticGauge,
  mirror_prism: mirrorPrism,
  elemental_resonator: elementalResonator,
  perfectionist,
  twin_stars_relic: twinStarsRelic,
  void_echo_relic: voidEchoRelic,
  glass_cannon_relic: glassCannonRelic,
  // 经济续航
  emergency_hourglass: emergencyHourglass,
  vampire_fangs: vampireFangs,
  black_market_contract: blackMarketContract,
  scrap_yard: scrapYard,
  merchants_eye_relic: merchantsEyeRelic,
  war_profiteer_relic: warProfiteerRelic,
  interest_relic: interestRelic,
  pain_amplifier_relic: painAmplifierRelic,
  masochist_relic: masochistRelic,
  // 机制突变
  overflow_conduit: overflowConduit,
  quantum_observer: quantumObserver,
  limit_breaker: limitBreaker,
  schrodinger_bag: schrodingerBag,
  combo_master_relic: comboMasterRelic,
};

export const RELICS_BY_RARITY: Record<string, Relic[]> = {
  common: [grindstone, heavyMetalCore, chaosPendulum, ironSkinRelic, scattershotRelic, merchantsEyeRelic],
  uncommon: [ironBanner, blackMarketContract, scrapYard, twinStarsRelic, voidEchoRelic, warProfiteerRelic, interestRelic, comboMasterRelic],
  rare: [crimsonGrail, arithmeticGauge, mirrorPrism, vampireFangs, schrodingerBag, emergencyHourglass, glassCannonRelic, painAmplifierRelic, masochistRelic],
  legendary: [elementalResonator, perfectionist, overflowConduit, quantumObserver, limitBreaker],
};

/** 获取遗物奖励池 */
export const getRelicRewardPool = (source: 'elite' | 'boss' | 'treasure' | 'merchant' | 'event'): Relic[] => {
  switch (source) {
    case 'elite':
    case 'treasure':
    case 'merchant':
    case 'event':
      return [...RELICS_BY_RARITY.common, ...RELICS_BY_RARITY.uncommon, ...RELICS_BY_RARITY.rare];
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
