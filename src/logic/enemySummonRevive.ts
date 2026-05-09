/**
 * enemySummonRevive.ts — 敌人召唤/复活机制（纯函数 + AI 调度）
 *
 * [2026-05-09] 设计：
 *   1. 召唤：每个回合开始时检查所有存活敌人的 SummonRule，触发条件满足就 push 新敌人到当前 wave
 *   2. 复活：敌人 hp <= 0 时检查 ReviveRule，满足条件就回血 / 分裂成多只
 *
 *   通过 configId 去 NORMAL_ENEMIES + ELITE_ENEMIES + BOSS_ENEMIES 全表反查 EnemyConfig
 *   （由 buildPattern / buildEnemy 间接需要），避免运行时存储完整 config 副本
 */

import type { Enemy } from '../types/game';
import type { EnemyConfig } from '../config';
import { NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES } from '../config';
import { buildEnemy } from '../data/enemies';

/** 反查 EnemyConfig — 按 configId */
export function getEnemyConfig(configId: string): EnemyConfig | undefined {
  return NORMAL_ENEMIES.find(c => c.id === configId)
    || ELITE_ENEMIES.find(c => c.id === configId)
    || BOSS_ENEMIES.find(c => c.id === configId);
}

/**
 * 检查并执行单个敌人的召唤
 *
 * 返回值：
 *   - newMinions: 本回合新生成的 minion 列表（外层 setEnemies 用）
 *   - updatedSummoner: 更新过 summonCount 后的召唤者本体
 *   - log: 召唤的日志文本（用于 addLog/addToast）
 */
export interface SummonResult {
  newMinions: Enemy[];
  updatedSummoner: Enemy;
  log: string | null;
}

export function trySummonForEnemy(
  enemy: Enemy,
  battleTurn: number,
  currentWaveSize: number,
): SummonResult {
  const cfg = getEnemyConfig(enemy.configId);
  if (!cfg?.summons || enemy.isSummoned) {
    // 召唤物自身不会再召唤（防递归雪崩）
    return { newMinions: [], updatedSummoner: enemy, log: null };
  }
  const rule = cfg.summons;
  const interval = Math.max(1, rule.interval);
  const offset = rule.offset || 0;
  const count = rule.count || 1;
  const maxTotal = rule.maxTotal ?? 3;
  const waveCap = rule.waveCap ?? 4;
  const summoned = enemy.summonCount || 0;

  // 频率 / 上限 / 屏幕容量校验
  if (battleTurn < 1) return { newMinions: [], updatedSummoner: enemy, log: null };
  if ((battleTurn - offset) % interval !== 0) return { newMinions: [], updatedSummoner: enemy, log: null };
  if (summoned >= maxTotal) return { newMinions: [], updatedSummoner: enemy, log: null };
  if (currentWaveSize >= waveCap) return { newMinions: [], updatedSummoner: enemy, log: null };
  if (rule.hpThreshold != null && enemy.hp / enemy.maxHp > rule.hpThreshold) {
    return { newMinions: [], updatedSummoner: enemy, log: null };
  }

  const minionCfg = getEnemyConfig(rule.minionId);
  if (!minionCfg) return { newMinions: [], updatedSummoner: enemy, log: null };

  const slotsLeft = Math.min(count, maxTotal - summoned, waveCap - currentWaveSize);
  const newMinions: Enemy[] = [];
  for (let i = 0; i < slotsLeft; i++) {
    const m = buildEnemy(minionCfg, 1, 1);
    m.isSummoned = true;
    newMinions.push(m);
  }
  const updatedSummoner: Enemy = { ...enemy, summonCount: summoned + slotsLeft };
  const log = `${enemy.name} 召唤了 ${slotsLeft} 只 ${minionCfg.name}！`;
  return { newMinions, updatedSummoner, log };
}

/**
 * 检查并执行死亡敌人的复活/分裂
 *
 * 返回值（任一为 null 表示不复活，外层走原死亡流程）：
 *   - revivedSelf: 直接复活后的本体（hp 重置）
 *   - splits: 分裂出的多只敌人列表（与 revivedSelf 互斥）
 *   - log: 文案
 */
export interface ReviveResult {
  revivedSelf: Enemy | null;
  splits: Enemy[];
  log: string | null;
}

export function tryReviveOnDeath(enemy: Enemy): ReviveResult {
  const cfg = getEnemyConfig(enemy.configId);
  if (!cfg?.revive) return { revivedSelf: null, splits: [], log: null };
  if (enemy.revivedOnce) return { revivedSelf: null, splits: [], log: null };
  const rule = cfg.revive;

  // 分裂模式
  if (rule.splitInto && rule.splitInto > 0) {
    const splitCfg = rule.splitMinionId
      ? getEnemyConfig(rule.splitMinionId)
      : cfg;
    if (!splitCfg) return { revivedSelf: null, splits: [], log: null };
    const eachHp = Math.max(1, Math.floor((enemy.maxHp * rule.reviveHpRatio) / rule.splitInto));
    const splits: Enemy[] = [];
    for (let i = 0; i < rule.splitInto; i++) {
      const m = buildEnemy(splitCfg, 1, 1);
      m.hp = eachHp;
      m.maxHp = eachHp;
      m.attackDmg = Math.max(1, Math.floor(enemy.attackDmg * 0.7));
      m.revivedOnce = true; // 子代不再分裂
      m.isSummoned = true;
      splits.push(m);
    }
    return {
      revivedSelf: null,
      splits,
      log: `${enemy.name} 在死亡的瞬间分裂成了 ${rule.splitInto} 只！`,
    };
  }

  // 直接复活
  const newHp = Math.max(1, Math.floor(enemy.maxHp * rule.reviveHpRatio));
  return {
    revivedSelf: {
      ...enemy,
      hp: newHp,
      armor: 0,
      statuses: [],
      revivedOnce: true,
    },
    splits: [],
    log: `${enemy.name} 拒绝死亡，重新站起（${newHp} HP）！`,
  };
}
