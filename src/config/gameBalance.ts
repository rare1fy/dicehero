/**
 * gameBalance.ts - 游戏平衡数值配置表
 * 
 * 所有关于影响游戏平衡的数值配置。
 * 修改此文件可以调整游戏难度和节奏，无需改动逻辑代码。
 */

// ============================================================
// 玩家初始配置
// ============================================================
export const PLAYER_INITIAL = {
  hp: 100,
  maxHp: 100,
  armor: 0,
  freeRerollsPerTurn: 1,  // 2次免费重投
  globalRerolls: 0,
  playsPerTurn: 1,
  souls: 0,
  relicSlots: 5,
  drawCount: 3,       // 初始抽3个骰子
  maxDrawCount: 6,
} as const;

// ============================================================
// 战斗数值缩放 - 层级系数（精确控制每层难度曲线）
// ============================================================

/** 层级难度系数，精确控制每层的倍率，确保精准的每层难度 */
export const DEPTH_SCALING: { hpMult: number; dmgMult: number }[] = [
  { hpMult: 0.90, dmgMult: 0.40 },  // depth 0: 教学关，轻松过
  { hpMult: 1.10, dmgMult: 0.50 },  // depth 1: 稍有肉感
  { hpMult: 1.25, dmgMult: 0.60 },  // depth 2: 开始有压力
  { hpMult: 1.50, dmgMult: 0.75 },  // depth 3: 精英层
  { hpMult: 1.20, dmgMult: 0.65 },  // depth 4: 精英后休息
  { hpMult: 1.40, dmgMult: 0.80 },  // depth 5: 热身完毕
  { hpMult: 1.20, dmgMult: 0.70 },  // depth 6: 营火前缓冲
  { hpMult: 1.80, dmgMult: 1.00 },  // depth 7: 中期Boss
  { hpMult: 1.10, dmgMult: 0.60 },  // depth 8: Boss后恢复期
  { hpMult: 1.40, dmgMult: 0.80 },  // depth 9: 重新热身
  { hpMult: 1.60, dmgMult: 0.90 },  // depth 10: 后期开始
  { hpMult: 1.80, dmgMult: 1.00 },  // depth 11: 后期巅峰
  { hpMult: 2.00, dmgMult: 1.10 },  // depth 12: pre-boss精英层
  { hpMult: 1.30, dmgMult: 0.80 },  // depth 13: 营火前缓冲
  { hpMult: 2.50, dmgMult: 1.30 },  // depth 14: 最终Boss
];

/** 获取指定层级的缩放系数 */
export const getDepthScaling = (depth: number): { hpMult: number; dmgMult: number } => {
  if (depth < 0) return { hpMult: 0.90, dmgMult: 0.80 };
  if (depth >= DEPTH_SCALING.length) return DEPTH_SCALING[DEPTH_SCALING.length - 1];
  return DEPTH_SCALING[depth];
};

// 保留旧接口兼容（部分代码可能还在用）
export const BATTLE_SCALING = {
  hpPerDepth: 0.15,
  dmgPerDepth: 0.10,
} as const;

// ============================================================
// 商店配置
export const SHOP_CONFIG = {
  /** 商店遗物数量 */
  relicCount: 3,
  /** 商品价格范围 [min, max] */
  priceRange: [20, 80] as [number, number],
  /** 删除骰子固定价格 */
  removeDicePrice: 30,
  /** 固定商品列表（重投强化已移至遗物池随机产出） */
  fixedItems: [
    { id: 'removeDice', type: 'removeDice' as const, label: '骰子净化', desc: '移除一个骰子，精简构筑' },
  ],
} as const;

// ============================================================
// 骰子奖励刷新配置
// ============================================================
export const DICE_REWARD_REFRESH = {
  /** 刷新基础价格（金币） */
  basePrice: 5,
  /** 价格倍率（每次刷新乘以此值） */
  priceMultiplier: 2,
  /** 首次免费 */
  firstFree: true,
} as const;


// ============================================================
// 营火配置
// ============================================================
export const CAMPFIRE_CONFIG = {
  /** 休息恢复量 */
  restHeal: 40,
  /** 模块强化费用系数: cost = level * costPerLevel */
  upgradeCostPerLevel: 20,
  /** 模块最大等级 */
  maxRelicLevel: 5,
} as const;

// ============================================================
// 战利品 / 掉落配置
// ============================================================
export const LOOT_CONFIG = {
  /** 普通战斗掉落金币 */
  normalDropGold: 25,
  /** 精英战斗掉落金币 */
  eliteDropGold: 50,
  /** Boss掉落金币 */
  bossDropGold: 80,
  /** 增幅选择数量 */
  relicChoiceCount: 3,
  /** 精英额外奖励 */
  /** 精英额外奖励：40%概率获得+1每回合重投，60%获得金币 */
  eliteRewards: [
    { type: 'freeRerollPerTurn' as const, value: 1, label: '+1 每回合重投' },
    { type: 'gold' as const, value: 40, label: '+40 金币' },
    { type: 'gold' as const, value: 40, label: '+40 金币' },
    { type: 'gold' as const, value: 50, label: '+50 金币' },
  ],
} as const;

// ============================================================
// 地图配置
// ============================================================
export const MAP_CONFIG = {
  /** 总层数 */
  totalLayers: 15,
  /** 中期Boss所在层 */
  midBossLayer: 7,
  /** Boss前休息层（已融入发散节点，此字段保留兼容） */
  restBeforeBossLayers: [6, 13],
  /** 固定层配置 */
  fixedLayers: {
    0: { type: 'enemy' as const, count: 1 },   // 第零层教学战
    1: { type: null, count: 3 },                // 初期分路
    2: { type: null, count: 5 },                // 扩散层
    3: { type: null, count: 3 },                // 风险层（可出精英，不强制）
    4: { type: null, count: 4 },                // 中期发散（可随机出营火）
    5: { type: null, count: 5 },                // 扩散层
    6: { type: null, count: 4 },                // Boss前发散（保证含营火）
    7: { type: 'boss' as const, count: 1 },     // 中Boss
    8: { type: null, count: 3 },                // Boss后再分路
    9: { type: null, count: 5 },                // 扩散层
    10: { type: null, count: 5 },               // 中后期风险层
    11: { type: null, count: 4 },               // 后期发散（可随机出营火）
    12: { type: null, count: 5 },               // 压力层
    13: { type: null, count: 4 },               // Boss前发散（保证含营火）
    14: { type: 'boss' as const, count: 1 },    // 最终Boss
  } as Record<number, { type: string | null; count: number }>,
  /** 随机层节点数范围 [min, max]（仅fallback） */
  randomLayerNodeRange: [2, 4] as [number, number],
  /** 节点类型权重（仅fallback，主要用层模板） */
  nodeTypeWeights: [
    { type: 'elite' as const, cumWeight: 0.10 },
    { type: 'campfire' as const, cumWeight: 0.22 },
    { type: 'treasure' as const, cumWeight: 0.32 },
    { type: 'merchant' as const, cumWeight: 0.44 },
    { type: 'merchant' as const, cumWeight: 0.52 },
    { type: 'event' as const, cumWeight: 0.62 },
    // 剩余概率 = enemy
  ],
} as const;

// ============================================================
// 增幅模块选择
// ============================================================
export const SKILL_SELECT_CONFIG = {
  /** 可选增幅数量 */
  choiceCount: 3,
  /** 代价池 */
  costPool: [
    { type: 'maxHp' as const, value: 8, label: '最大生命 -8' },
    { type: 'maxHp' as const, value: 12, label: '最大生命 -12' },
    { type: 'hp' as const, value: 10, label: '当前生命 -10' },
    { type: 'hp' as const, value: 15, label: '当前生命 -15' },
  ],
} as const;

// ============================================================
// ============================================================
// 战士血怒配置
// ============================================================
export const FURY_CONFIG = {
  /** 每层伤害加成（15% = 0.15） */
  damagePerStack: 0.15,
  /** 最大叠加层数 */
  maxStack: 5,
  /** 叠满后卖血获得的护甲 */
  armorAtCap: 5,
} as const;

// ============================================================
// 章节配置 (5章制，逐章提升难度)
// ============================================================
export const CHAPTER_CONFIG = {
  /** 总章节数 */
  totalChapters: 5,
  /** 章节名称 */
  chapterNames: ['幽暗森林', '冰封山脉', '熔岩深渊', '暗影要塞', '永恒之巅'] as const,
  /** 每章的数值缩放 (HP和伤害) */
  chapterScaling: [
    { hpMult: 1.0, dmgMult: 1.0 },   // 第1章: 基准
    { hpMult: 1.25, dmgMult: 1.15 },  // 第2章: +25% HP, +15% DMG（温和地递增）
    { hpMult: 1.55, dmgMult: 1.30 },  // 第3章: +55% HP, +30% DMG
    { hpMult: 1.90, dmgMult: 1.50 },  // 第4章: +90% HP, +50% DMG
    { hpMult: 2.30, dmgMult: 1.70 },  // 第5章: +130% HP, +70% DMG（最终决花战）
  ],
  /** 每章通关时恢复的HP比例 */
  chapterHealPercent: 0.6,
  /** 每章通关时获得的金币 */
  chapterBonusGold: 75,
} as const;

// ============================================================
// 魂晶系统配置
// ============================================================
export const SOUL_CRYSTAL_CONFIG = {
  /** 基础倍率 */
  baseMult: 1.0,
  /** 每层增加的倍率 */
  multPerDepth: 0.2,
  /** 溢出伤害转化为魂晶的系数（降低后通过商店涨价控制产销比） */
  conversionRate: 0.15,
  /** 获取魂晶的条件描述 */
  description: '击杀敌人时，溢出伤害×倍率×15%=魂晶',
} as const;

/** 计算当前层的魂晶倍率 */
export const getSoulCrystalMult = (depth: number, currentMult: number): number => {
  // 层数成长：基础倍率 + 每层+0.2
  const depthBonus = depth * SOUL_CRYSTAL_CONFIG.multPerDepth;
  return currentMult + depthBonus;
};

// ============================================================
// 状态效果修正系数
// ============================================================
export const STATUS_EFFECT_MULT = {
  /** 虚弱(weak)：攻击力 ×0.75 */
  weak: 0.75,
  /** 易伤(vulnerable)：受到攻击 ×1.5 */
  vulnerable: 1.5,
} as const;

// ============================================================
// 敌人攻击力修正系数
// ============================================================
export const ENEMY_ATTACK_MULT = {
  /** 近战(warrior)攻击倍率 */
  warrior: 1.3,
  /** 远程(ranger)主攻击倍率 */
  rangerHit: 0.40,
  /** 远程(ranger)追击每层额外伤害递增 */
  rangerAttackCountStep: 2,
  /** 减速(slow)时攻击倍率 */
  slow: 0.5,
} as const;

// ============================================================
// 守护者(Guardian)配置
// ============================================================
export const GUARDIAN_CONFIG = {
  /** 护盾倍率（基于 attackDmg） */
  shieldMult: 1.5,
  /** 攻防交替周期（battleTurn % 此值） */
  defenseCycle: 2,
} as const;

// ============================================================
// 牧师(Priest)配置
// ============================================================
export const PRIEST_CONFIG = {
  /** 治疗盟友倍率（基于 attackDmg） */
  healAllyMult: 4.0,
  /** 自疗倍率（基于 attackDmg） */
  healSelfMult: 3.0,
  /** 护甲祝福倍率（基于 attackDmg） */
  armorBoostMult: 3,
  /** 虚弱施加概率 */
  weakChance: 0.35,
  /** 易伤概率阈值（debuffRoll < 此值时施加易伤） */
  vulnerableThreshold: 0.6,
  /** 力量加成数值 */
  strengthBonus: 3,
  /** 诅咒骰子概率阈值（random < 此值 → 诅咒骰子） */
  curseChance: 0.5,
  /** 虚弱持续回合数 */
  weakDuration: 3,
  /** 易伤持续回合数 */
  vulnerableDuration: 3,
  /** 诅咒虚弱持续回合数 */
  curseWeakDuration: 2,
  /** 增益/减益行动周期（battleTurn % 此值） */
  buffCycle: 2,
} as const;

// ============================================================
// 法师(Caster)配置
// ============================================================
export const CASTER_CONFIG = {
  /** 毒雾概率（DoT 随机 < 此值 → 毒雾） */
  poisonChance: 0.4,
  /** 毒雾毒素倍率（基于 attackDmg） */
  poisonMult: 0.4,
  /** 火球触发阈值（DoT 随机 < 此值 → 火球） */
  fireballThreshold: 0.7,
  /** 火球灼烧倍率（基于 attackDmg） */
  fireballMult: 0.3,
  /** 诅咒毒素倍率（基于 attackDmg） */
  curseToxinMult: 0.25,
  /** 毒雾毒素下限 */
  poisonMin: 2,
  /** 火球灼烧下限 */
  burnMin: 1,
  /** 诅咒毒素下限 */
  curseMin: 1,
  /** 火球灼烧持续回合数 */
  fireballBurnDuration: 3,
  /** 诅咒虚弱持续回合数 */
  curseWeakDuration: 2,
} as const;

// ============================================================
// 敌人台词配置
// ============================================================
export const ENEMY_TAUNT_CONFIG = {
  /** 攻击台词触发概率 */
  attackChance: 0.3,
  /** 高伤台词伤害阈值 */
  highDmgThreshold: 15,
  /** 高伤台词延迟（ms） */
  highDmgQuoteDelay: 600,
  /** 高伤台词展示时长（ms） */
  highDmgQuoteDuration: 2000,
} as const;

// ============================================================
// 精英/ Boss 配置
// ============================================================
export const ELITE_CONFIG = {
  /** 精英 HP 下限（maxHp > 此值 → 精英） */
  hpThreshold: 80,
  /** Boss HP 下限（maxHp > 此值 → Boss） */
  bossHpThreshold: 200,
  /** Boss 诅咒 HP 比例（hp/maxHp < 此值 → 诅咒骰子） */
  bossCurseHpRatio: 0.4,
  /** 精英护甲倍率（基于 attackDmg） */
  armorMult: 1.5,
  /** Boss 护甲倍率（基于 attackDmg） */
  bossArmorMult: 2.0,
  /** 精英塞废骰子周期（battleTurn % 此值 = 0 时触发） */
  eliteDiceCycle: 3,
  /** Boss 低HP诅咒周期（battleTurn % 此值） */
  bossCurseCycle: 2,
  /** Boss塞碎裂骰子周期（battleTurn % 此值 = 0 时触发） */
  bossCrackedDiceCycle: 3,
  /** 叠护甲行动周期（elite, battleTurn % 此值） */
  eliteArmorCycle: 3,
  /** 叠护甲行动周期（boss, battleTurn % 此值） */
  bossArmorCycle: 2,
} as const;
