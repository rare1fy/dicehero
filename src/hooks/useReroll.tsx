/**
 * useReroll.tsx — 重投逻辑 Hook
 * 提取自 useBattleCombat.tsx (Round3 补充分片)
 * 包含 rerollSelected + 相关计算属性
 */
import React from 'react';
import { getDiceDef, rollDiceDef } from '../data/dice';
import { drawFromBag } from '../data/diceBag';
import {
  hasLimitBreaker, sumPassiveRelicValue, sumRelicValueByTrigger,
} from '../engine/relicQueries';
import { buildRelicContext } from '../engine/buildRelicContext';
import { FURY_CONFIG } from '../config/gameBalance';
import { applyDiceSpecialEffects } from '../logic/diceEffects';
import { playSound } from '../utils/sound';
import { ELEMENT_NAMES } from '../utils/uiHelpers';
import { getRerollHpCost } from '../logic/rerollCalc';
import { PixelCoin, PixelShield, PixelBloodDrop, PixelHeart } from '../components/PixelIcons';
import { emitReward } from '../logic/rewardEvents';
import type { BattleState } from './useBattleState';

const REWARD_COLOR = 'text-amber-200';

export function useReroll(state: BattleState) {
  const {
    game, setGame,
    dice, setDice,
    enemies,
    rerollCount, setRerollCount,
    targetEnemy,
    setShuffleAnimating,
    setRerollFlash,
    addLog, addToast, addFloatingText,
  } = state;

  // ==================== Reroll 计算属性 ====================
  const effectiveFreeRerollsPerTurn = (game.freeRerollsPerTurn || 1) + (game.boomerangFreeReroll || 0) + (game.comboFreeReroll || 0);
  const currentRerollCost = getRerollHpCost(rerollCount, game.relics, effectiveFreeRerollsPerTurn, game.maxHp, game.playerClass || 'warrior');
  const canReroll = currentRerollCost !== -1;
  const canAffordReroll = canReroll && (currentRerollCost <= 0 || game.hp > currentRerollCost);
  const extraFreeRerollsForDisplay = sumPassiveRelicValue(game.relics, 'extraReroll');
  const freeRerollsRemaining = Math.max(0, effectiveFreeRerollsPerTurn + extraFreeRerollsForDisplay - rerollCount);

  // ==================== rerollSelected ====================
  const rerollSelected = async () => {
    if (game.isEnemyTurn) return;

    const toReroll = dice.filter(d => d.selected && !d.spent);
    if (toReroll.length === 0) {
      addToast('请先选中要重掷的骰子');
      return;
    }

    let hpCost = getRerollHpCost(rerollCount, game.relics, effectiveFreeRerollsPerTurn, game.maxHp, game.playerClass || 'warrior');
    if (hpCost === -1) {
      addToast('免费重投次数已用完', 'info');
      return;
    }
    const hasCursedInReroll = toReroll.some(d => getDiceDef(d.diceDefId).isCursed);
    if (hasCursedInReroll) hpCost *= 2;
    if (hpCost > 0 && game.hp <= hpCost) {
      addToast(`生命不足！重掷需要 ${hpCost} HP`, 'damage');
      setRerollFlash(true);
      setTimeout(() => setRerollFlash(false), 500);
      return;
    }

    // === on_reroll 遗物触发 ===
    const isBloodReroll = hpCost > 0;
    const rerollCtx = buildRelicContext({
      game, dice, targetEnemy: enemies.find(e => e.hp > 0) || null,
      rerollsThisTurn: rerollCount, hasPlayedThisTurn: game.playsLeft < game.maxPlays,
      isBloodReroll,
    });
    let onRerollGoldBonus = 0;
    let onRerollArmor = 0;
    game.relics.filter(r => r.trigger === 'on_reroll').forEach(r => {
      const res = r.effect(rerollCtx);
      if (r.id === 'black_market_contract' && game.blackMarketUsedThisTurn) return;
      if (res.goldBonus) onRerollGoldBonus += res.goldBonus;
      if (res.armor) onRerollArmor += res.armor;
    });

    // Apply HP cost + 战士血怒叠加
    if (isBloodReroll) {
      const currentFuryStacks = game.bloodRerollCount || 0;
      const atCap = currentFuryStacks >= FURY_CONFIG.maxStack;
      const capArmor = atCap ? FURY_CONFIG.armorAtCap : 0;
      setGame(prev => {
        const newBloodRerolls = Math.min((prev.bloodRerollCount || 0) + 1, FURY_CONFIG.maxStack);
        return { ...prev, hp: prev.hp - hpCost, bloodRerollCount: newBloodRerolls, souls: prev.souls + onRerollGoldBonus, armor: prev.armor + onRerollArmor + capArmor, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + onRerollGoldBonus }, blackMarketUsedThisTurn: onRerollGoldBonus > 0 ? true : prev.blackMarketUsedThisTurn };
      });
      addFloatingText(`-${hpCost}`, 'text-red-500', <PixelHeart size={1.3} />, 'player');
      if (atCap) {
        addFloatingText(`血怒满层: +${FURY_CONFIG.armorAtCap}`, REWARD_COLOR, <PixelShield size={1.5} />, 'player');
        emitReward('armor', FURY_CONFIG.armorAtCap);
      } else {
        addFloatingText(`血怒 +${Math.round(FURY_CONFIG.damagePerStack * 100)}%`, 'text-orange-400', <PixelBloodDrop size={1.5} />, 'player');
        emitReward('fury', 1);
      }
      if (onRerollGoldBonus > 0) {
        setTimeout(() => {
          addFloatingText(`黑市契约: +${onRerollGoldBonus}`, REWARD_COLOR, <PixelCoin size={2} />, 'player');
          emitReward('gold', onRerollGoldBonus);
        }, 300);
      }
      if (onRerollArmor > 0) {
        addFloatingText(`重投护甲: +${onRerollArmor}`, REWARD_COLOR, <PixelShield size={1.5} />, 'player');
        emitReward('armor', onRerollArmor);
      }
      const displayStacks = Math.min(currentFuryStacks + 1, FURY_CONFIG.maxStack);
      addLog(`嗜血消耗 ${hpCost} HP（血怒${displayStacks}/${FURY_CONFIG.maxStack}层，+${Math.round(displayStacks * FURY_CONFIG.damagePerStack * 100)}%伤害）`);
    } else {
      if (onRerollArmor > 0 || onRerollGoldBonus > 0) {
        setGame(prev => ({
          ...prev,
          armor: prev.armor + onRerollArmor,
          souls: prev.souls + onRerollGoldBonus,
          stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + onRerollGoldBonus },
          blackMarketUsedThisTurn: onRerollGoldBonus > 0 ? true : prev.blackMarketUsedThisTurn,
        }));
        if (onRerollArmor > 0) {
          addFloatingText(`重投护甲: +${onRerollArmor}`, REWARD_COLOR, <PixelShield size={1.5} />, 'player');
          emitReward('armor', onRerollArmor);
        }
        if (onRerollGoldBonus > 0) {
          addFloatingText(`黑市契约: +${onRerollGoldBonus}`, REWARD_COLOR, <PixelCoin size={2} />, 'player');
          emitReward('gold', onRerollGoldBonus);
        }
      }
    }

    playSound('roll');
    const rerollIds = new Set(toReroll.map(d => d.id));
    setDice(prev => prev.map(d => rerollIds.has(d.id) ? { ...d, selected: false, rolling: true } : d));

    // 快速翻滚动画
    const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
    for (let i = 0; i < frameTimes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[i]));
      setDice(prev => prev.map(d => {
        if (!rerollIds.has(d.id)) return d;
        const def = getDiceDef(d.diceDefId);
        const elems = ['fire', 'ice', 'thunder', 'poison', 'holy'] as const;
        const randElem = def.isElemental ? elems[Math.floor(Math.random() * elems.length)] : d.element;
        return { ...d, value: rollDiceDef(def), element: randElem };
      }));
    }

    // 落定：弃骰抽新
    // [2026-05-08] 暗影残骰重投规则恢复原地 reroll：
    //   规则：残骰 reroll 只能原地重掷点数（1-6 均匀），禁止替换为其他骰子。
    //   原因：过牌机制让盗贼过强，刘叔反馈取消。
    const normalRerollDefIds = toReroll.filter(d => !d.isTemp).map(d => d.diceDefId);
    const tempRerolls = toReroll.filter(d => d.isTemp);
    const tempIds = new Set(tempRerolls.map(d => d.id));

    // 残骰不参与 bag 抽卡，只抽正常骰子量
    const newDiscard = [...game.discardPile, ...normalRerollDefIds];
    const { drawn, newBag, newDiscard: finalDiscard, shuffled } = drawFromBag(game.diceBag, newDiscard, normalRerollDefIds.length);
    if (shuffled) {
      setShuffleAnimating(true);
      setTimeout(() => setShuffleAnimating(false), 800);
      addToast('弃骰库洗回骰子库', 'info', { icon: 'shuffle' });
    }

    // 同步设置游戏状态和骰子状态，避免 setTimeout(0) 导致的中间帧闪烁
    setGame(prev => ({
      ...prev,
      diceBag: newBag,
      discardPile: finalDiscard,
    }));

    // 混沌骰面: 每回合第一次重投时，所有手中骰子点数+1（6不变）
    const chaosBoost = sumPassiveRelicValue(game.relics, 'rerollPointBoost');
    const isFirstReroll = rerollCount === 0;

    setDice(prevDice => {
      let drawIdx = 0;
      const newDice = prevDice.map(d => {
        if (!rerollIds.has(d.id)) return { ...d, rolling: false };
        // [2026-05-08] 残骰原地 reroll 点数，保持残骰身份不变
        if (tempIds.has(d.id)) {
          const def = getDiceDef(d.diceDefId);
          return {
            ...d,
            value: rollDiceDef(def),
            rolling: false,
            selected: false,
          };
        }
        // 正常骰子从 drawn 池替换
        if (drawIdx < drawn.length) {
          const newDie = drawn[drawIdx];
          drawIdx++;
          return {
            ...newDie,
            id: d.id,
            rolling: false,
            selected: false,
            isTemp: false,
            isShadowRemnant: false,
            shadowRemnantPersistent: false,
            shadowRemnantSurvived: false,
          };
        }
        return { ...d, rolling: false, selected: false };
      });

      // 混沌骰面: 首次重投时对所有非spent骰子+1（6不变）
      const boostedDice = (chaosBoost > 0 && isFirstReroll)
        ? newDice.map(d => (d.spent || d.value >= 6) ? d : { ...d, value: d.value + chaosBoost })
        : newDice;

      const result = applyDiceSpecialEffects(boostedDice, { hasLimitBreaker: hasLimitBreaker(game.relics), lockedElement: game.lockedElement });
      addLog(`重掷结果: ${result.filter(nd => rerollIds.has(nd.id)).map(nd => `${nd.value}(${ELEMENT_NAMES[nd.element]})`).join(', ')}`);
      return result;
    });

    // 混沌骰面浮动文本（仅在有骰子实际被boost时显示）
    if (chaosBoost > 0 && isFirstReroll) {
      const hasBoostedDie = dice.some(d => !d.spent && d.value < 6);
      if (hasBoostedDie) {
        addFloatingText(`混沌骰面: 全体+${chaosBoost}`, 'text-purple-400', undefined, 'player');
      }
    }

    playSound('dice_lock');

    // 狂掷风暴：免费重投不消耗次数
    const freeChance = sumRelicValueByTrigger(game.relics, 'on_reroll', 'freeRerollChance');
    const isFreeReroll = (getRerollHpCost(rerollCount, game.relics, effectiveFreeRerollsPerTurn, game.maxHp, game.playerClass || 'warrior') <= 0);
    if (freeChance > 0 && isFreeReroll && Math.random() < freeChance) {
      addFloatingText('幸运！免费次数保留', 'text-yellow-300', undefined, 'player');
    } else {
      setRerollCount(prev => prev + 1);
    }
    setGame(prev => ({
      ...prev, rerollsThisWave: (prev.rerollsThisWave || 0) + 1
    }));
  };

  return {
    currentRerollCost,
    canReroll,
    canAffordReroll,
    freeRerollsRemaining,
    rerollSelected,
  };
}

export type RerollReturn = ReturnType<typeof useReroll>;
