import { MapNode, Enemy, GameState, BattleWave } from '../types/game';
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
let uidCounter = 0;

const buildEnemy = (config: EnemyConfig, hpScale: number, dmgScale: number): Enemy => {
  return {
    uid: `enemy_${++uidCounter}_${Date.now()}`,
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
    distance: 0,
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


/**
 * Generate multi-wave enemies for a battle node.
 * Normal: 1 wave of 1-3 enemies
 * Elite: 1 wave of 1 elite (+ maybe 1 normal sidekick)
 * Boss: 1-2 waves (wave 1: minions, wave 2: boss)
 */
export const getEnemiesForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0): BattleWave[] => {
  const hpScale = (1 + depth * BATTLE_SCALING.hpPerDepth) * hpMultiplier;
  const dmgScale = 1 + depth * BATTLE_SCALING.dmgPerDepth;

  if (node.type === 'boss') {
    // Boss fight: wave 1 = 2 normal minions, wave 2 = boss alone
    const bossConfig = depth < 12 ? BOSS_ENEMIES[0] : BOSS_ENEMIES[BOSS_ENEMIES.length - 1];
    const minion1 = NORMAL_ENEMIES[Math.floor(Math.random() * NORMAL_ENEMIES.length)];
    const minion2 = NORMAL_ENEMIES[Math.floor(Math.random() * NORMAL_ENEMIES.length)];
    return [
      { enemies: [buildEnemy(minion1, hpScale * 0.6, dmgScale * 0.7), buildEnemy(minion2, hpScale * 0.6, dmgScale * 0.7)] },
      { enemies: [buildEnemy(bossConfig, hpScale, dmgScale)] },
    ];
  }

  if (node.type === 'elite') {
    // Elite: 1 wave, elite + 1 weak sidekick
    const eliteConfig = ELITE_ENEMIES[Math.floor(Math.random() * ELITE_ENEMIES.length)];
    const sidekick = NORMAL_ENEMIES[Math.floor(Math.random() * NORMAL_ENEMIES.length)];
    return [
      { enemies: [buildEnemy(eliteConfig, hpScale, dmgScale), buildEnemy(sidekick, hpScale * 0.5, dmgScale * 0.6)] },
    ];
  }

  // Normal: 1-2 waves, each with 1-3 enemies
  const waveCount = depth >= 5 ? (Math.random() < 0.4 ? 2 : 1) : 1;
  const waves: BattleWave[] = [];
  for (let w = 0; w < waveCount; w++) {
    const enemyCount = depth === 0 ? 1 : Math.min(3, 1 + Math.floor(Math.random() * Math.min(3, 1 + Math.floor((depth + 2) / 3))));
    const waveEnemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const config = NORMAL_ENEMIES[Math.floor(Math.random() * NORMAL_ENEMIES.length)];
      // Later waves slightly weaker
      const waveScale = w === 0 ? 1 : 0.8;
      const enemy = buildEnemy(config, hpScale * waveScale, dmgScale * waveScale);
      enemy.distance = depth === 0 ? 1 : 2;  // first fight: close, rest: 2 steps
      waveEnemies.push(enemy);
    }
    waves.push({ enemies: waveEnemies });
  }
  return waves;
};
