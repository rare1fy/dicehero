/**
 * bossPhaseSwitch.ts — BOSS 阶段切换检测
 *
 * [2026-05-09] 设计：
 *   每只 BOSS 的 EnemyConfig.phases 有多个 hpThreshold（按从大到小排）。
 *   玩家攻击造成伤害后，根据"伤害前 hpRatio"和"伤害后 hpRatio"判定是否跨过任何
 *   未触发过的 phase 阈值。每个阈值仅触发一次（用 Map<uid, currentStage> 记忆）。
 *
 *   currentStage：
 *     初始 1（首次进战，最高血量阶段）
 *     跨第一个 hpThreshold → 2
 *     跨第二个 hpThreshold → 3
 *     ...
 *
 *   返回 stageReached 表示这次伤害让 BOSS 进入第几阶段（首次进入才返回非 null）；
 *   外层据此触发演出。
 */
import type { Enemy } from '../types/game';
import { getEnemyConfig } from './enemySummonRevive';

export interface PhaseSwitchResult {
  /** 这次伤害让 BOSS 进入了第几阶段（≥2，首次进入才返回；未跨阈值或非 BOSS 时返回 null） */
  stageReached: number | null;
  /** 该阶段对应的 hpThreshold（用于日志/调试） */
  threshold: number | null;
  /** 该 BOSS 的总阶段数（含初始 stage 1）= phases.length */
  totalStages: number;
}

/**
 * 判定 BOSS 是否在这次伤害中跨越了一个新的 phase 阈值
 *
 * @param enemy        受伤的敌人（必须是 BOSS，configId 以 boss_ 开头）
 * @param hpBefore     伤害前的 hp
 * @param hpAfter      伤害后的 hp（>=0；若死亡传 0，但本函数不会触发死亡阶段）
 * @param currentStage Map 里记录的"已触达阶段"，未记录视为 1
 */
export function checkBossPhaseSwitch(
  enemy: Enemy,
  hpBefore: number,
  hpAfter: number,
  currentStage: number,
): PhaseSwitchResult {
  // 死亡或非 BOSS 不触发
  if (hpAfter <= 0) return { stageReached: null, threshold: null, totalStages: 1 };
  if (!enemy.configId.startsWith('boss_')) return { stageReached: null, threshold: null, totalStages: 1 };

  const cfg = getEnemyConfig(enemy.configId);
  if (!cfg) return { stageReached: null, threshold: null, totalStages: 1 };
  const phases = cfg.phases || [];
  const totalStages = phases.length;
  if (totalStages < 2) return { stageReached: null, threshold: null, totalStages };

  // 拿到所有 hpThreshold 排序（从大到小，对应阶段 2/3/4...）。
  // 注意：phases[i].hpThreshold = 该阶段"激活时的最大血量比"——血量降到 < threshold 时切换到下一阶段。
  // EnemyConfig 里的写法：phases 数组 [ {hpThreshold: 0.5}, {} ]，即 hp >= 50% 用 phases[0]，否则 phases[1]。
  // 所以阶段 1（初始）使用 phases[0]（高血量），跨过 0.5 进入阶段 2，使用 phases[1]。
  // 多 phase 时按 hpThreshold 顺序拿出（[0] 是 0.5，[1] 是 0.3...），跨每个阈值递进一阶。
  const thresholds: number[] = [];
  for (let i = 0; i < phases.length; i++) {
    const t = phases[i].hpThreshold;
    if (typeof t === 'number') thresholds.push(t);
  }
  if (thresholds.length === 0) return { stageReached: null, threshold: null, totalStages };

  const before = hpBefore / enemy.maxHp;
  const after = hpAfter / enemy.maxHp;

  // 找出"跨过的最低阈值"——thresholds 是按"出现顺序"传入的，通常从高到低
  // 跨过第 i 个阈值 → 进入第 (i+2) 阶段（i=0 时进入阶段 2）
  let stageReached: number | null = null;
  let crossedThreshold: number | null = null;
  for (let i = 0; i < thresholds.length; i++) {
    const t = thresholds[i];
    if (before >= t && after < t) {
      const candidate = i + 2;  // 阶段 2/3/...
      if (candidate > currentStage) {
        stageReached = candidate;
        crossedThreshold = t;
      }
    }
  }

  return { stageReached, threshold: crossedThreshold, totalStages };
}
