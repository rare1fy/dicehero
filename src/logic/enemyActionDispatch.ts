/**
 * enemyActionDispatch.ts — PatternAction → 实际效果派发（路线 B 配套）
 *
 * [2026-05-09] 让 EnemyConfig.phases.actions 真正驱动每回合行动。
 *
 *   PatternAction.type:
 *     '攻击' → 直接攻击（伤害 = action.value，已经 dmgScale 缩放）
 *     '防御' → 给自己加 action.value 护甲；guardian 累 guardRage
 *     '技能' → 按 description 文本字典派发，施加 DOT / 控制 / 护甲祝福 等
 *
 *   description 文本字典（覆盖配置里出现过的 81 种）：
 *     灼烧 / 剧毒 / 火球 / 诅咒 / 诅咒爆发      → 上 DOT 状态
 *     冻结 / 虚弱 / 易伤 / 碎裂诅咒 / 诅咒注入 / 诅咒锻造 → 上控制状态
 *     力量                                    → 自加 strength（已废弃，按用户要求 caster/priest 不再有）
 *     护甲祝福                                → priest 给友军/自己 armor
 *     其他纯风味攻击命名（冰拳/撕咬 etc）       → "技能"也走攻击伤害分支（用风味词 + value 作为伤害）
 *
 *   trait/archetype 修正在 enemyAI 上层叠加，本模块只负责"PatternAction 该做什么"。
 */
import type { GameState, StatusEffect } from '../types/game';

/** description 文本 → 玩家受到的状态映射（DOT 类） */
const DOT_DESC_MAP: Record<string, 'burn' | 'poison'> = {
  '灼烧': 'burn',
  '剧毒': 'poison',
  '火球': 'burn',
  '诅咒': 'poison',
  '诅咒爆发': 'poison',
};

/** description 文本 → 玩家受到的控制状态映射 */
const CONTROL_DESC_MAP: Record<string, 'weak' | 'vulnerable' | 'freeze'> = {
  '冻结': 'freeze',
  '虚弱': 'weak',
  '易伤': 'vulnerable',
  '碎裂诅咒': 'vulnerable',  // 视为易伤变体（碎裂 → 受伤更重）
  '诅咒注入': 'weak',         // 视为虚弱变体
  '诅咒锻造': 'weak',
};

/** 是 priest/caster 不直伤的"风味攻击描述"？返回 true 时此 action 应当跳过攻击伤害（避免 caster 突然直伤玩家） */
export function isFlavorOnlyAttack(description?: string): boolean {
  if (!description) return false;
  // 这些是 caster/priest 配置里的"风味招式"，名字像攻击但实际不该打伤害
  const flavor = ['亡灵大军', '亡灵风暴', '骸骨之矛', '诅咒', '诅咒爆发'];
  return flavor.includes(description);
}

/** 取 description 对应的 DOT 状态类型（无对应则 null） */
export function getDotFromDescription(description?: string): 'burn' | 'poison' | null {
  if (!description) return null;
  return DOT_DESC_MAP[description] || null;
}

/** 取 description 对应的控制状态类型（无对应则 null） */
export function getControlFromDescription(description?: string): 'weak' | 'vulnerable' | 'freeze' | null {
  if (!description) return null;
  return CONTROL_DESC_MAP[description] || null;
}

/** description 是不是"护甲祝福" */
export function isArmorBlessDescription(description?: string): boolean {
  return description === '护甲祝福';
}

/** description 是不是"力量自加"（已废弃；保留判断用于配置兼容） */
export function isSelfStrengthDescription(description?: string): boolean {
  return description === '力量';
}

/** upsert 玩家 status，等同于 enemySkills 里 upsertStatus 的最小复制（避免循环依赖） */
export function applyPlayerStatus(
  game: GameState,
  type: 'burn' | 'poison' | 'weak' | 'vulnerable' | 'freeze',
  value: number,
  duration?: number,
): StatusEffect[] {
  const next = [...game.statuses];
  const existing = next.find(s => s.type === type);
  if (existing) {
    existing.value += value;
    if (duration && (!existing.duration || existing.duration < duration)) existing.duration = duration;
  } else {
    next.push({ type, value, ...(duration ? { duration } : {}) });
  }
  return next;
}
