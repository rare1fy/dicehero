/**
 * damageApplication.ts — 伤害应用逻辑
 *
 * 从 DiceHeroGame.tsx playHand() L1432-L1672 提取。
 * 纯函数：接收 state 快照 + 回调，执行伤害/护甲/回血等应用。
 *
 * ARCH-F Round1 模块拆分
 */

import React from 'react';
import type { Die, GameState, Enemy, HandResult } from '../types/game';
import type { ExpectedOutcomeResult } from './expectedOutcomeTypes';
import type { EnemyQuotes } from '../config/enemies';
import { getDiceDef } from '../data/dice';
import { STATUS_INFO } from '../data/statusInfo';
import { ANIMATION_TIMING } from '../config';
import { PixelHeart, PixelShield } from '../components/PixelIcons';
import { applyBloodFuryOnHurt, applyVengeanceToBerserkers } from './enemyTraits';
import { checkBossPhaseSwitch } from './bossPhaseSwitch';

// ============================================================
// Context 接口
// ============================================================

export interface DamageAppContext {
  game: GameState;
  enemies: Enemy[];
  dice: Die[];
  selected: Die[];
  outcome: ExpectedOutcomeResult;
  targetEnemy: Enemy;
  settleDice: Die[];  // 来自 settlementAnimation 的返回值
  currentHands: HandResult;
  targetUid: string;
  isAoeActive: boolean;

  // Ref
  playsPerEnemyRef: React.MutableRefObject<Record<string, number>>;

  // Callbacks
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>;
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  setArmorGained: React.Dispatch<React.SetStateAction<boolean>>;
  setHpGained: React.Dispatch<React.SetStateAction<boolean>>;
  setPlayerEffect: React.Dispatch<React.SetStateAction<string | null>>;
  setEnemyEffectForUid: (uid: string, effect: string | null) => void;
  enemyQuotedLowHp: Set<string>;
  setEnemyQuotedLowHp: React.Dispatch<React.SetStateAction<Set<string>>>;
  /** [2026-05-09] Boss phase2（70% 血量）气泡专用 set */
  enemyQuotedPhase2: Set<string>;
  setEnemyQuotedPhase2: React.Dispatch<React.SetStateAction<Set<string>>>;
  /** [2026-05-09 v2] BOSS 已进入第几阶段（key=uid, value=stage）
   *  跨过 phases[].hpThreshold 时累加；用于触发"阶段切换"全屏横幅 + boss_entrance 演出 */
  enemyPhaseStage: Map<string, number>;
  setEnemyPhaseStage: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  /** [2026-05-09 v2] BOSS 阶段切换全屏横幅 setter */
  setPhaseAnnouncement: (v: { stage: number; taunt: string; bossName: string } | null) => void;
  addFloatingText: (text: string, color: string, icon?: React.ReactNode, target?: string, persistent?: boolean) => void;
  playSound: (id: string) => void;
  showEnemyQuote: (uid: string, text: string, duration: number) => void;
  getEnemyQuotes: (configId: string) => EnemyQuotes | undefined;
  pickQuote: (quotes?: string[]) => string | undefined;
  setScreenShake: React.Dispatch<React.SetStateAction<boolean>>;
}

// ============================================================
// 主函数
// ============================================================

export function applyDamageToEnemies(ctx: DamageAppContext): {
  hasAoe: boolean;
  isElementalAoe: boolean;
  finalEnemyHp: number;
} {
  const {
    game, enemies, dice, selected, outcome, targetEnemy,
    settleDice, currentHands, targetUid, isAoeActive,
    playsPerEnemyRef,
    setEnemies, setGame, setArmorGained, setHpGained, setPlayerEffect,
    setEnemyEffectForUid, enemyQuotedLowHp, setEnemyQuotedLowHp,
    enemyQuotedPhase2, setEnemyQuotedPhase2,
    enemyPhaseStage, setEnemyPhaseStage, setPhaseAnnouncement,
    addFloatingText, playSound, showEnemyQuote, getEnemyQuotes, pickQuote,
    setScreenShake,
  } = ctx;

  // --- Apply damage to enemy (with AOE support) ---
  const selectedDefs = selected.map(d => getDiceDef(d.diceDefId));
  const hasThunderElement = selected.some(d => d.element === 'thunder');
  const hasAoe = hasThunderElement || selectedDefs.some(def => def.onPlay?.aoe) || currentHands.activeHands.some(h => ['顺子', '4顺', '5顺', '6顺'].includes(h));
  // 同元素牌型的状态效果AOE（对所有敌人施加状态）
  const isElementalAoe = currentHands.activeHands.some(h => ['元素顺', '元素葫芦', '皇家元素顺'].includes(h));
  
  if (outcome.damage > 0) {
    if (hasAoe) {
      // AOE: 对所有存活敌人造成伤害
      const aliveEnemies = enemies.filter(e => e.hp > 0);
      // AOE也算攻击过这些敌人（避免后续首杀魂晶误判）
      aliveEnemies.forEach(e => {
        if (!playsPerEnemyRef.current[e.uid]) {
          playsPerEnemyRef.current = { ...playsPerEnemyRef.current, [e.uid]: 1 };
        }
      });
      aliveEnemies.forEach((e, idx) => {
        setTimeout(() => {
          const absorbed = Math.min(e.armor, outcome.damage);
          const hpDamage = Math.max(0, outcome.damage - absorbed);
          if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', React.createElement(PixelShield, { size: 1.3 }), 'enemy');
          if (hpDamage > 0) addFloatingText(`-${hpDamage}`, 'text-red-500', React.createElement(PixelHeart, { size: 1.3 }), 'enemy');
        }, idx * 150);
      });
    } else {
      const absorbed = Math.min(targetEnemy.armor, outcome.damage);
      const hpDamage = Math.max(0, outcome.damage - absorbed);
      if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', React.createElement(PixelShield, { size: 1.3 }), 'enemy');
      if (hpDamage > 0) setTimeout(() => addFloatingText(`-${hpDamage}`, 'text-red-500', React.createElement(PixelHeart, { size: 1.3 }), 'enemy'), absorbed > 0 ? 150 : 0);
    }
  }

  // Apply to player
  if (outcome.armor > 0) {
    setArmorGained(true);
    playSound('armor');
    addFloatingText(`+${outcome.armor}`, 'text-blue-400', React.createElement(PixelShield, { size: 1.3 }), 'player');
    setTimeout(() => setArmorGained(false), 500);
  }
  if (outcome.heal > 0) {
    setHpGained(true);
    playSound('heal');
    addFloatingText(`+${outcome.heal}`, 'text-emerald-500', React.createElement(PixelHeart, { size: 1.3 }), 'player');
    setTimeout(() => setHpGained(false), 500);
  }
  
  // Status effects on enemies
  if (outcome.statusEffects && outcome.statusEffects.length > 0) {
    if (isElementalAoe) {
      // 高阶同元素牌型：状态效果AOE全体敌人
      addFloatingText('元素爆发!', 'text-[var(--pixel-gold)]', undefined, 'enemy');
    }
    outcome.statusEffects.forEach((s, idx) => {
      setTimeout(() => {
        const info = STATUS_INFO[s.type];
        addFloatingText(`${info.label} ${s.value}`, info.color.replace('text-', 'text-'), info.icon, 'enemy');
      }, idx * 200);
    });
  }

  // Calculate and apply damage to enemies
  let finalEnemyHp = targetEnemy.hp; // will be updated for single-target path
  if (hasAoe) {
    // AOE: damage all alive enemies
    setEnemies(prev => prev.map(e => {
      if (e.hp <= 0) return e;
      let dmg = outcome.damage;
      let arm = e.armor;
      // 火元素：摧毁护甲
      if (outcome.armorBreak) { arm = 0; }
      if (arm > 0) {
        const absorbed = Math.min(arm, dmg);
        arm -= absorbed;
        dmg -= absorbed;
      }
      const newHp = Math.max(0, e.hp - dmg);
      let newStatuses = [...e.statuses];
      // AOE状态效果也施加给所有敌人
      if (outcome.statusEffects) {
        outcome.statusEffects.forEach(s => {
          const existing = newStatuses.find(es => es.type === s.type);
          if (existing) { existing.value += s.value; }
          else { newStatuses.push({ ...s }); }
        });
      }
      if (newHp <= 0) {
        // [BOSS-DEATH-RITUAL 2026-05-08] AOE 命中 Boss 同样走仪式演出（独立完整动画）
        const isBossAoe = typeof e.configId === 'string' && e.configId.startsWith('boss_');
        if (isBossAoe) {
          setEnemyEffectForUid(e.uid, 'boss_death');
          playSound('enemy_death');
          playSound('boss_laugh');
          const dqB = getEnemyQuotes(e.configId);
          const dlB = pickQuote(dqB?.death);
          if (dlB) showEnemyQuote(e.uid, dlB, ANIMATION_TIMING.bossDeathRitualDuration);
        } else {
          setEnemyEffectForUid(e.uid, 'death'); playSound('enemy_death');
        }
      } else {
        setEnemyEffectForUid(e.uid, 'hit');
        setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
        const dq2 = getEnemyQuotes(e.configId);
        const dl2 = pickQuote(dq2?.death);
        if (dl2) showEnemyQuote(e.uid, dl2, ANIMATION_TIMING.enemyDeathDuration + 200);
      }
      return { ...e, hp: newHp, armor: arm, statuses: newStatuses };
    }).map(e => {
      // [WARRIOR_TRAIT 2026-05-09] AOE 受伤后累 bloodFury（先收 hp 完成，再统一遍历所有受伤的 warrior）
      // 注：上一个 .map 闭包里 e 是新值，所以用 hp < maxHp 简化判断（AOE 必然被打了一下）
      if (e.combatType === 'warrior' && e.hp > 0 && e.hp < e.maxHp) {
        const after = applyBloodFuryOnHurt(e);
        if (after.bloodFury && (after.bloodFury > (e.bloodFury || 0))) {
          addFloatingText(`血怒: ×${after.bloodFury}`, 'text-red-400', undefined, 'enemy');
        }
        return after;
      }
      return e;
    }));
    // [VENGEANCE 2026-05-10] AOE 后：基于闭包 enemies 快照统计本帧新死亡数，给所有存活 berserker 累加复仇层
    setEnemies(curr => {
      let deadCount = 0;
      enemies.forEach(p => {
        const after = curr.find(x => x.uid === p.uid);
        if (p.hp > 0 && after && after.hp <= 0) deadCount += 1;
      });
      if (deadCount === 0) return curr;
      const withVengeance = applyVengeanceToBerserkers(curr, deadCount);
      let anyTriggered = false;
      curr.forEach(before => {
        const after = withVengeance.find(x => x.uid === before.uid);
        if (after && (after.vengeance || 0) > (before.vengeance || 0)) {
          addFloatingText(`⚡ 复仇 ×${after.vengeance}`, 'text-red-400 font-bold', undefined, 'enemy', true);
          anyTriggered = true;
        }
      });
      // [VENGEANCE-FX 2026-05-10] 触发屏抖（短促），强化"队友死了，活下来的更狠"反馈
      if (anyTriggered && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dh-vengeance-triggered'));
      }
      return withVengeance;
    });
    // shadowClonePlay: 影分身 — AOE路径下对原目标追加50%伤害
    const hasShadowCloneAoe = selected.some(d => getDiceDef(d.diceDefId).onPlay?.shadowClonePlay);
    if (hasShadowCloneAoe && outcome.damage > 0) {
      const cloneDmg = Math.floor(outcome.damage * 0.5);
      if (cloneDmg > 0) {
        setEnemies(prev => prev.map(e => {
          if (e.uid !== targetUid || e.hp <= 0) return e;
          const afterArmor = Math.max(0, cloneDmg - e.armor);
          return { ...e, hp: Math.max(0, e.hp - afterArmor), armor: Math.max(0, e.armor - cloneDmg) };
        }));
      }
    }
  } else {
    // Single target
    let remainingDamage = outcome.damage;
    let enemyArmor = targetEnemy.armor;
    // 火元素：无视护甲，伤害直接作用于HP
    if (outcome.armorBreak) {
      // 摧毁全部护甲 + 伤害不被护甲减免
      enemyArmor = 0;
    } else if (enemyArmor > 0) {
      const absorbed = Math.min(enemyArmor, remainingDamage);
      enemyArmor -= absorbed;
      remainingDamage -= absorbed;
    }
    finalEnemyHp = targetEnemy.hp - remainingDamage; // 保留负值用于overkill计算

    // shadowClonePlay: 影分身 — 追加50%伤害的额外攻击（同步应用，使 checkEnemyDeaths 正确检测击杀）
    const hasShadowClone = selected.some(d => getDiceDef(d.diceDefId).onPlay?.shadowClonePlay);
    if (hasShadowClone && outcome.damage > 0) {
      const cloneDmg = Math.floor(outcome.damage * 0.5);
      if (cloneDmg > 0) {
        let cloneRemainingDmg = cloneDmg;
        if (!outcome.armorBreak && enemyArmor > 0) {
          const cloneAbsorbed = Math.min(enemyArmor, cloneRemainingDmg);
          enemyArmor -= cloneAbsorbed;
          cloneRemainingDmg -= cloneAbsorbed;
        }
        finalEnemyHp -= cloneRemainingDmg;
      }
    }

    // Player attack hit feedback
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
    if (finalEnemyHp <= 0) {
      // [BOSS-DEATH-RITUAL 2026-05-08] Boss 专属死亡仪式：先放大金光 1500ms，再进入普通消散
      const isBoss = typeof targetEnemy.configId === 'string' && targetEnemy.configId.startsWith('boss_');
      const dq = getEnemyQuotes(targetEnemy.configId);
      const dl = pickQuote(dq?.death);
      if (isBoss) {
        // boss_death 自身是完整 2000ms 动画（怒吼→金光→消散），无需二次切 effect
        setEnemyEffectForUid(targetUid, 'boss_death');
        playSound('enemy_death');
        playSound('boss_laugh');
        if (dl) showEnemyQuote(targetUid, dl, ANIMATION_TIMING.bossDeathRitualDuration);
      } else {
        setEnemyEffectForUid(targetUid, 'death'); playSound('enemy_death');
        if (dl) showEnemyQuote(targetUid, dl, ANIMATION_TIMING.enemyDeathDuration + 200);
      }
    }
    // Enemy survived: hit flash effect first, then speaking if low HP
    if (finalEnemyHp > 0) {
      setEnemyEffectForUid(targetUid, 'hit');
      // [BOSS-LOW-HP-ROAR 2026-05-08] Boss 专属低血怒吼：阈值 50%，普通敌人仍是 30%
      const isBossTarget = typeof targetEnemy.configId === 'string' && targetEnemy.configId.startsWith('boss_');
      const lowHpThreshold = isBossTarget ? 0.5 : 0.3;
      let phaseSwitchFired = false;

      // [BOSS-PHASE-SWITCH 2026-05-09 v2] 基于 EnemyConfig.phases[].hpThreshold 的真阶段切换演出。
      //   原 70% 写死阈值改为读取配置真实阈值，跨任一阈值就触发"阶段切换"全屏横幅 + boss_entrance 特效。
      //   每个阈值仅触发一次，使用 enemyPhaseStage Map 记忆。
      if (isBossTarget) {
        const curStage = enemyPhaseStage.get(targetUid) || 1;
        const sw = checkBossPhaseSwitch(targetEnemy, targetEnemy.hp, finalEnemyHp, curStage);
        if (sw.stageReached) {
          phaseSwitchFired = true;
          // 立刻记录阶段，避免 React state 异步更新导致的同帧重复触发
          setEnemyPhaseStage(prev => {
            const m = new Map(prev);
            m.set(targetUid, sw.stageReached!);
            return m;
          });
          // 选取阶段切换台词：phase2_taunt 池为优先（专为阶段切换设计），缺则用 lowHp 池
          const psQ = getEnemyQuotes(targetEnemy.configId);
          const psLine = pickQuote(psQ?.phase2_taunt) || pickQuote(psQ?.lowHp) || '哼……';
          // 延迟 350ms（让 hit 飘字先出来），再播阶段横幅
          setTimeout(() => {
            setPhaseAnnouncement({
              stage: sw.stageReached!,
              taunt: psLine,
              bossName: targetEnemy.name,
            });
            playSound('boss_laugh');
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 600);
            // boss_entrance 压迫感动画（与 BossEntrance 横幅相同的特效）
            setEnemyEffectForUid(targetUid, 'boss_entrance');
            setTimeout(() => setEnemyEffectForUid(targetUid, null), ANIMATION_TIMING.bossEntranceDuration);
            // 同步给本尊一个 BOSS 气泡台词
            showEnemyQuote(targetUid, psLine, ANIMATION_TIMING.bossLowHpDuration);
          }, 350);
          // 标记 phase2 已说过，避免外层 phase2 70% 块再重复
          setEnemyQuotedPhase2(prev => new Set([...prev, targetUid]));
        }
      }

      const hpRatio = finalEnemyHp / targetEnemy.maxHp;
      const willSpeakLowHp = hpRatio < lowHpThreshold && !enemyQuotedLowHp.has(targetUid);
      if (willSpeakLowHp && !phaseSwitchFired) {
        const lqc = getEnemyQuotes(targetEnemy.configId);
        const ll = pickQuote(lqc?.lowHp);
        if (ll) {
          // Play hit for 400ms, then transition to speaking
          setTimeout(() => {
            const speakDuration = isBossTarget ? ANIMATION_TIMING.bossLowHpDuration : 3000;
            const effect: 'boss_low_hp' | 'speaking' = isBossTarget ? 'boss_low_hp' : 'speaking';
            const clearDelay = isBossTarget ? ANIMATION_TIMING.bossLowHpDuration : ANIMATION_TIMING.speakingEffectDuration;
            showEnemyQuote(targetUid, ll, speakDuration);
            playSound('enemy_speak');
            setEnemyEffectForUid(targetUid, effect);
            setTimeout(() => setEnemyEffectForUid(targetUid, null), clearDelay);
          }, 400);
          setEnemyQuotedLowHp(prev => new Set([...prev, targetUid]));
        } else {
          setTimeout(() => setEnemyEffectForUid(targetUid, null), 400);
        }
      } else if (!phaseSwitchFired) {
        setTimeout(() => setEnemyEffectForUid(targetUid, null), 400);
      }
      // phaseSwitchFired 时不在这里 clear effect，由 phase-switch 自己控制 boss_entrance 的清理
    }
    
    setEnemies(prev => prev.map(e => {
      if (e.uid !== targetUid) return e;
      let newStatuses = [...e.statuses];
      if (outcome.statusEffects) {
        outcome.statusEffects.forEach(s => {
          const existing = newStatuses.find(es => es.type === s.type);
          if (existing) { existing.value += s.value; }
          else { newStatuses.push({ ...s }); }
        });
      }
      // 高阶同元素：状态也施加给其他敌人
      const damaged = { ...e, hp: Math.max(0, finalEnemyHp), armor: enemyArmor, statuses: newStatuses };
      // [WARRIOR_TRAIT 2026-05-09] 受伤后累 bloodFury（仅活着且确实掉了血时；只 warrior normal/elite 起效）
      if (damaged.hp > 0 && damaged.hp < e.hp) {
        const after = applyBloodFuryOnHurt(damaged);
        if (after.bloodFury && (after.bloodFury > (e.bloodFury || 0))) {
          addFloatingText(`血怒: ×${after.bloodFury}`, 'text-red-400', undefined, 'enemy');
        }
        return after;
      }
      return damaged;
    }));
    // [VENGEANCE 2026-05-10] 单体击杀后：若目标本帧死亡，给所有存活 berserker 累加 1 层复仇
    if (finalEnemyHp <= 0 && targetEnemy.hp > 0) {
      setEnemies(curr => {
        const withVengeance = applyVengeanceToBerserkers(curr, 1);
        let anyTriggered = false;
        curr.forEach(before => {
          const after = withVengeance.find(x => x.uid === before.uid);
          if (after && (after.vengeance || 0) > (before.vengeance || 0)) {
            addFloatingText(`⚡ 复仇 ×${after.vengeance}`, 'text-red-400 font-bold', undefined, 'enemy', true);
            anyTriggered = true;
          }
        });
        if (anyTriggered && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dh-vengeance-triggered'));
        }
        return withVengeance;
      });
    }
    
    // 高阶同元素牌型：状态效果AOE施加给非目标敌人
    if (isElementalAoe && outcome.statusEffects && outcome.statusEffects.length > 0) {
      setEnemies(prev => prev.map(e => {
        if (e.uid === targetUid || e.hp <= 0) return e;
        let newStatuses = [...e.statuses];
        outcome.statusEffects.forEach(s => {
          const existing = newStatuses.find(es => es.type === s.type);
          if (existing) { existing.value += Math.floor(s.value * 0.5); }
          else { newStatuses.push({ ...s, value: Math.floor(s.value * 0.5) }); }
        });
        return { ...e, statuses: newStatuses };
      }));
    }
  }
  
  // splinterDamage: 溢出伤害传导给随机其他敌人
  if (!hasAoe && finalEnemyHp < 0) {
    const overkill = Math.abs(finalEnemyHp);
    const hasSplinter = selectedDefs.some(def => def.onPlay?.splinterDamage);
    if (hasSplinter) {
      const splinterRatio = selectedDefs.reduce((max, def) => Math.max(max, def.onPlay?.splinterDamage || 0), 0);
      const splinterDmg = Math.floor(overkill * splinterRatio);
      if (splinterDmg > 0) {
        const otherEnemies = enemies.filter(e => e.uid !== targetUid && e.hp > 0);
        if (otherEnemies.length > 0) {
          const splinterTarget = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
          addFloatingText(`溅射-${splinterDmg}`, 'text-orange-400', undefined, 'enemy');
          setEnemies(prev => prev.map(e => {
            if (e.uid !== splinterTarget.uid) return e;
            const sArm = e.armor;
            const sDmg = Math.max(0, splinterDmg - sArm);
            return { ...e, hp: Math.max(0, e.hp - sDmg), armor: Math.max(0, sArm - splinterDmg) };
          }));
        }
      }
    }
  }
  // comboSplashDamage: 连锁打击 — 第2次及以上连击时，对随机另一敌人造成骰子点数×倍率的独立伤害
  const comboSplashDie = selected.find(d => getDiceDef(d.diceDefId).onPlay?.comboSplashDamage);
  if (comboSplashDie && (game.comboCount || 0) >= 1) {
    const splashMult = getDiceDef(comboSplashDie.diceDefId).onPlay?.comboSplashDamage || 1;
    const splashDmg = comboSplashDie.value * splashMult;
    const otherAlive = enemies.filter(e => e.uid !== targetUid && e.hp > 0);
    if (otherAlive.length > 0) {
      const splashTarget = otherAlive[Math.floor(Math.random() * otherAlive.length)];
      addFloatingText(`连锁-${splashDmg}`, 'text-cyan-300', undefined, 'enemy');
      setEnemies(prev => prev.map(e => {
        if (e.uid !== splashTarget.uid) return e;
        const sArm = e.armor;
        const sDmg = Math.max(0, splashDmg - sArm);
        return { ...e, hp: Math.max(0, e.hp - sDmg), armor: Math.max(0, sArm - splashDmg) };
      }));
    }
  }
  // chainBolt: 奥术飞弹 — 对每个存活敌人各造成一次等于自身点数的独立伤害
  const chainBoltDie = selected.find(d => getDiceDef(d.diceDefId).onPlay?.chainBolt);
  if (chainBoltDie) {
    const boltDmg = chainBoltDie.value;
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length > 0) {
      addFloatingText(`奥术飞弹 ×${aliveEnemies.length}`, 'text-blue-300', undefined, 'enemy');
      setEnemies(prev => prev.map(e => {
        if (e.hp <= 0) return e;
        const eArm = e.armor;
        const eDmg = Math.max(0, boltDmg - eArm);
        return { ...e, hp: Math.max(0, e.hp - eDmg), armor: Math.max(0, eArm - boltDmg) };
      }));
    }
  }
  // splashToRandom: 对随机另一敌人造成等于骰子点数的独立伤害
  if (!hasAoe) {
    const hasSplash = selectedDefs.some(def => def.onPlay?.splashToRandom);
    if (hasSplash) {
      const splashDie = selected.find(d => getDiceDef(d.diceDefId).onPlay?.splashToRandom);
      if (splashDie) {
        const otherEnemies = enemies.filter(e => e.uid !== targetUid && e.hp > 0);
        if (otherEnemies.length > 0) {
          const splashTarget = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
          const splashDmg = splashDie.value;
          addFloatingText(`暗影-${splashDmg}`, 'text-green-400', undefined, 'enemy');
          setEnemies(prev => prev.map(e => {
            if (e.uid !== splashTarget.uid) return e;
            const sArm = e.armor;
            const sDmg = Math.max(0, splashDmg - sArm);
            return { ...e, hp: Math.max(0, e.hp - sDmg), armor: Math.max(0, sArm - splashDmg) };
          }));
        }
      }
    }
  }

  setPlayerEffect('attack');
  playSound(isAoeActive ? 'player_aoe' : 'player_attack');
  setTimeout(() => setPlayerEffect(null), 500);
  setGame(prev => ({ 
    ...prev, 
    armor: prev.armor + outcome.armor,
    hp: outcome.heal < 0
      ? Math.max(1, prev.hp + outcome.heal) // 自伤不会杀死玩家
      : Math.min(prev.maxHp, prev.hp + outcome.heal)
  }));

  return { hasAoe, isElementalAoe, finalEnemyHp };
}
