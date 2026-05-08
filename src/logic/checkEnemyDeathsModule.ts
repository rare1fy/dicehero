/**
 * checkEnemyDeathsModule.ts — 敌人死亡检测（波次切换/胜利判定）
 *
 * 从 postPlayEffects.ts 提取。
 * ARCH-F Round2 模块拆分
 */

import type { PostPlayContext } from './postPlayEffects';
import { generateChallenge } from '../utils/instakillChallenge';
import { ANIMATION_TIMING } from '../config';

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
    
    // 单体攻击：检查目标是否死亡，若存活则无需波次检测
    if (!hasAoe) {
      const targetDied = finalEnemyHp <= 0;
      if (targetDied) {
        const remainingAlive = enemies.filter(e => e.hp > 0 && e.uid !== targetUid);
        if (remainingAlive.length > 0) {
          setGame(prev => ({ ...prev, targetEnemyUid: (remainingAlive.find(e => e.combatType === 'guardian') || remainingAlive[0]).uid }));
          addLog(`当前目标被击败！还有 ${remainingAlive.length} 个敌人存活。`);
          return;
        }
      } else {
        return; // 目标存活，无需波次检测
      }
    }
    
    // 全灭检测：AOE 用伤害快照判定，单体已确认目标死亡
    const anyAlive = hasAoe ? enemies.some(e => e.hp - outcome.damage > 0) : false;
    
    if (!anyAlive) {
      const nextWaveIdx = game.currentWaveIndex + 1;
      if (nextWaveIdx < game.battleWaves.length) {
        const nextWave = game.battleWaves[nextWaveIdx].enemies;
        // Boss出场演出：如果当前是boss节点且下一波只有1个敌人(boss单独出场)
        const currentNode = game.map.find(n => n.id === game.currentNodeId);
        const isBossWave = currentNode?.type === 'boss' && nextWave.length === 1 && nextWave[0].maxHp > 200;
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
            instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type),
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
