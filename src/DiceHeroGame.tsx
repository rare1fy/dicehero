/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
// 像素图标组件 — 替代所有 lucide-react 和 emoji
import { 
  PixelHeart, PixelShield, PixelRefresh, PixelPlay, PixelCoin, PixelZap,
  PixelSkull, PixelFlame, PixelShopBag, PixelSword, PixelBook, PixelCrown, 
  PixelInfo, PixelTrophy, PixelAttackIntent, PixelArrowUp, 
  PixelArrowDown, PixelClose, PixelStar, 
  PixelDice, PixelMagic, PixelCampfire, PixelQuestion, PixelPoison
} from './components/PixelIcons';
import { motion, AnimatePresence } from 'motion/react';

// --- Modular Imports ---
import type { Die, DiceColor, HandType, StatusType, StatusEffect, Augment, MapNode, Enemy, LootItem, ShopItem, GameState, HandResult } from './types/game';
import { COLORS } from './data/diceColors';
import { AUGMENTS_POOL, INITIAL_AUGMENTS, getScale } from './data/augments';
import { getEnemyForNode } from './data/enemies';
import { HAND_TYPES } from './data/handTypes';
import { STATUS_INFO } from './data/statusInfo';
import { playSound } from './utils/sound';
import { checkHands, canFormValidHand } from './utils/handEvaluator';
import { generateMap, getNodeX } from './utils/mapGenerator';
import { StatusIcon } from './components/StatusIcon';
import { getAugmentIcon, getDiceColorClass, getHpBarClass } from './utils/uiHelpers';
import { formatDescription } from './utils/richText';
import { CSSParticles } from './components/ParticleEffects';
import { TutorialOverlay, isTutorialCompleted } from './components/TutorialOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { GameContext, type SkillModule } from './contexts/GameContext';
import { StartScreen } from './components/StartScreen';
import { GlobalTopBar } from './components/GlobalTopBar';
import { MapScreen } from './components/MapScreen';
import { ShopScreen } from './components/ShopScreen';
import { CampfireScreen } from './components/CampfireScreen';
import { EventScreen } from './components/EventScreen';
import { LootScreen } from './components/LootScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { generateSkillModules } from './data/skillModules';
import { AugmentCard } from './components/AugmentCard';
import { CollapsibleLog } from './components/CollapsibleLog';
import { startBGM, stopBGM } from './utils/sound';
import { PixelSprite, hasSpriteData } from './components/PixelSprite';
import { PLAYER_INITIAL, SHOP_CONFIG, LOOT_CONFIG, SKILL_SELECT_CONFIG } from './config';

export default function DiceHeroGame() {
  const [game, setGame] = useState<GameState>({
    hp: PLAYER_INITIAL.hp,
    maxHp: PLAYER_INITIAL.maxHp,
    armor: PLAYER_INITIAL.armor,
    freeRerollsLeft: PLAYER_INITIAL.freeRerollsPerTurn,
    freeRerollsPerTurn: PLAYER_INITIAL.freeRerollsPerTurn,
    globalRerolls: PLAYER_INITIAL.globalRerolls,
    playsLeft: PLAYER_INITIAL.playsPerTurn,
    maxPlays: PLAYER_INITIAL.playsPerTurn,
    souls: PLAYER_INITIAL.souls,
    slots: PLAYER_INITIAL.augmentSlots,
    diceCount: PLAYER_INITIAL.diceCount,
    handLevels: {},
    augments: Array(PLAYER_INITIAL.augmentSlots).fill(null),
    currentNodeId: null,
    map: generateMap(),
    phase: 'start',
    battleTurn: 0,
    logs: ['欢迎来到 DICE BATTLE。'],
    shopItems: [],
    statuses: [],
    lootItems: [],
    enemyHpMultiplier: 1.0,
    pendingReplacementAugment: null
  });

  const [showHandGuide, setShowHandGuide] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [pendingLootAugment, setPendingLootAugment] = useState<{id: string, options: Augment[] } | null>(null);
  const [showTutorial, setShowTutorial] = useState(!isTutorialCompleted());

  // BGM 管理
  useEffect(() => {
    if (game.phase === 'battle') {
      const currentNode = game.map.find(n => n.id === game.currentNodeId);
      if (currentNode?.type === 'boss') {
        startBGM('boss');
      } else {
        startBGM('battle');
      }
    } else if (game.phase === 'map' || game.phase === 'shop' || game.phase === 'campfire' || game.phase === 'event') {
      startBGM('explore');
    } else if (game.phase === 'start' || game.phase === 'gameover' || game.phase === 'victory') {
      stopBGM();
    }
  }, [game.phase]);

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
  const [toasts, setToasts] = useState<{ id: number, message: string, type?: string }[]>([]);
  const toastIdRef = useRef(0);

  const addToast = (message: string, type: 'info' | 'damage' | 'heal' | 'gold' | 'buff' = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; color: string; icon?: React.ReactNode; target: 'player' | 'enemy' }[]>([]);
  const [selectedAugment, setSelectedAugment] = useState<Augment | null>(null);
  const [campfireView, setCampfireView] = useState<'main' | 'upgrade'>('main');
  const [skillTriggerTexts, setSkillTriggerTexts] = useState<{ id: string; name: string; icon: React.ReactNode; color: string; x: number; delay: number }[]>([]);
  const [handLeftThrow, setHandLeftThrow] = useState(false);

  // --- 战前技能模组选择 ---
  interface SkillModule {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    augment: Augment;
    cost: { type: 'maxHp' | 'reroll' | 'plays' | 'hp'; value: number; label: string };
  }
  const [skillModuleOptions, setSkillModuleOptions] = useState<SkillModule[]>([]);
  const [pendingBattleNode, setPendingBattleNode] = useState<MapNode | null>(null);

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

  const handleSelectSkillModule = (module: SkillModule) => {
    playSound('select');
    const node = pendingBattleNode;
    if (!node) return;

    // 应用代价 + 添加增幅模块（合并为一次setGame）
    setGame(prev => {
      let updated = { ...prev };
      
      // 应用代价
      switch (module.cost.type) {
        case 'maxHp':
          updated.maxHp = Math.max(10, updated.maxHp - module.cost.value);
          updated.hp = Math.min(updated.hp, updated.maxHp);
          break;
        case 'reroll':
          updated.globalRerolls = Math.max(0, updated.globalRerolls - module.cost.value);
          break;
        case 'hp':
          updated.hp = Math.max(1, updated.hp - module.cost.value);
          break;
        case 'plays':
          updated.maxPlays = Math.max(1, updated.maxPlays - module.cost.value);
          break;
      }
      
      // 添加增幅模块
      const newAugments = [...updated.augments];
      const emptySlot = newAugments.findIndex(a => a === null);
      if (emptySlot !== -1) {
        newAugments[emptySlot] = module.augment;
        updated.augments = newAugments;
      } else {
        updated.pendingReplacementAugment = module.augment;
      }
      
      return updated;
    });

    addToast(`装备 ${module.name}，${module.cost.label}`, 'buff');
    addLog(`战前选择了技能模组【${module.name}】，代价：${module.cost.label}`);

    // 开始战斗
    setPendingBattleNode(null);
    startBattle(node);
  };

  const handleSkipSkillModule = () => {
    playSound('select');
    const node = pendingBattleNode;
    if (!node) return;
    setPendingBattleNode(null);
    addLog('跳过了战前技能选择，直接进入战斗。');
    startBattle(node);
  };

  const startBattle = (node: MapNode) => {
    const newEnemy = getEnemyForNode(node, node.depth, game.enemyHpMultiplier);
    setEnemy(newEnemy);
    setEnemyEffect(null);
    setPlayerEffect(null);
    // Boss出场音效
    if (node.type === 'boss') {
      playSound('boss_appear');
    }
    setGame(prev => ({ 
      ...prev, 
      phase: 'battle', 
      battleTurn: 1, 
      currentNodeId: node.id, 
      armor: 0, 
      statuses: [], // 新战斗开始时清空所有状态效果
      freeRerollsLeft: prev.freeRerollsPerTurn,
      playsLeft: prev.maxPlays,
      isEnemyTurn: false 
    }));
    rollAllDice();
    setRerollCount(0);
    addLog(`遭遇 ${newEnemy.name}！`);
  };


  const startNode = (node: MapNode) => {
    playSound('select');
    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      // 只在起点（depth===0）时进入技能模组选择界面
      if (node.depth === 0) {
        setPendingBattleNode(node);
        setSkillModuleOptions(generateSkillModules());
        setGame(prev => ({ ...prev, phase: 'skillSelect', currentNodeId: node.id }));
      } else {
        startBattle(node);
      }
    } else if (node.type === 'shop') {
            const [minPrice, maxPrice] = SHOP_CONFIG.priceRange;
      const randPrice = () => Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
      const augs = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5).slice(0, SHOP_CONFIG.augmentCount);
      const shopItems: ShopItem[] = [
        ...SHOP_CONFIG.fixedItems.map(item => ({ ...item, price: randPrice() })),
        ...augs.map(aug => ({
          id: aug.id,
          type: 'augment' as const,
          augment: aug,
          label: aug.name,
          desc: aug.description,
          price: randPrice()
        }))
      ];
      setGame(prev => ({ ...prev, phase: 'shop', currentNodeId: node.id, shopItems }));
    } else if (node.type === 'campfire') {
      playSound('campfire');
      setCampfireView('main');
      setGame(prev => ({ ...prev, phase: 'campfire', currentNodeId: node.id }));
    } else if (node.type === 'event') {
      playSound('event');
      setGame(prev => ({ ...prev, phase: 'event', currentNodeId: node.id }));
    }
  };

  const rollAllDice = async () => {
    playSound('roll');
    const count = game.diceCount;
    
    // 直接生成最终结果，动画只是视觉效果
    const finalValues = Array.from({ length: count }).map(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      return { value: val, color: COLORS[val] };
    });

    // 设置rolling状态
    setDice(Array.from({ length: count }).map((_, i) => ({
      id: i, value: Math.floor(Math.random() * 6) + 1, 
      color: COLORS[Math.floor(Math.random() * 6) + 1] || '蓝色', 
      selected: false, spent: false, rolling: true
    })));

    // 快速翻滚动画 — 8帧，递减速度
    const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
    for (let i = 0; i < frameTimes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[i]));
      setDice(prev => prev.map(d => ({
        ...d,
        value: Math.floor(Math.random() * 6) + 1,
        color: COLORS[Math.floor(Math.random() * 6) + 1] || '蓝色'
      })));
      if (i === 3) playSound('reroll'); // 中间一次额外碰撞音
    }

    // 落定 + 弹跳
    const finalDice = finalValues.map((f, i) => ({
      id: i, value: f.value, color: f.color, selected: false, spent: false, rolling: false
    }));
    setDice(finalDice);
    playSound('dice_lock');
    addLog(`[骰] ${finalDice.map(d => `${d.value}(${d.color[0]})`).join(' ')}`);
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

    // 快速翻滚动画 — 6帧递减
    const frameTimes = [30, 40, 60, 80, 100, 130];
    for (let i = 0; i < frameTimes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[i]));
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
    const die = dice.find(d => d.id === id);
    if (!die) return;
    if (die.spent) { addToast('该骰子已使用'); return; }
    if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
    if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }
    
    const selectedCount = dice.filter(d => d.selected && !d.spent).length;
    const isCurrentlySelected = die.selected;

    if (!isCurrentlySelected && selectedCount >= game.slots) { addToast(`最多选择 ${game.slots} 颗骰子`); return; }

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

    // 0. Dice Playing Animation + Left hand throw
    setDice(prev => prev.map(d => d.selected ? { ...d, playing: true } : d));
    setHandLeftThrow(true);
    setTimeout(() => setHandLeftThrow(false), 500);
    await new Promise(r => setTimeout(r, 250));

    // 0.5 Skill/Augment trigger floating texts in battle area
    if (outcome.triggeredAugments.length > 0) {
      playSound('augment_activate');
      const newTriggerTexts = outcome.triggeredAugments.map((aug, idx) => ({
        id: `skill-${Date.now()}-${idx}`,
        name: `${aug.name}`,
        icon: <PixelZap size={2} />,
        color: 'text-[var(--pixel-green-light)]',
        x: (idx - (outcome.triggeredAugments.length - 1) / 2) * 80,
        delay: idx * 150
      }));
      setSkillTriggerTexts(prev => [...prev, ...newTriggerTexts]);
      setTimeout(() => {
        setSkillTriggerTexts(prev => prev.filter(t => !newTriggerTexts.some(n => n.id === t.id)));
      }, 2000);
    }

    // 1. Player Attack Animation — 增强表现力
    setPlayerEffect('attack');
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
    playSound('hit');
    
    if (outcome.damage > 0) {
      const absorbed = Math.min(enemy.armor, outcome.damage);
      const hpDamage = Math.max(0, outcome.damage - absorbed);
      
      if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', <PixelShield size={2} />, 'enemy');
      if (hpDamage > 0) setTimeout(() => addFloatingText(`-${hpDamage}`, 'text-red-500', <PixelHeart size={2} />, 'enemy'), absorbed > 0 ? 150 : 0);
    }

    await new Promise(r => setTimeout(r, 700));

    // 提前计算敌人是否会死亡
    let preCalcRemainingDamage = outcome.damage;
    let preCalcEnemyArmor = enemy.armor;
    if (preCalcEnemyArmor > 0) {
      const preAbsorbed = Math.min(preCalcEnemyArmor, preCalcRemainingDamage);
      preCalcEnemyArmor -= preAbsorbed;
      preCalcRemainingDamage -= preAbsorbed;
    }
    const willDie = enemy.hp - preCalcRemainingDamage <= 0;

    // 如果敌人将死，先触发死亡动画再清除攻击效果，实现衔接
    if (willDie) {
      setEnemyEffect('death');
      setPlayerEffect(null);
    } else {
      setPlayerEffect(null);
    }

    // 2. Apply results
    if (outcome.armor > 0) {
      setArmorGained(true);
      playSound('armor');
      addFloatingText(`+${outcome.armor}`, 'text-blue-400', <PixelShield size={2} />, 'player');
      setTimeout(() => setArmorGained(false), 500);
    }
    if (outcome.heal > 0) {
      setHpGained(true);
      playSound('heal');
      addFloatingText(`+${outcome.heal}`, 'text-emerald-500', <PixelHeart size={2} />, 'player');
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
      // 死亡动画已在受击结束时提前触发（衔接更自然），这里等待动画播完
      await new Promise(r => setTimeout(r, 1200));
      handleVictory();
    }
  };

  const endTurn = async () => {
    playSound('turn_end');
    if (!enemy || game.isEnemyTurn || dice.some(d => d.playing)) return;

    setGame(prev => ({ ...prev, isEnemyTurn: true }));

    // --- Helper: 递减带duration的状态效果 ---
    const tickStatuses = (statuses: StatusEffect[]): StatusEffect[] => {
      return statuses
        .map(s => {
          // poison和burn按value递减（已有逻辑处理），其他状态按duration递减
          if (s.type === 'poison' || s.type === 'burn') return s; // 这些在各自的伤害逻辑中处理
          if (s.duration !== undefined) {
            return { ...s, duration: s.duration - 1 };
          }
          // 没有duration的状态效果，每回合value-1
          return { ...s, value: s.value - 1 };
        })
        .filter(s => {
          if (s.type === 'poison' || s.type === 'burn') return s.value > 0;
          if (s.duration !== undefined) return s.duration > 0;
          return s.value > 0;
        });
    };

    // --- 1. Player Turn End ---
    // 处理玩家中毒
    let currentPlayerHp = game.hp;
    setGame(prev => {
      let nextStatuses = [...prev.statuses];
      let poisonDamage = 0;
      const poison = prev.statuses.find(s => s.type === 'poison');
      if (poison && poison.value > 0) {
        poisonDamage = poison.value;
        addLog(`你因中毒受到了 ${poisonDamage} 点伤害。`);
        addFloatingText(`-${poisonDamage}`, 'text-purple-400', <PixelPoison size={2} />, 'player');
        nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
      }
      currentPlayerHp = Math.max(0, prev.hp - poisonDamage);
      return { ...prev, hp: currentPlayerHp, statuses: nextStatuses };
    });

    await new Promise(r => setTimeout(r, 600));

    // Check if player died from poison
    if (currentPlayerHp <= 0) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    // --- 2. Enemy Turn Start: 处理敌人灼烧 ---
    let currentEnemyHp = enemy.hp;
    setEnemy(prev => {
      if (!prev) return null;
      const burn = prev.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        const dmg = burn.value;
        addLog(`${prev.name} 因灼烧受到了 ${dmg} 点伤害。`);
        addFloatingText(`-${dmg}`, 'text-orange-500', <PixelFlame size={2} />, 'enemy');
        const nextBurnValue = Math.floor(burn.value / 2);
        const nextStatuses = prev.statuses.map(s => s.type === 'burn' ? { ...s, value: nextBurnValue } : s).filter(s => s.value > 0);
        currentEnemyHp = Math.max(0, prev.hp - dmg);
        return { ...prev, hp: currentEnemyHp, statuses: nextStatuses, armor: 0 };
      }
      currentEnemyHp = prev.hp;
      return { ...prev, armor: 0 };
    });

    await new Promise(r => setTimeout(r, 600));

    // 敌人因灼烧死亡 → 立即结束战斗，不再执行后续攻击
    if (currentEnemyHp <= 0) { handleVictory(); return; }

    // --- 3. Enemy Action (只有敌人存活才执行) ---
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
      currentPlayerHp = Math.max(0, game.hp - remainingDamage);

      if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', <PixelShield size={2} />, 'player');
      if (remainingDamage > 0) setTimeout(() => addFloatingText(`-${remainingDamage}`, 'text-red-500', <PixelHeart size={2} />, 'player'), absorbed > 0 ? 150 : 0);

      setGame(prev => ({ ...prev, hp: Math.max(0, prev.hp - remainingDamage), armor: playerArmor - absorbed }));
      
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
      
      const applyStatusToPlayer = (type: StatusType, val: number, duration?: number) => {
        setGame(prev => {
          const nextStatuses = [...prev.statuses];
          const existing = nextStatuses.find(s => s.type === type);
          if (existing) {
            existing.value += val;
            if (duration !== undefined) existing.duration = Math.max(existing.duration ?? 0, duration);
          }
          else nextStatuses.push({ type, value: val, duration });
          return { ...prev, statuses: nextStatuses };
        });
      };

      if (intent.description === '重构') {
        setEnemy(prev => prev ? { ...prev, hp: Math.min(prev.maxHp, prev.hp + intent.value) } : null);
        addFloatingText(`+${intent.value}`, 'text-emerald-500', <PixelHeart size={2} />, 'enemy');
      } else if (intent.description === '虚弱') {
        applyStatusToPlayer('weak', intent.value, 3);
        addFloatingText(`虚弱 ${intent.value}`, 'text-zinc-400', <PixelArrowDown size={2} />, 'player');
      } else if (intent.description === '剧毒') {
        applyStatusToPlayer('poison', intent.value);
        addFloatingText(`中毒 ${intent.value}`, 'text-purple-400', <PixelPoison size={2} />, 'player');
      } else if (intent.description === '灼烧') {
        applyStatusToPlayer('burn', intent.value);
        addFloatingText(`灼烧 ${intent.value}`, 'text-orange-500', <PixelFlame size={2} />, 'player');
      } else if (intent.description === '力量') {
        setEnemy(prev => {
          if (!prev) return null;
          const nextStatuses = [...prev.statuses];
          const existing = nextStatuses.find(s => s.type === 'strength');
          if (existing) existing.value += intent.value;
          else nextStatuses.push({ type: 'strength', value: intent.value, duration: 3 });
          return { ...prev, statuses: nextStatuses };
        });
        addFloatingText(`力量 ${intent.value}`, 'text-orange-400', <PixelArrowUp size={2} />, 'enemy');
      } else if (intent.description === '易伤') {
        applyStatusToPlayer('vulnerable', intent.value, 3);
        addFloatingText(`易伤 ${intent.value}`, 'text-red-400', <PixelArrowUp size={2} />, 'player');
      }
      
      await new Promise(r => setTimeout(r, 600));
      setEnemyEffect(null);
    }

    // Check if player died from attack
    if (currentPlayerHp <= 0) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    // --- 4. Enemy Turn End: 处理敌人中毒 ---
    setEnemy(prev => {
      if (!prev) return null;
      let nextStatuses = [...prev.statuses];
      let poisonDamage = 0;
      const poison = prev.statuses.find(s => s.type === 'poison');
      if (poison && poison.value > 0) {
        poisonDamage = poison.value;
        addLog(`${prev.name} 因中毒受到了 ${poisonDamage} 点伤害。`);
        addFloatingText(`-${poisonDamage}`, 'text-purple-400', <PixelPoison size={2} />, 'enemy');
        nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
      }
      // 递减敌人其他状态效果的duration
      nextStatuses = tickStatuses(nextStatuses);
      currentEnemyHp = Math.max(0, prev.hp - poisonDamage);
      return { ...prev, hp: currentEnemyHp, statuses: nextStatuses };
    });

    await new Promise(r => setTimeout(r, 600));

    // Check if enemy died from poison
    if (currentEnemyHp <= 0) { handleVictory(); return; }

    // --- 5. Player Turn Start ---
    setGame(prev => {
      const nextTurn = prev.battleTurn + 1;
      let nextStatuses = [...prev.statuses];
      let burnDamage = 0;
      const burn = prev.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        burnDamage = burn.value;
        addLog(`你因灼烧受到了 ${burnDamage} 点伤害。`);
        addFloatingText(`-${burnDamage}`, 'text-orange-500', <PixelFlame size={2} />, 'player');
        const nextBurnValue = Math.floor(burn.value / 2);
        nextStatuses = nextStatuses.map(s => s.type === 'burn' ? { ...s, value: nextBurnValue } : s).filter(s => s.value > 0);
      }

      // 递减玩家其他状态效果的duration
      nextStatuses = tickStatuses(nextStatuses);

      // Update enemy intent for next turn
      if (enemy.pattern) {
        setEnemy(e => e ? { ...e, intent: enemy.pattern!(nextTurn, e, prev) } : null);
      }

      currentPlayerHp = Math.max(0, prev.hp - burnDamage);
      return { 
        ...prev, 
        battleTurn: nextTurn, 
        hp: currentPlayerHp,
        statuses: nextStatuses,
        isEnemyTurn: false
      };
    });

    await new Promise(r => setTimeout(r, 100));

    // Final player death check & reset turn state
    if (currentPlayerHp <= 0) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    setGame(prev => ({ 
      ...prev, 
      isEnemyTurn: false, 
      armor: 0,
      playsLeft: prev.maxPlays,
      freeRerollsLeft: prev.freeRerollsPerTurn
    }));

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
      const eliteRewards = LOOT_CONFIG.eliteRewards;
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
      for (let i = 0; i < LOOT_CONFIG.augmentChoiceCount; i++) options.push(pool[i]);
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
        }
        addLog(`获得了 ${item.value} 颗骰子。`);
      }

      return nextState;
    });
    
    // Dice gained toast — outside setGame to avoid StrictMode double-fire
    if (item.type === 'diceCount' && game.diceCount < 6) {
      addToast("获得诅咒之力，敌人也都变强了");
      addLog("获得诅咒之力，敌人血量提升 25%。");
    }
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
            const [minP, maxP] = SHOP_CONFIG.priceRange;
      const rp = () => Math.floor(Math.random() * (maxP - minP + 1)) + minP;
      const augs = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5).slice(0, SHOP_CONFIG.augmentCount);
      const shopItems: ShopItem[] = [
        ...SHOP_CONFIG.fixedItems.map(item => ({ ...item, price: rp() })),
        ...augs.map(aug => ({
          id: aug.id,
          type: 'augment' as const,
          augment: aug,
          label: aug.name,
          desc: aug.description,
          price: rp()
        }))
      ];
      setGame(prev => ({ ...prev, phase: 'shop', currentNode: next, shopItems }));
    } else if (next === 7) {
      setGame(prev => ({ ...prev, phase: 'event', currentNode: next }));
    } else {
      startBattle(next);
    }
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









  // --- GameContext Provider Value ---
  const contextValue = {
    game, setGame,
    enemy, setEnemy,
    dice, setDice,
    showTutorial, setShowTutorial,
    showHandGuide, setShowHandGuide,
    rerollFlash,
    pendingLootAugment, setPendingLootAugment,
    skillModuleOptions,
    pendingBattleNode,
    startNode, startBattle,
    collectLoot, finishLoot,
    selectLootAugment, replaceAugment,
    pickReward, nextNode,
    addToast,
    addLog,
    handleSelectSkillModule, handleSkipSkillModule,
  };


  if (game.phase === 'start') {
    return <GameContext.Provider value={contextValue}><StartScreen /></GameContext.Provider>;
  }

  if (game.phase === 'gameover') {
    return <GameContext.Provider value={contextValue}><GameOverScreen /></GameContext.Provider>;
  }


  if (game.phase === 'victory') {
    return <GameContext.Provider value={contextValue}><VictoryScreen /></GameContext.Provider>;
  }


  return (
    <GameContext.Provider value={contextValue}>
    <div className="relative h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] overflow-hidden select-none sm:border-x-3 border-[var(--dungeon-panel-border)] flex flex-col scanlines">
      {/* 像素网格背景 */}
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />

      <GlobalTopBar />

      <div className="flex-1 overflow-hidden relative">
        {game.phase === 'map' && <MapScreen />}
        {game.phase === 'loot' && <LootScreen />}
        {game.phase === 'shop' && <ShopScreen />}
        {game.phase === 'campfire' && <CampfireScreen />}
        {game.phase === 'event' && <EventScreen />}

        {/* ===== 战前技能模组选择界面 ===== */}
        {game.phase === 'skillSelect' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full relative overflow-hidden"
          >
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,10,30,0.9)] via-[rgba(10,8,18,0.95)] to-[rgba(5,5,10,1)]" />
            <div className="absolute inset-0 dungeon-floor-cracks opacity-20" />
            
            {/* 标题区 */}
            <div className="relative z-10 text-center pt-6 pb-3">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-[9px] tracking-[0.2em] text-[var(--pixel-purple)] font-bold mb-1">◆ 战前准备 ◆</div>
                <h2 className="text-lg font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow mb-1">选择技能模组</h2>
                <p className="text-[9px] text-[var(--dungeon-text-dim)]">选择一个模组获得增幅，但需付出代价</p>
              </motion.div>
            </div>

            {/* 分支路径视觉 — 从中心点发散到3个节点 */}
            <div className="relative z-10 flex justify-center py-2">
              <svg width="280" height="60" viewBox="0 0 280 60">
                {/* 起始节点 */}
                <circle cx="140" cy="8" r="5" fill="var(--pixel-cyan)" opacity="0.8" />
                <circle cx="140" cy="8" r="3" fill="var(--dungeon-text-bright)" />
                
                {/* 3条分支路径 */}
                {skillModuleOptions.map((_, i) => {
                  const endX = 50 + i * 90;
                  return (
                    <motion.path
                      key={i}
                      d={`M 140 13 Q ${140 + (endX - 140) * 0.3} 30 ${endX} 52`}
                      stroke="var(--pixel-purple)"
                      strokeWidth="2"
                      fill="none"
                      opacity="0.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                    />
                  );
                })}
                
                {/* 3个目标节点 */}
                {skillModuleOptions.map((_, i) => {
                  const cx = 50 + i * 90;
                  return (
                    <motion.g key={`node-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.15 }}>
                      <circle cx={cx} cy="52" r="6" fill="var(--dungeon-panel-bg)" stroke="var(--pixel-purple)" strokeWidth="2" />
                      <circle cx={cx} cy="52" r="3" fill="var(--pixel-purple)" opacity="0.6" />
                    </motion.g>
                  );
                })}
              </svg>
            </div>

            {/* 3个技能模组卡片 */}
            <div className="relative z-10 flex-1 px-3 overflow-y-auto pb-3">
              <div className="grid grid-cols-3 gap-2">
                {skillModuleOptions.map((module, i) => (
                  <motion.button
                    key={module.id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectSkillModule(module)}
                    className="flex flex-col items-center p-2.5 bg-[var(--dungeon-panel-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-purple)] transition-colors relative group"
                    style={{ borderRadius: '4px' }}
                  >
                    {/* 发光效果 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--pixel-purple)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" style={{ borderRadius: '4px' }} />
                    
                    {/* 图标 */}
                    <div className="text-[var(--pixel-purple)] mb-1.5">
                      {module.icon}
                    </div>
                    
                    {/* 名称 */}
                    <div className="text-[10px] font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow mb-1 text-center leading-tight">
                      {module.name}
                    </div>
                    
                    {/* 描述 */}
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] leading-tight text-center mb-2 min-h-[3em]">
                      {formatDescription(module.description)}
                    </div>
                    
                    {/* 分隔线 */}
                    <div className="w-full h-[1px] bg-[var(--dungeon-panel-border)] mb-1.5" />
                    
                    {/* 代价 */}
                    <div className="text-[8px] font-bold text-[var(--pixel-red)] flex items-center gap-0.5">
                      <PixelSkull size={1} />
                      {module.cost.label}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 跳过按钮 */}
            <div className="relative z-10 px-4 pb-4 pt-2">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={handleSkipSkillModule}
                className="w-full py-2.5 pixel-btn pixel-btn-ghost text-[10px] font-bold opacity-70 hover:opacity-100 transition-opacity"
              >
                跳过，直接战斗
              </motion.button>
            </div>
          </motion.div>
        )}

        {game.phase === 'battle' && enemy && (
          <motion.div 
            animate={screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
            className="flex flex-col h-full relative"
          >
            {/* ============================================
                沉浸式第一人称战斗界面
                ============================================ */}

            {/* 地牢环境背景层 */}
            <div className="absolute inset-0 battle-dungeon-env dungeon-stone-wall" />
            <div className="absolute inset-0 battle-vignette z-[1]" />
            <div className="absolute inset-0 dungeon-stain pointer-events-none z-[1]" />
            
            {/* 环境粒子 — 飘散的灰尘/余烬 */}
            <CSSParticles type="ember" count={6} className="opacity-20 z-[2]" />
            <CSSParticles type="float" count={3} className="opacity-15 z-[2]" />
            
            {/* 左右火把光效 — 增强 */}
            <div className="absolute left-2 top-[18%] w-3 h-5 z-[2]">
              <div className="w-3 h-3 bg-[var(--pixel-orange)] torch-glow-left" style={{borderRadius:'1px'}} />
              <div className="w-2 h-1.5 bg-[#e8d068] mx-auto -mt-1 opacity-80" style={{borderRadius:'1px'}} />
              <div className="w-3 h-4 bg-[var(--pixel-orange-dark)] mt-0.5" style={{borderRadius:'0'}} />
              <div className="w-1 h-6 bg-[#3a3a4e] mx-auto" />
            </div>
            <div className="absolute right-2 top-[18%] w-3 h-5 z-[2]">
              <div className="w-3 h-3 bg-[var(--pixel-orange)] torch-glow-right" style={{borderRadius:'1px'}} />
              <div className="w-2 h-1.5 bg-[#e8d068] mx-auto -mt-1 opacity-80" style={{borderRadius:'1px'}} />
              <div className="w-3 h-4 bg-[var(--pixel-orange-dark)] mt-0.5" style={{borderRadius:'0'}} />
              <div className="w-1 h-6 bg-[#3a3a4e] mx-auto" />
            </div>

            {/* 蜘蛛网装饰 */}
            <div className="absolute top-0 left-0 w-10 h-10 dungeon-cobweb-left z-[2] pointer-events-none" />
            <div className="absolute top-0 right-0 w-10 h-10 dungeon-cobweb-right z-[2] pointer-events-none" />

            {/* 锁链装饰 — 左右两侧 */}
            <div className="absolute left-4 top-[8%] z-[2] pointer-events-none dungeon-chain">
              <svg width="8" height="60" viewBox="0 0 8 60" style={{imageRendering:'pixelated'}}>
                <rect x="2" y="0" width="4" height="8" rx="1" fill="none" stroke="#4a4a5e" strokeWidth="2"/>
                <rect x="1" y="10" width="6" height="8" rx="1" fill="none" stroke="#3a3a4e" strokeWidth="2"/>
                <rect x="2" y="20" width="4" height="8" rx="1" fill="none" stroke="#4a4a5e" strokeWidth="2"/>
                <rect x="1" y="30" width="6" height="8" rx="1" fill="none" stroke="#3a3a4e" strokeWidth="2"/>
                <rect x="2" y="40" width="4" height="8" rx="1" fill="none" stroke="#4a4a5e" strokeWidth="2"/>
                <rect x="1" y="50" width="6" height="8" rx="1" fill="none" stroke="#3a3a4e" strokeWidth="2"/>
              </svg>
            </div>
            <div className="absolute right-4 top-[10%] z-[2] pointer-events-none dungeon-chain" style={{animationDelay:'1s'}}>
              <svg width="8" height="50" viewBox="0 0 8 50" style={{imageRendering:'pixelated'}}>
                <rect x="2" y="0" width="4" height="8" rx="1" fill="none" stroke="#4a4a5e" strokeWidth="2"/>
                <rect x="1" y="10" width="6" height="8" rx="1" fill="none" stroke="#3a3a4e" strokeWidth="2"/>
                <rect x="2" y="20" width="4" height="8" rx="1" fill="none" stroke="#4a4a5e" strokeWidth="2"/>
                <rect x="1" y="30" width="6" height="8" rx="1" fill="none" stroke="#3a3a4e" strokeWidth="2"/>
                <rect x="2" y="40" width="4" height="8" rx="1" fill="none" stroke="#4a4a5e" strokeWidth="2"/>
              </svg>
            </div>

            {/* 滴水效果 */}
            <div className="absolute left-8 top-[5%] z-[2] pointer-events-none">
              <div className="w-1 h-1 bg-[#3c6cc8] opacity-40 dungeon-drip" style={{borderRadius:'50%'}} />
            </div>
            <div className="absolute right-12 top-[3%] z-[2] pointer-events-none">
              <div className="w-1 h-1 bg-[#3c6cc8] opacity-30 dungeon-drip" style={{borderRadius:'50%', animationDelay:'1.5s'}} />
            </div>

            {/* 地面裂缝 */}
            <div className="absolute bottom-[42%] left-0 right-0 h-4 dungeon-crack z-[2] pointer-events-none opacity-40" />

            {/* 环境雾气层 */}
            <div className="absolute inset-0 z-[2] pointer-events-none">
              <div className="absolute bottom-[40%] left-0 right-0 h-[30%] animate-fog-drift" 
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(120,90,50,0.05) 0%, transparent 70%)' }} />
            </div>

            {/* 战斗闪光覆盖层 */}
            <AnimatePresence>
              {(playerEffect === 'attack' || enemyEffect === 'attack') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.12, 0.05, 0.08, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, times: [0, 0.15, 0.3, 0.5, 1] }}
                  className={`absolute inset-0 z-[60] pointer-events-none ${playerEffect === 'attack' ? 'bg-red-500' : 'bg-white'}`}
                />
              )}
            </AnimatePresence>
            
            {/* ===== 上半区：3D立体敌人舞台 ===== */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-[3] min-h-0">
              {/* 透视地板 */}
              <div className="battle-floor-perspective" />
              
              {/* 左上角关卡位置信息 */}
              <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5 pointer-events-none">
                <div className="px-2 py-1 bg-[rgba(8,11,14,0.75)] border border-[var(--dungeon-panel-border)] backdrop-blur-sm" style={{borderRadius:'2px'}}>
                  <span className="text-[8px] text-[var(--dungeon-text-dim)] font-bold">第 </span>
                  <span className="text-[9px] text-[var(--pixel-cyan)] font-mono font-bold">{(game.map.find(n => n.id === game.currentNodeId)?.depth || 0) + 1}</span>
                  <span className="text-[8px] text-[var(--dungeon-text-dim)]"> 层</span>
                  <span className="text-[7px] text-[var(--dungeon-text-dim)] ml-1 opacity-60">/ 共{game.map.reduce((max, n) => Math.max(max, n.depth), 0) + 1}层</span>
                </div>
                {game.phase === 'battle' && (
                  <div className="px-2 py-1 bg-[rgba(8,11,14,0.75)] border border-[var(--dungeon-panel-border)] backdrop-blur-sm" style={{borderRadius:'2px'}}>
                    <span className="text-[8px] text-[var(--dungeon-text-dim)] font-bold">回合 </span>
                    <span className="text-[9px] text-[var(--pixel-orange)] font-mono font-bold">{game.battleTurn}</span>
                  </div>
                )}
              </div>

              {/* 敌人舞台光效 */}
              <div className="absolute inset-0 enemy-stage-glow pointer-events-none" />

              {/* 敌人浮动伤害数字 */}
              <AnimatePresence>
                {floatingTexts.filter(ft => ft.target === 'enemy').map(ft => (
                  <motion.div
                    key={ft.id}
                    initial={{ opacity: 0, y: 20 + ft.y, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -120 + ft.y, x: ft.x, scale: [0.5, 1.4, 1.1, 1.6] }}
                    transition={{ duration: 1.5, times: [0, 0.15, 0.7, 1] }}
                    className={`absolute z-50 font-black text-3xl pointer-events-none flex items-center gap-1 drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] ${ft.color}`}
                    style={{ top: '25%' }}
                  >
                    {ft.icon}
                    {ft.text}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 敌人主体 — 去框、放大、RPG风格头顶信息 */}
              <motion.div 
                key={enemy.name}
                onClick={() => setShowEnemyIntentInfo(true)}
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={enemyEffect === 'death'
                  ? { 
                      x: [0, -4, 6, -3, 2, 0, 0, 0],
                      scale: [1, 0.97, 1.03, 0.98, 1, 1.15, 1.3, 0], 
                      opacity: [1, 1, 1, 1, 1, 0.9, 0.6, 0], 
                      rotate: [0, -3, 4, -2, 0, 5, 12, -8], 
                      filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)', 'brightness(1.2)', 'brightness(1)', 'brightness(1.5)', 'brightness(2)', 'brightness(0)'],
                      y: [0, 0, 0, 0, 0, -5, -15, 20]
                    }
                  : enemyEffect === 'attack' 
                  ? { y: [0, -8, 40, 0], scale: [1, 1.08, 1.18, 1] } 
                  : enemyEffect === 'defend' 
                  ? { scale: [1, 1.1, 1] } 
                  : enemyEffect === 'skill'
                  ? { scale: [1, 1.3, 1], rotate: [0, 12, -12, 0] }
                  : playerEffect === 'attack'
                  ? { x: [0, -6, 8, -5, 3, 0], scale: [1, 0.96, 1.02, 0.98, 1], filter: ['brightness(1)', 'brightness(1.3) saturate(1.5)', 'brightness(1.1)', 'brightness(1.2) saturate(1.3)', 'brightness(1)'] }
                  : { scale: 1, y: 0, opacity: 1 }
                }
                transition={{ 
                  duration: enemyEffect === 'death' ? 1.2 : 0.4,
                  ...(enemyEffect === 'death' ? { times: [0, 0.08, 0.16, 0.24, 0.32, 0.5, 0.75, 1], ease: 'easeInOut' } : {})
                }}
                className="relative cursor-pointer group flex flex-col items-center"
              >
                {/* ▲ 头顶信息区 — RPG风格 */}
                <div className="enemy-overhead-info mb-2" style={{position:'relative', left:'auto', transform:'none'}}>
                  {/* 意图指示器 — 纯图标+数值+光效 */}
                  <div className={`flex items-center justify-center mb-1.5 intent-pulse ${
                    enemy.intent.type === '攻击' ? 'intent-indicator-attack' : 
                    enemy.intent.type === '防御' ? 'intent-indicator-defend' : 
                    'intent-indicator-skill'
                  }`}>
                    {enemy.intent.type === '攻击' ? (
                      <div className="flex items-center gap-1.5 font-bold text-lg">
                        <PixelAttackIntent size={3} />
                        <span className="font-mono">{getEffectiveIntentValue(enemy)}</span>
                      </div>
                    ) : enemy.intent.type === '防御' ? (
                      <div className="flex items-center gap-1.5 font-bold text-lg">
                        <PixelShield size={3} />
                        <span className="font-mono">{enemy.intent.value}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 font-bold text-xs">
                        <PixelMagic size={2} />
                        <span>{enemy.intent.description}</span>
                        {enemy.intent.value > 0 && <span className="text-[9px] opacity-80 font-mono">{enemy.intent.value}</span>}
                      </div>
                    )}
                  </div>

                  {/* 敌人名牌 */}
                  <div className="enemy-nameplate text-center">
                    <span className="font-bold text-[var(--dungeon-text-bright)] text-sm pixel-text-shadow tracking-wider">{enemy.name}</span>
                  </div>

                  {/* 血条 — 更宽更醒目 */}
                  <div className="pixel-hp-bar h-4 w-52 relative mt-1.5">
                    <motion.div 
                      className={`h-full ${enemy.armor > 0 ? 'pixel-hp-fill-armor' : 'pixel-hp-fill-critical'}`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-mono font-bold text-white pixel-text-shadow">
                        {enemy.hp}/{enemy.maxHp}
                      </span>
                    </div>
                  </div>
                  
                  {/* 状态效果图标 */}
                  <div className="flex flex-wrap gap-1 justify-center mt-1 min-h-[16px]">
                    {enemy.armor > 0 && <StatusIcon status={{ type: 'armor', value: enemy.armor }} align="center" />}
                    {enemy.statuses.map((s, i) => <StatusIcon key={i} status={s} align="center" />)}
                  </div>
                </div>

                {/* ▼ 敌人像素精灵 — 去框直接展示，大号 */}
                <div className="animate-enemy-breathe relative">
                  {hasSpriteData(enemy.name) ? (
                    <PixelSprite 
                      name={enemy.name} 
                      size={(() => {
                        const currentNode = game.map.find(n => n.id === game.currentNodeId);
                        return currentNode?.type === 'boss' ? 16 : currentNode?.type === 'elite' ? 13 : 10;
                      })()}
                    />
                  ) : (
                    <PixelSkull size={16} />
                  )}
                  
                  {/* 状态光环效果 */}
                  {enemy.statuses.some(s => s.type === 'burn') && (
                    <div className="absolute inset-[-8px] animate-burn-edge pointer-events-none" style={{borderRadius:'50%'}} />
                  )}
                  {enemy.statuses.some(s => s.type === 'poison') && (
                    <div className="absolute inset-[-8px] animate-poison-pulse pointer-events-none" style={{borderRadius:'50%'}} />
                  )}
                  
                  {/* Boss/Elite 光环 */}
                  {(() => {
                    const currentNode = game.map.find(n => n.id === game.currentNodeId);
                    if (currentNode?.type === 'boss') return (
                      <div className="absolute inset-[-12px] pointer-events-none" style={{
                        background: 'radial-gradient(circle, rgba(200,168,60,0.1) 0%, transparent 70%)',
                        borderRadius: '50%'
                      }} />
                    );
                    if (currentNode?.type === 'elite') return (
                      <div className="absolute inset-[-10px] pointer-events-none" style={{
                        background: 'radial-gradient(circle, rgba(139,60,200,0.08) 0%, transparent 70%)',
                        borderRadius: '50%'
                      }} />
                    );
                    return null;
                  })()}
                </div>
                
                {/* 敌人脚下阴影 — 更大更明显 */}
                <div className="mt-1" style={{
                  width: '140%',
                  height: '24px',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 35%, transparent 65%)',
                  borderRadius: '50%',
                  marginLeft: '-20%',
                  filter: 'blur(3px)'
                }} />

                {/* 攻击/技能特效覆盖 */}
                <AnimatePresence>
                  {enemyEffect === 'attack' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: 1, scale: 2.5, y: 120 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 drop-shadow-[0_0_20px_rgba(200,64,60,0.8)]"
                    >
                      <PixelSword size={8} />
                    </motion.div>
                  )}
                  {enemyEffect === 'skill' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                      animate={{ opacity: 1, scale: 3, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 drop-shadow-[0_0_20px_rgba(139,60,200,0.8)]"
                    >
                      <PixelMagic size={8} />
                    </motion.div>
                  )}
                  {/* 玩家攻击时的斩击特效 */}
                  {playerEffect === 'attack' && (
                    <motion.div
                      initial={{ opacity: 1, scaleX: 0 }}
                      animate={{ opacity: [1, 1, 0], scaleX: [0, 1.5, 2], rotate: -15 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-[-20px] pointer-events-none z-30 slash-effect"
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 第一人称双手 */}
              <div className="first-person-hands">
                {/* 左手 — 持骰子 */}
                <div className={`hand-left ${dice.some(d => d.rolling) ? 'hand-left-rolling' : handLeftThrow ? 'hand-left-throw' : ''}`}>
                  <svg width="90" height="110" viewBox="0 0 90 110" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))', transform: 'scaleX(-1)' }}>
                    <defs>
                      <linearGradient id="diceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2e2e48" />
                        <stop offset="100%" stopColor="#18182a" />
                      </linearGradient>
                    </defs>
                    {/* 手臂 — 从下方伸出 */}
                    <rect x="22" y="60" width="40" height="50" fill="#b8906a" stroke="#7a5a3e" strokeWidth="3" />
                    {/* 手臂高光 */}
                    <rect x="48" y="62" width="10" height="46" fill="rgba(212,176,140,0.15)" />
                    {/* 手背 — 面向玩家（第一人称看到手背） */}
                    <rect x="22" y="48" width="40" height="16" rx="2" fill="#c8a07a" stroke="#7a5a3e" strokeWidth="2" />
                    {/* 手背纹理 — 关节凸起 */}
                    <rect x="30" y="51" width="6" height="4" rx="1" fill="rgba(160,120,86,0.4)" />
                    <rect x="40" y="50" width="6" height="4" rx="1" fill="rgba(160,120,86,0.4)" />
                    <rect x="50" y="51" width="6" height="4" rx="1" fill="rgba(160,120,86,0.3)" />
                    {/* 拇指 — 左侧握骰 */}
                    <rect x="14" y="36" width="10" height="20" rx="2" fill="#c8a07a" stroke="#7a5a3e" strokeWidth="2" />
                    {/* 手指弯曲握住骰子 — 只露出指尖 */}
                    <rect x="24" y="42" width="9" height="10" rx="1" fill="#c8a07a" stroke="#7a5a3e" strokeWidth="1.5" />
                    <rect x="35" y="40" width="9" height="12" rx="1" fill="#c8a07a" stroke="#7a5a3e" strokeWidth="1.5" />
                    <rect x="46" y="42" width="9" height="10" rx="1" fill="#b8906a" stroke="#7a5a3e" strokeWidth="1.5" />
                    <rect x="57" y="40" width="8" height="12" rx="1" fill="#a88060" stroke="#7a5a3e" strokeWidth="1.5" />
                    {/* 骰子阴影 */}
                    <rect x="22" y="10" width="44" height="44" rx="3" fill="rgba(0,0,0,0.4)" />
                    {/* 骰子主体 */}
                    <rect x="18" y="6" width="44" height="44" rx="3" fill="url(#diceGrad)" stroke="#d4a030" strokeWidth="3" />
                    {/* 骰子顶部高光 */}
                    <rect x="20" y="8" width="40" height="3" rx="1" fill="rgba(240,200,80,0.12)" />
                    {/* 骰子面 — 5点梅花型 */}
                    <circle cx="30" cy="18" r="3" fill="#f0c850" />
                    <circle cx="50" cy="18" r="3" fill="#f0c850" />
                    <circle cx="40" cy="28" r="3" fill="#f0c850" />
                    <circle cx="30" cy="38" r="3" fill="#d4a030" />
                    <circle cx="50" cy="38" r="3" fill="#d4a030" />
                    {/* 骰子外发光 */}
                    <rect x="16" y="4" width="48" height="48" rx="4" fill="none" stroke="#f0c850" strokeWidth="1" opacity="0.2" />
                  </svg>
                </div>
                {/* 右手 — 持附魔匕首 */}
                <div className={`hand-right ${playerEffect === 'attack' ? 'hand-right-attacking' : ''}`}>
                  <svg width="100" height="130" viewBox="0 0 100 130" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))', transform: 'scaleX(-1)' }}>
                    <defs>
                      <linearGradient id="bladeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e8e8f0" />
                        <stop offset="50%" stopColor="#a0a0c0" />
                        <stop offset="100%" stopColor="#c8c8d8" />
                      </linearGradient>
                      <filter id="bladeGlow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    {/* 刀刃 — 匕首造型 */}
                    <polygon points="50,0 56,6 56,42 50,50 44,42 44,6" fill="url(#bladeGrad)" stroke="#6a6a8e" strokeWidth="2" />
                    {/* 刀刃中线高光 */}
                    <line x1="50" y1="2" x2="50" y2="46" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    {/* 刀刃侧面渐变 */}
                    <polygon points="44,6 50,0 50,50 44,42" fill="rgba(0,0,0,0.15)" />
                    {/* 附魔光纹 — 荧光青符文 */}
                    <rect x="48" y="10" width="4" height="4" fill="#30d8d0" opacity="0.7" />
                    <rect x="48" y="20" width="4" height="4" fill="#108880" opacity="0.5" />
                    <rect x="48" y="30" width="4" height="4" fill="#30d8d0" opacity="0.7" />
                    {/* 护手 — 十字形 */}
                    <rect x="34" y="48" width="32" height="10" rx="1" fill="#d4a030" stroke="#8b6a10" strokeWidth="2" />
                    <rect x="36" y="50" width="28" height="6" fill="rgba(240,200,80,0.3)" />
                    {/* 护手宝石 — 深渊紫 */}
                    <rect x="47" y="50" width="6" height="6" fill="#7a30c0" stroke="#4a1080" strokeWidth="1" />
                    {/* 握柄 — 缠绕皮革 */}
                    <rect x="44" y="58" width="12" height="20" rx="1" fill="#5a3a1a" stroke="#3a2a0e" strokeWidth="2" />
                    <rect x="44" y="60" width="12" height="3" fill="#7a5a2e" opacity="0.5" />
                    <rect x="44" y="66" width="12" height="3" fill="#7a5a2e" opacity="0.5" />
                    <rect x="44" y="72" width="12" height="3" fill="#7a5a2e" opacity="0.5" />
                    {/* 柄尾 */}
                    <rect x="42" y="78" width="16" height="6" rx="1" fill="#d4a030" stroke="#8b6a10" strokeWidth="2" />
                    {/* 手臂 — 从下方伸出 */}
                    <rect x="32" y="82" width="36" height="48" fill="#b8906a" stroke="#7a5a3e" strokeWidth="3" />
                    {/* 手背 — 面向玩家 */}
                    <rect x="28" y="76" width="44" height="18" rx="2" fill="#c8a07a" stroke="#7a5a3e" strokeWidth="3" />
                    {/* 手背纹理 — 关节 */}
                    <rect x="34" y="80" width="6" height="4" rx="1" fill="rgba(160,120,86,0.35)" />
                    <rect x="44" y="79" width="6" height="4" rx="1" fill="rgba(160,120,86,0.35)" />
                    <rect x="54" y="80" width="6" height="4" rx="1" fill="rgba(160,120,86,0.3)" />
                    {/* 手指弯曲握柄 — 只露出指尖 */}
                    <rect x="36" y="66" width="10" height="14" rx="1" fill="#c8a07a" stroke="#7a5a3e" strokeWidth="2" />
                    <rect x="54" y="66" width="10" height="14" rx="1" fill="#c8a07a" stroke="#7a5a3e" strokeWidth="2" />
                    {/* 攻击时刀刃发光 — 荧光青 */}
                    {playerEffect === 'attack' && (
                      <>
                        <polygon points="50,0 56,6 56,42 50,50 44,42 44,6" fill="rgba(48,216,208,0.3)" filter="url(#bladeGlow)" />
                        <line x1="50" y1="-4" x2="50" y2="52" stroke="rgba(48,216,208,0.5)" strokeWidth="4" />
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {/* ▼ 战斗区技能触发飘字 */}
              <AnimatePresence>
                {skillTriggerTexts.map(st => (
                  <motion.div
                    key={st.id}
                    initial={{ opacity: 0, y: 30, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [-10, -40, -70, -110], scale: [0.5, 1.3, 1.1, 0.9] }}
                    transition={{ duration: 1.8, delay: st.delay / 1000, times: [0, 0.15, 0.6, 1] }}
                    className={`absolute z-[55] pointer-events-none flex items-center gap-1.5 ${st.color}`}
                    style={{ 
                      bottom: '25%', 
                      left: `calc(50% + ${st.x}px)`, 
                      transform: 'translateX(-50%)',
                      filter: 'drop-shadow(0 2px 8px rgba(60,200,100,0.6))'
                    }}
                  >
                    {st.icon}
                    <span className="font-bold text-sm pixel-text-shadow whitespace-nowrap">{st.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* ▼ 战斗区域中央牌型+效果预览 — 大号醒目 */}
              <AnimatePresence>
                {expectedOutcome && !game.isEnemyTurn && (
                  <div className="absolute z-[12] bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    {/* 牌型名称 — 大号 + 强发光 */}
                    <motion.div 
                      animate={{ scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      className="px-5 py-2 bg-[rgba(10,10,15,0.92)] border-3 border-[var(--pixel-green)] text-[var(--pixel-green-light)] font-bold text-lg tracking-wider pixel-text-shadow"
                      style={{ borderRadius: '2px', boxShadow: '0 0 16px rgba(60,200,100,0.4), 0 0 32px rgba(60,200,100,0.15), inset 0 0 12px rgba(60,200,100,0.1)' }}
                    >
                      ◆ {expectedOutcome.bestHand} ◆
                      {game.handLevels[expectedOutcome.bestHand] > 1 && (
                        <span className="ml-1 text-xs opacity-70">Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                      )}
                    </motion.div>
                    
                    {/* 效果预览行 — 更大更醒目，点击打开计算详情 */}
                    <div 
                      className="flex items-center gap-3 px-4 py-1.5 bg-[rgba(10,10,15,0.88)] border-2 border-[var(--dungeon-panel-highlight)] pointer-events-auto cursor-pointer active:scale-95 transition-transform"
                      onClick={() => setShowCalcModal(true)}
                      style={{ borderRadius: '2px', boxShadow: '0 0 8px rgba(0,0,0,0.5)' }}
                    >
                      {expectedOutcome.damage > 0 && (
                        <motion.span 
                          animate={{ scale: [1, 1.2, 1], textShadow: ['0 0 4px rgba(200,64,60,0.5)', '0 0 12px rgba(200,64,60,0.8)', '0 0 4px rgba(200,64,60,0.5)'] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="flex items-center gap-1 text-[var(--pixel-red-light)] text-lg font-black pixel-text-shadow"
                        >
                          <PixelZap size={2} />{expectedOutcome.damage}
                        </motion.span>
                      )}
                      {expectedOutcome.armor > 0 && (
                        <span className="flex items-center gap-0.5 text-[var(--pixel-blue-light)] text-base font-bold pixel-text-shadow">
                          <PixelShield size={2} />+{expectedOutcome.armor}
                        </span>
                      )}
                      {expectedOutcome.heal > 0 && (
                        <span className="flex items-center gap-0.5 text-[var(--pixel-green-light)] text-base font-bold pixel-text-shadow">
                          <PixelHeart size={2} />+{expectedOutcome.heal}
                        </span>
                      )}
                      {expectedOutcome.statusEffects && expectedOutcome.statusEffects.length > 0 && (
                        expectedOutcome.statusEffects.map((s, i) => {
                          const info = STATUS_INFO[s.type];
                          return (
                            <span key={i} className={`flex items-center gap-0.5 text-xs font-bold ${info.color}`}>
                              {info.icon} {s.value}
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* 触发的增幅模块 */}
                    {activeAugments.length > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[rgba(10,10,15,0.8)]" style={{ borderRadius: '2px' }}>
                        {activeAugments.map((aug, i) => (
                          <span key={i} className="flex items-center gap-0.5 text-[var(--pixel-green)] text-[9px] font-bold">
                            <PixelZap size={1} />{aug.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* ===== 下半区：玩家HUD ===== */}
            <div className="relative z-[5] player-hud-panel">
              {/* 玩家浮动伤害数字 */}
              <AnimatePresence>
                {floatingTexts.filter(ft => ft.target === 'player').map(ft => (
                  <motion.div
                    key={ft.id}
                    initial={{ opacity: 0, y: 0 + ft.y, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -80 + ft.y, x: ft.x, scale: [0.5, 1.3, 1, 1.5] }}
                    transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
                    className={`absolute z-50 font-bold text-xl pointer-events-none flex items-center gap-1 pixel-text-shadow ${ft.color}`}
                    style={{ top: '-20px', left: '50%', marginLeft: '-20px' }}
                  >
                    {ft.icon}
                    {ft.text}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 玩家状态行：HP + 状态图标 */}
              <div className="px-3 py-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <motion.div 
                    animate={hpGained ? { scale: [1, 1.1, 1] } : playerEffect === 'attack' ? { y: [0, -6, 0] } : {}}
                    className="flex items-center gap-1"
                  >
                    <PixelHeart size={1} />
                    <span className="font-bold text-[9px] text-[var(--dungeon-text)] pixel-text-shadow">守夜人</span>
                  </motion.div>
                  <div className="flex flex-wrap gap-0.5">
                    {game.armor > 0 && <StatusIcon status={{ type: 'armor', value: game.armor }} align="left" />}
                    {game.statuses.map((s, i) => <StatusIcon key={i} status={s} align="left" />)}
                  </div>
                </div>
                <div className={`pixel-hp-bar h-3 relative ${game.statuses.some(s => s.type === 'poison') ? 'animate-poison-pulse' : ''} ${game.statuses.some(s => s.type === 'burn') ? 'animate-burn-edge' : ''}`}>
                  <motion.div 
                    className={`h-full ${game.armor > 0 ? 'pixel-hp-fill-armor' : getHpBarClass(game.hp, game.maxHp)}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${(game.hp / game.maxHp) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] font-mono font-bold text-white pixel-text-shadow">
                      {game.hp}/{game.maxHp} {game.armor > 0 && `[+${game.armor}]`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 骰子操作面板 */}
              <div className="px-2 pb-1 pt-0.5 border-t-2 border-[var(--dungeon-panel-border)]">

                {/* 骰子行 */}
                <div className="flex justify-center gap-2.5 mb-1.5 min-h-[60px] items-end relative">
                  {dice.map((die) => (
                    !die.spent && (
                      <motion.button
                        key={die.id}
                        initial={false}
                        animate={die.rolling ? { 
                          rotate: [0, 90, 180, 270, 360],
                          scale: [1, 1.15, 1, 1.15, 1],
                          y: [0, -10, 0, -8, 0]
                        } : die.playing ? {
                          y: -180,
                          opacity: 0,
                          scale: 2,
                          rotate: 720
                        } : die.selected ? {
                          y: -18,
                          scale: 1.12,
                          rotate: 0
                        } : { rotate: 0, scale: 1, y: 0, opacity: 1 }}
                        transition={die.rolling ? { repeat: Infinity, duration: 0.15, ease: 'linear' } : die.playing ? { duration: 0.4, ease: 'easeOut' } : die.selected ? { duration: 0.12, type: 'spring', stiffness: 500, damping: 25 } : { duration: 0.06, ease: 'easeOut' }}
                        onClick={() => !die.rolling && !game.isEnemyTurn && game.playsLeft > 0 && toggleSelect(die.id)}
                        className={`${getDiceColorClass(die.color, die.selected, die.rolling, invalidDiceIds.has(die.id))} ${die.selected ? 'dice-selected-enhanced' : ''} ${(!die.selected && (game.isEnemyTurn || game.playsLeft <= 0)) ? 'pointer-events-none' : ''}`}
                        style={{ 
                          fontSize: '22px', width: '52px', height: '52px',
                          ...(!die.selected && (game.isEnemyTurn || game.playsLeft <= 0) ? { filter: 'grayscale(0.8) brightness(0.5)', opacity: 0.45 } : {})
                        }}
                      >
                        <span className="pixel-text-shadow font-black">
                          {die.rolling ? "?" : die.value}
                        </span>
                      </motion.button>
                    )
                  ))}
                  {dice.every(d => d.spent) && (
                    <div className="text-[var(--dungeon-text-dim)] text-[9px] font-bold py-4">所有骰子已使用</div>
                  )}
                </div>

                {/* 操作按钮行 */}
                <div className="flex gap-1.5 items-center">
                  {/* 重骰按钮 */}
                  <motion.button
                    disabled={(game.freeRerollsLeft <= 0 && game.globalRerolls <= 0) || dice.every(d => d.spent || d.selected) || game.isEnemyTurn || dice.some(d => d.playing) || game.playsLeft <= 0}
                    onClick={() => {
                      if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
                      if (dice.some(d => d.playing)) { addToast('正在出牌中...'); return; }
                      if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }
                      if (dice.every(d => d.spent || d.selected)) { addToast('没有可重骰的骰子'); return; }
                      if (game.freeRerollsLeft <= 0 && game.globalRerolls <= 0) { addToast('没有剩余重骰次数'); return; }
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
                    className={`h-10 px-3 ${game.freeRerollsLeft > 0 ? 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]' : game.globalRerolls > 0 ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold)] text-[var(--pixel-gold-light)]' : 'bg-[var(--pixel-red-dark)] border-[var(--pixel-red)] text-[var(--pixel-red-light)]'} disabled:opacity-30 border-3 flex items-center justify-center gap-2 transition-all shrink-0`}
                    style={{borderRadius:'2px', boxShadow: game.freeRerollsLeft > 0 ? '0 0 8px rgba(60,200,100,0.2), inset -2px -2px 0 rgba(0,0,0,0.3)' : game.globalRerolls > 0 ? '0 0 8px rgba(200,168,60,0.2), inset -2px -2px 0 rgba(0,0,0,0.3)' : 'inset -2px -2px 0 rgba(0,0,0,0.3)'}}
                  >
                    <PixelRefresh size={2} />
                    <span className="text-[10px] font-mono font-bold">{game.freeRerollsLeft > 0 ? game.freeRerollsLeft : game.globalRerolls}</span>
                  </motion.button>
                  
                  {/* 主行动按钮 */}
                  <AnimatePresence mode="wait">
                    {game.isEnemyTurn ? (
                      <motion.div
                        key="enemy-turn"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex-1 py-2.5 bg-[var(--pixel-red-dark)] text-[var(--pixel-red-light)] border-3 border-[var(--pixel-red)] flex items-center justify-center font-bold text-[10px] tracking-[0.1em] battle-action-btn"
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
                        className={`flex-1 py-2.5 ${currentHands.bestHand === '无效牌型' ? 'bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)]' : 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]'} disabled:opacity-50 border-3 flex items-center justify-center gap-2 font-bold text-[10px] tracking-[0.05em] battle-action-btn`}
                        style={{borderRadius:'2px', boxShadow: currentHands.bestHand !== '无效牌型' ? '0 0 10px rgba(60,200,100,0.25), inset -2px -2px 0 rgba(0,0,0,0.3)' : 'inset -2px -2px 0 rgba(0,0,0,0.3)'}}
                      >
                        <PixelPlay size={2} /> {game.playsLeft > 0 ? (currentHands.bestHand === '无效牌型' ? '无效牌型' : `出牌: ${currentHands.bestHand}`) : '出牌次数耗尽'}
                      </motion.button>
                    ) : (dice.every(d => d.spent) || game.playsLeft <= 0) ? (
                      <motion.button
                        key="end"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        disabled={true}
                        className="flex-1 py-2.5 bg-[var(--dungeon-panel)] text-[var(--dungeon-text-dim)] border-3 border-[var(--dungeon-panel-border)] font-bold text-[10px] tracking-[0.05em]"
                        style={{borderRadius:'2px'}}
                      >
                        回合结束中...
                      </motion.button>
                    ) : (
                      <div className="flex-1 py-2.5 bg-[var(--dungeon-bg)] border-3 border-dashed border-[var(--dungeon-panel-border)] flex items-center justify-center text-[var(--dungeon-text-dim)] font-bold text-[9px]" style={{borderRadius:'2px'}}>
                        选择骰子以组成牌型
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 模块槽行 */}
              <div className="px-2 pb-1.5 pt-1 border-t-2 border-[var(--dungeon-panel-border)] flex gap-1.5 overflow-x-auto no-scrollbar">
                {Array.from({ length: game.slots }).map((_, i) => {
                  const aug = game.augments[i];
                  const isActive = aug && activeAugments.some(a => a.id === aug.id);
                  return (
                    <motion.div 
                      key={i}
                      onClick={() => aug && setSelectedAugment(aug)}
                      animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                      transition={isActive ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }}
                      className={`flex-1 h-10 flex flex-col items-center justify-center p-0.5 text-center cursor-pointer border-3 transition-all duration-200 ${
                        isActive 
                          ? "bg-[var(--pixel-green-dark)] border-[var(--pixel-green)] pixel-select-glow" 
                          : "bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)]"
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      {aug ? (
                        <>
                          <div className={`flex items-center justify-center gap-0.5 ${isActive ? "text-[var(--pixel-green-light)]" : "text-[var(--dungeon-text-dim)]"}`}>
                            {getAugmentIcon(aug.condition, 9)}
                          </div>
                          <div className={`text-[7px] font-bold leading-tight line-clamp-1 ${isActive ? "text-[var(--pixel-green-light)]" : "text-[var(--dungeon-text-dim)]"}`}>
                            {aug.name}
                          </div>
                        </>
                      ) : (
                        <div className="text-[var(--dungeon-panel-border)]"><PixelZap size={1} /></div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* 可折叠日志 */}
              <CollapsibleLog logs={game.logs} />
            </div>

            {/* ===== 弹窗和模态框保持不变 ===== */}

            {/* Hand Types Guide Modal */}
            <AnimatePresence>
              {showHandGuide && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
                  onClick={() => setShowHandGuide(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="pixel-panel w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-4 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center bg-[var(--dungeon-bg-light)]">
                      <h3 className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">◆ 牌型图鉴 ◆</h3>
                      <button onClick={() => setShowHandGuide(false)} className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text-bright)]"><PixelClose size={2} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[var(--dungeon-bg)]">
                      {HAND_TYPES.map(type => {
                        const level = game.handLevels[type.name] || 1;
                        const levelBonusBase = (level - 1) * 10;
                        const levelBonusMult = (level - 1) * 0.5;
                        const currentBase = type.base + levelBonusBase;
                        const currentMult = type.mult + levelBonusMult;
                        
                        return (
                          <div key={type.id} className="pixel-panel-dark p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--pixel-gold)]">{type.icon}</span>
                                <span className="font-bold text-[var(--dungeon-text-bright)] text-xs pixel-text-shadow">{type.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] px-1.5 py-0.5 border border-[var(--dungeon-panel-border)] font-mono" style={{borderRadius:'2px'}}>
                                  {currentBase} x {currentMult.toFixed(1)}
                                </span>
                                {level > 1 && (
                                  <span className="text-[9px] bg-[var(--pixel-green-dark)] text-[var(--pixel-green)] px-1.5 py-0.5 border border-[var(--pixel-green)] font-bold" style={{borderRadius:'2px'}}>Lv.{level}</span>
                                )}
                              </div>
                            </div>
                            <p className="text-[9px] text-[var(--dungeon-text-dim)] leading-tight">
                              {formatDescription(type.description.replace(/\(\d+ \+ (总)?点数\) \* \d+\.\d+/, `(${currentBase} + $1点数) * ${currentMult.toFixed(1)}`).replace(/点数 \* \d+\.\d+/, `点数 * ${currentMult.toFixed(1)}`))}
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
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85"
                  onClick={() => setShowCalcModal(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-sm pixel-panel overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-3 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center bg-[var(--dungeon-bg-light)]">
                      <h3 className="text-[10px] font-bold text-[var(--dungeon-text-bright)] tracking-[0.1em] pixel-text-shadow">◆ 结果计算详情 ◆</h3>
                      <button onClick={() => setShowCalcModal(false)} className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text-bright)]">
                        <PixelClose size={2} />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[var(--dungeon-text-dim)]">激活牌型</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[var(--pixel-green)]">{expectedOutcome.bestHand}</span>
                          {game.handLevels[expectedOutcome.bestHand] > 1 && (
                            <span className="text-[8px] bg-[var(--pixel-green-dark)] text-[var(--pixel-green)] px-1 py-0.5 border border-[var(--pixel-green)] font-bold" style={{borderRadius:'2px'}}>Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                          )}
                          <span className="text-[8px] text-[var(--dungeon-text-dim)] font-mono">(基础 {expectedOutcome.baseHandValue} / 倍率 x{expectedOutcome.handMultiplier.toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[var(--dungeon-text-dim)]">选中骰子</span>
                        <div className="flex gap-1">
                          {expectedOutcome.selectedValues.map((v, i) => (
                            <span key={i} className="w-5 h-5 flex items-center justify-center bg-[var(--dungeon-bg)] border border-[var(--dungeon-panel-border)] text-[9px] font-bold text-[var(--dungeon-text-bright)]" style={{borderRadius:'2px'}}>{v}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[var(--dungeon-text-dim)]">基础点数 (X)</span>
                        <span className="text-[10px] font-bold text-[var(--dungeon-text-bright)]">{expectedOutcome.X}</span>
                      </div>
                      <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[var(--dungeon-text-dim)]">牌型基础伤害 <span className="text-[8px] opacity-50">({expectedOutcome.baseHandValue} + {expectedOutcome.X}) × {expectedOutcome.handMultiplier}</span></span>
                          <span className="text-[var(--dungeon-text)]">{expectedOutcome.baseDamage}</span>
                        </div>
                        {expectedOutcome.extraDamage !== 0 && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-[var(--dungeon-text-dim)]">加成伤害 <span className="text-[8px] opacity-50">× {expectedOutcome.multiplier.toFixed(2)}</span></span>
                            <span className="text-[var(--pixel-gold)]">+{expectedOutcome.extraDamage}</span>
                          </div>
                        )}
                        {expectedOutcome.pierceDamage > 0 && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-[var(--dungeon-text-dim)]">穿透伤害</span>
                            <span className="text-[var(--pixel-purple)]">+{expectedOutcome.pierceDamage}</span>
                          </div>
                        )}
                        
                        {/* Status Modifiers */}
                        {game.statuses.find(s => s.type === 'weak') && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-[var(--dungeon-text-dim)] flex items-center gap-1">
                              <PixelArrowDown size={1} /> 虚弱修正
                            </span>
                            <span className="text-[var(--dungeon-text-dim)]">x0.75</span>
                          </div>
                        )}
                        {enemy?.statuses.find(s => s.type === 'vulnerable') && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-[var(--dungeon-text-dim)] flex items-center gap-1">
                              <PixelArrowUp size={1} /> 易伤修正
                            </span>
                            <span className="text-[var(--pixel-red)]">x1.50</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs font-bold border-t-2 border-[var(--dungeon-panel-border)] pt-2">
                          <span className="text-[var(--dungeon-text-bright)]">最终总伤害</span>
                          <span className="text-[var(--pixel-red)] pixel-text-shadow">{expectedOutcome.damage}</span>
                        </div>
                        {expectedOutcome.armor > 0 && (
                          <div className="flex justify-between items-center text-xs font-bold pt-1">
                            <span className="text-[var(--dungeon-text-bright)]">获得护甲</span>
                            <span className="text-[var(--pixel-blue)] pixel-text-shadow">+{expectedOutcome.armor}</span>
                          </div>
                        )}
                      </div>
                      
                      {expectedOutcome.statusEffects.length > 0 && (
                        <div className="pt-3 space-y-2">
                          <div className="text-[9px] font-bold text-[var(--dungeon-text-dim)] tracking-[0.1em]">附加效果</div>
                          <div className="flex flex-wrap gap-2">
                            {expectedOutcome.statusEffects.map((s, i) => {
                              const info = STATUS_INFO[s.type];
                              return (
                                <div key={i} className={`flex items-center gap-1 px-2 py-1 bg-[var(--dungeon-bg)] border border-[var(--dungeon-panel-border)] ${info.color}`} style={{borderRadius:'2px'}}>
                                  {info.icon}
                                  <span className="text-[9px] font-bold">{info.label} +{s.value}</span>
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

      {/* Hand Type Info Modal */}
      <AnimatePresence>
        {selectedHandTypeInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHandTypeInfo(null)}
              className="absolute inset-0 bg-black/85"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs pixel-panel p-5"
            >
              <div className="text-[9px] tracking-[0.15em] text-[var(--pixel-green)] font-bold mb-2">◆ 牌型详情 ◆</div>
              <h3 className="text-xl font-bold text-[var(--dungeon-text-bright)] mb-3 pixel-text-shadow">{selectedHandTypeInfo.name}</h3>
              <p className="text-[var(--dungeon-text)] text-[11px] leading-relaxed mb-6">{formatDescription(selectedHandTypeInfo.description)}</p>
              <button 
                onClick={() => setSelectedHandTypeInfo(null)}
                className="w-full py-3 pixel-btn pixel-btn-ghost text-xs font-bold"
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
              className="absolute inset-0 bg-black/85"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs pixel-panel p-5"
            >
              <div className="text-[9px] tracking-[0.15em] text-[var(--pixel-red)] font-bold mb-2">◆ 敌人意图 ◆</div>
              <h3 className="text-xl font-bold text-[var(--dungeon-text-bright)] mb-2 pixel-text-shadow">{enemy.intent.type}</h3>
              <div className="text-[var(--dungeon-text-dim)] text-[11px] mb-5 leading-relaxed">
                {enemy.intent.type === '攻击' && (
                  <div className="space-y-2">
                    <p>敌人准备发起一次强力攻击。</p>
                    <div className="flex items-center gap-2 text-[var(--pixel-red)] font-bold">
                      <PixelSword size={2} /> 预计伤害: {enemy.intent.value} 点
                    </div>
                    <p className="text-[10px] text-[var(--dungeon-text-dim)]">提示: 使用护甲来抵挡伤害，或者在敌人出手前击败它。</p>
                  </div>
                )}
                {enemy.intent.type === '防御' && (
                  <div className="space-y-2">
                    <p>敌人正在加固防线，准备承受你的下一波攻击。</p>
                    <div className="flex items-center gap-2 text-[var(--pixel-blue)] font-bold">
                      <PixelShield size={2} /> 预计护甲: {enemy.intent.value} 点
                    </div>
                    <p className="text-[10px] text-[var(--dungeon-text-dim)]">提示: 护甲会优先抵扣伤害。你可以尝试使用穿透伤害或等待护甲消失。</p>
                  </div>
                )}
                {enemy.intent.type === '特殊' && (
                  <div className="space-y-2">
                    <p>敌人正在准备一个特殊的技能或状态效果。</p>
                    <div className="p-2.5 pixel-panel-dark text-[var(--dungeon-text)]">
                      {enemy.intent.description}: {enemy.intent.value} 层
                      <p className="text-[10px] text-[var(--dungeon-text-dim)] mt-1">
                        {(() => {
                          const map: Record<string, string> = { '剧毒': 'poison', '灼烧': 'burn', '虚弱': 'weak', '易伤': 'vulnerable' };
                          const key = map[enemy.intent.description] || '';
                          return STATUS_INFO[key as keyof typeof STATUS_INFO]?.description || '';
                        })()}
                      </p>
                    </div>
                    <p className="text-[10px] text-[var(--dungeon-text-dim)]">提示: 特殊技能可能会施加负面状态，请留意你的状态栏。</p>
                  </div>
                )}
              </div>
              
              <div className="text-[9px] tracking-[0.15em] text-[var(--dungeon-text-dim)] font-bold mb-2">◆ 敌人状态 ◆</div>
              <div className="flex flex-wrap gap-2 mb-6">
                {enemy.armor > 0 && (
                  <div className="flex items-center gap-1 bg-[var(--pixel-blue-dark)] text-[var(--pixel-blue)] px-2 py-1 border border-[var(--pixel-blue)] text-[10px]" style={{borderRadius:'2px'}}>
                    <PixelShield size={2} /> 护甲 {enemy.armor}
                  </div>
                )}
                {enemy.statuses.map((s, i) => {
                  const info = STATUS_INFO[s.type];
                  return (
                    <div key={i} className={`flex items-center gap-1 bg-[var(--dungeon-bg)] px-2 py-1 border border-[var(--dungeon-panel-border)] text-[10px] ${info.color}`} style={{borderRadius:'2px'}}>
                      {info.icon} {info.label} {s.value > 0 ? s.value : ''}
                    </div>
                  );
                })}
                {enemy.armor === 0 && enemy.statuses.length === 0 && (
                  <span className="text-[var(--dungeon-text-dim)] text-[10px]">无特殊状态</span>
                )}
              </div>

              <button 
                onClick={() => setShowEnemyIntentInfo(false)}
                className="w-full py-3 pixel-btn pixel-btn-ghost text-xs font-bold"
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
                className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="pixel-panel p-5 w-full max-w-xs relative"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="absolute top-5 right-5 text-[var(--pixel-green)] opacity-15">
                    {getAugmentIcon(selectedAugment.condition, 40)}
                  </div>
                  <div className="text-[var(--pixel-green)] font-bold text-lg mb-2 relative z-10 pixel-text-shadow">{selectedAugment.name}</div>
                  <div className="text-[var(--dungeon-text-dim)] text-[10px] tracking-[0.1em] mb-3 relative z-10 flex items-center gap-1">
                    <span className="text-[var(--pixel-green)]">{getAugmentIcon(selectedAugment.condition, 12)}</span>
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
                  <div className="text-[var(--dungeon-text)] text-[11px] mb-5 relative z-10">{formatDescription(selectedAugment.description)}</div>
                  <button 
                    onClick={() => setSelectedAugment(null)}
                    className="w-full py-2.5 pixel-btn pixel-btn-ghost text-xs font-bold relative z-10"
                  >
                    关闭
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}

      {/* Toasts — 像素风 */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-xs px-4">
        <AnimatePresence>
          {toasts.map(t => {
            const toastStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
              info: { bg: 'bg-[var(--dungeon-panel)]/85', border: 'border-[var(--pixel-gold)]', text: 'text-[var(--pixel-gold)]', icon: <PixelZap size={2} /> },
              damage: { bg: 'bg-[#2e1010]/85', border: 'border-[var(--pixel-red)]', text: 'text-[var(--pixel-red-light)]', icon: <PixelHeart size={2} /> },
              heal: { bg: 'bg-[#102e1a]/85', border: 'border-[var(--pixel-green)]', text: 'text-[var(--pixel-green-light)]', icon: <PixelHeart size={2} /> },
              gold: { bg: 'bg-[#2e2810]/85', border: 'border-[var(--pixel-gold)]', text: 'text-[var(--pixel-gold-light)]', icon: <PixelCoin size={2} /> },
              buff: { bg: 'bg-[#10102e]/85', border: 'border-[var(--pixel-blue)]', text: 'text-[var(--pixel-blue-light)]', icon: <PixelZap size={2} /> },
            };
            const style = toastStyles[t.type || 'info'] || toastStyles.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className={`${style.bg} border-3 ${style.border} ${style.text} px-3 py-2 flex items-center justify-center gap-2 backdrop-blur-sm`}
                style={{ borderRadius: '2px' }}
              >
                {style.icon}
                <span className="text-[10px] font-bold pixel-text-shadow text-center">{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Replacement Modal */}
      <AnimatePresence>
        {game.pendingReplacementAugment && (
          <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="inline-block px-3 py-1 bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold)] text-[var(--pixel-gold-light)] text-[9px] font-bold tracking-[0.15em] mb-3" style={{borderRadius:'2px'}}>
                  ◆ 槽位已满 ◆
                </div>
                <h3 className="text-xl font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">选择要替换的模块</h3>
                <p className="text-[var(--dungeon-text-dim)] text-[10px] mt-2">替换现有模块将返还大量金币</p>
              </div>

              <div className="pixel-panel p-4 mb-6 flex items-center gap-3">
                <div className="w-14 h-14 bg-[var(--pixel-blue-dark)] border-3 border-[var(--pixel-blue)] flex items-center justify-center text-[var(--pixel-blue-light)]" style={{borderRadius:'2px'}}>
                  <PixelZap size={4} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--pixel-blue)] tracking-[0.1em] mb-0.5">新模块</div>
                  <div className="text-base font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">{game.pendingReplacementAugment.name}</div>
                  <div className="text-[10px] text-[var(--dungeon-text-dim)] mt-0.5">{formatDescription(game.pendingReplacementAugment.description)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {game.augments.map((aug, i) => aug && (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => replaceAugment(game.pendingReplacementAugment!, i)}
                    className="w-full pixel-panel p-3 flex items-center gap-3 transition-all group"
                    style={{ borderColor: 'var(--dungeon-panel-border)' }}
                  >
                    <div className="w-9 h-9 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] flex items-center justify-center text-[var(--dungeon-text-dim)] group-hover:border-[var(--pixel-red)] group-hover:text-[var(--pixel-red)] transition-colors" style={{borderRadius:'2px'}}>
                      <PixelZap size={2} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[9px] font-bold text-[var(--dungeon-text-dim)] tracking-[0.1em] mb-0.5">替换槽位 {i + 1}</div>
                      <div className="text-xs font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">{aug.name} (Lv.{aug.level})</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-[var(--pixel-green)] tracking-[0.1em] mb-0.5">返还</div>
                      <div className="text-xs font-bold text-[var(--pixel-green)] flex items-center gap-1">
                        <PixelCoin size={2} />
                        {(aug.level || 1) * 50}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setGame(prev => ({ ...prev, pendingReplacementAugment: null }))}
                className="w-full mt-6 py-3 text-[9px] font-bold text-[var(--dungeon-text-dim)] tracking-[0.2em] hover:text-[var(--dungeon-text)] transition-colors"
              >
                放弃新模块
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
    </GameContext.Provider>
  );
}
