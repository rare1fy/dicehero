/**
 * 伤害计算器 - 纯函数
 */
import type { Die } from '../types/game';
import { HAND_TYPES } from '../data/handTypes';
import { getDiceDef } from '../data/dice';

export interface DamageResult {
  base: number;
  mult: number;
  totalDmg: number;
}

/**
 * 计算牌型基础伤害和倍率（不含增幅加成，增幅在调用方处理）
 */
export const calculateBaseHandDamage = (
  handName: string,
  handLevel: number,
  selectedDice: Die[],
): DamageResult => {
  const htDef = HAND_TYPES.find(h => h.name === handName);
  if (!htDef) return { base: 0, mult: 1, totalDmg: 0 };

  const level = handLevel || 1;
  let base = htDef.base + (level - 1) * 3;
  let mult = htDef.mult + (level - 1) * 0.3;

  // 骰子面值加成
  const diceSum = selectedDice.reduce((s, d) => s + d.value, 0);
  base += diceSum;

  // 骰子特殊效果
  for (const d of selectedDice) {
    const def = getDiceDef(d.diceDefId);
    if (def.id === 'blade') base += 15;
    if (def.id === 'amplify') mult += 0.5;
  }

  const totalDmg = Math.max(1, Math.floor(base * mult));
  return { base, mult, totalDmg };
};
