/**
 * 骰子特殊效果处理 - 元素坍缩 + 小丑随机
 */
import type { Die, DiceElement } from '../types/game';
import { getDiceDef, collapseElement } from '../data/dice';

export const applyDiceSpecialEffects = (diceArr: Die[]): Die[] => {
  const hasElemental = diceArr.some(d => getDiceDef(d.diceDefId).isElemental);
  const sharedElement = hasElemental ? collapseElement() : null;
  return diceArr.map(d => {
    const def = getDiceDef(d.diceDefId);
    if (def.isElemental && sharedElement) {
      return { ...d, element: sharedElement as DiceElement, collapsedElement: sharedElement as DiceElement };
    }
    if (d.diceDefId === 'joker') {
      return { ...d, value: def.faces[Math.floor(Math.random() * def.faces.length)] };
    }
    return d;
  });
};
