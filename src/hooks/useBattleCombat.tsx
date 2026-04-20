/**
 * useBattleCombat.tsx — 战斗逻辑 Hook
 * 提取自 DiceHeroGame.tsx Phase I (Round3)
 * 包含 toggleLock / toggleSelect / playHand / endTurn /
 * Memos(straightUpgrade/currentHands/...) / useEffects
 * reroll 委托给 useReroll；胜利/战利品委托给 useBattleVictory
 */
import React, { useMemo, useEffect } from 'react';
import {
  getStraightUpgrade,
  hasFatalProtection,
} from '../engine/relicQueries';
import { triggerHourglass } from '../engine/relicUpdates';
import { buildRelicContext } from '../engine/buildRelicContext';
import { detectAoeActive, shouldWarnWarriorMultiNormal } from '../logic/aoeDetection';
import { computeHandHintIds } from '../logic/handHintCalc';
import { checkHands } from '../utils/handEvaluator';
import { playSound } from '../utils/sound';
import { calculateExpectedOutcome, applyPendingSideEffects } from '../logic/expectedOutcomeCalc';
import { runSettlementAnimation } from '../logic/settlementAnimation';
import { applyDamageToEnemies } from '../logic/damageApplication';
import { executePostPlayEffects, createCheckEnemyDeaths } from '../logic/postPlayEffects';
import { computePlayStatsUpdate, calcComboFinisherBonus } from '../logic/playHandStats';
import { handleRogueComboPrep, handleRogueComboHit } from '../logic/rogueComboEffects';
import { processTurnEnd } from '../logic/turnEndProcessing';
import { executeDrawPhase } from '../logic/drawPhase';
import { executeEnemyTurn } from '../logic/enemyAI';
import { buildEnemyAICallbacks } from '../logic/enemyAICallbackBuilder';
import { PixelCoin } from '../components/PixelIcons';
import type { BattleState } from './useBattleState';
import type { BattleLifecycle } from './useBattleLifecycle';
import { useBattleVictory } from './useBattleVictory';
import { useReroll } from './useReroll';

export function useBattleCombat(
  state: BattleState,
  lifecycle: BattleLifecycle,
) {
  const {
    game, setGame,
    dice, setDice,
    enemies, setEnemies,
    rerollCount, setRerollCount,
    targetEnemyUid, targetEnemy,
    gameRef, playsPerEnemyRef,
    setShuffleAnimating, setDiceDrawAnim,
    setEnemyEffectForUid,
    setEnemyEffects, setDyingEnemies,
    setEnemyQuotes, setEnemyQuotedLowHp,
    setScreenShake,
    setHpGained, setArmorGained, setPlayerEffect,
    setBossEntrance, setWaveAnnouncement, setHandLeftThrow,
    setSettlementData, setSettlementPhase,
    setShowRelicPanel, setShowDamageOverlay, setFlashingRelicIds,
    addLog, addToast, addFloatingText,
    showEnemyQuote, getEnemyQuotes, pickQuote,
    enemyQuotedLowHp,
  } = state;

  const { rollAllDice } = lifecycle;
  const handleVictoryRef = lifecycle.handleVictoryRef;
  // === 委托给子 hooks ===
  const victory = useBattleVictory(state, lifecycle);
  const reroll = useReroll(state);
  // ==================== toggleLock / toggleSelect ====================
  const toggleLock = (_id: number) => {};

  const toggleSelect = (id: number) => {
    const die = dice.find(d => d.id === id);
    if (!die) return;
    if (die.spent) { addToast('该骰子已使用'); return; }
    if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
    if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }

    const isCurrentlySelected = die.selected;
    state.setLastTappedDieId(isCurrentlySelected ? null : id);

    playSound('select');
    setDice(prev => {
      const next = prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d);
      const newSelected = next.filter(d => d.selected && !d.spent);

      if (game.playerClass === 'warrior' && !isCurrentlySelected && shouldWarnWarriorMultiNormal(newSelected)) {
        const handResult = checkHands(newSelected, { straightUpgrade: getStraightUpgrade(game.relics) });
        if (handResult.activeHands.includes('普通攻击') && handResult.activeHands.length === 1) {
          setTimeout(() => addToast('多选普通攻击：特殊骰子效果将被禁用！', 'info'), 50);
        }
      }
      return next;
    });
  };

  // ==================== Memos ====================
  const straightUpgrade = useMemo(() => getStraightUpgrade(game.relics), [game.relics]);

  const currentHands = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    return checkHands(selected, { straightUpgrade });
  }, [dice, straightUpgrade]);

  const isNormalAttackMulti = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    return selected.length > 1 && currentHands.activeHands.includes('普通攻击') && currentHands.activeHands.length === 1;
  }, [dice, currentHands]);

  const isNonWarriorMultiNormal = isNormalAttackMulti && game.playerClass !== 'warrior';

  const handHintIds = useMemo(() => {
    return computeHandHintIds({
      phase: game.phase,
      isEnemyTurn: game.isEnemyTurn,
      playsLeft: game.playsLeft,
      dice,
    });
  }, [dice, game.phase, game.isEnemyTurn, game.playsLeft]);

  const expectedOutcome = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    const { bestHand, allHands: _allHands, activeHands } = currentHands;
    return calculateExpectedOutcome({
      selected,
      dice,
      activeHands,
      bestHand,
      game,
      targetEnemy,
      rerollCount,
      furyBonusDamage: gameRef.current.furyBonusDamage || 0,
      bloodRerollCount: gameRef.current.bloodRerollCount || 0,
      warriorRageMult: gameRef.current.warriorRageMult || 0,
      mageOverchargeMult: gameRef.current.mageOverchargeMult || 0,
    });
  }, [dice, currentHands]);

  // 遗物副作用
  useEffect(() => {
    if (expectedOutcome && expectedOutcome.pendingSideEffects.length > 0) {
      applyPendingSideEffects(expectedOutcome.pendingSideEffects, setGame, setRerollCount);
    }
  }, [expectedOutcome]);

  // AOE state
  const isAoeActive = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0 || !expectedOutcome) return false;
    return detectAoeActive(selected, currentHands, isNormalAttackMulti);
  }, [dice, expectedOutcome, currentHands]);

  // ==================== playHand ====================
  const playHand = async () => {
    playSound('select');
    const selected = dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0) { addToast('请先选择骰子'); return; }
    if (enemies.length === 0 || !targetEnemy) return;
    if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
    if (dice.some(d => d.playing)) { addToast('正在出牌中...'); return; }
    if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }

    const targetUidForTracking = targetEnemy.uid;
    const playsBefore = playsPerEnemyRef.current[targetUidForTracking] || 0;
    playsPerEnemyRef.current = { ...playsPerEnemyRef.current, [targetUidForTracking]: playsBefore + 1 };

    const currentCombo = game.comboCount || 0;
    const lastHandType = game.lastPlayHandType;
    const thisHandType = currentHands.bestHand;
    const comboFinisherBonus = calcComboFinisherBonus({ playerClass: game.playerClass, currentCombo, lastHandType, thisHandType });

    setGame(prev => ({
      ...prev,
      playsLeft: prev.playsLeft - 1,
      playsPerEnemy: { ...playsPerEnemyRef.current },
      comboCount: (prev.comboCount || 0) + 1,
      lastPlayHandType: thisHandType,
    }));

    handleRogueComboPrep(game.playerClass, currentCombo, { setRerollCount, addFloatingText });
    handleRogueComboHit(game.playerClass, currentCombo, thisHandType, addFloatingText);

    const outcome = expectedOutcome;
    if (!outcome) return;
    if (outcome.goldBonus && outcome.goldBonus > 0) {
      setGame(prev => ({ ...prev, souls: prev.souls + outcome.goldBonus, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + outcome.goldBonus } }));
      addFloatingText(`+${outcome.goldBonus}`, 'text-yellow-400', <PixelCoin size={2} />, 'player');
    }

    const { bestHand } = currentHands;
    setDice(prev => prev.map(d => d.selected ? { ...d, playing: true } : d));
    setHandLeftThrow(true);
    setTimeout(() => setHandLeftThrow(false), 500);

    // 统计更新
    setGame(prev => ({ ...prev, stats: computePlayStatsUpdate({ prev, outcome, bestHand, selected }) }));

    // 结算演出
    const { settleDice, splitOccurred } = await runSettlementAnimation({
      game, gameRef, enemies, dice, currentHands, selected,
      outcome, targetEnemy, comboFinisherBonus, straightUpgrade, isAoeActive,
      setSettlementData, setSettlementPhase, setShowRelicPanel,
      setShowDamageOverlay, setScreenShake, setFlashingRelicIds, setGame,
      addLog, addToast, addFloatingText,
      playSound, playSettlementTick: (await import('../utils/sound')).playSettlementTick,
      playMultiplierTick: (await import('../utils/sound')).playMultiplierTick,
      playHeavyImpact: (await import('../utils/sound')).playHeavyImpact,
    });

    // 伤害应用
    const targetUid = targetEnemy.uid;
    const { hasAoe, isElementalAoe, finalEnemyHp } = applyDamageToEnemies({
      game, enemies, dice, selected, outcome, targetEnemy,
      settleDice, currentHands, targetUid, isAoeActive,
      playsPerEnemyRef,
      setEnemies, setGame, setArmorGained, setHpGained, setPlayerEffect,
      setEnemyEffectForUid, enemyQuotedLowHp, setEnemyQuotedLowHp,
      addFloatingText, playSound, showEnemyQuote, getEnemyQuotes, pickQuote,
    });

    // 出牌后效处理
    const postPlayCtx = {
      game, gameRef, enemies, dice, selected, settleDice, outcome,
      targetEnemy, hasAoe, isElementalAoe, targetUid, finalEnemyHp,
      currentCombo, bestHand, rerollCount, straightUpgrade,
      setGame, setEnemies, setDice, setRerollCount,
      addFloatingText, addToast, addLog, playSound,
      setScreenShake, setEnemyEffectForUid, showEnemyQuote, getEnemyQuotes, pickQuote,
      setBossEntrance, setEnemyEffects, setDyingEnemies,
      setEnemyQuotes, setEnemyQuotedLowHp, setWaveAnnouncement,
      rollAllDice, handleVictory: victory.handleVictory,
    };
    executePostPlayEffects(postPlayCtx);
    createCheckEnemyDeaths(postPlayCtx)();
  };

  // ==================== endTurn ====================
  const endTurn = async () => {
    // [DIAG] endTurn 入口
    // [BUG-FIX-v2] 防重入：如果敌人回合正在进行中，禁止再次进入
    if (gameRef.current.isEnemyTurn) {
      return;
    }
    // [BUG-FIX-v2] 防重入：如果已经 gameover，禁止进入
    if (gameRef.current.phase === 'gameover') {
      return;
    }

    await processTurnEnd({
      game, enemies, dice, rerollCount,
      setGame, setEnemies,
      addFloatingText, addToast, addLog, playSound, setScreenShake,
      buildRelicContext,
    });

    const enemyAICb = buildEnemyAICallbacks({
      setGame, setEnemies, setEnemyEffects, setDyingEnemies,
      setEnemyEffectForUid, enemyPreAction: state.enemyPreAction,
      addLog, addFloatingText, addToast, playSound,
      setScreenShake, setPlayerEffect, showEnemyQuote, getEnemyQuotes, pickQuote,
      setRerollCount, setWaveAnnouncement, setDice, rollAllDice,
      buildRelicContext, hasFatalProtection, triggerHourglass,
      handleVictory: victory.handleVictory, gameRef,
    });
    const enemyTurnHp = await executeEnemyTurn(game, enemies, dice, rerollCount, enemyAICb);
    let currentPlayerHp = enemyTurnHp;

    await new Promise(r => setTimeout(r, 100));

    // [DIAG] 敌人回合结束后的状态
    // [BUG-FIX-v2] 检查是否已在 enemyAI 内部设置了 gameover（避免重复设置）
    if (gameRef.current.phase === 'gameover') {
      return;
    }
    if (currentPlayerHp <= 0) {
      playSound('player_death'); setGame(prev => ({ ...prev, phase: 'gameover' })); return;
    }

    // [BUG-FIX-v2] 在回调内检查 gameover 状态，防止覆盖 enemyAI 设置的 gameover
    // 此回调可能在 await 之后执行，此时 gameRef.current 已更新
    setGame(prev => {
      if (prev.phase === 'gameover') {
        return prev;
      }
      return {
        ...prev,
        isEnemyTurn: false,
        armor: 0,
        playsLeft: prev.maxPlays,
        freeRerollsLeft: prev.freeRerollsPerTurn,
        hpLostThisTurn: 0,
        consecutiveNormalAttacks: 0,
      };
    });

    executeDrawPhase({
      gameRef, game, dice,
      setGame, setDice, setRerollCount,
      setShuffleAnimating, setDiceDrawAnim,
      addFloatingText, addToast, playSound,
    });
  };

  // ==================== useEffects ====================
  useEffect(() => {
    if (game.phase !== 'battle') return;
    const alive = enemies.filter(e => e.hp > 0);
    if (alive.length === 0) return;
    const currentTarget = alive.find(e => e.uid === game.targetEnemyUid);
    if (!currentTarget) {
      setGame(prev => ({ ...prev, targetEnemyUid: (alive.find(e => e.combatType === 'guardian') || alive[0]).uid }));
    }
  }, [enemies, game.phase, game.targetEnemyUid]);

  useEffect(() => {
    // [BUG-FIX-v2] 只在玩家回合才检查 hp<=0 → gameover
    // 敌人回合期间 hp 可能暂时 <=0（在 setGame 调度中），
    // 但 enemyAI 内部已经设置了 phase:'gameover'，这里不需要重复处理
    if (game.phase === 'battle' && !game.isEnemyTurn && game.hp <= 0) {
      playSound('player_death');
      setGame(prev => ({ ...prev, hp: 0, phase: 'gameover' }));
    }
  }, [game.phase, game.hp, game.isEnemyTurn]);

  useEffect(() => {
    const unspentDice = dice.filter(d => !d.spent);
    if (
      game.phase === 'battle' &&
      !game.isEnemyTurn &&
      enemies.length > 0 &&
      enemies.some(e => e.hp > 0) &&
      game.hp > 0 &&
      dice.length > 0 &&
      !dice.some(d => d.rolling) &&
      !dice.some(d => d.playing) &&
      (game.playsLeft <= 0 || unspentDice.length === 0)
    ) {
      const timer = setTimeout(() => {
        // [BUG-FIX-v2] 再次确认状态未变（闭包中的 game 可能已过期）
        const g = gameRef.current;
        if (g.phase !== 'battle' || g.isEnemyTurn || g.hp <= 0) return;
        endTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.isEnemyTurn, enemies, game.hp, dice, game.playsLeft]);

  // 将 handleVictory 注入到 lifecycle 的 ref
  handleVictoryRef.current = victory.handleVictory;

  return {
    // Reroll（委托给 useReroll）
    currentRerollCost: reroll.currentRerollCost,
    canReroll: reroll.canReroll,
    canAffordReroll: reroll.canAffordReroll,
    freeRerollsRemaining: reroll.freeRerollsRemaining,
    rerollSelected: reroll.rerollSelected,

    // 战斗动作
    toggleLock,
    toggleSelect,
    playHand,
    endTurn,

    // Memos
    straightUpgrade,
    currentHands,
    isNormalAttackMulti,
    isNonWarriorMultiNormal,
    handHintIds,
    expectedOutcome,
    isAoeActive,

    // 胜利/战利品（委托给 useBattleVictory）
    handleVictory: victory.handleVictory,
    collectLoot: victory.collectLoot,
    finishLoot: victory.finishLoot,
    pickReward: victory.pickReward,
    nextNode: victory.nextNode,
  };
}

export type BattleCombat = ReturnType<typeof useBattleCombat>;
