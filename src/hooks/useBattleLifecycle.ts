/**
 * useBattleLifecycle.ts — 战斗生命周期 Hook
 * 提取自 DiceHeroGame.tsx Phase H (Round3)
 * 包含 startBattle / startNode / rollAllDice / resetGame / handleSelectStartingRelic / handleSkipStartingRelic
 * + GM useEffects + BGM useEffect + phase清空enemies useEffect
 */
import { useEffect, useRef } from 'react';
import type { Die, MapNode, Enemy, GameState, Relic } from '../types/game';
import { createInitialGameState } from '../logic/gameInit';
import { drawFromBag, initDiceBag } from '../data/diceBag';
import { getEnemiesForNode } from '../data/enemies';
import { generateChallenge } from '../utils/instakillChallenge';
import { generateMap } from '../utils/mapGenerator';
import { generateShopItems } from '../logic/shopGenerator';
import { generateStartingRelicChoices } from '../data/skillModules';
import { ALL_RELICS } from '../data/relics';
import { resetCompassCounter, incrementFloorsCleared, updateRelicCounter, tickHourglass } from '../engine/relicUpdates';
import { buildRelicContext } from '../engine/buildRelicContext';
import { CHAPTER_CONFIG, ANIMATION_TIMING } from '../config';
import { playSound, startBGM, stopBGM } from '../utils/sound';
import { buildBattleGameState, performDiceRollAnimation } from '../logic/battleInit';
import type { BattleState } from './useBattleState';

export function useBattleLifecycle(state: BattleState) {
  const {
    game, setGame,
    dice, setDice,
    enemies, setEnemies,
    rerollCount, setRerollCount,
    targetEnemyUid, targetEnemy,
    battleTransition, setBattleTransition,
    bossEntrance, setBossEntrance,
    gmPendingVictory, setGmPendingVictory,
    gmPendingNextWave, setGmPendingNextWave,
    setDiceDrawAnim, setShuffleAnimating,
    setEnemyEffects, setDyingEnemies,
    setEnemyEffectForUid,
    setPlayerEffect,
    setEnemyQuotes, setEnemyQuotedLowHp,
    setWaveAnnouncement,
    setRerollFlash,
    setHpGained, setArmorGained,
    setStartingRelicChoices,
    setPendingBattleNode,
    startingRelicChoices,
    pendingBattleNode,
    _campfireView, setCampfireView,
    gameRef,
    playsPerEnemyRef,
    addLog, addToast, addFloatingText,
    showEnemyQuote, pickQuote, getEnemyQuotes,
  } = state;

  // handleVictory 在 useBattleCombat 中定义，通过 ref 解决循环依赖
  const handleVictoryRef = useRef<() => void>(() => {});

  // ==================== startBattle ====================
  const startBattle = async (nodeOrIndex: MapNode | number) => {
    // nextNode() 可能传入数字索引，需从 map 中查找
    const node: MapNode = typeof nodeOrIndex === 'number'
      ? game.map.find(n => n.id === nodeOrIndex) || game.map.find(n => n.depth === nodeOrIndex)!
      : nodeOrIndex;
    setBattleTransition('fadeIn');
    await new Promise(r => setTimeout(r, 200));
    setBattleTransition('hold');

    const waves = (() => {
      const chapterScale = CHAPTER_CONFIG.chapterScaling[Math.min(game.chapter - 1, CHAPTER_CONFIG.chapterScaling.length - 1)];
      return getEnemiesForNode(node, node.depth, game.enemyHpMultiplier * chapterScale.hpMult, chapterScale.dmgMult, game.chapter);
    })();
    const firstWave = waves[0]?.enemies || [];
    setEnemies(firstWave);
    setEnemyEffects({}); setDyingEnemies(new Set());
    setEnemyQuotes({});
    setEnemyQuotedLowHp(new Set());
    setTimeout(() => {
      firstWave.forEach((e, idx) => {
        const q = getEnemyQuotes(e.configId);
        const line = pickQuote(q?.enter);
        if (line) {
          setTimeout(() => {
            showEnemyQuote(e.uid, line, 3000);
            playSound('enemy_speak');
            setEnemyEffectForUid(e.uid, 'speaking');
            setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
          }, idx * 400);
        }
      });
    }, 300);
    setPlayerEffect(null);
    if (node.type === 'boss') {
      playSound('boss_appear');
      if (waves.length === 1) {
        const bossEnemy = firstWave[0];
        if (bossEnemy) {
          setBossEntrance({ visible: true, name: bossEnemy.name, chapter: game.chapter });
          await new Promise(r => setTimeout(r, ANIMATION_TIMING.enemyDeathCleanupDelay));
          setBossEntrance(prev => ({ ...prev, visible: false }));
          await new Promise(r => setTimeout(r, 200));
          setEnemyEffectForUid(bossEnemy.uid, 'boss_entrance');
          playSound('boss_laugh');
          await new Promise(r => setTimeout(r, ANIMATION_TIMING.bossEntranceDuration));
          setEnemyEffectForUid(bossEnemy.uid, null);
        }
      }
    }
    playsPerEnemyRef.current = {};
    const battleChallenge = generateChallenge(node.depth, game.chapter, game.drawCount, node.type);
    setGame(prev => buildBattleGameState({ prev, node, waves, firstWave, battleChallenge }));
    const freshBag = initDiceBag(game.ownedDice);
    const drawCountBonus = 0;
    const startWarriorBonus = (game.playerClass === 'warrior' && game.hp <= game.maxHp * 0.5) ? 1 : 0;
    if (startWarriorBonus > 0) {
      setTimeout(() => addFloatingText('血怒补牌+1', 'text-red-400', undefined, 'player'), 500);
    }
    const freshCount = Math.min(6, game.drawCount + drawCountBonus + startWarriorBonus);
    const { drawn: freshDrawn, newBag: fBag, newDiscard: fDiscard, shuffled: fShuffled } = drawFromBag(freshBag, [], freshCount);
    if (fShuffled) addToast('\u2728 弃骰库已洗回骰子库!', 'buff');
    setGame(prev => ({ ...prev, diceBag: fBag, discardPile: fDiscard }));
    setDice(freshDrawn.map(d => ({ ...d, rolling: true, value: Math.floor(Math.random() * 6) + 1 })));
    await performDiceRollAnimation({
      drawn: freshDrawn,
      game,
      cb: { setDice, setGame, addLog },
      isStartBattle: true,
    });
    await new Promise(r => setTimeout(r, 200));
    setDice(prev => [...prev]);
    setRerollCount(0);
    addLog(`遇到 ${firstWave.map(e => e.name).join('、')}！`);

    setBattleTransition('fadeOut');
    setTimeout(() => setBattleTransition('none'), 300);
  };

  // ==================== startNode ====================
  const startNode = (node: MapNode) => {
    playSound('select');
    let moveGoldBonus = 0;
    game.relics.filter(r => r.trigger === 'on_move').forEach(relic => {
      if (relic.id === 'treasure_map_relic' && node.type !== 'treasure') return;
      if (relic.id === 'navigator_compass') {
        const compass = game.relics.find(r => r.id === 'navigator_compass');
        const newCounter = ((compass?.counter || 0) + 1);
        const maxC = compass?.maxCounter || 3;
        if (newCounter >= maxC) {
          addToast(`导航罗盘: 3步已满，下次出牌+8伤害+5护甲！`, 'buff');
          setGame(prev => ({
            ...prev,
            relics: resetCompassCounter(prev.relics),
          }));
        } else {
          setGame(prev => ({
            ...prev,
            relics: updateRelicCounter(prev.relics, 'navigator_compass', newCounter),
          }));
        }
        return;
      }
      const moveCtx = buildRelicContext({ game, dice, targetEnemy: null, rerollsThisTurn: 0, hasPlayedThisTurn: false });
      const res = relic.effect(moveCtx);
      if (res.goldBonus) {
        moveGoldBonus += res.goldBonus;
      }
    });
    if (moveGoldBonus > 0) {
      setGame(prev => ({ ...prev, souls: prev.souls + moveGoldBonus, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + moveGoldBonus } }));
      addToast(`移动奖励: +${moveGoldBonus}金币`, 'buff');
    }
    setGame(prev => ({
      ...prev,
      relics: tickHourglass(prev.relics),
    }));
    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      if (node.depth === 0) {
        const relicChoices = generateStartingRelicChoices(game.relics.map(r => r.id));
        setStartingRelicChoices(relicChoices);
        setPendingBattleNode(node);
        setGame(prev => ({ ...prev, phase: 'skillSelect', currentNodeId: node.id }));
      } else {
        startBattle(node);
      }
    } else if (node.type === 'campfire') {
      playSound('campfire');
      setCampfireView('main');
      setGame(prev => ({ ...prev, phase: 'campfire', currentNodeId: node.id }));
    } else if (node.type === 'merchant') {
      const shopItems = generateShopItems(game.relics.map(r => r.id));
      setGame(prev => ({ ...prev, phase: 'merchant', currentNodeId: node.id, shopItems }));
    } else if (node.type === 'treasure') {
      setGame(prev => ({ ...prev, phase: 'treasure', currentNodeId: node.id }));
    } else if (node.type === 'event') {
      playSound('event');
      setGame(prev => ({ ...prev, phase: 'event', currentNodeId: node.id }));
    }
  };

  // ==================== rollAllDice ====================
  const rollAllDice = async (forceResetHand = false) => {
    playSound('roll');
    const g = gameRef.current;

    let keptDice: Die[] = [];
    if (g.playerClass === 'mage' && !forceResetHand) {
      keptDice = dice.filter(d => !d.spent);
      const chargeStacks = g.chargeStacks || 0;
      const handLimit = Math.min(6, g.drawCount + chargeStacks);
      if (keptDice.length > handLimit) {
        const excess = keptDice.slice(0, keptDice.length - handLimit);
        keptDice = keptDice.slice(keptDice.length - handLimit);
        setGame(prev => ({ ...prev, discardPile: [...prev.discardPile, ...excess.filter(d => !d.isTemp && d.diceDefId !== 'temp_rogue').map(d => d.diceDefId)] }));
      }
    }

    const handDefIds = (g.playerClass === 'mage' && !forceResetHand ? [] : dice.filter(d => !d.spent && !d.isTemp && d.diceDefId !== 'temp_rogue')).map(d => d.diceDefId);
    const currentDiscard = [...g.discardPile, ...handDefIds];
    const relicDrawBonus = 0;

    const chargeStacks = forceResetHand ? 0 : (g.chargeStacks || 0);
    const warriorBonus = (g.playerClass === 'warrior' && g.hp <= g.maxHp * 0.5) ? 1 : 0;
    if (warriorBonus > 0) {
      setTimeout(() => addFloatingText('血怒补牌+1', 'text-red-400', undefined, 'player'), 200);
    }
    const rawHandLimit = g.playerClass === 'mage' ? (g.drawCount + chargeStacks) : (g.drawCount + warriorBonus);
    const handLimit = Math.min(6, rawHandLimit);
    if (g.playerClass === 'warrior' && rawHandLimit > 6) {
      const hpLostPct = Math.max(0, 1 - g.hp / g.maxHp);
      const rageMult = Math.round(hpLostPct * 100) / 100;
      setGame(prev => ({ ...prev, warriorRageMult: rageMult }));
      if (rageMult > 0) {
        setTimeout(() => addFloatingText(`狂暴+${Math.round(rageMult * 100)}%`, 'text-red-500', undefined, 'player'), 400);
      }
    } else if (g.playerClass === 'warrior') {
      setGame(prev => ({ ...prev, warriorRageMult: 0 }));
    }
    const rogueDrawBonus = (g.playerClass === 'rogue' && (g.rogueComboDrawBonus || 0) > 0) ? (g.rogueComboDrawBonus || 0) : 0;
    if (rogueDrawBonus > 0) {
      setTimeout(() => addFloatingText(`连击心得+${rogueDrawBonus}手牌`, 'text-green-300', undefined, 'player'), 300);
      setGame(prev => ({ ...prev, rogueComboDrawBonus: 0 }));
    }
    const count = Math.max(0, handLimit - keptDice.filter(d => d.diceDefId !== 'temp_rogue' && !d.isBonusDraw).length) + relicDrawBonus + rogueDrawBonus;

    const { drawn, newBag, newDiscard, shuffled } = drawFromBag(g.diceBag, currentDiscard, count);

    if (shuffled) {
            setShuffleAnimating(true);
            setTimeout(() => setShuffleAnimating(false), 800);
      addToast('\u2728 弃骰库已洗回骰子库!', 'buff');
    }
    setGame(prev => ({ ...prev, diceBag: newBag, discardPile: newDiscard }));
    const resetKeptDice = keptDice.map(d => ({ ...d, bounceGrowCount: 0, boomerangUsed: false }));
    setDice([...resetKeptDice, ...drawn.map(d => ({ ...d, rolling: true, value: Math.floor(Math.random() * 6) + 1 }))]);

    await performDiceRollAnimation({
      drawn,
      game,
      cb: { setDice, setGame, addLog },
      isStartBattle: false,
    });
  };

  // ==================== resetGame ====================
  const resetGame = () => {
    setGame(createInitialGameState());
    setDice([]);
    setEnemies([]);
  };

  // ==================== handleSelectStartingRelic ====================
  const handleSelectStartingRelic = (relic: Relic) => {
    playSound('select');
    const node = pendingBattleNode;
    if (!node) return;

    setGame(prev => ({
      ...prev,
      relics: [...prev.relics, relic],
      hp: Math.max(1, prev.hp - (relic.rarity === 'common' ? 5 : relic.rarity === 'uncommon' ? 10 : 15)),
      maxHp: prev.maxHp - (relic.rarity === 'common' ? 5 : relic.rarity === 'uncommon' ? 10 : 15),
    }));

    addToast(`获得遗物「${relic.name}」!`, 'buff');
    addLog(`战前选择了遗物「${relic.name}」`);

    setPendingBattleNode(null);
    startBattle(node);
  };

  // ==================== handleSkipStartingRelic ====================
  const handleSkipStartingRelic = () => {
    playSound('select');
    const node = pendingBattleNode;
    if (!node) return;
    setPendingBattleNode(null);
    addLog('跳过了战前技能选择，直接进入战斗。');
    startBattle(node);
  };

  // ==================== GM: 杀死当前波次敌人 ====================
  useEffect(() => {
    const flag = game.gmKillWave;
    if (flag && game.phase === 'battle') {
      setGame(prev => { const { gmKillWave: _, ...rest } = prev; return rest; });
      // Bug-3: 先更新 hp=0，再设置 death effect，确保两者在同一渲染帧内完成
      // React 18 批量更新会自动合并这两个 setState
      const alive = enemies.filter(e => e.hp > 0);
      setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, hp: 0 } : e));
      alive.forEach(e => setEnemyEffectForUid(e.uid, 'death'));
      setTimeout(() => {
        const nextWaveIdx = game.currentWaveIndex + 1;
        if (nextWaveIdx < game.battleWaves.length) {
          setGmPendingNextWave(true);
        } else {
          setGmPendingVictory(true);
        }
      }, ANIMATION_TIMING.enemyDeathCleanupDelay);
    }
  }, [game.gmKillWave]);

  // ==================== GM: 延迟触发胜利 ====================
  useEffect(() => {
    if (gmPendingVictory) {
      setGmPendingVictory(false);
      handleVictoryRef.current();
    }
  }, [gmPendingVictory]);

  // ==================== GM: 延迟触发下一波 ====================
  useEffect(() => {
    if (gmPendingNextWave && game.phase === 'battle') {
      setGmPendingNextWave(false);
      const nextWaveIdx = game.currentWaveIndex + 1;
      if (nextWaveIdx >= game.battleWaves.length) { handleVictoryRef.current(); return; }
      const nextWave = game.battleWaves[nextWaveIdx].enemies;
      const currentNode = game.map.find(n => n.id === game.currentNodeId);
      const isBossWave = currentNode?.type === 'boss' && nextWave.length === 1 && nextWave[0].maxHp > 200;

      const doTransition = async () => {
        if (isBossWave) {
          playSound('boss_appear');
          setBossEntrance({ visible: true, name: nextWave[0].name, chapter: game.chapter });
          await new Promise(r => setTimeout(r, ANIMATION_TIMING.enemyDeathCleanupDelay));
          setBossEntrance(prev => ({ ...prev, visible: false }));
          await new Promise(r => setTimeout(r, 300));
        }
        // Bug-3: 波次转换前确认死亡动画已播完
        await new Promise(r => setTimeout(r, ANIMATION_TIMING.waveTransitionDeathBuffer));
        setEnemies(nextWave);
        setEnemyEffects({}); setDyingEnemies(new Set());
        if (isBossWave && nextWave[0]) {
          setEnemyEffectForUid(nextWave[0].uid, 'boss_entrance');
          playSound('boss_laugh');
          await new Promise(r => setTimeout(r, ANIMATION_TIMING.bossEntranceDuration));
          setEnemyEffectForUid(nextWave[0].uid, null);
        }
        setEnemyQuotes({});
        setEnemyQuotedLowHp(new Set());
        // 垮波次：保留玩家剩余出牌/重投/连击状态（Bug-21：垮波次≠回合结束）
        // Bug-4：法师吟唱（不出牌）时保留 chargeStacks 和屯牌；出了牌时重置吟唱状态
        setGame(prev => {
          const isMageChanting = prev.playerClass === 'mage' && prev.playsLeft >= prev.maxPlays;
          return { ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: Math.max(prev.playsLeft, 1), freeRerollsLeft: Math.max(prev.freeRerollsLeft, 1), armor: 0, chargeStacks: isMageChanting ? prev.chargeStacks : 0, mageOverchargeMult: isMageChanting ? prev.mageOverchargeMult : 0, bloodRerollCount: 0, comboCount: prev.comboCount, lockedElement: isMageChanting ? prev.lockedElement : undefined, lastPlayHandType: prev.lastPlayHandType, instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type), instakillCompleted: false, playsThisWave: 0, rerollsThisWave: 0, battleTurn: 1 };
        });
        setRerollCount(0);
        setWaveAnnouncement(nextWaveIdx + 1);
        addLog(`第 ${nextWaveIdx + 1} 波敌人来袭！`);
        // Bug-4：法师吟唱时保留屯牌，不清空骰子、不强制重置手牌
        // 注意：使用 gameRef.current 获取最新 playsLeft（game 快照可能过时）
        const gmGame = gameRef.current;
        const isMageChanting = gmGame.playerClass === 'mage' && gmGame.playsLeft >= gmGame.maxPlays;
        if (!isMageChanting) {
          setDice([]);
        }
        rollAllDice(!isMageChanting);
      };
      doTransition();
    }
  }, [gmPendingNextWave]);

  // ==================== BGM 管理 ====================
  useEffect(() => {
    const bgmMap: Record<string, 'battle' | 'explore' | 'start' | 'stop'> = {
      battle: 'battle',
      map: 'explore', merchant: 'explore', campfire: 'explore',
      event: 'explore', diceReward: 'explore', loot: 'explore',
      skillSelect: 'explore', treasure: 'explore',
      start: 'start',
      chapterTransition: 'stop', gameover: 'stop', victory: 'stop',
    };
    const action = bgmMap[game.phase as string];
    if (action === 'stop') stopBGM();
    else if (action) startBGM(action);
  }, [game.phase]);

  // ==================== phase清空enemies ====================
  useEffect(() => {
    if (game.phase === 'reward' || game.phase === 'map') {
      // Bug-3: 检查是否有敌人正在播放死亡动画（effect === 'death'），如果有则延迟清空
      const hasDyingEnemy = enemies.some(e => {
        const effect = state.enemyEffects[e.uid];
        return e.hp <= 0 && (effect as string | null) === 'death';
      });
      if (hasDyingEnemy) {
        const timer = setTimeout(() => {
          setEnemies([]);
        }, ANIMATION_TIMING.victoryEnemyCleanupDelay);
        return () => clearTimeout(timer);
      }
      setEnemies([]);
    }
  }, [game.phase]);

  return {
    startBattle,
    startNode,
    rollAllDice,
    resetGame,
    handleSelectStartingRelic,
    handleSkipStartingRelic,
    handleVictoryRef,
  };
}

export type BattleLifecycle = ReturnType<typeof useBattleLifecycle>;
