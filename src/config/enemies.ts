/**
 * enemies.ts - 敌人配置表
 * 
 * 纯数据配置，定义敌人的基础属性和行为模式。
 * 行为模式用纯数据描述，由 data/enemies.ts 解释执行。
 */

// ============================================================
// 行为模式数据结构
// ============================================================

export type IntentType = '攻击' | '防御' | '技能';

export interface PatternAction {
  type: IntentType;
  /** 伤害/护甲的基础值（会乘以 dmgScale） */
  baseValue: number;
  /** 技能描述（仅技能类型使用） */
  description?: string;
  /** 是否受 dmgScale 影响（默认 true，技能类型层数不缩放） */
  scalable?: boolean;
}

export interface PhaseConfig {
  /** 触发条件：hpRatio < threshold 时进入此阶段 */
  hpThreshold?: number;
  /** 循环动作序列，按 turn % length 索引 */
  actions: PatternAction[];
}

export interface EnemyConfig {
  id: string;
  name: string;
  emoji: string;
  /** 基础HP（未缩放） */
  baseHp: number;
  /** 基础伤害（未缩放，用于初始 intent） */
  baseDmg: number;
  /** 行为阶段，按优先级从高到低检查 */
  phases: PhaseConfig[];
  /** 敌人类型 */
  category: 'normal' | 'elite' | 'boss';
  /** 战斗类型 */
  combatType: 'warrior' | 'guardian' | 'ranger' | 'caster' | 'priest';
  /** 掉落配置 */
  drops: {
    gold: number;
    augment: boolean;
    rerollReward?: number;
  };
}

// ============================================================
// 普通敌人
// ============================================================
export const NORMAL_ENEMIES: EnemyConfig[] = [
  {
    id: 'void_wanderer',
    name: '虚空巡游者',
    emoji: '',
    baseHp: 20, baseDmg: 3,
    category: 'normal',
    combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
          { type: '攻击', baseValue: 4 },
          { type: '攻击', baseValue: 4 },
        ],
      },
    ],
  },
  {
    id: 'rotten_beetle',
    name: '腐化甲虫',
    emoji: '',
    baseHp: 38, baseDmg: 3,
    category: 'normal',
    combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '防御', baseValue: 6 },
          { type: '攻击', baseValue: 3 },
        ],
      },
    ],
  },
  {
    id: 'scarlet_sprite',
    name: '猛红异灵',
    emoji: '',
    baseHp: 22, baseDmg: 3,
    category: 'normal',
    combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 1, description: '易伤', scalable: false },
          { type: '攻击', baseValue: 5 },
          { type: '攻击', baseValue: 5 },
        ],
      },
    ],
  },
  {
    id: 'forgotten_shadow',
    name: '遗忘之影',
    emoji: '',
    baseHp: 16, baseDmg: 8,
    category: 'normal',
    combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 7 },
          { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        ],
      },
    ],
  },
  {
    id: 'dark_spider_swarm',
    name: '暗蝼蛛群',
    emoji: '',
    baseHp: 20, baseDmg: 3,
    category: 'normal',
    combatType: 'ranger',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 2, description: '灬烧', scalable: false },
          { type: '攻击', baseValue: 3 },
          { type: '攻击', baseValue: 3 },
          { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        ],
      },
    ],
  },
  {
    id: 'cracked_watcher',
    name: '裂骸守望者',
    emoji: '',
    baseHp: 44, baseDmg: 4,
    category: 'normal',
    combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 4 },
          { type: '防御', baseValue: 8 },
          { type: '攻击', baseValue: 8, description: '裂骸冲击' },
        ],
      },
    ],
  },
  {
    id: 'soul_jellyfish',
    name: '噤魂水母',
    emoji: '',
    baseHp: 18, baseDmg: 2,
    category: 'normal',
    combatType: 'priest',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
          { type: '技能', baseValue: 1, description: '易伤', scalable: false },
          { type: '攻击', baseValue: 5 },
        ],
      },
    ],
  },
  {
    id: 'iron_puppet',
    name: '铁锤傀儿',
    emoji: '',
    baseHp: 32, baseDmg: 9,
    category: 'normal',
    combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '防御', baseValue: 12 },
          { type: '攻击', baseValue: 7 },
          { type: '攻击', baseValue: 7 },
        ],
      },
    ],
  },
];

// ============================================================
// 精英敌人
// ============================================================
export const ELITE_ENEMIES: EnemyConfig[] = [
  {
    id: 'chaos_aggregate',
    name: '混沌聚合体',
    emoji: '',
    baseHp: 105, baseDmg: 9,
    category: 'elite',
    combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        hpThreshold: 0.4,
        actions: [
          { type: '攻击', baseValue: 20, description: '混沌爆发' },
        ],
      },
      {
        actions: [
          { type: '攻击', baseValue: 12 },
          { type: '攻击', baseValue: 8 },
          { type: '技能', baseValue: 2, description: '力量', scalable: false },
        ],
      },
    ],
  },
  {
    id: 'void_warden',
    name: '虚空典英长',
    emoji: '',
    baseHp: 120, baseDmg: 5,
    category: 'elite',
    combatType: 'guardian',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 6 },
          { type: '防御', baseValue: 18 },
          { type: '攻击', baseValue: 14, description: '处决' },
          { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        ],
      },
    ],
  },
  {
    id: 'abyss_prophet',
    name: '深渊预言家',
    emoji: '',
    baseHp: 90, baseDmg: 8,
    category: 'elite',
    combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        hpThreshold: 0.3,
        actions: [
          { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
          { type: '技能', baseValue: 3, description: '灬烧', scalable: false },
        ],
      },
      {
        actions: [
          { type: '攻击', baseValue: 7 },
          { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
          { type: '攻击', baseValue: 9 },
          { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
          { type: '防御', baseValue: 14 },
        ],
      },
    ],
  },
  {
    id: 'eternal_clocksmith',
    name: '永恒钟表匠',
    emoji: '',
    baseHp: 75, baseDmg: 12,
    category: 'elite',
    combatType: 'warrior',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 22, description: '时间崩塔' },
          { type: '技能', baseValue: 2, description: '力量', scalable: false },
          { type: '防御', baseValue: 10 },
          { type: '攻击', baseValue: 10 },
        ],
      },
    ],
  },
];

// ============================================================
// Boss
// ============================================================
export const BOSS_ENEMIES: EnemyConfig[] = [
  {
    id: 'dream_weaver',
    name: '虚空织梦者',
    emoji: '',
    baseHp: 170, baseDmg: 10,
    category: 'boss',
    combatType: 'caster',
    drops: { gold: 80, augment: true, rerollReward: 3 },
    phases: [
      {
        hpThreshold: 0.4,
        actions: [
          { type: '攻击', baseValue: 25, description: '织梦终焰' },
          { type: '攻击', baseValue: 18, description: '梦魇撕裂' },
          { type: '技能', baseValue: 3, description: '灬烧', scalable: false },
        ],
      },
      {
        actions: [
          { type: '攻击', baseValue: 10 },
          { type: '攻击', baseValue: 10 },
          { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
          { type: '技能', baseValue: 2, description: '易伤', scalable: false },
          { type: '防御', baseValue: 18 },
        ],
      },
    ],
  },
  {
    id: 'eternal_lord',
    name: '永夜主宰',
    emoji: '',
    baseHp: 290, baseDmg: 12,
    category: 'boss',
    combatType: 'caster',
    drops: { gold: 0, augment: false },
    phases: [
      {
        hpThreshold: 0.5,
        actions: [
          { type: '攻击', baseValue: 35, description: '终焐之光' },
          { type: '攻击', baseValue: 22 },
          { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
          { type: '防御', baseValue: 30 },
        ],
      },
      {
        actions: [
          { type: '技能', baseValue: 4, description: '灬烧', scalable: false },
          { type: '攻击', baseValue: 12 },
          { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
          { type: '攻击', baseValue: 20 },
        ],
      },
    ],
  },
];

/** 可升级牌型池（用于事件中随机选择） */
export const UPGRADEABLE_HAND_TYPES = ['对子', '连对', '顺子', '同元素', '葡萤'];
