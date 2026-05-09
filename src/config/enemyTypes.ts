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
  drops: { gold: number; relic: boolean; rerollReward?: number; };
  quotes?: EnemyQuotes;
}
