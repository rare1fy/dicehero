// ============================================================
// 地图
// ============================================================

export type NodeType = 'enemy' | 'elite' | 'boss' | 'event' | 'campfire' | 'treasure' | 'merchant';

export interface MapNode {
  id: string;
  type: NodeType;
  depth: number;
  connectedTo: string[];
  completed: boolean;
}

// ============================================================
// 敌人
// ============================================================

/** 敌人战斗类型（西幻风格） */
export type EnemyCombatType = 'warrior' | 'guardian' | 'ranger' | 'caster' | 'priest';

export interface Enemy {
  uid: string;  // runtime unique id for multi-enemy targeting
  configId: string;  // links back to EnemyConfig.id for quotes lookup
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  /** 固定攻击力 */
  attackDmg: number;
  /** 战斗类型 */
  combatType: EnemyCombatType;
  /** [2026-05-09] 种族子类型——同 combatType 内的差异化行为标签 */
  archetype?: import('../config/enemyTypes').EnemyArchetype;
  /** 敌人描述（用于弹窗） */
  description?: string;
  dropGold: number;
  dropRelic: boolean;
  dropMaxPlays?: number;
  dropDiceCount?: number;
  rerollReward?: number;
  emoji: string;
  pattern?: (turn: number, self: Enemy, player: import('./game').GameState) => { type: '攻击' | '防御' | '技能'; value: number; description?: string };
  statuses: import('./dice').StatusEffect[];
  distance: number;  // distance to player: 0=melee, >0=approaching
  attackCount?: number; // 弓箭手攻击次数计数（伤害递增用）
  /** [2026-05-09 traits] 战士 BLOOD_FURY：受到伤害一次累积 +1（封顶 4） */
  bloodFury?: number;
  /** [2026-05-09 traits] 守护者 GUARD_RAGE：连续防御回合数（每 stack 下次攻击 +60%） */
  guardRage?: number;
  /** [2026-05-09 traits] 法师 DOT_AMPLIFIER：连续施加同种 DOT 的层数（每层让 DOT ×1.4） */
  dotAmplifier?: number;
  /** [2026-05-09 traits] 牧师 HOLY_WRATH：本场战斗内累计的"圣怒"层数（每 +1 上调 debuff 强度/护甲/治疗） */
  holyWrath?: number;
  /** [2026-05-09 召唤累计] 已召唤次数（用于 SummonRule.maxTotal 上限判断） */
  summonCount?: number;
  /** [2026-05-09 复活] 已复活/分裂次数（每个 enemy 仅触发一次） */
  revivedOnce?: boolean;
  /** [2026-05-09] 标记此敌人是召唤生成的子单位，避免给召唤物再赋 summons 配置（防递归召唤雪崩） */
  isSummoned?: boolean;
}

// ============================================================
// 战利品 & 商店
// ============================================================

export interface LootItem {
  id: string;
  type: 'gold' | 'relic' | 'reroll' | 'maxPlays' | 'diceCount' | 'specialDice' | 'diceChoice' | 'challengeChest';
  value?: number;
  diceDefId?: string;
  collected: boolean;
  relicData?: import('./relics').Relic;
}

export type ChestTier = 'bronze' | 'silver' | 'gold';

export interface ChestReward {
  type: 'gold' | 'heal' | 'dice' | 'relic' | 'maxHp' | 'maxPlays' | 'removeDice' | 'reroll';
  value?: number;
  diceDefId?: string;
  relicData?: import('./relics').Relic;
  label: string;
  desc: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface ShopItem {
  id: string;
  type: 'relic' | 'reroll' | 'dice' | 'specialDice' | 'removeDice';
  relicData?: import('./relics').Relic;
  diceDefId?: string;
  price: number;
  label: string;
  desc: string;
}

// ============================================================
// Battle Wave (multi-enemy wave system)
// ============================================================

export interface BattleWave {
  enemies: Enemy[];
}

/** 一击必杀挑战条件
 * @note 此为 GameState 中的简化类型声明。
 * 权威定义在 utils/instakillChallenge.ts（含 ChallengeType 枚举 + trackSet 字段）。
 * 拆分时保留此处是为了避免循环依赖（Enemy→GameState→...），
 * 如需扩展字段应以 instakillChallenge.ts 为准并同步更新此处。 */
// InstakillChallenge 权威定义位于 utils/instakillChallenge.ts（含 ChallengeType union + trackSet 等完整字段）。
// 此处 re-export 确保 types 模块的统一入口，后续扩展须改动 utils/instakillChallenge.ts 源头。
export type { InstakillChallenge } from '../utils/instakillChallenge';

// 游荡商人物品
export interface MerchantItem {
  id: string;
  type: 'dice' | 'relic' | 'heal' | 'reroll' | 'diceCount';
  label: string;
  desc: string;
  price: number;
  bought: boolean;
  diceDefId?: string;
  relicData?: import('./relics').Relic;
  healAmount?: number;
  rerollAmount?: number;
}
