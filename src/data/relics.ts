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
  description: '点数和为奇数时+12伤害；偶数时回复3HP并净化1个负面状态',
  icon: 'pendulum',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => {
    const sum = ctx.pointSum || 0;
    return sum % 2 === 1 ? { damage: 12 } : { heal: 3, purifyDebuff: 1 };
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
  description: '普通攻击时，点数总和≥15后每颗骰子基础伤害+3',
  icon: 'blade',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.handType === '普通攻击' && (ctx.pointSum || 0) >= 15) ? (ctx.diceCount || 0) * 3 : 0,
  }),
};

// ============================================================
// 体系二：倍率起飞类
// ============================================================

const crimsonGrail: Relic = {
  id: 'crimson_grail',
  name: '猩红圣杯',
  description: '损失HP比例转化为最终伤害倍率(最高180%)',
  icon: 'grail',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const hpPercent = (ctx.currentHp || 100) / (ctx.maxHp || 100);
    const lostPercent = 1 - hpPercent;
    const mult = 1 + Math.min(0.8, lostPercent * 1.5);
    return { multiplier: mult };
  },
};

const arithmeticGauge: Relic = {
  id: 'arithmetic_gauge',
  name: '等差数列仪',
  description: '打出顺子时，长度每+1，倍率翻倍(3顺=150%, 4顺=200%, 5顺=300%, 6顺=500%)',
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
  description: '本场战斗打出过3种不同元素时，所有伤害250%，且每次出牌净化全部负面状态',
  icon: 'resonator',
  rarity: 'legendary',
  trigger: 'on_play',
  effect: (ctx) => ({
    multiplier: (ctx.elementsUsedThisBattle?.size || 0) >= 3 ? 2.5 : 1,
    purifyDebuff: (ctx.elementsUsedThisBattle?.size || 0) >= 3 ? 99 : 0,
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
  description: '打出对子时，最终伤害150%',
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
  description: '打出连对时，最终伤害180%',
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
  description: '每次出牌：伤害200%，但损失10HP',
  icon: 'blade',
  rarity: 'rare',
  trigger: 'on_play',
  effect: () => ({
    multiplier: 2.0,
    heal: -10,
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
  description: '每回合首次卖血Roll时，获得等同roll出骰子点数的金币（每回合一次）',
  icon: 'contract',
  rarity: 'uncommon',
  trigger: 'on_reroll',
  effect: (ctx) => ({
    goldBonus: ctx.diceValue || 0,
    oncePerTurn: true,
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
  name: '点石成金',
  description: '打出普通攻击时，额外获得5金币',
  icon: 'bag',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => {
    if (ctx.handType === '普通攻击') return { goldBonus: 5 };
    return {};
  },
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
  description: '每次出牌时，随机复制1颗已选骰子的点数作为额外伤害',
  icon: 'eye',
  rarity: 'legendary',
  trigger: 'on_play',
  effect: (ctx) => {
    if ((ctx.diceValues?.length || 0) > 0) {
      const idx = Math.floor(Math.random() * ctx.diceValues!.length);
      return { damage: ctx.diceValues![idx] };
    }
    return {};
  },
};

const limitBreaker: Relic = {
  id: 'limit_breaker',
  name: '狂暴小丑',
  description: '小丑骰子点数上限提升至100（原上限9）',
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
  description: '本场战斗中连续普攻，每次+5伤害且倍率+15%（非普攻重置，战斗结束重置）',
  icon: 'blade',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.handType === '普通攻击') ? (ctx.consecutiveNormalAttacks || 0) * 5 : 0,
    multiplier: (ctx.handType === '普通攻击') ? 1 + (ctx.consecutiveNormalAttacks || 0) * 0.15 : 1,
  }),
};

// ============================================================
// 遗物注册表
// ============================================================

// 体系五：环层塔地图类
// ============================================================

/** 导航罗盘 - 每移动3步，下场战斗首次出牌+8伤害+5护甲 */
const navigatorCompass: Relic = {
  id: 'navigator_compass',
  name: '导航罗盘',
  description: '每移动3步，下场战斗首次出牌+8伤害+5护甲',
  icon: 'gear',
  rarity: 'common',
  trigger: 'on_move',
  effect: () => ({ damage: 8, armor: 5 }),
  counter: 0,
  maxCounter: 3,
  counterLabel: '步',
};

/** 点数统计器 - 每回合自动获得3护甲，每过6层多+1护甲 */
const pointAccumulator: Relic = {
  id: 'point_accumulator',
  name: '点数统计器',
  description: '每次出牌获得3护甲，每通过6层额外+1护甲（成长型）',
  icon: 'layers',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => {
    const layerBonus = Math.floor((ctx.currentDepth || 0) / 6);
    return { armor: 3 + layerBonus };
  },
  counter: 0,
  counterLabel: '层',
};

/** 层厅征服者 - 每通过1层战斗节点，出牌时永久+2基础伤害 */
const floorConqueror: Relic = {
  id: 'floor_conqueror',
  name: '层厅征服者',
  description: '每通过1层战斗节点，出牌时永久+2基础伤害（累计叠加）',
  icon: 'crown',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => ({ damage: (ctx.floorsCleared || 0) * 2 }),
  counter: 0,
  counterLabel: '层',
};


// ============================================================
// 体系六：增幅转化遗物（从增幅模块合并）
// ============================================================

/** 治愈之风 - 每次出牌回复3HP */
const healingBreeze: Relic = {
  id: 'healing_breeze',
  name: '治愈之风',
  description: '每次出牌回复3HP',
  icon: 'grail',
  rarity: 'common',
  trigger: 'on_play',
  effect: () => ({ heal: 3 }),
};

/** 磨砺石(增强版) - 每次出牌额外造成8伤害 */
const sharpEdgeRelic: Relic = {
  id: 'sharp_edge_relic',
  name: '磨砺石',
  description: '每次出牌额外造成8点伤害',
  icon: 'blade',
  rarity: 'common',
  trigger: 'on_play',
  effect: () => ({ damage: 8 }),
};

/** 幸运铜板 - 每次出牌额外获得2金币 */
const luckyCoinRelic: Relic = {
  id: 'lucky_coin_relic',
  name: '幸运铜板',
  description: '每次出牌额外获得2金币',
  icon: 'bag',
  rarity: 'common',
  trigger: 'on_play',
  effect: () => ({ goldBonus: 2 }),
};

/** 厚皮兽甲 - 打出对子时获得10护甲 */
const thickHideRelic: Relic = {
  id: 'thick_hide_relic',
  name: '厚皮兽甲',
  description: '打出对子时获得10护甲',
  icon: 'blade',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => ({
    armor: ctx.handType === '对子' ? 10 : 0,
  }),
};

/** 余烬暖石 - 打出对子时回复4HP+获得5护甲+净化 */
const warmEmberRelic: Relic = {
  id: 'warm_ember_relic',
  name: '余烬暖石',
  description: '打出对子时回复4HP、获得5护甲，并净化1个负面状态',
  icon: 'grail',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    heal: ctx.handType === '对子' ? 4 : 0,
    armor: ctx.handType === '对子' ? 5 : 0,
    purifyDebuff: ctx.handType === '对子' ? 1 : 0,
  }),
};

/** 寻宝直觉 - 打出顺子时额外获得15金币 */
const treasureSenseRelic: Relic = {
  id: 'treasure_sense_relic',
  name: '寻宝直觉',
  description: '打出顺子时额外获得15金币',
  icon: 'bag',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    return ht.includes('顺') ? { goldBonus: 15 } : {};
  },
};

/** 点金之手 - 打出多条时额外获得点数和×2金币 */
const goldenTouchRelic: Relic = {
  id: 'golden_touch_relic',
  name: '点金之手',
  description: '打出三条/四条/五条时额外获得点数和×2金币',
  icon: 'bag',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    if (ht === '三条' || ht === '四条' || ht === '五条') {
      return { goldBonus: (ctx.pointSum || 0) * 2 };
    }
    return {};
  },
};

/** 讨价还价 - 商店消耗减少20% */
const hagglerRelic: Relic = {
  id: 'haggler_relic',
  name: '讨价还价',
  description: '商店所有物品价格降低20%',
  icon: 'bag',
  rarity: 'uncommon',
  trigger: 'passive',
  effect: () => ({ shopDiscount: 0.2 }),
};

/** 元素过载 - 同元素出牌时伤害×2.2 */
const elementOverloadRelic: Relic = {
  id: 'element_overload_relic',
  name: '元素过载',
  description: '打出同元素牌型时，最终伤害220%',
  icon: 'resonator',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    return ht.includes('元素') ? { multiplier: 2.2 } : {};
  },
};

/** 葫芦爆裂 - 葫芦时额外伤害+护甲 */
const fullHouseBlastRelic: Relic = {
  id: 'full_house_blast_relic',
  name: '葫芦爆裂',
  description: '打出葫芦时额外造成点数和250%伤害并获得10护甲',
  icon: 'blade',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    if (ctx.handType === '葫芦') {
      return { damage: Math.floor((ctx.pointSum || 0) * 2.5), armor: 10 };
    }
    return {};
  },
};

/** 连锁闪电 - 顺子时额外伤害+灼烧 */
const chainLightningRelic: Relic = {
  id: 'chain_lightning_relic',
  name: '连锁闪电',
  description: '打出顺子时额外造成点数和150%伤害并附加2层灼烧',
  icon: 'prism',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    if (ht.includes('顺')) {
      return {
        damage: Math.floor((ctx.pointSum || 0) * 1.5),
        statusEffects: [{ type: 'burn' as const, value: 2 }],
      };
    }
    return {};
  },
};

/** 霜冻屏障 - 葫芦时15护甲+虚弱2 */
const frostBarrierRelic: Relic = {
  id: 'frost_barrier_relic',
  name: '霜冻屏障',
  description: '打出葫芦时获得15护甲并使敌人虚弱2层',
  icon: 'blade',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    if (ctx.handType === '葫芦') {
      return {
        armor: 15,
        statusEffects: [{ type: 'weak' as const, value: 2 }],
      };
    }
    return {};
  },
};

/** 灵魂收割 - 多条时伤害+回血 */
const soulHarvestRelic: Relic = {
  id: 'soul_harvest_relic',
  name: '灵魂收割',
  description: '打出三条/四条/五条时额外造成点数和200%伤害并回复点数和50%HP',
  icon: 'fangs',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    if (ht === '三条' || ht === '四条' || ht === '五条') {
      const sum = ctx.pointSum || 0;
      return { damage: Math.floor(sum * 2), heal: Math.floor(sum * 0.5) };
    }
    return {};
  },
};

/** 压力点 - 顺子时穿透+易伤 */
const pressurePointRelic: Relic = {
  id: 'pressure_point_relic',
  name: '压力点',
  description: '打出顺子时造成10穿透伤害并附加1层易伤',
  icon: 'blade',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const ht = ctx.handType || '';
    if (ht.includes('顺')) {
      return {
        pierce: 10,
        statusEffects: [{ type: 'vulnerable' as const, value: 1 }],
      };
    }
    return {};
  },
};

/** 基本直觉 - 普攻额外伤害 */
const basicInstinctRelic: Relic = {
  id: 'basic_instinct_relic',
  name: '基本直觉',
  description: '普通攻击时额外造成点数和150%伤害',
  icon: 'blade',
  rarity: 'common',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: ctx.handType === '普通攻击' ? Math.floor((ctx.pointSum || 0) * 1.5) : 0,
  }),
};

/** 连击本能 - 普攻倍率×1.4 */
const rapidStrikesRelic: Relic = {
  id: 'rapid_strikes_relic',
  name: '连击本能',
  description: '普通攻击时最终伤害140%',
  icon: 'blade',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    multiplier: ctx.handType === '普通攻击' ? 1.4 : 1,
  }),
};

/** 血之契约 - 普攻大伤害但扣HP */
const bloodPactRelic: Relic = {
  id: 'blood_pact_relic',
  name: '血之契约',
  description: '普通攻击时额外造成点数和×2伤害，但损失3HP',
  icon: 'fangs',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: ctx.handType === '普通攻击' ? Math.floor((ctx.pointSum || 0) * 2) : 0,
    heal: ctx.handType === '普通攻击' ? -3 : 0,
  }),
};

/** 极简主义 - 单骰出牌大伤害 */
const minimalistRelic: Relic = {
  id: 'minimalist_relic',
  name: '极简主义',
  description: '只选1颗骰子出牌时，+15伤害且伤害200%',
  icon: 'diamond',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.selectedDiceCount || ctx.diceCount || 0) === 1 ? 15 : 0,
    multiplier: (ctx.selectedDiceCount || ctx.diceCount || 0) === 1 ? 2.0 : 1,
  }),
};

/** 血骰契约 - 每次重Roll伤害倍率+0.2（超模→rare） */
const bloodDiceRelic: Relic = {
  id: 'blood_dice_relic',
  name: '血骰契约',
  description: '每次出牌时，本回合每次重Roll使伤害倍率+20%',
  icon: 'fangs',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => ({
    multiplier: 1 + (ctx.rerollsThisTurn || 0) * 0.2,
  }),
};

/** 净化圣水 - 出牌时移除玩家1个负面状态 */
const purifyWaterRelic: Relic = {
  id: 'purify_water_relic',
  name: '净化圣水',
  description: '每次出牌时，随机移除1个负面状态（虚弱/易伤/中毒/灼烧）',
  icon: 'grail',
  rarity: 'rare',
  trigger: 'on_play',
  effect: () => ({ purifyDebuff: 1 }),
};

/** 肾上腺素 - HP越低倍率越高 */
const adrenalineRushRelic: Relic = {
  id: 'adrenaline_rush_relic',
  name: '肾上腺素',
  description: 'HP越低伤害倍率越高(70%→120%, 50%→150%, 30%→200%)',
  icon: 'grail',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    const hpPercent = (ctx.currentHp || 100) / (ctx.maxHp || 100);
    const bonus = hpPercent < 0.3 ? 2.0 : hpPercent < 0.5 ? 1.5 : hpPercent < 0.7 ? 1.2 : 1.0;
    return { multiplier: bonus };
  },
};

/** 狂掷风暴 - 每次重Roll额外+12伤害 */
const rerollFrenzyRelic: Relic = {
  id: 'reroll_frenzy_relic',
  name: '狂掷风暴',
  description: '每次出牌时，本回合每次重Roll额外+12伤害',
  icon: 'blade',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => ({
    damage: (ctx.rerollsThisTurn || 0) * 12,
  }),
};

/** 骰子大师 - 每回合额外抽1颗骰子 */
const diceMasterRelic: Relic = {
  id: 'dice_master_relic',
  name: '骰子大师',
  description: '打出≥3颗骰子的牌型时，基础伤害+15，倍率130%',
  icon: 'eye',
  rarity: 'legendary',
  trigger: 'on_play',
  effect: (ctx) => {
    if ((ctx.diceCount || 0) >= 3) {
      return { damage: 15, multiplier: 1.3 };
    }
    return {};
  },
};

/** 命运之轮 - 每回合额外1次免费重Roll */
const fortuneWheelRelic: Relic = {
  id: 'fortune_wheel_relic',
  name: '命运之轮',
  description: '每次出牌时，本回合每次重Roll额外+8伤害(可叠加)',
  icon: 'gear',
  rarity: 'legendary',
  trigger: 'on_play',
  effect: (ctx) => {
    const rerolls = ctx.rerollsThisTurn || 0;
    if (rerolls > 0) {
      return { damage: rerolls * 8 };
    }
    return {};
  },
};

/** 战场急救 - 击杀敌人时回复8HP */
const battleMedicRelic: Relic = {
  id: 'battle_medic_relic',
  name: '战场急救',
  description: '击杀敌人时回复8HP',
  icon: 'grail',
  rarity: 'uncommon',
  trigger: 'on_kill',
  effect: () => ({ heal: 8 }),
};

/** 怒火燎原 - 每次受到伤害后，下次出牌伤害+15 */
const rageFireRelic: Relic = {
  id: 'rage_fire_relic',
  name: '怒火燎原',
  description: '受到伤害后，下次出牌额外+15伤害',
  icon: 'blade',
  rarity: 'uncommon',
  trigger: 'on_damage_taken',
  effect: () => ({ damage: 15 }),
};

/** 藏宝图 - 宝箱节点额外获得15金币 */
const treasureMapRelic: Relic = {
  id: 'treasure_map_relic',
  name: '藏宝图',
  description: '每次移动到宝箱节点时额外获得15金币',
  icon: 'bag',
  rarity: 'common',
  trigger: 'on_move',
  effect: () => ({ goldBonus: 15 }),
};


/** 降维打击 - 构成顺子所需的骰子数量-1（规则改变型遗物） */
const dimensionCrush: Relic = {
  id: 'dimension_crush',
  name: '降维打击',
  icon: 'compress',
  description: '\u89E6\u53D1\u987A\u5B50\u65F6\uFF0C\u987A\u5B50\u6570\u91CF+1\uFF083\u987A\u53D84\u987A\uFF0C\u4EE5\u6B64\u7C7B\u63A8\uFF09',
  rarity: 'legendary',
  trigger: 'passive',
  effect: () => ({ straightUpgrade: 1 }),
};


/** 万象归一 - 所有对子视为三条 (规则改变型) */
const universalPair: Relic = {
  id: 'universal_pair',
  name: '万象归一',
  icon: 'prism',
  description: '对子视为三条结算（倍率按三条计算）',
  rarity: 'legendary',
  trigger: 'passive',
  effect: () => ({ pairAsTriplet: true }),
};

/** 混沌骰面 - 每回合第一次重投时，所有骰子+1点 (规则改变型) */
const chaosFace: Relic = {
  id: 'chaos_face',
  name: '混沌骰面',
  icon: 'dice',
  description: '每回合第一次重投时，所有手中骰子点数+1（6不变）',
  rarity: 'rare',
  trigger: 'passive',
  effect: () => ({ rerollPointBoost: 1 }),
};

/** 贪婪之手 - 每回合额外抽1颗骰子 (规则改变型) */
const greedyHand: Relic = {
  id: 'greedy_hand',
  name: '贪婪之手',
  icon: 'hand',
  description: '打出≥4颗骰子的牌型时，基础伤害+20',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    if ((ctx.diceCount || 0) >= 4) {
      return { damage: 20 };
    }
    return {};
  },
};

/** 双重打击 - 每回合额外1次出牌机会 (规则改变型) */
const doubleStrike: Relic = {
  id: 'double_strike',
  name: '双重打击',
  icon: 'bolt',
  description: '每回合额外获得1次出牌机会',
  rarity: 'legendary',
  trigger: 'passive',
  effect: () => ({ extraPlay: 1 }),
};

/** 命运硬币 - 每回合额外1次免费重投 (规则改变型) */
const fateCoin: Relic = {
  id: 'fate_coin',
  name: '命运硬币',
  icon: 'coin',
  description: '本回合重投≥2次后出牌，倍率150%',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    if ((ctx.rerollsThisTurn || 0) >= 2) {
      return { multiplier: 1.5 };
    }
    return {};
  },
};

/** 元素亲和 - 普通骰子有30%概率获得随机元素 (规则改变型) */
const elementAffinity: Relic = {
  id: 'element_affinity',
  name: '元素亲和',
  icon: 'crystal',
  description: '普通骰子抽取时有30%概率获得随机元素',
  rarity: 'rare',
  trigger: 'passive',
  effect: () => ({ normalElementChance: 0.3 }),
};

/** 完美主义者改 - 全部相同点数时额外x1.5 (规则改变型) */
const symmetrySeeker: Relic = {
  id: 'symmetry_seeker',
  name: '对称追求者',
  icon: 'diamond',
  description: '出牌时若所有骰子点数相同，额外150%倍率',
  rarity: 'rare',
  trigger: 'on_play',
  effect: (ctx) => {
    if (!ctx || !ctx.diceValues || ctx.diceValues.length === 0) return {};
    const allSame = ctx.diceValues.every((v: number) => v === ctx.diceValues![0]);
    return allSame ? { multiplier: 1.5 } : {};
  },
};
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
  // 环层塔地图类
  navigator_compass: navigatorCompass,
  point_accumulator: pointAccumulator,
  floor_conqueror: floorConqueror,
  // 增幅转化遗物
  healing_breeze: healingBreeze,
  sharp_edge_relic: sharpEdgeRelic,
  lucky_coin_relic: luckyCoinRelic,
  thick_hide_relic: thickHideRelic,
  warm_ember_relic: warmEmberRelic,
  treasure_sense_relic: treasureSenseRelic,
  golden_touch_relic: goldenTouchRelic,
  haggler_relic: hagglerRelic,
  element_overload_relic: elementOverloadRelic,
  full_house_blast_relic: fullHouseBlastRelic,
  chain_lightning_relic: chainLightningRelic,
  frost_barrier_relic: frostBarrierRelic,
  soul_harvest_relic: soulHarvestRelic,
  pressure_point_relic: pressurePointRelic,
  basic_instinct_relic: basicInstinctRelic,
  rapid_strikes_relic: rapidStrikesRelic,
  blood_pact_relic: bloodPactRelic,
  minimalist_relic: minimalistRelic,
  blood_dice_relic: bloodDiceRelic,
  purify_water_relic: purifyWaterRelic,
  adrenaline_rush_relic: adrenalineRushRelic,
  reroll_frenzy_relic: rerollFrenzyRelic,
  dice_master_relic: diceMasterRelic,
  fortune_wheel_relic: fortuneWheelRelic,
  battle_medic_relic: battleMedicRelic,
  rage_fire_relic: rageFireRelic,
  treasure_map_relic: treasureMapRelic,
  dimension_crush: dimensionCrush,
  universal_pair: universalPair,
  chaos_face: chaosFace,
  greedy_hand: greedyHand,
  double_strike: doubleStrike,
  fate_coin: fateCoin,
  element_affinity: elementAffinity,
  symmetry_seeker: symmetrySeeker,
};

/** 少即是多 - 低点数骰子倍率加成 */
const lessIsMoreRelic: Relic = {
  id: 'less_is_more_relic',
  name: '少即是多',
  description: '出牌时每有1颗3点及以下的骰子，倍率×120%',
  icon: 'less_is_more',
  rarity: 'uncommon',
  trigger: 'on_play',
  effect: (ctx) => {
    const lowCount = (ctx.diceValues || []).filter(v => v <= 3).length;
    if (lowCount === 0) return {};
    return { multiplier: Math.pow(1.2, lowCount) };
  },
};

export const RELICS_BY_RARITY: Record<string, Relic[]> = {
  common: [grindstone, heavyMetalCore, chaosPendulum, ironSkinRelic, scattershotRelic, merchantsEyeRelic, navigatorCompass, healingBreeze, sharpEdgeRelic, luckyCoinRelic, thickHideRelic, basicInstinctRelic, treasureMapRelic],
  uncommon: [ironBanner, blackMarketContract, scrapYard, twinStarsRelic, voidEchoRelic, warProfiteerRelic, interestRelic, comboMasterRelic, pointAccumulator, warmEmberRelic, treasureSenseRelic, goldenTouchRelic, hagglerRelic, rapidStrikesRelic, bloodPactRelic, rerollFrenzyRelic, battleMedicRelic, rageFireRelic, lessIsMoreRelic],
  rare: [crimsonGrail, arithmeticGauge, mirrorPrism, vampireFangs, schrodingerBag, emergencyHourglass, glassCannonRelic, painAmplifierRelic, masochistRelic, floorConqueror, elementOverloadRelic, fullHouseBlastRelic, chainLightningRelic, frostBarrierRelic, soulHarvestRelic, pressurePointRelic, minimalistRelic, adrenalineRushRelic, symmetrySeeker, chaosFace, greedyHand, fateCoin, elementAffinity, bloodDiceRelic, purifyWaterRelic],
  legendary: [elementalResonator, perfectionist, overflowConduit, quantumObserver, limitBreaker, diceMasterRelic, fortuneWheelRelic, dimensionCrush, universalPair, doubleStrike],
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