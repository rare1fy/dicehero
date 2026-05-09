/**
 * useBattleVictory.ts — 战斗胜利 & 战利品处理 Hook
 * 提取自 useBattleCombat.tsx (Round3 补充分片)
 * 包含 handleVictory / collectLoot / finishLoot / pickReward / nextNode
 */
import { startTransition } from 'react';
import type { Relic } from '../types/game';
import { incrementFloorsCleared, tickHourglass } from '../engine/relicUpdates';
import { buildRelicContext } from '../engine/buildRelicContext';
import { playSound, startBGM } from '../utils/sound';
import { buildLootItems, resolvePostVictoryPhase } from '../logic/lootHandler';
import { processCollectLoot, processFinishLoot } from '../logic/lootProcessor';
import { generateShopItems } from '../logic/shopGenerator';
import type { ClassId } from '../data/classes';
import { ANIMATION_TIMING } from '../config';
import type { BattleState } from './useBattleState';
import type { BattleLifecycle } from './useBattleLifecycle';

export function useBattleVictory(
  state: BattleState,
  lifecycle: BattleLifecycle,
) {
  const {
    game, setGame,
    dice,
    enemies,
    enemiesRef,
    targetEnemy,
    gameRef,
    addLog, addToast,
  } = state;

  // ==================== handleVictory ====================
  const handleVictory = () => {
    // [BUG-FIX 2026-05-10] 优先使用 ref 取最新 enemies，避免 playHand 闭包传进的快照过期
    // 之前：闭包 enemies 经常已被 setEnemies 修改但 React 还没重渲染 → 走到这里 enemies 仍是旧数组
    // 现在：用 enemiesRef.current 永远拿最新数组，且只在 phase 已离开 battle 时静默返回
    const liveEnemies = enemiesRef?.current ?? enemies;
    if (gameRef?.current && gameRef.current.phase !== 'battle') return;
    if (liveEnemies.length === 0) {
      // 兜底：异常路径下场上没敌人但仍处 battle phase，仍然推进胜利流程，避免死锁
      // 用 battleWaves 估算 killedCount/nodeType 即可
    }
    const allWaveEnemies = game.battleWaves.flatMap(w => w.enemies);
    const currentNode = game.map.find(n => n.id === game.currentNodeId);
    const nodeType = currentNode?.type || 'enemy';
    const killedCount = enemies.filter(e => e.hp <= 0).length;

    // Bug-3: 音效和日志异步化，减少战斗结束瞬间的同步负载
    setTimeout(() => {
      playSound('victory');
      addLog(`击败了 ${enemies[0]?.name || ""}！`);
    }, 0);

    // 战斗结束：先计算阶段判断（轻量纯函数，无需延迟）
    const postVictory = resolvePostVictoryPhase(game);

    // ---- 第一步：用 startTransition 降低状态转换优先级 ----
    // 保证 phase 切换不阻塞渲染，消除战斗结束卡顿
    // 核心状态转换（phase/统计/遗物更新）放入低优先级更新
    startTransition(() => {
      setGame(prev => {
        // 销毁敌人塞的废骰子
        const cleanedOwnedDice = prev.ownedDice.filter(d => d.defId !== 'cursed' && d.defId !== 'cracked');
        const cleanedDiceBag = prev.diceBag.filter(id => id !== 'cursed' && id !== 'cracked');
        const cleanedDiscardPile = prev.discardPile.filter(id => id !== 'cursed' && id !== 'cracked');
        const cleanedDrawCount = prev.drawCount - (prev.tempDrawCountBonus || 0);

        // 统计更新
        const s = { ...prev.stats };
        s.battlesWon += 1;
        s.enemiesKilled += killedCount;
        if (nodeType === 'elite') s.elitesWon += 1;
        if (nodeType === 'boss') s.bossesWon += 1;

        // 层厅征服者 + 沙漏
        const updatedRelics = tickHourglass(incrementFloorsCleared(prev.relics));

        // 地图标记
        const newMap = prev.map.map(n => n.id === prev.currentNodeId ? { ...n, completed: true } : n);

        // [LEVEL-BONUS 2026-05-08] 生息印记：每层地图结束后回血
        const mapHeal = prev.levelMapHeal || 0;
        const healedHp = mapHeal > 0 ? Math.min(prev.maxHp, prev.hp + mapHeal) : prev.hp;

        if (postVictory.phase === 'victory') {
          return {
            ...prev,
            hp: healedHp,
            ownedDice: cleanedOwnedDice,
            diceBag: cleanedDiceBag,
            discardPile: cleanedDiscardPile,
            drawCount: cleanedDrawCount,
            tempDrawCountBonus: 0,
            // [2026-05-09] 洞察弱点：本场战斗效果到此清零（胜利后进入奖励/下一节点）
            challengeDrawBonus: 0,
            challengeDamageMultBonus: 0,
            stats: { ...s, bossesWon: postVictory.bossesWon },
            relics: updatedRelics,
            map: newMap,
            phase: 'victory',
            isEnemyTurn: false,
          };
        }

        if (postVictory.phase === 'chapterTransition') {
          // [2026-05-07] 章节中层Boss不再产出 drawCount+1 奖励，固定加手牌上限的设定只有关底Boss才给
          return {
            ...prev,
            hp: healedHp,
            ownedDice: cleanedOwnedDice,
            diceBag: cleanedDiceBag,
            discardPile: cleanedDiscardPile,
            drawCount: cleanedDrawCount,
            tempDrawCountBonus: 0,
            challengeDrawBonus: 0,
            challengeDamageMultBonus: 0,
            stats: { ...s, bossesWon: postVictory.bossesWon },
            relics: updatedRelics,
            map: newMap,
            phase: 'chapterTransition',
            isEnemyTurn: false,
          };
        }

        // diceReward 阶段：先切换 phase，lootItems 在下一步异步补充
        return {
          ...prev,
          hp: healedHp,
          ownedDice: cleanedOwnedDice,
          diceBag: cleanedDiceBag,
          discardPile: cleanedDiscardPile,
          drawCount: cleanedDrawCount,
          tempDrawCountBonus: 0,
          challengeDrawBonus: 0,
          challengeDamageMultBonus: 0,
          stats: s,
          relics: updatedRelics,
          map: newMap,
          phase: 'diceReward',
          isEnemyTurn: false,
        };
      }); // end setGame
      /* EXPLORE_BGM_BOOST */
      if (postVictory.phase === 'diceReward' || postVictory.phase === 'victory' || postVictory.phase === 'chapterTransition') {
        // chapterTransition 自己会 stop，不影响；diceReward / victory 尽快切到 explore
        if (postVictory.phase === 'diceReward') { startBGM('explore'); }
      }
    }); // end startTransition

    // ---- 第二步：异步处理遗物 on_battle_end + 战利品构建 ----
    // 仅在 diceReward 阶段需要：bonusGold 影响 lootItems 金币数量
    // 放在 setGame 之后，不阻塞核心状态转换
    if (postVictory.phase === 'diceReward') {
      setTimeout(() => {
        let bonusGold = 0;
        game.relics.filter(r => r.trigger === 'on_battle_end').forEach(relic => {
          const res = relic.effect(buildRelicContext({
            game,
            dice,
            targetEnemy: null,
            rerollsThisTurn: 0,
            hasPlayedThisTurn: true,
          }));
          if (res.goldBonus && res.goldBonus > 0) {
            bonusGold += res.goldBonus;
            addToast(` ${relic.name}: +${res.goldBonus}金币`, 'gold');
          }
        });

        const loot = buildLootItems({ game, enemies, allWaveEnemies, bonusGold });
        setGame(prev => ({ ...prev, lootItems: loot }));
      }, 0);
    }
  };

  // ==================== collectLoot ====================
  const collectLoot = (id: string) => {
    playSound('select');
    const item = game.lootItems.find(i => i.id === id);
    if (!item || item.collected) return;

    if (item.type === 'challengeChest') {
      playSound('shop_buy');
    }

    const result = processCollectLoot(game, id);
    if (!result.success) return;

    setGame(result.state);
    result.logs.forEach(log => addLog(log));
    result.toasts.forEach(toast => addToast(toast.message, toast.type, { icon: toast.icon, relicId: toast.relicId }));
  };

  // ==================== finishLoot ====================
  const finishLoot = () => {
    playSound('select');
    const newState = processFinishLoot(game);
    setGame(newState);
  };

  // ==================== pickReward ====================
  const pickReward = (relic: Relic) => {
    setGame(prev => ({
      ...prev,
      relics: [...prev.relics, { ...relic }],
      phase: 'map',
    }));
  };

  // ==================== nextNode ====================
  const nextNode = () => {
    const next = game.currentNode + 1;
    if (next === 4 || next === 9) {
      setGame(prev => ({ ...prev, phase: 'campfire', currentNode: next }));
    } else if (next === 5) {
      const shopItems = generateShopItems(game.relics.map(r => r.id), game.playerClass as ClassId | undefined);
      setGame(prev => ({ ...prev, phase: 'merchant', currentNode: next, shopItems }));
    } else if (next === 7) {
      setGame(prev => ({ ...prev, phase: 'event', currentNode: next }));
    } else {
      lifecycle.startBattle(next);
    }
  };

  return {
    handleVictory,
    collectLoot,
    finishLoot,
    pickReward,
    nextNode,
  };
}

export type BattleVictory = ReturnType<typeof useBattleVictory>;
