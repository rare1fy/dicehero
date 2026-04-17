/**
 * expectedOutcome 纯计算逻辑
 * 
 * 从 DiceHeroGame.tsx 的 useMemo 中提取的战斗预览计算。
 * 本模块只做纯计算，所有副作用（setGame等）通过返回值传递给调用方。
 * 
 * [RULES-A4] 所有遗物触发走 buildRelicContext，禁止手拼 ctx
 */

import type { Die, StatusEffect, Augment, Enemy, GameState, Relic } from '../types/game';
import { HAND_TYPES } from '../data/handTypes';
import { STATUS_INFO } from '../data/statusInfo';
import { getDiceDef, getUpgradedOnPlay, getElementLevelBonus } from '../data/dice';
import { buildRelicContext } from '../engine/buildRelicContext';
import { FURY_CONFIG } from '../config/gameBalance';

/** 计算结果的副作用指令 — 调用方应在 useMemo 之后执行 */
export interface PendingSideEffect {
  type: 'setRelicCounter' | 'resetRelicCounter' | 'setRelicTempDrawBonus' | 'grantExtraPlay' | 'grantFreeReroll' | 'setRelicKeepHighest' | 'consumeRageFire';
  relicId?: string;
  counter?: number;
  value?: number;
}

/** 预期出牌结果 */
export interface ExpectedOutcomeResult {
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
  /** 副作用指令列表 — 调用方需执行 */
  pendingSideEffects: PendingSideEffect[];
}

/** 计算参数 */
export interface CalculateExpectedOutcomeParams {
  selected: Die[];
  dice: Die[];
  activeHands: string[];
  bestHand: string;
  game: GameState;
  targetEnemy: Enemy | null;
  rerollCount: number;
  activeAugments: Augment[];
  /** gameRef.current.furyBonusDamage */
  furyBonusDamage: number;
  /** gameRef.current.bloodRerollCount */
  bloodRerollCount: number;
  /** gameRef.current.warriorRageMult */
  warriorRageMult: number;
  /** gameRef.current.mageOverchargeMult */
  mageOverchargeMult: number;
}

/**
 * 计算预期出牌结果（纯函数，无副作用）
 * 
 * 从 DiceHeroGame.tsx 的 expectedOutcome useMemo 中提取。
 * 所有 setGame/setRerollCount 调用改为返回 PendingSideEffect[]。
 */
export function calculateExpectedOutcome(params: CalculateExpectedOutcomeParams): ExpectedOutcomeResult | null {
  const {
    selected, dice, activeHands, bestHand, game,
    targetEnemy, rerollCount, activeAugments,
    furyBonusDamage, bloodRerollCount, warriorRageMult, mageOverchargeMult,
  } = params;

  if (selected.length === 0) return null;

  const X = selected.reduce((sum, d) => sum + d.value, 0);
  let baseDamage = 0;
  let baseArmor = 0;
  let handMultiplier = 1;
  let baseHandValue = 0;
  let statusEffects: StatusEffect[] = [];
  const pendingSideEffects: PendingSideEffect[] = [];

  activeHands.forEach(handName => {
    const handDef = HAND_TYPES.find(h => h.name === handName);
    if (handDef) {
      const level = game.handLevels[handName] || 1;
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

  baseDamage = Math.floor(X * handMultiplier);

  if (activeHands.some((h: string) => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h))) {
    baseArmor += baseDamage;
  }

  let extraDamage = 0;
  let extraArmor = 0;
  let extraHeal = 0;
  let holyPurify = 0;
  let pierceDamage = 0;
  let armorBreak = false;
  let multiplier = 1;
  let goldBonus = 0;
  const triggeredAugments: { name: string, details: string, rawDamage?: number, rawMult?: number, relicId?: string, icon?: string }[] = [];

  // --- Augment effects ---
  activeAugments.forEach(aug => {
    const res = aug.effect(X, selected, aug.level || 1, { rerollsThisTurn: rerollCount, currentHp: game.hp, maxHp: game.maxHp, currentGold: game.souls });
    const details: string[] = [];

    if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
    if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
    if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
    if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率${Math.round(res.multiplier * 100)}%`); }
    if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
    if (res.goldBonus) { goldBonus += res.goldBonus; details.push(`金币+${res.goldBonus}`); }
    if (res.statusEffects) {
      res.statusEffects.forEach(s => {
        const existing = statusEffects.find(es => es.type === s.type);
        if (existing) {
          existing.value += s.value;
        } else {
          statusEffects.push({ ...s });
        }
        const info = STATUS_INFO[s.type];
        details.push(`${info.label}+${s.value}`);
      });
    }

    if (details.length > 0) {
      triggeredAugments.push({ name: aug.name, details: details.join(', '), rawDamage: (res.damage || 0) + (res.pierce || 0), rawMult: res.multiplier && res.multiplier !== 1 ? res.multiplier : undefined });
    }
  });

  // --- Relic on_play effects ---
  game.relics.filter(r => r.trigger === 'on_play').forEach(relic => {
    // counter 机制（铁血战旗等计数型遗物）
    if (relic.maxCounter !== undefined) {
      const currentCounter = game.relics.find(r2 => r2.id === relic.id)?.counter || 0;
      const newCounter = currentCounter + 1;
      if (newCounter < relic.maxCounter) {
        pendingSideEffects.push({ type: 'setRelicCounter', relicId: relic.id, counter: newCounter });
        return;
      }
      pendingSideEffects.push({ type: 'resetRelicCounter', relicId: relic.id, counter: 0 });
    }
    const relicCtx = buildRelicContext({
      game,
      dice,
      targetEnemy,
      rerollsThisTurn: rerollCount,
      handType: bestHand,
      selectedDice: selected,
      pointSum: X,
      hasPlayedThisTurn: (game.comboCount || 0) > 0,
    });
    const res = relic.effect(relicCtx);
    const details = [];
    if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
    if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
    if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
    if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率${Math.round(res.multiplier * 100)}%`); }
    if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
    if (res.goldBonus) { goldBonus += res.goldBonus; details.push(`金币+${res.goldBonus}`); }
    if (res.goldBonus) { /* toast will be shown in playHand */ }
    if (res.purifyDebuff) {
      holyPurify += (typeof res.purifyDebuff === 'number' ? res.purifyDebuff : 1);
      details.push('净化');
    }
    if (res.tempDrawBonus) {
      pendingSideEffects.push({ type: 'setRelicTempDrawBonus', value: res.tempDrawBonus });
      details.push('下回合+1手牌');
    }
    if (res.grantExtraPlay) {
      pendingSideEffects.push({ type: 'grantExtraPlay', value: res.grantExtraPlay });
      details.push(`+${res.grantExtraPlay}出牌`);
    }
    if (res.grantFreeReroll) {
      pendingSideEffects.push({ type: 'grantFreeReroll', value: res.grantFreeReroll });
      details.push(`+${res.grantFreeReroll}免费重投`);
    }
    if (res.keepHighestDie) {
      pendingSideEffects.push({ type: 'setRelicKeepHighest', value: res.keepHighestDie });
      details.push('保留最高点骰子');
    }
    if (details.length > 0) {
      triggeredAugments.push({ name: relic.name, details: details.join(', '), rawDamage: (res.damage || 0) + (res.pierce || 0), rawMult: res.multiplier && res.multiplier !== 1 ? res.multiplier : undefined, relicId: relic.id, icon: relic.icon });
    }
  });

  // --- Relic rageFireBonus ---
  if ((game.rageFireBonus || 0) > 0) {
    extraDamage += game.rageFireBonus!;
    triggeredAugments.push({ name: '怒火燎原', details: `伤害+${game.rageFireBonus}`, rawDamage: game.rageFireBonus!, relicId: 'rage_fire_relic', icon: 'blade' });
    pendingSideEffects.push({ type: 'consumeRageFire' });
  }

  // --- Dice onPlay effects ---
  const skipOnPlay = selected.length > 1 && activeHands.includes('普通攻击') && activeHands.length === 1;
  const isSameElementHand = activeHands.some((h: string) => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h));
  const isRoyalElement = activeHands.some((h) => h === '皇家元素顺');
  const elementBonus = isRoyalElement ? 3.0 : (isSameElementHand ? 2.0 : 1.0);

  const hasUnify = selected.some(d => getDiceDef(d.diceDefId).onPlay?.unifyElement);
  // 确定性选择：统一为第一个被选骰子的元素（预览需要确定性，避免 Math.random 导致 UI 闪烁）
  const unifiedElement = hasUnify && !skipOnPlay ? (selected.find(d => d.element && d.element !== 'normal')?.element as ElementName || 'fire') : null;

  selected.forEach(d => {
    if (skipOnPlay) return;
    const def = getDiceDef(d.diceDefId);
    const diceLevel = game.ownedDice.find(od => od.defId === d.diceDefId)?.level || 1;
    const levelBonus = getElementLevelBonus(diceLevel);
    const totalElementBonus = elementBonus * levelBonus;

    const activeElement = unifiedElement || d.collapsedElement;
    if (def.isElemental && activeElement) {
      const diceValue = d.value;
      switch (activeElement) {
        case 'fire':
          pierceDamage += Math.floor(diceValue * 2 * totalElementBonus);
          armorBreak = true;
          statusEffects.push({ type: 'burn', value: diceValue });
          break;
        case 'ice':
          if (!targetEnemy?.statuses?.some(s => (s.type as string) === 'freeze_immune')) {
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

    if (def.onPlay?.selfDamage) {
      if (game.hp + extraHeal > def.onPlay.selfDamage) {
        extraHeal -= def.onPlay.selfDamage;
      }
    }

    if (!def.onPlay) return;
    const upgradedOp = getUpgradedOnPlay(def, diceLevel);
    const op = upgradedOp || def.onPlay;
    const depthDmgBonus = 1 + Math.floor((game.depth || 0) / 3) * 0.15;
    const depthMultBonus = Math.floor((game.depth || 0) / 5) * 0.05;

    // === 基础效果 ===
    if (op.bonusDamage && !op.firstPlayOnly && !op.requiresTriple) {
      extraDamage += Math.floor(op.bonusDamage * elementBonus * depthDmgBonus);
    }
    if (op.bonusMult && !op.requiresCharge) multiplier *= (1 + (op.bonusMult - 1 + depthMultBonus) * elementBonus);
    if (op.heal) extraHeal += Math.floor(op.heal * elementBonus);
    if (op.pierce) pierceDamage += Math.floor(op.pierce * elementBonus);
    if (op.statusToEnemy) {
      const boostedValue = Math.floor(op.statusToEnemy.value * elementBonus);
      const existing = statusEffects.find(es => es.type === op.statusToEnemy!.type);
      if (existing) { existing.value += boostedValue; }
      else { statusEffects.push({ ...op.statusToEnemy, value: boostedValue }); }
    }

    // === 战士效果 ===
    if (op.selfDamagePercent) {
      const selfDmg = Math.ceil(game.maxHp * op.selfDamagePercent);
      if (game.hp + extraHeal > selfDmg) {
        extraHeal -= selfDmg;
      }
    }
    if (op.armor) extraArmor += op.armor;
    if (op.armorFromValue) extraArmor += d.value;
    if (op.armorFromTotalPoints) extraArmor += selected.reduce((sum, sd) => sum + sd.value, 0);
    if (op.armorBreak) armorBreak = true;
    if (op.armorToDamage && targetEnemy) extraDamage += (targetEnemy.armor || 0);
    if (op.scaleWithHits) extraDamage += furyBonusDamage;
    if (op.firstPlayOnly && op.bonusDamage) {
      const isFirstPlay = (game.comboCount || 0) === 0 && game.battleTurn <= 1;
      if (isFirstPlay) extraDamage += Math.floor(op.bonusDamage * elementBonus * depthDmgBonus);
    }
    if (op.scaleWithLostHp) {
      const lostHp = game.maxHp - game.hp;
      extraDamage += Math.floor(lostHp * op.scaleWithLostHp);
    }
    if (op.executeThreshold && op.executeMult && targetEnemy) {
      if (targetEnemy.hp / targetEnemy.maxHp < op.executeThreshold) {
        multiplier *= op.executeMult;
        if (op.executeHeal) extraHeal += op.executeHeal;
      }
    }
    if (op.aoeDamage) extraDamage += op.aoeDamage;
    if (op.healFromValue) extraHeal += d.value;
    if (op.maxHpBonus) extraHeal += op.maxHpBonus;
    if (op.healOrMaxHp) {
      if (game.hp < game.maxHp) extraHeal += d.value;
    }
    if (op.lowHpOverrideValue && op.lowHpThreshold) {
      if (game.hp / game.maxHp < op.lowHpThreshold && d.value < op.lowHpOverrideValue) {
        extraDamage += (op.lowHpOverrideValue - d.value);
      }
    }
    if (op.requiresTriple && op.bonusDamageFromPoints) {
      const tripleHands = ['三条', '四条', '五条', '六条', '葫芦'];
      if (activeHands.some((h: string) => tripleHands.includes(h))) {
        const totalPoints = selected.reduce((sum, sd) => sum + sd.value, 0);
        extraDamage += Math.floor(totalPoints * op.bonusDamageFromPoints);
      }
    }
    if (op.scaleWithBloodRerolls && game.bloodRerollCount) {
      const faceBonus = Math.min(game.bloodRerollCount, 3);
      extraDamage += faceBonus;
    }
    if (op.selfBerserk) {
      multiplier *= 1.3;
      const berserkDmg = Math.ceil(game.maxHp * 0.05);
      if (game.hp + extraHeal > berserkDmg) {
        extraHeal -= berserkDmg;
      }
    }
    if (op.scaleWithSelfDamage) {
      const selfDmgThisTurn = (game.bloodRerollCount || 0) * 2;
      multiplier *= (1 + selfDmgThisTurn * 0.02);
    }
    if (op.damageFromArmor) {
      extraDamage += Math.floor((game.armor + extraArmor) * op.damageFromArmor);
    }
    if (op.purifyAll) holyPurify += 99;
    if (op.tauntAll) { /* 在出牌后实际应用时处理 */ }

    // === 法师效果 ===
    if (op.reverseValue) {
      const reversed = 7 - d.value;
      if (reversed > d.value) extraDamage += (reversed - d.value);
    }
    if (op.copyHighestValue) {
      const maxVal = Math.max(...selected.map(sd => sd.value));
      if (maxVal > d.value) extraDamage += (maxVal - d.value);
    }
    if (op.overrideValue) {
      if (op.overrideValue > d.value) extraDamage += (op.overrideValue - d.value);
    }
    if (op.bonusDamagePerElement) {
      const elemCount = dice.filter(dd => !dd.spent && dd.element !== 'normal').length;
      extraDamage += elemCount * op.bonusDamagePerElement;
    }
    if (op.multPerElement) {
      const elemCount = dice.filter(dd => !dd.spent && dd.element !== 'normal').length;
      multiplier *= (1 + elemCount * op.multPerElement);
    }
    if (op.burnEcho && targetEnemy) {
      const burnStacks = targetEnemy.statuses.find(s => s.type === 'burn')?.value || 0;
      if (burnStacks > 0) extraDamage += burnStacks * 5;
    }
    if (op.frostEchoDamage && targetEnemy) {
      const wasFrozen = targetEnemy.statuses.some(s => (s.type as string) === 'was_frozen');
      if (wasFrozen) multiplier *= (1 + op.frostEchoDamage);
    }
    if (op.damageShield) extraArmor += d.value * 2;
    if (op.armorFromHandSize) {
      const handSize = dice.filter(dd => !dd.spent).length;
      extraArmor += handSize * op.armorFromHandSize;
    }
    if (op.requiresCharge && op.bonusMult) {
      if ((game.chargeStacks || 0) >= op.requiresCharge) {
        const extraChargeLayers = Math.max(0, (game.chargeStacks || 0) - op.requiresCharge);
        const extraMult = op.bonusMultPerExtraCharge ? extraChargeLayers * op.bonusMultPerExtraCharge : 0;
        multiplier *= (op.bonusMult + extraMult);
      }
    }
    if (op.chainBolt) extraDamage += Math.floor(d.value * elementBonus);
    if (op.removeBurn) holyPurify += 1;
    if (op.healPerCleanse) {
      const negCount = game.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type)).length;
      extraHeal += negCount * op.healPerCleanse;
    }
    // 双元素（棱镜骰子）
    if (def.isElemental && d.secondElement && d.secondElement !== d.collapsedElement) {
      const diceValue = d.value;
      switch (d.secondElement) {
        case 'fire':
          pierceDamage += Math.floor(diceValue * totalElementBonus);
          statusEffects.push({ type: 'burn', value: Math.max(1, Math.floor(diceValue / 2)) });
          break;
        case 'ice':
          if (!targetEnemy?.statuses?.some(s => (s.type as string) === 'freeze_immune')) {
            statusEffects.push({ type: 'freeze', value: 1, duration: 1 });
          }
          break;
        case 'thunder':
          pierceDamage += Math.floor(diceValue * totalElementBonus);
          break;
        case 'poison': {
          const pStacks = Math.floor((diceValue + 1) * totalElementBonus);
          const ep = statusEffects.find(es => es.type === 'poison');
          if (ep) ep.value += pStacks; else statusEffects.push({ type: 'poison', value: pStacks });
          break;
        }
        case 'holy':
          extraHeal += Math.floor(diceValue * 0.5 * elementBonus);
          break;
      }
    }
    if (op.swapWithUnselected) {
      const unselected = dice.filter(dd => !dd.spent && !dd.selected);
      if (unselected.length > 0) {
        const best = unselected.reduce((a, b) => a.value > b.value ? a : b);
        if (best.value > d.value) extraDamage += (best.value - d.value);
      }
    }
    if (op.freezeBonus) {
      const existingFreeze = statusEffects.find(es => es.type === 'freeze');
      if (existingFreeze) { existingFreeze.value += op.freezeBonus; }
      else { statusEffects.push({ type: 'freeze', value: 1 + op.freezeBonus }); }
    }
    if (op.triggerAllElements) {
      const elementsInHand = new Set(dice.filter(dd => !dd.spent && dd.element !== 'normal').map(dd => dd.element));
      extraDamage += elementsInHand.size * 5;
    }
    if (op.multiElementBlast) {
      const elements = ['fire', 'ice', 'thunder', 'poison', 'holy'];
      selected.forEach((sd, idx) => {
        // 确定性轮转：按骰子索引选元素，避免 Math.random 导致预览闪烁
        const randElem = elements[idx % elements.length];
        const dv = sd.value;
        switch (randElem) {
          case 'fire': pierceDamage += Math.floor(dv * totalElementBonus); statusEffects.push({ type: 'burn', value: Math.max(1, Math.floor(dv / 2)) }); break;
          case 'ice': statusEffects.push({ type: 'freeze', value: 1, duration: 1 }); break;
          case 'thunder': pierceDamage += Math.floor(dv * totalElementBonus); break;
          case 'poison': { const ps = Math.floor((dv + 1) * totalElementBonus); const ep = statusEffects.find(es => es.type === 'poison'); if (ep) ep.value += ps; else statusEffects.push({ type: 'poison', value: ps }); break; }
          case 'holy': extraHeal += Math.floor(dv * 0.5); break;
        }
      });
    }

    // === 盗贼效果 ===
    if (op.comboBonus) multiplier *= (1 + op.comboBonus);
    if (op.poisonFromValue) {
      const poisonVal = d.value;
      const existing = statusEffects.find(es => es.type === 'poison');
      if (existing) { existing.value += poisonVal; }
      else { statusEffects.push({ type: 'poison', value: poisonVal }); }
    }
    if (op.poisonInverse) {
      const poisonVal = Math.max(1, 7 - d.value);
      const existing = statusEffects.find(es => es.type === 'poison');
      if (existing) { existing.value += poisonVal; }
      else { statusEffects.push({ type: 'poison', value: poisonVal }); }
    }
    if (op.poisonBase) {
      let poisonVal = d.value + op.poisonBase;
      if (op.poisonBonusIfPoisoned && targetEnemy?.statuses.some(s => s.type === 'poison')) {
        poisonVal += op.poisonBonusIfPoisoned;
      }
      const existing = statusEffects.find(es => es.type === 'poison');
      if (existing) { existing.value += poisonVal; }
      else { statusEffects.push({ type: 'poison', value: poisonVal }); }
    }
    if (op.critOnSecondPlay && (game.comboCount || 0) >= 1) multiplier *= op.critOnSecondPlay;
    if (op.comboScaleDamage) multiplier *= (1 + (game.comboCount || 0) * op.comboScaleDamage);
    if (op.poisonScaleDamage && targetEnemy) {
      const targetPoison = targetEnemy.statuses.find(s => s.type === 'poison')?.value || 0;
      extraDamage += targetPoison * op.poisonScaleDamage;
    }
    if (op.comboDetonatePoison && (game.comboCount || 0) >= 1 && targetEnemy) {
      const targetPoison = targetEnemy.statuses.find(s => s.type === 'poison')?.value || 0;
      extraDamage += Math.floor(targetPoison * op.comboDetonatePoison);
    }
    if (op.multOnThirdPlay && (game.comboCount || 0) >= 2) multiplier *= op.multOnThirdPlay;
    if (op.bonusDamageOnSecondPlay && (game.comboCount || 0) >= 1) extraDamage += op.bonusDamageOnSecondPlay;
    if (op.bonusMultOnSecondPlay && (game.comboCount || 0) >= 1) multiplier *= op.bonusMultOnSecondPlay;
    if (op.stealArmor && targetEnemy) {
      const stolen = Math.min(targetEnemy.armor, op.stealArmor);
      extraArmor += stolen;
    }
    if (op.poisonFromPoisonDice) {
      const poisonDiceCount = selected.filter(sd => {
        const dd = getDiceDef(sd.diceDefId);
        return dd.onPlay?.poisonInverse || dd.onPlay?.poisonBase || dd.onPlay?.statusToEnemy?.type === 'poison';
      }).length;
      const poisonVal = poisonDiceCount * op.poisonFromPoisonDice;
      if (poisonVal > 0) {
        const existing = statusEffects.find(es => es.type === 'poison');
        if (existing) { existing.value += poisonVal; }
        else { statusEffects.push({ type: 'poison', value: poisonVal }); }
      }
    }
    if (op.detonatePoisonPercent && targetEnemy) {
      const currentPoison = targetEnemy.statuses.find(s => s.type === 'poison')?.value || 0;
      const extraPlays = Math.max(0, (game.comboCount || 0) - 1);
      const detonateRate = Math.min(1, op.detonatePoisonPercent + (op.detonateExtraPerPlay || 0) * extraPlays);
      extraDamage += Math.floor(currentPoison * detonateRate);
    }
    if (op.escalateDamage) multiplier *= (1 + (game.comboCount || 0) * op.escalateDamage);
    if (op.phantomFromShadowDice) {
      const shadowCount = dice.filter(dd => !dd.spent && dd.diceDefId === 'temp_rogue').length;
      const phantomVal = Math.max(2, shadowCount * 2);
      if (phantomVal > d.value) extraDamage += (phantomVal - d.value);
    }
    if (op.wildcard) {
      if (d.value < 6) extraDamage += (6 - d.value);
    }
    if (op.purifyOne) holyPurify += 1;
    if (op.comboHeal && (game.comboCount || 0) >= 1) extraHeal += op.comboHeal;
    if (op.transferDebuff) {
      const negativeStatuses = game.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type));
      if (negativeStatuses.length > 0) {
        holyPurify += 1;
        const transferred = negativeStatuses[0];
        statusEffects.push({ type: transferred.type, value: transferred.value });
      }
    }
    if (op.detonateAllOnLastPlay && game.playerClass === 'rogue') {
      if ((game.comboCount || 0) >= 1 && targetEnemy) {
        const totalDebuffs = targetEnemy.statuses.reduce((sum, s) => {
          if (['poison', 'burn', 'vulnerable', 'weak'].includes(s.type)) return sum + s.value;
          return sum;
        }, 0);
        extraDamage += totalDebuffs * 2;
      }
    }
  });

  // 法师过充倍率加成
  if (game.playerClass === 'mage' && mageOverchargeMult > 0) {
    multiplier *= (1 + mageOverchargeMult);
    triggeredAugments.push({ name: '过充吟唱', details: `伤害×${Math.round((1 + mageOverchargeMult) * 100)}%`, rawMult: 1 + mageOverchargeMult });
  }

  const totalDamage = Math.floor(baseDamage * multiplier) + extraDamage + pierceDamage;

  let modifiedDamage = totalDamage;
  const playerWeak = game.statuses.find(s => s.type === 'weak');
  if (playerWeak) modifiedDamage = Math.floor(modifiedDamage * 0.75);

  const enemyVulnerable = targetEnemy?.statuses.find(s => s.type === 'vulnerable');
  if (enemyVulnerable) modifiedDamage = Math.floor(modifiedDamage * 1.5);

  // 战士【血怒战意】（封顶走 FURY_CONFIG）
  const effectiveFuryStacks = game.playerClass === 'warrior' ? Math.min(bloodRerollCount, FURY_CONFIG.maxStack) : 0;
  if (effectiveFuryStacks > 0) {
    modifiedDamage = Math.floor(modifiedDamage * (1 + effectiveFuryStacks * FURY_CONFIG.damagePerStack));
  }
  // 战士【狂暴本能】
  if (game.playerClass === 'warrior' && warriorRageMult > 0) {
    modifiedDamage = Math.floor(modifiedDamage * (1 + warriorRageMult));
  }
  // 盗贼【连击加成】
  if (game.playerClass === 'rogue' && (game.comboCount || 0) >= 1 && bestHand !== '普通攻击') {
    modifiedDamage = Math.floor(modifiedDamage * 1.2);
  }

  return {
    damage: modifiedDamage,
    armor: Math.floor(baseArmor + extraArmor),
    heal: extraHeal,
    baseDamage,
    baseHandValue,
    handMultiplier,
    extraDamage: modifiedDamage - baseDamage - pierceDamage,
    pierceDamage,
    armorBreak,
    multiplier,
    triggeredAugments,
    bestHand,
    statusEffects,
    X,
    selectedValues: selected.map(d => d.value),
    goldBonus,
    holyPurify,
    pendingSideEffects,
  };
}

/**
 * 执行 pendingSideEffects — 在 useMemo 之后调用
 */
export function applyPendingSideEffects(
  effects: PendingSideEffect[],
  setGame: React.Dispatch<React.SetStateAction<GameState>>,
  setRerollCount: React.Dispatch<React.SetStateAction<number>>,
) {
  effects.forEach(eff => {
    switch (eff.type) {
      case 'setRelicCounter':
        setGame(prev => ({ ...prev, relics: prev.relics.map(r => r.id === eff.relicId ? { ...r, counter: eff.counter } : r) }));
        break;
      case 'resetRelicCounter':
        setGame(prev => ({ ...prev, relics: prev.relics.map(r => r.id === eff.relicId ? { ...r, counter: 0 } : r) }));
        break;
      case 'setRelicTempDrawBonus':
        setGame(prev => ({ ...prev, relicTempDrawBonus: (prev.relicTempDrawBonus || 0) + (eff.value || 0) }));
        break;
      case 'grantExtraPlay':
        setGame(prev => ({ ...prev, playsLeft: prev.playsLeft + (eff.value || 0) }));
        break;
      case 'grantFreeReroll':
        setRerollCount(prev => Math.max(0, prev - (eff.value || 0)));
        break;
      case 'setRelicKeepHighest':
        setGame(prev => ({ ...prev, relicKeepHighest: (prev.relicKeepHighest || 0) + (eff.value || 0) }));
        break;
      case 'consumeRageFire':
        setGame(prev => ({ ...prev, rageFireBonus: 0 }));
        break;
    }
  });
}
