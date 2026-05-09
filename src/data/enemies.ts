import { MapNode, Enemy, GameState, BattleWave } from '../types/game';
import { getDepthScaling } from '../config';
import { 
  NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES,
  type EnemyConfig } from '../config';

/**
 * 根据配置表生成运行时 pattern 函数
 */
const buildPattern = (config: EnemyConfig, dmgScale: number) => {
  return (t: number, self: Enemy, _player: GameState) => {
    for (const phase of config.phases) {
      if (phase.hpThreshold && self.hp >= self.maxHp * phase.hpThreshold) {
        continue;
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
    return { type: '攻击' as const, value: Math.floor(config.baseDmg * dmgScale) };
  };
};

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
    dropRelic: config.drops.relic,
    rerollReward: config.drops.rerollReward,
    statuses: [],
    distance: (config.combatType === 'warrior' || config.combatType === 'guardian') ? 2 : 3,
    pattern: buildPattern(config, dmgScale),
  };
};

/** 获取指定章节的普通敌人池 */
const getNormalPool = (chapter: number): EnemyConfig[] => {
  const pool = NORMAL_ENEMIES.filter(e => e.chapter === chapter);
  return pool.length > 0 ? pool : NORMAL_ENEMIES;
};

/** 获取指定章节的精英敌人池 */
const getElitePool = (chapter: number): EnemyConfig[] => {
  const pool = ELITE_ENEMIES.filter(e => e.chapter === chapter);
  return pool.length > 0 ? pool : ELITE_ENEMIES;
};

/** 获取指定章节的Boss（中Boss / 终Boss） */
const getBossForChapter = (chapter: number, isFinalBoss: boolean): EnemyConfig => {
  const chapterBosses = BOSS_ENEMIES.filter(b => b.chapter === chapter);
  if (chapterBosses.length >= 2) {
    // 每章2个Boss: [0]=中Boss(HP200), [1]=终Boss(HP380)
    return isFinalBoss ? chapterBosses[1] : chapterBosses[0];
  }
  if (chapterBosses.length === 1) return chapterBosses[0];
  // fallback
  return isFinalBoss ? BOSS_ENEMIES[BOSS_ENEMIES.length - 1] : BOSS_ENEMIES[0];
};

export const getEnemyForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0, dmgMultiplier: number = 1.0, chapter: number = 1): Enemy => {
  const scaling = getDepthScaling(depth);
  const hpScale = scaling.hpMult * hpMultiplier;
  const dmgScale = scaling.dmgMult * dmgMultiplier;

  if (node.type === 'boss') {
    const isFinal = depth >= 12;
    const config = getBossForChapter(chapter, isFinal);
    return buildEnemy(config, hpScale, dmgScale);
  }

  if (node.type === 'elite') {
    const pool = getElitePool(chapter);
    const config = pool[Math.floor(Math.random() * pool.length)];
    return buildEnemy(config, hpScale, dmgScale);
  }

  const pool = getAvailableEnemies(depth, chapter);
  const config = pool[Math.floor(Math.random() * pool.length)];
  return buildEnemy(config, hpScale, dmgScale);
};

/**
 * 根据层级+章节过滤可用的普通敌人类型
 * - 层0-1: 只有 warrior, guardian（新手保护期）
 * - 层2-3: 加入 ranger
 * - 层4+:  全类型
 */
const getAvailableEnemies = (depth: number, chapter: number): EnemyConfig[] => {
  const chapterPool = getNormalPool(chapter);
  if (depth <= 1) {
    const pool = chapterPool.filter(e => e.combatType === 'warrior' || e.combatType === 'guardian');
    return pool.length > 0 ? pool : chapterPool.slice(0, 2);
  }
  if (depth <= 3) {
    const pool = chapterPool.filter(e => e.combatType !== 'caster' && e.combatType !== 'priest');
    return pool.length > 0 ? pool : chapterPool;
  }
  return chapterPool;
};

/**
 * Generate multi-wave enemies for a battle node.
 */
export const getEnemiesForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0, dmgMultiplier: number = 1.0, chapter: number = 1): BattleWave[] => {
  const scaling = getDepthScaling(depth);
  const hpScale = scaling.hpMult * hpMultiplier;
  const dmgScale = scaling.dmgMult * dmgMultiplier;

  if (node.type === 'boss') {
    // [BOSS-SOLO 2026-05-09] 所有 BOSS 节点砍掉前置小怪波，只剩 BOSS 本尊单波。
    // 理由：BOSS 节点流程改为 Taunt → Banner → Entrance 三段独立演出，前置小怪啰嗦。
    const isFinal = depth >= 12;
    const bossConfig = getBossForChapter(chapter, isFinal);
    return [
      { enemies: [buildEnemy(bossConfig, hpScale, dmgScale)] },
    ];
  }

  if (node.type === 'elite') {
    const elitePool = getElitePool(chapter);
    const eliteConfig = elitePool[Math.floor(Math.random() * elitePool.length)];
    const normalPool = getNormalPool(chapter);
    const sidekick = normalPool[Math.floor(Math.random() * normalPool.length)];
    return [
      { enemies: [buildEnemy(eliteConfig, hpScale, dmgScale), buildEnemy(sidekick, hpScale * 0.5, dmgScale * 0.6)] },
    ];
  }

  // Normal: 2-3 waves
  // [2026-05-07] 战斗节奏调优：
  //   - 所有普通战斗（含第一场 depth=0）保底 2 波，提升单场爽感
  //   - depth>=5 起 50% 概率 3 波；depth>=10 80% 概率 3 波（中后期高潮战斗）
  const threeWaveChance = depth >= 10 ? 0.8 : depth >= 5 ? 0.5 : depth >= 3 ? 0.2 : 0;
  const waveCount = Math.random() < threeWaveChance ? 3 : 2;
  const waves: BattleWave[] = [];
  for (let w = 0; w < waveCount; w++) {
    // depth=0 第一场保护：每波 1~2 只低难度，避免新手挫败
    const enemyCount = depth === 0
      ? (w === 0 ? 1 : (Math.random() < 0.5 ? 1 : 2))
      : depth <= 1 ? (Math.random() < 0.4 ? 1 : 2)
      : depth <= 4 ? (Math.random() < 0.5 ? 2 : 3)
      : depth <= 9 ? (Math.random() < 0.3 ? 2 : 3)
      : Math.min(4, 3 + Math.floor(Math.random() * 2));
    const waveEnemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const pool = getAvailableEnemies(depth, chapter);
      const config = pool[Math.floor(Math.random() * pool.length)];
      // 第一波 1.0x，第二波 0.8x，第三波 0.7x（第三波再弱一档，避免疲劳）
      const waveScale = w === 0 ? 1 : w === 1 ? 0.8 : 0.7;
      const enemy = buildEnemy(config, hpScale * waveScale, dmgScale * waveScale);
      if (enemy.combatType === 'warrior' || enemy.combatType === 'guardian') {
        enemy.distance = depth === 0 ? 1 : 2;
      }
      waveEnemies.push(enemy);
    }
    waves.push({ enemies: waveEnemies });
  }
  return waves;
};
