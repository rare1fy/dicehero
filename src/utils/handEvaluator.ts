import { Die, HandType, HandResult } from '../types/game';

export const checkHands = (dice: Die[]): HandResult => {
  if (dice.length === 0) return { bestHand: '普通攻击', allHands: [], activeHands: ['普通攻击'] };
  
  const values = dice.map(d => d.value).sort((a, b) => a - b);
  const colors = dice.map(d => d.color);
  const uniqueColors = new Set(colors);
  
  // Flush: ALL selected dice must be the same color, and at least 4 dice
  const isFlush = uniqueColors.size === 1 && dice.length >= 4;
  
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
  
  // Basic hand detection for allHands
  if (maxCount === 6 && dice.length === 6) hands.add('六条');
  if (maxCount === 5 && dice.length === 5) hands.add('五条');
  if (maxCount === 4 && dice.length === 4) hands.add('四条');
  if (maxCount === 3 && dice.length === 3) hands.add('三条');
  if (maxCount === 2 && dice.length === 2) hands.add('对子');
  if (isFullHouse && dice.length === 5) hands.add('葫芦');
  if (isTwoPair && dice.length === 4) hands.add('连对');
  if (isStraight) hands.add('顺子');
  if (isFlush) hands.add('同花');
  if (isStraight && isFlush) hands.add('同花顺');
  if (isStraight && isFlush && values[0] === 1 && values[values.length-1] === 6) hands.add('皇家同花顺');
  if (isFlush && isFullHouse) hands.add('同花葫芦');
  
  if (hands.size === 0) {
    if (dice.length === 1) {
      hands.add('普通攻击');
    } else {
      return { bestHand: '无效牌型', allHands: [], activeHands: [] };
    }
  }

  const allHands = Array.from(hands);

  // Determine active hands for outcome calculation
  const activeHands: HandType[] = [];
  let hasBaseHand = false;

  // Priority: highest value hand first
  // N-of-a-kind / Full House / Two Pair / Pair are mutually exclusive base hands
  if (maxCount === 6 && dice.length === 6) { activeHands.push('六条'); hasBaseHand = true; }
  else if (maxCount === 5 && dice.length === 5) { activeHands.push('五条'); hasBaseHand = true; }
  else if (maxCount === 4 && dice.length === 4) { activeHands.push('四条'); hasBaseHand = true; }
  else if (isFullHouse && dice.length === 5) { activeHands.push('葫芦'); hasBaseHand = true; }
  else if (maxCount === 3 && dice.length === 3) { activeHands.push('三条'); hasBaseHand = true; }
  else if (isTwoPair && dice.length === 4) { activeHands.push('连对'); hasBaseHand = true; }
  else if (maxCount === 2 && dice.length === 2) { activeHands.push('对子'); hasBaseHand = true; }

  // Straight can layer on top
  if (isStraight) { activeHands.push('顺子'); hasBaseHand = true; }
  // Flush can layer on top
  if (isFlush) { activeHands.push('同花'); hasBaseHand = true; }

  // Combo hands
  if (isStraight && isFlush && values[0] === 1 && values[values.length-1] === 6) { activeHands.push('皇家同花顺'); }
  else if (isStraight && isFlush) { activeHands.push('同花顺'); }
  if (isFlush && isFullHouse) { activeHands.push('同花葫芦'); }

  if (!hasBaseHand && dice.length === 1) {
    activeHands.push('普通攻击');
  }

  // Sort by priority
  const priority: HandType[] = [
    '皇家同花顺', '同花葫芦', '同花顺', '六条', '五条', '四条', '葫芦', '同花', '顺子', '三条', '连对', '对子', '普通攻击'
  ];
  activeHands.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));

  const bestHand = activeHands.join(' + ');

  return { bestHand, allHands, activeHands };
};

export const canFormValidHand = (selected: Die[], candidate: Die, available: Die[]): boolean => {
  // Check if adding the candidate to the selected dice can form any valid hand
  // (possibly with more dice from available)
  const targetSet = [...selected, candidate];
  
  // Direct check: does the current set form a valid hand?
  const directCheck = checkHands(targetSet);
  if (directCheck.bestHand !== '无效牌型') return true;

  // Recursive check: can we add more dice from available to form a valid hand?
  // Limit recursion depth to prevent performance issues
  if (available.length === 0) return false;

  const checkSubsets = (index: number, currentSubset: Die[]): boolean => {
    if (currentSubset.length > 4) return false; // Max 6 dice total
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
