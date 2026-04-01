import { Die, HandType, HandResult } from '../types/game';

export const checkHands = (dice: Die[]): HandResult => {
  if (dice.length === 0) return { bestHand: '普通攻击', allHands: [], activeHands: ['普通攻击'] };

  const values = dice.map(d => d.value).sort((a, b) => a - b);
  const elements = dice.map(d => d.element);
  const uniqueElements = new Set(elements);

  // 同元素: 所有选中骰子同一元素，且至少4颗
  // All-normal is NOT same_element; only non-normal elements count
  const isSameElement = uniqueElements.size === 1 && dice.length >= 4 && elements[0] !== 'normal';

  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const sortedCounts = Object.values(counts).sort((a, b) => b - a);
  const maxCount = sortedCounts[0];
  const isTwoPair = sortedCounts.length >= 2 && sortedCounts[0] === 2 && sortedCounts[1] === 2;
  const isFullHouse = sortedCounts.length >= 2 && sortedCounts[0] >= 3 && sortedCounts[1] >= 2;

  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
  let isStraight = false;
  if (uniqueValues.length === dice.length && dice.length >= 3) {
    if (uniqueValues[uniqueValues.length - 1] - uniqueValues[0] === dice.length - 1) {
      isStraight = true;
    }
  }

  const hands: Set<HandType> = new Set();

  // 基础牌型检测
  if (maxCount === 6 && dice.length === 6) hands.add('六条');
  if (maxCount === 5 && dice.length === 5) hands.add('五条');
  if (maxCount === 4 && dice.length === 4) hands.add('四条');
  if (maxCount === 3 && dice.length === 3) hands.add('三条');
  if (maxCount === 2 && dice.length === 2) hands.add('对子');
  if (isFullHouse && dice.length === 5) hands.add('葫芦');
  if (isTwoPair && dice.length === 4) hands.add('连对');
  if (isStraight) hands.add('顺子');
  if (isSameElement) hands.add('同元素');
  if (isStraight && isSameElement) hands.add('元素顺');
  if (isStraight && isSameElement && values[0] === 1 && values[values.length - 1] === 6) hands.add('皇家元素顺');
  if (isSameElement && isFullHouse) hands.add('元素葫芦');

  if (hands.size === 0) {
    if (dice.length === 1) {
      hands.add('普通攻击');
    } else {
      return { bestHand: '普通攻击', allHands: ['普通攻击'], activeHands: ['普通攻击'] };
    }
  }

  const allHands = Array.from(hands);

  // 确定生效牌型
  const activeHands: HandType[] = [];
  let hasBaseHand = false;

  // N条 / 葫芦 / 连对 / 对子 互斥，取最高
  if (maxCount === 6 && dice.length === 6) { activeHands.push('六条'); hasBaseHand = true; }
  else if (maxCount === 5 && dice.length === 5) { activeHands.push('五条'); hasBaseHand = true; }
  else if (maxCount === 4 && dice.length === 4) { activeHands.push('四条'); hasBaseHand = true; }
  else if (isFullHouse && dice.length === 5) { activeHands.push('葫芦'); hasBaseHand = true; }
  else if (maxCount === 3 && dice.length === 3) { activeHands.push('三条'); hasBaseHand = true; }
  else if (isTwoPair && dice.length === 4) { activeHands.push('连对'); hasBaseHand = true; }
  else if (maxCount === 2 && dice.length === 2) { activeHands.push('对子'); hasBaseHand = true; }

  // 顺子可叠加
  if (isStraight) { activeHands.push('顺子'); hasBaseHand = true; }
  // 同元素可叠加
  if (isSameElement) { activeHands.push('同元素'); hasBaseHand = true; }

  // 组合牌型
  if (isStraight && isSameElement && values[0] === 1 && values[values.length - 1] === 6) { activeHands.push('皇家元素顺'); }
  else if (isStraight && isSameElement) { activeHands.push('元素顺'); }
  if (isSameElement && isFullHouse) { activeHands.push('元素葫芦'); }

  if (!hasBaseHand && dice.length === 1) {
    activeHands.push('普通攻击');
  }

  // 按优先级排序
  const priority: HandType[] = [
    '皇家元素顺', '元素葫芦', '元素顺', '六条', '五条', '四条', '葫芦', '同元素', '顺子', '三条', '连对', '对子', '普通攻击'
  ];
  activeHands.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));

  const bestHand = activeHands.join(' + ');

  return { bestHand, allHands, activeHands };
};

export const canFormValidHand = (selected: Die[], candidate: Die, available: Die[]): boolean => {
  const targetSet = [...selected, candidate];

  const directCheck = checkHands(targetSet);
  return true; // Any combination is valid: non-hand = 普通攻击

  if (available.length === 0) return false;

  const checkSubsets = (index: number, currentSubset: Die[]): boolean => {
    if (currentSubset.length > 5) return false;
    const testHand = [...targetSet, ...currentSubset];
    const result = checkHands(testHand);
    if (result.bestHand !== '无效牌型') return true;

    if (testHand.length >= 6) return false;

    for (let i = index; i < available.length; i++) {
      if (checkSubsets(i + 1, [...currentSubset, available[i]])) return true;
    }
    return false;
  };

  return checkSubsets(0, []);
};
