/**
 * enemyAI.ts — 敌人回合AI逻辑
 * 
 * 从 DiceHeroGame.tsx endTurn 函数中提取的敌人AI决策模块。
 * 包含：灼烧/中毒结算、5种combatType决策、精英Boss特殊行为、回合结束处理。
 * 
 * [RULES-B4-EXEMPT] 大型switch/case + 回调接口：5种combatType决策是同一抽象层级的枚举
 */

import type { Enemy, GameState, Die, StatusEffect, Relic } from '../types/game';
import type { buildRelicContext as BuildRelicContextFn } from '../engine/buildRelicContext';
import { hasFatalProtection as HasFatalProtectionFn, triggerHourglass as TriggerHourglassFn } from '../engine/relicQueries';
import { generateChallenge } from '../utils/instakillChallenge';

// === EnemyAI 回调接口 ===
// enemyAI 不直接依赖 React，通过回调与组件通信

export interface EnemyAICallbacks {
  // React 状态更新
  setGame: (update: GameState | ((prev: GameState) => GameState)) => void;
  setEnemies: (update: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  setEnemyEffects: (update: Record<string, string | null> | ((prev: Record<string, string | null>) => Record<string, string | null>)) => void;
  setDyingEnemies: (update: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  
  // UI/演出回调
  setEnemyEffectForUid: (uid: string, effect: string | null) => void;
  enemyPreAction: (e: Enemy, quoteType: string) => Promise<boolean>;
  addLog: (msg: string) => void;
  addFloatingText: (text: string, color: string, icon?: any, target?: string, large?: boolean) => void;
  addToast: (msg: string, type: string) => void;
  playSound: (id: string) => void;
  setScreenShake: (v: boolean) => void;
  setPlayerEffect: (v: string | null) => void;
  showEnemyQuote: (uid: string, text: string, duration?: number) => void;
  getEnemyQuotes: (enemyId: string) => { attack?: string[]; defend?: string[]; skill?: string[]; heal?: string[]; enter?: string[]; hurt?: string[] } | undefined;
  pickQuote: (arr?: string[]) => string | null;
  setRerollCount: (v: number | ((prev: number) => number)) => void;
  setWaveAnnouncement: (v: number | null) => void;
  setDice: (v: Die[]) => void;
  rollAllDice: (force?: boolean) => void;
  
  // 引擎函数
  buildRelicContext: typeof BuildRelicContextFn;
  hasFatalProtection: typeof HasFatalProtectionFn;
  triggerHourglass: typeof TriggerHourglassFn;
  
  // 胜利回调
  handleVictory: () => void;
  
  // 读取最新 game state 的 ref
  gameRef: { current: GameState };
}

// === 辅助函数 ===

/** 状态持续期递减 */
function tickStatuses(statuses: StatusEffect[]): StatusEffect[] {
  return statuses
    .map(s => {
      if (s.type === 'poison' || s.type === 'burn') return s;
      if (s.duration !== undefined) return { ...s, duration: s.duration - 1 };
      return { ...s, value: s.value - 1 };
    })
    .filter(s => {
      if (s.type === 'poison' || s.type === 'burn') return s.value > 0;
      if (s.duration !== undefined) return s.duration > 0;
      return s.value > 0;
    });
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
 * 
 * @returns currentPlayerHp 玩家当前HP（用于判断死亡）
 */
export async function executeEnemyTurn(
  game: GameState,
  enemies: Enemy[],
  dice: Die[],
  rerollCount: number,
  cb: EnemyAICallbacks
): Promise<number> {
  // 0. 标记进入敌人回合
  cb.setGame((prev: GameState) => ({ ...prev, isEnemyTurn: true, bloodRerollCount: 0, comboCount: 0, lastPlayHandType: undefined, blackMarketUsedThisTurn: false }));

  // 1. 玩家回合结束：中毒结算
  let currentPlayerHp = game.hp;
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
    currentPlayerHp = Math.max(0, prev.hp - poisonDamage);
    if (currentPlayerHp <= 0 && prev.hp > 0) {
      if (cb.hasFatalProtection(prev.relics)) {
        currentPlayerHp = prev.hp;
        return { ...prev, hp: currentPlayerHp, relics: cb.triggerHourglass(prev.relics) };
      }
    }
    return { ...prev, hp: currentPlayerHp, statuses: nextStatuses };
  });

  await new Promise(r => setTimeout(r, 600));
  if (currentPlayerHp <= 0) { cb.playSound('player_death'); cb.setGame((prev: GameState) => ({ ...prev, phase: 'gameover' })); return 0; }

  // 2. 敌人灼烧结算
  let enemyDeathsFromBurn: string[] = [];
  cb.setEnemies((prev: Enemy[]) => prev.map(e => {
    if (e.hp <= 0) return e;
    const burn = e.statuses.find(s => s.type === 'burn');
    if (burn && burn.value > 0) {
      const dmg = burn.value;
      cb.addLog(`${e.name} 因灼烧受到了 ${dmg} 点伤害。`);
      cb.addFloatingText(`-${dmg}`, 'text-orange-500', undefined, 'enemy');
      const nextStatuses = e.statuses.filter(s => s.type !== 'burn');
      const newHp = Math.max(0, e.hp - dmg);
      if (newHp <= 0) enemyDeathsFromBurn.push(e.uid);
      return { ...e, hp: newHp, statuses: nextStatuses, armor: 0 };
    }
    return { ...e, armor: 0 };
  }));

  await new Promise(r => setTimeout(r, 600));

  // 灼烧全灭→转波
  const aliveAfterBurn = enemies.filter(e => e.hp > 0 && !enemyDeathsFromBurn.includes(e.uid));
  if (aliveAfterBurn.length === 0 && enemyDeathsFromBurn.length > 0) {
    const transitioned = tryWaveTransition(game, cb);
    if (!transitioned) cb.handleVictory();
    return currentPlayerHp;
  }

  // 3. 敌人中毒结算
  const enemyDeathsFromPoison: string[] = [];
  cb.setEnemies((prev: Enemy[]) => prev.map(e => {
    if (e.hp <= 0) return e;
    let nextStatuses = [...e.statuses];
    const poison = nextStatuses.find(s => s.type === 'poison');
    if (poison && poison.value > 0) {
      cb.addLog(`${e.name} 因中毒受到了 ${poison.value} 点伤害。`);
      cb.addFloatingText(`-${poison.value}`, 'text-purple-400', undefined, 'enemy');
      nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
      const newHp = Math.max(0, e.hp - poison.value);
      if (newHp <= 0) enemyDeathsFromPoison.push(e.uid);
      nextStatuses = tickStatuses(nextStatuses);
      return { ...e, hp: newHp, statuses: nextStatuses };
    }
    nextStatuses = tickStatuses(nextStatuses);
    return { ...e, statuses: nextStatuses };
  }));

  await new Promise(r => setTimeout(r, 600));

  // 中毒全灭→转波
  const aliveAfterPoison = enemies.filter(e => e.hp > 0 && !enemyDeathsFromPoison.includes(e.uid));
  if (aliveAfterPoison.length === 0 && enemyDeathsFromPoison.length > 0) {
    const transitioned = tryWaveTransition(game, cb);
    if (!transitioned) cb.handleVictory();
    return currentPlayerHp;
  }

  // 4. 每个存活敌人执行AI决策
  const currentEnemies = [...enemies];
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    await new Promise(r => setTimeout(r, 350));

    // 冻结检查
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

    // 近战接近
    if (isMelee && e.distance > 0 && isSlowed) {
      cb.addLog(`${e.name} 被减速，无法移动！`);
      continue;
    }
    if (isMelee && e.distance > 0) {
      cb.setEnemies((prev: Enemy[]) => prev.map(en =>
        en.uid === e.uid ? { ...en, distance: Math.max(0, en.distance - 1) } : en
      ));
      if (e.distance === 1) {
        cb.addLog(`${e.name} 逼近到近身位置！`);
      } else {
        cb.addLog(`${e.name} 正在逼近...(距离 ${e.distance - 1})`);
      }
      continue;
    }

    // Guardian: 攻防交替+嘲讽
    if (e.combatType === 'guardian') {
      if (game.battleTurn % 2 === 0) {
        await cb.enemyPreAction(e, 'defend');
        const shieldVal = Math.floor(e.attackDmg * 1.5);
        cb.setEnemyEffectForUid(e.uid, 'defend');
        cb.playSound('enemy_defend');
        cb.setEnemies((prev: Enemy[]) => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + shieldVal } : en));
        cb.setGame((prev: GameState) => ({ ...prev, targetEnemyUid: e.uid }));
        cb.addLog(`${e.name} 举盾防御（+${shieldVal}护甲），并嘲讽你！`);
        await new Promise(r => setTimeout(r, 300));
        cb.setEnemyEffectForUid(e.uid, null);
        continue;
      }
    }

    // Priest: 治疗→自疗→增益→减益
    if (e.combatType === 'priest') {
      await cb.enemyPreAction(e, 'heal');
      cb.setEnemyEffectForUid(e.uid, 'skill');
      cb.playSound('enemy_skill');
      const allies = currentEnemies.filter(en => en.hp > 0 && en.uid !== e.uid);
      const damagedAllies = allies.filter(en => en.hp < en.maxHp);
      const selfDamaged = e.hp < e.maxHp;

      if (damagedAllies.length > 0) {
        const lowestAlly = damagedAllies.reduce((a, b) => (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b);
        const healVal = Math.floor(e.attackDmg * 4.0);
        cb.setEnemies((prev: Enemy[]) => prev.map(en => en.uid === lowestAlly.uid ? { ...en, hp: Math.min(en.maxHp, en.hp + healVal) } : en));
        cb.addLog(`${e.name} 治疗了 ${lowestAlly.name} ${healVal} HP。`);
        cb.addFloatingText(`+${healVal}`, 'text-emerald-500', undefined, 'enemy');
        cb.playSound('enemy_heal');
      } else if (selfDamaged) {
        const healVal = Math.floor(e.attackDmg * 3.0);
        cb.setEnemies((prev: Enemy[]) => prev.map(en => en.uid === e.uid ? { ...en, hp: Math.min(en.maxHp, en.hp + healVal) } : en));
        cb.addLog(`${e.name} 治疗自己 ${healVal} HP。`);
        cb.playSound('enemy_heal');
      } else if (allies.length > 0) {
        const target = allies[Math.floor(Math.random() * allies.length)];
        if (game.battleTurn % 2 === 0) {
          cb.setEnemies((prev: Enemy[]) => prev.map(en => {
            if (en.uid !== target.uid) return en;
            const existing = en.statuses.find(s => s.type === 'strength');
            if (existing) {
              return { ...en, statuses: en.statuses.map(s => s.type === 'strength' ? { ...s, value: s.value + 3 } : s) };
            }
            return { ...en, statuses: [...en.statuses, { type: 'strength' as any, value: 3 }] };
          }));
          cb.addLog(`${e.name} 为 ${target.name} 施加了力量强化！`);
          cb.addFloatingText('力量+3', 'text-red-400', undefined, 'enemy');
        } else {
          const armorVal = Math.floor(e.attackDmg * 3);
          cb.setEnemies((prev: Enemy[]) => prev.map(en => en.uid === target.uid ? { ...en, armor: en.armor + armorVal } : en));
          cb.addLog(`${e.name} 为 ${target.name} 施加了护甲祝福（+${armorVal}护甲）！`);
          cb.addFloatingText(`护甲+${armorVal}`, 'text-cyan-400', undefined, 'enemy');
        }
      } else {
        // 无队友：减益玩家
        const debuffRoll = Math.random();
        if (debuffRoll < 0.35) {
          cb.setGame((prev: GameState) => {
            const weakStatus = prev.statuses.find(s => s.type === 'weak');
            if (weakStatus) {
              return { ...prev, statuses: prev.statuses.map(s => s.type === 'weak' ? { ...s, value: s.value + 1, duration: 3 } : s) };
            }
            return { ...prev, statuses: [...prev.statuses, { type: 'weak' as any, value: 1, duration: 3 }] };
          });
          cb.addLog(`${e.name} 对你施加了虚弱！`);
          cb.addFloatingText('虚弱!', 'text-purple-400', undefined, 'player');
        } else if (debuffRoll < 0.6) {
          cb.setGame((prev: GameState) => {
            const vulnStatus = prev.statuses.find(s => s.type === 'vulnerable');
            if (vulnStatus) {
              return { ...prev, statuses: prev.statuses.map(s => s.type === 'vulnerable' ? { ...s, value: s.value + 1, duration: 3 } : s) };
            }
            return { ...prev, statuses: [...prev.statuses, { type: 'vulnerable' as any, value: 1, duration: 3 }] };
          });
          cb.addLog(`${e.name} 对你施加了易伤！`);
          cb.addFloatingText('易伤!', 'text-orange-400', undefined, 'player');
        } else {
          const curseDice = Math.random() < 0.5 ? 'cursed' : 'cracked';
          const curseName = curseDice === 'cursed' ? '诅咒骰子' : '碎裂骰子';
          cb.setGame((prev: GameState) => ({
            ...prev,
            ownedDice: [...prev.ownedDice, { defId: curseDice, level: 1 }],
            diceBag: [...prev.diceBag, curseDice],
          }));
          cb.addLog(`${e.name} 向你的骰子库塞入了一颗${curseName}！`);
          cb.addFloatingText(`+${curseName}`, 'text-red-400', undefined, 'player');
          cb.playSound('enemy_skill');
        }
      }

      await new Promise(r => setTimeout(r, 300));
      cb.setEnemyEffectForUid(e.uid, null);
      continue;
    }

    // Caster: DoT专属
    if (e.combatType === 'caster') {
      await cb.enemyPreAction(e, 'skill');
      cb.setEnemyEffectForUid(e.uid, 'skill');
      cb.playSound('enemy_skill');

      const dotRoll = Math.random();
      if (dotRoll < 0.4) {
        const poisonVal = Math.max(2, Math.floor(e.attackDmg * 0.4));
        cb.setGame((prev: GameState) => {
          const existing = prev.statuses.find(s => s.type === 'poison');
          if (existing) {
            return { ...prev, statuses: prev.statuses.map(s => s.type === 'poison' ? { ...s, value: s.value + poisonVal } : s) };
          }
          return { ...prev, statuses: [...prev.statuses, { type: 'poison' as any, value: poisonVal }] };
        });
        cb.addLog(`${e.name} 释放毒雾，施加了 ${poisonVal} 层毒素！`);
        cb.addFloatingText(`毒素+${poisonVal}`, 'text-emerald-400', undefined, 'player');
      } else if (dotRoll < 0.7) {
        const burnVal = Math.max(1, Math.floor(e.attackDmg * 0.3));
        cb.setGame((prev: GameState) => {
          const existing = prev.statuses.find(s => s.type === 'burn');
          if (existing) {
            return { ...prev, statuses: prev.statuses.map(s => s.type === 'burn' ? { ...s, value: s.value + burnVal, duration: 3 } : s) };
          }
          return { ...prev, statuses: [...prev.statuses, { type: 'burn' as any, value: burnVal, duration: 3 }] };
        });
        cb.addLog(`${e.name} 释放火球，施加了灼烧！`);
        cb.addFloatingText(`灼烧+${burnVal}`, 'text-orange-400', undefined, 'player');
      } else {
        const poisonVal = Math.max(1, Math.floor(e.attackDmg * 0.25));
        cb.setGame((prev: GameState) => {
          let newStatuses = [...prev.statuses];
          const existingPoison = newStatuses.find(s => s.type === 'poison');
          if (existingPoison) {
            newStatuses = newStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value + poisonVal } : s);
          } else {
            newStatuses.push({ type: 'poison' as any, value: poisonVal });
          }
          const existingWeak = newStatuses.find(s => s.type === 'weak');
          if (existingWeak) {
            newStatuses = newStatuses.map(s => s.type === 'weak' ? { ...s, value: s.value + 1, duration: 2 } : s);
          } else {
            newStatuses.push({ type: 'weak' as any, value: 1, duration: 2 });
          }
          return { ...prev, statuses: newStatuses };
        });
        cb.addLog(`${e.name} 施放诅咒，施加了毒素和虚弱！`);
        cb.addFloatingText(`毒素+${poisonVal}`, 'text-emerald-400', undefined, 'player');
        setTimeout(() => cb.addFloatingText('虚弱', 'text-purple-400', undefined, 'player'), 200);
      }

      await new Promise(r => setTimeout(r, 300));
      cb.setEnemyEffectForUid(e.uid, null);
      continue;
    }

    // Warrior/Ranger/其他: 直接攻击
    await cb.enemyPreAction(e, 'attack');
    cb.setEnemyEffectForUid(e.uid, 'attack');
    cb.setScreenShake(true);

    let damage = e.attackDmg;
    if (e.combatType === 'warrior') {
      damage = Math.floor(damage * 1.3);
    }
    if (e.combatType === 'ranger') {
      const hitCount = e.attackCount || 0;
      damage = Math.max(1, Math.floor(damage * 0.40) + hitCount);
      if (isSlowed) damage = Math.floor(damage * 0.5);
      cb.setEnemies((prev: Enemy[]) => prev.map(en => en.uid === e.uid ? { ...en, attackCount: hitCount + 2 } : en));
    }
    const str = e.statuses.find(s => s.type === 'strength');
    if (str) damage += str.value;
    const weak = e.statuses.find(s => s.type === 'weak');
    if (weak) damage = Math.max(1, Math.floor(damage * 0.75));

    const preArmor = cb.gameRef.current.armor;
    const preAbsorbed = Math.min(preArmor, damage);
    const preHpDmg = damage - preAbsorbed;

    cb.setGame((prev: GameState) => {
      let newArmor = prev.armor;
      let newHp = prev.hp;
      let absorbed = 0;
      if (newArmor > 0) {
        absorbed = Math.min(newArmor, damage);
        newArmor -= absorbed;
      }
      const hpDmg = damage - absorbed;
      if (hpDmg > 0) newHp = Math.max(0, newHp - hpDmg);
      if (newHp <= 0 && prev.hp > 0) {
        if (cb.hasFatalProtection(prev.relics)) {
          newHp = prev.hp;
          newArmor = prev.armor;
          return { ...prev, hp: newHp, armor: newArmor, relics: cb.triggerHourglass(prev.relics) };
        }
      }
      return { ...prev, hp: newHp, armor: newArmor, hpLostThisTurn: (prev.hpLostThisTurn || 0) + (prev.hp - newHp), hpLostThisBattle: (prev.hpLostThisBattle || 0) + (prev.hp - newHp) };
    });

    // on_damage_taken 遗物
    game.relics.filter((r: Relic) => r.trigger === 'on_damage_taken').forEach((relic: Relic) => {
      const dmgTakenCtx = cb.buildRelicContext({ game, dice, targetEnemy: enemies.find((e: Enemy) => e.hp > 0) || null, rerollsThisTurn: rerollCount, hasPlayedThisTurn: game.playsLeft < game.maxPlays });
      const res = relic.effect(dmgTakenCtx);
      if (res.damage) {
        cb.setGame((prev: GameState) => ({ ...prev, rageFireBonus: (prev.rageFireBonus || 0) + res.damage }));
        cb.addToast(`${relic.name}: 下次出牌+${res.damage}伤害`, 'buff');
      }
      if (res.tempDrawBonus) {
        cb.setGame((prev: GameState) => ({ ...prev, relicTempDrawBonus: (prev.relicTempDrawBonus || 0) + res.tempDrawBonus }));
        cb.addToast(`${relic.name}: 下回合+${res.tempDrawBonus}手牌`, 'buff');
      }
    });

    // 怒火骰子
    const furyDice = game.ownedDice.find(od => od.defId === 'w_fury');
    if (furyDice) {
      const furyLevel = furyDice.level || 1;
      cb.setGame((prev: GameState) => ({ ...prev, furyBonusDamage: (prev.furyBonusDamage || 0) + furyLevel }));
      cb.addFloatingText(`怒火+${furyLevel}`, 'text-orange-400', undefined, 'player');
    }

    if (preAbsorbed > 0) {
      cb.addFloatingText(`-${preAbsorbed}`, 'text-blue-400', undefined, 'player');
    }
    if (preHpDmg > 0) {
      cb.addFloatingText(`-${preHpDmg}`, 'text-red-500', undefined, 'player');
    }
    if (preAbsorbed === 0 && preHpDmg === 0) {
      cb.addFloatingText(`0`, 'text-gray-400', undefined, 'player');
    }
    cb.setPlayerEffect('flash');
    cb.addLog(`${e.name} 攻击造成 ${damage} 伤害！`);
    cb.playSound('enemy');

    // 攻击台词
    if (Math.random() < 0.3) {
      const aqc = cb.getEnemyQuotes(e.configId);
      const al = cb.pickQuote(aqc?.attack);
      if (al) cb.showEnemyQuote(e.uid, al, 1800);
    }
    if (damage >= 15) {
      const hqc = cb.getEnemyQuotes(e.configId);
      const hl = cb.pickQuote(hqc?.hurt);
      if (hl) setTimeout(() => cb.showEnemyQuote(e.uid, hl, 2000), 600);
    }

    // Ranger 追击
    if (e.combatType === 'ranger') {
      await new Promise(r => setTimeout(r, 250));
      const hitCount = (e.attackCount || 0);
      const secondHit = Math.max(1, Math.floor(e.attackDmg * 0.40) + hitCount + 1);
      const preArmor2 = cb.gameRef.current.armor;
      const preAbsorbed2 = Math.min(preArmor2, secondHit);
      const preHpDmg2 = secondHit - preAbsorbed2;
      cb.setGame((prev: GameState) => {
        let newArmor = prev.armor;
        let newHp = prev.hp;
        if (newArmor > 0) {
          const abs = Math.min(newArmor, secondHit);
          newArmor -= abs;
          const hpD = secondHit - abs;
          if (hpD > 0) newHp = Math.max(0, newHp - hpD);
        } else {
          newHp = Math.max(0, newHp - secondHit);
        }
        return { ...prev, hp: newHp, armor: newArmor };
      });
      if (preAbsorbed2 > 0) {
        cb.addFloatingText(`-${preAbsorbed2}`, 'text-blue-400', undefined, 'player');
      }
      if (preHpDmg2 > 0) {
        cb.addFloatingText(`-${preHpDmg2}`, 'text-orange-400', undefined, 'player');
      }
      cb.addLog(`${e.name} 追击造成 ${secondHit} 伤害！`);
      cb.playSound('enemy');
    }

    await new Promise(r => setTimeout(r, 300));
    cb.setScreenShake(false);
    cb.setEnemyEffectForUid(e.uid, null);
    cb.setPlayerEffect(null);
  }

  // 5. 精英/Boss：塞废骰子
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    const isElite = e.maxHp > 80 && e.maxHp <= 200;
    const isBoss = e.maxHp > 200;

    if (isElite && game.battleTurn % 3 === 0) {
      cb.setGame((prev: GameState) => ({
        ...prev,
        ownedDice: [...prev.ownedDice, { defId: 'cracked', level: 1 }],
        diceBag: [...prev.diceBag, 'cracked'],
      }));
      cb.addLog(`${e.name} 向你的骰子库塞入了一颗碎裂骰子！`);
      cb.addFloatingText('+碎裂骰子', 'text-red-400', undefined, 'player');
      cb.playSound('enemy_skill');
      await new Promise(r => setTimeout(r, 400));
    }

    if (isBoss) {
      const hpRatio = e.hp / e.maxHp;
      if (hpRatio < 0.4 && game.battleTurn % 2 === 0) {
        cb.setGame((prev: GameState) => ({
          ...prev,
          ownedDice: [...prev.ownedDice, { defId: 'cursed', level: 1 }],
          diceBag: [...prev.diceBag, 'cursed'],
        }));
        cb.addLog(`${e.name} 施放诅咒，向你的骰子库塞入了一颗诅咒骰子！`);
        cb.addFloatingText('+诅咒骰子', 'text-purple-400', undefined, 'player');
        cb.playSound('enemy_skill');
        await new Promise(r => setTimeout(r, 400));
      } else if (game.battleTurn % 3 === 0) {
        cb.setGame((prev: GameState) => ({
          ...prev,
          ownedDice: [...prev.ownedDice, { defId: 'cracked', level: 1 }],
          diceBag: [...prev.diceBag, 'cracked'],
        }));
        cb.addLog(`${e.name} 向你的骰子库塞入了一颗碎裂骰子！`);
        cb.addFloatingText('+碎裂骰子', 'text-red-400', undefined, 'player');
        cb.playSound('enemy_skill');
        await new Promise(r => setTimeout(r, 400));
      }
    }
  }

  // 6. 精英/Boss：叠护甲
  for (const e of currentEnemies.filter(en => en.hp > 0)) {
    const isElite = e.maxHp > 80 && e.maxHp <= 200;
    const isBoss = e.maxHp > 200;

    if (isElite && game.battleTurn % 3 === 0 && game.battleTurn > 0) {
      const armorVal = Math.floor(e.attackDmg * 1.5);
      cb.setEnemies((prev: Enemy[]) => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + armorVal } : en));
      cb.addLog(`${e.name} 凝聚了护甲（+${armorVal}）！`);
      cb.addFloatingText(`护甲+${armorVal}`, 'text-cyan-400', undefined, 'enemy');
      cb.playSound('enemy_defend');
      await new Promise(r => setTimeout(r, 300));
    }

    if (isBoss && game.battleTurn % 2 === 0 && game.battleTurn > 0) {
      const armorVal = Math.floor(e.attackDmg * 2.0);
      cb.setEnemies((prev: Enemy[]) => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + armorVal } : en));
      cb.addLog(`${e.name} 释放了护盾（+${armorVal}护甲）！`);
      cb.addFloatingText(`护盾+${armorVal}`, 'text-cyan-300', undefined, 'enemy');
      cb.playSound('enemy_defend');
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // 7. 敌人回合结束→玩家回合（灼烧结算+状态递减+battleTurn+1）
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
    currentPlayerHp = Math.max(0, prev.hp - burnDamage);
    if (currentPlayerHp <= 0 && prev.hp > 0) {
      if (cb.hasFatalProtection(prev.relics)) {
        currentPlayerHp = prev.hp;
        return { ...prev, hp: currentPlayerHp, relics: cb.triggerHourglass(prev.relics) };
      }
    }

    cb.setEnemies((prevEnemies: Enemy[]) => prevEnemies.map(e => {
      if (e.hp <= 0 || !e.pattern) return e;
      return e;
    }));

    return {
      ...prev,
      battleTurn: nextTurn,
      hp: currentPlayerHp,
      statuses: nextStatuses,
      isEnemyTurn: false,
    };
  });

  return currentPlayerHp;
}

// === 转波辅助函数 ===

/**
 * 检查并执行波次转换
 * @returns true=成功转波, false=没有下一波（应调用handleVictory）
 */
function tryWaveTransition(
  game: GameState,
  cb: EnemyAICallbacks
): boolean {
  const nextWaveIdx = game.currentWaveIndex + 1;
  if (nextWaveIdx >= game.battleWaves.length) return false;

  const nextWave = game.battleWaves[nextWaveIdx].enemies;
  cb.setEnemies(nextWave);
  cb.setEnemyEffects({});
  cb.setDyingEnemies(new Set());
  cb.setGame((prev: GameState) => ({
    ...prev,
    currentWaveIndex: nextWaveIdx,
    targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null,
    isEnemyTurn: false,
    playsLeft: prev.maxPlays,
    freeRerollsLeft: prev.freeRerollsPerTurn,
    armor: 0,
    chargeStacks: 0,
    mageOverchargeMult: 0,
    bloodRerollCount: 0,
    comboCount: 0,
    lastPlayHandType: undefined,
    instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type),
    instakillCompleted: false,
    playsThisWave: 0,
    rerollsThisWave: 0,
    battleTurn: 1,
  }));
  cb.setRerollCount(0);
  cb.setWaveAnnouncement(nextWaveIdx + 1);
  cb.addLog(`第 ${nextWaveIdx + 1} 波敌人来袭！`);
  cb.setDice([]);
  cb.rollAllDice(true);
  return true;
}
