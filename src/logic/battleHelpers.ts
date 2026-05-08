/**
 * battleHelpers.ts — 战斗相关辅助函数和常量
 * 
 * 从 DiceHeroGame.tsx 提取的战斗辅助逻辑。
 */

import type { StatusEffect } from '../types/game';

/** 战斗类型描述（用于UI显示） */
export const COMBAT_TYPE_DESC: Record<string, { name: string; icon: string; color: string; desc: string }> = {
  warrior: { name: '战士', icon: '', color: 'var(--pixel-red)', desc: '近战类型，需要接近后才能攻击。每回合逼近1步，到达后每回合普通攻击。' },
  guardian: { name: '守护者', icon: '', color: 'var(--pixel-blue)', desc: '重装近战类型，需要接近后才能攻击。交替攻击和举盾防御，获得额外护甲。' },
  ranger: { name: '游侠', icon: '', color: 'var(--pixel-green)', desc: '远程弓箭手，直接攻击两次。每次伤害较低但持续输出。' },
  caster: { name: '术士', icon: '', color: 'var(--pixel-purple)', desc: '远程施法者，不会直接攻击。专注施加毒素、灼烧等持续伤害效果。' },
  priest: { name: '牧师', icon: '', color: 'var(--pixel-gold)', desc: '支援型，不会攻击玩家。为队友治疗、加甲、加力量，或给玩家施加虚弱、易伤等减益。' },
};

/** 状态效果回合递减 */
export function tickStatuses(statuses: StatusEffect[]): StatusEffect[] {
  return statuses
    .map(s => {
      if (s.duration !== undefined && s.duration > 0) {
        return { ...s, duration: s.duration - 1 };
      }
      return s;
    })
    .filter(s => {
      // 保留没有duration限制的（永久效果）
      if (s.duration === undefined) return true;
      // 保留duration > 0 的
      return s.duration > 0;
    });
}

/** 判断是否为AOE牌型 */
export function isAoeHand(activeHands: string[]): boolean {
  return activeHands.some(h => ['顺子', '4顺', '5顺', '6顺', '元素顺', '元素葫芦', '皇家元素顺'].includes(h));
}

/** 获取敌人距离对应的视觉缩放参数 */
export function getDepthVisuals(distance: number) {
  const depthScale = distance === 0 ? 1.25 : distance === 1 ? 0.95 : distance === 2 ? 0.75 : 0.6;
  const depthY = distance >= 3 ? -50 : distance === 2 ? -25 : distance === 1 ? -5 : 30;
  const depthBrightness = distance >= 3 ? 0.82 : distance === 2 ? 0.9 : distance === 1 ? 0.95 : 1.0;
  const depthZ = distance >= 3 ? 1 : distance === 2 ? 3 : distance === 1 ? 5 : 7;
  return { depthScale, depthY, depthBrightness, depthZ };
}

/**
 * 玩家受到伤害时的屏障/护甲抵挡计算（纯函数）
 *
 * [2026-05-07] 法师【奥术屏障】新增：
 * - `chantShield` 优先抵挡所有伤害（包括 DOT 中毒/灼烧），护甲无法吸收的 DOT 也能抵
 * - `armor` 仅抵挡普通伤害（非 DOT）
 *
 * @param incoming 入射伤害
 * @param chantShield 当前奥术屏障层数
 * @param armor 当前护甲（可选；DOT 伤害应传 0 或跳过此参数）
 * @param bypassArmor 是否绕过 armor（DOT 场景：true → armor 不吸收）
 * @returns { absorbedByShield, absorbedByArmor, hpDamage, newShield, newArmor }
 */
export function absorbPlayerDamage(
  incoming: number,
  chantShield: number,
  armor: number,
  bypassArmor: boolean = false,
): {
  absorbedByShield: number;
  absorbedByArmor: number;
  hpDamage: number;
  newShield: number;
  newArmor: number;
} {
  let remaining = Math.max(0, incoming);
  let absorbedByShield = 0;
  let absorbedByArmor = 0;

  // 1) 奥术屏障优先吸收（一切伤害）
  if (chantShield > 0 && remaining > 0) {
    absorbedByShield = Math.min(chantShield, remaining);
    remaining -= absorbedByShield;
  }

  // 2) 护甲吸收（DOT 场景绕过）
  let newArmor = armor;
  if (!bypassArmor && armor > 0 && remaining > 0) {
    absorbedByArmor = Math.min(armor, remaining);
    remaining -= absorbedByArmor;
    newArmor = armor - absorbedByArmor;
  }

  return {
    absorbedByShield,
    absorbedByArmor,
    hpDamage: remaining,
    newShield: chantShield - absorbedByShield,
    newArmor,
  };
}

/**
 * 法师【吟唱被打扰】副作用计算（纯函数）
 *
 * [2026-05-08] 吟唱蓄力期间被攻击的博弈机制：
 *   - 触发条件：playerClass === 'mage' && chargeStacks > 0 && incomingDamage > 0
 *     （任意类型伤害都算：普攻/追击/中毒/灼烧/嘲讽反噬，且**屏障吸收的也算**）
 *   - 累加规则：每受击 1 次，叠加 2^N 层 vulnerable（N = 本轮已受击次数+1）
 *     第1次 = +2 层 / 第2次 = +4 / 第3次 = +8 / 第N次 = +2^N
 *   - 重置时机：出牌后吟唱重置 → 同时把 mageChantHitCount 清零（在 playHand/turnEndProcessing 处理）
 *   - duration：vulnerable 持续 2 回合（沿用现有 vulnerable 设计）
 *
 * 返回 null 表示不触发；否则返回 { newHitCount, addedStacks }。
 * 调用方拿到结果后自己负责把 statuses 里 vulnerable 升级 + 把 mageChantHitCount 写回。
 */
export function calcMageChantHitPenalty(
  playerClass: string | undefined,
  chargeStacks: number | undefined,
  hitCount: number | undefined,
  incomingDamage: number,
): { newHitCount: number; addedStacks: number } | null {
  if (playerClass !== 'mage') return null;
  if ((chargeStacks || 0) <= 0) return null;
  if (incomingDamage <= 0) return null;
  const newHitCount = (hitCount || 0) + 1;
  const addedStacks = Math.pow(2, newHitCount); // 2,4,8,16,32...
  return { newHitCount, addedStacks };
}

/**
 * 把吟唱受击的 vulnerable 副作用应用到 GameState 的 statuses 数组上。
 *
 * 直接调用 calcMageChantHitPenalty 拿到 addedStacks 后，由本函数负责：
 *   - 找 statuses 里现存的 vulnerable，value 累加 addedStacks
 *   - 没有则新增 1 条（duration: 2 回合）
 *
 * [纯函数] 返回新的 statuses 数组（不修改原数组）。
 */
export function applyChantHitVulnerable(
  statuses: StatusEffect[],
  addedStacks: number,
): StatusEffect[] {
  const VULN_DURATION = 2;
  const existing = statuses.find(s => s.type === 'vulnerable');
  if (existing) {
    return statuses.map(s =>
      s.type === 'vulnerable'
        ? { ...s, value: s.value + addedStacks, duration: Math.max(s.duration ?? 0, VULN_DURATION) }
        : s,
    );
  }
  return [...statuses, { type: 'vulnerable', value: addedStacks, duration: VULN_DURATION }];
}
