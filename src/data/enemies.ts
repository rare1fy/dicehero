import { MapNode, Enemy, GameState } from '../types/game';
import { BATTLE_SCALING } from '../config';
import { 
  NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES,
  type EnemyConfig, type PatternAction 
} from '../config';

/**
 * 根据配置表生成运行时 pattern 函数
 * 将纯数据的行为配置转换为可执行的 pattern 函数
 */
const buildPattern = (config: EnemyConfig, dmgScale: number) => {
  return (t: number, self: Enemy, player: GameState) => {
    // 检查每个阶段（优先级从高到低）
    for (const phase of config.phases) {
      if (phase.hpThreshold && self.hp >= self.maxHp * phase.hpThreshold) {
        continue; // 未触发此阶段
      }
      
      const actions = phase.actions;
      const idx = t % actions.length;
      const action = actions[idx];
      
      return {
        type: action.type,
        value: action.scalable === false 
          ? action.baseValue 
          : Math.floor(action.baseValue * dmgScale),
        description: action.description,
      };
    }
    
    // fallback: 普通攻击
    return { type: '攻击' as const, value: Math.floor(config.baseDmg * dmgScale) };
  };
};

/**
 * 根据配置表生成运行时 Enemy 对象
 */
const buildEnemy = (config: EnemyConfig, hpScale: number, dmgScale: number): Enemy => {
  return {
    name: config.name,
    emoji: config.emoji,
    hp: Math.floor(config.baseHp * hpScale),
    maxHp: Math.floor(config.baseHp * hpScale),
    armor: 0,
    intent: { type: '攻击', value: Math.floor(config.baseDmg * dmgScale) },
    dropGold: config.drops.gold,
    dropAugment: config.drops.augment,
    rerollReward: config.drops.rerollReward,
    statuses: [],
    pattern: buildPattern(config, dmgScale),
  };
};

export const getEnemyForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0): Enemy => {
  const hpScale = (1 + depth * BATTLE_SCALING.hpPerDepth) * hpMultiplier;
  const dmgScale = 1 + depth * BATTLE_SCALING.dmgPerDepth;

  if (node.type === 'boss') {
    return getBossForDepth(depth, hpScale, dmgScale);
  }

  if (node.type === 'elite') {
    const config = ELITE_ENEMIES[Math.floor(Math.random() * ELITE_ENEMIES.length)];
    return buildEnemy(config, hpScale, dmgScale);
  }

  // 普通敌人
  const config = NORMAL_ENEMIES[Math.floor(Math.random() * NORMAL_ENEMIES.length)];
  return buildEnemy(config, hpScale, dmgScale);
};

const getBossForDepth = (depth: number, hpScale: number, dmgScale: number): Enemy => {
  // 中层Boss vs 最终Boss
  const config = depth < 12 ? BOSS_ENEMIES[0] : BOSS_ENEMIES[BOSS_ENEMIES.length - 1];
  return buildEnemy(config, hpScale, dmgScale);
};
