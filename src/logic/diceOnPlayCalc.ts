/**
 * 骰子 onPlay 效果计算 — 从 expectedOutcomeCalc.ts 提取，ARCH-12
 *
 * 职责：处理单颗骰子的 onPlay 效果（元素效果 + 战士/法师/盗贼职业效果）
 * 纯函数，无副作用。通过 DiceOnPlayContext 传入所有依赖，通过 DiceOnPlayResult 返回增量。
 */

import type { Die, StatusEffect, Enemy, GameState } from '../types/game';
import { getDiceDef, getUpgradedOnPlay, getElementLevelBonus } from '../data/dice';

/** 骰子 onPlay 计算的上下文（只读快照） */
export interface DiceOnPlayContext {
  selected: Die[];
  dice: Die[];
  activeHands: string[];
  game: GameState;
  targetEnemy: Enemy | null;
  /** 基础元素倍率 */
  elementBonus: number;
  /** 是否跳过 onPlay（普通攻击单手牌时） */
  skipOnPlay: boolean;
  /** 统一元素（统一骰子效果） */
  unifiedElement: string | null;
  /** 法师怒火燎原 bonus */
  furyBonusDamage: number;
}

/** 骰子 onPlay 计算的增量输出 */
export interface DiceOnPlayResult {
  extraDamage: number;
  extraArmor: number;
  extraHeal: number;
  pierceDamage: number;
  armorBreak: boolean;
  multiplier: number;
  holyPurify: number;
  statusEffects: StatusEffect[];
}

/**
 * 初始化一个空的 DiceOnPlayResult
 */
export function emptyDiceOnPlayResult(): DiceOnPlayResult {
  return {
    extraDamage: 0,
    extraArmor: 0,
    extraHeal: 0,
    pierceDamage: 0,
    armorBreak: false,
    multiplier: 1,
    holyPurify: 0,
    statusEffects: [],
  };
}

/**
 * 处理元素骰子的元素效果（火/冰/雷/毒/圣）
 */
function applyElementEffect(
  activeElement: string,
  diceValue: number,
  totalElementBonus: number,
  elementBonus: number,
  targetEnemy: Enemy | null,
  out: DiceOnPlayResult,
): void {
  switch (activeElement) {
    case 'fire':
      out.pierceDamage += Math.floor(diceValue * 2 * totalElementBonus);
      out.armorBreak = true;
      out.statusEffects.push({ type: 'burn', value: diceValue });
      break;
    case 'ice':
      if (!targetEnemy?.statuses?.some(s => (s.type as string) === 'freeze_immune')) {
        out.statusEffects.push({ type: 'freeze', value: 1, duration: 1 });
      }
      break;
    case 'thunder':
      out.pierceDamage += Math.floor(diceValue * 2 * totalElementBonus);
      break;
    case 'poison': {
      const poisonStacks = Math.floor((diceValue + 2) * totalElementBonus);
      const existingPoison = out.statusEffects.find(es => es.type === 'poison');
      if (existingPoison) existingPoison.value += poisonStacks;
      else out.statusEffects.push({ type: 'poison', value: poisonStacks });
      break;
    }
    case 'holy':
      out.extraHeal += Math.floor(diceValue * elementBonus);
      out.holyPurify += 1;
      break;
  }
}

/**
 * 处理第二元素（棱镜骰子）效果
 */
function applySecondElementEffect(
  secondElement: string,
  diceValue: number,
  totalElementBonus: number,
  elementBonus: number,
  targetEnemy: Enemy | null,
  out: DiceOnPlayResult,
): void {
  switch (secondElement) {
    case 'fire':
      out.pierceDamage += Math.floor(diceValue * totalElementBonus);
      out.statusEffects.push({ type: 'burn', value: Math.max(1, Math.floor(diceValue / 2)) });
      break;
    case 'ice':
      if (!targetEnemy?.statuses?.some(s => (s.type as string) === 'freeze_immune')) {
        out.statusEffects.push({ type: 'freeze', value: 1, duration: 1 });
      }
      break;
    case 'thunder':
      out.pierceDamage += Math.floor(diceValue * totalElementBonus);
      break;
    case 'poison': {
      const pStacks = Math.floor((diceValue + 1) * totalElementBonus);
      const ep = out.statusEffects.find(es => es.type === 'poison');
      if (ep) ep.value += pStacks; else out.statusEffects.push({ type: 'poison', value: pStacks });
      break;
    }
    case 'holy':
      out.extraHeal += Math.floor(diceValue * 0.5 * elementBonus);
      break;
  }
}

/**
 * 累加毒层到 statusEffects
 */
function addPoisonStacks(statusEffects: StatusEffect[], poisonVal: number): void {
  const existing = statusEffects.find(es => es.type === 'poison');
  if (existing) { existing.value += poisonVal; }
  else { statusEffects.push({ type: 'poison', value: poisonVal }); }
}

/**
 * 处理元素风暴（multiElementBlast）— 每颗选中骰子各触发确定性轮转元素
 */
function applyMultiElementBlast(
  selected: Die[],
  totalElementBonus: number,
  out: DiceOnPlayResult,
): void {
  const elements = ['fire', 'ice', 'thunder', 'poison', 'holy'];
  selected.forEach((sd, idx) => {
    // 确定性轮转：按骰子索引选元素，避免 Math.random 导致预览闪烁
    const randElem = elements[idx % elements.length];
    const dv = sd.value;
    switch (randElem) {
      case 'fire': out.pierceDamage += Math.floor(dv * totalElementBonus); out.statusEffects.push({ type: 'burn', value: Math.max(1, Math.floor(dv / 2)) }); break;
      case 'ice': out.statusEffects.push({ type: 'freeze', value: 1, duration: 1 }); break;
      case 'thunder': out.pierceDamage += Math.floor(dv * totalElementBonus); break;
      case 'poison': {
        const ps = Math.floor((dv + 1) * totalElementBonus);
        const ep = out.statusEffects.find(es => es.type === 'poison');
        if (ep) ep.value += ps; else out.statusEffects.push({ type: 'poison', value: ps });
        break;
      }
      case 'holy': out.extraHeal += Math.floor(dv * 0.5); break;
    }
  });
}

/**
 * 处理单颗骰子的 onPlay 效果
 *
 * 遍历顺序：元素效果 → 基础效果 → 战士效果 → 法师效果 → 盗贼效果
 * 所有增量通过 DiceOnPlayResult 返回，由调用方归并。
 */
export function processDiceOnPlayEffects(
  d: Die,
  ctx: DiceOnPlayContext,
): DiceOnPlayResult {
  const out = emptyDiceOnPlayResult();
  const { selected, dice, activeHands, game, targetEnemy, elementBonus, skipOnPlay, unifiedElement, furyBonusDamage } = ctx;

  if (skipOnPlay) return out;

  const def = getDiceDef(d.diceDefId);
  const diceLevel = game.ownedDice.find(od => od.defId === d.diceDefId)?.level || 1;
  const levelBonus = getElementLevelBonus(diceLevel);
  const totalElementBonus = elementBonus * levelBonus;

  // ─── 元素骰子效果 ───
  const activeElement = unifiedElement || d.collapsedElement;
  if (def.isElemental && activeElement) {
    applyElementEffect(activeElement, d.value, totalElementBonus, elementBonus, targetEnemy, out);
    // 双元素（棱镜骰子）
    if (d.secondElement && d.secondElement !== d.collapsedElement) {
      applySecondElementEffect(d.secondElement, d.value, totalElementBonus, elementBonus, targetEnemy, out);
    }
    return out;
  }

  // ─── 反噬（selfDamage） ───
  if (def.onPlay?.selfDamage) {
    if (game.hp + out.extraHeal > def.onPlay.selfDamage) {
      out.extraHeal -= def.onPlay.selfDamage;
    }
  }

  if (!def.onPlay) return out;
  const upgradedOp = getUpgradedOnPlay(def, diceLevel);
  const op = upgradedOp || def.onPlay;

  // [ARCH] depth 字段已从 GameState 移除 — 使用地图节点深度近似
  const currentDepth = game.map.find(n => n.id === game.currentNodeId)?.depth ?? 0;
  const depthDmgBonus = 1 + Math.floor(currentDepth / 3) * 0.15;
  const depthMultBonus = Math.floor(currentDepth / 5) * 0.05;

  // ─── 基础效果 ───
  if (op.bonusDamage && !op.firstPlayOnly && !op.requiresTriple) {
    out.extraDamage += Math.floor(op.bonusDamage * elementBonus * depthDmgBonus);
  }
  if (op.bonusMult && !op.requiresCharge) out.multiplier *= (1 + (op.bonusMult - 1 + depthMultBonus) * elementBonus);
  if (op.heal) out.extraHeal += Math.floor(op.heal * elementBonus);
  if (op.pierce) out.pierceDamage += Math.floor(op.pierce * elementBonus);
  if (op.statusToEnemy) {
    const boostedValue = Math.floor(op.statusToEnemy.value * elementBonus);
    const existing = out.statusEffects.find(es => es.type === op.statusToEnemy!.type);
    if (existing) { existing.value += boostedValue; }
    else { out.statusEffects.push({ ...op.statusToEnemy, value: boostedValue }); }
  }

  // ─── 战士效果 ───
  if (op.selfDamagePercent) {
    const selfDmg = Math.ceil(game.maxHp * op.selfDamagePercent);
    if (game.hp + out.extraHeal > selfDmg) {
      out.extraHeal -= selfDmg;
    }
  }
  if (op.armor) out.extraArmor += op.armor;
  if (op.armorFromValue) out.extraArmor += d.value;
  if (op.armorFromTotalPoints) out.extraArmor += selected.reduce((sum, sd) => sum + sd.value, 0);
  if (op.armorBreak) out.armorBreak = true;
  if (op.armorToDamage && targetEnemy) out.extraDamage += (targetEnemy.armor || 0);
  if (op.scaleWithHits) out.extraDamage += furyBonusDamage;
  if (op.firstPlayOnly && op.bonusDamage) {
    const isFirstPlay = (game.comboCount || 0) === 0 && game.battleTurn <= 1;
    if (isFirstPlay) out.extraDamage += Math.floor(op.bonusDamage * elementBonus * depthDmgBonus);
  }
  if (op.scaleWithLostHp) {
    const lostHp = game.maxHp - game.hp;
    out.extraDamage += Math.floor(lostHp * op.scaleWithLostHp);
  }
  if (op.executeThreshold && op.executeMult && targetEnemy) {
    if (targetEnemy.hp / targetEnemy.maxHp < op.executeThreshold) {
      out.multiplier *= op.executeMult;
      if (op.executeHeal) out.extraHeal += op.executeHeal;
    }
  }
  if (op.aoeDamage) out.extraDamage += op.aoeDamage;
  if (op.healFromValue) out.extraHeal += d.value;
  if (op.maxHpBonus) out.extraHeal += op.maxHpBonus;
  if (op.healOrMaxHp) {
    if (game.hp < game.maxHp) out.extraHeal += d.value;
  }
  if (op.lowHpOverrideValue && op.lowHpThreshold) {
    if (game.hp / game.maxHp < op.lowHpThreshold && d.value < op.lowHpOverrideValue) {
      out.extraDamage += (op.lowHpOverrideValue - d.value);
    }
  }
  if (op.requiresTriple && op.bonusDamageFromPoints) {
    const tripleHands = ['三条', '四条', '五条', '六条', '葫芦'];
    if (activeHands.some((h: string) => tripleHands.includes(h))) {
      const totalPoints = selected.reduce((sum, sd) => sum + sd.value, 0);
      out.extraDamage += Math.floor(totalPoints * op.bonusDamageFromPoints);
    }
  }
  if (op.scaleWithBloodRerolls && game.bloodRerollCount) {
    const faceBonus = Math.min(game.bloodRerollCount, 3);
    out.extraDamage += faceBonus;
  }
  if (op.selfBerserk) {
    out.multiplier *= 1.3;
    const berserkDmg = Math.ceil(game.maxHp * 0.05);
    if (game.hp + out.extraHeal > berserkDmg) {
      out.extraHeal -= berserkDmg;
    }
  }
  if (op.scaleWithSelfDamage) {
    const selfDmgThisTurn = (game.bloodRerollCount || 0) * 2;
    out.multiplier *= (1 + selfDmgThisTurn * 0.02);
  }
  if (op.damageFromArmor) {
    out.extraDamage += Math.floor((game.armor + out.extraArmor) * op.damageFromArmor);
  }
  if (op.purifyAll) out.holyPurify += 99;
  if (op.tauntAll) { /* 在出牌后实际应用时处理 */ }

  // ─── 法师效果 ───
  if (op.reverseValue) {
    const reversed = 7 - d.value;
    if (reversed > d.value) out.extraDamage += (reversed - d.value);
  }
  if (op.copyHighestValue) {
    const maxVal = Math.max(...selected.map(sd => sd.value));
    if (maxVal > d.value) out.extraDamage += (maxVal - d.value);
  }
  if (op.overrideValue) {
    if (op.overrideValue > d.value) out.extraDamage += (op.overrideValue - d.value);
  }
  if (op.bonusDamagePerElement) {
    const elemCount = dice.filter(dd => !dd.spent && dd.element !== 'normal').length;
    out.extraDamage += elemCount * op.bonusDamagePerElement;
  }
  if (op.multPerElement) {
    const elemCount = dice.filter(dd => !dd.spent && dd.element !== 'normal').length;
    out.multiplier *= (1 + elemCount * op.multPerElement);
  }
  if (op.burnEcho && targetEnemy) {
    const burnStacks = targetEnemy.statuses.find(s => s.type === 'burn')?.value || 0;
    if (burnStacks > 0) out.extraDamage += burnStacks * 5;
  }
  if (op.frostEchoDamage && targetEnemy) {
    const wasFrozen = targetEnemy.statuses.some(s => (s.type as string) === 'was_frozen');
    if (wasFrozen) out.multiplier *= (1 + op.frostEchoDamage);
  }
  if (op.damageShield) out.extraArmor += d.value * 2;
  if (op.armorFromHandSize) {
    const handSize = dice.filter(dd => !dd.spent).length;
    out.extraArmor += handSize * op.armorFromHandSize;
  }
  if (op.requiresCharge && op.bonusMult) {
    if ((game.chargeStacks || 0) >= op.requiresCharge) {
      const extraChargeLayers = Math.max(0, (game.chargeStacks || 0) - op.requiresCharge);
      const extraMult = op.bonusMultPerExtraCharge ? extraChargeLayers * op.bonusMultPerExtraCharge : 0;
      out.multiplier *= (op.bonusMult + extraMult);
    }
  }
  if (op.chainBolt) out.extraDamage += Math.floor(d.value * elementBonus);
  if (op.removeBurn) out.holyPurify += 1;
  if (op.healPerCleanse) {
    const negCount = game.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type)).length;
    out.extraHeal += negCount * op.healPerCleanse;
  }
  // 双元素（棱镜骰子）— 非元素骰子不会走到这里，但保险起见
  if (def.isElemental && d.secondElement && d.secondElement !== d.collapsedElement) {
    applySecondElementEffect(d.secondElement, d.value, totalElementBonus, elementBonus, targetEnemy, out);
  }
  if (op.swapWithUnselected) {
    const unselected = dice.filter(dd => !dd.spent && !dd.selected);
    if (unselected.length > 0) {
      const best = unselected.reduce((a, b) => a.value > b.value ? a : b);
      if (best.value > d.value) out.extraDamage += (best.value - d.value);
    }
  }
  if (op.freezeBonus) {
    const existingFreeze = out.statusEffects.find(es => es.type === 'freeze');
    if (existingFreeze) { existingFreeze.value += op.freezeBonus; }
    else { out.statusEffects.push({ type: 'freeze', value: 1 + op.freezeBonus }); }
  }
  if (op.triggerAllElements) {
    const elementsInHand = new Set(dice.filter(dd => !dd.spent && dd.element !== 'normal').map(dd => dd.element));
    out.extraDamage += elementsInHand.size * 5;
  }
  if (op.multiElementBlast) {
    applyMultiElementBlast(selected, totalElementBonus, out);
  }

  // ─── 盗贼效果 ───
  if (op.comboBonus) out.multiplier *= (1 + op.comboBonus);
  if (op.poisonFromValue) {
    addPoisonStacks(out.statusEffects, d.value);
  }
  if (op.poisonInverse) {
    addPoisonStacks(out.statusEffects, Math.max(1, 7 - d.value));
  }
  if (op.poisonBase) {
    let poisonVal = d.value + op.poisonBase;
    if (op.poisonBonusIfPoisoned && targetEnemy?.statuses.some(s => s.type === 'poison')) {
      poisonVal += op.poisonBonusIfPoisoned;
    }
    addPoisonStacks(out.statusEffects, poisonVal);
  }
  if (op.critOnSecondPlay && (game.comboCount || 0) >= 1) out.multiplier *= op.critOnSecondPlay;
  if (op.comboScaleDamage) out.multiplier *= (1 + (game.comboCount || 0) * op.comboScaleDamage);
  if (op.poisonScaleDamage && targetEnemy) {
    const targetPoison = targetEnemy.statuses.find(s => s.type === 'poison')?.value || 0;
    out.extraDamage += targetPoison * op.poisonScaleDamage;
  }
  if (op.comboDetonatePoison && (game.comboCount || 0) >= 1 && targetEnemy) {
    const targetPoison = targetEnemy.statuses.find(s => s.type === 'poison')?.value || 0;
    out.extraDamage += Math.floor(targetPoison * op.comboDetonatePoison);
  }
  if (op.multOnThirdPlay && (game.comboCount || 0) >= 2) out.multiplier *= op.multOnThirdPlay;
  if (op.bonusDamageOnSecondPlay && (game.comboCount || 0) >= 1) out.extraDamage += op.bonusDamageOnSecondPlay;
  if (op.bonusMultOnSecondPlay && (game.comboCount || 0) >= 1) out.multiplier *= op.bonusMultOnSecondPlay;
  if (op.stealArmor && targetEnemy) {
    const stolen = Math.min(targetEnemy.armor, op.stealArmor);
    out.extraArmor += stolen;
  }
  if (op.poisonFromPoisonDice) {
    const poisonDiceCount = selected.filter(sd => {
      const dd = getDiceDef(sd.diceDefId);
      return dd.onPlay?.poisonInverse || dd.onPlay?.poisonBase || dd.onPlay?.statusToEnemy?.type === 'poison';
    }).length;
    const poisonVal = poisonDiceCount * op.poisonFromPoisonDice;
    if (poisonVal > 0) {
      addPoisonStacks(out.statusEffects, poisonVal);
    }
  }
  if (op.detonatePoisonPercent && targetEnemy) {
    const currentPoison = targetEnemy.statuses.find(s => s.type === 'poison')?.value || 0;
    const extraPlays = Math.max(0, (game.comboCount || 0) - 1);
    const detonateRate = Math.min(1, op.detonatePoisonPercent + (op.detonateExtraPerPlay || 0) * extraPlays);
    out.extraDamage += Math.floor(currentPoison * detonateRate);
  }
  if (op.escalateDamage) out.multiplier *= (1 + (game.comboCount || 0) * op.escalateDamage);
  if (op.phantomFromShadowDice) {
    const shadowCount = dice.filter(dd => !dd.spent && dd.diceDefId === 'temp_rogue').length;
    const phantomVal = Math.max(2, shadowCount * 2);
    if (phantomVal > d.value) out.extraDamage += (phantomVal - d.value);
  }
  if (op.wildcard) {
    if (d.value < 6) out.extraDamage += (6 - d.value);
  }
  if (op.purifyOne) out.holyPurify += 1;
  if (op.comboHeal && (game.comboCount || 0) >= 1) out.extraHeal += op.comboHeal;
  if (op.transferDebuff) {
    const negativeStatuses = game.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type));
    if (negativeStatuses.length > 0) {
      out.holyPurify += 1;
      const transferred = negativeStatuses[0];
      out.statusEffects.push({ type: transferred.type, value: transferred.value });
    }
  }
  if (op.detonateAllOnLastPlay && game.playerClass === 'rogue') {
    if ((game.comboCount || 0) >= 1 && targetEnemy) {
      const totalDebuffs = targetEnemy.statuses.reduce((sum, s) => {
        if (['poison', 'burn', 'vulnerable', 'weak'].includes(s.type)) return sum + s.value;
        return sum;
      }, 0);
      out.extraDamage += totalDebuffs * 2;
    }
  }

  return out;
}
