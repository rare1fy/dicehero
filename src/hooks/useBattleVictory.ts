/**
 * useBattleVictory.ts — 战斗胜利 & 战利品处理 Hook
 * 提取自 useBattleCombat.tsx (Round3 补充分片)
 * 包含 handleVictory / collectLoot / finishLoot / pickReward / nextNode
 */
import { startTransition } from 'react';
import type { Relic } from '../types/game';
import { incrementFloorsCleared, tickHourglass } from '../engine/relicUpdates';
import { buildRelicContext } from '../engine/buildRelicContext';
import { playSound } from '../utils/sound';
import { buildLootItems, resolvePostVictoryPhase } from '../logic/lootHandler';
import { processCollectLoot, processFinishLoot } from '../logic/lootProcessor';
import { generateShopItems } from '../logic/shopGenerator';
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
    targetEnemy,
    addLog, addToast,
  } = state;

  // ==================== handleVictory ====================
  const handleVictory = () => {
    if (enemies.length === 0) return;
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

      if (postVictory.phase === 'victory') {
        return {
          ...prev,
          ownedDice: cleanedOwnedDice,
          diceBag: cleanedDiceBag,
          discardPile: cleanedDiscardPile,
          drawCount: cleanedDrawCount,
          tempDrawCountBonus: 0,
          stats: { ...s, bossesWon: postVictory.bossesWon },
          relics: updatedRelics,
          map: newMap,
          phase: 'victory',
          isEnemyTurn: false,
        };
      }

      if (postVictory.phase === 'chapterTransition') {
        return {
          ...prev,
          ownedDice: cleanedOwnedDice,
          diceBag: cleanedDiceBag,
          discardPile: cleanedDiscardPile,
          drawCount: cleanedDrawCount,
          tempDrawCountBonus: 0,
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
        ownedDice: cleanedOwnedDice,
        diceBag: cleanedDiceBag,
        discardPile: cleanedDiscardPile,
        drawCount: cleanedDrawCount,
        tempDrawCountBonus: 0,
        stats: s,
        relics: updatedRelics,
        map: newMap,
        phase: 'diceReward',
        isEnemyTurn: false,
      };
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

    if ((item.type as string) === 'challengeChest') {
      playSound('shop_buy');
    }

    const result = processCollectLoot(game, id);
    if (!result.success) return;

    setGame(result.state);
    result.logs.forEach(log => addLog(log));
    result.toasts.forEach(toast => addToast(toast.message, toast.type));
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
      const shopItems = generateShopItems(game.relics.map(r => r.id));
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
