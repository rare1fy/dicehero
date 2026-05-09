/**
 * attackCalc.ts — 敌人攻击力 / 显示攻击力的纯函数
 *
 * [2026-05-09 v3] 五职业 + archetype 子类型的差异化递增 trait（详见 enemyTraits.ts）：
 *   warrior  : bloodFury (×1.25/层，berserker ×1.4/层) + striker/paladin 静态修正
 *   ranger   : 沿用 attackCount 的 hitCount 递增 + marksman 静态 ×1.3
 *   guardian : guardRage (×1.6/层，bulwark 不爆发)
 *   caster   : dotAmplifier 走 enemySkills 内的 DOT 数值，不影响攻击力
 *   priest   : 无攻击力修正（不直伤）
 *
 *   全局狂暴 / BOSS 全局加成都已废弃（BOSS 走 phases[hpThreshold] 阶段切换）
 */
import type { Enemy, StatusEffect } from '../types/game';
import { ENEMY_ATTACK_MULT, STATUS_EFFECT_MULT } from '../config';
import { attackTraitMultiplier } from './enemyTraits';

/** 法师反噬：每层 +10% 玩家受到的伤害 */
function calcArcaneBackfireMult(stacks?: number): number {
  if (!stacks) return 1;
  return 1 + stacks * 0.1;
}

/** 攻击力计算的额外参数 */
export interface AttackCalcExtras {
  /** 敌人攻击计数（ranger 用） */
  attackCount?: number;
  /** 是否被减速 */
  isSlowed?: boolean;
  /** 法师【法术反噬】层数（不可净化的独立 debuff） */
  arcaneBackfire?: number;
}

/**
 * 计算敌人的有效攻击力（考虑 combatType 乘数 + 状态效果修正 + 职业 trait + archetype）
 *
 * 修正顺序：
 * 1. combatType 乘数（warrior ×1.3, ranger ×0.20 + hitCount 递增；marksman 还会 hitCount ×2）
 * 2. trait + archetype 综合乘数（attackTraitMultiplier）
 * 3. 力量(strength): + strength.value
 * 4. 虚弱(weak): ×STATUS_EFFECT_MULT.weak（下限 1）
 * 5. 玩家易伤(vulnerable): ×1.5
 * 6. 法术反噬(arcaneBackfire): ×(1 + 0.1×层数)
 * 7. 减速(slow): 仅 ranger 受影响 ×ENEMY_ATTACK_MULT.slow
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
    // marksman 神射手：hitCount 直接 ×2（每攻击额外多算一发）
    const baseHit = extras.attackCount ?? 0;
    const hitCount = enemy.archetype === 'marksman' ? baseHit * 2 : baseHit;
    val = Math.max(1, Math.floor(val * ENEMY_ATTACK_MULT.rangerHit) + hitCount);
    if (extras.isSlowed) {
      val = Math.floor(val * ENEMY_ATTACK_MULT.slow);
    }
  }

  // 2. trait + archetype 综合乘数
  const traitMul = attackTraitMultiplier(enemy);
  if (traitMul !== 1) val = Math.floor(val * traitMul);

  // 3. 力量加成
  const strength = enemy.statuses.find(s => s.type === 'strength');
  if (strength) val += strength.value;

  // 4. 虚弱
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) val = Math.max(1, Math.floor(val * STATUS_EFFECT_MULT.weak));

  // 5. 玩家易伤
  const playerVuln = playerStatuses.find(s => s.type === 'vulnerable');
  if (playerVuln) val = Math.floor(val * STATUS_EFFECT_MULT.vulnerable);

  // 6. 法术反噬
  const backfireMult = calcArcaneBackfireMult(extras.arcaneBackfire);
  if (backfireMult !== 1) val = Math.floor(val * backfireMult);

  return val;
}

/**
 * 弓箭手追击伤害（基础 ×0.20 +hitCount +1；marksman hitCount ×2）
 */
export function getRangerFollowUpDmg(
  enemy: Enemy,
  attackCount: number,
  arcaneBackfire?: number,
): number {
  const hit = enemy.archetype === 'marksman' ? attackCount * 2 : attackCount;
  let val = Math.max(1, Math.floor(enemy.attackDmg * ENEMY_ATTACK_MULT.rangerHit) + hit + 1);
  const backfireMult = calcArcaneBackfireMult(arcaneBackfire);
  if (backfireMult !== 1) val = Math.floor(val * backfireMult);
  // marksman 也吃 trait 静态加成
  const traitMul = attackTraitMultiplier(enemy);
  if (traitMul !== 1) val = Math.floor(val * traitMul);
  return val;
}

/**
 * 玩家面板预测显示用（不考虑减速、玩家 debuff）
 */
export function getDisplayAttackDmg(enemy: Enemy): number {
  let val = enemy.attackDmg;
  if (enemy.combatType === 'warrior') {
    val = Math.floor(val * ENEMY_ATTACK_MULT.warrior);
  } else if (enemy.combatType === 'ranger') {
    const baseHit = enemy.attackCount ?? 0;
    const hit = enemy.archetype === 'marksman' ? baseHit * 2 : baseHit;
    val = Math.max(1, Math.floor(val * ENEMY_ATTACK_MULT.rangerHit) + hit);
  }
  const traitMul = attackTraitMultiplier(enemy);
  if (traitMul !== 1) val = Math.floor(val * traitMul);
  const strength = enemy.statuses.find(s => s.type === 'strength');
  if (strength) val += strength.value;
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) val = Math.max(1, Math.floor(val * STATUS_EFFECT_MULT.weak));
  return val;
}
