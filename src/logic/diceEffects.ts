/**
 * 骰子特殊效果处理 - 元素坍缩 + 小丑随机
 */
import type { Die, DiceElement } from '../types/game';
import { getDiceDef, collapseElement } from '../data/dice';

export const applyDiceSpecialEffects = (diceArr: Die[], options?: { hasLimitBreaker?: boolean }): Die[] => {
  const hasElemental = diceArr.some(d => getDiceDef(d.diceDefId).isElemental);
  const sharedElement = hasElemental ? collapseElement() : null;
  return diceArr.map(d => {
    const def = getDiceDef(d.diceDefId);
    if (def.isElemental && sharedElement) {
      return { ...d, element: sharedElement as DiceElement, collapsedElement: sharedElement as DiceElement };
    }
    if (d.diceDefId === 'joker') {
      // 底线突破遗物：小丑骰子点数范围从1-9扩展到1-15
      const maxVal = options?.hasLimitBreaker ? 15 : 9;
      const val = Math.floor(Math.random() * maxVal) + 1;
      return { ...d, value: val };
    }
    return d;
  });
};
