/**
 * attackCalc.ts — 敌人攻击力 / 显示攻击力的纯函数
 *
 * [2026-05-09 v3] 改造：
 *   - 移除全局狂暴（>=5 回合 +6%/回合）：这种"全敌人通用"的递增违背"每职业独特"原则
 *   - 移除 BOSS 全局 ×1.15 / HP×1.20：BOSS 强度由 phases[hpThreshold] 阶段切换 + 配置数值承担
 *   - 五职业各自的"递增 trait"（详见 EnemyTraitsLogic）：
 *       warrior  : bloodFury (受伤累计 +1 ATK)
 *       ranger   : 沿用 attackCount 的 hitCount 递增（rangerAttackCountStep）
 *       guardian : guardRage (连续防御后下次攻击 +50%)
 *       caster   : DOT 放大（dotAmplifier，由 enemySkills 内部处理 DOT 数值，不影响攻击力）
 *       priest   : 圣怒（debuff/护甲叠加，不直伤，不影响攻击力）
 */
import type { Enemy, StatusEffect } from '../types/game';
import { ENEMY_ATTACK_MULT, STATUS_EFFECT_MULT } from '../config';

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
 * 计算敌人的有效攻击力（考虑 combatType 乘数 + 状态效果修正 + 职业 trait）
 *
 * 修正顺序：
 * 1. combatType 乘数（warrior ×1.3, ranger ×0.20 + hitCount 递增）
 * 2. [WARRIOR_TRAIT] bloodFury：每层 +1 直接攻击力（线性，符合"越打越疯"）
 * 3. [GUARDIAN_TRAIT] guardRage：每层 +50% 下次攻击伤害（消耗一次后归零，由 enemyAI 维护）
 * 4. 力量(strength): 攻击力 + strength.value
 * 5. 虚弱(weak): 攻击力 ×STATUS_EFFECT_MULT.weak（下限1）
 * 6. 玩家易伤(vulnerable): 攻击力 ×1.5（固定）
 * 7. 法术反噬(arcaneBackfire): 攻击力 ×(1 + 0.1×层数)  —— 法师专属、不可净化
 * 8. 减速(slow): 仅 ranger 受影响，攻击力 ×ENEMY_ATTACK_MULT.slow
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

  // 2. 战士血怒：每层 +1 直接攻击
  if (enemy.combatType === 'warrior' && enemy.bloodFury) {
    val += enemy.bloodFury;
  }

  // 3. 守护者怒气：每层 ×1.5（攻防交替的爆发瞬间）
  if (enemy.combatType === 'guardian' && enemy.guardRage && enemy.guardRage > 0) {
    val = Math.floor(val * (1 + 0.5 * enemy.guardRage));
  }

  // 4. 力量加成
  const strength = enemy.statuses.find(s => s.type === 'strength');
  if (strength) val += strength.value;

  // 5. 虚弱修正（下限1）
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) val = Math.max(1, Math.floor(val * STATUS_EFFECT_MULT.weak));

  // 6. 玩家易伤修正（固定 ×1.5，不随层数变化）
  const playerVuln = playerStatuses.find(s => s.type === 'vulnerable');
  if (playerVuln) val = Math.floor(val * STATUS_EFFECT_MULT.vulnerable);

  // 7. 法术反噬（法师专属，独立于 statuses 不可净化）
  const backfireMult = calcArcaneBackfireMult(extras.arcaneBackfire);
  if (backfireMult !== 1) val = Math.floor(val * backfireMult);

  return val;
}

/**
 * 弓箭手追击伤害（递增式：基础 +hitCount +1）
 */
export function getRangerFollowUpDmg(
  enemy: Enemy,
  attackCount: number,
  arcaneBackfire?: number,
): number {
  let val = Math.max(1, Math.floor(enemy.attackDmg * ENEMY_ATTACK_MULT.rangerHit) + attackCount + 1);
  const backfireMult = calcArcaneBackfireMult(arcaneBackfire);
  if (backfireMult !== 1) val = Math.floor(val * backfireMult);
  return val;
}

/**
 * 玩家面板预测显示用（不考虑减速、玩家 debuff），仅含 combatType 乘数 + 职业 trait
 */
export function getDisplayAttackDmg(enemy: Enemy): number {
  let val = enemy.attackDmg;
  if (enemy.combatType === 'warrior') {
    val = Math.floor(val * ENEMY_ATTACK_MULT.warrior);
  } else if (enemy.combatType === 'ranger') {
    const nextHitCount = enemy.attackCount ?? 0;
    val = Math.max(1, Math.floor(val * ENEMY_ATTACK_MULT.rangerHit) + nextHitCount);
  }
  if (enemy.combatType === 'warrior' && enemy.bloodFury) val += enemy.bloodFury;
  if (enemy.combatType === 'guardian' && enemy.guardRage && enemy.guardRage > 0) {
    val = Math.floor(val * (1 + 0.5 * enemy.guardRage));
  }
  const strength = enemy.statuses.find(s => s.type === 'strength');
  if (strength) val += strength.value;
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) val = Math.max(1, Math.floor(val * STATUS_EFFECT_MULT.weak));
  return val;
}
