/**
 * lootProcessor.ts — 战利品处理逻辑
 * 
 * 从 DiceHeroGame.tsx collectLoot/selectLootAugment/replaceAugment 提取的战利品处理模块。
 * 
 * 设计原则：
 * - 核心状态更新逻辑为纯函数，返回变更后的状态
 * - UI副作用（音效、toast）由调用方处理
 * - 日志消息随状态变更一并返回，供调用方统一记录
 */

import type { GameState, LootItem, Augment, Relic } from '../types/game';
import { getDiceDef } from '../data/dice';
import { openChallengeChest } from './lootHandler';

// ============================================================
// 类型定义
// ============================================================

/** 战利品收集结果 */
export interface CollectLootResult {
  /** 更新后的游戏状态 */
  state: GameState;
  /** 是否成功处理 */
  success: boolean;
  /** 需要记录的日志消息 */
  logs: string[];
  /** 需要显示的 toast 消息 */
  toasts: { message: string; type?: 'gold' | 'buff' | 'normal' }[];
  /** 是否需要弹出增益选择界面 */
  needsAugmentSelection?: boolean;
  /** 待选择的增益选项 */
  augmentOptions?: Augment[];
  /** 待选择的战利品ID */
  pendingLootId?: string;
}

/** 增益选择结果 */
export interface SelectAugmentResult {
  /** 更新后的游戏状态 */
  state: GameState;
  /** 需要记录的日志消息 */
  logs: string[];
  /** 是否需要弹出替换界面 */
  needsReplacement?: boolean;
  /** 待替换的增益 */
  pendingReplacementAugment?: Augment;
}

/** 增益替换结果 */
export interface ReplaceAugmentResult {
  /** 更新后的游戏状态 */
  state: GameState;
  /** 需要记录的日志消息 */
  logs: string[];
}

// ============================================================
// 纯函数：战利品收集
// ============================================================

/**
 * 收集战利品（纯函数）
 * 
 * @param state 当前游戏状态
 * @param lootId 要收集的战利品ID
 * @returns 收集结果，包含新状态和UI消息
 */
export function processCollectLoot(
  state: GameState,
  lootId: string
): CollectLootResult {
  const item = state.lootItems.find(i => i.id === lootId);
  
  // 未找到或已收集
  if (!item || item.collected) {
    return { state, success: false, logs: [], toasts: [] };
  }

  // 增益类型需要弹出选择界面
  if (item.type === 'augment' && item.augmentOptions) {
    return {
      state,
      success: true,
      logs: [],
      toasts: [],
      needsAugmentSelection: true,
      augmentOptions: item.augmentOptions,
      pendingLootId: item.id
    };
  }

  const logs: string[] = [];
  const toasts: { message: string; type?: 'gold' | 'buff' | 'normal' }[] = [];
  
  // 标记为已收集
  const nextLoot = state.lootItems.map(i => 
    i.id === lootId ? { ...i, collected: true } : i
  );
  
  let nextState: GameState = { ...state, lootItems: nextLoot };

  // 处理不同类型的战利品
  switch (item.type) {
    case 'gold': {
      const gold = item.value || 0;
      nextState.souls += gold;
      logs.push(`获得了 ${gold} 金币。`);
      break;
    }

    case 'reroll': {
      const value = item.value || 0;
      if (item.id === 'freeReroll') {
        nextState.freeRerollsPerTurn += value;
        logs.push(`获得了每回合 +${value} 免费重骰。`);
      } else {
        nextState.freeRerollsPerTurn += value;
        logs.push(`获得了 ${value} 次全局重骰机会。`);
      }
      break;
    }

    case 'maxPlays': {
      const value = item.value || 0;
      nextState.maxPlays += value;
      logs.push(`获得了 ${value} 次出牌机会。`);
      break;
    }

    case 'specialDice': {
      if (item.diceDefId) {
        nextState.ownedDice = [...nextState.ownedDice, { defId: item.diceDefId, level: 1 }];
        const ddef = getDiceDef(item.diceDefId);
        logs.push(`获得了特殊骰子: ${ddef.name}。`);
        toasts.push({ message: `获得了特殊骰子: ${ddef.name}` });
      }
      break;
    }

    case 'diceCount': {
      const oldDrawCount = nextState.drawCount;
      const value = item.value || 0;
      nextState.drawCount = Math.min(6, nextState.drawCount + value);
      if (nextState.drawCount > oldDrawCount) {
        nextState.enemyHpMultiplier += 0.25;
        logs.push(`获得了 ${value} 颗骰子。`);
        logs.push("获得诅咒之力，敌人血量提升 25%。");
        toasts.push({ message: "获得诅咒之力，敌人也都变强了" });
      }
      break;
    }

    case 'challengeChest':
    case 'challengeChest' as any: { // 类型兼容
      const chestResult = openChallengeChest({
        souls: nextState.souls,
        ownedDice: nextState.ownedDice,
        relics: nextState.relics
      });
      nextState.souls = chestResult.souls;
      nextState.ownedDice = chestResult.ownedDice;
      nextState.relics = chestResult.relics;
      logs.push(`开启挑战宝箱：获得 ${chestResult.result.name}`);
      toasts.push({
        message: `🎁 挑战宝箱：${chestResult.result.name}`,
        type: chestResult.result.type === 'gold' ? 'gold' : 'buff'
      });
      break;
    }

    case 'relic': {
      if (item.relicData) {
        nextState.relics = [...nextState.relics, { ...item.relicData }];
        logs.push(`获得遗物: ${item.relicData.name}`);
        toasts.push({ message: ` 获得遗物: ${item.relicData.name}!`, type: 'buff' });
      }
      break;
    }
  }

  return { state: nextState, success: true, logs, toasts };
}

// ============================================================
// 纯函数：增益选择
// ============================================================

/**
 * 选择战利品中的增益（纯函数）
 * 
 * @param state 当前游戏状态
 * @param lootId 战利品ID
 * @param aug 选择的增益
 * @returns 选择结果
 */
export function processSelectLootAugment(
  state: GameState,
  lootId: string,
  aug: Augment
): SelectAugmentResult {
  const logs: string[] = [];
  
  // 检查是否已存在相同增益（升级）
  const existingIdx = state.augments.findIndex(a => a?.id === aug.id);
  
  if (existingIdx !== -1) {
    // 升级现有增益
    const nextAugs = [...state.augments];
    const existing = nextAugs[existingIdx]!;
    const newLevel = (existing.level || 1) + 1;
    nextAugs[existingIdx] = { ...existing, level: newLevel };
    
    const nextLoot = state.lootItems.map(i => 
      i.id === lootId ? { ...i, collected: true } : i
    );
    
    logs.push(`模块升级: ${aug.name} Lv.${newLevel}`);
    
    return {
      state: { ...state, augments: nextAugs, lootItems: nextLoot },
      logs
    };
  }
  
  // 检查是否有空槽位
  const emptyIdx = state.augments.findIndex(a => a === null);
  
  if (emptyIdx !== -1) {
    // 放入空槽位
    const nextAugs = [...state.augments];
    nextAugs[emptyIdx] = { ...aug, level: 1 };
    
    const nextLoot = state.lootItems.map(i => 
      i.id === lootId ? { ...i, collected: true } : i
    );
    
    logs.push(`获得新模块: ${aug.name}`);
    
    return {
      state: { ...state, augments: nextAugs, lootItems: nextLoot },
      logs
    };
  }
  
  // 槽位已满，需要替换
  return {
    state: { ...state, pendingReplacementAugment: { ...aug, level: 1 } },
    logs: [],
    needsReplacement: true,
    pendingReplacementAugment: { ...aug, level: 1 }
  };
}

// ============================================================
// 纯函数：增益替换
// ============================================================

/**
 * 替换增益（纯函数）
 * 
 * @param state 当前游戏状态
 * @param newAug 新增益
 * @param replaceIdx 要替换的槽位索引
 * @returns 替换结果
 */
export function processReplaceAugment(
  state: GameState,
  newAug: Augment,
  replaceIdx: number
): ReplaceAugmentResult {
  const oldAug = state.augments[replaceIdx];
  const refund = oldAug ? (oldAug.level || 1) * 50 : 0;
  
  const newAugs = [...state.augments];
  newAugs[replaceIdx] = { ...newAug, level: 1 };
  
  // 标记所有未收集的增益战利品为已收集
  const nextLoot = state.lootItems.map(i => 
    i.type === 'augment' && !i.collected ? { ...i, collected: true } : i
  );
  
  const logs: string[] = [
    `替换了遗物: ${oldAug?.name} -> ${newAug.name}，返还了 ${refund} 金币。`
  ];
  
  return {
    state: {
      ...state,
      augments: newAugs,
      souls: state.souls + refund,
      lootItems: nextLoot,
      pendingReplacementAugment: null
    },
    logs
  };
}

// ============================================================
// 纯函数：完成战利品收集
// ============================================================

/**
 * 完成战利品收集，返回地图阶段（纯函数）
 * 
 * @param state 当前游戏状态
 * @returns 更新后的状态
 */
export function processFinishLoot(state: GameState): GameState {
  return {
    ...state,
    phase: 'map'
  };
}
