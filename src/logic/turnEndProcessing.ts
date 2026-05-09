/**
 * turnEndProcessing.ts — 回合结束处理（前半段）
 *
 * 从 DiceHeroGame.tsx endTurn() L2277-L2397 提取。
 * 包含：法师星界吟唱、冥想骰子、on_turn_end遗物触发、嘲讽骰子反噬。
 *
 * ARCH-F Round1 模块拆分
 */

import type React from 'react';
import * as ReactNS from 'react';
import type { Die, GameState, Enemy } from '../types/game';
import { getDiceDef } from '../data/dice';
import { buildRelicContext } from '../engine/buildRelicContext';
import { absorbPlayerDamage, calcMageChantHitPenalty } from './battleHelpers';
import { PixelArcaneShield, PixelShield, PixelHeart, PixelArcaneSkull, PixelMagic } from '../components/PixelIcons';
import { emitReward } from './rewardEvents';

/** 奖励类飘字统一金色 */
const REWARD_COLOR = 'text-amber-200';

/** 浮字用 奥术屏障 icon —— 法师吟唱+过充回合专用 */
const arcaneShieldIcon = () => ReactNS.createElement(PixelArcaneShield, { size: 1.5 });
/** 浮字用 护甲 icon */
const armorIcon = () => ReactNS.createElement(PixelShield, { size: 1.5 });
/** 浮字用 生命 icon */
const heartIcon = () => ReactNS.createElement(PixelHeart, { size: 1.5 });
/** 浮字用 法术反噬 icon —— 紫色骷髅（法师专属不可净化 debuff） */
const arcaneSkullIcon = () => ReactNS.createElement(PixelArcaneSkull, { size: 1.3 });
/** 浮字用 吟唱 icon —— 紫色星界法阵（与 PlayerHudView 的吟唱徽章同源） */
const magicIcon = () => ReactNS.createElement(PixelMagic, { size: 1.3 });

// ============================================================
// Context 接口
// ============================================================

export interface TurnEndContext {
  game: GameState;
  enemies: Enemy[];
  dice: Die[];
  rerollCount: number;

  // Callbacks
  setGame: React.Dispatch<React.SetStateAction<GameState>>;
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>;
  addFloatingText: (text: string, color: string, icon?: React.ReactNode, target?: string, persistent?: boolean) => void;
  addToast: (msg: string, type?: string, options?: { icon?: 'gold' | 'dice' | 'relic' | 'remove' | 'check' | 'star' | 'shuffle'; relicId?: string }) => void;
  addLog: (msg: string) => void;
  playSound: (id: string) => void;
  setScreenShake: React.Dispatch<React.SetStateAction<boolean>>;
  buildRelicContext: typeof buildRelicContext;
}

// ============================================================
// 主函数
// ============================================================

export async function processTurnEnd(ctx: TurnEndContext): Promise<void> {
  const {
    game, enemies, dice, rerollCount,
    setGame, setEnemies,
    addFloatingText, addToast, addLog, playSound, setScreenShake,
    buildRelicContext: buildCtx,
  } = ctx;

  playSound('turn_end');
  const aliveEnemies = enemies.filter(e => e.hp > 0);
  if (aliveEnemies.length === 0 || game.isEnemyTurn || dice.some(d => d.playing)) return;

  // === 职业回合结束处理 ===
  // 法师【星界吟唱】：未出牌时吟唱+1（手牌上限3→4→5→6递增），到6后继续吟唱给倍率
  // [2026-05-07] 吟唱不再加护甲，改为【奥术屏障】：减免一切伤害（含 DOT），和护甲一样每回合清空。
  //              屏障数值：4 + 当前蓄力层数 * 2（1→4, 2→6, 3→8, 4→10, 5→12...）
  const playedThisTurn = game.playsLeft < game.maxPlays; // 本回合是否出过牌
  if (game.playerClass === 'mage' && !playedThisTurn) {
    const currentCharge = game.chargeStacks || 0;
    const maxChargeForHand = 6 - (game.drawCount + (game.challengeDrawBonus || 0)); // drawCount=3 → 最多蓄力3层到达上限6；challenge +1 → 最多2层
    const shieldGain = 4 + currentCharge * 2;

    if (currentCharge >= maxChargeForHand) {
      // 手牌上限已达6颗，继续蓄力给伤害倍率加成（每次+10%）
      const overchargeBonus = 0.1;
      setGame(prev => ({
        ...prev,
        chargeStacks: currentCharge + 1,
        mageOverchargeMult: (prev.mageOverchargeMult || 0) + overchargeBonus,
        chantShield: (prev.chantShield || 0) + shieldGain,
      }));
      addFloatingText(`过充! 伤害+${Math.round(((game.mageOverchargeMult || 0) + overchargeBonus) * 100)}%`, 'text-purple-400', undefined, 'player');
      addFloatingText(`奥术屏障: +${shieldGain}`, REWARD_COLOR, arcaneShieldIcon(), 'player');
      emitReward('shield', shieldGain);
    } else {
      // 正常吟唱：手牌上限+1
      const newChargeStacks = currentCharge + 1;
      const newHandLimit = Math.min(6, game.drawCount + newChargeStacks + (game.challengeDrawBonus || 0));
      setGame(prev => ({
        ...prev,
        chargeStacks: newChargeStacks,
        chantShield: (prev.chantShield || 0) + shieldGain,
      }));
      addFloatingText(`吟唱 ${newHandLimit}/6`, 'text-purple-400', magicIcon(), 'player');
      addFloatingText(`奥术屏障: +${shieldGain}`, REWARD_COLOR, arcaneShieldIcon(), 'player');
      emitReward('shield', shieldGain);
    }
  } else if (game.playerClass === 'mage' && playedThisTurn) {
    // 出了牌就重置吟唱和过充倍率（chantShield 由回合开始清零统一处理）
    // [2026-05-08 v2] 同时清零吟唱受击次数 + 法术反噬层数
    // —— 法术反噬必须在出牌的同一 React batch 里清零，否则下个敌人回合计算伤害时还是旧值
    setGame(prev => ({
      ...prev,
      chargeStacks: 0,
      mageOverchargeMult: 0,
      mageChantHitCount: 0,
      arcaneBackfire: 0,
    }));
  }

  // healOnSkip: 冥想骰子 — 未出牌时手牌中有冥想骰子则回复HP
  if (!playedThisTurn) {
    dice.filter(d => !d.spent).forEach(d => {
      const def = getDiceDef(d.diceDefId);
      if (def.onPlay?.healOnSkip) {
        setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + def.onPlay!.healOnSkip!) }));
        addFloatingText(`冥想: +${def.onPlay.healOnSkip}`, REWARD_COLOR, heartIcon(), 'player');
        emitReward('heart', def.onPlay.healOnSkip);
      }
      // purifyOneOnSkip: 冥想回合净化1层
      if (def.onPlay?.purifyOneOnSkip) {
        setGame(prev => {
          const negStatuses = prev.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type));
          if (negStatuses.length > 0) {
            const toRemove = negStatuses[0];
            addFloatingText(`冥想净化: ${toRemove.type}`, 'text-green-300', undefined, 'player');
            return { ...prev, statuses: prev.statuses.filter(s => s !== toRemove) };
          }
          return prev;
        });
      }
    });
  }

  // === on_turn_end 遗物触发 ===
  const turnEndCtx = buildCtx({ game, dice, targetEnemy: enemies.find(e => e.hp > 0) || null, rerollsThisTurn: rerollCount, hasPlayedThisTurn: playedThisTurn });
  const turnEndEffects = game.relics.filter(r => r.trigger === 'on_turn_end').map(r => ({ relic: r, effect: r.effect(turnEndCtx) }));
  let turnEndDrawBonus = 0;
  turnEndEffects.forEach(({ relic, effect }) => {
    // 蓄力晶核：未出牌时加护甲+回血
    if (effect.armor && effect.armor > 0) {
      setGame(prev => ({ ...prev, armor: prev.armor + effect.armor! }));
      addFloatingText(`${relic.name}: +${effect.armor}`, REWARD_COLOR, armorIcon(), 'player');
      emitReward('armor', effect.armor);
    }
    if (effect.heal && effect.heal > 0) {
      setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + effect.heal!) }));
      addFloatingText(`${relic.name}: +${effect.heal}`, REWARD_COLOR, heartIcon(), 'player');
      emitReward('heart', effect.heal);
    }
    // 薛定谔的袋子：drawCountBonus
    if (effect.drawCountBonus && effect.drawCountBonus > 0) {
      turnEndDrawBonus += effect.drawCountBonus;
      addLog(`${relic.name}：下回合额外抽${effect.drawCountBonus}颗骰子！`);
    }
  });
  // 存入 game state，供抽牌阶段读取
  if (turnEndDrawBonus > 0) {
    setGame(prev => ({ ...prev, tempDrawCountBonus: (prev.tempDrawCountBonus || 0) + turnEndDrawBonus }));
  }

  // tauntAll: 咆哮骰子 — 嘲讽全体敌人：无视距离立即攻击玩家一次，算作敌人回合
  if (playedThisTurn) {
    const hasTaunt = dice.filter(d => d.spent).some(d => getDiceDef(d.diceDefId).onPlay?.tauntAll);
    if (hasTaunt) {
      addToast('咆哮嘲讽！全体敌人被迫攻击！', 'info');
      // 所有存活敌人立即对玩家进行一次攻击
      const aliveEnemies = enemies.filter(e => e.hp > 0);
      let totalTauntDmg = 0;
      aliveEnemies.forEach(e => {
        const dmg = e.attackDmg || 3;
        totalTauntDmg += dmg;
      });
      if (totalTauntDmg > 0) {
        setTimeout(() => {
          let chantPenaltyTaunt = 0;
          setGame(prev => {
            const absorb = absorbPlayerDamage(totalTauntDmg, prev.chantShield || 0, prev.armor, false);
            const penalty = calcMageChantHitPenalty(prev.playerClass, prev.chargeStacks, prev.mageChantHitCount, totalTauntDmg);
            let newHitCount = prev.mageChantHitCount;
            let newBackfire = prev.arcaneBackfire || 0;
            if (penalty) {
              newBackfire += penalty.addedStacks;
              newHitCount = penalty.newHitCount;
              chantPenaltyTaunt = penalty.addedStacks;
            }
            return {
              ...prev,
              hp: Math.max(0, prev.hp - absorb.hpDamage),
              armor: absorb.newArmor,
              chantShield: absorb.newShield,
              mageChantHitCount: newHitCount,
              arcaneBackfire: newBackfire,
            };
          });
          addFloatingText(`-${totalTauntDmg}`, 'text-red-500', heartIcon(), 'player');
          if (chantPenaltyTaunt > 0) addFloatingText(`法术反噬: +${chantPenaltyTaunt}`, 'text-fuchsia-400', arcaneSkullIcon(), 'player');
          addToast(`嘲讽反噬：全体敌人攻击造成${totalTauntDmg}伤害`, 'damage');
          playSound('enemy_skill');
        }, 400);
      }
      // 嘲讽攻击算作敌人的回合行动，距离归0
      setEnemies(prev => prev.map(e => ({ ...e, distance: 0 })));
    }
  }
}
