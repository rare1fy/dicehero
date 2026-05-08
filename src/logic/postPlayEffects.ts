/**
* postPlayEffects.ts — 出牌后效处理
* checkEnemyDeaths 已提取到 checkEnemyDeathsModule.ts
* instakillChallengeAid 已提取到 instakillChallengeAid.ts (ARCH-G)
* ARCH-F Round2 模块拆分
*/

import React from 'react';
import type { Die, GameState, Enemy, HandResult, DiceElement } from '../types/game';
import type { ExpectedOutcomeResult } from './expectedOutcomeTypes';
import type { EnemyQuotes } from '../config/enemies';
import { getDiceDef, rollDiceDef } from '../data/dice';
import { drawFromBag } from '../data/diceBag';
import { applyDiceSpecialEffects } from './diceEffects';
import { hasOverflowConduit, hasLimitBreaker } from '../engine/relicQueries';
import { triggerInstakillChallengeAid } from './instakillChallengeAid';
import { buildRelicContext } from '../engine/buildRelicContext';
import { checkHands } from '../utils/handEvaluator';
import { checkChallenge } from '../utils/instakillChallenge';
import { STATUS_INFO } from '../data/statusInfo';
import { rollKillXp, applyXpGain } from './xpSystem';
import { emitXpKill } from './xpEvents';
import { emitSoulGain } from './soulEvents';
import { PixelRefresh, PixelDice, PixelCards, PixelHeart } from '../components/PixelIcons';
import { emitReward } from './rewardEvents';

// 浮字 icon 工厂（统一 size=1.5）
const rerollIcon = () => React.createElement(PixelRefresh, { size: 1.5 });
const diceIcon = () => React.createElement(PixelDice, { size: 1.5 });
const cardsIcon = () => React.createElement(PixelCards, { size: 1.5 });
const heartIcon = () => React.createElement(PixelHeart, { size: 1.5 });
/** 统一奖励类飘字颜色：金色，和扣血红/扣盾蓝区分开 */
const REWARD_COLOR = 'text-amber-200';

// --- Context 接口 ---

export interface PostPlayContext {
  game: GameState;
  gameRef: React.MutableRefObject<GameState>;
  enemies: Enemy[];
  dice: Die[];
  selected: Die[];
  settleDice: Die[];
  outcome: ExpectedOutcomeResult;
  targetEnemy: Enemy;
  hasAoe: boolean;
  isElementalAoe: boolean;
  targetUid: string;
  finalEnemyHp: number;
  currentCombo: number;
  bestHand: string;
  rerollCount: number;
  straightUpgrade: number;

  // Callbacks
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>;
  setDice: React.Dispatch<React.SetStateAction<Die[]>>;
  setRerollCount: React.Dispatch<React.SetStateAction<number>>;
  addFloatingText: (text: string, color: string, icon?: React.ReactNode, target?: string, persistent?: boolean) => void;
  addToast: (msg: string, type?: string, options?: { icon?: 'gold' | 'dice' | 'relic' | 'remove' | 'check' | 'star' | 'shuffle'; relicId?: string }) => void;
  addLog: (msg: string) => void;
  playSound: (id: string) => void;
  setScreenShake: React.Dispatch<React.SetStateAction<boolean>>;
  setEnemyEffectForUid: (uid: string, effect: string | null) => void;
  showEnemyQuote: (uid: string, text: string, duration: number) => void;
  getEnemyQuotes: (configId: string) => EnemyQuotes | undefined;
  pickQuote: (quotes?: string[]) => string | undefined;
  setBossEntrance: React.Dispatch<React.SetStateAction<{ visible: boolean; name: string; chapter: number }>>;
  setEnemyEffects: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  setDyingEnemies: React.Dispatch<React.SetStateAction<Set<string>>>;
  setEnemyQuotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setEnemyQuotedLowHp: React.Dispatch<React.SetStateAction<Set<string>>>;
  setWaveAnnouncement: React.Dispatch<React.SetStateAction<number | null>>;
  rollAllDice: (forceResetHand?: boolean) => Promise<void>;
  handleVictory: () => void;
}

// --- 同步部分：出牌后效处理 ---
export function executePostPlayEffects(ctx: PostPlayContext): void {
  const {
    game, gameRef, enemies, dice, selected, settleDice, outcome,
    targetEnemy, hasAoe, isElementalAoe, targetUid, finalEnemyHp,
    currentCombo, bestHand, rerollCount, straightUpgrade,
    setGame, setEnemies, setDice, setRerollCount,
    addFloatingText, addToast, addLog, playSound,
    setScreenShake, setEnemyEffectForUid, showEnemyQuote, getEnemyQuotes, pickQuote,
  } = ctx;

  // Track kills for war_profiteer_relic
  const killCount = enemies.filter(e => e.hp <= 0).length;
  if (killCount > 0) {
    setGame(prev => ({ ...prev, enemiesKilledThisBattle: (prev.enemiesKilledThisBattle || 0) + killCount }));
  }

  // ===== 经验值增益：按当前节点类型给奖励 =====
  const killedUids: string[] = hasAoe
    ? enemies.filter(e => {
        let dmg = outcome.damage; let arm = e.armor;
        if (outcome.armorBreak) arm = 0;
        if (arm > 0) dmg = Math.max(0, dmg - arm);
        return e.hp > 0 && (e.hp - dmg) <= 0;
      }).map(e => e.uid)
    : (finalEnemyHp <= 0 ? [targetUid] : []);

  if (killedUids.length > 0) {
    const currentNode = game.map.find(n => n.id === game.currentNodeId);
    // 每只敌人随机掉落 XP（刘叔 2026-05-08：不再固定值，给随机区间）
    const xpMult = 1 + (game.levelXpBonus || 0);
    const perKillRolled: number[] = killedUids.map(() => Math.max(1, Math.round(rollKillXp(currentNode?.type) * xpMult)));
    const xpGain = perKillRolled.reduce((s, v) => s + v, 0);

    // 1) 派发"爆经验碎片"事件：一只敌人一个事件，XpShardLayer 读 DOM 位置
    const now = Date.now();
    killedUids.forEach((uid, i) => {
      emitXpKill({ enemyUid: uid, xp: perKillRolled[i], at: now + i });
    });

    // 2) 更新 GameState 的 level / xp / xpToNext；升级立即入 pendingLevelUps。
    //    [LEVEL-PAUSE 2026-05-08 v2] 刘叔原意：升级立即暂停战斗、等死亡动画完才弹窗。
    //    入队时刻就是"击杀发生时刻"；真正弹窗时刻由 LevelUpModal 订阅 pendingLevelUps 决定；
    //    死亡动画等待在 checkEnemyDeaths 的 enemyDeathCleanupDelay 里。
    //    checkEnemyDeaths 会在 2200ms 后继续等 pendingLevelUps 清空才推进胜利/波次切换。
    setGame(prev => {
      const r = applyXpGain(prev, xpGain);
      const nextQueue = [...(prev.pendingLevelUps || []), ...r.levelsGained];
      return {
        ...prev,
        level: r.level,
        xp: r.xp,
        xpToNext: r.xpToNext,
        lastXpGain: xpGain,
        lastXpGainAt: now,
        pendingLevelUps: nextQueue,
      };
    });
  }

  // on_kill 遗物效果：检查是否有敌人被击杀（Pre-compute killed enemies synchronously，避免 stale closure）
  const killedEnemiesData: Array<{uid: string, overkill: number}> = [];
  if (hasAoe) {
    enemies.filter(e => e.hp > 0).forEach(e => {
      let dmg = outcome.damage;
      let arm = e.armor;
      if (outcome.armorBreak) { arm = 0; }
      if (arm > 0) { dmg = Math.max(0, dmg - arm); }
      const newHp = e.hp - dmg;
      if (newHp <= 0) { killedEnemiesData.push({ uid: e.uid, overkill: Math.abs(newHp) }); }
    });
  } else {
    if (finalEnemyHp <= 0) {
      killedEnemiesData.push({ uid: targetUid, overkill: Math.abs(finalEnemyHp) });
    }
  }
  // === 洞察弱点检测（使用结算演出后的最终数据） ===
  const finalHandResult = checkHands(settleDice, { straightUpgrade });
  const totalDiceInHand = dice.filter(d => !d.spent).length;
  setGame(prev => {
    const newPlaysWave = (prev.playsThisWave || 0) + 1;
    let challenge = prev.instakillChallenge;
    if (challenge && !challenge.completed) {
      challenge = checkChallenge(challenge, {
        selectedDice: settleDice,
        activeHands: finalHandResult.activeHands,
        pointSum: outcome.X,
        rerollsUsedSinceLastPlay: prev.rerollsThisWave || 0,
        totalDiceInHand: totalDiceInHand,
        ownedDiceTypes: [...new Set<string>(prev.ownedDice.map(d => d.defId))],
        killedThisPlay: killedEnemiesData.length,
      });
    }
    return { ...prev, playsThisWave: newPlaysWave, instakillChallenge: challenge, rerollsThisWave: 0 };
  });

  // 洞察弱点进度提示（在state更新后检测）
  setTimeout(() => {
    const g = gameRef.current;
    const ch = g.instakillChallenge;
    if (ch && !ch.completed && ch.progress && ch.progress > 0 && ch.value && ch.value > 0) {
      addFloatingText(`◆ ${ch.progress}/${ch.value}`, 'text-[var(--pixel-gold)]', undefined, 'enemy');
      playSound('coin');
      // 敌人受击反馈：轻微震动
      enemies.filter(e => e.hp > 0).forEach(e => {
        setEnemyEffectForUid(e.uid, 'shake');
        setTimeout(() => setEnemyEffectForUid(e.uid, null), 300);
      });
    }
  }, 400);

  // 检测挑战达成 → 触发战斗援助效果（已提取到 instakillChallengeAid.ts）
  setTimeout(() => triggerInstakillChallengeAid(ctx), 600);

  setTimeout(() => {
    // Use pre-computed kill data instead of stale enemies closure
    if (killedEnemiesData.length > 0) {
      game.relics.filter(r => r.trigger === 'on_kill').forEach(relic => {
        killedEnemiesData.forEach(killedData => {
          const overkill = killedData.overkill;
          const killCtx = buildRelicContext({ game, dice, targetEnemy: enemies.find(e => e.hp > 0) || null, rerollsThisTurn: rerollCount, hasPlayedThisTurn: true, overkillDamage: overkill });
          const res = relic.effect(killCtx);
          if (res.heal && res.heal > 0) {
            setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + res.heal) }));
            addToast(` ${relic.name}: +${res.heal}HP`, 'heal');
          }
          if (res.grantExtraPlay) {
            setGame(prev => ({ ...prev, relicTempExtraPlay: (prev.relicTempExtraPlay || 0) + res.grantExtraPlay }));
            addToast(`${relic.name}: 下回合+${res.grantExtraPlay}出牌`, 'buff');
          }
          if (res.grantFreeReroll) {
            setRerollCount(prev => Math.max(0, prev - res.grantFreeReroll));
            addToast(`${relic.name}: +${res.grantFreeReroll} 重投`, 'buff');
          }
        });
      });

          // 溢出导管: 溢出伤害转移给随机敌人
          if (hasOverflowConduit(game.relics)) {
            killedEnemiesData.forEach(killedData => {
              const overkill = killedData.overkill;
              if (overkill > 0) {
                const aliveOthers = enemies.filter(e => e.hp > 0 && e.uid !== killedData.uid);
                if (aliveOthers.length > 0) {
                  const target = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
                  setEnemies(prev => prev.map(e => e.uid === target.uid ? { ...e, hp: Math.max(0, e.hp - overkill) } : e));
                  addLog(' 溢出导管: ' + overkill + ' 点溢出伤害转移给 ' + target.name + '!');
                  addFloatingText('-' + overkill, 'text-orange-400', null, 'enemy');
                  playSound('hit');
                }
              }
            });
          }
    }
  }, 300);

  // 魂晶获取：击杀敌人时，溢出伤害×当前倍率×系数=魂晶（同步执行，不在setTimeout中）
  if (killedEnemiesData.length > 0) {
    const currentNode = game.map.find(n => n.id === game.currentNodeId);
    const currentDepth = currentNode?.depth || 0;
    const depthMult = game.soulCrystalMultiplier + currentDepth * 0.1 + (game.levelSoulBonus || 0);
    let totalSoulGain = 0;
    const perEnemyGain: Array<{ uid: string; gain: number }> = [];
    killedEnemiesData.forEach(killedData => {
      if (killedData.overkill > 0) {
        const enemy = enemies.find(e => e.uid === killedData.uid);
        const cappedOverkill = Math.min(killedData.overkill, enemy?.maxHp || 50);
        // 降低基础系数：0.5→0.15，通过商店涨价控制产销比
        const gain = Math.max(1, Math.ceil(cappedOverkill * depthMult * 0.15));
        perEnemyGain.push({ uid: killedData.uid, gain });
        totalSoulGain += gain;
      }
    });
    if (totalSoulGain > 0) {
      setGame(prev => ({
        ...prev,
        blackMarketQuota: (prev.blackMarketQuota || 0) + totalSoulGain,
        totalOverkillThisRun: (prev.totalOverkillThisRun || 0) + totalSoulGain,
      }));
      // [SOUL-SHARD 2026-05-08] 改为魂晶碎片从敌人位置飞向顶栏魂晶 badge，
      //   不再用 addFloatingText('player') 让飘字叠在玩家头上与 XP 碎片混淆。
      const now = Date.now();
      perEnemyGain.forEach((e, i) => {
        emitSoulGain({ enemyUid: e.uid, amount: e.gain, at: now + i });
      });
      addToast(`+${totalSoulGain} 魂晶 (${Math.round(depthMult * 100)}%倍率)`, 'buff');
    }
  }

  // Mark dice as spent & add to discard pile
  const selectedDiceForSpent = dice.filter(d => d.selected && !d.spent);
  // [Bug-FIX 2026-05-08] 飞刀/回旋等"弹回"骰子不消耗不丢弃，必须排除出 spentDefIds
  //   否则 discardPile 会多出一个 defId，下次洗牌时手牌保留 + 牌库多一颗，造成"凭空多出一颗"的现象。
  const isBouncing = (d: Die): boolean => {
    const def = getDiceDef(d.diceDefId);
    if (def.onPlay?.bounceAndGrow && (d.bounceGrowCount || 0) < 3) return true;
    if (def.onPlay?.boomerangPlay && !d.boomerangUsed) return true;
    return false;
  };
  const spentDefIds = selectedDiceForSpent
    .filter(d => !d.isTemp && d.diceDefId !== 'temp_rogue' && !isBouncing(d))
    .map(d => d.diceDefId);
  // 盗贼骰子补充：检查 grantShadowDie（只补1颗）
  let tempDieToGrant: Die | null = null;
  if (game.playerClass === 'rogue') {
    const hasTempGrant = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.grantShadowDie);
    if (hasTempGrant && !tempDieToGrant) {
      tempDieToGrant = {
        id: Date.now() + 8000,
        diceDefId: 'temp_rogue',
        value: rollDiceDef(getDiceDef('temp_rogue')), // Bug-1: 走正常面值逻辑(faces:[1,1,2,2,3,3])
        element: 'normal' as DiceElement,
        selected: false,
        spent: false,
        rolling: false,
        isTemp: true, // 临时暗影残骰
        isShadowRemnant: true, // 暗影残骰标记
      };
    }
  }

  // === 暗影残骰连击奖励逻辑 ===
  const currentComboForShadow = game.comboCount || 0;
  // [Bug-23] 检查是否还有存活敌人——所有敌人已死时不再给额外出牌/补骰
  // [Bug-FIX 2026-05-07] 用本次出牌结果（finalEnemyHp/hasAoe）修正目标敌人状态：
  //   之前 `enemies` 是 playHand 时的闭包快照（applyDamageToEnemies 前），
  //   会把"这次击杀目标"误判为仍存活，导致 grantExtraPlay 错误 +1，
  //   进而引发"切波次后 playsLeft=2"等异常。
  const hasAliveEnemies = enemies.some(e => {
    if (e.uid === targetUid) return finalEnemyHp > 0;
    // AOE 情况：其他敌人也可能被本次伤害击杀；非 AOE 时保持原 hp 判定
    if (hasAoe) return (e.hp - outcome.damage) > 0;
    return e.hp > 0;
  });
  if (game.playerClass === 'rogue' && currentComboForShadow >= 1) {
    // comboPersistShadow: 连击心得 — 连击时暗影残骰变为持久型（跨回合保留）
    const hasComboPersist = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.comboPersistShadow);
    if (hasComboPersist && tempDieToGrant) {
      tempDieToGrant.shadowRemnantPersistent = true;
      addFloatingText('连击心得: 残骰持久化!', 'text-green-400', undefined, 'player');
    }
    // comboGrantPlay: 袖箭连击 — 连击时+1出牌机会
    const hasComboPlay = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.comboGrantPlay);
    if (hasComboPlay && hasAliveEnemies) {
      setGame(prev => ({ ...prev, playsLeft: prev.playsLeft + 1 }));
      const cpDie = selectedDiceForSpent.find(d => getDiceDef(d.diceDefId).onPlay?.comboGrantPlay)!;
      addFloatingText(`${getDiceDef(cpDie.diceDefId).name}: +1`, REWARD_COLOR, cardsIcon(), 'player');
      emitReward('card', 1);
    }
  }

  // === 接应骰子：从骰子库补抽正式骰子 ===
  const bagDrawCount = selectedDiceForSpent.reduce((sum, d) => {
    const def = getDiceDef(d.diceDefId);
    return sum + (def.onPlay?.drawFromBag || 0);
  }, 0);
  if (bagDrawCount > 0) {
    setTimeout(() => {
      const g = gameRef.current;
      const { drawn, newBag, newDiscard, shuffled } = drawFromBag(g.diceBag, g.discardPile, bagDrawCount);
    if (shuffled) { addToast('弃骰库洗回骰子库', 'info', { icon: 'shuffle' }); }
      setGame(prev => ({ ...prev, diceBag: newBag, discardPile: newDiscard }));
      const newDice: Die[] = drawn.map(d => ({
        ...d,
        id: Date.now() + Math.floor(Math.random() * 10000),
        rolling: false, selected: false, spent: false, justAdded: true, isBonusDraw: true,
      }));
      const processed = applyDiceSpecialEffects(newDice, { hasLimitBreaker: hasLimitBreaker(g.relics), lockedElement: g.lockedElement });
      setDice(pd => [...pd, ...processed.map(d => ({ ...d, justAdded: true }))]);
      setTimeout(() => setDice(pd => pd.map(d => d.justAdded ? { ...d, justAdded: false } : d)), 600);
      const sourceDie = selectedDiceForSpent.find(d => (getDiceDef(d.diceDefId).onPlay?.drawFromBag || 0) > 0);
      const sourceName = sourceDie ? getDiceDef(sourceDie.diceDefId).name : '接应';
      addFloatingText(`${sourceName}: +${bagDrawCount}`, REWARD_COLOR, diceIcon(), 'player');
      emitReward('dice', bagDrawCount);
    }, 300);
  }
  
  setDice(prev => prev.map(d => {
    if (!d.selected) return d;
    const def = getDiceDef(d.diceDefId);
    // bounceAndGrow: 飞刀骰子出牌后弹回，点数+1（上限+3）
    if (def.onPlay?.bounceAndGrow) {
      const growCount = (d.bounceGrowCount || 0);
      if (growCount < 3) {
        return { ...d, selected: false, playing: false, spent: false, value: Math.min(6, d.value + 1), bounceGrowCount: growCount + 1 };
      }
      // 超过3次后正常消耗
    }
    // boomerangPlay: 回旋骰子 — 首次出牌弹回，同时标记给一次免费重投
    if (def.onPlay?.boomerangPlay && !(d.boomerangUsed)) {
      // 标记已用过本回合弹回，免费重投由 boomerangFreeReroll 处理
      return { ...d, selected: false, playing: false, spent: false, boomerangUsed: true };
    }
    return { ...d, spent: true, selected: false, playing: false };
  }));
  
  // grantExtraPlay: 影舞骰子给予额外出牌机会
  const hasExtraPlay = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.grantExtraPlay);
  if (hasExtraPlay && hasAliveEnemies) {
    setGame(prev => ({ ...prev, playsLeft: prev.playsLeft + 1 }));
    const epDie = selectedDiceForSpent.find(d => getDiceDef(d.diceDefId).onPlay?.grantExtraPlay)!;
    addFloatingText(`${getDiceDef(epDie.diceDefId).name}: +1`, REWARD_COLOR, cardsIcon(), 'player');
    emitReward('card', 1);
  }

  // [Bug-11] 魔法手套：打出对子时下回合临时+1手牌（触发后1次出牌冷却）
  // 从 expectedOutcomeCalc 移到此处，确保只在实际出牌时应用 tempDrawBonus，
  // 避免预览阶段切换牌型时 tempDrawBonus 残留到非对子牌型
  const gloveRelic = game.relics.find(r => r.id === 'extra_hand_slot');
  if (gloveRelic) {
    const gloveCounter = gloveRelic.counter || 0;
    if (bestHand === '对子' && gloveCounter === 0) {
      // 触发：对子牌型 + 冷却就绪 → 下回合+1手牌 + 进入冷却
      setGame(prev => ({
        ...prev,
        relicTempDrawBonus: (prev.relicTempDrawBonus || 0) + 1,
        relics: prev.relics.map(r => r.id === 'extra_hand_slot' ? { ...r, counter: 1 } : r),
      }));
      addFloatingText(`${gloveRelic.name}: +1`, REWARD_COLOR, cardsIcon(), 'player');
      emitReward('card', 1);
    } else if (gloveCounter > 0) {
      // 冷却中：每次出牌递减冷却计数
      setGame(prev => ({
        ...prev,
        relics: prev.relics.map(r => r.id === 'extra_hand_slot' ? { ...r, counter: Math.max(0, (r.counter || 0) - 1) } : r),
      }));
    }
  }

  // grantPlayOnThird: 三连闪 — 第3次出牌时+1出牌机会
  if ((game.comboCount || 0) >= 2 && hasAliveEnemies) {
    const hasPlayOnThird = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.grantPlayOnThird);
    if (hasPlayOnThird) {
      setGame(prev => ({ ...prev, playsLeft: prev.playsLeft + 1 }));
      const ptDie = selectedDiceForSpent.find(d => getDiceDef(d.diceDefId).onPlay?.grantPlayOnThird)!;
      addFloatingText(`${getDiceDef(ptDie.diceDefId).name}: +1`, REWARD_COLOR, cardsIcon(), 'player');
      emitReward('card', 1);
    }
  }

  // grantTempDieFixed: 连击心得 — 每颗立即补1颗临时骰子（面值从faces随机取）
  const tempDieFixedDice = selectedDiceForSpent.filter(d => getDiceDef(d.diceDefId).onPlay?.grantTempDieFixed);
  if (tempDieFixedDice.length > 0) {
    const newTempDice = tempDieFixedDice.map((d, idx) => {
      const faces = getDiceDef(d.diceDefId).onPlay!.grantTempDieFixed!;
      const val = faces[Math.floor(Math.random() * faces.length)];
      return {
        id: Date.now() + 9000 + idx,
        diceDefId: 'r_combomastery',
        value: val,
        element: 'normal' as DiceElement,
        selected: false, spent: false, rolling: false,
        isTemp: true,
      };
    });
    setDice(prev => [...prev, ...newTempDice]);
    const tDie = tempDieFixedDice[0];
    addFloatingText(`${getDiceDef(tDie.diceDefId).name}: +${tempDieFixedDice.length}`, REWARD_COLOR, diceIcon(), 'player');
    emitReward('dice', tempDieFixedDice.length);
  }

  // boomerangPlay: 回旋骰子弹回时，给一次免费重投
  // 注意：必须用骰子定义的 boomerangPlay 属性 + 原始 boomerangUsed 状态判断，
  // 因为 selectedDiceForSpent 是 setDice 之前的快照，boomerangUsed 在本次 setDice 中才设为 true
  const hasBoomerangJustBounced = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.boomerangPlay && !d.boomerangUsed);
  if (hasBoomerangJustBounced && hasAliveEnemies) {
    setGame(prev => ({ ...prev, boomerangFreeReroll: (prev.boomerangFreeReroll || 0) + 1 }));
    const bDie = selectedDiceForSpent.find(d => getDiceDef(d.diceDefId).onPlay?.boomerangPlay)!;
    addFloatingText(`${getDiceDef(bDie.diceDefId).name}: +1`, REWARD_COLOR, rerollIcon(), 'player');
    emitReward('reroll', 1);
  }

  // doublePoisonOnCombo: 蚀骨毒液 — 连击时目标毒层翻倍
  if (currentCombo >= 1 && targetUid) {
    const hasDoublePoison = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.doublePoisonOnCombo);
    if (hasDoublePoison) {
      setEnemies(prev => prev.map(e => {
        if (e.uid !== targetUid) return e;
        const poison = e.statuses.find(s => s.type === 'poison');
        if (!poison || poison.value <= 0) return e;
        const doubled = poison.value * 2;
        addFloatingText(`蚀骨连击: 毒层翻倍(${doubled})`, 'text-green-500', undefined, 'enemy');
        return { ...e, statuses: e.statuses.map(s => s.type === 'poison' ? { ...s, value: doubled, duration: Math.max(s.duration || 2, 1) } : s) };
      }));
    }
  }

  // shadowClonePlay: 影分身 — 延迟显示伤害文本（伤害已在 damageApplication 中同步应用）
  const hasShadowClone = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.shadowClonePlay);
  if (hasShadowClone && outcome.damage > 0) {
    const cloneDmg = Math.floor(outcome.damage * 0.5);
    if (cloneDmg > 0) {
      setTimeout(() => {
        addFloatingText(`影分身: ${cloneDmg}伤害`, 'text-purple-400', undefined, 'enemy');
      }, 400);
    }
  }
  
  // maxHpBonus / maxHpBonusEvery: 生命熔炉永久+maxHP
  selectedDiceForSpent.forEach(d => {
    const def = getDiceDef(d.diceDefId);
    if (def.onPlay?.maxHpBonusEvery) {
      // 每N次出牌才触发
      const every = def.onPlay.maxHpBonusEvery;
      setGame(prev => {
        const cnt = (prev.lifefurnaceCounter || 0) + 1;
        if (cnt >= every) {
          addFloatingText(`${def.name}: +5`, REWARD_COLOR, heartIcon(), 'player');
          emitReward('heart', 5);
          return { ...prev, maxHp: prev.maxHp + 5, lifefurnaceCounter: 0 };
        }
        return { ...prev, lifefurnaceCounter: cnt };
      });
    } else if (def.onPlay?.maxHpBonus) {
      setGame(prev => ({ ...prev, maxHp: prev.maxHp + def.onPlay!.maxHpBonus! }));
    }
    // 生命熔炉v3：满血时永久+3最大HP（无上限）
    if (def.onPlay?.healOrMaxHp) {
      setGame(prev => {
        if (prev.hp >= prev.maxHp) {
          addFloatingText(`${def.name}: +3`, REWARD_COLOR, heartIcon(), 'player');
          emitReward('heart', 3);
          return { ...prev, maxHp: prev.maxHp + 3 };
        }
        return prev;
      });
    }
  });

  // transferDebuff: 净化之刃 — 清除自身1个负面
  const hasTransferDebuff = selectedDiceForSpent.some(d => getDiceDef(d.diceDefId).onPlay?.transferDebuff);
  if (hasTransferDebuff) {
    setGame(prev => {
      const negatives = prev.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type));
      if (negatives.length > 0) {
        const toRemove = negatives[0];
        addToast(`净化之刃: 移除${toRemove.type}并转移给敌人!`, 'buff');
        return { ...prev, statuses: prev.statuses.filter(s => s !== toRemove) };
      }
      return prev;
    });
  }
  
  // 补充临时骰子（延迟显示，只补1颗）
  if (tempDieToGrant) {
    const tmpDie = tempDieToGrant;
    setTimeout(() => {
      setDice(prev => [...prev, { ...tmpDie, justAdded: true }]);
      setTimeout(() => setDice(pd => pd.map(d => d.id === tmpDie.id ? { ...d, justAdded: false } : d)), 600);
      const srcDie = selectedDiceForSpent.find(d => getDiceDef(d.diceDefId).onPlay?.grantShadowDie);
      const srcName = srcDie ? getDiceDef(srcDie.diceDefId).name : '残骰';
      addFloatingText(`${srcName}: +1`, REWARD_COLOR, diceIcon(), 'player');
      emitReward('dice', 1);
    }, 300);
  }
  
  const usedElements = selectedDiceForSpent.filter(d => d.element !== 'normal').map(d => d.element);
  const isNormalAttackPlay = bestHand === '普通攻击';
  setGame(prev => ({ ...prev, discardPile: [...prev.discardPile, ...spentDefIds], elementsUsedThisBattle: [...new Set([...(prev.elementsUsedThisBattle || []), ...usedElements])], consecutiveNormalAttacks: isNormalAttackPlay ? (prev.consecutiveNormalAttacks || 0) + 1 : 0 }));

  let logMsg = `打出 ${bestHand}，造成 ${outcome.damage} 伤害`;
  if (outcome.armor > 0) logMsg += `，获得 ${outcome.armor} 护甲`;
  if (outcome.heal > 0) logMsg += `，回复 ${outcome.heal} 生命`;
  if (outcome.triggeredAugments.length > 0) {
    const augDetails = outcome.triggeredAugments.map(a => `${a.name}(${a.details})`).join(', ');
    logMsg += ` (触发: ${augDetails})`;
  }

  // 圣光净化：出牌后才执行副作用（清除负面状态或移除诅咒骰子）
  if (outcome.holyPurify) {
    const purifyCount = typeof outcome.holyPurify === 'number' ? outcome.holyPurify : 1;
    const negativeStatuses = game.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type));
    if (negativeStatuses.length > 0) {
      // 净化数量：purifyCount>=99表示全部净化
      const toPurge = purifyCount >= 99 ? negativeStatuses : 
        negativeStatuses.sort(() => Math.random() - 0.5).slice(0, purifyCount);
      const purgeTypes = new Set(toPurge.map(s => s.type));
      setGame(prev => ({
        ...prev,
        statuses: prev.statuses.filter(s => !purgeTypes.has(s.type)),
      }));
      const purgedNames = toPurge.map(s => s.type).join('、');
      addLog(`净化！清除了 ${purgedNames}`);
      addFloatingText(`净化 ${toPurge.length > 1 ? '×' + toPurge.length : purgedNames}`, 'text-cyan-300', undefined, 'player');
    } else {
      const cursedIdx = game.ownedDice.findIndex(d => d.defId === 'cursed' || d.defId === 'cracked');
      if (cursedIdx >= 0) {
        const cursedDefId = game.ownedDice[cursedIdx].defId;
        const cursedDef = getDiceDef(cursedDefId);
        setGame(prev => {
          const newOwned = [...prev.ownedDice];
          newOwned.splice(cursedIdx, 1);
          let removedFromBag = false;
          const newBag = prev.diceBag.filter(id => {
            if (!removedFromBag && id === cursedDefId) {
              removedFromBag = true;
              return false;
            }
            return true;
          });
          let removedFromDiscard = false;
          const newDiscard = prev.discardPile.filter(id => {
            if (!removedFromDiscard && id === cursedDefId) {
              removedFromDiscard = true;
              return false;
            }
            return true;
          });
          return { ...prev, ownedDice: newOwned, diceBag: newBag, discardPile: newDiscard };
        });
        addLog(`净化！移除了 ${cursedDef.name}`);
        addFloatingText(`净化 ${cursedDef.name}`, 'text-cyan-300', undefined, 'player');
      }
    }
  }
  logMsg += `。`;
  addLog(logMsg);
}

// [已提取到 checkEnemyDeathsModule.ts]
export { createCheckEnemyDeaths } from './checkEnemyDeathsModule';
