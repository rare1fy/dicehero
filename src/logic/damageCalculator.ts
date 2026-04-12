/**
 * damageCalculator.ts — 伤害计算纯逻辑
 * 
 * 从 DiceHeroGame.tsx 提取的伤害计算模块。
 * 包含：牌型效果计算、骰子效果计算、增强模块触发、遗物触发、最终伤害公式。
 */

import type { Die, StatusEffect, Augment, Relic, HandType } from '../types/game';
import { HAND_TYPES } from '../data/handTypes';
import { getDiceDef, getUpgradedOnPlay, getElementLevelBonus } from '../data/dice';

export interface DamageContext {
  /** 选中的骰子 */
  selectedDice: Die[];
  /** 当前手牌结果 */
  activeHands: HandType[];
  bestHand: string;
  /** 游戏状态 */
  handLevels: Record<string, number>;
  ownedDice: { defId: string; level: number }[];
  playerStatuses: StatusEffect[];
  targetEnemyStatuses?: StatusEffect[];
  /** 增强模块 */
  activeAugments: Augment[];
  /** 遗物列表 */
  relics: Relic[];
  /** 当前重投次数 */
  rerollCount: number;
  /** 玩家HP/金币 */
  currentHp: number;
  maxHp: number;
  currentGold: number;
  /** 是否多选普攻（跳过onPlay） */
  isNormalAttackMulti: boolean;
  /** 深度 */
  depth?: number;
  /** 降维打击顺子升级量 */
  straightUpgrade?: number;
}

export interface DamageOutcome {
  damage: number;
  armor: number;
  heal: number;
  baseDamage: number;
  baseHandValue: number;
  handMultiplier: number;
  extraDamage: number;
  pierceDamage: number;
  armorBreak: boolean;
  multiplier: number;
  triggeredAugments: { name: string; details: string; rawDamage?: number; rawMult?: number; relicId?: string; icon?: string }[];
  bestHand: string;
  statusEffects: StatusEffect[];
  X: number;
  selectedValues: number[];
  goldBonus: number;
  holyPurify: number;
}

/** 计算牌型基础效果（倍率、护甲、状态效果） */
function calculateHandEffects(activeHands: HandType[], handLevels: Record<string, number>) {
  let handMultiplier = 1;
  let baseArmor = 0;
  const statusEffects: StatusEffect[] = [];

  activeHands.forEach(handName => {
    const handDef = HAND_TYPES.find(h => h.name === handName);
    if (handDef) {
      const level = handLevels[handName] || 1;
      const levelBonusMult = (level - 1) * 0.3;
      handMultiplier += (((handDef as any).mult || 1) - 1) + levelBonusMult;
    }

    switch (handName) {
      case '普通攻击': break;
      case '对子': break;
      case '顺子': break;
      case '连对': baseArmor += 5; break;
      case '三连对': baseArmor += 8; break;
      case '三条': statusEffects.push({ type: 'vulnerable', value: 1, duration: 2 }); break;
      case '4顺': statusEffects.push({ type: 'weak', value: 1, duration: 2 }); break;
      case '同元素': break;
      case '葫芦': baseArmor += 15; break;
      case '5顺': statusEffects.push({ type: 'weak', value: 2, duration: 2 }); break;
      case '四条': statusEffects.push({ type: 'vulnerable', value: 2, duration: 2 }); break;
      case '6顺': baseArmor += 10; statusEffects.push({ type: 'weak', value: 3, duration: 2 }); break;
      case '元素顺': break;
      case '元素葫芦': baseArmor += 25; break;
      case '五条': statusEffects.push({ type: 'vulnerable', value: 3, duration: 2 }); break;
      case '六条': statusEffects.push({ type: 'vulnerable', value: 5, duration: 3 }); break;
      case '皇家元素顺': baseArmor += 50; break;
    }
  });

  return { handMultiplier, baseArmor, statusEffects };
}

/** 计算骰子onPlay效果（元素效果、特殊骰子） */
function calculateDiceEffects(
  selected: Die[],
  skipOnPlay: boolean,
  activeHands: HandType[],
  ownedDice: { defId: string; level: number }[],
  depth: number,
  targetHasFreezeImmune: boolean,
) {
  let extraDamage = 0;
  let extraHeal = 0;
  let pierceDamage = 0;
  let armorBreak = false;
  let multiplier = 1;
  let holyPurify = 0;
  const statusEffects: StatusEffect[] = [];

  const isSameElementHand = activeHands.some((h: string) => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h));
  const isRoyalElement = activeHands.some((h) => h === '皇家元素顺');
  const elementBonus = isRoyalElement ? 3.0 : (isSameElementHand ? 2.0 : 1.0);

  selected.forEach(d => {
    if (skipOnPlay) return;
    const def = getDiceDef(d.diceDefId);
    const diceLevel = ownedDice.find(od => od.defId === d.diceDefId)?.level || 1;
    const levelBonus = getElementLevelBonus(diceLevel);
    const totalElementBonus = elementBonus * levelBonus;

    // 元素骰子
    if (def.isElemental && d.collapsedElement) {
      const diceValue = d.value;
      switch (d.collapsedElement) {
        case 'fire':
          pierceDamage += Math.floor(diceValue * 2 * totalElementBonus);
          armorBreak = true;
          statusEffects.push({ type: 'burn', value: diceValue });
          break;
        case 'ice':
          if (!targetHasFreezeImmune) {
            statusEffects.push({ type: 'freeze', value: 1, duration: 1 });
          }
          break;
        case 'thunder':
          pierceDamage += Math.floor(diceValue * 2 * totalElementBonus);
          break;
        case 'poison': {
          const poisonStacks = Math.floor((diceValue + 2) * totalElementBonus);
          const existingPoison = statusEffects.find(es => es.type === 'poison');
          if (existingPoison) existingPoison.value += poisonStacks;
          else statusEffects.push({ type: 'poison', value: poisonStacks });
          break;
        }
        case 'holy':
          extraHeal += Math.floor(diceValue * elementBonus);
          holyPurify += 1;
          break;
      }
      return;
    }

    // 碎裂骰子反噬
    if (def.onPlay?.selfDamage) {
      extraHeal -= def.onPlay.selfDamage;
    }

    if (!def.onPlay) return;
    const upgradedOp = getUpgradedOnPlay(def, diceLevel);
    const op = upgradedOp || def.onPlay;
    const depthDmgBonus = 1 + Math.floor(depth / 3) * 0.15;
    const depthMultBonus = Math.floor(depth / 5) * 0.05;
    if (op.bonusDamage) extraDamage += Math.floor(op.bonusDamage * elementBonus * depthDmgBonus);
    if (op.bonusMult) multiplier *= (1 + (op.bonusMult - 1 + depthMultBonus) * elementBonus);
    if (op.heal) extraHeal += Math.floor(op.heal * elementBonus);
    if (op.pierce) pierceDamage += Math.floor(op.pierce * elementBonus);
    if (op.statusToEnemy) {
      const boostedValue = Math.floor(op.statusToEnemy.value * elementBonus);
      const existing = statusEffects.find(es => es.type === op.statusToEnemy!.type);
      if (existing) existing.value += boostedValue;
      else statusEffects.push({ ...op.statusToEnemy, value: boostedValue });
    }
  });

  return { extraDamage, extraHeal, pierceDamage, armorBreak, multiplier, holyPurify, statusEffects };
}

/** 计算增强模块触发效果 */
function calculateAugmentEffects(
  activeAugments: Augment[],
  X: number,
  selected: Die[],
  rerollCount: number,
  currentHp: number,
  maxHp: number,
  currentGold: number,
) {
  let extraDamage = 0;
  let extraArmor = 0;
  let extraHeal = 0;
  let pierceDamage = 0;
  let multiplier = 1;
  let goldBonus = 0;
  const triggeredAugments: { name: string; details: string; rawDamage?: number; rawMult?: number }[] = [];

  activeAugments.forEach(aug => {
    const res = aug.effect(X, selected, aug.level || 1, { rerollsThisTurn: rerollCount, currentHp, maxHp, currentGold });
    const details: string[] = [];
    if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
    if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
    if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
    if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率x${res.multiplier.toFixed(2)}`); }
    if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
    if (res.goldBonus) { goldBonus += res.goldBonus; details.push(`金币+${res.goldBonus}`); }

    if (details.length > 0) {
      triggeredAugments.push({
        name: aug.name,
        details: details.join(', '),
        rawDamage: (res.damage || 0) + (res.pierce || 0),
        rawMult: res.multiplier && res.multiplier !== 1 ? res.multiplier : undefined,
      });
    }
  });

  return { extraDamage, extraArmor, extraHeal, pierceDamage, multiplier, goldBonus, triggeredAugments };
}

/** 计算遗物on_play触发效果 */
function calculateRelicEffects(
  relics: Relic[],
  selected: Die[],
  activeHands: HandType[],
  X: number,
  rerollCount: number,
  currentHp: number,
  maxHp: number,
  currentGold: number,
) {
  let extraDamage = 0;
  let extraArmor = 0;
  let extraHeal = 0;
  let pierceDamage = 0;
  let multiplier = 1;
  let goldBonus = 0;
  const triggeredAugments: { name: string; details: string; rawDamage?: number; rawMult?: number; relicId?: string; icon?: string }[] = [];

  relics.filter(r => r.trigger === 'on_play').forEach(relic => {
    const res = relic.effect({
      handType: activeHands[0],
      diceCount: selected.length,
      diceValues: selected.map(d => d.value),
      diceDefIds: selected.map(d => d.diceDefId),
      pointSum: X,
      rerollsThisTurn: rerollCount,
      currentHp,
      maxHp,
      currentGold,
      elementsUsedThisBattle: new Set<string>(),
      hasSplitDice: selected.some(d => d.diceDefId === 'split'),
      hasLoadedDice: selected.some(d => d.diceDefId === 'loaded'),
      loadedDiceCount: selected.filter(d => d.diceDefId === 'loaded').length,
      hasSpecialDice: selected.some(d => getDiceDef(d.diceDefId).rarity !== 'common'),
      cursedDiceInHand: selected.filter(d => getDiceDef(d.diceDefId).isCursed).length,
      crackedDiceInHand: selected.filter(d => getDiceDef(d.diceDefId).isCracked).length,
      selectedDiceCount: selected.length,
    });

    const details: string[] = [];
    if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
    if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
    if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
    if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率x${res.multiplier.toFixed(2)}`); }
    if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
    if (res.goldBonus) { goldBonus += res.goldBonus; details.push(`金币+${res.goldBonus}`); }
    if (details.length > 0) {
      triggeredAugments.push({
        name: relic.name,
        details: details.join(', '),
        rawDamage: (res.damage || 0) + (res.pierce || 0),
        rawMult: res.multiplier && res.multiplier !== 1 ? res.multiplier : undefined,
        relicId: relic.id,
        icon: relic.icon,
      });
    }
  });

  return { extraDamage, extraArmor, extraHeal, pierceDamage, multiplier, goldBonus, triggeredAugments };
}

/**
 * 完整伤害计算——纯函数，无副作用
 */
export function calculateDamage(ctx: DamageContext): DamageOutcome | null {
  const { selectedDice: selected, activeHands, bestHand, handLevels, ownedDice,
    playerStatuses, targetEnemyStatuses, activeAugments, relics,
    rerollCount, currentHp, maxHp, currentGold, isNormalAttackMulti, depth = 0 } = ctx;

  if (selected.length === 0) return null;

  const X = selected.reduce((sum, d) => sum + d.value, 0);

  // 1. 牌型基础效果
  const hand = calculateHandEffects(activeHands, handLevels);
  const baseDamage = Math.floor(X * hand.handMultiplier);
  let baseArmor = hand.baseArmor;
  const statusEffects = [...hand.statusEffects];

  // 同元素追加护甲
  if (activeHands.some((h: string) => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h))) {
    baseArmor += baseDamage;
  }

  // 2. 骰子onPlay效果
  const skipOnPlay = isNormalAttackMulti;
  const targetHasFreezeImmune = targetEnemyStatuses?.some(s => (s.type as string) === 'freeze_immune') || false;
  const diceEff = calculateDiceEffects(selected, skipOnPlay, activeHands, ownedDice, depth, targetHasFreezeImmune);
  statusEffects.push(...diceEff.statusEffects);

  // 3. 增强模块触发
  const augEff = calculateAugmentEffects(activeAugments, X, selected, rerollCount, currentHp, maxHp, currentGold);

  // 4. 遗物触发
  const relicEff = calculateRelicEffects(relics, selected, activeHands, X, rerollCount, currentHp, maxHp, currentGold);

  // 5. 合并所有效果
  const totalExtraDamage = diceEff.extraDamage + augEff.extraDamage + relicEff.extraDamage;
  const totalExtraArmor = augEff.extraArmor + relicEff.extraArmor;
  const totalExtraHeal = diceEff.extraHeal + augEff.extraHeal + relicEff.extraHeal;
  const totalPierce = diceEff.pierceDamage + augEff.pierceDamage + relicEff.pierceDamage;
  const totalMult = diceEff.multiplier * augEff.multiplier * relicEff.multiplier;
  const totalGold = augEff.goldBonus + relicEff.goldBonus;
  const armorBreak = diceEff.armorBreak;
  const holyPurify = diceEff.holyPurify;
  const triggeredAugments = [...augEff.triggeredAugments, ...relicEff.triggeredAugments];

  // 6. 最终伤害公式：baseDamage × mult + extraDamage + pierceDamage
  const totalDamage = Math.floor(baseDamage * totalMult) + totalExtraDamage + totalPierce;

  // 7. 状态修正
  let modifiedDamage = totalDamage;
  const playerWeak = playerStatuses.find(s => s.type === 'weak');
  if (playerWeak) modifiedDamage = Math.floor(modifiedDamage * 0.75);
  const enemyVulnerable = targetEnemyStatuses?.find(s => s.type === 'vulnerable');
  if (enemyVulnerable) modifiedDamage = Math.floor(modifiedDamage * 1.5);

  return {
    damage: modifiedDamage,
    armor: Math.floor(baseArmor + totalExtraArmor),
    heal: totalExtraHeal,
    baseDamage,
    baseHandValue: 0,
    handMultiplier: hand.handMultiplier,
    extraDamage: modifiedDamage - baseDamage - totalPierce,
    pierceDamage: totalPierce,
    armorBreak,
    multiplier: totalMult,
    triggeredAugments,
    bestHand,
    statusEffects,
    X,
    selectedValues: selected.map(d => d.value),
    goldBonus: totalGold,
    holyPurify,
  };
}
