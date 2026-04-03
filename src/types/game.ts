import React from 'react';

// ============================================================
// 骰子元素与稀有度
// ============================================================

export type DiceElement = 'normal' | 'fire' | 'ice' | 'thunder' | 'poison' | 'holy';
export type DiceRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'curse';

// ============================================================
// 骰子定义 (模板)
// ============================================================

export interface DiceDef {
  id: string;
  name: string;
  element: DiceElement;
  faces: number[];
  description: string;
  rarity: DiceRarity;
  onPlay?: {
    bonusDamage?: number;
    bonusMult?: number;
    heal?: number;
    pierce?: number;
    statusToEnemy?: StatusEffect;
    statusToSelf?: StatusEffect;
    aoe?: boolean;
  };
}

// ============================================================
// 骰子实例 (运行时)
// ============================================================

// ============================================================
// 拥有的骰子（带等级）
// ============================================================

export interface OwnedDie {
  defId: string;    // 骰子定义ID
  level: number;    // 当前等级 1-3
}

export interface Die {
  id: number;
  diceDefId: string;
  value: number;
  element: DiceElement;
  selected: boolean;
  spent: boolean;
  rolling?: boolean;
  playing?: boolean;
  kept?: boolean;
}

// ============================================================
// 牌型
// ============================================================

export type HandType = '普通攻击' | '对子' | '连对' | '三连对' | '三条' | '顺子' | '4顺' | '5顺' | '6顺' | '同元素' | '葫芦' | '四条' | '五条' | '六条' | '元素顺' | '元素葫芦' | '皇家元素顺' | '无效牌型';

// ============================================================
// 状态效果
// ============================================================

export type StatusType = 'poison' | 'burn' | 'dodge' | 'vulnerable' | 'strength' | 'weak' | 'armor' | 'slow' | 'freeze';

export interface StatusEffect {
  type: StatusType;
  value: number;
  duration?: number;
}

// ============================================================
// 增幅模块
// ============================================================

export type AugmentCategory = 'transition' | 'economy' | 'endgame' | 'normal_attack' | 'self_harm';

export interface AugmentContext {
  rerollsThisTurn?: number;
  hpLostThisTurn?: number;
  hpLostThisBattle?: number;
  currentHp?: number;
  maxHp?: number;
  currentGold?: number;
  enemiesKilledThisBattle?: number;
  consecutiveNormalAttacks?: number;
}

export interface Augment {
  id: string;
  name: string;
  level?: number;
  category?: AugmentCategory;
  condition: 'high_card' | 'pair' | 'two_pair' | 'n_of_a_kind' | 'full_house' | 'straight' | 'same_element' | 'element_count' | 'always' | 'passive';
  conditionValue?: number;
  conditionElement?: DiceElement;
  effect: (x: number, dice: Die[], level: number, context?: AugmentContext) => { damage?: number; armor?: number; heal?: number; multiplier?: number; pierce?: number; goldBonus?: number; shopDiscount?: number; statusEffects?: StatusEffect[] };
  description: string;
}

// ============================================================
// 地图
// ============================================================

export type NodeType = 'enemy' | 'elite' | 'boss' | 'shop' | 'event' | 'campfire' | 'treasure' | 'merchant';

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

/** 敌人战斗类型：决定攻击距离和视觉标识 */
/** 敌人战斗类型（西幻风格） */
export type EnemyCombatType = 'warrior' | 'guardian' | 'ranger' | 'caster' | 'priest';

export interface Enemy {
  uid: string;  // runtime unique id for multi-enemy targeting
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  /** 固定攻击力 */
  attackDmg: number;
  /** 战斗类型 */
  combatType: EnemyCombatType;
  /** 敌人描述（用于弹窗） */
  description?: string;
  dropGold: number;
  dropAugment: boolean;
  dropMaxPlays?: number;
  dropDiceCount?: number;
  rerollReward?: number;
  emoji: string;
  pattern?: (turn: number, self: Enemy, player: GameState) => { type: '攻击' | '防御' | '技能'; value: number; description?: string };
  statuses: StatusEffect[];
  distance: number;  // distance to player: 0=melee, >0=approaching
}

// ============================================================
// 战利品 & 商店
// ============================================================

export interface LootItem {
  id: string;
  type: 'gold' | 'augment' | 'reroll' | 'maxPlays' | 'diceCount' | 'specialDice' | 'diceChoice';
  value?: number;
  augment?: Augment;
  augmentOptions?: Augment[];
  diceDefId?: string;
  collected: boolean;
}

export type ChestTier = 'bronze' | 'silver' | 'gold';

export interface ChestReward {
  type: 'gold' | 'heal' | 'dice' | 'augment' | 'maxHp' | 'maxPlays' | 'removeDice' | 'reroll';
  value?: number;
  diceDefId?: string;
  augment?: Augment;
  label: string;
  desc: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface ShopItem {
  id: string;
  type: 'augment' | 'reroll' | 'dice' | 'specialDice' | 'removeDice';
  augment?: Augment;
  diceDefId?: string;
  price: number;
  label: string;
  desc: string;
}

// ============================================================
// 游戏主状态
// ============================================================

// ============================================================
// Battle Wave (multi-enemy wave system)
// ============================================================

export interface BattleWave {
  enemies: Enemy[];
}


// ============================================================
// 本局统计数据
// ============================================================

export interface RunStats {
  totalDamageDealt: number;       // 累计造成伤害
  maxSingleHit: number;           // 单次最高伤害
  totalPlays: number;             // 总出牌次数
  totalRerolls: number;           // 总重掷次数
  totalDamageTaken: number;       // 累计受到伤害
  totalHealing: number;           // 累计回复量
  totalArmorGained: number;       // 累计获得护甲
  battlesWon: number;             // 已完成战斗场数
  elitesWon: number;              // 精英战胜利
  bossesWon: number;              // Boss战胜利
  enemiesKilled: number;          // 总击杀敌人数
  handTypeCounts: Record<string, number>;  // 每种牌型出牌次数
  bestHandPlayed: string;         // 打出过的最强牌型
  diceUsageCounts: Record<string, number>; // 每种骰子被选中出牌次数
  goldEarned: number;             // 累计获得金币
  goldSpent: number;              // 累计花费金币
}

export const INITIAL_STATS: RunStats = {
  totalDamageDealt: 0,
  maxSingleHit: 0,
  totalPlays: 0,
  totalRerolls: 0,
  totalDamageTaken: 0,
  totalHealing: 0,
  totalArmorGained: 0,
  battlesWon: 0,
  elitesWon: 0,
  bossesWon: 0,
  enemiesKilled: 0,
  handTypeCounts: {},
  bestHandPlayed: '',
  diceUsageCounts: {},
  goldEarned: 0,
  goldSpent: 0,
};


// 游荡商人物品
export interface MerchantItem {
  id: string;
  type: 'dice' | 'augment' | 'heal' | 'reroll' | 'diceCount';
  label: string;
  desc: string;
  price: number;
  bought: boolean;
  diceDefId?: string;
  augment?: Augment;
  healAmount?: number;
  rerollAmount?: number;
}

export interface GameState {
  hp: number;
  maxHp: number;
  armor: number;
  freeRerollsLeft: number;
  freeRerollsPerTurn: number;
  globalRerolls: number;
  playsLeft: number;
  maxPlays: number;
  souls: number;
  slots: number;

  // 骰子库系统
  ownedDice: OwnedDie[];       // 玩家拥有的所有骰子定义ID列表
  diceBag: string[];          // 骰子库 (待抽取)
  discardPile: string[];      // 弃骰库 (已使用)
  drawCount: number;          // 每回合抽取数量

  handLevels: Record<string, number>;
  augments: (Augment | null)[];
  currentNodeId: string | null;
  map: MapNode[];
  phase: 'start' | 'map' | 'battle' | 'shop' | 'event' | 'campfire' | 'victory' | 'gameover' | 'loot' | 'skillSelect' | 'diceReward' | 'chapterTransition' | 'treasure' | 'merchant';
  battleTurn: number;
  isEnemyTurn: boolean;
  targetEnemyUid: string | null;  // selected attack target
  battleWaves: BattleWave[];      // remaining waves
  currentWaveIndex: number;       // current wave number
  logs: string[];
  shopItems: ShopItem[];
  merchantItems: MerchantItem[];
  shopLevel: number;
  statuses: StatusEffect[];
  lootItems: LootItem[];
  enemyHpMultiplier: number;
  chapter: number;          // 当前大关 (1-5)
  stats: RunStats;
  pendingReplacementAugment: Augment | null;
}

// ============================================================
// 牌型相关
// ============================================================

export interface HandResult {
  bestHand: string;
  allHands: HandType[];
  activeHands: HandType[];
}

export interface HandTypeDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  base: number;
  mult: number;
  description: string;
}
