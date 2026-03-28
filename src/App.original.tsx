/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, 
  Shield, 
  RotateCcw, 
  Play, 
  Coins, 
  Zap, 
  ChevronRight, 
  Skull, 
  Flame, 
  ShoppingBag, 
  Sword,
  HelpCircle,
  Crown,
  Info,
  Trophy,
  AlertCircle,
  AlertTriangle,
  Wind,
  TrendingUp,
  TrendingDown,
  Droplets,
  Layers,
  X,
  Brain,
  Package,
  Copy,
  Triangle,
  ArrowRight,
  Home,
  Square,
  Star,
  Sparkles,
  Waves,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Sound System ---
const playSound = (type: 'roll' | 'select' | 'hit' | 'armor' | 'heal' | 'enemy' | 'victory' | 'defeat' | 'skill') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'roll':
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'skill':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'select':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'armor':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'heal':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'enemy':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'victory':
        [440, 554, 659].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + i * 0.1);
          g.gain.setValueAtTime(0.1, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.5);
        });
        break;
      case 'defeat':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        osc.start(now);
        osc.stop(now + 1);
        break;
    }
  } catch (e) {
    console.error('Audio error', e);
  }
};

type DiceColor = '红色' | '蓝色' | '紫色' | '金色';

interface Die {
  id: number;
  value: number;
  color: DiceColor;
  selected: boolean;
  spent: boolean;
  rolling?: boolean;
  playing?: boolean;
}

type HandType = '普通攻击' | '对子' | '连对' | '三条' | '顺子' | '同花' | '葫芦' | '四条' | '五条' | '六条' | '同花顺' | '同花葫芦' | '皇家同花顺' | '无效牌型';

type StatusType = 'poison' | 'burn' | 'dodge' | 'vulnerable' | 'strength' | 'weak' | 'armor';

interface StatusEffect {
  type: StatusType;
  value: number;
}

interface Augment {
  id: string;
  name: string;
  level?: number;
  condition: 'high_card' | 'pair' | 'two_pair' | 'n_of_a_kind' | 'full_house' | 'straight' | 'flush' | 'red_count';
  conditionValue?: number;
  effect: (x: number, dice: Die[], level: number) => { damage?: number; armor?: number; heal?: number; multiplier?: number; pierce?: number; statusEffects?: StatusEffect[] };
  description: string;
}

type NodeType = 'enemy' | 'elite' | 'boss' | 'shop' | 'event' | 'campfire';

interface MapNode {
  id: string;
  type: NodeType;
  depth: number;
  connectedTo: string[];
  completed: boolean;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  intent: { type: '攻击' | '防御' | '技能'; value: number; description?: string };
  dropGold: number;
  dropAugment: boolean;
  dropMaxPlays?: number;
  dropDiceCount?: number;
  rerollReward?: number;
  emoji: string;
  pattern?: (turn: number, self: Enemy, player: GameState) => { type: '攻击' | '防御' | '技能'; value: number; description?: string };
  statuses: StatusEffect[];
}

interface LootItem {
  id: string;
  type: 'gold' | 'augment' | 'reroll' | 'maxPlays' | 'diceCount';
  value?: number;
  augment?: Augment;
  augmentOptions?: Augment[];
  collected: boolean;
}

interface ShopItem {
  id: string;
  type: 'augment' | 'reroll' | 'dice';
  augment?: Augment;
  price: number;
  label: string;
  desc: string;
}

interface GameState {
  hp: number;
  maxHp: number;
  armor: number;
  freeRerollsLeft: number;
  freeRerollsPerTurn: number;
  globalRerolls: number;
  playsLeft: number;
  maxPlays: number;
  souls: number;
  slots: number;
  diceCount: number;
  handLevels: Record<string, number>;
  augments: (Augment | null)[];
  currentNodeId: string | null;
  map: MapNode[];
  phase: 'start' | 'map' | 'battle' | 'shop' | 'event' | 'campfire' | 'victory' | 'gameover' | 'loot';
  battleTurn: number;
  isEnemyTurn: boolean;
  logs: string[];
  shopItems: ShopItem[];
  statuses: StatusEffect[];
  lootItems: LootItem[];
  enemyHpMultiplier: number;
  pendingReplacementAugment: Augment | null;
}

const COLORS: Record<number, DiceColor> = {
  1: '红色',
  2: '红色',
  3: '蓝色',
  4: '蓝色',
  5: '紫色',
  6: '金色',
};

const getScale = (level: number) => 1 + (level - 1) * 0.5;

const AUGMENTS_POOL: Augment[] = [
  {
    id: 'twin_stars',
    name: '双子星',
    level: 1,
    condition: 'pair',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (0.5 * getScale(level)) }),
    description: '对子: 本次基础伤害 * 1.5'
  },
  {
    id: 'steam_piston',
    name: '蒸汽活塞',
    level: 1,
    condition: 'pair',
    effect: (_x, _dice, level) => ({ armor: Math.floor(8 * getScale(level)) }),
    description: '对子: 额外获得 8 点护甲'
  },
  {
    id: 'twin_shot',
    name: '连对火炮',
    level: 1,
    condition: 'two_pair',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * getScale(level)) }),
    description: '连对: 额外追加 X 点伤害'
  },
  {
    id: 'scarlet_thirst',
    name: '猩红嗜血',
    level: 1,
    condition: 'red_count',
    conditionValue: 1,
    effect: (_, dice, level) => ({ heal: Math.floor(dice.filter(d => d.color === '红色').length * 2 * getScale(level)) }),
    description: '包含红色: 选中的红骰子每颗回复 2 HP'
  },
  {
    id: 'precise_deconstruction',
    name: '精密解构',
    level: 1,
    condition: 'straight',
    effect: (x, _dice, level) => ({ pierce: Math.floor((x + 10) * getScale(level)) }),
    description: '顺子: 额外造成 X + 10 点穿透伤害'
  },
  {
    id: 'heavy_steam_hammer',
    name: '重型蒸汽锤',
    level: 1,
    condition: 'n_of_a_kind',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 2 * getScale(level)) }),
    description: '多条: 造成 X * 2 的额外伤害'
  },
  {
    id: 'full_house_blast',
    name: '葫芦爆裂',
    level: 1,
    condition: 'full_house',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 2.5 * getScale(level)), armor: Math.floor(10 * getScale(level)) }),
    description: '葫芦: 造成 X * 2.5 伤害并获得 10 护甲'
  },
  {
    id: 'flush_shield',
    name: '同花力场',
    level: 1,
    condition: 'flush',
    effect: (x, _dice, level) => ({ armor: Math.floor(x * 1.5 * getScale(level)) }),
    description: '同花: 额外获得 X * 1.5 点护甲'
  },
  {
    id: 'chromatic_overload',
    name: '色彩过载',
    level: 1,
    condition: 'flush',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (1.2 * getScale(level)) }),
    description: '同花: 最终伤害 * 2.2'
  },
  {
    id: 'venomous_dagger',
    name: '剧毒匕首',
    level: 1,
    condition: 'flush',
    effect: (_x, _dice, level) => ({ statusEffects: [{ type: 'poison', value: Math.floor(3 * getScale(level)) }] }),
    description: '同花: 额外附加 3 层中毒'
  },
  {
    id: 'ignition_core',
    name: '点火核心',
    level: 1,
    condition: 'n_of_a_kind',
    effect: (_x, _dice, level) => ({ statusEffects: [{ type: 'burn', value: Math.floor(4 * getScale(level)) }] }),
    description: '多条: 额外附加 4 层灼烧'
  },
  {
    id: 'pressure_point',
    name: '压力点',
    level: 1,
    condition: 'straight',
    effect: (_x, _dice, level) => ({ statusEffects: [{ type: 'vulnerable', value: Math.floor(1 * getScale(level)) }] }),
    description: '顺子: 额外附加 1 层易伤'
  }
];

const INITIAL_AUGMENTS: Augment[] = [
  {
    id: 'precise_stab',
    name: '精准刺击',
    level: 1,
    condition: 'high_card',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * getScale(level)) }),
    description: '普通攻击: 额外追加 X 点伤害'
  },
  {
    id: 'gear_bulwark',
    name: '齿轮壁垒',
    level: 1,
    condition: 'pair',
    effect: (_x, _dice, level) => ({ armor: Math.floor(4 * getScale(level)) }),
    description: '对子: 额外获得 4 点护甲'
  },
  {
    id: 'flaw_strike',
    name: '破绽打击',
    level: 1,
    condition: 'straight',
    effect: (_x, _dice, level) => ({ damage: Math.floor(8 * getScale(level)) }),
    description: '顺子: 额外追加 8 点伤害'
  },
  {
    id: 'scarlet_overload',
    name: '猩红超载',
    level: 1,
    condition: 'red_count',
    conditionValue: 3,
    effect: (_x, _dice, level) => ({ multiplier: 1 + (1 * getScale(level)) }),
    description: '包含红色>=3: 最终总伤害 * 2'
  }
];

// --- Game Logic Helpers ---

interface HandResult {
  bestHand: string;
  allHands: HandType[]; // For augment triggering
  activeHands: HandType[]; // For outcome calculation
}

const checkHands = (dice: Die[]): HandResult => {
  if (dice.length === 0) return { bestHand: '普通攻击', allHands: [], activeHands: ['普通攻击'] };
  
  const values = dice.map(d => d.value).sort((a, b) => a - b);
  const colors = dice.map(d => d.color);
  const uniqueColors = new Set(colors);
  
  // Flush: ALL selected dice must be the same color, and at least 4 dice
  const isFlush = uniqueColors.size === 1 && dice.length >= 4;
  
  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const sortedCounts = Object.values(counts).sort((a, b) => b - a);
  const maxCount = sortedCounts[0];
  const isTwoPair = sortedCounts.length >= 2 && sortedCounts[0] === 2 && sortedCounts[1] === 2;
  const isFullHouse = sortedCounts.length >= 2 && sortedCounts[0] >= 3 && sortedCounts[1] >= 2;

  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
  let isStraight = false;
  if (uniqueValues.length === dice.length && dice.length >= 3) {
    if (uniqueValues[uniqueValues.length - 1] - uniqueValues[0] === dice.length - 1) {
      isStraight = true;
    }
  }

  const hands: Set<HandType> = new Set();
  
  // Basic hand detection for allHands
  if (maxCount === 6 && dice.length === 6) hands.add('六条');
  if (maxCount === 5 && dice.length === 5) hands.add('五条');
  if (maxCount === 4 && dice.length === 4) hands.add('四条');
  if (maxCount === 3 && dice.length === 3) hands.add('三条');
  if (maxCount === 2 && dice.length === 2) hands.add('对子');
  if (isFullHouse && dice.length === 5) hands.add('葫芦');
  if (isTwoPair && dice.length === 4) hands.add('连对');
  if (isStraight) hands.add('顺子');
  if (isFlush) hands.add('同花');
  if (isStraight && isFlush) hands.add('同花顺');
  if (isStraight && isFlush && values[0] === 1 && values[values.length-1] === 6) hands.add('皇家同花顺');
  if (isFlush && isFullHouse) hands.add('同花葫芦');
  
  if (hands.size === 0) {
    if (dice.length === 1) {
      hands.add('普通攻击');
    } else {
      hands.add('无效牌型');
    }
  }

  // Determine activeHands (the non-overlapping maximal hands to apply effects)
  const activeHands: HandType[] = [];
  let hasBaseHand = false;

  if (hands.has('无效牌型')) {
    activeHands.push('无效牌型');
  } else {
    if (maxCount === 6 && dice.length === 6) { activeHands.push('六条'); hasBaseHand = true; }
    else if (maxCount === 5 && dice.length === 5) { activeHands.push('五条'); hasBaseHand = true; }
    else if (maxCount === 4 && dice.length === 4) { activeHands.push('四条'); hasBaseHand = true; }
    
    if (isStraight && isFlush && values[0] === 1 && values[values.length-1] === 6) {
      activeHands.push('皇家同花顺');
    } else if (isStraight && isFlush) {
      activeHands.push('同花顺');
    } else if (isFlush && isFullHouse) {
      activeHands.push('同花葫芦');
    } else {
      if (isStraight) activeHands.push('顺子');
      if (isFlush) activeHands.push('同花');
      
      if (!hasBaseHand) {
        if (isFullHouse && dice.length === 5) activeHands.push('葫芦');
        else if (isTwoPair && dice.length === 4) activeHands.push('连对');
        else if (maxCount === 3 && dice.length === 3) activeHands.push('三条');
        else if (maxCount === 2 && dice.length === 2) activeHands.push('对子');
      }
    }
  }

  if (activeHands.length === 0) activeHands.push('普通攻击');

  // Sort activeHands by priority (highest first)
  const priority: HandType[] = [
    '皇家同花顺', '同花顺', '六条', '五条', '同花葫芦', '四条', '葫芦', '同花', '顺子', '三条', '连对', '对子', '普通攻击', '无效牌型'
  ];
  activeHands.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));

  const bestHand = activeHands.join(' + ');

  return { bestHand, allHands: Array.from(hands), activeHands };
};

const canFormValidHand = (selected: Die[], candidate: Die, available: Die[]): boolean => {
  if (selected.length === 0) return true;
  
  const targetSet = [...selected, candidate];
  
  // Quick check
  const directCheck = checkHands(targetSet);
  if (directCheck.bestHand !== '无效牌型' && directCheck.bestHand !== '普通攻击') {
    return true;
  }

  if (available.length === 0) return false;

  const checkSubsets = (index: number, currentSubset: Die[]): boolean => {
    if (currentSubset.length > 0) {
      const testHand = [...targetSet, ...currentSubset];
      const result = checkHands(testHand);
      if (result.bestHand !== '无效牌型' && result.bestHand !== '普通攻击') {
        return true;
      }
    }
    
    for (let i = index; i < available.length; i++) {
      currentSubset.push(available[i]);
      if (checkSubsets(i + 1, currentSubset)) {
        return true;
      }
      currentSubset.pop();
    }
    return false;
  };
  
  return checkSubsets(0, []);
};

const getEnemyForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0): Enemy => {
  const hpScale = (1 + depth * 0.25) * hpMultiplier;
  const dmgScale = 1 + depth * 0.12;

  if (node.type === 'boss') {
    return { 
      name: '永夜主宰', emoji: '👑', hp: Math.floor(200 * hpScale), maxHp: Math.floor(200 * hpScale), armor: 0, intent: { type: '攻击', value: Math.floor(10 * dmgScale) }, dropGold: 0, dropAugment: false,
      pattern: (t, self) => {
        // Phase 2: Low HP
        if (self.hp < self.maxHp * 0.5) {
          const cycle = t % 4;
          if (cycle === 1) return { type: '攻击', value: Math.floor(18 * dmgScale) };
          if (cycle === 2) return { type: '技能', value: 3, description: '剧毒' };
          if (cycle === 3) return { type: '防御', value: Math.floor(25 * dmgScale) };
          return { type: '攻击', value: Math.floor(30 * dmgScale), description: '终焉之光' };
        }
        
        // Phase 1: Normal
        const cycle = t % 3;
        if (cycle === 1) return { type: '攻击', value: Math.floor(10 * dmgScale) };
        if (cycle === 2) return { type: '技能', value: 2, description: '虚弱' };
        if (cycle === 0) return { type: '技能', value: 4, description: '灼烧' };
        return { type: '攻击', value: Math.floor(20 * dmgScale) };
      },
      statuses: []
    };
  }

  if (node.type === 'elite') {
    const elites = [
      {
        name: '混沌聚合体', emoji: '🌀', hp: 80, dmg: 7,
        pattern: (t: number, self: Enemy) => {
          if (self.hp < self.maxHp * 0.4) return { type: '攻击', value: Math.floor(18 * dmgScale), description: '混沌爆发' };
          const cycle = t % 3;
          if (cycle === 1) return { type: '攻击', value: Math.floor(7 * dmgScale) };
          if (cycle === 2) return { type: '技能', value: 2, description: '力量' };
          return { type: '攻击', value: Math.floor(10 * dmgScale) };
        }
      },
      {
        name: '虚空典狱长', emoji: '⛓️', hp: 100, dmg: 5,
        pattern: (t: number) => {
          const cycle = t % 3;
          if (cycle === 1) return { type: '防御', value: Math.floor(15 * dmgScale) };
          if (cycle === 2) return { type: '攻击', value: Math.floor(12 * dmgScale), description: '处决' };
          return { type: '技能', value: 2, description: '易伤' };
        }
      }
    ];
    const base = elites[Math.floor(Math.random() * elites.length)];
    return { 
      name: base.name, emoji: base.emoji, hp: Math.floor(base.hp * hpScale), maxHp: Math.floor(base.hp * hpScale), armor: 0, 
      intent: { type: '攻击', value: Math.floor(base.dmg * dmgScale) }, dropGold: 50, dropAugment: true, rerollReward: 2, 
      statuses: [],
      pattern: base.pattern as any
    };
  }

  const enemies = [
    { 
      name: '虚空巡游者', emoji: '👻', hp: 20, dmg: 4, 
      pattern: (t: number) => (t % 3 === 0 ? { type: '技能', value: 2, description: '剧毒' } : { type: '攻击', value: Math.floor(4 * dmgScale) })
    },
    { 
      name: '腐化甲虫', emoji: '🪲', hp: 30, dmg: 3,
      pattern: (t: number) => (t % 2 === 0 ? { type: '防御', value: Math.floor(6 * dmgScale) } : { type: '攻击', value: Math.floor(3 * dmgScale) })
    },
    { 
      name: '猩红异灵', emoji: '🩸', hp: 25, dmg: 5,
      pattern: (t: number) => (t % 3 === 0 ? { type: '技能', value: 1, description: '易伤' } : { type: '攻击', value: Math.floor(5 * dmgScale) })
    },
    { 
      name: '遗忘之影', emoji: '🌑', hp: 15, dmg: 6,
      pattern: (t: number) => (t % 2 === 0 ? { type: '攻击', value: Math.floor(6 * dmgScale) } : { type: '技能', value: 1, description: '虚弱' })
    },
  ];
  const base = enemies[Math.floor(Math.random() * enemies.length)];
  
  return { 
    name: base.name, 
    emoji: base.emoji,
    hp: Math.floor(base.hp * hpScale), 
    maxHp: Math.floor(base.hp * hpScale), 
    armor: 0, 
    intent: { type: '攻击', value: Math.floor(base.dmg * dmgScale) }, 
    dropGold: 20, 
    dropAugment: true,
    statuses: [],
    pattern: base.pattern as any
  };
};

const generateMap = () => {
  const nodes: MapNode[] = [];
  const layers = 15;
  const nodesPerLayer = 3;

  // Generate nodes
  for (let l = 0; l < layers; l++) {
    for (let i = 0; i < nodesPerLayer; i++) {
      const id = `node-${l}-${i}`;
      let type: NodeType = 'enemy';
      if (l === 0) type = 'enemy';
      else if (l === layers - 1) type = 'boss';
      else if (l === layers - 2) type = 'campfire';
      else {
        const rand = Math.random();
        if (rand < 0.15) type = 'elite';
        else if (rand < 0.35) type = 'campfire';
        else if (rand < 0.5) type = 'shop';
        else if (rand < 0.65) type = 'event';
      }

      nodes.push({ id, type, depth: l, connectedTo: [], completed: false });
    }
  }

  // Generate connections (StS style)
  for (let l = 0; l < layers - 1; l++) {
    const currentLayer = nodes.filter(n => n.depth === l);
    const nextLayer = nodes.filter(n => n.depth === l + 1);

    currentLayer.forEach((node, i) => {
      // Each node connects to 1-2 nodes in next layer
      const targets = [i];
      if (i > 0 && Math.random() > 0.7) targets.push(i - 1);
      if (i < nodesPerLayer - 1 && Math.random() > 0.7) targets.push(i + 1);
      
      targets.forEach(idx => {
        node.connectedTo.push(nextLayer[idx].id);
      });
    });
  }

  // Ensure every node in next layer is reachable (except layer 0)
  for (let l = 1; l < layers; l++) {
    const prevLayer = nodes.filter(n => n.depth === l - 1);
    const currentLayer = nodes.filter(n => n.depth === l);
    
    currentLayer.forEach((node, i) => {
      const isReachable = prevLayer.some(pn => pn.connectedTo.includes(node.id));
      if (!isReachable) {
        const nearestParent = prevLayer[Math.min(i, prevLayer.length - 1)];
        nearestParent.connectedTo.push(node.id);
      }
    });
  }

  return nodes;
};

// --- Status Icons Component ---
const STATUS_INFO: Record<StatusType, { icon: React.ReactNode; color: string; label: string; description: string }> = {
  poison: { icon: <Droplets size={12} />, color: 'text-purple-400', label: '中毒', description: '每回合结束时受到 X 点伤害，随后层数减 1。' },
  burn: { icon: <Flame size={12} />, color: 'text-orange-500', label: '灼烧', description: '每回合开始时受到 X 点伤害，随后层数减半。' },
  dodge: { icon: <Wind size={12} />, color: 'text-blue-300', label: '闪避', description: '下次受到攻击时，有概率完全回避。' },
  vulnerable: { icon: <TrendingUp size={12} />, color: 'text-red-400', label: '易伤', description: '受到的伤害增加 50%。' },
  strength: { icon: <TrendingUp size={12} />, color: 'text-orange-400', label: '力量', description: '造成的伤害增加 X 点。' },
  weak: { icon: <TrendingDown size={12} />, color: 'text-zinc-400', label: '虚弱', description: '造成的伤害减少 25%。' },
  armor: { icon: <Shield size={12} />, color: 'text-blue-400', label: '护甲', description: '抵挡即将到来的伤害。' },
};

const StatusIcon: React.FC<{ status: StatusEffect, align?: 'left' | 'right' | 'center' }> = ({ status, align = 'center' }) => {
  const info = STATUS_INFO[status.type];
  const [showTooltip, setShowTooltip] = useState(false);

  const alignClasses = {
    left: 'left-0 translate-x-0',
    right: 'right-0 left-auto translate-x-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  const arrowClasses = {
    left: 'left-4 translate-x-0',
    right: 'right-4 left-auto translate-x-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  return (
    <div 
      className="relative group flex items-center gap-0.5 cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className={`p-1 rounded bg-zinc-800/80 border border-zinc-700/50 ${info.color} flex items-center justify-center`}>
        {info.icon}
      </div>
      <span className={`text-[10px] font-bold font-mono ${info.color}`}>{status.value}</span>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute bottom-full mb-2 w-40 p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[100] pointer-events-none max-w-[80vw] ${alignClasses[align]}`}
          >
            <div className={`text-[10px] font-black mb-1.5 ${info.color} flex items-center gap-1.5 uppercase tracking-wider`}>
              {info.icon} {info.label} {status.value}
            </div>
            <div className="text-[9px] text-zinc-400 leading-relaxed font-medium">
              {info.description.replace('X', status.value.toString())}
            </div>
            <div className={`absolute top-full border-[6px] border-transparent border-t-zinc-700 ${arrowClasses[align]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Component ---

// --- Hand Types Definition ---
const HAND_TYPES = [
  { id: 'high_card', name: '普通攻击', icon: <Zap size={12} />, base: 0, mult: 1.0, description: '任意骰子。伤害 = 点数 * 1.0。' },
  { id: 'pair', name: '对子', icon: <Copy size={12} />, base: 2, mult: 1.5, description: '2 颗点数相同的骰子。伤害 = (2 + 点数) * 1.5，获得 5 点护甲。' },
  { id: 'two_pair', name: '连对', icon: <Layers size={12} />, base: 4, mult: 1.8, description: '2 组对子。伤害 = (4 + 总点数) * 1.8，获得 10 点护甲。' },
  { id: 'three_of_a_kind', name: '三条', icon: <Triangle size={12} />, base: 6, mult: 2.0, description: '3 颗点数相同的骰子。伤害 = (6 + 总点数) * 2.0，附加 2 层灼烧。' },
  { id: 'straight', name: '顺子', icon: <ArrowRight size={12} />, base: 8, mult: 2.0, description: '3 颗及以上点数连续的骰子。伤害 = (8 + 总点数) * 2.0，附加 2 层虚弱。' },
  { id: 'flush', name: '同花', icon: <Droplets size={12} />, base: 10, mult: 2.0, description: '至少 4 颗颜色相同的骰子。伤害 = (10 + 总点数) * 2.0，附加 2 层中毒。' },
  { id: 'full_house', name: '葫芦', icon: <Home size={12} />, base: 12, mult: 2.5, description: '1 组三条 + 1 组对子。伤害 = (12 + 总点数) * 2.5，获得 15 点护甲，附加 2 层易伤。' },
  { id: 'four_of_a_kind', name: '四条', icon: <Square size={12} />, base: 15, mult: 3.0, description: '4 颗点数相同的骰子。伤害 = (15 + 总点数) * 3.0，附加 3 层灼烧。' },
  { id: 'five_of_a_kind', name: '五条', icon: <Star size={12} />, base: 20, mult: 3.5, description: '5 颗点数相同的骰子。伤害 = (20 + 总点数) * 3.5，附加 4 层灼烧。' },
  { id: 'six_of_a_kind', name: '六条', icon: <Trophy size={12} />, base: 25, mult: 4.0, description: '6 颗点数相同的骰子。伤害 = (25 + 总点数) * 4.0，附加 5 层灼烧。' },
  { id: 'straight_flush', name: '同花顺', icon: <Zap size={12} className="text-amber-400" />, base: 30, mult: 4.0, description: '同花 + 顺子。伤害 = (30 + 总点数) * 4.0，获得 20 点护甲，附加 5 层中毒。' },
  { id: 'flush_house', name: '同花葫芦', icon: <Waves size={12} />, base: 35, mult: 4.5, description: '同花 + 葫芦。伤害 = (35 + 总点数) * 4.5，获得 30 点护甲，附加 8 层中毒。' },
  { id: 'royal_flush', name: '皇家同花顺', icon: <Crown size={12} className="text-yellow-400" />, base: 50, mult: 6.0, description: '同花 + 顺子(1-6)。伤害 = (50 + 总点数) * 6.0，获得 50 点护甲，附加 15 层中毒。' },
];

export default function App() {
  const [game, setGame] = useState<GameState>({
    hp: 100,
    maxHp: 100,
    armor: 0,
    freeRerollsLeft: 1,
    freeRerollsPerTurn: 1,
    globalRerolls: 5,
    playsLeft: 1,
    maxPlays: 1,
    souls: 0,
    slots: 4,
    diceCount: 3,
    handLevels: {},
    augments: Array(4).fill(null),
    currentNodeId: null,
    map: generateMap(),
    phase: 'start',
    battleTurn: 0,
    logs: ['欢迎来到骰境。'],
    shopItems: [],
    statuses: [],
    lootItems: [],
    enemyHpMultiplier: 1.0,
    pendingReplacementAugment: null
  });

  const [showHandGuide, setShowHandGuide] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [pendingLootAugment, setPendingLootAugment] = useState<{id: string, options: Augment[] } | null>(null);

  useEffect(() => {
    if (game.phase === 'reward' || game.phase === 'map') {
      setEnemy(null);
    }
  }, [game.phase]);

  const [dice, setDice] = useState<Die[]>([]);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [rerollCount, setRerollCount] = useState(0);
  const [selectedHandTypeInfo, setSelectedHandTypeInfo] = useState<{ name: string; description: string } | null>(null);
  const [showEnemyIntentInfo, setShowEnemyIntentInfo] = useState(false);

  const [enemyEffect, setEnemyEffect] = useState<'attack' | 'defend' | 'skill' | 'shake' | 'death' | null>(null);
  const [playerEffect, setPlayerEffect] = useState<'attack' | 'defend' | 'flash' | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [hpGained, setHpGained] = useState(false);
  const [armorGained, setArmorGained] = useState(false);
  const [rerollFlash, setRerollFlash] = useState(false);
  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([]);
  const toastIdRef = useRef(0);

  const addToast = (message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; color: string; icon?: React.ReactNode; target: 'player' | 'enemy' }[]>([]);
  const [selectedAugment, setSelectedAugment] = useState<Augment | null>(null);
  const [campfireView, setCampfireView] = useState<'main' | 'upgrade'>('main');

  // --- Actions ---

  const addFloatingText = (text: string, color: string = 'text-red-500', icon?: React.ReactNode, target: 'player' | 'enemy' = 'enemy') => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.random() * 40 - 20;
    const y = Math.random() * 20 - 10;
    setFloatingTexts(prev => [...prev, { id, text, x, y, color, icon, target }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1500);
  };

  const addLog = (msg: string) => {
    setGame(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 15) }));
  };

  const startBattle = (node: MapNode) => {
    const newEnemy = getEnemyForNode(node, node.depth, game.enemyHpMultiplier);
    setEnemy(newEnemy);
    setEnemyEffect(null);
    setPlayerEffect(null);
    setGame(prev => ({ 
      ...prev, 
      phase: 'battle', 
      battleTurn: 1, 
      currentNodeId: node.id, 
      armor: 0, 
      freeRerollsLeft: prev.freeRerollsPerTurn,
      playsLeft: prev.maxPlays,
      isEnemyTurn: false 
    }));
    rollAllDice();
    setRerollCount(0);
    addLog(`遭遇 ${newEnemy.name} ${newEnemy.emoji || ''}！`);
  };

  const startNode = (node: MapNode) => {
    playSound('select');
    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      startBattle(node);
    } else if (node.type === 'shop') {
      const augs = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5).slice(0, 2);
      const shopItems: ShopItem[] = [
        { 
          id: 'reroll', 
          type: 'reroll', 
          label: '全局重骰', 
          desc: '增加 1 次全局重骰机会', 
          price: Math.floor(Math.random() * 61) + 20 
        },
        { 
          id: 'dice', 
          type: 'dice', 
          label: '额外骰子', 
          desc: '增加 1 个骰子 (上限 6)', 
          price: Math.floor(Math.random() * 61) + 20 
        },
        ...augs.map(aug => ({
          id: aug.id,
          type: 'augment' as const,
          augment: aug,
          label: aug.name,
          desc: aug.description,
          price: Math.floor(Math.random() * 61) + 20
        }))
      ];
      setGame(prev => ({ ...prev, phase: 'shop', currentNodeId: node.id, shopItems }));
    } else if (node.type === 'campfire') {
      setCampfireView('main');
      setGame(prev => ({ ...prev, phase: 'campfire', currentNodeId: node.id }));
    } else if (node.type === 'event') {
      setGame(prev => ({ ...prev, phase: 'event', currentNodeId: node.id }));
    }
  };

  const rollAllDice = async () => {
    playSound('roll');
    const initialDice: Die[] = Array.from({ length: game.diceCount }).map((_, i) => ({
      id: i, value: Math.floor(Math.random() * 6) + 1, color: '蓝色', selected: false, spent: false, rolling: true
    }));
    setDice(initialDice);

    // Rolling animation
    for (let i = 0; i < 4; i++) {
      await new Promise(resolve => setTimeout(resolve, 40));
      setDice(prev => prev.map(d => ({
        ...d,
        value: Math.floor(Math.random() * 6) + 1,
        color: COLORS[Math.floor(Math.random() * 6) + 1] || '蓝色'
      })));
    }

    const finalDice = initialDice.map(d => {
      const val = Math.floor(Math.random() * 6) + 1;
      return { ...d, value: val, color: COLORS[val], rolling: false };
    });
    setDice(finalDice);
    addLog(`投掷结果: ${finalDice.map(d => `${d.value}(${d.color[0]})`).join(', ')}`);
  };

  const rerollUnselected = async () => {
    if ((game.freeRerollsLeft <= 0 && game.globalRerolls <= 0) || game.isEnemyTurn || game.playsLeft <= 0) return;
    playSound('roll');
    
    if (game.freeRerollsLeft <= 0) {
      setRerollFlash(true);
      setTimeout(() => setRerollFlash(false), 500);
    }

    setGame(prev => {
      if (prev.freeRerollsLeft > 0) {
        return { ...prev, freeRerollsLeft: prev.freeRerollsLeft - 1 };
      } else {
        return { ...prev, globalRerolls: prev.globalRerolls - 1 };
      }
    });
    
    // Set rolling state
    setDice(prev => prev.map(d => (d.spent || d.selected) ? d : { ...d, rolling: true }));

    // Rolling animation
    for (let i = 0; i < 4; i++) {
      await new Promise(resolve => setTimeout(resolve, 40));
      setDice(prev => prev.map(d => {
        if (d.spent || d.selected || !d.rolling) return d;
        return { 
          ...d, 
          value: Math.floor(Math.random() * 6) + 1,
          color: COLORS[Math.floor(Math.random() * 6) + 1] || '蓝色'
        };
      }));
    }

    setDice(prev => {
      const newDice = prev.map(d => {
        if (d.spent || d.selected) return d;
        const val = Math.floor(Math.random() * 6) + 1;
        return { ...d, value: val, color: COLORS[val], rolling: false };
      });
      const rolled = newDice.filter(d => !d.spent && !d.selected);
      addLog(`重骰结果: ${rolled.map(d => `${d.value}(${d.color[0]})`).join(', ')}`);
      return newDice;
    });
    
    if (game.currentNodeId === '8') { // Assuming '8' is the node ID for the furnace if it was hardcoded before
      setEnemy(prev => prev ? { ...prev, armor: prev.armor + 5 } : null);
      addLog("核心熔炉因重骰获得了 5 点护甲！");
    }
  };

  const toggleSelect = (id: number) => {
    if (game.isEnemyTurn || game.playsLeft <= 0) return;
    
    const selectedCount = dice.filter(d => d.selected && !d.spent).length;
    const isCurrentlySelected = dice.find(d => d.id === id)?.selected;

    if (!isCurrentlySelected && selectedCount >= game.slots) return;

    playSound('select');
    setDice(prev => prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d));
  };

  const currentHands = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    return checkHands(selected);
  }, [dice]);

  const invalidDiceIds = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    const unselected = dice.filter(d => !d.selected && !d.spent);
    const invalidIds = new Set<number>();
    
    // Check unselected dice: can they fit into the current selection?
    for (const die of unselected) {
      if (!canFormValidHand(selected, die, unselected.filter(d => d.id !== die.id))) {
        invalidIds.add(die.id);
      }
    }

    // Check selected dice: if this die was the LAST one added, would it be invalid?
    // Or more generally: if we remove this die, does the rest of the hand become "more" valid?
    // Actually, the most consistent way is: if we have this die in the hand, can we EVER form a valid hand?
    for (const die of selected) {
      const others = selected.filter(d => d.id !== die.id);
      if (!canFormValidHand(others, die, unselected)) {
        invalidIds.add(die.id);
      }
    }
    
    return invalidIds;
  }, [dice]);

  const activeAugments = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    if (currentHands.allHands.length === 0) return [];

    return game.augments.filter((aug): aug is Augment => {
      if (!aug) return false;
      if (aug.condition === 'red_count') {
        return selected.filter(d => d.color === '红色').length >= (aug.conditionValue || 0);
      }
      
      const conditionMap: Record<string, HandType> = {
        'high_card': '普通攻击',
        'pair': '对子',
        'two_pair': '连对',
        'n_of_a_kind': '三条',
        'full_house': '葫芦',
        'straight': '顺子',
        'flush': '同花'
      };
      
      const targetHand = conditionMap[aug.condition];
      if (!targetHand) return false;
      
      if (aug.condition === 'n_of_a_kind') {
        return ['三条', '四条', '五条', '六条'].some(h => currentHands.allHands.includes(h as HandType));
      }
      
      return currentHands.allHands.includes(targetHand);
    });
  }, [dice, game.augments, currentHands]);

  const expectedOutcome = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    const { bestHand, allHands, activeHands } = currentHands;
    if (selected.length === 0 || bestHand === '无效牌型') return null;

    const X = selected.reduce((sum, d) => sum + d.value, 0);
    let baseDamage = 0;
    let baseArmor = 0;
    let handMultiplier = 1;
    let baseHandValue = 0;
    let statusEffects: StatusEffect[] = [];

    activeHands.forEach(handName => {
      const handDef = HAND_TYPES.find(h => h.name === handName);
      if (handDef) {
        const level = game.handLevels[handName] || 1;
        const levelBonusBase = (level - 1) * 10;
        const levelBonusMult = (level - 1) * 0.5;
        baseHandValue += ((handDef as any).base || 0) + levelBonusBase;
        handMultiplier += (((handDef as any).mult || 1) - 1) + levelBonusMult;
      }

      switch (handName) {
        case '普通攻击': break;
        case '对子': baseArmor += 5; break;
        case '连对': baseArmor += 10; break;
        case '三条': statusEffects.push({ type: 'burn', value: 2 }); break;
        case '顺子': statusEffects.push({ type: 'weak', value: 2 }); break;
        case '同花': statusEffects.push({ type: 'poison', value: 2 }); break;
        case '葫芦': baseArmor += 15; statusEffects.push({ type: 'vulnerable', value: 2 }); break;
        case '四条': statusEffects.push({ type: 'burn', value: 3 }); break;
        case '五条': statusEffects.push({ type: 'burn', value: 4 }); break;
        case '六条': statusEffects.push({ type: 'burn', value: 5 }); break;
        case '同花顺': baseArmor += 20; statusEffects.push({ type: 'poison', value: 5 }); break;
        case '同花葫芦': baseArmor += 30; statusEffects.push({ type: 'poison', value: 8 }); break;
        case '皇家同花顺': baseArmor += 50; statusEffects.push({ type: 'poison', value: 15 }); break;
      }
    });

    baseDamage = Math.floor((baseHandValue + X) * handMultiplier);

    if (activeHands.some(h => ['同花', '同花顺', '同花葫芦', '皇家同花顺'].includes(h))) {
      baseArmor += baseDamage;
    }

    let extraDamage = 0;
    let extraArmor = 0;
    let extraHeal = 0;
    let pierceDamage = 0;
    let multiplier = 1;
    const triggeredAugments: { name: string, details: string }[] = [];

    activeAugments.forEach(aug => {
      const res = aug.effect(X, selected, aug.level || 1);
      const details: string[] = [];

      if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
      if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
      if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
      if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率x${res.multiplier.toFixed(2)}`); }
      if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
      if (res.statusEffects) {
        res.statusEffects.forEach(s => {
          const existing = statusEffects.find(es => es.type === s.type);
          if (existing) {
            existing.value += s.value;
          } else {
            statusEffects.push({ ...s });
          }
          const info = STATUS_INFO[s.type];
          details.push(`${info.label}+${s.value}`);
        });
      }

      if (details.length > 0) {
        triggeredAugments.push({ name: aug.name, details: details.join(', ') });
      }
    });

    const totalDamage = Math.floor((baseDamage + extraDamage) * multiplier) + pierceDamage;

    // Apply status modifiers
    let modifiedDamage = totalDamage;
    const playerWeak = game.statuses.find(s => s.type === 'weak');
    if (playerWeak) modifiedDamage = Math.floor(modifiedDamage * 0.75);
    
    const enemyVulnerable = enemy?.statuses.find(s => s.type === 'vulnerable');
    if (enemyVulnerable) modifiedDamage = Math.floor(modifiedDamage * 1.5);

    return {
      damage: modifiedDamage,
      armor: Math.floor(baseArmor + extraArmor),
      heal: extraHeal,
      baseDamage,
      baseHandValue,
      handMultiplier,
      extraDamage: modifiedDamage - baseDamage - pierceDamage,
      pierceDamage,
      multiplier,
      triggeredAugments,
      bestHand,
      statusEffects,
      X,
      selectedValues: selected.map(d => d.value)
    };
  }, [dice, activeAugments, currentHands]);

  const playHand = async () => {
    playSound('select');
    const selected = dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0 || !enemy || game.isEnemyTurn || dice.some(d => d.playing) || game.playsLeft <= 0) return;

    setGame(prev => ({ ...prev, playsLeft: prev.playsLeft - 1 }));

    const outcome = expectedOutcome;
    if (!outcome) return;

    const { bestHand } = currentHands;

    // 0. Dice Playing Animation
    setDice(prev => prev.map(d => d.selected ? { ...d, playing: true } : d));
    await new Promise(r => setTimeout(r, 250));

    // 1. Player Attack Animation
    setPlayerEffect('attack');
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
    playSound('hit');
    
    if (outcome.damage > 0) {
      const absorbed = Math.min(enemy.armor, outcome.damage);
      const hpDamage = Math.max(0, outcome.damage - absorbed);
      
      if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', <Shield size={16} />, 'enemy');
      if (hpDamage > 0) setTimeout(() => addFloatingText(`-${hpDamage}`, 'text-red-500', <Heart size={16} />, 'enemy'), absorbed > 0 ? 150 : 0);
    }

    await new Promise(r => setTimeout(r, 250));
    setPlayerEffect(null);

    // 2. Apply results
    if (outcome.armor > 0) {
      setArmorGained(true);
      playSound('armor');
      addFloatingText(`+${outcome.armor}`, 'text-blue-400', <Shield size={18} />, 'player');
      setTimeout(() => setArmorGained(false), 500);
    }
    if (outcome.heal > 0) {
      setHpGained(true);
      playSound('heal');
      addFloatingText(`+${outcome.heal}`, 'text-emerald-500', <Heart size={18} />, 'player');
      setTimeout(() => setHpGained(false), 500);
    }
    
    // Feedback for status effects
    if (outcome.statusEffects && outcome.statusEffects.length > 0) {
      outcome.statusEffects.forEach((s, idx) => {
        setTimeout(() => {
          const info = STATUS_INFO[s.type];
          addFloatingText(`${info.label} ${s.value}`, info.color.replace('text-', 'text-'), info.icon, 'enemy');
        }, idx * 200);
      });
    }

    // Apply to Enemy
    let remainingDamage = outcome.damage;
    let enemyArmor = enemy.armor;
    if (enemyArmor > 0) {
      const absorbed = Math.min(enemyArmor, remainingDamage);
      enemyArmor -= absorbed;
      remainingDamage -= absorbed;
    }
    const finalEnemyHp = Math.max(0, enemy.hp - remainingDamage);

    setEnemy(prev => {
      if (!prev) return null;
      let newStatuses = [...prev.statuses];
      if (outcome.statusEffects) {
        outcome.statusEffects.forEach(s => {
          const existing = newStatuses.find(es => es.type === s.type);
          if (existing) {
            existing.value += s.value;
          } else {
            newStatuses.push({ ...s });
          }
        });
      }
      return { ...prev, hp: finalEnemyHp, armor: enemyArmor, statuses: newStatuses };
    });
    setGame(prev => ({ 
      ...prev, 
      armor: prev.armor + outcome.armor,
      hp: Math.min(prev.maxHp, prev.hp + outcome.heal)
    }));

    // Mark dice as spent
    setDice(prev => prev.map(d => d.selected ? { ...d, spent: true, selected: false, playing: false } : d));

    let logMsg = `打出 ${bestHand}，造成 ${outcome.damage} 伤害`;
    if (outcome.armor > 0) logMsg += `，获得 ${outcome.armor} 护甲`;
    if (outcome.heal > 0) logMsg += `，回复 ${outcome.heal} 生命`;
    if (outcome.triggeredAugments.length > 0) {
      const augDetails = outcome.triggeredAugments.map(a => `${a.name}(${a.details})`).join(', ');
      logMsg += ` (触发: ${augDetails})`;
    }
    logMsg += `。`;
    addLog(logMsg);

    if (finalEnemyHp <= 0) {
      setEnemyEffect('death');
      await new Promise(r => setTimeout(r, 1000));
      handleVictory();
    }
  };

  const endTurn = async () => {
    playSound('select');
    if (!enemy || game.isEnemyTurn || dice.some(d => d.playing)) return;

    setGame(prev => ({ ...prev, isEnemyTurn: true }));

    // --- 1. Player Turn End ---
    setGame(prev => {
      let nextStatuses = [...prev.statuses];
      let poisonDamage = 0;
      const poison = prev.statuses.find(s => s.type === 'poison');
      if (poison && poison.value > 0) {
        poisonDamage = poison.value;
        addLog(`你因中毒受到了 ${poisonDamage} 点伤害。`);
        addFloatingText(`-${poisonDamage}`, 'text-purple-400', <Droplets size={16} />, 'player');
        nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
      }
      return { ...prev, hp: Math.max(0, prev.hp - poisonDamage), statuses: nextStatuses };
    });

    await new Promise(r => setTimeout(r, 600));

    // Check if player died from poison
    let playerDied = false;
    setGame(prev => { if (prev.hp <= 0) playerDied = true; return prev; });
    if (playerDied) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    // --- 2. Enemy Turn Start ---
    setEnemy(prev => {
      if (!prev) return null;
      const burn = prev.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        const dmg = burn.value;
        addLog(`${prev.name} 因灼烧受到了 ${dmg} 点伤害。`);
        addFloatingText(`-${dmg}`, 'text-orange-500', <Flame size={16} />, 'enemy');
        const nextBurnValue = Math.floor(burn.value / 2);
        const nextStatuses = prev.statuses.map(s => s.type === 'burn' ? { ...s, value: nextBurnValue } : s).filter(s => s.value > 0);
        return { ...prev, hp: Math.max(0, prev.hp - dmg), statuses: nextStatuses, armor: 0 };
      }
      return { ...prev, armor: 0 };
    });

    await new Promise(r => setTimeout(r, 600));

    // Check if enemy died from burn
    let enemyDied = false;
    setEnemy(prev => { if (prev && prev.hp <= 0) enemyDied = true; return prev; });
    if (enemyDied) { handleVictory(); return; }

    // --- 3. Enemy Action ---
    const intent = enemy.intent;
    if (intent.type === '攻击') {
      setEnemyEffect('attack');
      setPlayerEffect('flash');
      setScreenShake(true);
      setTimeout(() => { setScreenShake(false); setPlayerEffect(null); }, 300);
      playSound('enemy');
      let damage = intent.value;
      const enemyWeak = enemy.statuses.find(s => s.type === 'weak');
      if (enemyWeak) damage = Math.floor(damage * 0.75);
      const playerVulnerable = game.statuses.find(s => s.type === 'vulnerable');
      if (playerVulnerable) damage = Math.floor(damage * 1.5);
      
      const playerArmor = game.armor;
      const absorbed = Math.min(playerArmor, damage);
      const remainingDamage = damage - absorbed;
      const finalHp = Math.max(0, game.hp - remainingDamage);

      if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', <Shield size={16} />, 'player');
      if (remainingDamage > 0) setTimeout(() => addFloatingText(`-${remainingDamage}`, 'text-red-500', <Heart size={16} />, 'player'), absorbed > 0 ? 150 : 0);

      setGame(prev => ({ ...prev, hp: finalHp, armor: playerArmor - absorbed }));
      
      addLog(`${enemy.name} 使用 ${intent.description || '攻击'} 造成 ${damage} 伤害！`);
      await new Promise(r => setTimeout(r, 600));
      setEnemyEffect(null);
    } else if (intent.type === '防御') {
      setEnemyEffect('defend');
      playSound('armor');
      setEnemy(prev => prev ? { ...prev, armor: prev.armor + intent.value } : null);
      addLog(`${enemy.name} 获得 ${intent.value} 护甲。`);
      await new Promise(r => setTimeout(r, 600));
      setEnemyEffect(null);
    } else if (intent.type === '技能') {
      setEnemyEffect('skill');
      playSound('skill');
      addLog(`${enemy.name} 使用了技能: ${intent.description || '未知技能'}`);
      
      const applyStatusToPlayer = (type: StatusType, val: number) => {
        setGame(prev => {
          const nextStatuses = [...prev.statuses];
          const existing = nextStatuses.find(s => s.type === type);
          if (existing) existing.value += val;
          else nextStatuses.push({ type, value: val });
          return { ...prev, statuses: nextStatuses };
        });
      };

      if (intent.description === '重构') {
        setEnemy(prev => prev ? { ...prev, hp: Math.min(prev.maxHp, prev.hp + intent.value) } : null);
        addFloatingText(`+${intent.value}`, 'text-emerald-500', <Heart size={16} />, 'enemy');
      } else if (intent.description === '虚弱') {
        applyStatusToPlayer('weak', intent.value);
        addFloatingText(`虚弱 ${intent.value}`, 'text-zinc-400', <Wind size={16} />, 'player');
      } else if (intent.description === '剧毒') {
        applyStatusToPlayer('poison', intent.value);
        addFloatingText(`中毒 ${intent.value}`, 'text-purple-400', <Droplets size={16} />, 'player');
      } else if (intent.description === '灼烧') {
        applyStatusToPlayer('burn', intent.value);
        addFloatingText(`灼烧 ${intent.value}`, 'text-orange-500', <Flame size={16} />, 'player');
      } else if (intent.description === '力量') {
        setEnemy(prev => {
          if (!prev) return null;
          const nextStatuses = [...prev.statuses];
          const existing = nextStatuses.find(s => s.type === 'strength');
          if (existing) existing.value += intent.value;
          else nextStatuses.push({ type: 'strength', value: intent.value });
          return { ...prev, statuses: nextStatuses };
        });
        addFloatingText(`力量 ${intent.value}`, 'text-orange-400', <TrendingUp size={16} />, 'enemy');
      } else if (intent.description === '易伤') {
        applyStatusToPlayer('vulnerable', intent.value);
        addFloatingText(`易伤 ${intent.value}`, 'text-red-400', <TrendingUp size={16} />, 'player');
      }
      
      await new Promise(r => setTimeout(r, 600));
      setEnemyEffect(null);
    }

    // Check if player died from attack
    setGame(prev => { if (prev.hp <= 0) playerDied = true; return prev; });
    if (playerDied) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    // --- 4. Enemy Turn End ---
    setEnemy(prev => {
      if (!prev) return null;
      let nextStatuses = [...prev.statuses];
      let poisonDamage = 0;
      const poison = prev.statuses.find(s => s.type === 'poison');
      if (poison && poison.value > 0) {
        poisonDamage = poison.value;
        addLog(`${prev.name} 因中毒受到了 ${poisonDamage} 点伤害。`);
        addFloatingText(`-${poisonDamage}`, 'text-purple-400', <Droplets size={16} />, 'enemy');
        nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
      }
      return { ...prev, hp: Math.max(0, prev.hp - poisonDamage), statuses: nextStatuses };
    });

    await new Promise(r => setTimeout(r, 600));

    // Check if enemy died from poison
    setEnemy(prev => { if (prev && prev.hp <= 0) enemyDied = true; return prev; });
    if (enemyDied) { handleVictory(); return; }

    // --- 5. Player Turn Start ---
    setGame(prev => {
      const nextTurn = prev.battleTurn + 1;
      let nextStatuses = [...prev.statuses];
      let burnDamage = 0;
      const burn = prev.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        burnDamage = burn.value;
        addLog(`你因灼烧受到了 ${burnDamage} 点伤害。`);
        addFloatingText(`-${burnDamage}`, 'text-orange-500', <Flame size={16} />, 'player');
        const nextBurnValue = Math.floor(burn.value / 2);
        nextStatuses = nextStatuses.map(s => s.type === 'burn' ? { ...s, value: nextBurnValue } : s).filter(s => s.value > 0);
      }

      // Update enemy intent for next turn
      if (enemy.pattern) {
        setEnemy(e => e ? { ...e, intent: enemy.pattern!(nextTurn, e, prev) } : null);
      }

      return { 
        ...prev, 
        battleTurn: nextTurn, 
        hp: Math.max(0, prev.hp - burnDamage),
        statuses: nextStatuses,
        isEnemyTurn: false
      };
    });

    // Final player death check
    setGame(prev => { 
      let nextState = { 
        ...prev, 
        isEnemyTurn: false, 
        armor: 0,
        playsLeft: prev.maxPlays,
        freeRerollsLeft: prev.freeRerollsPerTurn
      };
      if (nextState.hp <= 0) playerDied = true; 
      return nextState; 
    });
    if (playerDied) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    rollAllDice();
    playSound('roll');
  };

  useEffect(() => {
    if (
      game.phase === 'battle' && 
      !game.isEnemyTurn && 
      enemy && 
      enemy.hp > 0 && 
      game.hp > 0 &&
      dice.length > 0 &&
      !dice.some(d => d.playing) &&
      (game.playsLeft <= 0 || dice.every(d => d.spent))
    ) {
      const timer = setTimeout(() => {
        endTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.isEnemyTurn, enemy?.hp, game.hp, dice, game.playsLeft]);

  const handleVictory = () => {
    if (!enemy) return;
    playSound('victory');
    addLog(`击败了 ${enemy.name}！`);
    
    const loot: LootItem[] = [
      { id: 'gold', type: 'gold', value: enemy.dropGold, collected: false }
    ];

    // Elite rewards: +1 Dice, +2 Global Rerolls, or +1 Free Reroll per turn
    if (enemy.rerollReward) {
      const eliteRewards: { type: 'reroll' | 'diceCount' | 'freeRerollPerTurn', value: number, label: string }[] = [
        { type: 'diceCount', value: 1, label: '+1 骰子' },
        { type: 'reroll', value: 2, label: '+2 全局重骰' },
        { type: 'freeRerollPerTurn', value: 1, label: '+1 每回合免费重骰' }
      ];
      const selectedReward = eliteRewards[Math.floor(Math.random() * eliteRewards.length)];
      
      if (selectedReward.type === 'freeRerollPerTurn') {
        loot.push({ id: 'freeReroll', type: 'reroll', value: selectedReward.value, collected: false });
      } else {
        loot.push({ id: selectedReward.type, type: selectedReward.type as any, value: selectedReward.value, collected: false });
      }
    }

    if (enemy.dropAugment) {
      const options: Augment[] = [];
      const pool = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 3; i++) options.push(pool[i]);
      loot.push({ id: 'augment', type: 'augment', augmentOptions: options, collected: false });
    }
    if (enemy.dropMaxPlays) {
      loot.push({ id: 'maxPlays', type: 'maxPlays', value: enemy.dropMaxPlays, collected: false });
    }
    if (enemy.dropDiceCount) {
      loot.push({ id: 'diceCount', type: 'diceCount', value: enemy.dropDiceCount, collected: false });
    }

    setGame(prev => {
      const newMap = prev.map.map(n => n.id === prev.currentNodeId ? { ...n, completed: true } : n);
      
      if (prev.currentNodeId && prev.map.find(n => n.id === prev.currentNodeId)?.type === 'boss') {
        return { ...prev, map: newMap, phase: 'victory', isEnemyTurn: false };
      }

      return { 
        ...prev, 
        map: newMap,
        phase: 'loot',
        lootItems: loot,
        isEnemyTurn: false
      };
    });
  };

  const collectLoot = (id: string) => {
    playSound('select');
    const item = game.lootItems.find(i => i.id === id);
    if (!item || item.collected) return;

    if (item.type === 'augment' && item.augmentOptions) {
      setPendingLootAugment({ id: item.id, options: item.augmentOptions });
      return;
    }

    setGame(prev => {
      const nextLoot = prev.lootItems.map(i => i.id === id ? { ...i, collected: true } : i);
      let nextState = { ...prev, lootItems: nextLoot };

      if (item.type === 'gold') {
        nextState.souls += item.value || 0;
        addLog(`获得了 ${item.value} 金币。`);
      } else if (item.type === 'reroll') {
        if (item.id === 'freeReroll') {
          nextState.freeRerollsPerTurn += item.value || 0;
          addLog(`获得了每回合 +${item.value} 免费重骰。`);
        } else {
          nextState.globalRerolls += item.value || 0;
          addLog(`获得了 ${item.value} 次全局重骰机会。`);
        }
      } else if (item.type === 'maxPlays') {
        nextState.maxPlays += item.value || 0;
        addLog(`获得了 ${item.value} 次出牌机会。`);
      } else if (item.type === 'diceCount') {
        const oldDice = nextState.diceCount;
        nextState.diceCount = Math.min(6, nextState.diceCount + (item.value || 0));
        if (nextState.diceCount > oldDice) {
          nextState.enemyHpMultiplier += 0.25;
          addToast("获得诅咒之力，敌人也都变强了");
          addLog("获得诅咒之力，敌人血量提升 25%。");
        }
        addLog(`获得了 ${item.value} 颗骰子。`);
      }

      return nextState;
    });
  };

  const selectLootAugment = (aug: Augment) => {
    if (!pendingLootAugment) return;
    playSound('select');
    
    const existingIdx = game.augments.findIndex(a => a?.id === aug.id);
    if (existingIdx !== -1) {
      // Upgrade existing
      setGame(prev => {
        const newAugs = [...prev.augments];
        const existing = newAugs[existingIdx]!;
        newAugs[existingIdx] = { ...existing, level: (existing.level || 1) + 1 };
        const nextLoot = prev.lootItems.map(i => i.id === pendingLootAugment.id ? { ...i, collected: true } : i);
        addLog(`升级了模块: ${aug.name} (Lv.${newAugs[existingIdx]!.level})`);
        return { ...prev, augments: newAugs, lootItems: nextLoot };
      });
      setPendingLootAugment(null);
    } else {
      const emptyIdx = game.augments.findIndex(a => a === null);
      if (emptyIdx !== -1) {
        // Add to empty slot
        setGame(prev => {
          const newAugs = [...prev.augments];
          newAugs[emptyIdx] = { ...aug, level: 1 };
          const nextLoot = prev.lootItems.map(i => i.id === pendingLootAugment.id ? { ...i, collected: true } : i);
          addLog(`获得了新模块: ${aug.name}`);
          return { ...prev, augments: newAugs, lootItems: nextLoot };
        });
        setPendingLootAugment(null);
      } else {
        // Slots full, trigger replacement
        setGame(prev => ({ ...prev, pendingReplacementAugment: aug }));
        // Don't close pendingLootAugment yet, or do we? 
        // Let's close it and let the replacement modal handle the loot collection state
        setPendingLootAugment(null);
      }
    }
  };

  const replaceAugment = (newAug: Augment, replaceIdx: number) => {
    playSound('select');
    setGame(prev => {
      const oldAug = prev.augments[replaceIdx];
      const refund = oldAug ? (oldAug.level || 1) * 50 : 0;
      const newAugs = [...prev.augments];
      newAugs[replaceIdx] = { ...newAug, level: 1 };
      
      // Find the loot item that triggered this and mark it collected
      const nextLoot = prev.lootItems.map(i => i.type === 'augment' && !i.collected ? { ...i, collected: true } : i);
      
      addLog(`替换了模块: ${oldAug?.name} -> ${newAug.name}，返还了 ${refund} 金币。`);
      return { 
        ...prev, 
        augments: newAugs, 
        souls: prev.souls + refund,
        lootItems: nextLoot,
        pendingReplacementAugment: null 
      };
    });
  };

  const finishLoot = () => {
    playSound('select');
    setGame(prev => ({
      ...prev,
      phase: 'map'
    }));
  };

  const pickReward = (aug: Augment) => {
    setGame(prev => {
      const newAugs = [...prev.augments];
      const existingIdx = newAugs.findIndex(a => a?.id === aug.id);
      
      if (existingIdx !== -1) {
        const existing = newAugs[existingIdx]!;
        newAugs[existingIdx] = { ...existing, level: (existing.level || 1) + 1 };
        addLog(`升级了模块: ${aug.name} (Lv.${newAugs[existingIdx]!.level})`);
        return { ...prev, augments: newAugs, phase: 'map' };
      } else {
        const emptyIdx = newAugs.findIndex(a => a === null);
        if (emptyIdx !== -1) {
          newAugs[emptyIdx] = { ...aug, level: 1 };
          addLog(`获得了新模块: ${aug.name}`);
          return { ...prev, augments: newAugs, phase: 'map' };
        } else {
          // Shop replacement logic
          return { ...prev, pendingReplacementAugment: aug, phase: 'map' };
        }
      }
    });
  };

  const nextNode = () => {
    const next = game.currentNode + 1;
    if (next === 4 || next === 9) {
      setGame(prev => ({ ...prev, phase: 'campfire', currentNode: next }));
    } else if (next === 5) {
      const augs = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5).slice(0, 2);
      const shopItems: ShopItem[] = [
        { 
          id: 'reroll', 
          type: 'reroll', 
          label: '全局重骰', 
          desc: '增加 1 次全局重骰机会', 
          price: Math.floor(Math.random() * 61) + 20 
        },
        { 
          id: 'dice', 
          type: 'dice', 
          label: '额外骰子', 
          desc: '增加 1 个骰子 (上限 6)', 
          price: Math.floor(Math.random() * 61) + 20 
        },
        ...augs.map(aug => ({
          id: aug.id,
          type: 'augment' as const,
          augment: aug,
          label: aug.name,
          desc: aug.description,
          price: Math.floor(Math.random() * 61) + 20
        }))
      ];
      setGame(prev => ({ ...prev, phase: 'shop', currentNode: next, shopItems }));
    } else if (next === 7) {
      setGame(prev => ({ ...prev, phase: 'event', currentNode: next }));
    } else {
      startBattle(next);
    }
  };

  // --- Sub-components ---

  const AugmentCard = ({ 
    aug, 
    onAction, 
    actionLabel, 
    price 
  }: { 
    aug: Augment; 
    onAction: () => void; 
    actionLabel: string;
    price?: number;
    key?: React.Key;
  }) => {
    const conditionText = useMemo(() => {
      switch (aug.condition) {
        case 'high_card': return '普通攻击';
        case 'pair': return '对子';
        case 'two_pair': return '连对';
        case 'n_of_a_kind': return 'N条';
        case 'full_house': return '葫芦';
        case 'straight': return '顺子';
        default: return '未知';
      }
    }, [aug.condition]);

    return (
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden group"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-amber-500 border border-zinc-700">
            {getAugmentIcon(aug.condition, 20)}
          </div>
          {price !== undefined && (
            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
              <Coins size={12} className="text-amber-500" />
              <span className="text-xs font-mono font-bold text-amber-500">{price}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{aug.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-block px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            触发: {conditionText}
          </div>
          <div className="inline-block px-2 py-0.5 bg-purple-500/20 rounded text-[10px] font-bold text-purple-400 uppercase tracking-wider border border-purple-500/30">
            {aug.condition === 'high_card' ? '任意' : 
             aug.condition === 'pair' ? '2x' :
             aug.condition === 'two_pair' ? '2x+2x' :
             aug.condition === 'n_of_a_kind' ? 'Nx' :
             aug.condition === 'full_house' ? '3x+2x' :
             aug.condition === 'straight' ? 'Seq' :
             aug.condition === 'flush' ? 'Color' : 'Special'}
          </div>
        </div>
        
        <p className="text-xs text-zinc-400 leading-relaxed mb-4 min-h-[3em]">
          {aug.description}
        </p>
        
        <button
          onClick={onAction}
          className="w-full py-2 bg-zinc-100 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-500 transition-colors"
        >
          {actionLabel}
        </button>
      </motion.div>
    );
  };

  const MapScreen = () => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const currentNode = game.map.find(n => n.id === game.currentNodeId);
    const reachableNodes = !game.currentNodeId 
      ? game.map.filter(n => n.depth === 0)
      : currentNode?.connectedTo.map(id => game.map.find(n => n.id === id)!) || [];

    const isInitialMount = React.useRef(true);

    useEffect(() => {
      const scroll = () => {
        if (scrollRef.current) {
          if (currentNode) {
            const nodeElement = document.getElementById(currentNode.id);
            if (nodeElement) {
              nodeElement.scrollIntoView({ 
                behavior: isInitialMount.current ? 'auto' : 'smooth', 
                block: 'center' 
              });
            }
          } else {
            // Scroll to the bottom if no current node (start of game)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
          isInitialMount.current = false;
        }
      };
      
      // Use requestAnimationFrame to ensure layout is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(scroll);
      });
    }, [currentNode]);

    return (
      <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 relative overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent p-6 pb-12 pt-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">THE VOID</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2 font-bold">探索虚空深处 · 第 {game.currentNode + 1} 步</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-zinc-800">
                <Coins size={14} className="text-amber-400" />
                <span className="font-mono font-bold text-sm text-amber-400">{game.souls}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative z-10 px-6 pt-32 pb-48">
          <div className="relative max-w-sm mx-auto">
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" style={{ minHeight: '1700px' }}>
              {game.map.map(node => (
                node.connectedTo.map(targetId => {
                  const target = game.map.find(n => n.id === targetId);
                  if (!target) return null;
                  
                  const startX = (node.id.split('-')[2] === '0' ? 16.6 : node.id.split('-')[2] === '1' ? 50 : 83.3);
                  const startY = (14 - node.depth) * 112 + 56;
                  const endX = (target.id.split('-')[2] === '0' ? 16.6 : target.id.split('-')[2] === '1' ? 50 : 83.3);
                  const endY = (14 - target.depth) * 112 + 56;

                  return (
                    <line 
                      key={`${node.id}-${targetId}`}
                      x1={`${startX}%`} y1={`${startY}px`}
                      x2={`${endX}%`} y2={`${endY}px`}
                      stroke="white"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })
              ))}
            </svg>

            {/* Nodes Grid */}
            <div className="flex flex-col gap-12 relative z-10">
              {Array.from({ length: 15 }).reverse().map((_, depthIdx) => {
                const depth = 14 - depthIdx;
                const layerNodes = game.map.filter(n => n.depth === depth);
                
                return (
                  <div key={depth} className="flex justify-around items-center h-16">
                    {layerNodes.map(node => {
                      const isReachable = reachableNodes.some(rn => rn?.id === node.id);
                      const isCurrent = node.id === game.currentNodeId;
                      const isCompleted = node.completed;

                      return (
                        <motion.button
                          key={node.id}
                          id={node.id}
                          whileHover={isReachable ? { scale: 1.2 } : {}}
                          whileTap={isReachable ? { scale: 0.9 } : {}}
                          onClick={() => isReachable && startNode(node)}
                          className={`
                            relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500
                            ${isCurrent ? 'bg-amber-500 border-4 border-white scale-125 shadow-[0_0_30px_rgba(245,158,11,0.6)] z-10' : 
                              isCompleted ? 'bg-zinc-800 border-2 border-zinc-600 opacity-80' :
                              isReachable ? 'bg-zinc-900 border-2 border-zinc-700 hover:border-amber-500 hover:scale-110 cursor-pointer' : 
                              'bg-zinc-950 border border-zinc-900 opacity-30'}
                            ${node.type === 'shop' && isReachable ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}
                            ${node.type === 'campfire' && isReachable ? 'bg-orange-950/40 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : ''}
                            ${node.type === 'event' && isReachable ? 'bg-blue-950/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : ''}
                          `}
                        >
                          {isReachable && (
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className={`absolute inset-0 rounded-2xl blur-xl ${
                                node.type === 'elite' ? 'bg-red-500/20' :
                                node.type === 'boss' ? 'bg-purple-500/20' :
                                node.type === 'shop' ? 'bg-emerald-500/20' :
                                node.type === 'campfire' ? 'bg-orange-500/20' :
                                node.type === 'event' ? 'bg-blue-500/20' :
                                'bg-amber-500/20'
                              }`}
                            />
                          )}
                          <div className={`
                            ${isReachable ? (
                              node.type === 'elite' ? 'text-red-400' :
                              node.type === 'boss' ? 'text-purple-400' :
                              node.type === 'shop' ? 'text-emerald-400' :
                              node.type === 'campfire' ? 'text-orange-400' :
                              node.type === 'event' ? 'text-blue-400' :
                              'text-amber-400'
                            ) : isCurrent ? 'text-zinc-950' : 'text-zinc-500'}
                          `}>
                            {node.type === 'enemy' && <Sword size={24} />}
                            {node.type === 'elite' && <Skull size={24} />}
                            {node.type === 'boss' && <Crown size={32} />}
                            {node.type === 'shop' && <ShoppingBag size={24} />}
                            {node.type === 'event' && <HelpCircle size={24} />}
                            {node.type === 'campfire' && <Flame size={24} />}
                          </div>
                          
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[6px] font-black uppercase tracking-tighter opacity-40">
                              {node.type === 'enemy' && '普通怪'}
                              {node.type === 'elite' && '精英怪'}
                              {node.type === 'boss' && '首领'}
                              {node.type === 'shop' && '黑市'}
                              {node.type === 'event' && '随机事件'}
                              {node.type === 'campfire' && '篝火'}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent p-8">
          <div className="max-w-sm mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">当前生命值</span>
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-red-500" />
                  <span className="font-mono font-bold text-lg">{game.hp}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800 mx-2" />
              <div className="flex flex-col">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">重骰次数</span>
                <div className="flex items-center gap-2 text-amber-400">
                  <Brain size={14} />
                  <span className="font-mono font-bold text-lg">{game.globalRerolls}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => addLog("查看当前状态...")}
              className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getEffectiveIntentValue = (e: Enemy) => {
    let val = e.intent.value;
    if (e.intent.type === '攻击') {
      const weak = e.statuses.find(s => s.type === 'weak');
      if (weak) val = Math.floor(val * 0.75);
      const playerVuln = game.statuses.find(s => s.type === 'vulnerable');
      if (playerVuln) val = Math.floor(val * 1.5);
      const strength = e.statuses.find(s => s.type === 'strength');
      if (strength) val += strength.value;
    }
    return val;
  };

  const LootScreen = () => (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-6 overflow-y-auto">
      <div className="text-center mb-8 mt-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4"
        >
          Victory Loot
        </motion.div>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">战利品拾取</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-4 font-bold">点击物品以拾取</p>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 max-w-sm mx-auto w-full pb-12">
        {game.lootItems.map((item, i) => {
          const getLootInfo = (type: string) => {
            switch (type) {
              case 'augment': return { icon: <Zap size={28} />, color: 'text-blue-400', label: '新模块', bg: 'bg-blue-600' };
              case 'gold': return { icon: <Coins size={28} />, color: 'text-yellow-400', label: '金币', bg: 'bg-yellow-600' };
              case 'reroll': return { icon: <Brain size={28} />, color: 'text-purple-400', label: '重骰机会', bg: 'bg-purple-600' };
              case 'maxPlays': return { icon: <Zap size={28} />, color: 'text-red-400', label: '出牌次数', bg: 'bg-red-600' };
              case 'diceCount': return { icon: <Layers size={28} />, color: 'text-amber-400', label: '骰子数量', bg: 'bg-amber-600' };
              default: return { icon: <Package size={28} />, color: 'text-zinc-400', label: '物品', bg: 'bg-zinc-600' };
            }
          };
          const info = getLootInfo(item.type);

          return (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: item.collected ? 0.3 : 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={!item.collected ? { scale: 1.02, x: 4 } : {}}
              whileTap={!item.collected ? { scale: 0.98 } : {}}
              onClick={() => collectLoot(item.id)}
              disabled={item.collected}
              className={`w-full bg-zinc-900/50 border ${item.collected ? 'border-zinc-800' : 'border-zinc-700/50'} rounded-3xl p-5 hover:bg-zinc-900 transition-all text-left flex items-center gap-5 group relative overflow-hidden`}
            >
              {item.collected && (
                <div className="absolute inset-0 bg-zinc-950/40 flex items-center justify-center z-10">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-500/30 px-2 py-0.5 rounded">已拾取</div>
                </div>
              )}
              <div className={`w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 ${info.color} group-hover:text-white group-hover:${info.bg} transition-colors shadow-xl`}>
                {info.icon}
              </div>
              <div className="flex-1">
                <div className={`text-[9px] font-black ${info.color} uppercase tracking-widest mb-1 opacity-70`}>{info.label}</div>
                <div className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">
                  {item.type === 'augment' ? '技能模块包' : 
                   item.type === 'gold' ? `${item.value} 金币` : 
                   item.type === 'maxPlays' ? `+${item.value} 出牌次数` :
                   item.type === 'diceCount' ? `+${item.value} 骰子` :
                   `+${item.value} 全局重骰机会`}
                </div>
                <div className="text-[10px] text-zinc-400 leading-relaxed">
                  {item.type === 'augment' ? '点击从中选择一个模块' : `点击拾取该奖励`}
                </div>
              </div>
            </motion.button>
          );
        })}

        {pendingLootAugment && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">选择一个模块</h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">点击以确认你的选择</p>
              </div>
              <div className="flex flex-col gap-3">
                {pendingLootAugment.options.map((aug, idx) => {
                  const existing = game.augments.find(a => a?.id === aug.id);
                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectLootAugment(aug)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left flex items-center gap-4 hover:border-blue-500/50 transition-all group"
                    >
                      <div className={`w-12 h-12 ${existing ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {getAugmentIcon(aug.condition, 24)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`text-[10px] font-black ${existing ? 'text-emerald-500' : 'text-blue-400'} uppercase tracking-widest`}>
                            {existing ? `升级 (Lv.${existing.level} -> ${existing.level + 1})` : '新模块'}
                          </div>
                        </div>
                        <div className="text-lg font-black text-white uppercase italic leading-none">{aug.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 leading-tight">{aug.description}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <button 
                onClick={() => setPendingLootAugment(null)}
                className="mt-6 w-full py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {game.lootItems.every(i => i.collected) && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={finishLoot}
            className="mt-4 w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-colors shadow-2xl"
          >
            继续旅程
          </motion.button>
        )}
      </div>
    </div>
  );

  const ShopScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-zinc-950 text-zinc-100 overflow-y-auto">
      <div className="flex items-center gap-2 mb-1 mt-4">
        <ShoppingBag className="text-purple-500" size={20} />
        <h2 className="text-xl font-bold uppercase tracking-tighter italic">黑市商人</h2>
      </div>
      <p className="text-zinc-500 mb-8 text-[10px] uppercase tracking-widest font-bold">“只要有金币，一切皆有可能。”</p>
      
      <div className="grid grid-cols-1 gap-4 w-full max-w-sm pb-12">
        {game.shopItems.map((item, i) => {
          const canAfford = game.souls >= item.price;
          const isDiceLimit = item.type === 'dice' && game.diceCount >= 6;
          const isDisabled = !canAfford || isDiceLimit;

          return (
            <motion.button 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              disabled={isDisabled}
              onClick={() => {
                playSound('select');
                if (item.type === 'reroll') {
                  setGame(prev => ({ ...prev, souls: prev.souls - item.price, globalRerolls: prev.globalRerolls + 1, shopItems: prev.shopItems.filter(si => si.id !== item.id) }));
                } else if (item.type === 'dice') {
                  setGame(prev => ({ ...prev, souls: prev.souls - item.price, diceCount: Math.min(6, prev.diceCount + 1), shopItems: prev.shopItems.filter(si => si.id !== item.id) }));
                } else if (item.type === 'augment' && item.augment) {
                  setGame(prev => ({ 
                    ...prev, 
                    souls: prev.souls - item.price, 
                    shopItems: prev.shopItems.filter(si => si.id !== item.id) 
                  }));
                  pickReward(item.augment);
                }
              }}
              className={`relative w-full p-5 bg-zinc-900 border ${isDisabled ? 'border-zinc-800 opacity-50 grayscale' : 'border-zinc-800 hover:border-purple-500/50'} rounded-3xl transition-all text-left flex items-center gap-5 group overflow-hidden`}
            >
              <div className={`w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 ${isDisabled ? 'text-zinc-600' : 'text-purple-400 group-hover:bg-purple-600 group-hover:text-white'} transition-colors shadow-xl`}>
                {item.type === 'reroll' && <RotateCcw size={28} />}
                {item.type === 'dice' && <Layers size={28} />}
                {item.type === 'augment' && item.augment && getAugmentIcon(item.augment.condition, 28)}
              </div>
              <div className="flex-1">
                <div className={`text-[9px] font-black ${isDisabled ? 'text-zinc-600' : 'text-purple-400'} uppercase tracking-widest mb-1 opacity-70`}>
                  {item.type === 'reroll' ? '基础服务' : item.type === 'dice' ? '基础服务' : '稀有模块'}
                </div>
                <div className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">
                  {item.label}
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  {isDiceLimit ? <span className="text-red-400">已达携带上限 (6)</span> : item.desc}
                </div>
              </div>
              <div className={`flex items-center gap-1 font-mono font-bold ${isDisabled ? 'text-zinc-600' : 'text-yellow-500'} text-sm`}>
                {isDiceLimit ? '--' : item.price} <Coins size={14} />
              </div>
            </motion.button>
          );
        })}

        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
          className="w-full py-4 mt-4 bg-zinc-100 text-zinc-900 font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-white transition-colors"
        >
          离开商店
        </motion.button>
      </div>
    </div>
  );

  const CampfireScreen = () => {
    const equipped = game.augments.filter((a): a is Augment => a !== null);

    if (campfireView === 'upgrade') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-zinc-900 text-zinc-100 overflow-y-auto">
          <div className="flex items-center gap-2 mb-1 mt-4">
            <Zap className="text-blue-400" size={20} />
            <h2 className="text-xl font-bold">模块强化</h2>
          </div>
          <p className="text-zinc-500 mb-6 text-xs text-center">消耗金币提升模块性能，每个模块最高 Lv.5。</p>
          
          <div className="space-y-3 w-full max-w-sm pb-6">
            {equipped.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 italic text-sm">暂无已装备模块</div>
            ) : (
              equipped.map((aug) => {
                const level = aug.level || 1;
                const upgradeCost = level * 40;
                const canUpgrade = game.souls >= upgradeCost && level < 5;

                return (
                  <div key={aug.id} className="bg-zinc-800 rounded-xl border border-zinc-700 p-3 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <div className="text-emerald-500">
                          {getAugmentIcon(aug.condition, 16)}
                        </div>
                        {aug.name}
                        <span className="text-[10px] bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">Lv.{level}</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 font-mono text-xs">
                        {upgradeCost} <Coins size={10} />
                      </div>
                    </div>
                    <button
                      disabled={!canUpgrade}
                      onClick={() => {
                        playSound('armor');
                        setGame(prev => {
                          const newAugments = prev.augments.map(a => 
                            a?.id === aug.id ? { ...a, level: (a.level || 1) + 1 } : a
                          );
                          return {
                            ...prev,
                            souls: prev.souls - upgradeCost,
                            augments: newAugments,
                            phase: 'map'
                          };
                        });
                        addLog(`${aug.name} 已强化至 Lv.${level + 1}！`);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-lg text-xs font-bold transition-colors"
                    >
                      {level >= 5 ? "已达上限" : "强化模块"}
                    </button>
                  </div>
                );
              })
            )}
            
            <button 
              onClick={() => setCampfireView('main')}
              className="w-full py-3 mt-4 bg-zinc-800 text-zinc-400 font-bold rounded-full text-sm border border-zinc-700"
            >
              返回
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-zinc-900 text-zinc-100">
        <Flame className="text-orange-500 w-12 h-12 mb-2 animate-pulse" />
        <h2 className="text-xl font-bold mb-1">篝火营地</h2>
        <p className="text-zinc-500 mb-6 text-xs">在永夜中短暂的温暖。</p>
        
        <div className="space-y-3 w-full max-w-xs">
          <button 
            onClick={() => setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 18), phase: 'map' }))}
            className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-orange-500 transition-all flex items-center justify-between"
          >
            <div className="text-left">
              <div className="text-lg font-bold text-orange-400">休整</div>
              <div className="text-xs text-zinc-500">回复 18 点生命值</div>
            </div>
            <Heart className="text-orange-500/20" size={32} />
          </button>

          <button 
            onClick={() => setCampfireView('upgrade')}
            className="w-full p-4 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-blue-500 transition-all flex items-center justify-between"
          >
            <div className="text-left">
              <div className="text-lg font-bold text-blue-400">强化</div>
              <div className="text-xs text-zinc-500">消耗金币升级已装备模块</div>
            </div>
            <Zap className="text-blue-500/20" size={32} />
          </button>
        </div>
      </div>
    );
  };

  const EventScreen = () => {
    const [event, setEvent] = useState<{title: string, desc: string, icon: React.ReactNode, options: {label: string, sub: string, action: () => void, color: string}[]}>();

    useEffect(() => {
      const handTypesToUpgrade = ['对子', '连对', '顺子', '同花', '葫芦'];
      const randomHandType = handTypesToUpgrade[Math.floor(Math.random() * handTypesToUpgrade.length)];

      const events = [
        {
          title: '阴影中的怪物',
          desc: '你在一处阴影中发现了一只落单的怪物，它似乎正在守护着一个散发着微光的宝箱。',
          icon: <Skull className="text-red-500 w-16 h-16" />,
          options: [
            { 
              label: '发起战斗', 
              sub: '击败它以获取宝箱中的战利品',
              color: 'bg-red-600 hover:bg-red-500',
              action: () => {
                const currentNode = game.map.find(n => n.id === game.currentNodeId);
                if (currentNode) startBattle(currentNode);
              }
            },
            { 
              label: '悄悄绕过', 
              sub: '避免战斗，但可能会在穿过荆棘时受伤 (-5 HP)',
              color: 'bg-zinc-700 hover:bg-zinc-600',
              action: () => {
                addFloatingText('-5', 'text-red-500', <Heart size={16} />, 'player');
                setGame(prev => ({ ...prev, hp: Math.max(1, prev.hp - 5), phase: 'map' }));
                addLog('悄悄绕过了怪物，但受到了 5 点伤害。');
              }
            }
          ]
        },
        {
          title: '古老祭坛',
          desc: '你发现了一个被遗忘的祭坛，上面刻着两种不同的符文。你可以选择其中一种力量。',
          icon: <Sparkles className="text-amber-500 w-16 h-16" />,
          options: [
            { 
              label: '贪婪符文', 
              sub: '立即获得 40 枚金币',
              color: 'bg-amber-600 hover:bg-amber-500',
              action: () => {
                setGame(prev => ({ ...prev, souls: prev.souls + 40, phase: 'map' }));
                addLog('在祭坛获得了 40 金币。');
              }
            },
            { 
              label: '力量符文', 
              sub: '永久增加 1 颗初始骰子',
              color: 'bg-blue-600 hover:bg-blue-500',
              action: () => {
                setGame(prev => ({ ...prev, diceCount: Math.min(6, prev.diceCount + 1), phase: 'map' }));
                addLog('在祭坛获得了 1 颗骰子。');
              }
            }
          ]
        },
        {
          title: '虚空交易',
          desc: '一个虚幻的身影出现在你面前，向你展示了禁忌的知识。但代价是你的生命力。',
          icon: <Brain className="text-purple-500 w-16 h-16" />,
          options: [
            { 
              label: `强化【${randomHandType}】`, 
              sub: `提升该牌型的基础威力 (-15 HP)`,
              color: 'bg-purple-600 hover:bg-purple-500',
              action: () => {
                addFloatingText('-15', 'text-red-500', <Heart size={16} />, 'player');
                setGame(prev => {
                  const currentLevel = prev.handLevels[randomHandType] || 1;
                  return {
                    ...prev,
                    hp: Math.max(1, prev.hp - 15),
                    handLevels: { ...prev.handLevels, [randomHandType]: currentLevel + 1 },
                    phase: 'map'
                  };
                });
                addLog(`消耗 15 生命，【${randomHandType}】升级了！`);
              }
            },
            { 
              label: '洞察未来', 
              sub: '获得 3 次全局重骰机会',
              color: 'bg-zinc-700 hover:bg-zinc-600',
              action: () => {
                setGame(prev => ({ ...prev, globalRerolls: prev.globalRerolls + 3, phase: 'map' }));
                addLog('获得了 3 次全局重骰机会。');
              }
            }
          ]
        },
        {
          title: '致命陷阱',
          desc: '你触发了一个隐藏的机关！无数箭矢从墙壁中射出。',
          icon: <AlertTriangle className="text-orange-500 w-16 h-16" />,
          options: [
            { 
              label: '全力躲避', 
              sub: '虽然避开了要害，但仍受了重伤 (-20 HP)',
              color: 'bg-orange-600 hover:bg-orange-500',
              action: () => {
                addFloatingText('-20', 'text-red-500', <Heart size={16} />, 'player');
                setGame(prev => ({ ...prev, hp: Math.max(1, prev.hp - 20), phase: 'map' }));
                addLog('踩中陷阱，扣除 20 生命。');
              }
            },
            { 
              label: '舍财保命', 
              sub: '丢弃一些金币来触发备用机关 (-30 金币)',
              color: 'bg-zinc-700 hover:bg-zinc-600',
              action: () => {
                setGame(prev => ({ ...prev, souls: Math.max(0, prev.souls - 30), phase: 'map' }));
                addLog('丢弃了 30 金币以避开陷阱。');
              }
            }
          ]
        }
      ];
      setEvent(events[Math.floor(Math.random() * events.length)]);
    }, []);

    if (!event) return null;

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-zinc-950 text-zinc-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center text-center max-w-sm"
        >
          <div className="mb-6 p-4 bg-zinc-900/50 rounded-3xl border border-zinc-800 shadow-2xl">
            {event.icon}
          </div>
          
          <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase italic text-white">{event.title}</h2>
          <p className="text-zinc-400 mb-10 text-sm leading-relaxed">{event.desc}</p>
          
          <div className="flex flex-col gap-3 w-full">
            {event.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={opt.action} 
                className={`group w-full p-4 ${opt.color} rounded-2xl transition-all flex flex-col items-center gap-1 shadow-lg active:scale-95`}
              >
                <span className="font-black uppercase tracking-widest text-sm">{opt.label}</span>
                <span className="text-[10px] opacity-60 font-medium">{opt.sub}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const getAugmentIcon = (condition: string, size = 12) => {
    switch (condition) {
      case 'high_card': return <Sword size={size} />;
      case 'pair': return <Copy size={size} />;
      case 'two_pair': return <Layers size={size} />;
      case 'n_of_a_kind': return <Flame size={size} />;
      case 'full_house': return <Package size={size} />;
      case 'straight': return <TrendingUp size={size} />;
      case 'flush': return <Droplets size={size} />;
      case 'red_count': return <Heart size={size} />;
      default: return <Star size={size} />;
    }
  };

  // --- Render Helpers ---

  const getDiceColorClass = (color: DiceColor, selected: boolean, rolling?: boolean, invalid?: boolean) => {
    const base = "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shadow-inner transition-all duration-200 border-2 ";
    const selection = selected ? "-translate-y-2 shadow-lg ring-2 ring-white " : "translate-y-0 ";
    const rollAnim = rolling ? "animate-pulse blur-[1px] " : "";
    const invalidStyle = invalid ? "opacity-40 grayscale " : "";
    
    switch (color) {
      case '红色': return base + selection + rollAnim + invalidStyle + "bg-red-600 border-red-400 text-white";
      case '蓝色': return base + selection + rollAnim + invalidStyle + "bg-blue-600 border-blue-400 text-white";
      case '紫色': return base + selection + rollAnim + invalidStyle + "bg-purple-600 border-purple-400 text-white";
      case '金色': return base + selection + rollAnim + invalidStyle + "bg-amber-400 border-amber-200 text-zinc-900";
      default: return base + selection + rollAnim + invalidStyle + "bg-zinc-700 border-zinc-500 text-white";
    }
  };

  const StartScreen = () => (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-zinc-950 text-white p-6 overflow-hidden relative sm:border-x border-zinc-800 shadow-2xl">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 -left-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[120px] animate-pulse" />
      </div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-center w-full"
      >
        <h1 className="text-6xl font-black tracking-tighter mb-2 italic">DICE<span className="text-emerald-500">HERO</span></h1>
        <p className="text-zinc-500 uppercase tracking-[0.3em] text-xs mb-16">骰 子 英 雄</p>
        
        <button 
          onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
          className="group relative w-full max-w-[240px] mx-auto py-4 bg-white text-black font-black rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 mb-12 block"
        >
          <span className="relative z-10">开启征程</span>
          <motion.div 
            className="absolute inset-0 bg-emerald-500"
            initial={{ x: '-100%' }}
            whileHover={{ x: 0 }}
            transition={{ type: 'tween' }}
          />
        </button>

        <div className="flex gap-4 justify-center opacity-40 text-[10px] uppercase tracking-widest font-bold flex-wrap">
          <div className="flex items-center gap-1"><Heart size={12} /> {game.maxHp} HP</div>
          <div className="flex items-center gap-1"><RotateCcw size={12} /> {game.globalRerolls} REROLLS</div>
          <div className="flex items-center gap-1"><Layers size={12} /> {game.diceCount} DICE</div>
        </div>
      </motion.div>
    </div>
  );

  const GlobalTopBar = () => {
    const [showGoldTooltip, setShowGoldTooltip] = useState(false);
    const [showRerollTooltip, setShowRerollTooltip] = useState(false);
    const [showPlaysTooltip, setShowPlaysTooltip] = useState(false);
    const [showDiceTooltip, setShowDiceTooltip] = useState(false);

    return (
      <div className="flex justify-between items-center px-4 py-2 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-30 shrink-0">
        <div className="flex items-center gap-2">
          {/* Gold */}
          <div 
            className="relative flex items-center gap-1.5 text-yellow-500 font-mono text-xs cursor-help bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/50"
            onMouseEnter={() => setShowGoldTooltip(true)}
            onMouseLeave={() => setShowGoldTooltip(false)}
            onClick={() => setShowGoldTooltip(!showGoldTooltip)}
          >
            <Coins size={12} /> {game.souls}
            <AnimatePresence>
              {showGoldTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-48 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[100] pointer-events-none max-w-[80vw]"
                >
                  <div className="text-[10px] font-bold mb-1 text-yellow-500 flex items-center gap-1 uppercase tracking-widest">
                    <Coins size={10} /> 金币 (Gold)
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed">
                    虚空中的通用货币。可用于在黑市商人处购买道具、升级或重骰机会。
                  </div>
                  <div className="absolute bottom-full left-4 border-[6px] border-transparent border-b-zinc-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rerolls */}
          <motion.div 
            animate={rerollFlash ? { 
              backgroundColor: ['rgba(39, 39, 42, 0.5)', 'rgba(239, 68, 68, 0.3)', 'rgba(39, 39, 42, 0.5)'],
              borderColor: ['rgba(63, 63, 70, 0.5)', 'rgba(239, 68, 68, 0.5)', 'rgba(63, 63, 70, 0.5)'],
              scale: [1, 1.05, 1]
            } : {}}
            className={`relative flex items-center gap-1.5 ${rerollFlash ? 'text-red-400' : 'text-amber-400'} font-mono text-xs cursor-help bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/50`}
            onMouseEnter={() => setShowRerollTooltip(true)}
            onMouseLeave={() => setShowRerollTooltip(false)}
            onClick={() => setShowRerollTooltip(!showRerollTooltip)}
          >
            <RotateCcw size={12} className={rerollFlash ? 'animate-spin' : ''} /> {game.globalRerolls}
            <AnimatePresence>
              {showRerollTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-48 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[100] pointer-events-none max-w-[60vw]"
                >
                  <div className={`text-[10px] font-bold mb-1 ${rerollFlash ? 'text-red-400' : 'text-amber-400'} flex items-center gap-1 uppercase tracking-widest`}>
                    <RotateCcw size={10} /> 全局重骰 (Rerolls)
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed">
                    全局重骰机会。在战斗中，当本回合免费重骰用尽时，将消耗此次数。
                  </div>
                  <div className="absolute bottom-full left-4 border-[6px] border-transparent border-b-zinc-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Plays Left */}
          <div 
            className="relative flex items-center gap-1.5 text-red-400 font-mono text-xs cursor-help bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/50"
            onMouseEnter={() => setShowPlaysTooltip(true)}
            onMouseLeave={() => setShowPlaysTooltip(false)}
            onClick={() => setShowPlaysTooltip(!showPlaysTooltip)}
          >
            <Zap size={12} /> {game.maxPlays}
            <AnimatePresence>
              {showPlaysTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-48 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[100] pointer-events-none max-w-[60vw]"
                >
                  <div className="text-[10px] font-bold mb-1 text-red-400 flex items-center gap-1 uppercase tracking-widest">
                    <Zap size={10} /> 出牌次数 (Plays)
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed">
                    每回合的最大出牌次数。出牌次数越多，一回合内能造成的伤害越高。
                  </div>
                  <div className="absolute bottom-full right-4 border-[6px] border-transparent border-b-zinc-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dice Count */}
          <div 
            className="relative flex items-center gap-1.5 text-blue-400 font-mono text-xs cursor-help bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/50"
            onMouseEnter={() => setShowDiceTooltip(true)}
            onMouseLeave={() => setShowDiceTooltip(false)}
            onClick={() => setShowDiceTooltip(!showDiceTooltip)}
          >
            <Layers size={12} /> {game.diceCount}
            <AnimatePresence>
              {showDiceTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-48 p-3 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[100] pointer-events-none max-w-[60vw]"
                >
                  <div className="text-[10px] font-bold mb-1 text-blue-400 flex items-center gap-1 uppercase tracking-widest">
                    <Layers size={10} /> 骰子数量 (Dice)
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed">
                    每回合投掷的骰子总数。骰子越多，越容易凑出高级牌型。
                  </div>
                  <div className="absolute bottom-full right-4 border-[6px] border-transparent border-b-zinc-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {game.phase === 'battle' && (
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-800/30 px-2 py-1 rounded">
              回合 {game.battleTurn + 1}
            </div>
          )}
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-800/30 px-2 py-1 rounded">
            深度 {game.map.find(n => n.id === game.currentNodeId)?.depth || 0}
          </div>
        </div>
      </div>
    );
  };

  if (game.phase === 'start') {
    return <StartScreen />;
  }

  if (game.phase === 'gameover') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-zinc-950 text-white p-6 text-center relative overflow-hidden sm:border-x border-zinc-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-zinc-950 pointer-events-none" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full"
        >
          <Skull size={100} className="text-red-600 mb-8 mx-auto drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]" />
          <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">意识消散</h1>
          <p className="text-zinc-500 mb-12 max-w-xs mx-auto leading-relaxed text-sm">你在永夜的深处迷失了方向，所有的记忆与意志都化为了虚无...</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full max-w-[240px] mx-auto py-4 bg-red-600 text-white font-black rounded-full hover:bg-red-500 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-900/40 block"
          >
            重塑意识
          </button>
        </motion.div>
      </div>
    );
  }

  if (game.phase === 'victory') {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-zinc-950 text-white p-6 text-center relative overflow-hidden sm:border-x border-zinc-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-zinc-950 pointer-events-none" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full"
        >
          <Trophy size={100} className="text-amber-400 mb-8 mx-auto drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
          <h1 className="text-5xl font-black mb-4 tracking-tighter text-emerald-500 uppercase italic">黎明已至</h1>
          <p className="text-zinc-400 mb-10 max-w-xs mx-auto leading-relaxed text-sm">你成功穿越了永夜，带回了希望的火种。世界将记住你的名字。</p>
          
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 rounded-3xl w-full max-w-xs mb-10 mx-auto">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">最终金币评价</div>
            <div className="text-5xl font-black text-amber-400 italic">{game.souls}</div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full max-w-[240px] mx-auto py-4 bg-emerald-600 text-white font-black rounded-full hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-900/40 block"
          >
            再续传奇
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full max-w-md mx-auto bg-zinc-950 overflow-hidden font-sans select-none sm:border-x border-zinc-800 shadow-2xl flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <GlobalTopBar />

      <div className="flex-1 overflow-hidden relative">
        {game.phase === 'map' && <MapScreen />}
        {game.phase === 'loot' && <LootScreen />}
        {game.phase === 'shop' && <ShopScreen />}
        {game.phase === 'campfire' && <CampfireScreen />}
        {game.phase === 'event' && <EventScreen />}

        {game.phase === 'battle' && enemy && (
          <motion.div 
            animate={screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
            className="flex flex-col h-full"
          >
            {/* Enemy Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative min-h-[120px]">
            {/* Enemy Floating Damage Numbers */}
            <AnimatePresence>
              {floatingTexts.filter(ft => ft.target === 'enemy').map(ft => (
                <motion.div
                  key={ft.id}
                  initial={{ opacity: 0, y: 20 + ft.y, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -100 + ft.y, x: ft.x, scale: [0.5, 1.2, 1, 1.5] }}
                  transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
                  className={`absolute z-50 font-black text-2xl pointer-events-none flex items-center gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${ft.color}`}
                  style={{ top: '40%' }}
                >
                  {ft.icon}
                  {ft.text}
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.div 
              key={enemy.name}
              onClick={() => setShowEnemyIntentInfo(true)}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={enemyEffect === 'death'
                ? { scale: [1, 1.2, 0], opacity: [1, 1, 0], rotate: [0, 10, -10, 0] }
                : enemyEffect === 'attack' 
                ? { y: [0, 30, 0], scale: [1, 1.1, 1] } 
                : enemyEffect === 'defend' 
                ? { scale: [1, 1.05, 1] } 
                : enemyEffect === 'skill'
                ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                : playerEffect === 'attack'
                ? { x: [0, -8, 8, -8, 0], scale: [1, 0.95, 1] } // Shake when hit
                : { scale: 1, y: 0, opacity: 1 }
              }
              transition={{ duration: enemyEffect === 'death' ? 0.8 : 0.4 }}
              className="relative mb-1 cursor-pointer group"
            >
              <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 shadow-2xl overflow-hidden transition-all duration-500
                ${enemy.name === '永夜主宰' ? 'bg-purple-900/40 border-purple-500/50 shadow-purple-900/50' : 
                  enemy.name.includes('混沌') || enemy.name.includes('典狱长') ? 'bg-red-900/30 border-red-500/40 shadow-red-900/30' : 
                  'bg-zinc-800 border-zinc-700 shadow-black/50'}
                group-hover:border-zinc-500 text-6xl`}
              >
                {enemy.emoji || '💀'}
              </div>
              
              {/* Intent Bubble */}
              <div className="absolute -top-2 -right-2 bg-zinc-900 border-2 border-zinc-700 p-2 rounded-xl shadow-xl flex items-center gap-1.5 z-10 group-hover:scale-110 transition-transform">
                {enemy.intent.type === '攻击' ? (
                  <div className="flex items-center gap-1 text-red-500 font-bold text-sm">
                    <AlertCircle size={14} /> {getEffectiveIntentValue(enemy)}
                  </div>
                ) : enemy.intent.type === '防御' ? (
                  <div className="flex items-center gap-1 text-blue-400 font-bold text-sm">
                    <Shield size={14} /> {enemy.intent.value}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5 text-purple-400 font-bold text-[10px] min-w-[32px]">
                    <Zap size={12} />
                    <span className="leading-none">{enemy.intent.description}</span>
                    {enemy.intent.value > 0 && <span className="text-[8px] opacity-70">{enemy.intent.value}</span>}
                  </div>
                )}
              </div>

              {/* Action Effects Overlay */}
              <AnimatePresence>
                {enemyEffect === 'attack' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 0 }}
                    animate={{ opacity: 1, scale: 1.5, y: 100 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 text-6xl drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                  >
                    {enemy.emoji || '💀'}
                  </motion.div>
                )}
                {enemyEffect === 'skill' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                    animate={{ opacity: 1, scale: 2, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 text-6xl drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]"
                  >
                    <Zap className="text-purple-400 w-16 h-16" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="w-full max-w-[200px] space-y-1">
              {/* Enemy Status Icons */}
              <div className="flex flex-wrap gap-1 mb-1 min-h-[20px]">
                {enemy.armor > 0 && <StatusIcon status={{ type: 'armor', value: enemy.armor }} align="center" />}
                {enemy.statuses.map((s, i) => <StatusIcon key={i} status={s} align="center" />)}
              </div>
              
              <div className="flex justify-between items-end">
                <span className="font-bold text-zinc-100 text-xs">{enemy.name}</span>
                <div className="text-[9px] font-mono text-zinc-500 flex gap-2">
                  <span>HP: {enemy.hp} / {enemy.maxHp}</span>
                  <span>ATK: {enemy.intent.type === '攻击' ? getEffectiveIntentValue(enemy) : '-'}</span>
                  <span>ARM: {enemy.armor}</span>
                </div>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <motion.div 
                  className={`h-full ${enemy.armor > 0 ? 'bg-blue-500' : 'bg-red-600'}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Player Area */}
          <div className="px-4 py-2 bg-zinc-900/50 border-t border-zinc-800/50 relative shrink-0">
            {/* Player Floating Damage Numbers */}
            <AnimatePresence>
              {floatingTexts.filter(ft => ft.target === 'player').map(ft => (
                <motion.div
                  key={ft.id}
                  initial={{ opacity: 0, y: 0 + ft.y, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -80 + ft.y, x: ft.x, scale: [0.5, 1.2, 1, 1.5] }}
                  transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
                  className={`absolute z-50 font-black text-2xl pointer-events-none flex items-center gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${ft.color}`}
                  style={{ top: '-20px', left: '50%', marginLeft: '-20px' }}
                >
                  {ft.icon}
                  {ft.text}
                </motion.div>
              ))}
            </AnimatePresence>
            {/* Player Status Icons */}
            <div className="flex flex-wrap gap-1 mb-1 min-h-[20px]">
              {game.armor > 0 && <StatusIcon status={{ type: 'armor', value: game.armor }} align="left" />}
              {game.statuses.map((s, i) => <StatusIcon key={i} status={s} align="left" />)}
            </div>

            <div className="flex justify-between items-end mb-0.5">
              <motion.div 
                animate={hpGained ? { scale: [1, 1.1, 1] } : playerEffect === 'attack' ? { y: [0, -10, 0] } : {}}
                className="flex items-center gap-1.5"
              >
                <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
                  <Heart size={12} className="text-white" />
                </div>
                <span className="font-bold text-xs text-zinc-100">守夜人·伊莱</span>
              </motion.div>
              <span className="text-[9px] font-mono text-zinc-500">{game.hp} / {game.maxHp}</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-1 relative">
              <motion.div 
                className={`h-full ${game.armor > 0 ? 'bg-blue-500' : 'bg-emerald-500'}`}
                initial={{ width: '100%' }}
                animate={{ 
                  width: `${(game.hp / game.maxHp) * 100}%`,
                  scaleY: hpGained ? 1.5 : 1
                }}
              />
            </div>
          </div>

          {/* Dice Tray */}
          <div className="p-2 bg-zinc-900 border-t border-zinc-800 shrink-0">
            {/* Hand Types Guide Button */}
            <div className="flex justify-center mb-2">
              <button 
                onClick={() => setShowHandGuide(true)}
                className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-[8px] font-black text-zinc-500 uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-all flex items-center gap-1.5"
              >
                <HelpCircle size={10} /> 查看牌型图鉴
              </button>
            </div>

            {/* Hand Types Guide Modal */}
            <AnimatePresence>
              {showHandGuide && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                  onClick={() => setShowHandGuide(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">牌型图鉴</h3>
                      <button onClick={() => setShowHandGuide(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-950/50">
                      {HAND_TYPES.map(type => {
                        const level = game.handLevels[type.name] || 1;
                        const levelBonusBase = (level - 1) * 10;
                        const levelBonusMult = (level - 1) * 0.5;
                        const currentBase = type.base + levelBonusBase;
                        const currentMult = type.mult + levelBonusMult;
                        
                        return (
                          <div key={type.id} className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-500">{type.icon}</span>
                                <span className="font-bold text-white text-sm">{type.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                                  {currentBase} x {currentMult.toFixed(1)}
                                </span>
                                {level > 1 && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Lv.{level}</span>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-zinc-400 leading-tight">
                              {type.description.replace(/\(\d+ \+ (总)?点数\) \* \d+\.\d+/, `(${currentBase} + $1点数) * ${currentMult.toFixed(1)}`).replace(/点数 \* \d+\.\d+/, `点数 * ${currentMult.toFixed(1)}`)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calculation Modal */}
            <AnimatePresence>
              {showCalcModal && expectedOutcome && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowCalcModal(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                      <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest italic">结果计算详情</h3>
                      <button onClick={() => setShowCalcModal(false)} className="text-zinc-500 hover:text-white">
                        <X size={18} />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">激活牌型</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 italic">{expectedOutcome.bestHand}</span>
                          {game.handLevels[expectedOutcome.bestHand] > 1 && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                          )}
                          <span className="text-[10px] text-zinc-600 font-mono">(基础 {expectedOutcome.baseHandValue} / 倍率 x{expectedOutcome.handMultiplier.toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">选中骰子</span>
                        <div className="flex gap-1">
                          {expectedOutcome.selectedValues.map((v, i) => (
                            <span key={i} className="w-5 h-5 flex items-center justify-center bg-zinc-800 rounded text-[10px] font-bold text-zinc-100">{v}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-400">基础点数 (X)</span>
                        <span className="text-xs font-bold text-zinc-100">{expectedOutcome.X}</span>
                      </div>
                      <div className="h-px bg-zinc-800" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-500">牌型基础伤害 <span className="text-[9px] opacity-50">({expectedOutcome.baseHandValue} + {expectedOutcome.X}) × {expectedOutcome.handMultiplier}</span></span>
                          <span className="text-zinc-300">{expectedOutcome.baseDamage}</span>
                        </div>
                        {expectedOutcome.extraDamage !== 0 && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-500">加成伤害 <span className="text-[9px] opacity-50">× {expectedOutcome.multiplier.toFixed(2)}</span></span>
                            <span className="text-amber-500">+{expectedOutcome.extraDamage}</span>
                          </div>
                        )}
                        {expectedOutcome.pierceDamage > 0 && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-500">穿透伤害</span>
                            <span className="text-purple-400">+{expectedOutcome.pierceDamage}</span>
                          </div>
                        )}
                        
                        {/* Status Modifiers */}
                        {game.statuses.find(s => s.type === 'weak') && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-500 flex items-center gap-1">
                              <Wind size={10} className="text-zinc-400" /> 虚弱修正
                            </span>
                            <span className="text-zinc-400">x0.75</span>
                          </div>
                        )}
                        {enemy?.statuses.find(s => s.type === 'vulnerable') && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-500 flex items-center gap-1">
                              <TrendingUp size={10} className="text-red-400" /> 易伤修正
                            </span>
                            <span className="text-red-400">x1.50</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm font-black border-t border-zinc-800 pt-2">
                          <span className="text-zinc-100">最终总伤害</span>
                          <span className="text-red-500">{expectedOutcome.damage}</span>
                        </div>
                        {expectedOutcome.armor > 0 && (
                          <div className="flex justify-between items-center text-sm font-black pt-1">
                            <span className="text-zinc-100">获得护甲</span>
                            <span className="text-blue-400">+{expectedOutcome.armor}</span>
                          </div>
                        )}
                      </div>
                      
                      {expectedOutcome.statusEffects.length > 0 && (
                        <div className="pt-4 space-y-2">
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">附加效果</div>
                          <div className="flex flex-wrap gap-2">
                            {expectedOutcome.statusEffects.map((s, i) => {
                              const info = STATUS_INFO[s.type];
                              return (
                                <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50 ${info.color}`}>
                                  {info.icon}
                                  <span className="text-[10px] font-bold">{info.label} +{s.value}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Outcome Preview */}
            <div className="h-12 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {expectedOutcome ? (
                  <motion.div 
                    key="outcome"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div 
                      className="flex gap-1 mb-1 cursor-help hover:scale-105 transition-transform"
                      onClick={() => setShowCalcModal(true)}
                    >
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] rounded border border-emerald-500/30 font-black italic flex items-center gap-1">
                        {expectedOutcome.bestHand} 
                        {game.handLevels[expectedOutcome.bestHand] > 1 && ` Lv.${game.handLevels[expectedOutcome.bestHand]}`}
                        <Info size={8} />
                      </span>
                    </div>
                    <div className="flex justify-center gap-3 text-[10px] font-bold">
                      {expectedOutcome.damage > 0 && (
                        <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                          <Zap size={10} /> 伤害: {expectedOutcome.damage} 
                        </div>
                      )}
                      {expectedOutcome.armor > 0 && (
                        <div className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20 shadow-[0_0_10px_rgba(96,165,250,0.2)]">
                          <Shield size={10} /> 护甲: +{expectedOutcome.armor}
                        </div>
                      )}
                      {expectedOutcome.heal > 0 && (
                        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <Heart size={10} /> 回复: +{expectedOutcome.heal}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-zinc-700 text-[8px] uppercase font-bold tracking-widest">等待决策...</div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-1 mb-2 h-10 items-end">
              {dice.map((die) => (
                !die.spent && (
                  <motion.button
                    key={die.id}
                    layout
                    initial={{ scale: 0, rotate: -180 }}
                    animate={die.rolling ? { 
                      rotate: [0, 90, 180, 270, 360],
                      scale: [1, 1.1, 1]
                    } : die.playing ? {
                      y: -150,
                      opacity: 0,
                      scale: 1.5,
                      rotate: 360
                    } : { rotate: 0, scale: 1, y: 0, opacity: 1 }}
                    transition={die.rolling ? { repeat: Infinity, duration: 0.2 } : { duration: 0.4 }}
                    onClick={() => !die.rolling && !game.isEnemyTurn && toggleSelect(die.id)}
                    className={getDiceColorClass(die.color, die.selected, die.rolling, invalidDiceIds.has(die.id))}
                  >
                    {die.rolling ? "?" : die.value}
                  </motion.button>
                )
              ))}
            </div>

            <div className="flex gap-1.5 items-center">
              <div className="relative">
                <motion.button
                  disabled={(game.freeRerollsLeft <= 0 && game.globalRerolls <= 0) || dice.every(d => d.spent || d.selected) || game.isEnemyTurn || dice.some(d => d.playing) || game.playsLeft <= 0}
                  onClick={() => {
                    if (game.freeRerollsLeft > 0) {
                      rerollUnselected();
                    } else if (game.globalRerolls > 0) {
                      setRerollFlash(true);
                      setTimeout(() => setRerollFlash(false), 500);
                      rerollUnselected();
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-10 px-3 ${game.freeRerollsLeft > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : game.globalRerolls > 0 ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-red-900/40 hover:bg-red-800/50 text-red-400 border border-red-500/30'} disabled:opacity-30 rounded-lg flex items-center justify-center gap-2 transition-all shrink-0 relative`}
                >
                  <RefreshCw size={16} className={game.freeRerollsLeft > 0 || game.globalRerolls > 0 ? 'animate-spin-slow' : ''} />
                  <span className="text-xs font-mono font-bold">{game.freeRerollsLeft > 0 ? game.freeRerollsLeft : game.globalRerolls}</span>
                  
                  {/* Breathing Light Effect */}
                  {(game.freeRerollsLeft > 0 || game.globalRerolls > 0) && (
                    <motion.div
                      animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`absolute inset-0 rounded-lg blur-sm -z-10 ${game.freeRerollsLeft > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                  )}
                </motion.button>
              </div>
              
              <AnimatePresence mode="wait">
                {game.isEnemyTurn ? (
                  <motion.div
                    key="enemy-turn"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex-1 py-2.5 bg-red-900/50 text-red-200 rounded-lg flex items-center justify-center font-black text-xs uppercase tracking-tighter border border-red-800/50"
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      敌人行动中...
                    </motion.div>
                  </motion.div>
                ) : dice.some(d => d.selected && !d.spent) ? (
                  <motion.button
                    key="play"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={playHand}
                    disabled={dice.some(d => d.playing) || game.playsLeft <= 0 || currentHands.bestHand === '无效牌型'}
                    className={`flex-1 py-2.5 ${currentHands.bestHand === '无效牌型' ? 'bg-zinc-700 text-zinc-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-tighter`}
                  >
                    <Play size={14} fill="currentColor" /> {game.playsLeft > 0 ? (currentHands.bestHand === '无效牌型' ? '无效牌型' : `出牌: ${currentHands.bestHand}`) : '出牌次数耗尽'}
                  </motion.button>
                ) : (dice.every(d => d.spent) || game.playsLeft <= 0) ? (
                  <motion.button
                    key="end"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    disabled={true}
                    className="flex-1 py-2.5 bg-zinc-800 text-zinc-500 rounded-lg font-black text-xs uppercase tracking-tighter"
                  >
                    回合结束中...
                  </motion.button>
                ) : (
                  <div className="flex-1 py-2.5 bg-zinc-800/50 rounded-lg flex items-center justify-center text-zinc-600 font-bold border border-dashed border-zinc-700 text-[10px]">
                    选择骰子以组成牌型
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Augment Row */}
          <div className="p-2 bg-zinc-950 border-t border-zinc-800 flex gap-2 shrink-0 overflow-x-auto no-scrollbar">
            {Array.from({ length: game.slots }).map((_, i) => {
              const aug = game.augments[i];
              const isActive = aug && activeAugments.some(a => a.id === aug.id);
              return (
                <motion.div 
                  key={i}
                  onClick={() => aug && setSelectedAugment(aug)}
                  animate={isActive ? { 
                    scale: [1, 1.05, 1],
                    borderColor: ['#10b981', '#ffffff', '#10b981'],
                  } : { scale: 1, borderColor: '#27272a' }}
                  transition={isActive ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }}
                  className={`flex-1 h-12 rounded-lg border flex flex-col items-center justify-center p-1 text-center transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? "bg-emerald-900/40 border-emerald-500" 
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  {aug ? (
                    <>
                      <div className={`flex items-center justify-center gap-1 mb-0.5 ${isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                        {getAugmentIcon(aug.condition, 12)}
                      </div>
                      <div className={`text-[9px] font-bold leading-tight line-clamp-1 ${isActive ? "text-emerald-400" : "text-zinc-400"}`}>
                        {aug.name}
                      </div>
                      {aug.level && aug.level > 1 && (
                        <div className="text-[8px] text-emerald-500/80 font-mono mt-0.5">Lv.{aug.level}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-zinc-800"><Zap size={14} className="opacity-20" /></div>
                  )}
                </motion.div>
              );
            })}
          </div>

      {/* Hand Type Info Modal */}
      <AnimatePresence>
        {selectedHandTypeInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHandTypeInfo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-2">牌型详情</div>
              <h3 className="text-2xl font-black text-white mb-4 italic">{selectedHandTypeInfo.name}</h3>
              <p className="text-zinc-300 leading-relaxed mb-8">{selectedHandTypeInfo.description}</p>
              <button 
                onClick={() => setSelectedHandTypeInfo(null)}
                className="w-full py-4 bg-zinc-100 text-black font-black rounded-2xl hover:bg-white transition-all"
              >
                确认
              </button>
            </motion.div>
          </div>
        )}

        {showEnemyIntentInfo && enemy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEnemyIntentInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-2">敌人意图</div>
              <h3 className="text-2xl font-black text-white mb-2 italic">{enemy.intent.type}</h3>
              <div className="text-zinc-400 text-sm mb-6 leading-relaxed">
                {enemy.intent.type === '攻击' && (
                  <div className="space-y-2">
                    <p>敌人准备发起一次强力攻击。</p>
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <Sword size={14} /> 预计伤害: {enemy.intent.value} 点
                    </div>
                    <p className="text-xs opacity-60 italic">提示: 使用护甲来抵挡伤害，或者在敌人出手前击败它。</p>
                  </div>
                )}
                {enemy.intent.type === '防御' && (
                  <div className="space-y-2">
                    <p>敌人正在加固防线，准备承受你的下一波攻击。</p>
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                      <Shield size={14} /> 预计护甲: {enemy.intent.value} 点
                    </div>
                    <p className="text-xs opacity-60 italic">提示: 护甲会优先抵扣伤害。你可以尝试使用穿透伤害或等待护甲消失。</p>
                  </div>
                )}
                {enemy.intent.type === '特殊' && (
                  <div className="space-y-2">
                    <p>敌人正在准备一个特殊的技能或状态效果。</p>
                    <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 text-zinc-200">
                      {enemy.intent.description}: {enemy.intent.value} 层
                      <p className="text-xs text-zinc-400 mt-1">
                        {(() => {
                          const map: Record<string, string> = { '剧毒': 'poison', '灼烧': 'burn', '虚弱': 'weak', '易伤': 'vulnerable' };
                          const key = map[enemy.intent.description] || '';
                          return STATUS_INFO[key as keyof typeof STATUS_INFO]?.description || '';
                        })()}
                      </p>
                    </div>
                    <p className="text-xs opacity-60 italic">提示: 特殊技能可能会施加负面状态，请留意你的状态栏。</p>
                  </div>
                )}
              </div>
              
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">敌人状态</div>
              <div className="flex flex-wrap gap-2 mb-8">
                {enemy.armor > 0 && (
                  <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 text-xs">
                    <Shield size={12} /> 护甲 {enemy.armor}
                  </div>
                )}
                {enemy.statuses.map((s, i) => {
                  const info = STATUS_INFO[s.type];
                  return (
                    <div key={i} className={`flex items-center gap-1 bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700 text-xs ${info.color}`}>
                      {info.icon} {info.label} {s.value > 0 ? s.value : ''}
                    </div>
                  );
                })}
                {enemy.armor === 0 && enemy.statuses.length === 0 && (
                  <span className="text-zinc-600 text-xs italic">无特殊状态</span>
                )}
              </div>

              <button 
                onClick={() => setShowEnemyIntentInfo(false)}
                className="w-full py-4 bg-zinc-100 text-black font-black rounded-2xl hover:bg-white transition-all"
              >
                了解
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Augment Detail Modal */}
          <AnimatePresence>
            {selectedAugment && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAugment(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-xs relative"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="absolute top-6 right-6 text-emerald-500/20">
                    {getAugmentIcon(selectedAugment.condition, 48)}
                  </div>
                  <div className="text-emerald-400 font-bold text-xl mb-2 relative z-10">{selectedAugment.name}</div>
                  <div className="text-zinc-500 text-xs uppercase tracking-widest mb-4 relative z-10 flex items-center gap-1">
                    <span className="text-emerald-500">{getAugmentIcon(selectedAugment.condition, 14)}</span>
                    触发条件: {
                    selectedAugment.condition === 'high_card' ? '普通攻击' : 
                    selectedAugment.condition === 'pair' ? '对子' :
                    selectedAugment.condition === 'two_pair' ? '连对' :
                    selectedAugment.condition === 'n_of_a_kind' ? 'N条' :
                    selectedAugment.condition === 'full_house' ? '葫芦' :
                    selectedAugment.condition === 'straight' ? '顺子' :
                    selectedAugment.condition === 'flush' ? '同花' :
                    selectedAugment.condition === 'red_count' ? '红色' : selectedAugment.condition
                  }</div>
                  <div className="text-zinc-300 text-sm mb-6 relative z-10">{selectedAugment.description}</div>
                  <button 
                    onClick={() => setSelectedAugment(null)}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-zinc-100 relative z-10"
                  >
                    关闭
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logs Overlay */}
          <div className="px-3 py-2 bg-black/60 text-[10px] text-zinc-500 font-mono h-[88px] overflow-y-auto shrink-0 flex flex-col gap-0.5 border-t border-zinc-900">
            {game.logs.map((log, i) => (
              <div key={i} className={`${i === 0 ? "text-emerald-400 font-bold" : "opacity-80"} break-words`}>
                {`> ${log}`}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Toasts */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900/95 border border-amber-500/50 text-amber-400 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md"
            >
              <Zap size={14} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Replacement Modal */}
      <AnimatePresence>
        {game.pendingReplacementAugment && (
          <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <div className="text-center mb-8">
                <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4">
                  Slots Full / 槽位已满
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">选择要替换的模块</h3>
                <p className="text-zinc-500 text-xs mt-2">替换现有模块将返还大量金币</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 mb-8 flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <Zap size={32} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">新模块</div>
                  <div className="text-xl font-black text-white uppercase italic">{game.pendingReplacementAugment.name}</div>
                  <div className="text-xs text-zinc-400 mt-1">{game.pendingReplacementAugment.description}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {game.augments.map((aug, i) => aug && (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => replaceAugment(game.pendingReplacementAugment!, i)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:border-red-500/50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-red-500/10 group-hover:text-red-500 transition-colors">
                      <Zap size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">替换槽位 {i + 1}</div>
                      <div className="text-sm font-black text-white uppercase italic">{aug.name} (Lv.{aug.level})</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">返还</div>
                      <div className="text-sm font-black text-emerald-500 flex items-center gap-1">
                        <Coins size={12} />
                        {(aug.level || 1) * 50}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setGame(prev => ({ ...prev, pendingReplacementAugment: null }))}
                className="w-full mt-8 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                放弃新模块
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
