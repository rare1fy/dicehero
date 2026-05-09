/**
 * enemyTraits.ts — 五职业 + 子类型（archetype）的递增 trait 维护
 *
 * [2026-05-09 v2] 强化：
 *   bloodFury 从 +1 ATK 改为 ×1.25/层（上限 ×2.0），逼玩家"两回合内清理"
 *   guardRage  +60%/层（上限 +180%）
 *   dotAmplifier DOT ×1.4/层（上限 ×2.5）
 *   holyWrath  weak/vulnerable 持续 +1/层 + 护甲祝福 +30%/层（封顶 4 层）
 *
 *   archetype 修正在 attackTraitMultiplier / archetypeArmorBoost 等纯函数里集中处理。
 *
 *   normal/elite 才会触发 bloodFury / guardRage / dotAmplifier / holyWrath；
 *   BOSS 走自身 phase[hpThreshold] 阶段递进，不再叠 trait。
 */
import type { Enemy } from '../types/game';

const BLOOD_FURY_CAP = 4;
const BLOOD_FURY_PER_STACK = 0.25;       // 每层 +25%（封顶 ×2.0）
const GUARD_RAGE_CAP = 3;
const GUARD_RAGE_PER_STACK = 0.6;        // 每层 +60%（封顶 ×2.8 单击）
const DOT_AMPLIFIER_CAP = 4;
const DOT_AMPLIFIER_PER_STACK = 0.4;     // 每层 ×1.4（封顶 ×2.5）
const HOLY_WRATH_CAP = 4;
const VENGEANCE_PER_STACK = 0.5;            // 每层 +50% 攻击（仅 berserker）

export function shouldApplyTrait(enemy: Enemy): boolean {
  // BOSS 走自身阶段，不叠 trait
  return !enemy.configId.startsWith('boss_');
}

// ============================================================
// trait 累加
// ============================================================

/** Warrior 受伤后累计 bloodFury（berserker 加倍） */
export function applyBloodFuryOnHurt(enemy: Enemy): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'warrior') return enemy;
  // paladin 不走 bloodFury（攻防交替型，靠护甲爆发不靠攻击递增）
  if (enemy.archetype === 'paladin') return enemy;
  const cur = enemy.bloodFury || 0;
  if (cur >= BLOOD_FURY_CAP) return enemy;
  return { ...enemy, bloodFury: cur + 1 };
}

/** Guardian 防御后累计 guardRage（bulwark 不爆发，纯肉盾） */
export function applyGuardRageOnDefend(enemy: Enemy): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'guardian') return enemy;
  if (enemy.archetype === 'bulwark') return enemy;  // 纯肉盾不爆发
  const cur = enemy.guardRage || 0;
  if (cur >= GUARD_RAGE_CAP) return enemy;
  return { ...enemy, guardRage: cur + 1 };
}

/** Guardian 攻击后清空 guardRage */
export function consumeGuardRageOnAttack(enemy: Enemy): Enemy {
  if (!enemy.guardRage) return enemy;
  return { ...enemy, guardRage: 0 };
}

/** Caster DOT 放大累加 */
export function bumpDotAmplifier(enemy: Enemy): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'caster') return enemy;
  if (enemy.archetype === 'cursemaster') return enemy;  // 诅咒师不放 DOT，不累加
  const cur = enemy.dotAmplifier || 0;
  if (cur >= DOT_AMPLIFIER_CAP) return enemy;
  return { ...enemy, dotAmplifier: cur + 1 };
}

/** Priest 圣怒：每 2 回合 +1 */
export function bumpHolyWrathPerTurn(enemy: Enemy, battleTurn: number): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'priest') return enemy;
  if (battleTurn === 0 || battleTurn % 2 !== 0) return enemy;
  const cur = enemy.holyWrath || 0;
  if (cur >= HOLY_WRATH_CAP) return enemy;
  return { ...enemy, holyWrath: cur + 1 };
}

// ============================================================
// 攻击力修正（被 attackCalc 调用）
// ============================================================

/**
 * trait 与 archetype 联合的攻击力修正乘数（已合并 bloodFury / guardRage / archetype 静态加成）
 *
 * 每个组件单独乘起来——在 attackCalc 顶层做一次 floor。
 */
export function attackTraitMultiplier(enemy: Enemy): number {
  let mul = 1;

  // bloodFury：基础 +25%/层；berserker +40%/层（=ATK 翻倍只需 3 层而非 4 层）
  if (enemy.combatType === 'warrior' && enemy.bloodFury) {
    const perStack = enemy.archetype === 'berserker' ? 0.40 : BLOOD_FURY_PER_STACK;
    mul *= 1 + perStack * enemy.bloodFury;
  }

  // [VENGEANCE 2026-05-10] berserker 专属：每死一个队友 +50% 攻击（无上限）
  if (enemy.archetype === 'berserker' && enemy.vengeance && enemy.vengeance > 0) {
    mul *= 1 + VENGEANCE_PER_STACK * enemy.vengeance;
  }

  // guardRage：每层 +60%（bulwark 已在累加阶段拦下，这里只对 enforcer 起效）
  if (enemy.combatType === 'guardian' && enemy.guardRage && enemy.guardRage > 0) {
    mul *= 1 + GUARD_RAGE_PER_STACK * enemy.guardRage;
  }

  // archetype 静态修正（不受 stack 影响）
  if (enemy.combatType === 'warrior') {
    if (enemy.archetype === 'striker') {
      // striker：第 2 步必爆发（用 attackCount 模拟回合数；warrior 没用 attackCount，退而求其次用 bloodFury 触发条件）
      // 用 hp 比例做判定：当 hp < maxHp * 0.7 时进入"出手期"，攻击 ×1.5
      if (enemy.hp / enemy.maxHp < 0.7) mul *= 1.5;
    } else if (enemy.archetype === 'paladin') {
      // paladin：每次攻击都是 ×1.2（稳定输出 + 防御切换）
      mul *= 1.2;
    }
  }

  if (enemy.combatType === 'ranger') {
    if (enemy.archetype === 'marksman') {
      // marksman：神射手单发高伤，整体 ×1.3
      mul *= 1.3;
    }
    // trapper / hunter 不加攻击修正（trapper 加的是状态而非伤害）
  }

  return mul;
}

/** Caster DOT 加成倍率（dotAmplifier × archetype） */
export function getDotMultiplier(enemy: Enemy): number {
  if (!shouldApplyTrait(enemy)) return 1;
  if (enemy.combatType !== 'caster') return 1;
  let mul = 1;
  if (enemy.dotAmplifier) {
    const perStack = enemy.archetype === 'pyromancer' ? 0.5 : DOT_AMPLIFIER_PER_STACK;
    mul *= 1 + perStack * enemy.dotAmplifier;
  }
  return mul;
}

/** Priest holyWrath 层数（用于 enemySkills 内的护甲祝福 / debuff 持续修正） */
export function getHolyWrath(enemy: Enemy): number {
  if (!shouldApplyTrait(enemy)) return 0;
  if (enemy.combatType !== 'priest') return 0;
  return enemy.holyWrath || 0;
}

/**
 * Guardian bulwark 防御获双倍护甲；其他守护者保持原有倍率
 * 调用方在 GUARDIAN_CONFIG.shieldMult 之上再乘这个值
 */
export function archetypeArmorBoost(enemy: Enemy): number {
  if (enemy.combatType === 'guardian' && enemy.archetype === 'bulwark') return 2.0;
  return 1.0;
}

/**
 * Paladin 攻击轮回：偶数回合（battleTurn % 2 === 0）改为防御
 * 用于 enemyAI 在 guardian 选举防御时混入 paladin 也走这条路径
 */
export function paladinShouldDefendThisTurn(enemy: Enemy, battleTurn: number): boolean {
  if (enemy.combatType !== 'warrior') return false;
  if (enemy.archetype !== 'paladin') return false;
  return battleTurn > 0 && battleTurn % 2 === 0;
}

/**
 * [VENGEANCE 2026-05-10] 每死亡 deadCount 个队友，给数组中存活的 berserker 累加 vengeance。
 *   - 仅 archetype === 'berserker' 起效（即使是 warrior/normal/elite）
 *   - 已死亡(hp<=0)的不再叠
 *   - 返回新数组（不变更入参）
 */
export function applyVengeanceToBerserkers(enemies: Enemy[], deadCount: number): Enemy[] {
  if (deadCount <= 0) return enemies;
  let changed = false;
  const next = enemies.map(e => {
    if (e.hp <= 0) return e;
    if (e.archetype !== 'berserker') return e;
    changed = true;
    return { ...e, vengeance: (e.vengeance || 0) + deadCount };
  });
  return changed ? next : enemies;
}

export const TRAIT_CAPS = {
  BLOOD_FURY: BLOOD_FURY_CAP,
  GUARD_RAGE: GUARD_RAGE_CAP,
  DOT_AMPLIFIER: DOT_AMPLIFIER_CAP,
  HOLY_WRATH: HOLY_WRATH_CAP,
  BLOOD_FURY_PER_STACK,
  GUARD_RAGE_PER_STACK,
  DOT_AMPLIFIER_PER_STACK,
} as const;
