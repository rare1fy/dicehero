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
import { PixelDice, PixelHeart } from '../components/PixelIcons';
import { emitReward } from './rewardEvents';

/** 奖励类飘字统一金色 */
const REWARD_COLOR = 'text-amber-200';

/** 浮字用的骰子 icon（"获得骰子"类飘字统一入口） */
const diceIcon = () => React.createElement(PixelDice, { size: 1.5 });
const heartIcon = () => React.createElement(PixelHeart, { size: 1.3 });

/**
 * 检测洞察弱点挑战是否刚完成，若是则随机触发一种战斗援助效果。
 * 应在出牌后效处理中延迟调用（setTimeout 600ms）。
 */
export function triggerInstakillChallengeAid(ctx: PostPlayContext): void {
  const {
    gameRef,
    setGame, setEnemies,
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

  // [AID-LOCK 2026-05-09] 优先使用挑战生成时就确定的 aidType；兼容旧存档走 fallback roll
  // [AID-POOL 2026-05-10] 5 种奖励（原 4 种 + 掠夺者印记），各 20%
  const aidType: 1 | 2 | 3 | 4 | 5 =
    currentChallenge.aidType
    ?? (() => {
      return (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
    })();
  setGame(prev => ({ ...prev, instakillAidType: aidType }));

  // [Bug-FIX] 统一延迟执行器：执行前校验 phase，避免在战斗结束/波次切换期间修改 enemies
  const scheduleAidEffect = (delay: number, fn: () => void) => {
    setTimeout(() => {
      if (gameRef.current.phase !== 'battle') return;
      fn();
    }, delay);
  };

  if (aidType === 1) {
    // 效果1：对全场敌人造成大量伤害（基于敌人最大HP的百分比）
    const pct = isBoss ? 0.3 : 0.5;
    const dmgText = `${Math.round(pct * 100)}%`;
    addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`洞察弱点！全场敌人受到${dmgText}最大生命值伤害`, 'buff', { icon: 'star' });
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
          addFloatingText(`-${dmg}`, 'text-red-500', heartIcon(), 'enemy');
        });
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
      }, 0);
    });
  } else if (aidType === 2) {
    // 效果2：全场敌人HP直接砍至当前血量的一半（保底1HP，不杀死）
    // [2026-05-09] 旧版按 maxHp*N% 截断对低血敌人无意义；
    //              改为按 currentHp/2 砍半，即时削弱所有活敌人。
    addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`洞察弱点！全场敌人血量减半`, 'buff', { icon: 'star' });
    addLog(`洞察弱点达成！全场敌人当前生命值减半`);
    scheduleAidEffect(800, () => {
      if (gameRef.current.phase !== 'battle') return;
      const preCalcAffected: { uid: string; cut: number }[] = [];
      setEnemies(prev => {
        preCalcAffected.length = 0;
        return prev.map(e => {
          if (e.hp <= 1) return e;
          const newHp = Math.max(1, Math.floor(e.hp / 2));
          const cut = e.hp - newHp;
          if (cut <= 0) return e;
          preCalcAffected.push({ uid: e.uid, cut });
          return { ...e, hp: newHp };
        });
      });
      setTimeout(() => {
        if (gameRef.current.phase !== 'battle') return;
        preCalcAffected.forEach(({ uid, cut }) => {
          setEnemyEffectForUid(uid, 'hit');
          addFloatingText(`-${cut}`, 'text-red-500', heartIcon(), 'enemy');
        });
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
      }, 16);
    });
  } else if (aidType === 3) {
    // 效果3：全场敌人施加大量灼烧+中毒
    const stacks = 3 + depth + (chapter - 1) * 2;
    addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`洞察弱点！全场敌人获得${stacks}层灼烧+${stacks}层中毒`, 'buff', { icon: 'star' });
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
  } else if (aidType === 4) {
    // [2026-05-10 简化] 战意觉醒：纯粹 +1 手牌上限（本场战斗内，胜利时清零）
    //   原"drawCount>=6 时改为 +50% 伤害"分支移除，行为更一致、玩家预期更清晰
    addFloatingText(`✦ 战意觉醒 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`洞察弱点！本场战斗 +1 手牌上限`, 'buff', { icon: 'star' });
    addLog(`洞察弱点达成！本场战斗 +1 手牌上限`);
    scheduleAidEffect(800, () => {
      setGame(prev => ({
        ...prev,
        // 不直接改 drawCount；改走 challengeDrawBonus，确保战斗结束清零
        // 硬顶 6 张：已达则不再叠加（避免无效飘字）
        challengeDrawBonus: Math.min(6 - (prev.drawCount || 3), (prev.challengeDrawBonus || 0) + 1),
      }));
      addFloatingText(`手牌上限 +1`, REWARD_COLOR, diceIcon(), 'player');
      emitReward('dice', 1);
    });
  } else {
    // [AID-POOL 2026-05-10] 效果5：掠夺者印记 — 立刻回复 25% 最大HP + 立刻获得 30 灵魂金币
    //   一次性爆发型奖励，不增加新系统/持续字段，保持结构简洁
    addFloatingText(`✦ 掠夺者印记 ✦`, 'text-yellow-300', undefined, 'enemy', true);
    addToast(`洞察弱点！回血 + 获得金币`, 'buff', { icon: 'star' });
    addLog(`洞察弱点达成！掠夺者印记：回血 25% 最大生命 + 30 金币`);
    scheduleAidEffect(800, () => {
      setGame(prev => {
        const healAmount = Math.floor(prev.maxHp * 0.25);
        const goldAmount = 30;
        return {
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + healAmount),
          souls: prev.souls + goldAmount,
          stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + goldAmount },
        };
      });
      const gNow2 = gameRef.current;
      const healAmount = Math.floor(gNow2.maxHp * 0.25);
      addFloatingText(`+${healAmount} HP`, REWARD_COLOR, heartIcon(), 'player');
      addFloatingText(`+30 金币`, REWARD_COLOR, undefined, 'player');
      emitReward('heart', healAmount);
      emitReward('gold', 30);
    });
  }
}
