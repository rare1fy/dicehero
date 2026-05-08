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
  drops: { gold: number; relic: boolean; rerollReward?: number; };
  quotes?: EnemyQuotes;
}
