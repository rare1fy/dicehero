import React from 'react';

// ============================================================
// 骰子元素与稀有度
// ============================================================

export type DiceElement = 'normal' | 'fire' | 'ice' | 'thunder' | 'poison' | 'holy' | 'shadow';
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

export interface Die {
  id: number;
  diceDefId: string;
  value: number;
  element: DiceElement;
  selected: boolean;
  spent: boolean;
  rolling?: boolean;
  playing?: boolean;
}

// ============================================================
// 牌型
// ============================================================

export type HandType = '普通攻击' | '对子' | '连对' | '三条' | '顺子' | '同元素' | '葫芦' | '四条' | '五条' | '六条' | '元素顺' | '元素葫芦' | '皇家元素顺' | '无效牌型';

// ============================================================
// 状态效果
// ============================================================

export type StatusType = 'poison' | 'burn' | 'dodge' | 'vulnerable' | 'strength' | 'weak' | 'armor';

export interface StatusEffect {
  type: StatusType;
  value: number;
  duration?: number;
}

// ============================================================
// 增幅模块
// ============================================================

export interface Augment {
  id: string;
  name: string;
  level?: number;
  condition: 'high_card' | 'pair' | 'two_pair' | 'n_of_a_kind' | 'full_house' | 'straight' | 'same_element' | 'element_count';
  conditionValue?: number;
  conditionElement?: DiceElement;
  effect: (x: number, dice: Die[], level: number) => { damage?: number; armor?: number; heal?: number; multiplier?: number; pierce?: number; statusEffects?: StatusEffect[] };
  description: string;
}

// ============================================================
// 地图
// ============================================================

export type NodeType = 'enemy' | 'elite' | 'boss' | 'shop' | 'event' | 'campfire';

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
  type: 'gold' | 'augment' | 'reroll' | 'maxPlays' | 'diceCount' | 'specialDice';
  value?: number;
  augment?: Augment;
  augmentOptions?: Augment[];
  diceDefId?: string;
  collected: boolean;
}

export interface ShopItem {
  id: string;
  type: 'augment' | 'reroll' | 'dice' | 'specialDice';
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
  ownedDice: string[];       // 玩家拥有的所有骰子定义ID列表
  diceBag: string[];          // 骰子库 (待抽取)
  discardPile: string[];      // 弃骰库 (已使用)
  drawCount: number;          // 每回合抽取数量

  handLevels: Record<string, number>;
  augments: (Augment | null)[];
  currentNodeId: string | null;
  map: MapNode[];
  phase: 'start' | 'map' | 'battle' | 'shop' | 'event' | 'campfire' | 'victory' | 'gameover' | 'loot' | 'skillSelect';
  battleTurn: number;
  isEnemyTurn: boolean;
  targetEnemyUid: string | null;  // selected attack target
  battleWaves: BattleWave[];      // remaining waves
  currentWaveIndex: number;       // current wave number
  logs: string[];
  shopItems: ShopItem[];
  statuses: StatusEffect[];
  lootItems: LootItem[];
  enemyHpMultiplier: number;
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
