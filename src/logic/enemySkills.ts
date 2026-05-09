/**
 * enemySkills.ts — 敌人技能逻辑（Priest / Caster）+ 状态辅助
 * 从 enemyAI.ts 拆分，ARCH-6 Round 2
 *
 * 职责：Priest 治疗/增益/减益逻辑、Caster 毒雾/火球/诅咒逻辑、状态递减
 * 纯逻辑函数，不依赖 React 运行时（仅引用其类型/createElement 用于 icon 传递）
 *
 * [2026-05-09 v2 设计调整]
 *   1. caster/priest 都是\"辅助型\"，绝不直接打玩家攻击伤害
 *   2. caster 通过 dotAmplifier trait 让 DOT 越打越凶
 *   3. priest 通过 holyWrath trait 让 weak/vulnerable 持续 +1，护甲祝福 +20%
 *   4. priest 不再随机给盟友自加力量（违背\"无直伤\"的辅助定位）
 */

import React from 'react';
import type { Enemy, GameState, StatusEffect } from '../types/game';
import { PRIEST_CONFIG, CASTER_CONFIG } from '../config';
import { PixelHeart, PixelShield } from '../components/PixelIcons';
import { getDotMultiplier, getHolyWrath } from './enemyTraits';

// === 状态辅助 ===

/** 状态持续期递减 */
export function tickStatuses(statuses: StatusEffect[]): StatusEffect[] {
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

// === 辅助：状态效果 upsert ===

/** 向状态列表中追加或叠加指定状态 */
function upsertStatus(
  statuses: StatusEffect[],
  type: StatusEffect['type'],
  value: number,
  duration?: number,
): StatusEffect[] {
  const existing = statuses.find(s => s.type === type);
  if (existing) {
    return statuses.map(s =>
      s.type === type
        ? { ...s, value: s.value + value, ...(duration !== undefined ? { duration } : {}) }
        : s,
    );
  }
  const newStatus: StatusEffect = { type, value };
  if (duration !== undefined) newStatus.duration = duration;
  return [...statuses, newStatus];
}

// === Priest 技能 ===

export interface PriestSkillResult {
  /** 更新后的 game state 片段 */
  gameUpdates: {
    /** 状态更新函数（始终是函数形式，接收当前 statuses 返回新的；默认 identity） */
    statuses: (gameStatuses: StatusEffect[]) => StatusEffect[];
    /** 骰子库更新（可选，与 statuses 互斥时覆盖） */
    ownedDice?: GameState['ownedDice'];
    /** 骰子袋更新（可选） */
    diceBag?: GameState['diceBag'];
  };
  /** 更新后的 enemies */
  enemyUpdates: Map<string, Partial<Enemy>>;
  /** 日志消息 */
  logs: string[];
  /** 浮动文字 */
  floats: Array<{ text: string; color: string; target: string; icon?: React.ReactNode }>;
  /** 音效 */
  sound?: string;
}

/**
 * 执行 Priest 的技能决策
 *
 * 优先级：治疗盟友 > 自疗 > 强化盟友护甲（不再自加力量；priest 是辅助型，不直伤）> 减益玩家
 *
 * [2026-05-09] holyWrath 圣怒加成：
 *   - weak/vulnerable 持续时间 + holyWrath
 *   - 护甲祝福数值 ×(1 + 0.3 × holyWrath)（封顶 ×2.2）
 *   - 治疗量 ×(1 + 0.2 × holyWrath)（封顶 ×1.8）
 *
 * [2026-05-09 v2] archetype:
 *   inquisitor: 跳过治疗/护甲祝福，永远走 debuff 分支（审判官型）
 *   healer (default): 治疗 → 自疗 → 护甲祝福 → debuff
 */
export function executePriestSkill(
  e: Enemy,
  allies: Enemy[],
  game: GameState,
): PriestSkillResult {
  const result: PriestSkillResult = {
    gameUpdates: {
      statuses: (s) => s,  // 默认不做变更
    },
    enemyUpdates: new Map(),
    logs: [],
    floats: [],
  };

  const damagedAllies = allies.filter(en => en.hp < en.maxHp);
  const selfDamaged = e.hp < e.maxHp;
  const wrath = getHolyWrath(e);
  const isInquisitor = e.archetype === 'inquisitor';

  // inquisitor 跳过所有正面行为，直接 debuff
  if (!isInquisitor && damagedAllies.length > 0) {
    const lowestAlly = damagedAllies.reduce((a, b) =>
      a.hp / a.maxHp < b.hp / b.maxHp ? a : b,
    );
    const healVal = Math.max(1, Math.floor(e.attackDmg * PRIEST_CONFIG.healAllyMult * (1 + 0.2 * wrath)));
    result.enemyUpdates.set(lowestAlly.uid, {
      hp: Math.min(lowestAlly.maxHp, lowestAlly.hp + healVal),
    });
    result.logs.push(`${e.name} 治疗了 ${lowestAlly.name} ${healVal} HP${wrath > 0 ? `（圣怒×${wrath}）` : ''}。`);
    result.floats.push({ text: `+${healVal}`, color: 'text-emerald-500', target: 'enemy', icon: React.createElement(PixelHeart, { size: 1.3 }) });
    result.sound = 'enemy_heal';
  } else if (!isInquisitor && selfDamaged) {
    const healVal = Math.max(1, Math.floor(e.attackDmg * PRIEST_CONFIG.healSelfMult * (1 + 0.2 * wrath)));
    result.enemyUpdates.set(e.uid, {
      hp: Math.min(e.maxHp, e.hp + healVal),
    });
    result.logs.push(`${e.name} 治疗自己 ${healVal} HP${wrath > 0 ? `（圣怒×${wrath}）` : ''}。`);
    result.sound = 'enemy_heal';
  } else if (!isInquisitor && allies.length > 0) {
    const target = allies[Math.floor(Math.random() * allies.length)];
    const armorVal = Math.floor(e.attackDmg * PRIEST_CONFIG.armorBoostMult * (1 + 0.3 * wrath));
    result.enemyUpdates.set(target.uid, {
      armor: target.armor + armorVal,
    });
    result.logs.push(`${e.name} 为 ${target.name} 施加了护甲祝福（+${armorVal}护甲${wrath > 0 ? `，圣怒×${wrath}` : ''}）！`);
    result.floats.push({ text: `护甲+${armorVal}`, color: 'text-cyan-400', target: 'enemy', icon: React.createElement(PixelShield, { size: 1.3 }) });
  } else {
    // inquisitor 落到这里：永远 debuff 玩家
    // - 50% 概率施加 weak + vulnerable 双 debuff（核心机制：双重削弱）
    // - 30% 概率单 debuff（weak 或 vulnerable）
    // - 20% 概率塞诅咒/碎裂骰子
    const debuffRoll = Math.random();
    const dur = PRIEST_CONFIG.weakDuration + wrath;
    const vDur = PRIEST_CONFIG.vulnerableDuration + wrath;

    if (isInquisitor && debuffRoll < 0.5) {
      // inquisitor 招牌：双 debuff 一次性
      result.gameUpdates.statuses = (gameStatuses: StatusEffect[]): StatusEffect[] => {
        let s = upsertStatus(gameStatuses, 'weak', 1, dur);
        s = upsertStatus(s, 'vulnerable', 1, vDur);
        return s;
      };
      result.logs.push(`${e.name} 宣读双重审判：虚弱 + 易伤${wrath > 0 ? `（圣怒×${wrath}）` : ''}！`);
      result.floats.push({ text: '虚弱!', color: 'text-purple-400', target: 'player' });
      result.floats.push({ text: '易伤!', color: 'text-orange-400', target: 'player' });
    } else if (debuffRoll < PRIEST_CONFIG.weakChance) {
      result.gameUpdates.statuses = (gameStatuses: StatusEffect[]): StatusEffect[] =>
        upsertStatus(gameStatuses, 'weak', 1, dur);
      result.logs.push(`${e.name} 对你施加了虚弱（${dur}回合${wrath > 0 ? `，圣怒×${wrath}` : ''}）！`);
      result.floats.push({ text: '虚弱!', color: 'text-purple-400', target: 'player' });
    } else if (debuffRoll < PRIEST_CONFIG.vulnerableThreshold) {
      result.gameUpdates.statuses = (gameStatuses: StatusEffect[]): StatusEffect[] =>
        upsertStatus(gameStatuses, 'vulnerable', 1, vDur);
      result.logs.push(`${e.name} 对你施加了易伤（${vDur}回合${wrath > 0 ? `，圣怒×${wrath}` : ''}）！`);
      result.floats.push({ text: '易伤!', color: 'text-orange-400', target: 'player' });
    } else {
      const curseDice = Math.random() < PRIEST_CONFIG.curseChance ? 'cursed' : 'cracked';
      const curseName = curseDice === 'cursed' ? '诅咒骰子' : '碎裂骰子';
      result.gameUpdates.ownedDice = [...(game.ownedDice || []), { defId: curseDice, level: 1 }];
      result.gameUpdates.diceBag = [...(game.diceBag || []), curseDice];
      result.logs.push(`${e.name} 向你的骰子库塞入了一颗${curseName}！`);
      result.floats.push({ text: `+${curseName}`, color: 'text-red-400', target: 'player' });
      result.sound = 'enemy_skill';
    }
  }

  return result;
}

// === Caster 技能 ===

export interface CasterSkillResult {
  /** 需要对 game.statuses 做的更新（函数形式，接收当前 statuses） */
  updateStatuses: (statuses: StatusEffect[]) => StatusEffect[];
  /** 日志消息 */
  logs: string[];
  /** 浮动文字 */
  floats: Array<{ text: string; color: string; target: string; delay?: number; icon?: React.ReactNode }>;
}

/**
 * 执行 Caster 的 DoT 技能决策
 *
 * [2026-05-09 v2] archetype 倾向：
 *   pyromancer  : 80% 概率灼烧 / 20% 诅咒（不放毒）
 *   toxicologist: 80% 概率毒雾 / 20% 诅咒
 *   cursemaster : 100% 诅咒（毒+虚弱），不放纯 DOT
 *   default     : 沿用旧概率（poisonChance / fireballThreshold / 余下诅咒）
 *
 *   dotAmplifier 用乘法倍率：基础 ×1.4/层（pyromancer ×1.5/层），封顶 ×2.5
 */
export function executeCasterSkill(e: Enemy): CasterSkillResult {
  const ampMul = getDotMultiplier(e);
  const archetype = e.archetype;

  // archetype 决定 archetype 决定的"出招概率分布"
  let dotRoll: number;
  if (archetype === 'pyromancer') {
    // 80% burn / 20% curse → roll < 0.2 走毒（不会发生），0.2~1 走 burn 分支
    dotRoll = 0.21 + Math.random() * 0.79;  // 永远 > poisonChance(0.4)，落在 burn 区
    // pyromancer 优先 burn → 强制 dotRoll 在 [poisonChance, fireballThreshold) 区间
    dotRoll = CASTER_CONFIG.poisonChance + Math.random() * (CASTER_CONFIG.fireballThreshold - CASTER_CONFIG.poisonChance);
    // 20% 概率改为诅咒（dotRoll >= fireballThreshold）
    if (Math.random() < 0.2) dotRoll = CASTER_CONFIG.fireballThreshold + 0.01;
  } else if (archetype === 'toxicologist') {
    // 80% poison / 20% curse
    dotRoll = Math.random() * CASTER_CONFIG.poisonChance;  // 落在毒区
    if (Math.random() < 0.2) dotRoll = CASTER_CONFIG.fireballThreshold + 0.01;
  } else if (archetype === 'cursemaster') {
    // 100% curse
    dotRoll = CASTER_CONFIG.fireballThreshold + 0.01;
  } else {
    dotRoll = Math.random();
  }

  if (dotRoll < CASTER_CONFIG.poisonChance) {
    const baseVal = Math.max(CASTER_CONFIG.poisonMin, Math.floor(e.attackDmg * CASTER_CONFIG.poisonMult));
    const poisonVal = Math.max(1, Math.floor(baseVal * ampMul));
    return {
      updateStatuses: (statuses: StatusEffect[]) => upsertStatus(statuses, 'poison', poisonVal),
      logs: [`${e.name} 释放毒雾，施加了 ${poisonVal} 层毒素${ampMul > 1 ? `（DOT放大 ×${ampMul.toFixed(1)}）` : ''}！`],
      floats: [{ text: `毒素+${poisonVal}`, color: 'text-emerald-400', target: 'player' }],
    };
  }

  if (dotRoll < CASTER_CONFIG.fireballThreshold) {
    const baseVal = Math.max(CASTER_CONFIG.burnMin, Math.floor(e.attackDmg * CASTER_CONFIG.fireballMult));
    const burnVal = Math.max(1, Math.floor(baseVal * ampMul));
    return {
      updateStatuses: (statuses: StatusEffect[]) => upsertStatus(statuses, 'burn', burnVal, CASTER_CONFIG.fireballBurnDuration),
      logs: [`${e.name} 释放火球，施加了 ${burnVal} 层灼烧${ampMul > 1 ? `（DOT放大 ×${ampMul.toFixed(1)}）` : ''}！`],
      floats: [{ text: `灼烧+${burnVal}`, color: 'text-orange-400', target: 'player' }],
    };
  }

  const basePoison = Math.max(CASTER_CONFIG.curseMin, Math.floor(e.attackDmg * CASTER_CONFIG.curseToxinMult));
  const poisonVal = Math.max(1, Math.floor(basePoison * ampMul));
  return {
    updateStatuses: (statuses: StatusEffect[]) => {
      let updated = upsertStatus(statuses, 'poison', poisonVal);
      updated = upsertStatus(updated, 'weak', 1, CASTER_CONFIG.curseWeakDuration);
      return updated;
    },
    logs: [`${e.name} 施放诅咒，施加了毒素和虚弱${ampMul > 1 ? `（DOT放大 ×${ampMul.toFixed(1)}）` : ''}！`],
    floats: [
      { text: `毒素+${poisonVal}`, color: 'text-emerald-400', target: 'player' },
      { text: '虚弱', color: 'text-purple-400', target: 'player', delay: 200 },
    ],
  };
}
