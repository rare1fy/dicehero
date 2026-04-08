/**
 * config/index.ts - 配置表统一入口
 * 
 * 所有游戏内容的纯数据配置集中在这里导出。
 * 修改游戏内容只需编辑对应的配置文件，无需触碰逻辑代码。
 */

export {
  PLAYER_INITIAL,
  BATTLE_SCALING,
  SHOP_CONFIG,
  DICE_REWARD_REFRESH,
  CAMPFIRE_CONFIG,
  LOOT_CONFIG,
  MAP_CONFIG,
  SKILL_SELECT_CONFIG,
  AUGMENT_SCALING,
  CHAPTER_CONFIG,
  DEPTH_SCALING,
  getDepthScaling,
} from './gameBalance';

export {
  EVENTS_POOL,
  type EventConfig,
  type EventOptionConfig,
} from './events';

export {
  NORMAL_ENEMIES,
  ELITE_ENEMIES,
  BOSS_ENEMIES,
  UPGRADEABLE_HAND_TYPES,
  type EnemyConfig,
  type PatternAction,
  type PhaseConfig,
  type IntentType,
} from './enemies';
