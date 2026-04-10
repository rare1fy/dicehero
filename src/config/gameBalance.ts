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
  augmentSlots: 5,
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
  { hpMult: 1.70, dmgMult: 0.80 },  // depth 3: 精英层（高HP低伤害）
  { hpMult: 1.30, dmgMult: 0.70 },  // depth 4: 精英后休息
  { hpMult: 1.60, dmgMult: 0.85 },  // depth 5: 热身完毕
  { hpMult: 1.40, dmgMult: 0.75 },  // depth 6: 营火前缓冲
  { hpMult: 2.00, dmgMult: 1.10 },  // depth 7: 中期Boss
  { hpMult: 1.20, dmgMult: 0.65 },  // depth 8: Boss后恢复期
  { hpMult: 1.70, dmgMult: 0.90 },  // depth 9: 重新热身
  { hpMult: 2.00, dmgMult: 1.10 },  // depth 10: 后期开始
  { hpMult: 2.40, dmgMult: 1.30 },  // depth 11: 后期巅峰
  { hpMult: 2.80, dmgMult: 1.50 },  // depth 12: pre-boss精英层
  { hpMult: 1.60, dmgMult: 1.00 },  // depth 13: 营火前缓冲
  { hpMult: 3.80, dmgMult: 2.00 },  // depth 14: 最终Boss
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
// ============================================================
export const SHOP_CONFIG = {
  /** 商店增幅模块数量 */
  augmentCount: 2,
  /** 商品价格范围 [min, max] */
  priceRange: [20, 80] as [number, number],
  /** 删除骰子固定价格 */
  removeDicePrice: 30,
  /** 固定商品列表 */
  fixedItems: [
    { id: 'reroll', type: 'reroll' as const, label: '重投强化', desc: '永久增加每回合 +1 重投机会' },
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
  maxAugmentLevel: 5,
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
  augmentChoiceCount: 3,
  /** 精英额外奖励 */
  eliteRewards: [
    { type: 'freeRerollPerTurn' as const, value: 1, label: '+1 每回合重投' },
    { type: 'freeRerollPerTurn' as const, value: 1, label: '+1 每回合重投机会' },
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
// 增幅缩放
// ============================================================
export const AUGMENT_SCALING = {
  /** 等级缩放公式: 1 + (level - 1) * scaleFactor */
  scaleFactor: 0.4,
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
  /** 获取魂晶的条件描述 */
  description: '首次出牌秒杀敌人时，溢出伤害×当前倍率=魂晶',
} as const;

/** 计算当前层的魂晶倍率 */
export const getSoulCrystalMult = (depth: number, currentMult: number): number => {
  // 层数成长：基础倍率 + 每层+0.2
  const depthBonus = depth * SOUL_CRYSTAL_CONFIG.multPerDepth;
  return currentMult + depthBonus;
};