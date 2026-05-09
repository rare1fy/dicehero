/**
 * checkEnemyDeathsModule.ts — 敌人死亡检测（波次切换/胜利判定）
 *
 * 从 postPlayEffects.ts 提取。
 * ARCH-F Round2 模块拆分
 */

import type { PostPlayContext } from './postPlayEffects';
import { generateChallenge } from '../utils/instakillChallenge';
import { ANIMATION_TIMING } from '../config';
import { tryReviveOnDeath } from './enemySummonRevive';

// ============================================================
// 异步部分：敌人死亡检测
// ============================================================

export function createCheckEnemyDeaths(ctx: PostPlayContext): () => Promise<void> {
  return async () => {
    const {
      game, gameRef, enemies, dice, outcome, targetEnemy,
      hasAoe, isElementalAoe, targetUid, finalEnemyHp,
      setGame, setEnemies, setEnemyEffectForUid,
      setBossEntrance, setEnemyEffects, setDyingEnemies,
      setEnemyQuotes, setEnemyQuotedLowHp, setRerollCount,
      setWaveAnnouncement, setDice,
      addLog, addToast, addFloatingText, playSound,
      showEnemyQuote, getEnemyQuotes, pickQuote,
      rollAllDice, handleVictory,
    } = ctx;

    await new Promise(r => setTimeout(r, ANIMATION_TIMING.enemyDeathCleanupDelay)); // Wait for death animation to complete

    // [Bug-23] 异步等待后检查战斗是否已结束（防止 handleVictory 被重复调用）
    if (gameRef.current.phase !== 'battle') return;

    // [LEVEL-PAUSE 2026-05-08 v2] 死亡动画播完了，如果这次击杀触发了升级，
    //   让 LevelUpModal 先弹出、玩家领完奖再继续推进（handleVictory / 波次切换 全部冻结）。
    //   效果：击杀 → 死亡动画 2200ms → 升级弹窗（游戏静止） → 玩家选奖 → 胜利/下一波。
    while ((gameRef.current.pendingLevelUps?.length || 0) > 0) {
      await new Promise(r => setTimeout(r, 150));
      if (gameRef.current.phase !== 'battle') return; // 被外部切走就放弃
    }

    // Bug-3: 死亡动画已在 enemyDeathCleanupDelay (2200ms) 等待期间完成
    // 无需额外等待，直接检查存活敌人
    
    // [REVIVE 2026-05-09] 检查刚死的敌人有没有 ReviveRule，有则原地复活/分裂。
    //   单体击杀路径：finalEnemyHp <= 0 时尝试 revive(targetEnemy)
    //   AOE 路径：遍历 enemies，对每只 hp <= 0 但有 revive 配置的尝试
    if (!hasAoe && finalEnemyHp <= 0) {
      const r = tryReviveOnDeath(targetEnemy);
      if (r.revivedSelf) {
        setEnemies(prev => prev.map(e => e.uid === targetUid ? r.revivedSelf! : e));
        setEnemyEffectForUid(targetUid, null);
        if (r.log) {
          addLog(r.log);
          addToast(r.log, 'buff');
          showEnemyQuote(targetUid, r.log, 2400);
        }
        playSound('boss_laugh');
        return;  // 不再进入波次切换 / 胜利判定
      }
      if (r.splits.length > 0) {
        // 分裂：移除原敌人，插入子代
        setEnemies(prev => {
          const next = prev.filter(e => e.uid !== targetUid);
          next.push(...r.splits);
          return next;
        });
        if (r.log) {
          addLog(r.log);
          addToast(r.log, 'buff');
        }
        playSound('enemy_skill');
        return;
      }
    }
    if (hasAoe) {
      // AOE 后所有 hp<=0 的复活检查
      const dyingWithRevive: string[] = [];
      enemies.forEach(en => {
        if (en.hp - outcome.damage <= 0 && en.hp > 0) {
          const r = tryReviveOnDeath(en);
          if (r.revivedSelf || r.splits.length > 0) dyingWithRevive.push(en.uid);
        }
      });
      if (dyingWithRevive.length > 0) {
        setEnemies(prev => {
          let next = [...prev];
          for (const uid of dyingWithRevive) {
            const target = prev.find(e => e.uid === uid);
            if (!target) continue;
            const r = tryReviveOnDeath(target);
            if (r.revivedSelf) {
              next = next.map(e => e.uid === uid ? r.revivedSelf! : e);
            } else if (r.splits.length > 0) {
              next = next.filter(e => e.uid !== uid);
              next.push(...r.splits);
            }
            if (r.log) addLog(r.log);
          }
          return next;
        });
        playSound('boss_laugh');
      }
    }

    // 单体攻击：检查目标是否死亡，若存活则无需波次检测
    // [BUGFIX 2026-05-10] 上一版用 setEnemies(updater) 旁路同步读取最新 state，
    //   但 React 18 automatic batching 下 updater 是延迟执行（同事件循环 microtask 内不跑），
    //   闭包变量 latestEnemiesSnapshot 仍是 stale 的入参 enemies（含尚未扣血的目标）。
    //   后果：单体击杀场上唯一敌人时 latestAlive.length>0 → 既不切目标也不进 victory → 战斗卡死。
    //   正确做法：基于已知事实 (finalEnemyHp + 闭包 enemies) 投影出当前活敌人列表。
    //   注：附带伤害（奥术飞弹 chainBolt）发生在 hasAoe 分支或独立路径，
    //   单体直伤路径下，闭包 enemies 里非目标敌人的 hp 是准确的。
    const projectedAlive = enemies
      .map(e => e.uid === targetUid ? { ...e, hp: finalEnemyHp } : e)
      .filter(e => e.hp > 0);

    if (!hasAoe) {
      const targetDied = finalEnemyHp <= 0;
      if (!targetDied) {
        return; // 目标存活，单体出牌后无需推进波次
      }
      // 目标已死：场上是否还有其它活敌人？
      if (projectedAlive.length > 0) {
        const nextTarget = projectedAlive.find(e => e.combatType === 'guardian') || projectedAlive[0];
        setGame(prev => ({ ...prev, targetEnemyUid: nextTarget.uid }));
        addLog(`当前目标被击败！还有 ${projectedAlive.length} 个敌人存活。`);
        return;
      }
      // 全灭：为已死且未播死亡动画的敌人补 death 特效，再落到下方波次/胜利分支
      enemies.forEach(e => {
        const eHp = e.uid === targetUid ? finalEnemyHp : e.hp;
        if (eHp <= 0) {
          setEnemyEffectForUid(e.uid, 'death');
          setDyingEnemies(prevSet => new Set([...prevSet, e.uid]));
        }
      });
      playSound('enemy_death');
    }

    // 全灭检测：AOE 用伤害快照判定，单体已通过 projectedAlive 确认无活敌人
    const anyAlive = hasAoe ? enemies.some(e => e.hp - outcome.damage > 0) : projectedAlive.length > 0;
    
    if (!anyAlive) {
      const nextWaveIdx = game.currentWaveIndex + 1;
      if (nextWaveIdx < game.battleWaves.length) {
        const nextWave = game.battleWaves[nextWaveIdx].enemies;
        // Boss出场演出：如果当前是boss节点且下一波只有1个敌人(boss单独出场)
        const currentNode = game.map.find(n => n.id === game.currentNodeId);
        const isBossWave = currentNode?.type === 'boss' && nextWave.length === 1 && nextWave[0].maxHp > 100;
        if (isBossWave) {
          playSound('boss_appear');
          setBossEntrance({ visible: true, name: nextWave[0].name, chapter: game.chapter });
          await new Promise(r => setTimeout(r, ANIMATION_TIMING.enemyDeathCleanupDelay));
          setBossEntrance(prev => ({ ...prev, visible: false }));
          await new Promise(r => setTimeout(r, 300));
        }
        // Bug-3 安全兜底：确认所有死亡动画已播完再替换敌人数组
        // 防止 framer-motion 退出过渡被强制中断导致"闪没"
        await new Promise(r => setTimeout(r, ANIMATION_TIMING.waveTransitionDeathBuffer));
        // Bug-14: 先标记 isEnemyTurn=true 防止自动 endTurn 在 Boss 入场动画期间触发
        // setEnemies(nextWave) 后 enemies 有存活敌人 + dice 全 spent + isEnemyTurn=false → 自动 endTurn
        setGame(prev => ({ ...prev, isEnemyTurn: true }));
        setEnemies(nextWave);
        setEnemyEffects({}); setDyingEnemies(new Set());
        // Boss场景内演出：缩放前冲+抖动+笑声
        if (isBossWave && nextWave[0]) {
          setEnemyEffectForUid(nextWave[0].uid, 'boss_entrance');
          playSound('boss_laugh');
          await new Promise(r => setTimeout(r, ANIMATION_TIMING.bossEntranceDuration));
          setEnemyEffectForUid(nextWave[0].uid, null);
        }
        setEnemyQuotes({});
        setEnemyQuotedLowHp(new Set());
        setTimeout(() => {
          nextWave.forEach((e, idx) => {
            const q = getEnemyQuotes(e.configId);
            const line = pickQuote(q?.enter);
            if (line) {
              setTimeout(() => showEnemyQuote(e.uid, line, 3000), idx * 400);
            }
          });
        }, 300);
        // [2026-05-07] 波次切换 = 回合自然结束：重置所有 per-turn 状态，让玩家先手开新回合。
        // 相比早期"保留 playsLeft/连击/重投"的复杂规则，简化为：
        //   - playsLeft 回满 maxPlays
        //   - freeRerollsLeft 回满 freeRerollsPerTurn
        //   - 连击链/上一牌型/卖血层数/临时重投奖励全部清零
        //   - armor/instakillChallenge/battleTurn 按波次新开计算
        //   - battleTurn 从 1 起算，玩家回合（isEnemyTurn=false）
        //   - 法师吟唱：维持"本回合未出牌则保留"的既有含义（此处用 prev.playsLeft >= maxPlays 判定）
        setGame(prev => {
          const isMageChanting = prev.playerClass === 'mage' && prev.playsLeft >= prev.maxPlays;
          //   刘叔重现时按 F12 打开控制台看【WAVE-SWITCH】条目，留意 bag 长度是否突然增长。
          return {
            ...prev,
            currentWaveIndex: nextWaveIdx,
            targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null,
            isEnemyTurn: false,
            playsLeft: prev.maxPlays,
            freeRerollsLeft: prev.freeRerollsPerTurn,
            armor: 0,
            chantShield: 0,
            chargeStacks: isMageChanting ? prev.chargeStacks : 0,
            mageChantHitCount: isMageChanting ? prev.mageChantHitCount : 0,
            arcaneBackfire: isMageChanting ? prev.arcaneBackfire : 0,
            mageOverchargeMult: isMageChanting ? prev.mageOverchargeMult : 0,
            bloodRerollCount: 0,
            comboCount: 0,
            lastPlayHandType: undefined,
            lockedElement: isMageChanting ? prev.lockedElement : undefined,
            instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount + (prev.challengeDrawBonus || 0), prev.map.find(n => n.id === prev.currentNodeId)?.type),
            instakillCompleted: false,
            instakillAidType: null,
            playsThisWave: 0,
            rerollsThisWave: 0,
            battleTurn: 1,
            boomerangFreeReroll: 0,
            comboFreeReroll: 0,
            hpLostThisTurn: 0,
            consecutiveNormalAttacks: 0,
          };
        });
        setRerollCount(0);
        setWaveAnnouncement(nextWaveIdx + 1);
        addLog(`第 ${nextWaveIdx + 1} 波敌人来袭！`);
        // Bug-4：法师吟唱时保留屯牌，不清空骰子、不强制重置手牌
        // 注意：必须用 gameRef.current 获取最新 playsLeft（game 快照可能在出牌后未更新）
        const latestGame = gameRef.current;
        const isMageChanting = latestGame.playerClass === 'mage' && latestGame.playsLeft >= latestGame.maxPlays;
        if (!isMageChanting) {
          setDice([]);
        }
        rollAllDice(!isMageChanting);
        return;
      }
      // Bug-3: 胜利前清除死亡特效，避免 phase清空enemies useEffect 检测到 hasDyingEnemy
      // 后再等一轮 2200ms（已播放完的死亡动画不需要重复等待）
      setEnemyEffects({}); setDyingEnemies(new Set());
      handleVictory();
    }
  };
}
