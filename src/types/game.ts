import React from 'react';

export type DiceColor = '红色' | '蓝色' | '紫色' | '金色';

export interface Die {
  id: number;
  value: number;
  color: DiceColor;
  selected: boolean;
  spent: boolean;
  rolling?: boolean;
  playing?: boolean;
}

export type HandType = '普通攻击' | '对子' | '连对' | '三条' | '顺子' | '同花' | '葫芦' | '四条' | '五条' | '六条' | '同花顺' | '同花葫芦' | '皇家同花顺' | '无效牌型';

export type StatusType = 'poison' | 'burn' | 'dodge' | 'vulnerable' | 'strength' | 'weak' | 'armor';

export interface StatusEffect {
  type: StatusType;
  value: number;
  duration?: number; // 持续回合数，每回合结束-1，为0时移除。undefined表示按value递减（如毒、灼烧）
}

export interface Augment {
  id: string;
  name: string;
  level?: number;
  condition: 'high_card' | 'pair' | 'two_pair' | 'n_of_a_kind' | 'full_house' | 'straight' | 'flush' | 'red_count';
  conditionValue?: number;
  effect: (x: number, dice: Die[], level: number) => { damage?: number; armor?: number; heal?: number; multiplier?: number; pierce?: number; statusEffects?: StatusEffect[] };
  description: string;
}

export type NodeType = 'enemy' | 'elite' | 'boss' | 'shop' | 'event' | 'campfire';

export interface MapNode {
  id: string;
  type: NodeType;
  depth: number;
  connectedTo: string[];
  completed: boolean;
}

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  intent: { type: '攻击' | '防御' | '技能'; value: number; description?: string };
  dropGold: number;
  dropAugment: boolean;
  dropMaxPlays?: number;
  dropDiceCount?: number;
  rerollReward?: number;
  emoji: string;
  pattern?: (turn: number, self: Enemy, player: GameState) => { type: '攻击' | '防御' | '技能'; value: number; description?: string };
  statuses: StatusEffect[];
}

export interface LootItem {
  id: string;
  type: 'gold' | 'augment' | 'reroll' | 'maxPlays' | 'diceCount';
  value?: number;
  augment?: Augment;
  augmentOptions?: Augment[];
  collected: boolean;
}

export interface ShopItem {
  id: string;
  type: 'augment' | 'reroll' | 'dice';
  augment?: Augment;
  price: number;
  label: string;
  desc: string;
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
  diceCount: number;
  handLevels: Record<string, number>;
  augments: (Augment | null)[];
  currentNodeId: string | null;
  map: MapNode[];
  phase: 'start' | 'map' | 'battle' | 'shop' | 'event' | 'campfire' | 'victory' | 'gameover' | 'loot' | 'skillSelect';
  battleTurn: number;
  isEnemyTurn: boolean;
  logs: string[];
  shopItems: ShopItem[];
  statuses: StatusEffect[];
  lootItems: LootItem[];
  enemyHpMultiplier: number;
  pendingReplacementAugment: Augment | null;
}

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
