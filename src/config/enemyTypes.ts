/**
 * enemyTypes.ts - 敌人配置数据结构定义
 */

export type IntentType = '攻击' | '防御' | '技能';

export interface PatternAction {
  type: IntentType;
  baseValue: number;
  description?: string;
  scalable?: boolean;
  curseDice?: 'cursed' | 'cracked';
  curseDiceCount?: number;
}

export interface PhaseConfig {
  hpThreshold?: number;
  actions: PatternAction[];
}

export interface EnemyQuotes {
  /** 通用登场台词池（普通敌人 / 兼容旧 Boss 数据） */
  enter?: string[];
  /** [BOSS 专用 2026-05-08] 自我介绍/亮明身份的开场池（每场各从 greet+dispatch 各抽一条组合）。
   *  存在时优先于 enter[0] 用作"第一句" */
  greet?: string[];
  /** [BOSS 专用 2026-05-08] 派小弟语式（"上！"/"撕碎他！"），用作"第二句"。
   *  存在时优先于 enter[1]/BOSS_DISPATCH_LINES 池 */
  dispatch?: string[];
  death?: string[];
  attack?: string[];
  hurt?: string[];
  lowHp?: string[];
  /** [BOSS 专用 2026-05-09] 血量跨越 70% 阈值（从第一阶段进入狂暴前奏）时触发一次，
   *  复用 showEnemyQuote 气泡 + boss_low_hp 特效。终 BOSS 专属"3 阶段演出"的中段。 */
  phase2_taunt?: string[];
  defend?: string[];
  skill?: string[];
  heal?: string[];
}

/**
 * [2026-05-09] 召唤配置（用于亡灵/恶魔/复制系敌人）
 *
 *   `每 interval 回合（battleTurn % interval === offset）召唤 minionId 指定的小怪 count 只`
 *   - 召唤的小怪 hpScale/dmgScale 取调用方给的 scale，但不会再次按章节缩放
 *   - 同一战斗中同一 enemy 召唤上限 maxTotal 只
 *   - 仅当当前波次敌人数 < waveCap 时才会召唤（避免屏幕塞爆）
 */
export interface SummonRule {
  /** 召唤目标的 EnemyConfig.id（必须在 NORMAL_ENEMIES 中存在） */
  minionId: string;
  /** 触发周期（按 battleTurn）。例如 3 表示每 3 回合召唤一次 */
  interval: number;
  /** 周期偏移（默认 0；offset=1 时第 1/4/7 回合召唤） */
  offset?: number;
  /** 单次召唤数量，默认 1 */
  count?: number;
  /** 召唤累计上限（整场战斗），默认 3 */
  maxTotal?: number;
  /** 当前波次敌人数到达此上限时跳过召唤，默认 4 */
  waveCap?: number;
  /** 仅在血量低于该比例后才开始召唤（如 0.5 = 50% HP 后） */
  hpThreshold?: number;
}

/**
 * [2026-05-09] 复活/分身配置
 *
 *   死亡时一次性触发：原地复活回 reviveHpRatio * maxHp 血，并清空所有 statuses。
 *   - splitInto > 0 时改为分裂：原地变 splitInto 只新敌人（每只 hp = reviveHpRatio * 原 maxHp / splitInto），
 *     不会再次触发 revive
 */
export interface ReviveRule {
  /** 复活后的 HP 占 maxHp 的比例（0~1） */
  reviveHpRatio: number;
  /** 复活时附加的台词 ID（用于演出，可选） */
  taunt?: string;
  /** 大于 0 时改为分裂：复活成 N 只小怪，每只 HP 平分 */
  splitInto?: number;
  /** 分裂后每只敌人的 EnemyConfig.id；缺省时复制自身 */
  splitMinionId?: string;
}

export interface EnemyConfig {
  id: string;
  name: string;
  emoji: string;
  baseHp: number;
  baseDmg: number;
  phases: PhaseConfig[];
  category: 'normal' | 'elite' | 'boss';
  combatType: 'warrior' | 'guardian' | 'ranger' | 'caster' | 'priest';
  chapter?: number; // 1-5, undefined = 通用
  /** [2026-05-09] BOSS 专用：区分中层/终极 BOSS（原来靠 BOSS_ENEMIES 索引 [0]/[1] 脆弱，
   *  中 BOSS 扩充到每章 3 只后必须用显式字段）。category !== 'boss' 时忽略。 */
  bossRank?: 'mid' | 'final';
  /** [2026-05-09] 召唤小怪机制（亡灵召唤师 / 恶魔领主类敌人） */
  summons?: SummonRule;
  /** [2026-05-09] 复活/分裂机制（不死、史莱姆类敌人） */
  revive?: ReviveRule;
  drops: { gold: number; relic: boolean; rerollReward?: number; };
  quotes?: EnemyQuotes;
}
