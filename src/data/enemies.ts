import { MapNode, Enemy, GameState, BattleWave } from '../types/game';
import { getDepthScaling } from '../config';
import { 
  NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES,
  type EnemyConfig } from '../config';

/**
 * 根据配置表生成运行时 pattern 函数
 * 将纯数据的行为配置转换为可执行的 pattern 函数
 */
const buildPattern = (config: EnemyConfig, dmgScale: number) => {
  return (t: number, self: Enemy, _player: GameState) => {
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
    configId: config.id,
    name: config.name,
    emoji: config.emoji,
    hp: Math.floor(config.baseHp * hpScale),
    maxHp: Math.floor(config.baseHp * hpScale),
    armor: 0,
    attackDmg: Math.floor(config.baseDmg * dmgScale),
    combatType: config.combatType || 'warrior',
    dropGold: config.drops.gold,
    dropAugment: config.drops.augment,
    rerollReward: config.drops.rerollReward,
    statuses: [],
    distance: (config.combatType === 'warrior' || config.combatType === 'guardian') ? 2 : 3,
    pattern: buildPattern(config, dmgScale),
  };
};

export const getEnemyForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0, dmgMultiplier: number = 1.0): Enemy => {
  const scaling = getDepthScaling(depth);
  const hpScale = scaling.hpMult * hpMultiplier;
  const dmgScale = scaling.dmgMult * dmgMultiplier;

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

/**
 * 根据层级过滤可用的普通敌人类型
 * 设计原则：前几层只出近战（warrior/guardian），中期加入ranger，后期全类型
 * - 层0-1: 只有 warrior, guardian（新手保护期，纯近战）
 * - 层2-3: 加入 ranger（远程开始出现）
 * - 层4+:  全类型（caster/priest 也开始出现）
 */
const getAvailableEnemies = (depth: number): typeof NORMAL_ENEMIES => {
  if (depth <= 1) {
    // 新手期：只出近战
    const pool = NORMAL_ENEMIES.filter(e => e.combatType === 'warrior' || e.combatType === 'guardian');
    return pool.length > 0 ? pool : NORMAL_ENEMIES.slice(0, 2);
  }
  if (depth <= 3) {
    // 中前期：加入ranger
    const pool = NORMAL_ENEMIES.filter(e => e.combatType !== 'caster' && e.combatType !== 'priest');
    return pool.length > 0 ? pool : NORMAL_ENEMIES;
  }
  // 中后期：全类型
  return NORMAL_ENEMIES;
};

export const getEnemiesForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0, dmgMultiplier: number = 1.0): BattleWave[] => {
  const scaling = getDepthScaling(depth);
  const hpScale = scaling.hpMult * hpMultiplier;
  const dmgScale = scaling.dmgMult * dmgMultiplier;

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
  const multiWaveChance = depth >= 9 ? 0.85 : depth >= 5 ? 0.70 : depth >= 3 ? 0.50 : depth >= 1 ? 0.25 : 0;
  const waveCount = Math.random() < multiWaveChance ? 2 : 1;
  const waves: BattleWave[] = [];
  for (let w = 0; w < waveCount; w++) {
    const enemyCount = depth === 0 ? 1 : depth <= 1 ? (Math.random() < 0.4 ? 1 : 2) : depth <= 4 ? (Math.random() < 0.5 ? 2 : 3) : depth <= 9 ? (Math.random() < 0.3 ? 2 : 3) : Math.min(4, 3 + Math.floor(Math.random() * 2));
    const waveEnemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const pool = getAvailableEnemies(depth);
      const config = pool[Math.floor(Math.random() * pool.length)];
      // Later waves slightly weaker
      const waveScale = w === 0 ? 1 : 0.8;
      const enemy = buildEnemy(config, hpScale * waveScale, dmgScale * waveScale);
      // Distance based on combat type: melee starts far, ranged stays put
      if (enemy.combatType === 'warrior' || enemy.combatType === 'guardian') {
        enemy.distance = depth === 0 ? 1 : 2;
      }
      // Ranged enemies keep distance=0 (they don't need to approach)
      waveEnemies.push(enemy);
    }
    waves.push({ enemies: waveEnemies });
  }
  return waves;
};
