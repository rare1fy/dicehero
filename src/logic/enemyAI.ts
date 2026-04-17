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
 *
 * [ARCH-6 Round 3] 修复清单：
 * - RED-1: 所有伤害计算/浮动文字移入 setGame 回调，使用 prev 而非 gameRef.current
 * - RED-2: game 过期快照读取移入 setGame(prev => ...) 回调内
 * - RED-3: Ranger 追击使用最新 attackCount
 * - RED-5: battleTurn % 2 替换为 GUARDIAN_CONFIG.defenseCycle
 * - Y1: addFloatingText icon 类型改为 string | undefined，消除 React 依赖
 * - Y2: 高伤台词延迟由调用方执行（不再在逻辑层 setTimeout）
 */

import type { Enemy, GameState, Die, Relic } from '../types/game';
import type { buildRelicContext as BuildRelicContextFn } from '../engine/buildRelicContext';
import { hasFatalProtection as HasFatalProtectionFn } from '../engine/relicQueries';
import { triggerHourglass as TriggerHourglassFn } from '../engine/relicUpdates';
import { getEffectiveAttackDmg, getRangerFollowUpDmg } from './attackCalc';
import { executePriestSkill, executeCasterSkill, tickStatuses } from './enemySkills';
import { processEliteDice, processEliteArmor } from './elites';
import { tryAttackTaunt, type DelayedQuoteAction } from './enemyDialogue';
import { tryWaveTransition } from './enemyWaveTransition';
import { GUARDIAN_CONFIG, ENEMY_ATTACK_MULT } from '../config';

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
  addFloatingText: (text: string, color: string, icon?: string, target?: 'player' | 'enemy', large?: boolean) => void;
  addToast: (msg: string, type: string) => void;
  playSound: (id: string) => void;
  setScreenShake: (v: boolean) => void;
  setPlayerEffect: (v: string | null) => void;
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
export async function executeEnemyTurn(
  game: GameState,
  enemies: Enemy[],
  dice: Die[],
  rerollCount: number,
  cb: EnemyAICallbacks
): Promise<number> {
  // 0. 标记进入敌人回合
  cb.setGame(prev => ({ ...prev, isEnemyTurn: true, bloodRerollCount: 0, comboCount: 0, lastPlayHandType: undefined, blackMarketUsedThisTurn: false }));

  // 1. 玩家中毒结算（E5: death check 在回调内部完成）
  cb.setGame((prev: GameState) => {
    let nextStatuses = [...prev.statuses];
    let poisonDamage = 0;
    const poison = prev.statuses.find(s => s.type === 'poison');
    if (poison && poison.value > 0) {
      poisonDamage = poison.value;
      cb.addLog(`你因中毒受到了 ${poisonDamage} 点伤害。`);
      cb.addFloatingText(`-${poisonDamage}`, 'text-purple-400', undefined, 'player');
      nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
    }
    let newHp = Math.max(0, prev.hp - poisonDamage);
    if (newHp <= 0 && prev.hp > 0) {
      if (cb.hasFatalProtection(prev.relics)) {
        newHp = prev.hp;
        return { ...prev, hp: newHp, relics: cb.triggerHourglass(prev.relics), statuses: nextStatuses };
      }
      return { ...prev, hp: 0, phase: 'gameover' as const, statuses: nextStatuses };
    }
    return { ...prev, hp: newHp, statuses: nextStatuses };
  });

  await new Promise(r => setTimeout(r, 600));
  if (cb.gameRef.current.hp <= 0) { cb.playSound('player_death'); return 0; }

  // 2. 敌人灼烧结算（E4: 全灭判定在 setEnemies 回调内用 prev 计算）
  let allBurnedDead = false;
  cb.setEnemies((prev: Enemy[]) => {
    const deaths: string[] = [];
    const result = prev.map(e => {
      if (e.hp <= 0) return e;
      const burn = e.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        const dmg = burn.value;
        cb.addLog(`${e.name} 因灼烧受到了 ${dmg} 点伤害。`);
        cb.addFloatingText(`-${dmg}`, 'text-orange-500', undefined, 'enemy');
        const nextStatuses = e.statuses.filter(s => s.type !== 'burn');
        const newHp = Math.max(0, e.hp - dmg);
        if (newHp <= 0) deaths.push(e.uid);
        return { ...e, hp: newHp, statuses: nextStatuses, armor: 0 };
      }
      return { ...e, armor: 0 };
    });
    allBurnedDead = result.filter(e => e.hp > 0).length === 0 && deaths.length > 0;
    return result;
  });

  await new Promise(r => setTimeout(r, 600));
  if (allBurnedDead) {
    // RED-2: tryWaveTransition 使用 gameRef.current 获取最新状态
    const currentGame = cb.gameRef.current;
    if (!tryWaveTransition(currentGame, cb)) cb.handleVictory();
    return cb.gameRef.current.hp;
  }

  // 3. 敌人中毒结算（E4: 同上）
  let allPoisonedDead = false;
  cb.setEnemies((prev: Enemy[]) => {
    const deaths: string[] = [];
    const result = prev.map(e => {
      if (e.hp <= 0) return e;
      let nextStatuses = [...e.statuses];
      const poison = nextStatuses.find(s => s.type === 'poison');
      if (poison && poison.value > 0) {
        cb.addLog(`${e.name} 因中毒受到了 ${poison.value} 点伤害。`);
        cb.addFloatingText(`-${poison.value}`, 'text-purple-400', undefined, 'enemy');
        nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
        const newHp = Math.max(0, e.hp - poison.value);
        if (newHp <= 0) deaths.push(e.uid);
        nextStatuses = tickStatuses(nextStatuses);
        return { ...e, hp: newHp, statuses: nextStatuses };
      }
      nextStatuses = tickStatuses(nextStatuses);
      return { ...e, statuses: nextStatuses };
    });
    allPoisonedDead = result.filter(e => e.hp > 0).length === 0 && deaths.length > 0;
    return result;
  });

  await new Promise(r => setTimeout(r, 600));
  if (allPoisonedDead) {
    // RED-2: tryWaveTransition 使用 gameRef.current 获取最新状态
    const currentGame = cb.gameRef.current;
    if (!tryWaveTransition(currentGame, cb)) cb.handleVictory();
    return cb.gameRef.current.hp;
  }

  // 4. 每个存活敌人执行AI决策
  // [RED-2] currentEnemies 仅用于循环迭代和只读字段（name, uid, combatType 等），
  // 这些字段不会在 async 操作期间变化，快照安全。
  // 但 battleTurn / statuses / armor 等会在 async 期间变化的值，
  // 必须从 setGame(prev => ...) 的 prev 参数中读取。
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

    // Guardian: 攻防交替+嘲讽
    // [RED-2] battleTurn 读取移入 setGame 回调，使用 prev.battleTurn
    // [RED-5] 使用 GUARDIAN_CONFIG.defenseCycle 代替魔法数字 2
    let guardianDefended = false;
    cb.setGame((prev: GameState) => {
      if (e.combatType === 'guardian' && prev.battleTurn % GUARDIAN_CONFIG.defenseCycle === 0) {
        guardianDefended = true;
      }
      return prev; // 只读判断，不修改状态
    });

    if (guardianDefended) {
      await cb.enemyPreAction(e, 'defend');
      cb.setGame((prev: GameState) => {
        const shieldVal = Math.floor(e.attackDmg * GUARDIAN_CONFIG.shieldMult);
        cb.setEnemyEffectForUid(e.uid, 'defend');
        cb.playSound('enemy_defend');
        cb.setEnemies(prevE => prevE.map(en => en.uid === e.uid ? { ...en, armor: en.armor + shieldVal } : en));
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
      // [RED-2] 传入 gameRef.current 而非快照 game，保证 battleTurn 等字段最新
      const allies = currentEnemies.filter(en => en.hp > 0 && en.uid !== e.uid);
      const sr = executePriestSkill(e, allies, cb.gameRef.current);
      for (const [uid, updates] of sr.enemyUpdates) {
        cb.setEnemies(prev => prev.map(en => en.uid === uid ? { ...en, ...updates } : en));
      }
      // [RED-4] statuses 始终为函数，直接调用；ownedDice/diceBag 为可选字段
      cb.setGame(prev => ({ ...prev, statuses: sr.gameUpdates.statuses(prev.statuses) }));
      if (sr.gameUpdates.ownedDice) {
        cb.setGame(prev => ({
          ...prev,
          ownedDice: sr.gameUpdates.ownedDice!,
          diceBag: sr.gameUpdates.diceBag!,
        }));
      }
      for (const log of sr.logs) cb.addLog(log);
      for (const ft of sr.floats) cb.addFloatingText(ft.text, ft.color, undefined, ft.target as 'player' | 'enemy');
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
      for (const log of sr.logs) cb.addLog(log);
      for (const ft of sr.floats) {
        if (ft.delay) setTimeout(() => cb.addFloatingText(ft.text, ft.color, undefined, ft.target as 'player' | 'enemy'), ft.delay);
        else cb.addFloatingText(ft.text, ft.color, undefined, ft.target as 'player' | 'enemy');
      }
      await new Promise(r => setTimeout(r, 300));
      cb.setEnemyEffectForUid(e.uid, null);
      continue;
    }

    // Warrior/Ranger/其他: 直接攻击
    await cb.enemyPreAction(e, 'attack');
    cb.setEnemyEffectForUid(e.uid, 'attack');
    cb.setScreenShake(true);

    // [RED-3] Ranger: 更新 attackCount 并立即获取新值
    let currentAttackCount: number | undefined;
    if (e.combatType === 'ranger') {
      const oldCount = e.attackCount || 0;
      const newCount = oldCount + ENEMY_ATTACK_MULT.rangerAttackCountStep;
      cb.setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, attackCount: newCount } : en));
      currentAttackCount = newCount;
    }

    // [RED-1] 所有伤害计算和浮动文字移入 setGame 回调，使用 prev
    cb.setGame((prev: GameState) => {
      // 伤害计算使用 prev.statuses（而非 gameRef.current.statuses）
      const damage = getEffectiveAttackDmg(e, prev.statuses, {
        attackCount: currentAttackCount,
        isSlowed,
      });

      let newArmor = prev.armor;
      let newHp = prev.hp;
      let absorbed = 0;
      if (newArmor > 0) { absorbed = Math.min(newArmor, damage); newArmor -= absorbed; }
      const hpDmg = damage - absorbed;
      if (hpDmg > 0) newHp = Math.max(0, newHp - hpDmg);
      const hpLost = prev.hp - newHp;

      // 浮动文字与实际扣血一致（都在同一个 setGame 回调中计算）
      if (absorbed > 0) cb.addFloatingText(`-${absorbed}`, 'text-blue-400', undefined, 'player');
      if (hpDmg > 0) cb.addFloatingText(`-${hpDmg}`, 'text-red-500', undefined, 'player');
      if (absorbed === 0 && hpDmg === 0) cb.addFloatingText('0', 'text-gray-400', undefined, 'player');

      cb.setPlayerEffect('flash');
      cb.addLog(`${e.name} 攻击造成 ${damage} 伤害！`);
      cb.playSound('enemy');

      // [Y2] 高伤台词延迟由调用方执行
      const delayedQuotes = tryAttackTaunt(e, damage, cb);
      for (const dq of delayedQuotes) {
        cb.scheduleDelayedQuote(dq);
      }

      if (newHp <= 0 && prev.hp > 0 && cb.hasFatalProtection(prev.relics)) {
        return { ...prev, hp: prev.hp, armor: prev.armor, relics: cb.triggerHourglass(prev.relics) };
      }
      return { ...prev, hp: newHp, armor: newArmor, hpLostThisTurn: (prev.hpLostThisTurn || 0) + hpLost, hpLostThisBattle: (prev.hpLostThisBattle || 0) + hpLost };
    });

    // [RED-2] on_damage_taken 遗物：使用 gameRef.current 获取最新状态
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

    // [RED-2] 怒火骰子：使用 gameRef.current.ownedDice
    const currentOwnedDice = cb.gameRef.current.ownedDice;
    const furyDice = currentOwnedDice.find(od => od.defId === 'w_fury');
    if (furyDice) {
      const furyLevel = furyDice.level || 1;
      cb.setGame(prev => ({ ...prev, furyBonusDamage: (prev.furyBonusDamage || 0) + furyLevel }));
      cb.addFloatingText(`怒火+${furyLevel}`, 'text-orange-400', undefined, 'player');
    }

    // Ranger 追击（W2: 致命保护, W3: hpLost 统计）
    if (e.combatType === 'ranger') {
      await new Promise(r => setTimeout(r, 250));
      // [RED-3] 使用更新后的 currentAttackCount
      const hitCount = currentAttackCount || 0;
      const secondHit = getRangerFollowUpDmg(e, hitCount);

      // [RED-1] 追击伤害计算和浮动文字也移入 setGame 回调
      cb.setGame((prev: GameState) => {
        let newArmor = prev.armor;
        let newHp = prev.hp;
        let abs2 = 0;
        if (newArmor > 0) { abs2 = Math.min(newArmor, secondHit); newArmor -= abs2; }
        const hpD2 = secondHit - abs2;
        if (hpD2 > 0) newHp = Math.max(0, newHp - hpD2);
        const hpLost = prev.hp - newHp;

        // 浮动文字与实际扣血一致
        if (abs2 > 0) cb.addFloatingText(`-${abs2}`, 'text-blue-400', undefined, 'player');
        if (hpD2 > 0) cb.addFloatingText(`-${hpD2}`, 'text-orange-400', undefined, 'player');

        if (newHp <= 0 && prev.hp > 0 && cb.hasFatalProtection(prev.relics)) {
          return { ...prev, hp: prev.hp, armor: prev.armor, relics: cb.triggerHourglass(prev.relics) };
        }
        return { ...prev, hp: newHp, armor: newArmor, hpLostThisTurn: (prev.hpLostThisTurn || 0) + hpLost, hpLostThisBattle: (prev.hpLostThisBattle || 0) + hpLost };
      });
      cb.addLog(`${e.name} 追击造成 ${secondHit} 伤害！`);
      cb.playSound('enemy');
    }

    await new Promise(r => setTimeout(r, 300));
    cb.setScreenShake(false);
    cb.setEnemyEffectForUid(e.uid, null);
    cb.setPlayerEffect(null);
  }

  // 5. 精英/Boss：塞废骰子
  // [RED-2] 使用 gameRef.current 获取最新状态
  const gameForEliteDice = cb.gameRef.current;
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    const dr = processEliteDice(e, gameForEliteDice);
    if (dr.triggered) {
      cb.setGame(prev => ({ ...prev, ...(dr.gameUpdates.ownedDice ? { ownedDice: dr.gameUpdates.ownedDice!, diceBag: dr.gameUpdates.diceBag! } : {}) }));
      for (const log of dr.logs) cb.addLog(log);
      for (const ft of dr.floats) cb.addFloatingText(ft.text, ft.color, undefined, ft.target as 'player' | 'enemy');
      if (dr.sound) cb.playSound(dr.sound);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // 6. 精英/Boss：叠护甲
  // [RED-2] 使用 gameRef.current 获取最新状态
  const gameForEliteArmor = cb.gameRef.current;
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    const ar = processEliteArmor(e, gameForEliteArmor);
    if (ar.triggered) {
      cb.setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + ar.armorVal } : en));
      cb.addLog(ar.log);
      cb.addFloatingText(ar.float.text, ar.float.color, undefined, ar.float.target as 'player' | 'enemy');
      cb.playSound(ar.sound);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // 7. 敌人回合结束→玩家回合（E5: death check 在回调内部, W7: 删除死代码）
  let returnHp = 0;
  cb.setGame((prev: GameState) => {
    const nextTurn = prev.battleTurn + 1;
    let nextStatuses = [...prev.statuses];
    let burnDamage = 0;
    const burn = prev.statuses.find(s => s.type === 'burn');
    if (burn && burn.value > 0) {
      burnDamage = burn.value;
      cb.addLog(`你因灼烧受到了 ${burnDamage} 点伤害。`);
      cb.addFloatingText(`-${burnDamage}`, 'text-orange-500', undefined, 'player');
      nextStatuses = nextStatuses.filter(s => s.type !== 'burn');
    }
    nextStatuses = tickStatuses(nextStatuses);
    let newHp = Math.max(0, prev.hp - burnDamage);
    if (newHp <= 0 && prev.hp > 0) {
      if (cb.hasFatalProtection(prev.relics)) {
        newHp = prev.hp;
        returnHp = newHp;
        return { ...prev, battleTurn: nextTurn, hp: newHp, statuses: nextStatuses, isEnemyTurn: false, relics: cb.triggerHourglass(prev.relics) };
      }
    }
    returnHp = newHp;
    return { ...prev, battleTurn: nextTurn, hp: newHp, statuses: nextStatuses, isEnemyTurn: false };
  });

  return returnHp;
}
