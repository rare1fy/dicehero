/**
 * enemyTraits.ts — 五职业敌人各自的"递增 trait"维护
 *
 * [2026-05-09] 设计理念：
 *   全局狂暴（每回合 +6%）已废弃。每个职业有独立的"越打越强"机制：
 *
 *   warrior  : bloodFury  → 受到伤害累计 +1 永久攻击；上限 +6
 *   ranger   : 沿用 attackCount（已存在）→ enemyAI 在攻击后自增
 *   guardian : guardRage  → 每防御 1 次 +1，下次攻击爆发 +50%/层后清零；上限 3 层
 *   caster   : dotAmplifier → 同种 DOT 连续施加，每次 +1 stack；上限 4
 *   priest   : holyWrath  → 战斗每过 2 回合 +1（叠加 weak/vulnerable 持续 +1）；上限 4
 *
 *   normal/elite 才会触发；BOSS 走自身 phase[hpThreshold] 阶段递进，不再叠 trait。
 *
 *   纯函数模块，不依赖 React。
 */
import type { Enemy } from '../types/game';

const BLOOD_FURY_CAP = 6;
const GUARD_RAGE_CAP = 3;
const DOT_AMPLIFIER_CAP = 4;
const HOLY_WRATH_CAP = 4;

/**
 * 该敌人是否启用 trait 系统（仅 normal/elite，不含 BOSS）
 *
 * 通过 configId 前缀判断：BOSS 的 configId 都以 `boss_` 开头，详见 enemyEliteBoss.ts。
 * 这样无需运行时存 category 字段。
 */
export function shouldApplyTrait(enemy: Enemy): boolean {
  return !enemy.configId.startsWith('boss_');
}

/**
 * Warrior 受伤后累计 bloodFury（+1 ATK 直接加成，封顶 BLOOD_FURY_CAP）
 *
 * 调用时机：玩家攻击造成实际伤害后，由 useBattleCombat 在 setEnemies 内对所有受伤的 warrior 应用。
 */
export function applyBloodFuryOnHurt(enemy: Enemy): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'warrior') return enemy;
  const cur = enemy.bloodFury || 0;
  if (cur >= BLOOD_FURY_CAP) return enemy;
  return { ...enemy, bloodFury: cur + 1 };
}

/**
 * Guardian 防御后累计 guardRage（每层下次攻击 +50%；攻击后归零）
 */
export function applyGuardRageOnDefend(enemy: Enemy): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'guardian') return enemy;
  const cur = enemy.guardRage || 0;
  if (cur >= GUARD_RAGE_CAP) return enemy;
  return { ...enemy, guardRage: cur + 1 };
}

/** Guardian 攻击后清空 guardRage（爆发完归零） */
export function consumeGuardRageOnAttack(enemy: Enemy): Enemy {
  if (!enemy.guardRage) return enemy;
  return { ...enemy, guardRage: 0 };
}

/**
 * Caster DOT 放大：每次施加 DOT（poison/burn）调用一次，叠加 dotAmplifier（封顶 4）
 *
 * 调用时机：executeCasterSkill 决定 DOT 类型后，本函数返回的"额外加成值"加到 DOT 数值上。
 */
export function bumpDotAmplifier(enemy: Enemy): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'caster') return enemy;
  const cur = enemy.dotAmplifier || 0;
  if (cur >= DOT_AMPLIFIER_CAP) return enemy;
  return { ...enemy, dotAmplifier: cur + 1 };
}

/** 当前 DOT 加成值（注入到 poisonVal/burnVal） */
export function getDotAmplifierBonus(enemy: Enemy): number {
  if (!shouldApplyTrait(enemy)) return 0;
  if (enemy.combatType !== 'caster') return 0;
  return enemy.dotAmplifier || 0;
}

/**
 * Priest 圣怒：战斗每过 2 回合 +1。每层让 priest 施加的 weak/vulnerable duration +1，护甲祝福 +20%。
 *
 * 调用时机：battleTurn 切换时（敌人回合开始处），每个 priest 检查 turn % 2 === 0 时累加。
 */
export function bumpHolyWrathPerTurn(enemy: Enemy, battleTurn: number): Enemy {
  if (!shouldApplyTrait(enemy)) return enemy;
  if (enemy.combatType !== 'priest') return enemy;
  if (battleTurn === 0 || battleTurn % 2 !== 0) return enemy;
  const cur = enemy.holyWrath || 0;
  if (cur >= HOLY_WRATH_CAP) return enemy;
  return { ...enemy, holyWrath: cur + 1 };
}

export function getHolyWrath(enemy: Enemy): number {
  if (!shouldApplyTrait(enemy)) return 0;
  if (enemy.combatType !== 'priest') return 0;
  return enemy.holyWrath || 0;
}

export const TRAIT_CAPS = {
  BLOOD_FURY: BLOOD_FURY_CAP,
  GUARD_RAGE: GUARD_RAGE_CAP,
  DOT_AMPLIFIER: DOT_AMPLIFIER_CAP,
  HOLY_WRATH: HOLY_WRATH_CAP,
} as const;
