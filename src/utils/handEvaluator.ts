import { Die, HandType, HandResult } from '../types/game';
import { getDiceDef } from '../data/dice';

/**
 * 牌型判定器（v2 收敛版 · 2026-05-10）
 *
 * 重构要点：
 * - 已移除元素牌型：同元素 / 元素顺 / 元素葫芦 / 皇家元素顺
 * - 葫芦分两档：
 *     葫芦     = 3+2 (5颗)
 *     大葫芦   = 3+3 / 4+2 (6颗)
 *   两档均带"无视嘲讽 + 真伤"（在伤害结算阶段处理）
 * - 4+2 优先识别为大葫芦（不走四条），因葫芦倍率与机制更优
 * - 顺子按长度分级：3顺/4顺/5顺/6顺
 */

export const checkHands = (dice: Die[], options?: { straightUpgrade?: number }): HandResult => {
  const straightUpgrade = options?.straightUpgrade || 0;
  if (dice.length === 0) return { bestHand: '普通攻击', allHands: [], activeHands: ['普通攻击'] };

  // ignoreForHandType: 镜像骰子等不参与牌型判定，但其点数仍计入总点数
  const handDice = dice.filter(d => !getDiceDef(d.diceDefId).onPlay?.ignoreForHandType);
  const values = (handDice.length > 0 ? handDice : dice).map(d => d.value).sort((a, b) => a - b);

  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const sortedCounts = Object.values(counts).sort((a, b) => b - a);
  const maxCount = sortedCounts[0];
  const isTwoPair = sortedCounts.length >= 2 && sortedCounts[0] === 2 && sortedCounts[1] === 2;
  const isThreePair = sortedCounts.length >= 3 && sortedCounts[0] === 2 && sortedCounts[1] === 2 && sortedCounts[2] === 2;

  // 葫芦三种判定（dice.length 为参与判定的总颗数）
  const isFullHouseSmall = sortedCounts.length >= 2 && sortedCounts[0] === 3 && sortedCounts[1] === 2 && dice.length === 5; // 3+2
  const isFullHouseDoubleTriple = sortedCounts.length >= 2 && sortedCounts[0] === 3 && sortedCounts[1] === 3 && dice.length === 6; // 3+3
  const isFullHouseFourPair = sortedCounts.length >= 2 && sortedCounts[0] === 4 && sortedCounts[1] === 2 && dice.length === 6; // 4+2
  const isBigFullHouse = isFullHouseDoubleTriple || isFullHouseFourPair;

  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
  let isStraight = false;
  let straightLen = 0;
  // 顺子要求所有骰子点数互不相同且连续，长度 >= 3
  if (uniqueValues.length === dice.length && dice.length >= 3) {
    if (uniqueValues[uniqueValues.length - 1] - uniqueValues[0] === dice.length - 1) {
      isStraight = true;
      straightLen = dice.length;
    }
  }

  const hands: Set<HandType> = new Set();

  // 同牌系（互斥，按颗数高优先）
  if (maxCount === 6 && dice.length === 6) hands.add('六条');
  if (maxCount === 5 && dice.length === 5) hands.add('五条');
  // 注意：4+2 优先走大葫芦，不走四条（在 active 选择阶段处理）
  if (maxCount === 4 && dice.length === 4) hands.add('四条');
  if (maxCount === 3 && dice.length === 3) hands.add('三条');
  if (maxCount === 2 && dice.length === 2) hands.add('对子');

  // 葫芦系
  if (isFullHouseSmall) hands.add('葫芦');
  if (isBigFullHouse) hands.add('大葫芦');

  // 多对系
  if (isTwoPair && dice.length === 4) hands.add('连对');
  if (isThreePair && dice.length === 6) hands.add('三连对');

  // 顺子系（按长度区分）
  if (isStraight && straightLen === 6) hands.add('6顺');
  else if (isStraight && straightLen === 5) hands.add('5顺');
  else if (isStraight && straightLen === 4) hands.add('4顺');
  else if (isStraight && straightLen >= 3) hands.add('顺子');

  if (hands.size === 0) {
    if (dice.length === 1) {
      hands.add('普通攻击');
    } else {
      return { bestHand: '普通攻击', allHands: ['普通攻击'], activeHands: ['普通攻击'] };
    }
  }

  const allHands = Array.from(hands);

  // 确定生效牌型
  // 同牌系/葫芦系/多对系 互斥（取最优一个），顺子系可叠加
  const activeHands: HandType[] = [];
  let hasBaseHand = false;

  if (maxCount === 6 && dice.length === 6) {
    activeHands.push('六条'); hasBaseHand = true;
  } else if (maxCount === 5 && dice.length === 5) {
    activeHands.push('五条'); hasBaseHand = true;
  } else if (isBigFullHouse) {
    // 大葫芦优先于四条（4+2 走大葫芦）
    activeHands.push('大葫芦'); hasBaseHand = true;
  } else if (maxCount === 4 && dice.length === 4) {
    activeHands.push('四条'); hasBaseHand = true;
  } else if (isFullHouseSmall) {
    activeHands.push('葫芦'); hasBaseHand = true;
  } else if (isThreePair && dice.length === 6) {
    activeHands.push('三连对'); hasBaseHand = true;
  } else if (maxCount === 3 && dice.length === 3) {
    activeHands.push('三条'); hasBaseHand = true;
  } else if (isTwoPair && dice.length === 4) {
    activeHands.push('连对'); hasBaseHand = true;
  } else if (maxCount === 2 && dice.length === 2) {
    activeHands.push('对子'); hasBaseHand = true;
  }

  // 顺子可叠加（按长度取最高）
  if (isStraight) {
    if (straightLen === 6) activeHands.push('6顺');
    else if (straightLen === 5) activeHands.push('5顺');
    else if (straightLen === 4) activeHands.push('4顺');
    else activeHands.push('顺子');
    hasBaseHand = true;
  }

  if (!hasBaseHand && dice.length === 1) {
    activeHands.push('普通攻击');
  }

  // 按倍率优先级排序（高倍率在前，方便UI展示）
  const priority: HandType[] = [
    '六条', '五条', '大葫芦', '四条', '葫芦', '三连对', '6顺', '三条', '5顺', '连对', '4顺', '对子', '顺子', '普通攻击'
  ];
  activeHands.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));

  const bestHand = activeHands.join(' + ');

  return { bestHand, allHands, activeHands };
};

export const canFormValidHand = (_selected: Die[], _candidate: Die, _available: Die[]): boolean => {
  return true;
};

/**
 * 对手中所有未使用的骰子，检测哪些可以参与组成牌型（对子以上）。
 * 返回一个 Set<number>，包含所有"能组成牌型"的骰子ID。
 */
export const findHandCandidates = (allDice: Die[], selectedId?: number): Set<number> => {
  const available = allDice.filter(d => !d.spent && !d.rolling);
  if (available.length < 2) return new Set();

  const result = new Set<number>();

  if (selectedId !== undefined) {
    const anchor = available.find(d => d.id === selectedId);
    if (!anchor) return result;
    result.add(selectedId);

    for (const other of available) {
      if (other.id === selectedId) continue;
      const pair = [anchor, other];
      const hand = checkHands(pair);
      if (hand.activeHands.some(h => h !== '普通攻击')) {
        result.add(other.id);
        continue;
      }
      const selected = available.filter(d => d.selected && d.id !== selectedId);
      if (selected.length > 0) {
        const combo = [anchor, ...selected, other];
        const comboHand = checkHands(combo);
        if (comboHand.activeHands.some(h => h !== '普通攻击')) {
          result.add(other.id);
        }
      }
    }
    return result;
  }

  // 对子：相同点数
  const valueCounts: Record<number, number[]> = {};
  available.forEach(d => {
    if (!valueCounts[d.value]) valueCounts[d.value] = [];
    valueCounts[d.value].push(d.id);
  });
  for (const ids of Object.values(valueCounts)) {
    if (ids.length >= 2) ids.forEach(id => result.add(id));
  }

  // 顺子：连续3+个不同值
  const uniqueVals = [...new Set(available.map(d => d.value))].sort((a, b) => a - b);
  for (let i = 0; i < uniqueVals.length - 2; i++) {
    if (uniqueVals[i + 1] === uniqueVals[i] + 1 && uniqueVals[i + 2] === uniqueVals[i] + 2) {
      const seqVals = new Set([uniqueVals[i], uniqueVals[i + 1], uniqueVals[i + 2]]);
      let j = i + 3;
      while (j < uniqueVals.length && uniqueVals[j] === uniqueVals[j - 1] + 1) {
        seqVals.add(uniqueVals[j]);
        j++;
      }
      available.filter(d => seqVals.has(d.value)).forEach(d => result.add(d.id));
    }
  }

  return result;
};