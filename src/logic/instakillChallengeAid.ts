/**
 * instakillChallengeAid.ts — 洞察弱点挑战达成后的战斗援助效果
 *
 * 当玩家完成洞察弱点挑战（instakillChallenge）时，随机触发一种援助效果：
 *  1. 全场敌人百分比伤害（25%）
 *  2. 全场敌人HP降至N%（25%）
 *  3. 全场敌人施加灼烧+中毒（25%）
 *  4. 立刻补抽1颗骰子（25%）
 *
 * [2026-05-07] 移除"骰子库全部替换为随机强力骰子"效果（破坏性过强，摧毁玩家构筑）
 *
 * 从 postPlayEffects.ts 拆出 (ARCH-G)
 *
 * [Bug-FIX 2026-05-07] 效果2（血量降至N%）导致战斗流程卡死：
 *   - 旧实现 setTimeout(800ms) 后用闭包 `enemies`（stale）遍历调 setEnemyEffectForUid
 *     800ms 间隙内若单体击杀→checkEnemyDeaths→波次切换已发生，会对已不存在的 uid
 *     触发 effect，造成 framer-motion AnimatePresence 与结算演出冲突卡死。
 *   - 修复：所有异步 setEnemies/setEnemyEffectForUid 均：
 *     (1) 执行前检查 phase === 'battle'（避免在 loot/chapterTransition 写入）
 *     (2) setEnemies 在 prev 回调内计算伤害（prev 保证是最新数组）
 *     (3) 收集本轮实际受影响的 uid 列表后再触发特效
 *     (4) 效果2 增加保底 1HP（避免砍至 0% 意外触发死亡+波次切换竞态）
 */

import type { PostPlayContext } from './postPlayEffects';
import React from 'react';
import { drawFromBag } from '../data/diceBag';
import { applyDiceSpecialEffects } from './diceEffects';
import { hasLimitBreaker } from '../engine/relicQueries';
import { PixelDice } from '../components/PixelIcons';

/** 浮字用的骰子 icon（"获得骰子"类飘字统一入口） */
const diceIcon = () => React.createElement(PixelDice, { size: 1.5 });

/**
 * 检测洞察弱点挑战是否刚完成，若是则随机触发一种战斗援助效果。
 * 应在出牌后效处理中延迟调用（setTimeout 600ms）。
 */
export function triggerInstakillChallengeAid(ctx: PostPlayContext): void {
  const {
    gameRef,
    setGame, setEnemies, setDice,
    addFloatingText, addToast, addLog,
    playSound, setScreenShake, setEnemyEffectForUid,
  } = ctx;

  const currentChallenge = gameRef.current.instakillChallenge;
  if (!(currentChallenge?.completed) || gameRef.current.instakillCompleted) return;

  setGame(prev => ({ ...prev, instakillCompleted: true }));
  playSound('critical');
  setScreenShake(true);
  setTimeout(() => setScreenShake(false), 600);

  // 随机选择一种援助效果
  const g = gameRef.current;
  const currentNode = g.map.find(n => n.id === g.currentNodeId);
  const depth = currentNode?.depth || 0;
  const chapter = g.chapter;
  const isBoss = currentNode?.type === 'boss';

  const aidRoll = Math.random();

  // [Bug-FIX] 统一延迟执行器：执行前校验 phase，避免在战斗结束/波次切换期间修改 enemies
  const scheduleAidEffect = (delay: number, fn: () => void) => {
    setTimeout(() => {
      if (gameRef.current.phase !== 'battle') return;
      fn();
    }, delay);
  };

  if (aidRoll < 0.25) {
    // 效果1：对全场敌人造成大量伤害（基于敌人最大HP的百分比）
    const pct = isBoss ? 0.3 : 0.5;
    const dmgText = `${Math.round(pct * 100)}%`;
    addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`◆ 洞察弱点！全场敌人受到${dmgText}最大生命值伤害`, 'buff');
    addLog(`洞察弱点达成！全场敌人受到${dmgText}最大HP伤害`);
    scheduleAidEffect(800, () => {
      const affected: { uid: string; dmg: number }[] = [];
      setEnemies(prev => prev.map(e => {
        if (e.hp <= 0) return e;
        const dmg = Math.floor(e.maxHp * pct);
        affected.push({ uid: e.uid, dmg });
        const newHp = Math.max(1, e.hp - dmg);
        return { ...e, hp: newHp };
      }));
      // setEnemies 执行后 affected 已填充
      setTimeout(() => {
        if (gameRef.current.phase !== 'battle') return;
        affected.forEach(({ uid, dmg }) => {
          setEnemyEffectForUid(uid, 'hit');
          addFloatingText(`-${dmg}`, 'text-red-500', undefined, 'enemy');
        });
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
      }, 0);
    });
  } else if (aidRoll < 0.5) {
    // 效果2：全场敌人HP降至N%（保底1HP，不杀死）
    const targetPct = isBoss ? 0.5 : 0.35;
    const pctText = `${Math.round(targetPct * 100)}%`;
    addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`◆ 洞察弱点！全场敌人血量降至${pctText}`, 'buff');
    addLog(`洞察弱点达成！全场敌人血量降至${pctText}`);
    scheduleAidEffect(800, () => {
      // [Bug-FIX v2 2026-05-08] 先计算 affectedUids，再 setEnemies。
      // 原来 setEnemies callback 里 push affectedUids，setTimeout(0) 时 callback 还没执行，导致 affectedUids 为空。
      if (gameRef.current.phase !== 'battle') return;
      const currentEnemies = gameRef.current; // 仅用于类型推导，实际读 setEnemies prev
      const preCalcAffected: string[] = [];
      setEnemies(prev => {
        // 重置（闭包不污染）
        preCalcAffected.length = 0;
        return prev.map(e => {
          if (e.hp <= 0) return e;
          const cap = Math.max(1, Math.floor(e.maxHp * targetPct));
          if (e.hp <= cap) return e;
          preCalcAffected.push(e.uid);
          return { ...e, hp: cap };
        });
      });
      // 16ms 等 React flush，然后用 preCalcAffected 触发特效
      setTimeout(() => {
        if (gameRef.current.phase !== 'battle') return;
        preCalcAffected.forEach(uid => setEnemyEffectForUid(uid, 'hit'));
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
      }, 16);
    });
  } else if (aidRoll < 0.75) {
    // 效果3：全场敌人施加大量灼烧+中毒
    const stacks = 3 + depth + (chapter - 1) * 2;
    addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`◆ 洞察弱点！全场敌人获得${stacks}层灼烧+${stacks}层中毒`, 'buff');
    addLog(`洞察弱点达成！全场敌人获得${stacks}层灼烧和中毒`);
    scheduleAidEffect(800, () => {
      const affectedUids: string[] = [];
      setEnemies(prev => prev.map(e => {
        if (e.hp <= 0) return e;
        affectedUids.push(e.uid);
        const newStatuses = [...(e.statuses || [])];
        const burnIdx = newStatuses.findIndex(s => s.type === 'burn');
        if (burnIdx >= 0) newStatuses[burnIdx] = { ...newStatuses[burnIdx], value: newStatuses[burnIdx].value + stacks };
        else newStatuses.push({ type: 'burn', value: stacks, duration: 99 });
        const poisonIdx = newStatuses.findIndex(s => s.type === 'poison');
        if (poisonIdx >= 0) newStatuses[poisonIdx] = { ...newStatuses[poisonIdx], value: newStatuses[poisonIdx].value + stacks };
        else newStatuses.push({ type: 'poison', value: stacks, duration: 99 });
        return { ...e, statuses: newStatuses };
      }));
      setTimeout(() => {
        if (gameRef.current.phase !== 'battle') return;
        affectedUids.forEach(uid => setEnemyEffectForUid(uid, 'debuff'));
      }, 0);
    });
  } else {
    // 效果4：立刻补抽1颗骰子
    addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`◆ 洞察弱点！立刻补抽1颗骰子！`, 'buff');
    addLog(`洞察弱点达成！立刻补抽1颗骰子`);
    scheduleAidEffect(800, () => {
      const latest = gameRef.current;
      const { drawn, newBag, newDiscard } = drawFromBag(latest.diceBag, latest.discardPile, 1);
      if (drawn.length > 0) {
        setGame(prev => ({ ...prev, diceBag: newBag, discardPile: newDiscard }));
        const newDie = {
          ...drawn[0],
          id: Date.now() + 9000,
          selected: false, spent: false, rolling: false, justAdded: true, isBonusDraw: true,
        };
        const processed = applyDiceSpecialEffects([newDie], { hasLimitBreaker: hasLimitBreaker(latest.relics), lockedElement: latest.lockedElement });
        setDice(prev => [...prev, ...processed.map(d => ({ ...d, justAdded: true }))]);
        setTimeout(() => setDice(pd => pd.map(d => d.justAdded ? { ...d, justAdded: false } : d)), 600);
        addFloatingText(`+1`, 'text-yellow-300', diceIcon(), 'player');
      }
    });
  }
}
