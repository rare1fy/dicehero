/**
 * attackCalc.ts — 攻击力计算纯函数
 * 从 DiceHeroGame.tsx 提取，ARCH-6
 */

import type { Enemy, StatusEffect } from '../types/game';

/**
 * 计算敌人的有效攻击力（考虑虚弱/易伤/力量修正）
 * - 虚弱(weak): 攻击力 ×0.75
 * - 玩家易伤(vulnerable): 攻击力 ×1.5
 * - 力量(strength): 攻击力 + strength.value
 */
export function getEffectiveAttackDmg(
  enemy: Enemy,
  playerStatuses: StatusEffect[],
): number {
  let val = enemy.attackDmg;
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) val = Math.floor(val * 0.75);
  const playerVuln = playerStatuses.find(s => s.type === 'vulnerable');
  if (playerVuln) val = Math.floor(val * 1.5);
  const strength = enemy.statuses.find(s => s.type === 'strength');
  if (strength) val += strength.value;
  return val;
}
