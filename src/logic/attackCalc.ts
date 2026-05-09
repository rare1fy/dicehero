/**
 * attackCalc.ts — 敌人攻击力计算纯函数
 * 从 DiceHeroGame.tsx / enemyAI.ts 提取，ARCH-6
 *
 * 职责：计算敌人的有效攻击伤害值
 * - combatType 乘数修正（近战/远程）
 * - 减速(slow)修正
 * - 虚弱(weak)修正
 * - 玩家易伤(vulnerable)修正
 * - 力量(strength)加成
 */

import type { Enemy, StatusEffect } from '../types/game';
import { STATUS_EFFECT_MULT, ENEMY_ATTACK_MULT } from '../config';
import { calcArcaneBackfireMult } from './battleHelpers';

/** 攻击力计算的额外参数 */
export interface AttackCalcExtras {
  /** 敌人攻击计数（ranger 用） */
  attackCount?: number;
  /** 是否被减速 */
  isSlowed?: boolean;
  /** 法师【法术反噬】层数（不可净化的独立 debuff） */
  arcaneBackfire?: number;
  /** [2026-05-09 RAGE] 当前战斗回合数（≥5 后敌人进入"狂暴"，攻击递增） */
  battleTurn?: number;
}

/**
 * [2026-05-09] 战斗节奏控制：从第 5 回合起，所有敌人进入"狂暴"——
 *   攻击力 ×(1 + 0.06 × (turn - 4))，每回合 +6%
 *   - 第 5 回合 +6% / 第 8 回合 +24% / 第 12 回合 +48% / 第 20 回合 +96%
 *   防止玩家"龟缩拖延"策略。BOSS 关同样适用。
 */
function calcRageMult(battleTurn?: number): number {
  const t = battleTurn || 0;
  if (t < 5) return 1;
  return 1 + 0.06 * (t - 4);
}

/**
 * [2026-05-09 BOSS-BUFF] BOSS 全局攻击加成 ×1.15。
 * 原 baseDmg 偏温和，玩家普遍反馈"BOSS 不够厉害"。改在战斗时挂乘子，
 * 而不是改每个 boss 的 baseDmg 数据，方便后续按章节单独微调。
 */
function calcBossDmgBuff(enemy: Enemy): number {
  const isBoss = typeof enemy.configId === 'string' && enemy.configId.startsWith('boss_');
  return isBoss ? 1.15 : 1;
}

/**
 * 计算敌人的有效攻击力（考虑 combatType 乘数 + 状态效果修正）
 *
 * 修正顺序：
 * 1. combatType 乘数（warrior ×1.3, ranger ×0.4 + hitCount 递增）
 * 2. 力量(strength): 攻击力 + strength.value
 * 3. 虚弱(weak): 攻击力 ×STATUS_EFFECT_MULT.weak（下限1）
 * 4. 玩家易伤(vulnerable): 攻击力 ×1.5（固定）
 * 5. 法术反噬(arcaneBackfire): 攻击力 ×(1 + 0.1×层数)  —— 法师专属、不可净化
 * 6. 减速(slow): 仅 ranger 受影响，攻击力 ×ENEMY_ATTACK_MULT.slow
 * 7. [2026-05-09] 狂暴(turn≥5): 攻击力 ×(1 + 0.06 × (turn - 4))
 * 8. [2026-05-09] BOSS 全局加成 ×1.15
 */
export function getEffectiveAttackDmg(
  enemy: Enemy,
  playerStatuses: StatusEffect[],
  extras: AttackCalcExtras = {},
): number {
  let val = enemy.attackDmg;

  // 1. combatType 乘数
  if (enemy.combatType === 'warrior') {
    val = Math.floor(val * ENEMY_ATTACK_MULT.warrior);
  }
  if (enemy.combatType === 'ranger') {
    const hitCount = extras.attackCount ?? 0;
    val = Math.max(1, Math.floor(val * ENEMY_ATTACK_MULT.rangerHit) + hitCount);
    if (extras.isSlowed) {
      val = Math.floor(val * ENEMY_ATTACK_MULT.slow);
    }
  }

  // 2. 力量加成
  const strength = enemy.statuses.find(s => s.type === 'strength');
  if (strength) val += strength.value;

  // 3. 虚弱修正（下限1）
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) val = Math.max(1, Math.floor(val * STATUS_EFFECT_MULT.weak));

  // 4. 玩家易伤修正（固定 ×1.5，不随层数变化）
  const playerVuln = playerStatuses.find(s => s.type === 'vulnerable');
  if (playerVuln) val = Math.floor(val * STATUS_EFFECT_MULT.vulnerable);

  // 5. 法术反噬（法师专属，独立于 statuses 不可净化）
  const backfireMult = calcArcaneBackfireMult(extras.arcaneBackfire);
  if (backfireMult !== 1) val = Math.floor(val * backfireMult);

  // 6. 狂暴：拖久越凶
  const rageMult = calcRageMult(extras.battleTurn);
  if (rageMult !== 1) val = Math.floor(val * rageMult);

  // 7. BOSS 全局加成
  const bossBuff = calcBossDmgBuff(enemy);
  if (bossBuff !== 1) val = Math.floor(val * bossBuff);

  return val;
}

/**
 * 计算 ranger 追击伤害（第二击）
 * 追击伤害 = max(1, floor(attackDmg × rangerHit) + attackCount + 1)
 */
export function getRangerFollowUpDmg(
  enemy: Enemy,
  attackCount: number,
  arcaneBackfire?: number,
  battleTurn?: number,
): number {
  let val = Math.max(1, Math.floor(enemy.attackDmg * ENEMY_ATTACK_MULT.rangerHit) + attackCount + 1);
  const backfireMult = calcArcaneBackfireMult(arcaneBackfire);
  if (backfireMult !== 1) val = Math.floor(val * backfireMult);
  // [2026-05-09] 狂暴 + BOSS 加成同步生效
  const rageMult = calcRageMult(battleTurn);
  if (rageMult !== 1) val = Math.floor(val * rageMult);
  const bossBuff = calcBossDmgBuff(enemy);
  if (bossBuff !== 1) val = Math.floor(val * bossBuff);
  return val;
}

/**
 * 计算敌人在面板 UI 上应显示的"当前实际攻击力"（供玩家预判）
 *
 * [2026-05-07] 此前 UI 直接读 enemy.attackDmg，而 ranger 实际打出的值是
 * `floor(attackDmg × 0.2) + hitCount`，且 hitCount 每次攻击递增 +2，
 * 导致成长期面板数值脱节。此函数对齐实战值。
 *
 * 不考虑玩家状态（虚弱/易伤）和减速，因为这些是战斗瞬时修正，
 * 面板只展示"敌人自身当前的攻击能力"。
 */
export function getDisplayAttackDmg(enemy: Enemy, battleTurn?: number): number {
  let val = enemy.attackDmg;
  if (enemy.combatType === 'warrior') {
    val = Math.floor(val * ENEMY_ATTACK_MULT.warrior);
  } else if (enemy.combatType === 'ranger') {
    const nextHitCount = enemy.attackCount ?? 0;
    val = Math.max(1, Math.floor(val * ENEMY_ATTACK_MULT.rangerHit) + nextHitCount);
  }
  const strength = enemy.statuses.find(s => s.type === 'strength');
  if (strength) val += strength.value;
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) val = Math.max(1, Math.floor(val * STATUS_EFFECT_MULT.weak));
  // [2026-05-09] 显示值同步含狂暴 + BOSS 加成
  const rageMult = calcRageMult(battleTurn);
  if (rageMult !== 1) val = Math.floor(val * rageMult);
  const bossBuff = calcBossDmgBuff(enemy);
  if (bossBuff !== 1) val = Math.floor(val * bossBuff);
  return val;
}
