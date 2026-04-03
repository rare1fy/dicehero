/**
 * gameBalance.ts - 游戏平衡性配置表
 * 
 * 集中管理所有影响游戏平衡的数值常量。
 * 修改此文件即可调整游戏难度和节奏，无需改动逻辑代码。
 */

// ============================================================
// 玩家初始属性
// ============================================================
export const PLAYER_INITIAL = {
  hp: 100,
  maxHp: 100,
  armor: 0,
  freeRerollsPerTurn: 1,
  globalRerolls: 0,
  playsPerTurn: 1,
  souls: 0,
  augmentSlots: 5,
  drawCount: 4,       // 初始抽4颗骰子（保证基础牌型可用性）
  maxDrawCount: 6,
} as const;

// ============================================================
// 战斗数值缩放 - 层级系数表（波浪式难度曲线）
// ============================================================

/** 层级难度系数表：替代线性缩放，精确控制每层难度 */
export const DEPTH_SCALING: { hpMult: number; dmgMult: number }[] = [
  { hpMult: 0.65, dmgMult: 0.50 },  // depth 0: 教学关，极弱敌人让玩家熟悉操作
  { hpMult: 0.75, dmgMult: 0.60 },  // depth 1: 热身，仍然轻松
  { hpMult: 0.95, dmgMult: 0.80 },  // depth 2: 开始有点压力
  { hpMult: 1.05, dmgMult: 0.90 },  // depth 3: 精英里程碑（HP高但伤害克制）
  { hpMult: 0.95, dmgMult: 0.85 },  // depth 4: 精英后喘息
  { hpMult: 1.15, dmgMult: 1.00 },  // depth 5: 稳步提升
  { hpMult: 1.00, dmgMult: 0.90 },  // depth 6: 营火前轻松关
  { hpMult: 1.50, dmgMult: 1.10 },  // depth 7: 中期Boss（挑战但不绝望）
  { hpMult: 0.80, dmgMult: 0.75 },  // depth 8: Boss后明显恢复期
  { hpMult: 1.20, dmgMult: 1.00 },  // depth 9: 重新爬坡
  { hpMult: 1.50, dmgMult: 1.15 },  // depth 10: 后期开始
  { hpMult: 1.80, dmgMult: 1.30 },  // depth 11: 后期递增
  { hpMult: 2.10, dmgMult: 1.45 },  // depth 12: pre-boss精英区
  { hpMult: 1.20, dmgMult: 1.00 },  // depth 13: 营火前轻松关
  { hpMult: 2.30, dmgMult: 1.50 },  // depth 14: 最终Boss（史诗但可打）
];

/** 获取指定层级的缩放系数 */
export const getDepthScaling = (depth: number): { hpMult: number; dmgMult: number } => {
  if (depth < 0) return { hpMult: 0.90, dmgMult: 0.80 };
  if (depth >= DEPTH_SCALING.length) return DEPTH_SCALING[DEPTH_SCALING.length - 1];
  return DEPTH_SCALING[depth];
};

// 保留旧接口兼容（部分代码可能还引用）
export const BATTLE_SCALING = {
  hpPerDepth: 0.15,
  dmgPerDepth: 0.10,
} as const;

// ============================================================
// 商店配置
// ============================================================
export const SHOP_CONFIG = {
  /** 商店中增幅模块的数量 */
  augmentCount: 2,
  /** 商品价格范围 [min, max] */
  priceRange: [20, 80] as [number, number],
  /** 固定商品列表 */
  fixedItems: [
    { id: 'reroll', type: 'reroll' as const, label: '重掷强化', desc: '永久增加每回合 +1 次重掷' },
    { id: 'removeDice', type: 'removeDice' as const, label: '骰子净化', desc: '移除一颗骰子，瘦身构筑' },
  ],
} as const;

// ============================================================
// 篝火配置
// ============================================================
export const CAMPFIRE_CONFIG = {
  /** 休整回复量 */
  restHeal: 30,
  /** 模块强化费用系数: cost = level * costPerLevel */
  upgradeCostPerLevel: 20,
  /** 模块最大等级 */
  maxAugmentLevel: 5,
} as const;

// ============================================================
// 战利品 / 奖励配置
// ============================================================
export const LOOT_CONFIG = {
  /** 普通怪掉落金币 */
  normalDropGold: 25,
  /** 精英怪掉落金币 */
  eliteDropGold: 50,
  /** Boss掉落金币 */
  bossDropGold: 80,
  /** 增幅选择数量 */
  augmentChoiceCount: 3,
  /** 精英奖励池 */
  eliteRewards: [
    { type: 'freeRerollPerTurn' as const, value: 1, label: '+1 每回合重骰' },
    { type: 'freeRerollPerTurn' as const, value: 1, label: '+1 每回合免费重骰' },
  ],
} as const;

// ============================================================
// 地图配置
// ============================================================
export const MAP_CONFIG = {
  /** 总层数 */
  totalLayers: 15,
  /** 中层Boss所在层 */
  midBossLayer: 7,
  /** Boss前休息层 */
  restBeforeBossLayers: [6, 13],
  /** 固定层配置 */
  fixedLayers: {
    0: { type: 'enemy' as const, count: 1 },   // 起点教学战
    1: { type: null, count: 3 },                // 初次分路
    2: { type: null, count: 5 },                // 扩散层
    3: { type: null, count: 3 },                // 风险层（可出精英，但不强制）
    4: { type: null, count: 5 },                // 调整层
    5: { type: null, count: 5 },                // 构筑层
    6: { type: 'campfire' as const, count: 2 }, // 营火休整
    7: { type: 'boss' as const, count: 1 },     // 中Boss
    8: { type: null, count: 3 },                // Boss后再分路
    9: { type: null, count: 5 },                // 扩散层
    10: { type: null, count: 5 },               // 中后期风险层
    11: { type: null, count: 3 },               // 构筑兑现层
    12: { type: null, count: 5 },               // 压力层
    13: { type: 'campfire' as const, count: 2 },// 最终营火
    14: { type: 'boss' as const, count: 1 },    // 最终Boss
  } as Record<number, { type: string | null; count: number }>,
  /** 随机层节点数范围 [min, max]（仅作fallback） */
  randomLayerNodeRange: [2, 4] as [number, number],
  /** 节点类型权重（仅作fallback，主要用层模板） */
  nodeTypeWeights: [
    { type: 'elite' as const, cumWeight: 0.10 },
    { type: 'campfire' as const, cumWeight: 0.22 },
    { type: 'treasure' as const, cumWeight: 0.32 },
    { type: 'shop' as const, cumWeight: 0.44 },
    { type: 'merchant' as const, cumWeight: 0.52 },
    { type: 'event' as const, cumWeight: 0.62 },
    // 剩余概率 = enemy
  ],
} as const;

// ============================================================
// 技能模块选择
// ============================================================
export const SKILL_SELECT_CONFIG = {
  /** 可选技能数量 */
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
// 增幅模块缩放
// ============================================================
export const AUGMENT_SCALING = {
  /** 等级缩放公式: 1 + (level - 1) * scaleFactor */
  scaleFactor: 0.4,
} as const;

// ============================================================
// 大关配置 (5个大关，每章递增难度)
// ============================================================
export const CHAPTER_CONFIG = {
  /** 总大关数 */
  totalChapters: 5,
  /** 大关名称 */
  chapterNames: ['幽暗森林', '冰封山脉', '熔岩深渊', '暗影要塞', '永恒之巅'] as const,
  /** 每章的敌人数值倍率 (HP和伤害) */
  chapterScaling: [
    { hpMult: 1.0, dmgMult: 1.0 },   // 第1章: 基准
    { hpMult: 1.25, dmgMult: 1.15 },  // 第2章: +25% HP, +15% DMG（温和递增）
    { hpMult: 1.55, dmgMult: 1.30 },  // 第3章: +55% HP, +30% DMG
    { hpMult: 1.90, dmgMult: 1.50 },  // 第4章: +90% HP, +50% DMG
    { hpMult: 2.30, dmgMult: 1.70 },  // 第5章: +130% HP, +70% DMG（降低天花板）
  ],
  /** 每章过渡时回复的HP比例 */
  chapterHealPercent: 0.5,
  /** 每章过渡时获得的金币 */
  chapterBonusGold: 50,
} as const;
