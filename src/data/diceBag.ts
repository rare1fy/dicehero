/**
 * diceBag.ts - 骰子库核心逻辑
 * 
 * 管理骰子库(deck) + 弃骰库(discard) 的循环运转。
 * 替代原来的 diceColors.ts。
 */

import type { Die } from '../types/game';
import { getDiceDef, rollDiceDef } from './dice';

/** Fisher-Yates 洗牌 */
export const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 从骰子库抽取指定数量的骰子
 * 如果骰子库不够，将弃骰库洗牌放回骰子库再继续抽
 * 
 * @returns { drawn: Die[], newBag: string[], newDiscard: string[] }
 */
export const drawFromBag = (
  diceBag: string[],
  discardPile: string[],
  drawCount: number
): { drawn: Die[]; newBag: string[]; newDiscard: string[]; shuffled: boolean } => {
  let bag = [...diceBag];
  let discard = [...discardPile];
  let shuffled = false;

  // 如果骰子库不够抽，弃骰库洗牌放回
  if (bag.length < drawCount) {
    bag = [...bag, ...shuffle(discard)];
    discard = [];
    shuffled = true;
  }

  // 抽取
  const drawnIds = bag.splice(0, drawCount);

  // 生成 Die 实例
  const drawn: Die[] = drawnIds.map((defId, index) => {
    const def = getDiceDef(defId);
    const value = rollDiceDef(def);
    return {
      id: index,
      diceDefId: defId,
      value,
      element: def.element,
      selected: false,
      spent: false,
      rolling: false,
    };
  });

  return { drawn, newBag: bag, newDiscard: discard, shuffled };
};

/**
 * 将使用过的骰子放入弃骰库
 */
export const discardDice = (dice: Die[], discardPile: string[]): string[] => {
  return [...discardPile, ...dice.map(d => d.diceDefId)];
};

/**
 * 重骰未选中的骰子（保持骰子定义不变，只重新掷点数）
 */
export const rerollUnselectedDice = (dice: Die[]): Die[] => {
  return dice.map(d => {
    if (d.selected || d.spent) return d;
    const def = getDiceDef(d.diceDefId);
    const value = rollDiceDef(def);
    return { ...d, value, element: def.element };
  });
};

/**
 * 初始化骰子库 — 将拥有的骰子全部洗入骰子库
 */
export const initDiceBag = (ownedDice: string[]): string[] => {
  return shuffle([...ownedDice]);
};
