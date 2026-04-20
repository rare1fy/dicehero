/**
 * settlementAnimation.ts — 结算演出逻辑
 *
 * 从 DiceHeroGame.tsx playHand() L1048-L1431 提取。
 * 纯函数：接收 state 快照 + 回调，返回 settleDice / splitOccurred。
 *
 * ARCH-F Round1 模块拆分
 */

import type React from 'react';
import type { Die, GameState, Enemy, HandResult, StatusEffect } from '../types/game';
import type { ExpectedOutcomeResult } from './expectedOutcomeTypes';
import type { EnemyQuotes } from '../config/enemies';
import { getDiceDef, getUpgradedOnPlay } from '../data/dice';
import { HAND_TYPES } from '../data/handTypes';
import { STATUS_INFO } from '../data/statusInfo';
import { FURY_CONFIG } from '../config/gameBalance';
import { checkHands } from '../utils/handEvaluator';

// ============================================================
// Context 接口
// ============================================================

export interface SettlementContext {
  // State 快照
  game: GameState;
  gameRef: React.MutableRefObject<GameState>;
  enemies: Enemy[];
  dice: Die[];
  currentHands: HandResult;
  selected: Die[];
  outcome: ExpectedOutcomeResult;
  targetEnemy: Enemy;
  comboFinisherBonus: number;
  straightUpgrade: number;
  isAoeActive: boolean;

  // Callbacks — React setState 稳定引用
  setSettlementData: React.Dispatch<React.SetStateAction<SettlementData | null>>;
  setSettlementPhase: React.Dispatch<React.SetStateAction<string | null>>;
  setShowRelicPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDamageOverlay: React.Dispatch<React.SetStateAction<{ damage: number; armor: number; heal: number } | null>>;
  setScreenShake: React.Dispatch<React.SetStateAction<boolean>>;
  setFlashingRelicIds: React.Dispatch<React.SetStateAction<string[]>>;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string) => void;
  addToast: (msg: string, type?: string) => void;
  addFloatingText: (text: string, color: string, icon?: React.ReactNode, target?: string, persistent?: boolean) => void;
  playSound: (id: string) => void;
  playSettlementTick: (idx: number) => void;
  playMultiplierTick: (idx: number) => void;
  playHeavyImpact: (intensity: number) => void;
}

/** 结算面板数据（与 DiceHeroGame 中 useState 内联类型一致） */
export interface SettlementData {
  bestHand: string;
  selectedDice: Die[];
  diceScores: number[];
  baseValue: number;
  mult: number;
  currentBase: number;
  currentMult: number;
  triggeredEffects: { name: string; detail: string; icon?: string; type: 'damage' | 'mult' | 'status' | 'heal' | 'armor'; rawValue?: number; rawMult?: number }[];
  currentEffectIdx: number;
  finalDamage: number;
  finalArmor: number;
  finalHeal: number;
  statusEffects: StatusEffect[];
  isSameElement?: boolean;
}

// ============================================================
// 主函数
// ============================================================

export async function runSettlementAnimation(ctx: SettlementContext): Promise<{
  settleDice: Die[];
  splitOccurred: boolean;
}> {
  const {
    game, gameRef, enemies, dice, currentHands, selected,
    outcome, targetEnemy, comboFinisherBonus, straightUpgrade, isAoeActive,
    setSettlementData, setSettlementPhase, setShowRelicPanel,
    setShowDamageOverlay, setScreenShake, setFlashingRelicIds, setGame,
    addLog, addToast, addFloatingText,
    playSound, playSettlementTick, playMultiplierTick, playHeavyImpact,
  } = ctx;

  // Phase 1: 牌型展示 (0.6s)
  // ========================================
  setShowRelicPanel(true); // 结算时展开遗物面板
  setSettlementPhase('hand');
  setSettlementData({
    bestHand: outcome.bestHand,
    selectedDice: selected,
    diceScores: selected.map(d => d.value),
    baseValue: outcome.baseHandValue,
    mult: outcome.handMultiplier,
    currentBase: outcome.baseHandValue,
    currentMult: outcome.handMultiplier,
    triggeredEffects: [],
    currentEffectIdx: -1,
    finalDamage: outcome.damage,
    finalArmor: outcome.armor,
    finalHeal: outcome.heal,
    statusEffects: outcome.statusEffects,
    isSameElement: currentHands.activeHands.some(h => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h)),
  });
  playSound('relic_activate');
  await new Promise(r => setTimeout(r, 600));

  // ========================================
  // Phase 2: 逐颗骰子计分 (每颗0.3s) — 分裂骰子在此阶段弹出
  // ========================================
  setSettlementPhase('dice');
  let runningBase = outcome.baseHandValue;
  let settleDice = [...selected]; // 实际参与结算的骰子列表
  let splitOccurred = false;
  for (let i = 0; i < settleDice.length; i++) {
    runningBase += settleDice[i].value;
    const currentRunning = runningBase;
    setSettlementData(prev => prev ? { ...prev, currentBase: currentRunning, currentEffectIdx: i, selectedDice: [...settleDice] } : prev);
    playSettlementTick(i);
    await new Promise(r => setTimeout(r, 280));

    // 分裂骰子：播放到它时额外弹出一颗随机点数骰子
    if (settleDice[i].diceDefId === 'split') {
      const splitFaces = [1, 2, 3, 4, 5, 6];
      const splitValue = splitFaces[Math.floor(Math.random() * splitFaces.length)]; // 复制相同点数
      const splitDie: Die = {
        id: settleDice[i].id + 9000,
        diceDefId: 'standard',
        value: splitValue,
        element: 'normal',
        selected: true,
        spent: false,
        rolling: false,
      };
      // 插入到当前位置之后
      settleDice.splice(i + 1, 0, splitDie);
      splitOccurred = true;
      playSound('relic_activate');
      // 更新显示 — 新骰子弹出，同时把新骰子的值也加入计分并点亮
      runningBase += splitValue;
      const splitRunning = runningBase;
      i++; // 跳过新插入的骰子，避免循环重复处理
      setSettlementData(prev => prev ? { ...prev, selectedDice: [...settleDice], currentBase: splitRunning, currentEffectIdx: i } : prev);
      await new Promise(r => setTimeout(r, 400));
      addLog(`分裂骰子分裂！额外弹出点数 ${splitValue}`);
      addToast(`分裂! 弹出点数 ${splitValue}`, 'buff');
    }
  }

  // 如果发生了分裂，重新计算牌型和伤害

  // 磁吸骰子：随机同化一颗同伴骰子的点数为自身点数（已被影响的不再重复）
  let magnetOccurred = false;
  const magnetizedIds = new Set<number>(); // 已被磁吸影响的骰子ID
  for (let i = 0; i < settleDice.length; i++) {
    if (settleDice[i].diceDefId === 'magnet' && settleDice.length > 1) {
      const magnetValue = settleDice[i].value;
      // 找到所有非磁吸且未被磁吸过的同伴骰子
      const targets = settleDice.filter((d, idx) => idx !== i && d.diceDefId !== 'magnet' && !magnetizedIds.has(d.id));
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const oldValue = target.value;
        target.value = magnetValue;
        magnetizedIds.add(target.id);
        magnetOccurred = true;
        playSound('relic_activate');
        setSettlementData(prev => prev ? { ...prev, selectedDice: [...settleDice] } : prev);
        await new Promise(r => setTimeout(r, 400));
        const targetDef = getDiceDef(target.diceDefId);
        addLog(`磁吸骰子同化！${targetDef.name}的点数 ${oldValue} → ${magnetValue}`);
        addToast(`?? ${targetDef.name} ${oldValue}→${magnetValue}`, 'buff');
      }
    }
  }

  // 如果发生了磁吸，也需要重新计算牌型和伤害（和分裂一样的逻辑）
  if (magnetOccurred && !splitOccurred) {
    const newHandResult = checkHands(settleDice, { straightUpgrade });
    const newBestHand = newHandResult.bestHand;
    if (newBestHand !== outcome.bestHand) {
      addLog(`磁吸改变了牌型！${outcome.bestHand} → ${newBestHand}`);
      addToast(` 牌型变化: ${outcome.bestHand} → ${newBestHand}`, newBestHand === '普通攻击' ? 'damage' : 'buff');
      playSound(newBestHand === '普通攻击' ? 'hit' : 'relic_activate');
    }
    const newX = settleDice.reduce((sum, d) => sum + d.value, 0);
    let newHandMult = 1;
    newHandResult.activeHands.forEach(handName => {
      const handDef = HAND_TYPES.find(h => h.name === handName);
      if (handDef) {
        const level = game.handLevels[handName] || 1;
        const levelBonusMult = (level - 1) * 0.3;
        newHandMult += ((handDef.mult || 1) - 1) + levelBonusMult;
      }
    });
    const newBaseDamage = Math.floor(newX * newHandMult);
    const newTotalDamage = Math.floor((newBaseDamage + (outcome.damage - Math.floor(outcome.X * outcome.handMultiplier))) * outcome.multiplier) + outcome.pierceDamage;
    outcome.damage = Math.max(0, newTotalDamage);
    outcome.bestHand = newBestHand;
    outcome.X = newX;
    outcome.handMultiplier = newHandMult;
    runningBase = 0;
    settleDice.forEach(d => runningBase += d.value);
    runningBase += outcome.baseHandValue;
    setSettlementData(prev => prev ? {
      ...prev,
      bestHand: newBestHand,
      selectedDice: [...settleDice],
      currentBase: runningBase,
      currentMult: newHandMult,
      finalDamage: outcome.damage,
    } : prev);
    await new Promise(r => setTimeout(r, 500));
  }
  if (splitOccurred) {
    const newHandResult = checkHands(settleDice, { straightUpgrade });
    const newBestHand = newHandResult.bestHand;
    if (newBestHand !== outcome.bestHand) {
      addLog(`分裂改变了牌型！${outcome.bestHand} → ${newBestHand}`);
      addToast(` 牌型变化: ${outcome.bestHand} → ${newBestHand}`, newBestHand === '普通攻击' ? 'damage' : 'buff');
      playSound(newBestHand === '普通攻击' ? 'hit' : 'relic_activate');
    }
    // 重新计算伤害（用新的骰子列表和牌型）
    const newX = settleDice.reduce((sum, d) => sum + d.value, 0);
    let newHandMult = 1;
    newHandResult.activeHands.forEach(handName => {
      const handDef = HAND_TYPES.find(h => h.name === handName);
      if (handDef) {
        const level = game.handLevels[handName] || 1;
        const levelBonusMult = (level - 1) * 0.3;
        newHandMult += ((handDef.mult || 1) - 1) + levelBonusMult;
      }
    });
    const newBaseDamage = Math.floor(newX * newHandMult);
    const newTotalDamage = Math.floor((newBaseDamage + (outcome.damage - Math.floor(outcome.X * outcome.handMultiplier))) * outcome.multiplier) + outcome.pierceDamage;
    // 更新 outcome 的伤害值（用闭包变量）
    outcome.damage = Math.max(0, newTotalDamage);
    outcome.bestHand = newBestHand;
    outcome.X = newX;
    outcome.handMultiplier = newHandMult;
    runningBase = 0;
    settleDice.forEach(d => runningBase += d.value);
    runningBase += outcome.baseHandValue;
    setSettlementData(prev => prev ? {
      ...prev,
      bestHand: newBestHand,
      selectedDice: [...settleDice],
      currentBase: runningBase,
      currentMult: newHandMult,
      finalDamage: outcome.damage,
    } : prev);
    await new Promise(r => setTimeout(r, 500));
  }
  await new Promise(r => setTimeout(r, 200));

  // Phase 2.5: 倍率强调动画 (0.5s)
  // ========================================
  setSettlementPhase('mult');
  playMultiplierTick(0);
  await new Promise(r => setTimeout(r, 500));


  // ========================================
  // Phase 3: 特殊效果触发 (每个0.4s)
  // ========================================
  setSettlementPhase('effects');
  
  // 收集所有触发效果
  const allEffects: { name: string; detail: string; type: 'damage' | 'mult' | 'status' | 'heal' | 'armor'; rawValue?: number; rawMult?: number; relicId?: string; icon?: string }[] = [];
  
  // 骰子onPlay效果
  const skipOnPlaySettlement = selected.length > 1 && currentHands.activeHands.includes('普通攻击') && currentHands.activeHands.length === 1;
  selected.forEach(d => {
    const def = getDiceDef(d.diceDefId);
    if (skipOnPlaySettlement || !def.onPlay) return;
    const diceLevel = game.ownedDice.find(od => od.defId === d.diceDefId)?.level || 1;
    const op = getUpgradedOnPlay(def, diceLevel) || def.onPlay;
    if (op.bonusDamage) allEffects.push({ name: def.name, rawValue: op.bonusDamage, detail: `伤害+${op.bonusDamage}`, type: 'damage' });
    if (op.bonusMult) allEffects.push({ name: def.name, rawMult: op.bonusMult, detail: `倍率+${Math.round((op.bonusMult - 1) * 100)}%`, type: 'mult' });
    if (op.scaleWithHits) {
      const furyBonus = gameRef.current.furyBonusDamage || 0;
      if (furyBonus > 0) allEffects.push({ name: def.name, rawValue: furyBonus, detail: `怒火+${furyBonus}`, type: 'damage' });
    }
    if (op.heal) allEffects.push({ name: def.name, detail: `回复${op.heal}HP`, type: 'heal' });
    if (op.pierce) allEffects.push({ name: def.name, rawValue: op.pierce, detail: `穿透+${op.pierce}`, type: 'damage' });
    if (op.statusToEnemy) {
      const info = STATUS_INFO[op.statusToEnemy.type];
      allEffects.push({ name: def.name, detail: `${info.label}+${op.statusToEnemy.value}`, type: 'status' });
    }
    // 以下是之前缺失的效果展示
    if (op.armor) allEffects.push({ name: def.name, detail: `护甲+${op.armor}`, type: 'armor' });
    if (op.armorFromValue) allEffects.push({ name: def.name, detail: `护甲+${d.value}(点数)`, type: 'armor' });
    if (op.armorFromTotalPoints) {
      const totalPts = selected.reduce((s, dd) => s + dd.value, 0);
      allEffects.push({ name: def.name, detail: `护甲+${totalPts}(总点数)`, type: 'armor' });
    }
    if (op.armorFromHandSize) {
      const handSize = dice.filter(dd => !dd.spent).length;
      allEffects.push({ name: def.name, detail: `护甲+${handSize * op.armorFromHandSize}(${handSize}×${op.armorFromHandSize})`, type: 'armor' });
    }
    if (op.armorBreak) allEffects.push({ name: def.name, detail: op.armorToDamage ? '破甲→伤害' : '摧毁护甲', type: 'damage' });
    if (op.aoeDamage) allEffects.push({ name: def.name, detail: `AOE ${op.aoeDamage}伤害`, type: 'damage' });
    if (op.selfDamagePercent) allEffects.push({ name: def.name, detail: `自伤${Math.round(op.selfDamagePercent * 100)}%`, type: 'status' });
    if (op.scaleWithLostHp) {
      const lostHp = game.maxHp - game.hp;
      allEffects.push({ name: def.name, detail: `已损失HP ${Math.round(lostHp * op.scaleWithLostHp)}伤害`, type: 'damage' });
    }
    if (op.executeThreshold) allEffects.push({ name: def.name, detail: `斩杀线${Math.round(op.executeThreshold * 100)}%→${Math.round(op.executeMult! * 100)}%伤害`, type: 'mult' });
    if (op.healFromValue) allEffects.push({ name: def.name, detail: `回复${d.value}HP(点数)`, type: 'heal' });
    if (op.maxHpBonusEvery) allEffects.push({ name: def.name, detail: `每${op.maxHpBonusEvery}次出牌后最大HP+5（当前${(game.lifefurnaceCounter || 0) + 1}/${op.maxHpBonusEvery}）`, type: 'heal' });
    if (op.maxHpBonus) allEffects.push({ name: def.name, detail: `最大HP+${op.maxHpBonus}`, type: 'heal' });
    if (op.bonusDamagePerElement) {
      const elemCount = dice.filter(dd => !dd.spent && dd.element !== 'normal').length;
      if (elemCount > 0) allEffects.push({ name: def.name, detail: `元素加成+${elemCount * op.bonusDamagePerElement}(${elemCount}×${op.bonusDamagePerElement})`, type: 'damage' });
    }
    if (op.bonusDamageFromPoints) allEffects.push({ name: def.name, detail: `总点数${Math.round(op.bonusDamageFromPoints * 100)}%加成`, type: 'damage' });
    if (op.damageFromArmor) allEffects.push({ name: def.name, detail: `护甲${Math.round(op.damageFromArmor * 100)}%→伤害`, type: 'damage' });
    if (op.overrideValue) allEffects.push({ name: def.name, detail: `点数→${op.overrideValue}`, type: 'damage' });
    if (op.copyHighestValue) allEffects.push({ name: def.name, detail: '复制最高点数', type: 'damage' });
    // devourDie display removed — now 超载
    if (op.poisonInverse) allEffects.push({ name: def.name, detail: `毒层${7 - d.value}`, type: 'status' });
    if (op.comboBonus) allEffects.push({ name: def.name, detail: `连击+${Math.round(op.comboBonus * 100)}%`, type: 'mult' });
    if (op.selfBerserk) allEffects.push({ name: def.name, detail: '狂暴: 伤害+30%/受伤+20%', type: 'status' });
    if (op.purifyAll) allEffects.push({ name: def.name, detail: '净化负面状态', type: 'heal' });
    if (op.stayInHand) allEffects.push({ name: def.name, detail: '不消耗留在手牌', type: 'status' });
    if (op.grantTempDie) allEffects.push({ name: def.name, detail: '+1临时骰子', type: 'status' });
    if (op.drawFromBag) allEffects.push({ name: def.name, detail: `补抽${op.drawFromBag}颗骰子`, type: 'status' });
    if (op.grantExtraPlay) allEffects.push({ name: def.name, detail: '+1出牌机会', type: 'status' });
    if (op.grantTempDieFixed) allEffects.push({ name: def.name, detail: '+1临时骰(2-5)', type: 'status' });
    if (op.multOnThirdPlay && (game.comboCount || 0) >= 2) allEffects.push({ name: def.name, detail: `追击+${Math.round((op.multOnThirdPlay - 1) * 100)}%`, type: 'mult' });
    if (op.shadowClonePlay) allEffects.push({ name: def.name, detail: `影分身+50%`, type: 'damage' });
    if (op.unifyElement) allEffects.push({ name: def.name, detail: '统一元素', type: 'status' });
    if (def.isElemental && d.secondElement) allEffects.push({ name: def.name, detail: `双元素: ${d.secondElement}`, type: 'status' });
    if (op.critOnSecondPlay && (game.comboCount || 0) >= 1) allEffects.push({ name: def.name, detail: `暴击+${Math.round((op.critOnSecondPlay - 1) * 100)}%`, type: 'mult', rawMult: op.critOnSecondPlay });
    if (op.bonusDamageOnSecondPlay && (game.comboCount || 0) >= 1) allEffects.push({ name: def.name, rawValue: op.bonusDamageOnSecondPlay, detail: `第2击+${op.bonusDamageOnSecondPlay}`, type: 'damage' });
    if (op.bonusMultOnSecondPlay && (game.comboCount || 0) >= 1) allEffects.push({ name: def.name, rawMult: op.bonusMultOnSecondPlay, detail: `第2击+${Math.round((op.bonusMultOnSecondPlay - 1) * 100)}%`, type: 'mult' });
    if (op.stealArmor) allEffects.push({ name: def.name, detail: `偷取护甲(≤${op.stealArmor})`, type: 'armor' });
    if (op.poisonBase) allEffects.push({ name: def.name, detail: `毒${d.value + op.poisonBase}${op.poisonBonusIfPoisoned ? '(已毒+' + op.poisonBonusIfPoisoned + ')' : ''}`, type: 'status' });
    if (op.poisonFromPoisonDice) allEffects.push({ name: def.name, detail: `毒系骰子×${op.poisonFromPoisonDice}毒层`, type: 'status' });
    if (op.detonatePoisonPercent) allEffects.push({ name: def.name, detail: `引爆${Math.round(op.detonatePoisonPercent * 100)}%毒层`, type: 'damage' });
    if (op.escalateDamage) allEffects.push({ name: def.name, detail: `递增+${Math.round(op.escalateDamage * 100)}%`, type: 'mult' });
    if (op.wildcard) allEffects.push({ name: def.name, detail: '万能→最优点数', type: 'damage' });
    if (op.transferDebuff) allEffects.push({ name: def.name, detail: '转移负面→敌人', type: 'status' });
    if (op.detonateAllOnLastPlay) allEffects.push({ name: def.name, detail: '引爆全部负面', type: 'damage' });
    if (op.bounceAndGrow) allEffects.push({ name: def.name, detail: '弹回+点数+1', type: 'status' });
    if (op.boomerangPlay) allEffects.push({ name: def.name, detail: '弹回+下次免费', type: 'status' });
    if (op.lowHpOverrideValue && op.lowHpThreshold && game.hp / game.maxHp < op.lowHpThreshold) allEffects.push({ name: def.name, detail: `低血→点数${op.lowHpOverrideValue}`, type: 'damage' });
    if (op.scaleWithBloodRerolls && game.bloodRerollCount) allEffects.push({ name: def.name, detail: `搏命+${Math.min(game.bloodRerollCount, 3)}面值`, type: 'damage' });
    if (op.scaleWithSelfDamage) allEffects.push({ name: def.name, detail: '自伤→伤害加成', type: 'mult' });
    if (op.tauntAll) allEffects.push({ name: def.name, detail: '嘲讽全体敌人', type: 'status' });
    if (op.freezeBonus) allEffects.push({ name: def.name, detail: `冻结+${op.freezeBonus}回合`, type: 'status' });
    if (op.swapWithUnselected) allEffects.push({ name: def.name, detail: '交换最高点数', type: 'damage' });
    if (op.triggerAllElements) allEffects.push({ name: def.name, detail: '触发全部元素', type: 'status' });
    if (op.removeBurn) allEffects.push({ name: def.name, detail: `清除${op.removeBurn}层灼烧`, type: 'heal' });
    if (op.healPerCleanse) allEffects.push({ name: def.name, detail: `每净化+${op.healPerCleanse}HP`, type: 'heal' });
    // 元素骰子坍缩效果
    if (def.isElemental && d.collapsedElement) {
      const elemNames: Record<string, string> = { fire: '灼烧', ice: '冻结', thunder: '雷击AOE', poison: '中毒', holy: '治疗' };
      allEffects.push({ name: def.name, detail: `${elemNames[d.collapsedElement] || d.collapsedElement}`, type: d.collapsedElement === 'holy' ? 'heal' : 'status' });
    }
  });
  
  // 遗物效果
  outcome.triggeredAugments.forEach(aug => {
    allEffects.push({ name: aug.name, detail: aug.details, type: aug.rawMult ? 'mult' : 'damage', rawValue: aug.rawDamage || undefined, rawMult: aug.rawMult || undefined, relicId: aug.relicId, icon: aug.icon });
  });

  // 战士血怒加成（5层封顶）
  const latestBloodRerolls = gameRef.current.bloodRerollCount || 0;
  if (game.playerClass === 'warrior' && latestBloodRerolls > 0) {
    const atCap = latestBloodRerolls >= FURY_CONFIG.maxStack;
    const effectiveStacks = Math.min(latestBloodRerolls, FURY_CONFIG.maxStack);
    allEffects.push({ name: '血怒', detail: `${effectiveStacks}/${FURY_CONFIG.maxStack}层 +${Math.round(effectiveStacks * FURY_CONFIG.damagePerStack * 100)}%${atCap ? ' [已满]' : ''}`, type: 'mult', rawMult: 1 + effectiveStacks * FURY_CONFIG.damagePerStack, icon: 'blooddrop' });
  }
  // 战士狂暴本能（受伤百分比倍率）
  const settlementRageMult = gameRef.current.warriorRageMult || 0;
  if (game.playerClass === 'warrior' && settlementRageMult > 0) {
    allEffects.push({ name: '狂暴', detail: `+${Math.round(settlementRageMult * 100)}%`, type: 'mult', rawMult: 1 + settlementRageMult, icon: 'flame' });
  }
  // 盗贼连击加成
  if (game.playerClass === 'rogue' && (game.comboCount || 0) >= 1) {
    allEffects.push({ name: '连击', detail: '+20%', type: 'mult', rawMult: 1.2, icon: 'zap' });
  }
  
  // 逐个展示效果
  for (let i = 0; i < allEffects.length; i++) {
    setSettlementData(prev => prev ? {
      ...prev,
      triggeredEffects: allEffects.slice(0, i + 1),
      // 动态更新基础值和倍率显示
      ...(allEffects[i].rawValue ? { currentBase: (prev?.currentBase || 0) + allEffects[i].rawValue! } : {}),
      ...(allEffects[i].rawMult ? { currentMult: (prev?.currentMult || 1) * allEffects[i].rawMult! } : {}),
      currentEffectIdx: i,
    } : prev);
    playMultiplierTick(i + 1);
    // 遗物icon刷光
    if (allEffects[i].relicId) {
      setFlashingRelicIds(prev => [...prev, allEffects[i].relicId!]);
      setTimeout(() => setFlashingRelicIds(prev => prev.filter(id => id !== allEffects[i].relicId)), 800);
    }
    await new Promise(r => setTimeout(r, 350));
  }
  if (allEffects.length > 0) await new Promise(r => setTimeout(r, 200));

  // 结算演出Q弹定格动画
  setSettlementPhase('bounce');
  await new Promise(r => setTimeout(r, 500));

  // === 棱镜聚焦：锁定当前元素到下回合 ===
  const hasLockElement = selected.some(d => getDiceDef(d.diceDefId).onPlay?.lockElement);
  if (hasLockElement) {
    const activeElem = selected.find(d => d.collapsedElement && d.collapsedElement !== 'normal')?.collapsedElement;
    if (activeElem) {
      setGame(prev => ({ ...prev, lockedElement: activeElem }));
      addFloatingText(`棱镜聚焦: ${activeElem}锁定!`, 'text-purple-300', undefined, 'player');
    }
  }

  // === 盗贼连击终结倍率：同牌型+25% ===
  if (comboFinisherBonus > 0) {
    outcome.damage = Math.floor(outcome.damage * (1 + comboFinisherBonus));
    addFloatingText(`连击终结! +${Math.round(comboFinisherBonus * 100)}%`, 'text-yellow-300', undefined, 'player');
  }

  // ========================================
  // Phase 4: 最终伤害飞出 (0.8s)
  // ========================================
  setSettlementPhase('damage');
  // 卡肉顿帧：大伤害时冻结画面+重击音效+强烈震动
  const maxEnemyHp = enemies.reduce((max, e) => Math.max(max, e.maxHp || e.hp), 1);
  const damageRatio = outcome.damage / maxEnemyHp;
  const isHeavyHit = damageRatio >= 0.5 || outcome.damage >= 60;
  const isMassiveHit = damageRatio >= 1.0 || outcome.damage >= 120;

  if (isMassiveHit) {
    // 毁灭级：重击音效 + 长顿帧 + 强震
    playHeavyImpact(1.0);
    setScreenShake(true);
    await new Promise(r => setTimeout(r, 150)); // 卡肉冻结
    playSound('critical');
    setTimeout(() => playSound('critical'), 120);
    setTimeout(() => playSound('critical'), 250);
  } else if (isHeavyHit) {
    // 重击：双重暴击 + 中等顿帧
    playHeavyImpact(0.6);
    setScreenShake(true);
    await new Promise(r => setTimeout(r, 100)); // 卡肉冻结
    playSound('critical');
    setTimeout(() => playSound('critical'), 150);
  } else if (outcome.damage >= 20) {
    playSound('critical');
    setScreenShake(true);
  } else if (outcome.damage > 0) {
    playSound('hit');
    setScreenShake(true);
  }
  setShowDamageOverlay({ damage: outcome.damage, armor: outcome.armor, heal: outcome.heal || 0 });
  setTimeout(() => setShowDamageOverlay(null), isMassiveHit ? 2500 : 1800);
  setTimeout(() => setScreenShake(false), isMassiveHit ? 500 : isHeavyHit ? 400 : 300);
  
  await new Promise(r => setTimeout(r, isMassiveHit ? 1200 : isHeavyHit ? 1000 : 800));

  // ========================================
  // 清理结算演出，应用实际效果
  // ========================================
  setSettlementPhase(null);
  setSettlementData(null);
  setShowRelicPanel(false); // 结算结束关闭遗物面板

  return { settleDice, splitOccurred };
}
