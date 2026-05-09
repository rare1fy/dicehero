/**
 * enemyAI.ts — 敌人回合AI逻辑
 * 
 * 从 DiceHeroGame.tsx endTurn 函数中提取的敌人AI决策模块。
 * 包含：灼烧/中毒结算、5种combatType决策调度、回合结束处理。
 * 
 * 子模块：
 * - enemySkills.ts: Priest/Caster 技能逻辑 + 状态递减
 * - elites.ts: 精英/Boss 判定与增强逻辑
 * - enemyDialogue.ts: 台词系统
 * - attackCalc.ts: 攻击力计算纯函数
 * - enemyWaveTransition.ts: 波次转换逻辑
 * - enemyStatusSettlement.ts: 敌人灼烧/中毒 DOT 结算（纯函数）
 */

import type { Enemy, GameState, Die, Relic } from '../types/game';
import * as ReactNS from 'react';
import { PixelArcaneShield, PixelHeart, PixelShield, PixelArcaneSkull } from '../components/PixelIcons';
import type { buildRelicContext as BuildRelicContextFn } from '../engine/buildRelicContext';
import { hasFatalProtection as HasFatalProtectionFn } from '../engine/relicQueries';
import { triggerHourglass as TriggerHourglassFn } from '../engine/relicUpdates';
import { getEffectiveAttackDmg, getRangerFollowUpDmg } from './attackCalc';
import { executePriestSkill, executeCasterSkill, tickStatuses } from './enemySkills';
import { applyGuardRageOnDefend, consumeGuardRageOnAttack, bumpDotAmplifier, bumpHolyWrathPerTurn, archetypeArmorBoost, paladinShouldDefendThisTurn } from './enemyTraits';
import { trySummonForEnemy } from './enemySummonRevive';
import { processEliteDice, processEliteArmor } from './elites';
import { tryAttackTaunt, type DelayedQuoteAction } from './enemyDialogue';
import { tryWaveTransition } from './enemyWaveTransition';
import { absorbPlayerDamage, calcMageChantHitPenalty } from './battleHelpers';
import { GUARDIAN_CONFIG, ENEMY_ATTACK_MULT, ANIMATION_TIMING } from '../config';

/** 奥术屏障吸收飘字用的 icon，独立一处避免重复 createElement */
const arcaneShieldIcon = () => ReactNS.createElement(PixelArcaneShield, { size: 1.5 });
/** 玩家 HP 增减飘字用的像素爱心 icon */
const heartIcon = () => ReactNS.createElement(PixelHeart, { size: 1.3 });
/** 护甲吸收/获得飘字的盾牌 icon */
const shieldIcon = () => ReactNS.createElement(PixelShield, { size: 1.3 });
/** 法术反噬专用：紫色骷髅，法师专属不可净化 debuff */
const arcaneSkullIcon = () => ReactNS.createElement(PixelArcaneSkull, { size: 1.3 });
import { settleEnemyBurn, settleEnemyPoison, type DotLogEntry } from './enemyStatusSettlement';

// === EnemyAI 回调接口 ===

export interface EnemyAICallbacks {
  setGame: (update: GameState | ((prev: GameState) => GameState)) => void;
  setEnemies: (update: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  setEnemyEffects: (update: Record<string, string | null> | ((prev: Record<string, string | null>) => Record<string, string | null>)) => void;
  setDyingEnemies: (update: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setEnemyEffectForUid: (uid: string, effect: string | null) => void;
  enemyPreAction: (e: Enemy, quoteType: string) => Promise<boolean>;
  addLog: (msg: string) => void;
  /** [Y1] icon 参数为 string 类型（非 React.ReactNode），逻辑层不依赖 React */
  addFloatingText: (text: string, color: string, icon?: React.ReactNode, target?: 'player' | 'enemy', large?: boolean) => void;
  addToast: (msg: string, type: string, options?: { icon?: 'gold' | 'dice' | 'relic' | 'remove' | 'check' | 'star' | 'shuffle'; relicId?: string }) => void;
  playSound: (id: string) => void;
  setScreenShake: (v: boolean) => void;
  setPlayerEffect: React.Dispatch<React.SetStateAction<string | null>>;
  showEnemyQuote: (uid: string, text: string, duration?: number) => void;
  /** 延迟台词执行器：接收 DelayedQuoteAction 描述，在 UI 层调度定时器 */
  scheduleDelayedQuote: (action: DelayedQuoteAction) => void;
  getEnemyQuotes: (enemyId: string) => { attack?: string[]; defend?: string[]; skill?: string[]; heal?: string[]; enter?: string[]; hurt?: string[] } | undefined;
  pickQuote: (arr?: string[]) => string | null;
  setRerollCount: (v: number | ((prev: number) => number)) => void;
  setWaveAnnouncement: (v: number | null) => void;
  setDice: (v: Die[]) => void;
  rollAllDice: (force?: boolean) => void;
  buildRelicContext: typeof BuildRelicContextFn;
  hasFatalProtection: typeof HasFatalProtectionFn;
  triggerHourglass: typeof TriggerHourglassFn;
  handleVictory: () => void;
  gameRef: { current: GameState };
  enemiesRef: { current: Enemy[] };
}

// === 辅助：对DOT结算结果执行副作用 ===

/**
 * 对本次DOT结算产生的日志条目，在setState updater之外执行副作用。
 * 包括：日志、浮动文字、死亡特效、死亡音效、标记dying。
 */
function applyDotSettlementSideEffects(logs: DotLogEntry[], cb: EnemyAICallbacks): void {
  for (const entry of logs) {
    cb.addLog(`${entry.name} 因${entry.color === 'text-orange-500' ? '灼烧' : '中毒'}受到了 ${entry.damage} 点伤害。`);
    cb.addFloatingText(`-${entry.damage}`, entry.color, undefined, 'enemy');
    if (entry.died) {
      cb.setEnemyEffectForUid(entry.uid, 'death');
      cb.playSound('enemy_death');
      cb.setDyingEnemies(prevSet => new Set([...prevSet, entry.uid]));
    }
  }
}

// === 主函数 ===

/**
 * 执行敌人回合
 * 
 * 完整流程：
 * 1. 标记进入敌人回合
 * 2. 玩家中毒结算
 * 3. 敌人灼烧结算（含全灭→转波）
 * 4. 敌人中毒结算（含全灭→转波）
 * 5. 每个存活敌人执行AI决策
 * 6. 精英/Boss塞废骰子
 * 7. 精英/Boss叠护甲
 * 8. 敌人回合结束→玩家回合（灼烧结算+状态递减）
 */
export interface EnemyTurnResult {
  hp: number;
  waveTransitioned: boolean;
}

export async function executeEnemyTurn(
  game: GameState,
  enemies: Enemy[],
  dice: Die[],
  rerollCount: number,
  cb: EnemyAICallbacks
): Promise<EnemyTurnResult> {
  // 0. 标记进入敌人回合
  cb.setGame(prev => ({ ...prev, isEnemyTurn: true, bloodRerollCount: 0, comboCount: 0, lastPlayHandType: undefined, blackMarketUsedThisTurn: false }));

  // [PRIEST_TRAIT 2026-05-09] 圣怒：每 2 回合自动 +1（在敌人回合最开始统一累加）
  cb.setEnemies(prev => prev.map(en => bumpHolyWrathPerTurn(en, game.battleTurn)));

  // [SUMMON 2026-05-09] 敌人回合开始时检查召唤——在所有 DOT 结算前完成，
  // 让新召唤的小怪也参与本回合的 AI 决策（不会跑两个回合后才动）
  {
    const livingNow = enemies.filter(en => en.hp > 0);
    let waveSize = livingNow.length;
    const allNewMinions: Enemy[] = [];
    const summonerUpdates = new Map<string, Partial<Enemy>>();
    for (const en of livingNow) {
      const r = trySummonForEnemy(en, game.battleTurn, waveSize);
      if (r.newMinions.length > 0) {
        allNewMinions.push(...r.newMinions);
        summonerUpdates.set(en.uid, { summonCount: r.updatedSummoner.summonCount });
        waveSize += r.newMinions.length;
        if (r.log) {
          cb.addLog(r.log);
          cb.addToast(r.log, 'warning');
          cb.showEnemyQuote(en.uid, r.log, 2200);
        }
        cb.playSound('enemy_skill');
      }
    }
    if (allNewMinions.length > 0) {
      cb.setEnemies(prev => {
        const updated = prev.map(en => {
          const upd = summonerUpdates.get(en.uid);
          return upd ? { ...en, ...upd } : en;
        });
        return [...updated, ...allNewMinions];
      });
      // 等召唤动画一拍
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // 1. 玩家中毒结算（E5: death check 在回调内部完成）
  // [2026-05-07] 奥术屏障优先抵挡 DOT；护甲对 DOT 无效（bypassArmor=true）
  // [2026-05-08 v2] 法师吟唱期间被任何伤害（含 DOT、含屏障吸收）打扰 → arcaneBackfire +2^N（不可净化）
  let chantPenaltyStacks = 0;
  cb.setGame((prev: GameState) => {
    let nextStatuses = [...prev.statuses];
    let poisonDamage = 0;
    const poison = prev.statuses.find(s => s.type === 'poison');
    if (poison && poison.value > 0) {
      poisonDamage = poison.value;
      nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
    }
    const absorb = absorbPlayerDamage(poisonDamage, prev.chantShield || 0, prev.armor, true);
    if (absorb.absorbedByShield > 0) {
      cb.addLog(`奥术屏障吸收了 ${absorb.absorbedByShield} 点中毒伤害。`);
      cb.addFloatingText(`-${absorb.absorbedByShield}`, 'text-cyan-300', arcaneShieldIcon(), 'player');
    }
    if (absorb.hpDamage > 0) {
      cb.addLog(`你因中毒受到了 ${absorb.hpDamage} 点伤害。`);
      cb.addFloatingText(`-${absorb.hpDamage}`, 'text-purple-400', heartIcon(), 'player');
    }
    // 吟唱受击罚（用入射 poisonDamage 判定，屏障吸收也算"被打扰"）
    const penalty = calcMageChantHitPenalty(prev.playerClass, prev.chargeStacks, prev.mageChantHitCount, poisonDamage);
    let newHitCount = prev.mageChantHitCount;
    let newBackfire = prev.arcaneBackfire || 0;
    if (penalty) {
      newBackfire += penalty.addedStacks;
      newHitCount = penalty.newHitCount;
      chantPenaltyStacks = penalty.addedStacks;
    }
    let newHp = Math.max(0, prev.hp - absorb.hpDamage);
    if (newHp <= 0 && prev.hp > 0) {
      if (cb.hasFatalProtection(prev.relics)) {
        newHp = prev.hp;
        return { ...prev, hp: newHp, chantShield: absorb.newShield, relics: cb.triggerHourglass(prev.relics), statuses: nextStatuses, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire };
      }
      return { ...prev, hp: 0, chantShield: absorb.newShield, phase: 'gameover' as const, statuses: nextStatuses, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire };
    }
    if (prev.hp <= 0 && (prev as { phase: string }).phase !== 'gameover') {
      return { ...prev, phase: 'gameover' as const };
    }
    return { ...prev, hp: newHp, chantShield: absorb.newShield, statuses: nextStatuses, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire };
  });
  if (chantPenaltyStacks > 0) cb.addFloatingText(`法术反噬: +${chantPenaltyStacks}`, 'text-fuchsia-400', arcaneSkullIcon(), 'player');

  await new Promise(r => setTimeout(r, 600));
  if (cb.gameRef.current.hp <= 0) { cb.playSound('player_death'); return { hp: 0, waveTransitioned: false }; }

  // 2. 敌人灼烧结算（纯函数 + 副作用分离）
  let burnResult: { updatedEnemies: Enemy[]; allDead: boolean; logs: DotLogEntry[] } | null = null;
  cb.setEnemies((prev: Enemy[]) => {
    burnResult = settleEnemyBurn(prev);
    return burnResult!.updatedEnemies;
  });
  // RED-3: 副作用在 setState updater 之外执行
  if (burnResult) {
    applyDotSettlementSideEffects(burnResult.logs, cb);
  }

  await new Promise(r => setTimeout(r, 600));
  if (burnResult?.allDead) {
    await new Promise(r => setTimeout(r, ANIMATION_TIMING.enemyDeathCleanupDelay));
    // Bug-3: 胜利前清除死亡特效，避免 phase清空enemies useEffect 重复等待
    cb.setEnemyEffects({}); cb.setDyingEnemies(new Set());
    const currentGame = cb.gameRef.current;
    if (!tryWaveTransition(currentGame, cb)) cb.handleVictory();
    return { hp: cb.gameRef.current.hp, waveTransitioned: true };
  }

  // 3. 敌人中毒结算（纯函数 + 副作用分离）
  let poisonResult: { updatedEnemies: Enemy[]; allDead: boolean; logs: DotLogEntry[] } | null = null;
  cb.setEnemies((prev: Enemy[]) => {
    poisonResult = settleEnemyPoison(prev);
    return poisonResult!.updatedEnemies;
  });
  // RED-3: 副作用在 setState updater 之外执行
  if (poisonResult) {
    applyDotSettlementSideEffects(poisonResult.logs, cb);
  }

  await new Promise(r => setTimeout(r, 600));
  if (poisonResult?.allDead) {
    await new Promise(r => setTimeout(r, ANIMATION_TIMING.enemyDeathCleanupDelay));
    // Bug-3: 胜利前清除死亡特效，避免 phase清空enemies useEffect 重复等待
    cb.setEnemyEffects({}); cb.setDyingEnemies(new Set());
    const currentGame = cb.gameRef.current;
    if (!tryWaveTransition(currentGame, cb)) cb.handleVictory();
    return { hp: cb.gameRef.current.hp, waveTransitioned: true };
  }

  // 4. 每个存活敌人执行AI决策
  const currentEnemies = [...enemies];
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    await new Promise(r => setTimeout(r, 350));

    const isFrozen = e.statuses.some(s => s.type === 'freeze' && s.duration > 0);
    if (isFrozen) {
      cb.addLog(`${e.name} 被冻结，无法行动！`);
      cb.addFloatingText('冻结', 'text-cyan-400', undefined, 'enemy');
      cb.setEnemyEffectForUid(e.uid, 'shake');
      await new Promise(r => setTimeout(r, 400));
      cb.setEnemyEffectForUid(e.uid, null);
      continue;
    }

    const isSlowed = e.statuses.some(s => s.type === 'slow' && s.duration > 0);
    const isMelee = e.combatType === 'warrior' || e.combatType === 'guardian';

    if (isMelee && e.distance > 0 && isSlowed) {
      cb.addLog(`${e.name} 被减速，无法移动！`);
      continue;
    }
    if (isMelee && e.distance > 0) {
      cb.setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, distance: Math.max(0, en.distance - 1) } : en));
      cb.addLog(e.distance === 1 ? `${e.name} 逼近到近身位置！` : `${e.name} 正在逼近...(距离 ${e.distance - 1})`);
      continue;
    }

    // Guardian: 攻防交替+嘲讽；Warrior paladin 也走偶数回合防御
    let guardianDefended = false;
    cb.setGame((prev: GameState) => {
      if (e.combatType === 'guardian' && prev.battleTurn % GUARDIAN_CONFIG.defenseCycle === 0) {
        guardianDefended = true;
      } else if (paladinShouldDefendThisTurn(e, prev.battleTurn)) {
        // [PALADIN 2026-05-09] warrior 子类型 paladin：偶数回合切换为防御
        guardianDefended = true;
      }
      return prev; // 只读判断，不修改状态
    });

    if (guardianDefended) {
      await cb.enemyPreAction(e, 'defend');
      cb.setGame((prev: GameState) => {
        // [BULWARK 2026-05-09] guardian 子类型 bulwark 防御获双倍护甲
        const shieldVal = Math.floor(e.attackDmg * GUARDIAN_CONFIG.shieldMult * archetypeArmorBoost(e));
        cb.setEnemyEffectForUid(e.uid, 'defend');
        cb.playSound('enemy_defend');
        // [GUARDIAN_TRAIT 2026-05-09] 防御后累 guardRage：每层下次攻击 +60%（bulwark 已被拦下）
        cb.setEnemies(prevE => prevE.map(en =>
          en.uid === e.uid
            ? applyGuardRageOnDefend({ ...en, armor: en.armor + shieldVal })
            : en,
        ));
        cb.addLog(`${e.name} 举盾防御（+${shieldVal}护甲），并嘲讽你！`);
        return { ...prev, targetEnemyUid: e.uid };
      });
      await new Promise(r => setTimeout(r, 300));
      cb.setEnemyEffectForUid(e.uid, null);
      continue;
    }

    // Priest: 治疗→自疗→增益→减益
    if (e.combatType === 'priest') {
      await cb.enemyPreAction(e, 'heal');
      cb.setEnemyEffectForUid(e.uid, 'skill');
      cb.playSound('enemy_skill');
      // Bug-22: 使用最新敌人状态选择治疗目标（currentEnemies快照可能过时）
      const freshEnemies = cb.enemiesRef.current;
      const freshSelf = freshEnemies.find(en => en.uid === e.uid) || e;
      const allies = freshEnemies.filter(en => en.hp > 0 && en.uid !== e.uid);
      const sr = executePriestSkill(freshSelf, allies, cb.gameRef.current);
      for (const [uid, updates] of sr.enemyUpdates) {
        cb.setEnemies(prev => prev.map(en => en.uid === uid ? { ...en, ...updates } : en));
      }
      cb.setGame(prev => ({ ...prev, statuses: sr.gameUpdates.statuses(prev.statuses) }));
      if (sr.gameUpdates.ownedDice) {
        cb.setGame(prev => ({
          ...prev,
          ownedDice: sr.gameUpdates.ownedDice!,
          diceBag: sr.gameUpdates.diceBag!,
        }));
      }
      for (const log of sr.logs) cb.addLog(log);
      for (const ft of sr.floats) cb.addFloatingText(ft.text, ft.color, ft.icon, ft.target as 'player' | 'enemy');
      if (sr.sound) cb.playSound(sr.sound);
      await new Promise(r => setTimeout(r, 300));
      cb.setEnemyEffectForUid(e.uid, null);
      continue;
    }

    // Caster: DoT专属
    if (e.combatType === 'caster') {
      await cb.enemyPreAction(e, 'skill');
      cb.setEnemyEffectForUid(e.uid, 'skill');
      cb.playSound('enemy_skill');
      const sr = executeCasterSkill(e);
      cb.setGame(prev => ({ ...prev, statuses: sr.updateStatuses(prev.statuses) }));
      // [CASTER_TRAIT 2026-05-09] 施法成功后累 dotAmplifier，下次 DOT 会再 +1
      cb.setEnemies(prev => prev.map(en => en.uid === e.uid ? bumpDotAmplifier(en) : en));
      for (const log of sr.logs) cb.addLog(log);
      for (const ft of sr.floats) {
        if (ft.delay) setTimeout(() => cb.addFloatingText(ft.text, ft.color, ft.icon, ft.target as 'player' | 'enemy'), ft.delay);
        else cb.addFloatingText(ft.text, ft.color, ft.icon, ft.target as 'player' | 'enemy');
      }
      await new Promise(r => setTimeout(r, 300));
      cb.setEnemyEffectForUid(e.uid, null);
      continue;
    }

    // Warrior/Ranger/其他: 直接攻击
    await cb.enemyPreAction(e, 'attack');
    cb.setEnemyEffectForUid(e.uid, 'attack');
    cb.setScreenShake(true);

    // Ranger: 更新 attackCount 并立即获取新值
    let currentAttackCount: number | undefined;
    if (e.combatType === 'ranger') {
      const oldCount = e.attackCount || 0;
      const newCount = oldCount + ENEMY_ATTACK_MULT.rangerAttackCountStep;
      cb.setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, attackCount: newCount } : en));
      currentAttackCount = newCount;
    }

    let chantPenaltyMain = 0;
    cb.setGame((prev: GameState) => {
      const damage = getEffectiveAttackDmg(e, prev.statuses, {
        attackCount: currentAttackCount,
        isSlowed,
        arcaneBackfire: prev.arcaneBackfire,
      });

      const absorb = absorbPlayerDamage(damage, prev.chantShield || 0, prev.armor, false);
      const newHp = Math.max(0, prev.hp - absorb.hpDamage);
      const hpLost = prev.hp - newHp;

      if (absorb.absorbedByShield > 0) cb.addFloatingText(`-${absorb.absorbedByShield}`, 'text-cyan-300', arcaneShieldIcon(), 'player');
      if (absorb.absorbedByArmor > 0) cb.addFloatingText(`-${absorb.absorbedByArmor}`, 'text-blue-400', shieldIcon(), 'player');
      if (absorb.hpDamage > 0) cb.addFloatingText(`-${absorb.hpDamage}`, 'text-red-500', heartIcon(), 'player');
      if (absorb.absorbedByShield === 0 && absorb.absorbedByArmor === 0 && absorb.hpDamage === 0) cb.addFloatingText('0', 'text-gray-400', undefined, 'player');

      cb.setPlayerEffect('flash');
      cb.addLog(`${e.name} 攻击造成 ${damage} 伤害！`);
      cb.playSound('enemy');

      const delayedQuotes = tryAttackTaunt(e, damage, cb);
      for (const dq of delayedQuotes) {
        cb.scheduleDelayedQuote(dq);
      }

      // 吟唱受击罚（用入射 damage，屏障吸收也算；累加不可净化的 arcaneBackfire）
      const penalty = calcMageChantHitPenalty(prev.playerClass, prev.chargeStacks, prev.mageChantHitCount, damage);
      let newHitCount = prev.mageChantHitCount;
      let newBackfire = prev.arcaneBackfire || 0;
      if (penalty) {
        newBackfire += penalty.addedStacks;
        newHitCount = penalty.newHitCount;
        chantPenaltyMain = penalty.addedStacks;
      }

      if (newHp <= 0 && prev.hp > 0) {
        if (cb.hasFatalProtection(prev.relics)) {
          return { ...prev, hp: prev.hp, armor: prev.armor, chantShield: absorb.newShield, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire, relics: cb.triggerHourglass(prev.relics) };
        }
        return { ...prev, hp: 0, phase: 'gameover' as const, armor: absorb.newArmor, chantShield: absorb.newShield, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire };
      }
      return { ...prev, hp: newHp, armor: absorb.newArmor, chantShield: absorb.newShield, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire, hpLostThisTurn: (prev.hpLostThisTurn || 0) + hpLost, hpLostThisBattle: (prev.hpLostThisBattle || 0) + hpLost };
    });
    if (chantPenaltyMain > 0) cb.addFloatingText(`法术反噬: +${chantPenaltyMain}`, 'text-fuchsia-400', arcaneSkullIcon(), 'player');

    // on_damage_taken 遗物
    const latestGame = cb.gameRef.current;
    for (const relic of latestGame.relics.filter((r: Relic) => r.trigger === 'on_damage_taken')) {
      const ctx = cb.buildRelicContext({
        game: latestGame,
        dice,
        targetEnemy: cb.gameRef.current.battleWaves.length > 0
          ? (enemies.find((en: Enemy) => en.hp > 0) || null)
          : null,
        rerollsThisTurn: rerollCount,
        hasPlayedThisTurn: latestGame.playsLeft < latestGame.maxPlays,
      });
      const res = relic.effect(ctx);
      if (res.damage) { cb.setGame(prev => ({ ...prev, rageFireBonus: (prev.rageFireBonus || 0) + res.damage! })); cb.addToast(`${relic.name}: 下次出牌+${res.damage}伤害`, 'buff'); }
      if (res.tempDrawBonus) { cb.setGame(prev => ({ ...prev, relicTempDrawBonus: (prev.relicTempDrawBonus || 0) + res.tempDrawBonus! })); cb.addToast(`${relic.name}: 下回合+${res.tempDrawBonus}手牌`, 'buff'); }
    }

    // 怒火骰子
    const currentOwnedDice = cb.gameRef.current.ownedDice;
    const furyDice = currentOwnedDice.find(od => od.defId === 'w_fury');
    if (furyDice) {
      cb.setGame(prev => ({ ...prev, furyBonusDamage: (prev.furyBonusDamage || 0) + 1 }));
      cb.addFloatingText(`怒火+1`, 'text-orange-400', undefined, 'player');
    }

    // Ranger 追击
    if (e.combatType === 'ranger') {
      await new Promise(r => setTimeout(r, 250));
      const hitCount = currentAttackCount || 0;

      let chantPenaltyR = 0;
      let loggedSecondHit = 0;
      cb.setGame((prev: GameState) => {
        const secondHit = getRangerFollowUpDmg(e, hitCount, prev.arcaneBackfire);
        loggedSecondHit = secondHit;
        const absorb2 = absorbPlayerDamage(secondHit, prev.chantShield || 0, prev.armor, false);
        const newHp = Math.max(0, prev.hp - absorb2.hpDamage);
        const hpLost = prev.hp - newHp;

        if (absorb2.absorbedByShield > 0) cb.addFloatingText(`-${absorb2.absorbedByShield}`, 'text-cyan-300', arcaneShieldIcon(), 'player');
        if (absorb2.absorbedByArmor > 0) cb.addFloatingText(`-${absorb2.absorbedByArmor}`, 'text-blue-400', shieldIcon(), 'player');
        if (absorb2.hpDamage > 0) cb.addFloatingText(`-${absorb2.hpDamage}`, 'text-orange-400', heartIcon(), 'player');

        const penalty = calcMageChantHitPenalty(prev.playerClass, prev.chargeStacks, prev.mageChantHitCount, secondHit);
        let newHitCount = prev.mageChantHitCount;
        let newBackfire = prev.arcaneBackfire || 0;
        if (penalty) {
          newBackfire += penalty.addedStacks;
          newHitCount = penalty.newHitCount;
          chantPenaltyR = penalty.addedStacks;
        }

        if (newHp <= 0 && prev.hp > 0) {
          if (cb.hasFatalProtection(prev.relics)) {
            return { ...prev, hp: prev.hp, armor: prev.armor, chantShield: absorb2.newShield, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire, relics: cb.triggerHourglass(prev.relics) };
          }
          return { ...prev, hp: 0, phase: 'gameover' as const, armor: absorb2.newArmor, chantShield: absorb2.newShield, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire };
        }
        return { ...prev, hp: newHp, armor: absorb2.newArmor, chantShield: absorb2.newShield, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire, hpLostThisTurn: (prev.hpLostThisTurn || 0) + hpLost, hpLostThisBattle: (prev.hpLostThisBattle || 0) + hpLost };
      });
      if (chantPenaltyR > 0) cb.addFloatingText(`法术反噬: +${chantPenaltyR}`, 'text-fuchsia-400', arcaneSkullIcon(), 'player');
      cb.addLog(`${e.name} 追击造成 ${loggedSecondHit} 伤害！`);
      cb.playSound('enemy');
    }

    // [GUARDIAN_TRAIT 2026-05-09] 攻击后清空 guardRage（爆发已经体现在 damage 里）
    if (e.combatType === 'guardian') {
      cb.setEnemies(prev => prev.map(en => en.uid === e.uid ? consumeGuardRageOnAttack(en) : en));
    }

    // [TRAPPER 2026-05-09] ranger 子类型 trapper：攻击附带 1 层剧毒
    if (e.combatType === 'ranger' && e.archetype === 'trapper') {
      cb.setGame(prev => {
        const existing = prev.statuses.find(s => s.type === 'poison');
        const next = existing
          ? prev.statuses.map(s => s.type === 'poison' ? { ...s, value: s.value + 1 } : s)
          : [...prev.statuses, { type: 'poison' as const, value: 1 }];
        return { ...prev, statuses: next };
      });
      cb.addFloatingText('毒素+1', 'text-emerald-400', undefined, 'player');
    }

    await new Promise(r => setTimeout(r, 300));
    cb.setScreenShake(false);
    cb.setEnemyEffectForUid(e.uid, null);
    cb.setPlayerEffect(null);
  }

  // 5. 精英/Boss：塞废骰子
  const gameForEliteDice = cb.gameRef.current;
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    const dr = processEliteDice(e, gameForEliteDice);
    if (dr.triggered) {
      cb.setGame(prev => ({ ...prev, ...(dr.gameUpdates.ownedDice ? { ownedDice: dr.gameUpdates.ownedDice!, diceBag: dr.gameUpdates.diceBag! } : {}) }));
      for (const log of dr.logs) cb.addLog(log);
      for (const ft of dr.floats) cb.addFloatingText(ft.text, ft.color, ft.icon, ft.target as 'player' | 'enemy');
      if (dr.sound) cb.playSound(dr.sound);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // 6. 精英/Boss：叠护甲
  const gameForEliteArmor = cb.gameRef.current;
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    const ar = processEliteArmor(e, gameForEliteArmor);
    if (ar.triggered) {
      cb.setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + ar.armorVal } : en));
      cb.addLog(ar.log);
      cb.addFloatingText(ar.float.text, ar.float.color, ar.float.icon, ar.float.target as 'player' | 'enemy');
      cb.playSound(ar.sound);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // 7. 敌人回合结束→玩家回合
  // [BUG-FIX] Use gameRef real HP as default. React 18 batches setGame updaters asynchronously; if we init returnHp=0, the synchronous return fires before updater runs -> upper layer sees 0 -> false gameover trigger.
  let returnHp = cb.gameRef.current.hp;
  let chantPenaltyBurn = 0;
  cb.setGame((prev: GameState) => {
    if (prev.phase === 'gameover') {
      returnHp = prev.hp;
      return prev;
    }
    const nextTurn = prev.battleTurn + 1;
    let nextStatuses = [...prev.statuses];
    let burnDamage = 0;
    const burn = prev.statuses.find(s => s.type === 'burn');
    if (burn && burn.value > 0) {
      burnDamage = burn.value;
      nextStatuses = nextStatuses.filter(s => s.type !== 'burn');
    }
    // [2026-05-07] 灼烧 DOT：奥术屏障抵挡，护甲无效
    const absorb = absorbPlayerDamage(burnDamage, prev.chantShield || 0, prev.armor, true);
    if (absorb.absorbedByShield > 0) {
      cb.addLog(`奥术屏障吸收了 ${absorb.absorbedByShield} 点灼烧伤害。`);
      cb.addFloatingText(`-${absorb.absorbedByShield}`, 'text-cyan-300', arcaneShieldIcon(), 'player');
    }
    if (absorb.hpDamage > 0) {
      cb.addLog(`你因灼烧受到了 ${absorb.hpDamage} 点伤害。`);
      cb.addFloatingText(`-${absorb.hpDamage}`, 'text-orange-500', heartIcon(), 'player');
    }
    nextStatuses = tickStatuses(nextStatuses);
    // 吟唱被灼烧打扰（用入射 burnDamage，屏障吸收也算；累加不可净化的 arcaneBackfire）
    const penalty = calcMageChantHitPenalty(prev.playerClass, prev.chargeStacks, prev.mageChantHitCount, burnDamage);
    let newHitCount = prev.mageChantHitCount;
    let newBackfire = prev.arcaneBackfire || 0;
    if (penalty) {
      newBackfire += penalty.addedStacks;
      newHitCount = penalty.newHitCount;
      chantPenaltyBurn = penalty.addedStacks;
    }
    let newHp = Math.max(0, prev.hp - absorb.hpDamage);
    if (newHp <= 0 && prev.hp > 0) {
      if (cb.hasFatalProtection(prev.relics)) {
        newHp = prev.hp;
        returnHp = newHp;
        return { ...prev, battleTurn: nextTurn, hp: newHp, chantShield: absorb.newShield, statuses: nextStatuses, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire, isEnemyTurn: false, relics: cb.triggerHourglass(prev.relics) };
      }
      returnHp = 0;
      return { ...prev, battleTurn: nextTurn, hp: 0, chantShield: absorb.newShield, phase: 'gameover' as const, statuses: nextStatuses, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire, isEnemyTurn: false };
    }
    if (prev.hp <= 0 && (prev as { phase: string }).phase !== 'gameover') {
      returnHp = 0;
      return { ...prev, battleTurn: nextTurn, phase: 'gameover' as const, isEnemyTurn: false };
    }
    returnHp = newHp;
    return { ...prev, battleTurn: nextTurn, hp: newHp, chantShield: absorb.newShield, statuses: nextStatuses, mageChantHitCount: newHitCount, arcaneBackfire: newBackfire, isEnemyTurn: false };
  });
  if (chantPenaltyBurn > 0) cb.addFloatingText(`法术反噬: +${chantPenaltyBurn}`, 'text-fuchsia-400', arcaneSkullIcon(), 'player');

  return { hp: returnHp, waveTransitioned: false };
}
