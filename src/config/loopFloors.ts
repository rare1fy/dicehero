/**
 * loopFloors.ts - Loop Floor Map Configuration
 *
 * Each chapter consists of several floors, each floor is a short loop of 8 tiles.
 * Player rolls movement dice (1~3) to move on tiles, exit opens after completing objectives.
 */

import { LoopFloorTheme, LoopTileType, FloorObjectiveType, FloorRewardType } from '../types/game';

// ============================================================
// Constants
// ============================================================

/** Tiles per floor */
export const TILES_PER_FLOOR = 8;

/** Movement dice range [min, max] */
export const MOVE_DICE_RANGE: [number, number] = [1, 3];

/** Battles required to open exit */
export const EXIT_BATTLES_REQUIRED = 2;

// ============================================================
// Tile Templates
// ============================================================

/** Standard 8-tile templates (index 0 = entry, index 7 = exit) */
export const STANDARD_TILE_TEMPLATES: Record<LoopFloorTheme, LoopTileType[]> = {
  forge: [
    'entry', 'battle', 'event', 'battle', 'theme', 'risk', 'campfire', 'exit',
  ],
  bazaar: [
    'entry', 'battle', 'shop', 'event', 'battle', 'theme', 'event', 'exit',
  ],
  sanctum: [
    'entry', 'battle', 'campfire', 'event', 'battle', 'theme', 'campfire', 'exit',
  ],
  boss: [
    'entry', 'battle', 'campfire', 'boss_battle', 'exit', 'exit', 'exit', 'exit',
  ],
};

// ============================================================
// Theme Pool & Weights
// ============================================================

export interface ThemeWeight {
  theme: LoopFloorTheme;
  weight: number;
}

export const THEME_POOL: ThemeWeight[] = [
  { theme: 'forge', weight: 1 },
  { theme: 'bazaar', weight: 1 },
  { theme: 'sanctum', weight: 1 },
];

// ============================================================
// Chapter Structure
// ============================================================

export interface ChapterFloorDef {
  isBoss: boolean;
  forcedTheme: LoopFloorTheme | null;
}

/** First version: 3 normal + 1 Boss */
export const CHAPTER_FLOOR_DEFS: ChapterFloorDef[] = [
  { isBoss: false, forcedTheme: null },
  { isBoss: false, forcedTheme: null },
  { isBoss: false, forcedTheme: null },
  { isBoss: true, forcedTheme: 'boss' },
];

// ============================================================
// Objective Config
// ============================================================

export interface FloorObjectiveDef {
  type: FloorObjectiveType;
  target: number;
  description: string;
}

export const DEFAULT_OBJECTIVE: FloorObjectiveDef = {
  type: 'battles_won',
  target: EXIT_BATTLES_REQUIRED,
  description: `完成 ${EXIT_BATTLES_REQUIRED} 场战斗后出口开启`,
};

// ============================================================
// Floor Reward Pool
// ============================================================

export interface FloorRewardOption {
  id: string;
  type: FloorRewardType;
  label: string;
  description: string;
  value?: number;
}

export const FLOOR_REWARD_POOL: FloorRewardOption[] = [
  { id: 'heal_20', type: 'heal', label: '治疗之泉', description: '恢复 20 HP', value: 20 },
  { id: 'gold_30', type: 'gold', label: '宝箱', description: '获得 30 金币', value: 30 },
  { id: 'upgrade_die', type: 'upgrade_die', label: '骰子强化', description: '升级一颗骰子' },
  { id: 'free_reroll', type: 'free_reroll', label: '命运之轮', description: '+1 每回合免费重投', value: 1 },
  { id: 'max_hp_8', type: 'max_hp', label: '生命结晶', description: '最大 HP +8', value: 8 },
  { id: 'draw_bonus', type: 'draw_count', label: '骰子袋扩展', description: '下层首战多抽 1 颗', value: 1 },
];

export const FLOOR_REWARD_CHOICES = 3;

// ============================================================
// Post-floor Events
// ============================================================

export interface FloorPostEvent {
  id: string;
  label: string;
  description: string;
  type: 'merchant' | 'gamble' | 'shrine' | 'copy_die' | 'remove_face' | 'nothing';
  weight: number;
}

export const FLOOR_POST_EVENTS: FloorPostEvent[] = [
  { id: 'post_merchant', label: '旅商', description: '一位神秘旅商出现了', type: 'merchant', weight: 3 },
  { id: 'post_gamble', label: '赌博台', description: '花 15 金币赌一把？', type: 'gamble', weight: 2 },
  { id: 'post_shrine', label: '祭坛', description: '献出 HP 获得力量', type: 'shrine', weight: 2 },
  { id: 'post_nothing', label: '平静', description: '什么也没发生', type: 'nothing', weight: 3 },
];

// ============================================================
// Revisit Rewards
// ============================================================

export const REVISIT_REWARDS = {
  gold: 1,
  armor: 0,
  description: '已探索的格子：+1 金币',
} as const;

// ============================================================
// Theme Tile Effects
// ============================================================

export const THEME_TILE_EFFECTS: Record<Exclude<LoopFloorTheme, 'boss'>, {
  name: string;
  options: { label: string; description: string }[];
}> = {
  forge: {
    name: '熔铸台',
    options: [
      { label: '强化一面', description: '选一颗骰子，将一面 +1' },
      { label: '重铸一面', description: '选一颗骰子，随机重置一面' },
      { label: '淠火', description: '选一颗骰子，将最低面提升 1 点' },
    ],
  },
  bazaar: {
    name: '黑市摊位',
    options: [
      { label: 'HP 换金币', description: '失去 10 HP，获得 20 金币' },
      { label: '卖骰换货', description: '卖一颗骰子，获得随机稀有物品' },
      { label: '刷新结算', description: '花 10 金币刷新层结算奖励' },
    ],
  },
  sanctum: {
    name: '祈祷台',
    options: [
      { label: '治愈', description: '恢复 15 HP' },
      { label: '净化', description: '清除一颗骰子的诅咒面' },
      { label: '祝福', description: '下场战斗首次出牌 +5 护甲' },
    ],
  },
};
