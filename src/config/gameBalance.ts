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
  augmentSlots: 4,
  drawCount: 4,
  maxDrawCount: 6,
} as const;

// ============================================================
// 战斗数值缩放
// ============================================================
export const BATTLE_SCALING = {
  /** 敌人HP随深度增长系数: hp * (1 + depth * hpPerDepth) */
  hpPerDepth: 0.15,
  /** 敌人伤害随深度增长系数: dmg * (1 + depth * dmgPerDepth) */
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
    { id: 'dice', type: 'dice' as const, label: '额外骰子', desc: '增加 1 个骰子 (上限 6)' },
    { id: 'removeDice', type: 'removeDice' as const, label: '骰子净化', desc: '移除一颗骰子，瘦身构筑' },
  ],
} as const;

// ============================================================
// 篅火配置
// ============================================================
export const CAMPFIRE_CONFIG = {
  /** 休整回复量 */
  restHeal: 25,
  /** 模块强化费用系数: cost = level * costPerLevel */
  upgradeCostPerLevel: 30,
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
    { type: 'diceCount' as const, value: 1, label: '+1 骰子' },
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
    0: { type: 'enemy' as const, count: 1 },
    1: { type: null, count: 3 },
    7: { type: 'boss' as const, count: 1 },
    14: { type: 'boss' as const, count: 1 },
    6: { type: 'campfire' as const, count: 2 },
    13: { type: 'campfire' as const, count: 2 },
  } as Record<number, { type: string | null; count: number }>,
  /** 随机层节点数范围 [min, max] */
  randomLayerNodeRange: [2, 4] as [number, number],
  /** 节点类型权重（随机层） */
  nodeTypeWeights: [
    { type: 'elite' as const, cumWeight: 0.10 },
    { type: 'campfire' as const, cumWeight: 0.24 },
    { type: 'shop' as const, cumWeight: 0.38 },
    { type: 'event' as const, cumWeight: 0.58 },
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
    { type: 'reroll' as const, value: 1, label: '重掷机会 -1' },
    { type: 'reroll' as const, value: 2, label: '重掷机会 -2' },
    { type: 'hp' as const, value: 10, label: '当前生命 -10' },
    { type: 'hp' as const, value: 15, label: '当前生命 -15' },
  ],
} as const;

// ============================================================
// 增幅模块缩放
// ============================================================
export const AUGMENT_SCALING = {
  /** 等级缩放公式: 1 + (level - 1) * scaleFactor */
  scaleFactor: 0.5,
} as const;
