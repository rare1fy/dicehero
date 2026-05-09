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
import { runSettlementAnimation } from '../logic/settlement';
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
import { setRewardBusy } from '../logic/rewardEvents';

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
    gameRef, playsPerEnemyRef, enemiesRef,
    setShuffleAnimating, setDiceDrawAnim,
    setEnemyEffectForUid,
    setEnemyEffects, setDyingEnemies,
    setEnemyQuotes, setEnemyQuotedLowHp, setEnemyQuotedPhase2,
    setScreenShake,
    setHpGained, setArmorGained, setPlayerEffect,
    setBossEntrance, setWaveAnnouncement, setHandLeftThrow,
    setSettlementData, setSettlementPhase,
    setShowRelicPanel, setShowDamageOverlay, setFlashingRelicIds,
    addLog, addToast, addFloatingText,
    showEnemyQuote, getEnemyQuotes, pickQuote,
    enemyQuotedLowHp, enemyQuotedPhase2,
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
  // [DEPS-FIX 2026-05-08] 追加升级加成字段到 useMemo 依赖：
  //   levelDamageBonus / levelDamageMultBonus / levelPierceBonus 变化时必须重算 outcome。
  //   不依赖整个 game 对象，只提取三个有效字段，避免不必要的重算。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dice, currentHands, game.levelDamageBonus, game.levelDamageMultBonus, game.levelPierceBonus]);

  // [Bug-FIX 2026-05-07] 删除预览阶段自动应用 pendingSideEffects 的 useEffect。
  // 原实现每当 expectedOutcome 重算（选/取消选骰子）就执行 setRelicCounter / grantExtraPlay 等
  // 写入操作，导致铁血战旗 counter 在预览中累加、playsLeft 异常+1 等严重逻辑错误。
  // pendingSideEffects 现统一在真正出牌时（playHand 内部）调用 applyPendingSideEffects 一次。

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
    // [Bug-23] 检查目标敌人是否存活——战斗结束后盗贼补出牌次数不应允许对已死敌人出牌
    if (targetEnemy.hp <= 0) return;
    if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
    if (dice.some(d => d.playing)) { addToast('正在出牌中...'); return; }
    // [ROLL-GUARD 2026-05-08] roll 动画进行中禁止出牌，防止连点造成点数/状态错乱及误触发 autoEnd
    if (dice.some(d => d.rolling)) { addToast('骰子还在翻滚中...'); return; }
    // [Bug-23] 检查是否还有存活的敌人——所有敌人已死时不再允许出牌
    if (!enemies.some(e => e.hp > 0)) return;

    // [REWARD-GATE v2.1 2026-05-08] 从 playHand 入口就打开闸门，覆盖 handleRogueComboPrep
    // 等"结算演出前"的副作用飘字（盗贼连击预备 +1重投 等），关闭时机仍由 DiceHeroGame 的
    // useEffect 监听 showDamageOverlay 非 null→null 自动 flush。
    setRewardBusy(true);

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
      // [2026-05-08] 法师出牌瞬间立即清零法术反噬 + 吟唱受击计数，让玩家第一时间看到 debuff 消失
      ...(prev.playerClass === 'mage' ? { arcaneBackfire: 0, mageChantHitCount: 0 } : {}),
    }));

    // [Bug-FIX 2026-05-07] 严格重投规则：每次出牌后清零所有未使用的免费重投。
    // 下次出牌的免费重投只能依赖该次新得的奖励（comboFreeReroll/boomerangFreeReroll）。
    // 实现：把 rerollCount 拉到当前 effective 上限（基础+临时全视为已用）+ 清掉临时奖励字段。
    // 注意：必须在 handleRogueComboPrep 之前执行，避免误清"本次出牌新发的"奖励。
    {
      const baseFree = game.freeRerollsPerTurn || 1;
      const tempBoomerang = game.boomerangFreeReroll || 0;
      const tempCombo = game.comboFreeReroll || 0;
      const effectiveCap = baseFree + tempBoomerang + tempCombo;
      setRerollCount(prev => Math.max(prev, effectiveCap));
      setGame(prev => ({ ...prev, boomerangFreeReroll: 0, comboFreeReroll: 0 }));
    }

    handleRogueComboPrep(game.playerClass, currentCombo, { setGame, addFloatingText });
    handleRogueComboHit(game.playerClass, currentCombo, thisHandType, addFloatingText);

    const outcome = expectedOutcome;
    if (!outcome) { setRewardBusy(false); return; }

    // [Bug-FIX 2026-05-07] 实际出牌时统一应用预览阶段计算出的副作用
    // （铁血战旗 counter 推进/重置、grantExtraPlay、grantFreeReroll、tempDrawBonus 等）
    if (outcome.pendingSideEffects.length > 0) {
      applyPendingSideEffects(outcome.pendingSideEffects, setGame, setRerollCount);
    }

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
      enemyQuotedPhase2, setEnemyQuotedPhase2,
      addFloatingText, playSound, showEnemyQuote, getEnemyQuotes, pickQuote,
      setScreenShake,
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
    // [ROLL-GUARD 2026-05-08] 骰子动画进行中禁止结束回合，防止重投/初次抽牌过程中被连点结束
    if (dice.some(d => d.playing) || dice.some(d => d.rolling)) {
      return;
    }
    // [LEVEL-UP-PAUSE 2026-05-08] 升级弹窗期间完全冻结敌人回合：
    //   轮询直到玩家领完所有 pendingLevelUps 奖励再继续推进。
    while ((gameRef.current.pendingLevelUps?.length || 0) > 0) {
      await new Promise(r => setTimeout(r, 200));
      if ((gameRef.current.phase as string) === 'gameover') return;
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
      setScreenShake, setPlayerEffect: setPlayerEffect as React.Dispatch<React.SetStateAction<string | null>>, showEnemyQuote, getEnemyQuotes, pickQuote,
      setRerollCount, setWaveAnnouncement, setDice, rollAllDice,
      buildRelicContext, hasFatalProtection, triggerHourglass,
      handleVictory: victory.handleVictory, gameRef, enemiesRef,
    });
    const enemyTurnResult = await executeEnemyTurn(game, enemies, dice, rerollCount, enemyAICb);
    let currentPlayerHp = enemyTurnResult.hp;

    await new Promise(r => setTimeout(r, 100));

    // [DIAG] 敌人回合结束后的状态
    // [BUG-FIX-v2] 检查是否已在 enemyAI 内部设置了 gameover（避免重复设置）
    // TS narrowing 破除：await 后 gameRef.current 可能已被异步修改为 gameover
    if ((gameRef.current.phase as string) === 'gameover') {
      return;
    }
    if (currentPlayerHp <= 0) {
      playSound('player_death');
      setScreenShake(true);
      setPlayerEffect('death');
      await new Promise(r => setTimeout(r, 800));
      setScreenShake(false);
      setPlayerEffect(null);
      setGame(prev => ({ ...prev, phase: 'gameover' }));
      return;
    }

    // Bug-21: DOT 击杀触发波次转换时，tryWaveTransition 已设置好状态
    // （isEnemyTurn=false, playsLeft保留, 新骰子已抽），不应被 endTurn 覆盖
    if (enemyTurnResult.waveTransitioned) {
      return;
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
        chantShield: 0,
        playsLeft: prev.maxPlays,
        freeRerollsLeft: prev.freeRerollsPerTurn,
        hpLostThisTurn: 0,
        consecutiveNormalAttacks: 0,
        boomerangFreeReroll: 0,
        comboFreeReroll: 0,
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
      setScreenShake(true);
      setPlayerEffect('death');
      const timerId = setTimeout(() => { setScreenShake(false); setPlayerEffect(null); }, 800);
      setGame(prev => ({ ...prev, hp: 0, phase: 'gameover' }));
      return () => clearTimeout(timerId);
    }
  }, [game.phase, game.hp, game.isEnemyTurn]);

  useEffect(() => {
    const unspentDice = dice.filter(d => !d.spent);
    // [Bug-1 fix] 自动 endTurn 触发条件：
    //   (a) 所有骰子已 spent —— 即使有 grantExtraPlay 给的额外 playsLeft，
    //       手里没骰子可打了也应自动结束回合
    //   (b) playsLeft <= 0 + 没有 boomerang/bounceAndGrow 弹回的骰子 —— 兜底
    const noPlayableDice = unspentDice.length === 0;
    const noPlaysLeft = game.playsLeft <= 0;
    const shouldAutoEnd = noPlayableDice || noPlaysLeft;

    // [DIAG-AUTOEND] dev 诊断：每当条件变化打一次状态
    if (import.meta.env?.DEV && game.phase === 'battle' && !game.isEnemyTurn) {
      // eslint-disable-next-line no-console
      console.log('[AutoEndCheck]', {
        phase: game.phase,
        isEnemyTurn: game.isEnemyTurn,
        enemiesAlive: enemies.filter(e => e.hp > 0).length,
        playerHp: game.hp,
        playsLeft: game.playsLeft,
        unspentCount: unspentDice.length,
        rolling: dice.some(d => d.rolling),
        playing: dice.some(d => d.playing),
        shouldAutoEnd,
        willTrigger: game.phase === 'battle' && !game.isEnemyTurn && enemies.length > 0 && enemies.some(e => e.hp > 0) && game.hp > 0 && dice.length > 0 && !dice.some(d => d.rolling) && !dice.some(d => d.playing) && shouldAutoEnd,
      });
    }

    if (
      game.phase === 'battle' &&
      !game.isEnemyTurn &&
      (game.pendingLevelUps?.length || 0) === 0 && // 升级弹窗期间不自动结束回合
      enemies.length > 0 &&
      enemies.some(e => e.hp > 0) &&
      game.hp > 0 &&
      dice.length > 0 &&
      !dice.some(d => d.rolling) &&
      !dice.some(d => d.playing) &&
      shouldAutoEnd
    ) {
      const timer = setTimeout(() => {
        // [BUG-FIX-v2] 再次确认状态未变（闭包中的 game 可能已过期）
        const g = gameRef.current;
        if (g.phase !== 'battle' || g.isEnemyTurn || g.hp <= 0) {
          if (import.meta.env?.DEV) console.log('[AutoEndAbort] phase/turn/hp invalid', g.phase, g.isEnemyTurn, g.hp);
          return;
        }
        // [LEVEL-UP-PAUSE] 定时器触发时若仍在弹窗中，放弃这次自动 endTurn
        if ((g.pendingLevelUps?.length || 0) > 0) {
          return;
        }
        // 二次校验：必须仍然满足"无可玩骰子"或"无出牌次数"才能结束
        const stillNoDice = !dice.some(d => !d.spent);
        const stillNoPlays = g.playsLeft <= 0;
        if (!stillNoDice && !stillNoPlays) {
          if (import.meta.env?.DEV) console.log('[AutoEndAbort] state changed', { stillNoDice, stillNoPlays, playsLeft: g.playsLeft });
          return;
        }
        if (import.meta.env?.DEV) console.log('[AutoEndFire] calling endTurn()');
        endTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.isEnemyTurn, enemies, game.hp, dice, game.playsLeft, game.pendingLevelUps]);

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
