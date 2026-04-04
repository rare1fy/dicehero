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
import type { Die, DiceElement, HandType, StatusType, StatusEffect, Augment, MapNode, Enemy, LootItem, ShopItem, GameState, HandResult, OwnedDie, RunStats } from './types/game';
import { INITIAL_STATS } from './types/game';
import { INITIAL_DICE_BAG, getDiceDef, rollDiceDef, DICE_BY_RARITY, getDiceRewardPool, pickRandomDice, DICE_MAX_LEVEL, ALL_DICE, collapseElement, ELEMENTAL_COLLAPSE_ELEMENTS } from './data/dice';
import { drawFromBag, discardDice, rerollUnselectedDice, initDiceBag, ownedDiceToIds } from './data/diceBag';
import { DiceBagPanel, MiniDice } from './components/DiceBagPanel';
import { ElementBadge, getOnPlayDescription } from './components/PixelDiceShapes';
import { ALL_RELICS, getRelicRewardPool, pickRandomRelics, RELICS_BY_RARITY } from './data/relics';
import { AUGMENTS_POOL, INITIAL_AUGMENTS, getScale } from './data/augments';
import { getEnemyForNode, getEnemiesForNode } from './data/enemies';
import { HAND_TYPES } from './data/handTypes';
import { STATUS_INFO } from './data/statusInfo';
import { playSound } from './utils/sound';
import { checkHands, canFormValidHand } from './utils/handEvaluator';
import { generateMap, getNodeX } from './utils/mapGenerator';
import { StatusIcon } from './components/StatusIcon';
import { getAugmentIcon, getDiceElementClass, getHpBarClass, ELEMENT_NAMES, ELEMENT_COLORS } from './utils/uiHelpers';
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
import { DiceRewardScreen } from './components/DiceRewardScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { generateSkillModules } from './data/skillModules';
import { AugmentCard, CONDITION_INFO, getConditionInfo } from './components/AugmentCard';
import { CollapsibleLog } from './components/CollapsibleLog';
import { startBGM, stopBGM } from './utils/sound';
import { PixelSprite, hasSpriteData } from './components/PixelSprite';
import { PLAYER_INITIAL, SHOP_CONFIG, LOOT_CONFIG, SKILL_SELECT_CONFIG, CHAPTER_CONFIG } from './config';
import { applyDiceSpecialEffects } from './logic/diceEffects';
import { HandGuideModal } from './components/HandGuideModal';
import { ChapterTransition } from './components/ChapterTransition';
import { SkillSelectScreen } from './components/SkillSelectScreen';
import { ReplacementModal } from './components/ReplacementModal';
import { ToastDisplay } from './components/ToastDisplay';



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
    ownedDice: INITIAL_DICE_BAG.map(id => ({ defId: id, level: 1 })),
    diceBag: initDiceBag(INITIAL_DICE_BAG),
    discardPile: [],
    drawCount: PLAYER_INITIAL.drawCount,
    handLevels: {},
    augments: Array(PLAYER_INITIAL.augmentSlots).fill(null),
    currentNodeId: null,
    map: generateMap(),
    phase: 'start',
    battleTurn: 0,
    isEnemyTurn: false,
    logs: ['欢迎来到 DICE BATTLE。'],
    shopItems: [],
    shopLevel: 1,
    statuses: [],
    lootItems: [],
    enemyHpMultiplier: 1.0,
    chapter: 1,
    stats: { ...INITIAL_STATS },
    pendingReplacementAugment: null,
    targetEnemyUid: null,
    battleWaves: [],
    currentWaveIndex: 0,
    relics: [],
    elementsUsedThisBattle: [],
  });

  const [showHandGuide, setShowHandGuide] = useState(false);
  const [showDiceGuide, setShowDiceGuide] = useState(false);
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
    } else if (game.phase === 'map' || game.phase === 'shop' || game.phase === 'campfire' || game.phase === 'event' || game.phase === 'diceReward') {
      startBGM('explore');
    } else if (game.phase === 'start' || game.phase === 'gameover' || game.phase === 'victory') {
      stopBGM();
    }
  }, [game.phase]);

  useEffect(() => {
    if (game.phase === 'reward' || game.phase === 'map') {
      setEnemies([]);
    }
  }, [game.phase]);

  const [dice, setDice] = useState<Die[]>([]);
  const gameRef = useRef(game);
  gameRef.current = game;
  const [diceDrawAnim, setDiceDrawAnim] = useState(false); // 抽骰子入场动画
  const [diceDiscardAnim, setDiceDiscardAnim] = useState(false);
  const [shuffleAnimating, setShuffleAnimating] = useState(false); // 洗牌动画状态 // 弃骰子退场动画
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [rerollCount, setRerollCount] = useState(0);
  const targetEnemyUid = game.targetEnemyUid;
  const targetEnemy = (() => {
    const aliveGuardian = enemies.find(e => e.hp > 0 && e.combatType === 'guardian');
    if (aliveGuardian) return aliveGuardian; // Guardian taunt: always target guardian first
    return enemies.find(e => e.uid === targetEnemyUid && e.hp > 0) || enemies.find(e => e.hp > 0) || null;
  })();
  const [selectedHandTypeInfo, setSelectedHandTypeInfo] = useState<{ name: string; description: string } | null>(null);

  const [enemyEffects, setEnemyEffects] = useState<Record<string, 'attack' | 'defend' | 'skill' | 'shake' | 'death' | null>>({});
  const [dyingEnemies, setDyingEnemies] = useState<Set<string>>(new Set());
  const setEnemyEffectForUid = (uid: string, effect: 'attack' | 'defend' | 'skill' | 'shake' | 'death' | null) => setEnemyEffects(prev => ({ ...prev, [uid]: effect }));

  const [playerEffect, setPlayerEffect] = useState<'attack' | 'defend' | 'flash' | null>(null);
  const [enemyInfoTarget, setEnemyInfoTarget] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [hpGained, setHpGained] = useState(false);
  const [armorGained, setArmorGained] = useState(false);
  const [rerollFlash, setRerollFlash] = useState(false);

  // === 结算演出状态 ===
  const [showDamageOverlay, setShowDamageOverlay] = useState<{damage: number, armor: number, heal: number} | null>(null);
  const [settlementPhase, setSettlementPhase] = useState<null | 'hand' | 'dice' | 'mult' | 'effects' | 'damage'>(null);
  const [settlementData, setSettlementData] = useState<{
    bestHand: string;
    selectedDice: Die[];
    diceScores: number[];
    baseValue: number;
    mult: number;
    currentBase: number;
    currentMult: number;
    triggeredEffects: { name: string; detail: string; icon?: string; type: 'damage' | 'mult' | 'status' | 'heal' | 'armor'; rawValue?: number; rawMult?: number }[];
    currentEffectIdx: number;
    finalDamage: number;
    finalArmor: number;
    finalHeal: number;
    statusEffects: any[];
  } | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: string, type?: string }[]>([]);
  const toastIdRef = useRef(0);
  const toastCdMap = useRef<Map<string, number>>(new Map());

  const addToast = (message: string, type: 'info' | 'damage' | 'heal' | 'gold' | 'buff' = 'info') => {
    // Toast CD: same message won't repeat within 3s
    const now = Date.now();
    const lastTime = toastCdMap.current.get(message) || 0;
    if (now - lastTime < 3000) return;
    toastCdMap.current.set(message, now);

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
  const [waveAnnouncement, setWaveAnnouncement] = useState<number | null>(null);
  const [showWaveDetail, setShowWaveDetail] = useState(false);

  // --- 战前技能模组选择 ---
  interface SkillModule {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    augment: Augment;
    cost: { type: 'maxHp' | 'reroll' | 'plays' | 'hp' | 'addNormalDice'; value: number; label: string };
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
          updated.freeRerollsPerTurn = Math.max(0, updated.freeRerollsPerTurn - module.cost.value);
          break;
        case 'hp':
          updated.hp = Math.max(1, updated.hp - module.cost.value);
          break;
        case 'plays':
          updated.maxPlays = Math.max(1, updated.maxPlays - module.cost.value);
          break;
        case 'addNormalDice':
          updated.ownedDice = [...updated.ownedDice, 'standard'];
          break;
      }
      
      // 添加增幅模块
      
      // Augment module: find empty slot or replace
      const newAugments = [...updated.augments];
      const emptyIdx = newAugments.findIndex(a => a === null);
      if (emptyIdx !== -1) {
        newAugments[emptyIdx] = module.augment;
      } else {
        // All slots full - store for replacement choice
        updated.pendingReplacementAugment = module.augment;
      }
      updated.augments = newAugments;
      
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

  const startBattle = async (node: MapNode) => {
    const waves = (() => {
      const chapterScale = CHAPTER_CONFIG.chapterScaling[Math.min(game.chapter - 1, CHAPTER_CONFIG.chapterScaling.length - 1)];
      return getEnemiesForNode(node, node.depth, game.enemyHpMultiplier * chapterScale.hpMult, chapterScale.dmgMult);
    })();
    const firstWave = waves[0]?.enemies || [];
    setEnemies(firstWave);
    setEnemyEffects({}); setDyingEnemies(new Set());
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
      statuses: [],
      battleWaves: waves,
      currentWaveIndex: 0,
      targetEnemyUid: (firstWave.find(e => e.combatType === 'guardian') || firstWave[0])?.uid || null,
      diceBag: initDiceBag(prev.ownedDice),
      discardPile: [], // 新战斗开始时清空所有状态效果
      freeRerollsLeft: prev.freeRerollsPerTurn,
      playsLeft: prev.maxPlays,
      isEnemyTurn: false 
    }));
    // 直接用新bag抽取（避免闭包旧值问题）
    const freshBag = initDiceBag(game.ownedDice);
    const drawCountBonus = game.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => sum + (r.effect({}).drawCountBonus || 0), 0);
    const freshCount = game.drawCount + drawCountBonus;
    const { drawn: freshDrawn, newBag: fBag, newDiscard: fDiscard, shuffled: fShuffled } = drawFromBag(freshBag, [], freshCount);
    if (fShuffled) addToast('\u2728 弃骰库已洗回骰子库!', 'buff');
    setGame(prev => ({ ...prev, diceBag: fBag, discardPile: fDiscard }));
    // 启动骰子roll动画
    setDice(freshDrawn.map(d => ({ ...d, rolling: true, value: Math.floor(Math.random() * 6) + 1 })));
    const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
    for (let f = 0; f < frameTimes.length; f++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[f]));
      setDice(prev => prev.map(d => {
        const def = getDiceDef(d.diceDefId);
        return { ...d, value: rollDiceDef(def) };
      }));
      if (f === 3) playSound('reroll');
    setGame(prev => ({ ...prev, stats: { ...prev.stats, totalRerolls: prev.stats.totalRerolls + 1 } }));
    }
    setDice(prev => prev.map(d => ({ ...d, rolling: false })));
    // 元素骰子坍缩 + 小丑骰子1-9随机
    setDice(prev => applyDiceSpecialEffects(prev));
    playSound('dice_lock');
    // Auto-sort dice by value ascending after roll
    await new Promise(r => setTimeout(r, 200));
    setDice(prev => [...prev].sort((a, b) => a.value - b.value));
    addLog(`[骰] ${freshDrawn.map(d => `${d.value}(${ELEMENT_NAMES[d.element]})`).join(' ')}`);

    setRerollCount(0);
    addLog(`遇到 ${firstWave.map(e => e.name).join('、')}！`);
  };

  const startNode = (node: MapNode) => {
    playSound('select');
    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      if (node.depth === 0) {
        // 第一个节点：战前三选一强化
        const modules = generateSkillModules();
        setSkillModuleOptions(modules);
        setPendingBattleNode(node);
        setGame(prev => ({ ...prev, phase: 'skillSelect', currentNodeId: node.id }));
      } else {
        startBattle(node);
      }
    } else if (node.type === 'shop') {
      // 游荡商人：随机3个商品，价格随机
      const [minPrice, maxPrice] = SHOP_CONFIG.priceRange;
      const randPrice = () => Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
      // 构建候选商品池
      const candidateItems: ShopItem[] = [];
      // 候选：增幅模块
      const shuffledAugs = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5);
      for (const aug of shuffledAugs.slice(0, 3)) {
        candidateItems.push({
          id: 'aug_' + aug.id, type: 'augment' as const, augment: aug,
          label: aug.name, desc: aug.description, price: randPrice()
        });
      }
      // 候选：骰子
      const shuffledDice = [...DICE_BY_RARITY.uncommon, ...DICE_BY_RARITY.rare].sort(() => Math.random() - 0.5);
      for (const d of shuffledDice.slice(0, 2)) {
        candidateItems.push({
          id: 'dice_' + d.id, type: 'specialDice' as const, diceDefId: d.id,
          label: d.name, desc: d.description + ' [' + d.faces.join(',') + ']',
          price: d.rarity === 'rare' ? randPrice() + 30 : randPrice() + 10
        });
      }
      // 候选：重掷强化
      candidateItems.push({
        id: 'reroll_' + Math.random().toString(36).slice(2, 6), type: 'reroll' as const,
        label: '重掷强化', desc: '永久增加每回合 +1 次免费重掷', price: randPrice()
      });
      // 从候选池随机抽3个
      const shopItems: ShopItem[] = candidateItems.sort(() => Math.random() - 0.5).slice(0, 3);
      setGame(prev => ({ ...prev, phase: 'shop', currentNodeId: node.id, shopItems }));
    } else if (node.type === 'campfire') {
      playSound('campfire');
      setCampfireView('main');
      setGame(prev => ({ ...prev, phase: 'campfire', currentNodeId: node.id }));
    } else if (node.type === 'merchant') {
      // 游荡商人：随机3个商品，价格随机
      const [minPrice, maxPrice] = SHOP_CONFIG.priceRange;
      const randPrice = () => Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
      // 构建候选商品池
      const candidateItems: ShopItem[] = [];
      // 候选：增幅模块
      const shuffledAugs = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5);
      for (const aug of shuffledAugs.slice(0, 3)) {
        candidateItems.push({
          id: 'aug_' + aug.id, type: 'augment' as const, augment: aug,
          label: aug.name, desc: aug.description, price: randPrice()
        });
      }
      // 候选：骰子
      const shuffledDice = [...DICE_BY_RARITY.uncommon, ...DICE_BY_RARITY.rare].sort(() => Math.random() - 0.5);
      for (const d of shuffledDice.slice(0, 2)) {
        candidateItems.push({
          id: 'dice_' + d.id, type: 'specialDice' as const, diceDefId: d.id,
          label: d.name, desc: d.description + ' [' + d.faces.join(',') + ']',
          price: d.rarity === 'rare' ? randPrice() + 30 : randPrice() + 10
        });
      }
      // 候选：重掷强化
      candidateItems.push({
        id: 'reroll_' + Math.random().toString(36).slice(2, 6), type: 'reroll' as const,
        label: '重掷强化', desc: '永久增加每回合 +1 次免费重掷', price: randPrice()
      });
      // 从候选池随机抽3个
      const shopItems: ShopItem[] = candidateItems.sort(() => Math.random() - 0.5).slice(0, 3);
      setGame(prev => ({ ...prev, phase: 'shop', currentNodeId: node.id, shopItems }));
    } else if (node.type === 'treasure') {
      // Treasure: chest-only mode
      setGame(prev => ({ ...prev, phase: 'treasure' as any, currentNodeId: node.id }));
    } else if (node.type === 'event') {
      playSound('event');
      setGame(prev => ({ ...prev, phase: 'event', currentNodeId: node.id }));
    }
  };

  const rollAllDice = async () => {
    playSound('roll');
    const relicDrawBonus = game.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => sum + (r.effect({}).drawCountBonus || 0), 0);
    const count = game.drawCount + relicDrawBonus;
    
    // 从骰子库抽取
    const { drawn, newBag, newDiscard, shuffled } = drawFromBag(game.diceBag, game.discardPile, count);
    
    // Shuffle notice
    if (shuffled) {
            setShuffleAnimating(true);
            setTimeout(() => setShuffleAnimating(false), 800);
      addToast('\u2728 弃骰库已洗回骰子库!', 'buff');
    }
    
    // 更新骰子库状态
    setGame(prev => ({ ...prev, diceBag: newBag, discardPile: newDiscard }));

    // 设置rolling状态（动画）
    setDice(drawn.map(d => ({ ...d, rolling: true, value: Math.floor(Math.random() * 6) + 1 })));

    // 快速翻滚动画 — 8帧，递减速度
    const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
    for (let i = 0; i < frameTimes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[i]));
      setDice(prev => prev.map(d => {
        const def = getDiceDef(d.diceDefId);
        return { ...d, value: rollDiceDef(def) };
      }));
      if (i === 3) playSound('reroll');
    }

    // 落定 — 使用预先抽取的结果
    setDice(prev => prev.map(d => ({ ...d, rolling: false })));
    playSound('dice_lock');
    addLog(`[骰] ${drawn.map(d => `${d.value}(${ELEMENT_NAMES[d.element]})`).join(' ')}`);
  };

  // Calculate reroll HP cost: 0, 2, 4, 8, 16... (doubles each time after first free)
  const getRerollHpCost = (count: number): number => {
    if (count <= 0) return 0; // first reroll is free
    return Math.pow(2, count); // 2, 4, 8, 16, 32...
  };
  const currentRerollCost = getRerollHpCost(rerollCount);
  const canAffordReroll = game.hp > currentRerollCost;

  const rerollUnselected = async () => {
    if (game.isEnemyTurn || game.playsLeft <= 0) return;
    
    // Check HP cost
    let hpCost = getRerollHpCost(rerollCount);
    // 诅咒骰子：手中有诅咒骰子时，重Roll代价翻倍
    const hasCursedInHand = dice.some(d => !d.selected && !d.spent && getDiceDef(d.diceDefId).isCursed);
    if (hasCursedInHand) hpCost *= 2;
    if (hpCost > 0 && game.hp <= hpCost) {
      addToast(`生命不足！重掷需要 ${hpCost} HP`, 'damage');
      setRerollFlash(true);
      setTimeout(() => setRerollFlash(false), 500);
      return;
    }
    
    // 急救沙漏遗物：前N次卖血重Roll不扣血
    const hourglassRelic = game.relics.find(r => r.id === 'emergency_hourglass');
    if (hourglassRelic && hpCost > 0 && (hourglassRelic.counter || 0) < (hourglassRelic.maxCounter || 2)) {
      // 消耗一次免费卖血机会
      setGame(prev => ({
        ...prev,
        relics: prev.relics.map(r => r.id === 'emergency_hourglass' ? { ...r, counter: (r.counter || 0) + 1 } : r)
      }));
      addToast('⌛ 急救沙漏: 免除卖血伤害!', 'buff');
      hpCost = 0;
    }

    // Apply HP cost
    if (hpCost > 0) {
      setGame(prev => {
        // on_reroll 遗物触发（如黑市合同）
        let goldBonus = 0;
        prev.relics.filter(r => r.trigger === 'on_reroll').forEach(relic => {
          const res = relic.effect({ hpLostThisTurn: hpCost });
          if (res.goldBonus) goldBonus += res.goldBonus;
        });
        return { ...prev, hp: prev.hp - hpCost, souls: prev.souls + goldBonus, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + goldBonus } };
      });
      addFloatingText(`-${hpCost}`, 'text-red-500', undefined, 'player');
      addLog(`重掷消耗 ${hpCost} HP`);
    }
    
    playSound('roll');
    // 设置未选中骰子的rolling状态
    setDice(prev => prev.map(d => d.selected || d.spent ? d : { ...d, rolling: true }));

    // 快速翻滚动画
    const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
    for (let i = 0; i < frameTimes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[i]));
      setDice(prev => prev.map(d => {
        if (d.selected || d.spent) return d;
        const def = getDiceDef(d.diceDefId);
        return { ...d, value: rollDiceDef(def) };
      }));
    }

    // 落定：将未选中骰子弃置，从骰子库抽新的替换
    const unselectedDice = dice.filter(d => !d.selected && !d.spent);
    const unselectedDefIds = unselectedDice.map(d => d.diceDefId);
    const unselectedIds = new Set(unselectedDice.map(d => d.id));

    setGame(prev => {
      // 将未选中骰子的defId放进弃骰库
      const newDiscard = [...prev.discardPile, ...unselectedDefIds];
      // 从骰子库抽取等量新骰子
      const { drawn, newBag, newDiscard: finalDiscard, shuffled } = drawFromBag(prev.diceBag, newDiscard, unselectedDefIds.length);
      if (shuffled) {
                setShuffleAnimating(true);
                setTimeout(() => setShuffleAnimating(false), 800);
        addToast(' 弃骰库洗回骰子库', 'info');
      }

      // 同步更新手中骰子：用新抽的替换未选中的
      let drawIdx = 0;
      const newDice = dice.map(d => {
        if (!unselectedIds.has(d.id)) return d;
        if (drawIdx < drawn.length) {
          const newDie = drawn[drawIdx];
          drawIdx++;
          return { ...newDie, id: d.id, rolling: false };
        }
        return { ...d, rolling: false };
      });
      // 通过闭包更新dice状态
      setTimeout(() => {
        setDice(applyDiceSpecialEffects(newDice));
        addLog(`重掷结果: ${newDice.filter(nd => unselectedIds.has(nd.id)).map(nd => `${nd.value}(${ELEMENT_NAMES[nd.element]})`).join(', ')}`);
      }, 0);

      return {
        ...prev,
        diceBag: newBag,
        discardPile: finalDiscard,
        // HP cost already applied above
      };
    });

    playSound('dice_lock');
    // Auto-sort dice by value ascending after reroll
    await new Promise(r => setTimeout(r, 200));
    setDice(prev => [...prev].sort((a, b) => a.value - b.value));
    setRerollCount(prev => prev + 1);
  };

  const toggleSelect = (id: number) => {
    const die = dice.find(d => d.id === id);
    if (!die) return;
    if (die.spent) { addToast('该骰子已使用'); return; }
    if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
    if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }
    
    const selectedCount = dice.filter(d => d.selected && !d.spent).length;
    const isCurrentlySelected = die.selected;

    // 不限制选择数量，只要能组成牌型即可

    playSound('select');
    setDice(prev => {
      const next = prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d);
      // 检查新状态下是否为多选普通攻击
      const newSelected = next.filter(d => d.selected && !d.spent);
      const hasSpecial = newSelected.some(d => {
        const def = getDiceDef(d.diceDefId);
        return def.element !== 'normal' || !!def.onPlay;
      });
      if (!isCurrentlySelected && newSelected.length > 1 && hasSpecial) {
        const handResult = checkHands(newSelected);
        if (handResult.activeHands.includes('普通攻击') && handResult.activeHands.length === 1) {
          setTimeout(() => addToast('多选普通攻击：特殊骰子效果将被禁用！', 'info'), 50);
        }
      }
      return next;
    });
  };

  const currentHands = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    // 分裂骰子：复制一个相同点数的虚拟骰子加入牌型判定
    let evalDice = [...selected];
    selected.forEach(d => {
      if (d.diceDefId === 'split') {
        evalDice.push({ ...d, id: d.id + 9000, diceDefId: 'standard' }); // 虚拟分裂副本
      }
    });
    return checkHands(evalDice);
  }, [dice]);

  // 多选普通攻击检测：选了多颗骰子但不成牌型
  const isNormalAttackMulti = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    return selected.length > 1 && currentHands.activeHands.includes('普通攻击') && currentHands.activeHands.length === 1;
  }, [dice, currentHands]);

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
      
      // Always-active augments trigger on every play
      if (aug.condition === 'always') return true;
      
      // Passive augments are handled separately (shop discount, interest, etc)
      if (aug.condition === 'passive') return false;
      
      // Element count condition
      if (aug.condition === 'element_count') {
        if (aug.conditionElement) {
          return selected.filter(d => d.element === aug.conditionElement).length >= (aug.conditionValue || 1);
        }
        return false;
      }
      
      const conditionMap: Record<string, string> = {
        'high_card': '\u666E\u901A\u653B\u51FB',
        'pair': '\u5BF9\u5B50',
        'two_pair': '\u8FDE\u5BF9',
        'n_of_a_kind': '\u4E09\u6761',
        'full_house': '\u8461\u82A6',
        'straight': '\u987A\u5B50',
        'same_element': '\u540C\u5143\u7D20'
      };
      
      const targetHand = conditionMap[aug.condition];
      if (!targetHand) return false;
      
      if (aug.condition === 'n_of_a_kind') {
        return ['\u4E09\u6761', '\u56DB\u6761', '\u4E94\u6761', '\u516D\u6761'].some(h => currentHands.allHands.includes(h as any));
      }
      
      return currentHands.allHands.includes(targetHand as any);
    });
  }, [dice, game.augments, currentHands]);

  const expectedOutcome = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    const { bestHand, allHands, activeHands } = currentHands;
    if (selected.length === 0) return null;

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
        const levelBonusMult = (level - 1) * 0.3;
        // base已移除，纯倍率体系
        handMultiplier += (((handDef as any).mult || 1) - 1) + levelBonusMult;
      }

      switch (handName) {
        case '普通攻击': break;
        case '对子': break;
        case '顺子': break; // 3顺 AOE
        case '连对': baseArmor += 5; break;
        case '三连对': baseArmor += 8; break;
        case '三条': statusEffects.push({ type: 'vulnerable', value: 1, duration: 2 }); break; // 1层易伤
        case '4顺': statusEffects.push({ type: 'weak', value: 1, duration: 2 }); break; // AOE + 1层虚弱
        case '同元素': break; // 骰子效果x2在后面处理
        case '葫芦': baseArmor += 15; break; // 纯防御
        case '5顺': statusEffects.push({ type: 'weak', value: 2, duration: 2 }); break; // AOE + 2层虚弱
        case '四条': statusEffects.push({ type: 'vulnerable', value: 2, duration: 2 }); break; // 2层易伤
        case '6顺': baseArmor += 10; statusEffects.push({ type: 'weak', value: 3, duration: 2 }); break; // AOE + 3层虚弱 + 10护甲
        case '元素顺': break; // AOE + 骰子效果x2
        case '元素葫芦': baseArmor += 25; break; // 骰子效果x2 + 25护甲
        case '五条': statusEffects.push({ type: 'vulnerable', value: 3, duration: 2 }); break; // 3层易伤
        case '六条': statusEffects.push({ type: 'vulnerable', value: 5, duration: 3 }); break; // 5层易伤
        case '皇家元素顺': baseArmor += 50; break; // AOE + 骰子效果x3 + 50护甲
      }
    });

    baseDamage = Math.floor(X * handMultiplier);

    if (activeHands.some((h: string) => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h))) {
      baseArmor += baseDamage;
    }

    let extraDamage = 0;
    let extraArmor = 0;
    let extraHeal = 0;
    let pierceDamage = 0;
    let multiplier = 1;
    const triggeredAugments: { name: string, details: string }[] = [];

    activeAugments.forEach(aug => {
      const res = aug.effect(X, selected, aug.level || 1, { rerollsThisTurn: rerollCount, currentHp: game.hp, maxHp: game.maxHp, currentGold: game.souls });
      const details: string[] = [];

      if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
      if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
      if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
      if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率x${res.multiplier.toFixed(2)}`); }
      if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
      if (res.goldBonus) { setGame(prev => ({ ...prev, souls: prev.souls + res.goldBonus!, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + res.goldBonus! } })); details.push(`\u91D1\u5E01+${res.goldBonus}`); }
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

    // --- Relic on_play effects ---
    game.relics.filter(r => r.trigger === 'on_play').forEach(relic => {
      const relicCtx = {
        handType: bestHand,
        diceCount: selected.length,
        pointSum: X,
        loadedDiceCount: selected.filter(d => getDiceDef(d.diceDefId).id === 'heavy').length,
        rerollsThisTurn: rerollCount,
        currentHp: game.hp,
        maxHp: game.maxHp,
        hasSplitDice: selected.some(d => getDiceDef(d.diceDefId).id === 'split'),
        splitDiceValue: selected.find(d => getDiceDef(d.diceDefId).id === 'split')?.value || 0,
        elementsUsedThisBattle: new Set(game.elementsUsedThisBattle || []),
        hasSpecialDice: selected.some(d => !['standard', 'heavy'].includes(getDiceDef(d.diceDefId).id)),
      };
      const res = relic.effect(relicCtx);
      const details = [];
      if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
      if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
      if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
      if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率x${res.multiplier.toFixed(2)}`); }
      if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
      if (details.length > 0) {
        triggeredAugments.push({ name: '🔮' + relic.name, details: details.join(', ') });
      }
    });

    // --- Dice onPlay effects ---
    // 多选普通攻击时，特殊骰子当普通骰子，跳过所有onPlay效果
    const skipOnPlay = selected.length > 1 && activeHands.includes('普通攻击') && activeHands.length === 1;
    // 同元素牌型时，骰子效果翻倍（同元素大奖励核心机制）
    const isSameElementHand = activeHands.some((h: string) => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h));
    const isRoyalElement = activeHands.some((h) => h === '皇家元素顺');
    const elementBonus = isRoyalElement ? 3.0 : (isSameElementHand ? 2.0 : 1.0); // 同元素时效果×2
    
    selected.forEach(d => {
      if (skipOnPlay) return;
      const def = getDiceDef(d.diceDefId);
      
      // 元素骰子：根据坍缩后的元素产生不同效果
      if (def.isElemental && d.collapsedElement) {
        const diceValue = d.value;
        switch (d.collapsedElement) {
          case 'fire':
            // 火：摧毁敌人所有护甲 + 基于点数的真实伤害
            pierceDamage += Math.floor(diceValue * 3 * elementBonus);
            // 护甲摧毁在实际结算时处理（标记）
            statusEffects.push({ type: 'burn', value: 99 }); // 99 = 特殊标记：摧毁护甲
            break;
          case 'ice':
            // 冰：冻结1回合，点数结算减半
            statusEffects.push({ type: 'freeze', value: 1, duration: 1 });
            // 冰元素点数减半已在baseDamage计算前处理
            break;
          case 'thunder':
            // 雷：对其他敌人造成等量穿透伤害（AOE标记）
            pierceDamage += Math.floor(diceValue * 2 * elementBonus);
            break;
          case 'poison':
            // 毒：叠加毒层，跨回合持续掉血
            const poisonStacks = Math.floor((diceValue + 2) * elementBonus);
            const existingPoison = statusEffects.find(es => es.type === 'poison');
            if (existingPoison) existingPoison.value += poisonStacks;
            else statusEffects.push({ type: 'poison', value: poisonStacks });
            break;
          case 'holy':
            // 圣光：恢复等同点数的生命值
            extraHeal += Math.floor(diceValue * elementBonus);
            break;
        }
        return; // 元素骰子不走普通onPlay
      }
      
      // 碎裂骰子：反噬伤害
      if (def.onPlay?.selfDamage) {
        extraHeal -= def.onPlay.selfDamage; // 负回血 = 自伤
      }
      
      if (!def.onPlay) return;
      const op = def.onPlay;
      if (op.bonusDamage) extraDamage += Math.floor(op.bonusDamage * elementBonus);
      if (op.bonusMult) multiplier *= (1 + (op.bonusMult - 1) * elementBonus);
      if (op.heal) extraHeal += Math.floor(op.heal * elementBonus);
      if (op.pierce) pierceDamage += Math.floor(op.pierce * elementBonus);
      if (op.statusToEnemy) {
        const boostedValue = Math.floor(op.statusToEnemy.value * elementBonus);
        const existing = statusEffects.find(es => es.type === op.statusToEnemy!.type);
        if (existing) {
          existing.value += boostedValue;
        } else {
          statusEffects.push({ ...op.statusToEnemy, value: boostedValue });
        }
      }
    });

    const totalDamage = Math.floor((baseDamage + extraDamage) * multiplier) + pierceDamage;

    // Apply status modifiers
    let modifiedDamage = totalDamage;
    const playerWeak = game.statuses.find(s => s.type === 'weak');
    if (playerWeak) modifiedDamage = Math.floor(modifiedDamage * 0.75);
    
    const enemyVulnerable = targetEnemy?.statuses.find(s => s.type === 'vulnerable');
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

  // AOE state for enemy highlighting
  const isAoeActive = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0 || !expectedOutcome) return false;
    const hasDiceAoe = !isNormalAttackMulti && selected.some(d => {
      const def = getDiceDef(d.diceDefId);
      return def.onPlay?.aoe;
    });
    if (hasDiceAoe) return true;
      if (currentHands.activeHands.some(h => ['顺子', '4顺', '5顺', '6顺'].includes(h))) return true;
    const { activeHands } = currentHands;
    if (activeHands.some(h => h.includes('元素') || h.includes('皇家'))) return true;
    return false;
  }, [dice, expectedOutcome, currentHands]);

  const playHand = async () => {
    playSound('select');
    const selected = dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0 || enemies.length === 0 || !targetEnemy || game.isEnemyTurn || dice.some(d => d.playing) || game.playsLeft <= 0) return;

    setGame(prev => ({ ...prev, playsLeft: prev.playsLeft - 1 }));

    const outcome = expectedOutcome;
    if (!outcome) return;

    const { bestHand } = currentHands;

    // Mark dice as playing
    setDice(prev => prev.map(d => d.selected ? { ...d, playing: true } : d));
    setHandLeftThrow(true);
    setTimeout(() => setHandLeftThrow(false), 500);

    // ========================================
    // --- 统计更新 ---
    setGame(prev => {
      const newStats = { ...prev.stats };
      newStats.totalPlays += 1;
      newStats.totalDamageDealt += outcome.damage;
      if (outcome.damage > newStats.maxSingleHit) newStats.maxSingleHit = outcome.damage;
      newStats.totalHealing += (outcome.heal || 0);
      newStats.totalArmorGained += (outcome.armor || 0);
      // 牌型统计
      newStats.handTypeCounts[bestHand] = (newStats.handTypeCounts[bestHand] || 0) + 1;
      // 最强牌型（用 handMultiplier 比较）
      if (!newStats.bestHandPlayed || outcome.handMultiplier > (prev.stats.handTypeCounts[newStats.bestHandPlayed] || 0)) {
        newStats.bestHandPlayed = bestHand;
      }
      // 骰子使用统计
      selected.forEach(d => {
        const defId = d.diceDefId;
        newStats.diceUsageCounts[defId] = (newStats.diceUsageCounts[defId] || 0) + 1;
      });
      return { ...prev, stats: newStats };
    });

    // Phase 1: 牌型展示 (0.6s)
    // ========================================
    setSettlementPhase('hand');
    setSettlementData({
      bestHand: outcome.bestHand,
      selectedDice: selected,
      diceScores: selected.map(d => d.value),
      baseValue: outcome.baseHandValue,
      mult: outcome.handMultiplier,
      currentBase: outcome.baseHandValue,
      currentMult: outcome.handMultiplier,
      triggeredEffects: [],
      currentEffectIdx: -1,
      finalDamage: outcome.damage,
      finalArmor: outcome.armor,
      finalHeal: outcome.heal,
      statusEffects: outcome.statusEffects,
    });
    playSound('augment_activate');
    await new Promise(r => setTimeout(r, 600));

    // ========================================
    // Phase 2: 逐颗骰子计分 (每颗0.3s)
    // ========================================
    setSettlementPhase('dice');
    let runningBase = outcome.baseHandValue;
    for (let i = 0; i < selected.length; i++) {
      runningBase += selected[i].value;
      const currentRunning = runningBase;
      setSettlementData(prev => prev ? { ...prev, currentBase: currentRunning, currentEffectIdx: i } : prev);
      playSound('select');
      await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 200));

    // ========================================
    // Phase 2.5: 倍率强调动画 (0.5s)
    // ========================================
    setSettlementPhase('mult');
    playSound('augment_activate');
    await new Promise(r => setTimeout(r, 500));


    // ========================================
    // Phase 3: 特殊效果触发 (每个0.4s)
    // ========================================
    setSettlementPhase('effects');
    
    // 收集所有触发效果
    const allEffects: { name: string; detail: string; type: 'damage' | 'mult' | 'status' | 'heal' | 'armor'; rawValue?: number; rawMult?: number }[] = [];
    
    // 骰子onPlay效果
    const skipOnPlaySettlement = selected.length > 1 && currentHands.activeHands.includes('普通攻击') && currentHands.activeHands.length === 1;
    selected.forEach(d => {
      const def = getDiceDef(d.diceDefId);
      if (skipOnPlaySettlement || !def.onPlay) return;
      const op = def.onPlay;
      if (op.bonusDamage) allEffects.push({ name: def.name, rawValue: op.bonusDamage, detail: `伤害+${op.bonusDamage}`, type: 'damage' });
      if (op.bonusMult) allEffects.push({ name: def.name, rawMult: op.bonusMult, detail: `倍率×${op.bonusMult}`, type: 'mult' });
      if (op.heal) allEffects.push({ name: def.name, detail: `回复${op.heal}HP`, type: 'heal' });
      if (op.pierce) allEffects.push({ name: def.name, rawValue: op.pierce, detail: `穿透+${op.pierce}`, type: 'damage' });
      if (op.statusToEnemy) {
        const info = STATUS_INFO[op.statusToEnemy.type];
        allEffects.push({ name: def.name, detail: `${info.label}+${op.statusToEnemy.value}`, type: 'status' });
      }
    });
    
    // 增幅模块效果
    outcome.triggeredAugments.forEach(aug => {
      allEffects.push({ name: aug.name, detail: aug.details, type: 'damage' });
    });
    
    // 逐个展示效果
    for (let i = 0; i < allEffects.length; i++) {
      setSettlementData(prev => prev ? {
        ...prev,
        triggeredEffects: allEffects.slice(0, i + 1),
        currentEffectIdx: i,
      } : prev);
      playSound('augment_activate');
      await new Promise(r => setTimeout(r, 400));
    }
    if (allEffects.length > 0) await new Promise(r => setTimeout(r, 200));

    // ========================================
    // Phase 4: 最终伤害飞出 (0.8s)
    // ========================================
    setSettlementPhase('damage');
    // 根据伤害大小播放分层音效
    if (outcome.damage >= 40) {
      playSound('critical');
      setTimeout(() => playSound('critical'), 150);
    } else if (outcome.damage >= 20) {
      playSound('critical');
    } else if (outcome.damage > 0) {
      playSound('hit');
    }
          setShowDamageOverlay({ damage: outcome.damage, armor: outcome.armor, heal: outcome.heal || 0 });
          setTimeout(() => setShowDamageOverlay(null), 1800);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
    
    await new Promise(r => setTimeout(r, 800));

    // ========================================
    // 清理结算演出，应用实际效果
    // ========================================
    setSettlementPhase(null);
    setSettlementData(null);

    // --- Apply damage to enemy (with AOE support) ---
    const targetUid = targetEnemy.uid;
    const selectedDefs = selected.map(d => getDiceDef(d.diceDefId));
    const hasAoe = selectedDefs.some(def => def.onPlay?.aoe) || currentHands.activeHands.some(h => ['顺子', '4顺', '5顺', '6顺'].includes(h));
    // 同元素牌型的状态效果AOE（对所有敌人施加状态）
    const isElementalAoe = currentHands.activeHands.some(h => ['元素顺', '元素葫芦', '皇家元素顺'].includes(h));
    
    if (outcome.damage > 0) {
      if (hasAoe) {
        // AOE: 对所有存活敌人造成伤害
        const aliveEnemies = enemies.filter(e => e.hp > 0);
        aliveEnemies.forEach((e, idx) => {
          setTimeout(() => {
            const absorbed = Math.min(e.armor, outcome.damage);
            const hpDamage = Math.max(0, outcome.damage - absorbed);
            if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', <PixelShield size={2} />, 'enemy');
            if (hpDamage > 0) addFloatingText(`-${hpDamage}`, 'text-red-500', <PixelHeart size={2} />, 'enemy');
          }, idx * 150);
        });
      } else {
        const absorbed = Math.min(targetEnemy.armor, outcome.damage);
        const hpDamage = Math.max(0, outcome.damage - absorbed);
        if (absorbed > 0) addFloatingText(`-${absorbed}`, 'text-blue-400', <PixelShield size={2} />, 'enemy');
        if (hpDamage > 0) setTimeout(() => addFloatingText(`-${hpDamage}`, 'text-red-500', <PixelHeart size={2} />, 'enemy'), absorbed > 0 ? 150 : 0);
      }
    }

    // Apply to player
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
    if (hasAoe) {
      // AOE: damage all alive enemies
      setEnemies(prev => prev.map(e => {
        if (e.hp <= 0) return e;
        let dmg = outcome.damage;
        let arm = e.armor;
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
        if (newHp <= 0) setEnemyEffectForUid(e.uid, 'death');
        return { ...e, hp: newHp, armor: arm, statuses: newStatuses };
      }));
    } else {
      // Single target
      let remainingDamage = outcome.damage;
      let enemyArmor = targetEnemy.armor;
      if (enemyArmor > 0) {
        const absorbed = Math.min(enemyArmor, remainingDamage);
        enemyArmor -= absorbed;
        remainingDamage -= absorbed;
      }
      const finalEnemyHp = Math.max(0, targetEnemy.hp - remainingDamage);
      if (finalEnemyHp <= 0) setEnemyEffectForUid(targetUid, 'death');
      
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
        return { ...e, hp: finalEnemyHp, armor: enemyArmor, statuses: newStatuses };
      }));
      
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
    
    setPlayerEffect('attack');
    playSound(isAoeActive ? 'player_aoe' : 'player_attack');
    setTimeout(() => setPlayerEffect(null), 500);
    setGame(prev => ({ 
      ...prev, 
      armor: prev.armor + outcome.armor,
      hp: Math.min(prev.maxHp, prev.hp + outcome.heal)
    }));

    // on_kill 遗物效果：检查是否有敌人被击杀
    setTimeout(() => {
      const killedEnemies = enemies.filter(e => e.hp <= 0);
      if (killedEnemies.length > 0) {
        game.relics.filter(r => r.trigger === 'on_kill').forEach(relic => {
          killedEnemies.forEach(killed => {
            const overkill = Math.abs(killed.hp);
            const res = relic.effect({ overkillDamage: overkill });
            if (res.heal && res.heal > 0) {
              setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + res.heal) }));
              addToast(`🧛 ${relic.name}: +${res.heal}HP`, 'heal');
            }
          });
        });
      }
    }, 300);

    // Mark dice as spent & add to discard pile
    const spentDefIds = dice.filter(d => d.selected && !d.spent).map(d => d.diceDefId);
    setDice(prev => prev.map(d => d.selected ? { ...d, spent: true, selected: false, playing: false } : d));
    setGame(prev => ({ ...prev, discardPile: [...prev.discardPile, ...spentDefIds] }));

    let logMsg = `打出 ${bestHand}，造成 ${outcome.damage} 伤害`;
    if (outcome.armor > 0) logMsg += `，获得 ${outcome.armor} 护甲`;
    if (outcome.heal > 0) logMsg += `，回复 ${outcome.heal} 生命`;
    if (outcome.triggeredAugments.length > 0) {
      const augDetails = outcome.triggeredAugments.map(a => `${a.name}(${a.details})`).join(', ');
      logMsg += ` (触发: ${augDetails})`;
    }
    logMsg += `。`;
    addLog(logMsg);

    // Check for enemy deaths (works for both AOE and single target)
    const checkEnemyDeaths = async () => {
      await new Promise(r => setTimeout(r, 1200));
      // Re-read enemies after state update
      const aliveAfterAttack = enemies.filter(e => e.hp > 0);
      
      // For single target, check if target died
      if (!hasAoe) {
        const targetStillAlive = aliveAfterAttack.find(e => e.uid === targetUid);
        if (!targetStillAlive || targetEnemy.hp - outcome.damage <= 0) {
          await new Promise(r => setTimeout(r, 700));
          const remainingAlive = enemies.filter(e => e.hp > 0 && e.uid !== targetUid);
          if (remainingAlive.length > 0) {
            setGame(prev => ({ ...prev, targetEnemyUid: (remainingAlive.find(e => e.combatType === 'guardian') || remainingAlive[0]).uid }));
            addLog(`当前目标被击败！还有 ${remainingAlive.length} 个敌人存活。`);
            return;
          }
        } else {
          return; // Target alive, no wave check needed
        }
      }
      
      // Check if all enemies in current wave are dead
      const anyAlive = enemies.some(e => {
        const dmg = hasAoe ? outcome.damage : (e.uid === targetUid ? outcome.damage : 0);
        return e.hp - dmg > 0;
      });
      
      if (!anyAlive) {
        await new Promise(r => setTimeout(r, 700));
        const nextWaveIdx = game.currentWaveIndex + 1;
        if (nextWaveIdx < game.battleWaves.length) {
          const nextWave = game.battleWaves[nextWaveIdx].enemies;
          setEnemies(nextWave);
          setEnemyEffects({}); setDyingEnemies(new Set());
          setGame(prev => ({ ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: prev.maxPlays, freeRerollsLeft: prev.freeRerollsPerTurn, armor: 0 }));
          setRerollCount(0);
          setWaveAnnouncement(nextWaveIdx + 1);
          addLog(`第 ${nextWaveIdx + 1} 波敌人来袭！`);
          rollAllDice();
          return;
        }
        handleVictory();
      }
    };
    checkEnemyDeaths();
  };

  const endTurn = async () => {
    playSound('turn_end');
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0 || game.isEnemyTurn || dice.some(d => d.playing)) return;

    setGame(prev => ({ ...prev, isEnemyTurn: true }));

    // --- Helper: tick status durations ---
    const tickStatuses = (statuses: StatusEffect[]): StatusEffect[] => {
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
    };

    // --- 1. Player Turn End: process player poison ---
    let currentPlayerHp = game.hp;
    setGame(prev => {
      let nextStatuses = [...prev.statuses];
      let poisonDamage = 0;
      const poison = prev.statuses.find(s => s.type === 'poison');
      if (poison && poison.value > 0) {
        poisonDamage = poison.value;
        addLog(`\u4f60\u56e0\u4e2d\u6bd2\u53d7\u5230\u4e86 ${poisonDamage} \u70b9\u4f24\u5bb3\u3002`);
        addFloatingText(`-${poisonDamage}`, 'text-purple-400', <PixelPoison size={2} />, 'player');
        nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
      }
      currentPlayerHp = Math.max(0, prev.hp - poisonDamage);
      return { ...prev, hp: currentPlayerHp, statuses: nextStatuses };
    });

    await new Promise(r => setTimeout(r, 600));
    if (currentPlayerHp <= 0) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    // --- 2. Process each enemy's burn damage ---
    let enemyDeathsFromBurn: string[] = [];
    setEnemies(prev => prev.map(e => {
      if (e.hp <= 0) return e;
      const burn = e.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        const dmg = burn.value;
        addLog(`${e.name} \u56e0\u707c\u70e7\u53d7\u5230\u4e86 ${dmg} \u70b9\u4f24\u5bb3\u3002`);
        addFloatingText(`-${dmg}`, 'text-orange-500', <PixelFlame size={2} />, 'enemy');
        const nextBurnValue = Math.floor(burn.value / 2);
        const nextStatuses = e.statuses.map(s => s.type === 'burn' ? { ...s, value: nextBurnValue } : s).filter(s => s.value > 0);
        const newHp = Math.max(0, e.hp - dmg);
        if (newHp <= 0) enemyDeathsFromBurn.push(e.uid);
        return { ...e, hp: newHp, statuses: nextStatuses, armor: 0 };
      }
      return { ...e, armor: 0 };
    }));

    await new Promise(r => setTimeout(r, 600));

    // Check if all enemies died from burn
    const aliveAfterBurn = enemies.filter(e => e.hp > 0 && !enemyDeathsFromBurn.includes(e.uid));
    if (aliveAfterBurn.length === 0 && enemyDeathsFromBurn.length > 0) {
      // Check next wave
      const nextWaveIdx = game.currentWaveIndex + 1;
      if (nextWaveIdx < game.battleWaves.length) {
        const nextWave = game.battleWaves[nextWaveIdx].enemies;
        setEnemies(nextWave);
        setEnemyEffects({}); setDyingEnemies(new Set());
        setGame(prev => ({ ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: prev.maxPlays, freeRerollsLeft: prev.freeRerollsPerTurn, armor: 0 }));
        setRerollCount(0);
          setWaveAnnouncement(nextWaveIdx + 1);
        addLog(`\u7b2c ${nextWaveIdx + 1} \u6ce2\u654c\u4eba\u6765\u88ad\uff01`);
        rollAllDice();
        return;
      }
      handleVictory();
      return;
    }

        // --- 3. Each alive enemy takes action ---
        // Rules:
        // - warrior (melee): approach first, attack when distance=0, high damage
        // - guardian (melee tank): approach first, taunt (force player to target), alternate attack/defend
        // - ranger (ranged): attack from any distance, lower damage
        // - caster (ranged): attack from any distance, may apply debuffs
        // - priest (ranged support): never attacks, heals allies + buffs allies + debuffs player
        const currentEnemies = [...enemies];
        for (const e of currentEnemies.filter(en => en.hp > 0)) {
          await new Promise(r => setTimeout(r, 350));
          
          // Freeze check: completely skip action
          const isFrozen = e.statuses.some(s => s.type === 'freeze' && s.duration > 0);
          if (isFrozen) {
            addLog(`${e.name} \u88AB\u51BB\u7ED3\uFF0C\u65E0\u6CD5\u884C\u52A8\uFF01`);
            addFloatingText('\u51BB\u7ED3', 'text-cyan-400', undefined, 'enemy');
            setEnemyEffectForUid(e.uid, 'shake');
            await new Promise(r => setTimeout(r, 400));
            setEnemyEffectForUid(e.uid, null);
            continue;
          }
          
          // Slow check: affects movement and ranged damage
          const isSlowed = e.statuses.some(s => s.type === 'slow' && s.duration > 0);
                    const isMelee = e.combatType === 'warrior' || e.combatType === 'guardian';
          
          // Melee: must approach first
          // Slowed melee enemies cannot move
          if (isMelee && e.distance > 0 && isSlowed) {
            addLog(`${e.name} \u88AB\u51CF\u901F\uFF0C\u65E0\u6CD5\u79FB\u52A8\uFF01`);
            continue;
          }
                    if (isMelee && e.distance > 0) {
            setEnemies(prev => prev.map(en =>
              en.uid === e.uid ? { ...en, distance: Math.max(0, en.distance - 1) } : en
            ));
            if (e.distance === 1) {
              addLog(`${e.name} 逼近到近身位置！`);
            } else {
              addLog(`${e.name} 正在逼近...(距离 ${e.distance - 1})`);
            }
            continue;
          }
          
          // Guardian (tank): alternate attack/defend, taunt effect
          if (e.combatType === 'guardian') {
            if (game.battleTurn % 2 === 0) {
              // Defend turn + taunt
              const shieldVal = Math.floor(e.attackDmg * 1.5);
              setEnemyEffectForUid(e.uid, 'defend');
              playSound('enemy_defend');
              setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + shieldVal } : en));
              // Force player to target this guardian
              setGame(prev => ({ ...prev, targetEnemyUid: e.uid }));
              addLog(`${e.name} 举盾防御（+${shieldVal}护甲），并嘲讽你！`);
              await new Promise(r => setTimeout(r, 300));
              setEnemyEffectForUid(e.uid, null);
              continue;
            }
            // Attack turn: fall through to normal attack below
          }
          
          // Priest (support): smart AI - prioritize healing damaged allies
          if (e.combatType === 'priest') {
            setEnemyEffectForUid(e.uid, 'skill');
            playSound('enemy_skill');
            const allies = currentEnemies.filter(en => en.hp > 0 && en.uid !== e.uid);
            const damagedAllies = allies.filter(en => en.hp < en.maxHp);
            const selfDamaged = e.hp < e.maxHp;
            
            if (damagedAllies.length > 0) {
              // Priority 1: Heal the most damaged ally
              const lowestAlly = damagedAllies.reduce((a, b) => (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b);
              const healVal = Math.floor(e.attackDmg * 2.5);
              setEnemies(prev => prev.map(en => en.uid === lowestAlly.uid ? { ...en, hp: Math.min(en.maxHp, en.hp + healVal) } : en));
              addLog(`${e.name} 治疗了 ${lowestAlly.name} ${healVal} HP。`);
              addFloatingText(`+${healVal}`, 'text-emerald-500', undefined, 'enemy');
              playSound('enemy_heal');
            } else if (selfDamaged) {
              // Priority 2: Heal self if damaged
              const healVal = Math.floor(e.attackDmg * 1.5);
              setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, hp: Math.min(en.maxHp, en.hp + healVal) } : en));
              addLog(`${e.name} 治疗自己 ${healVal} HP。`);
              playSound('enemy_heal');
            } else if (allies.length > 0 && game.battleTurn % 2 === 0) {
              // Priority 3: Buff ally with strength (everyone full HP)
              const target = allies[Math.floor(Math.random() * allies.length)];
              setEnemies(prev => prev.map(en => {
                if (en.uid !== target.uid) return en;
                const existing = en.statuses.find(s => s.type === 'strength');
                if (existing) {
                  return { ...en, statuses: en.statuses.map(s => s.type === 'strength' ? { ...s, value: s.value + 2 } : s) };
                }
                return { ...en, statuses: [...en.statuses, { type: 'strength' as any, value: 2 }] };
              }));
              addLog(`${e.name} 为 ${target.name} 施加了力量强化！`);
            } else {
              // Priority 4: Debuff player OR insert curse dice
              const existing = game.statuses.find(s => s.type === 'weak');
              if (!existing || existing.value < 3) {
                setGame(prev => {
                  const weakStatus = prev.statuses.find(s => s.type === 'weak');
                  if (weakStatus) {
                    return { ...prev, statuses: prev.statuses.map(s => s.type === 'weak' ? { ...s, value: s.value + 1, duration: 2 } : s) };
                  }
                  return { ...prev, statuses: [...prev.statuses, { type: 'weak' as any, value: 1, duration: 2 }] };
                });
                addLog(`${e.name} 对你施加了虚弱！`);
                addFloatingText('虚弱', 'text-purple-400', undefined, 'player');
              } else {
                // Insert a curse dice into player's dice bag!
                const curseDice = Math.random() < 0.5 ? 'cursed' : 'cracked';
                const curseName = curseDice === 'cursed' ? '诅咒骰子' : '碎裂骰子';
                setGame(prev => ({
                  ...prev,
                  ownedDice: [...prev.ownedDice, { defId: curseDice, level: 1 }],
                  diceBag: [...prev.diceBag, curseDice],
                }));
                addLog(`${e.name} 向你的骰子库塞入了一颗${curseName}！`);
                addFloatingText(`+${curseName}`, 'text-red-400', undefined, 'player');
                playSound('enemy_skill');
              }
            }
            
            await new Promise(r => setTimeout(r, 300));
            setEnemyEffectForUid(e.uid, null);
            continue;
          }
          
          // Combat type differentiation:
          // - warrior: high melee damage, 20% bonus at close range
          // - ranger: multi-hit (2 weaker hits), chance to apply burn
          // - caster: single hit + guaranteed debuff
          // - others: normal attack
          setEnemyEffectForUid(e.uid, 'attack');
          setScreenShake(true);
          
          let damage = e.attackDmg;
          // Warrior: melee powerhouse - 30% bonus at close range (the real threat)
          if (e.combatType === 'warrior') {
            damage = Math.floor(damage * 1.3);
          }
          // Ranger: low per-hit damage but attacks twice (total ~0.80x)
          if (e.combatType === 'ranger') {
            damage = Math.floor(damage * 0.40);
            if (isSlowed) damage = Math.floor(damage * 0.5); // Slowed ranger even weaker
          }
          // Caster: low damage but always applies debuff (annoying, not deadly)
          if (e.combatType === 'caster') {
            damage = Math.floor(damage * 0.65);
            if (isSlowed) damage = Math.floor(damage * 0.5); // Slowed caster even weaker
          }
          const str = e.statuses.find(s => s.type === 'strength');
          if (str) damage += str.value;
          const weak = e.statuses.find(s => s.type === 'weak');
          if (weak) damage = Math.max(1, Math.floor(damage * 0.75));
          
          // Caster: guaranteed debuff on every attack
          if (e.combatType === 'caster') {
            setGame(prev => {
              const poisonStatus = prev.statuses.find(s => s.type === 'poison');
              if (poisonStatus) {
                return { ...prev, statuses: prev.statuses.map(s => s.type === 'poison' ? { ...s, value: s.value + 1 } : s) };
              }
              return { ...prev, statuses: [...prev.statuses, { type: 'poison' as any, value: 2 }] };
            });
            addLog(`${e.name} 的攻击附带了毒素！`);
          }
          
          setGame(prev => {
            let newArmor = prev.armor;
            let newHp = prev.hp;
            let absorbed = 0;
            if (newArmor > 0) {
              absorbed = Math.min(newArmor, damage);
              newArmor -= absorbed;
            }
            const hpDmg = damage - absorbed;
            if (hpDmg > 0) newHp = Math.max(0, newHp - hpDmg);
            return { ...prev, hp: newHp, armor: newArmor };
          });
          
          addFloatingText(`-${damage}`, 'text-red-500', undefined, 'player');
          setPlayerEffect('flash');
          addLog(`${e.name} 攻击造成 ${damage} 伤害！`);
          playSound('enemy');
          
          // Ranger: second hit after short delay
          if (e.combatType === 'ranger') {
            await new Promise(r => setTimeout(r, 250));
            const secondHit = Math.floor(e.attackDmg * 0.40);
            setGame(prev => {
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
            addFloatingText(`-${secondHit}`, 'text-orange-400', undefined, 'player');
            addLog(`${e.name} 追击造成 ${secondHit} 伤害！`);
            playSound('enemy');
          }
          
          await new Promise(r => setTimeout(r, 300));
          setScreenShake(false);
          setEnemyEffectForUid(e.uid, null);
          setPlayerEffect(null);
        }


        
        // --- 3.5. Elite/Boss: 塞废骰子 ---
        // 精英怪每2回合塞一颗碎裂骰子，Boss每回合塞一颗（低血量时塞诅咒骰子）
        for (const e of currentEnemies.filter(en => en.hp > 0)) {
          const isElite = e.maxHp > 80 && e.maxHp <= 200; // 精英怪HP范围
          const isBoss = e.maxHp > 200; // Boss HP范围
          
          if (isElite && game.battleTurn % 2 === 0) {
            // 精英每2回合塞一颗碎裂骰子
            setGame(prev => ({
              ...prev,
              ownedDice: [...prev.ownedDice, { defId: 'cracked', level: 1 }],
              diceBag: [...prev.diceBag, 'cracked'],
            }));
            addLog(`${e.name} 向你的骰子库塞入了一颗碎裂骰子！`);
            addFloatingText('+碎裂骰子', 'text-red-400', undefined, 'player');
            playSound('enemy_skill');
            await new Promise(r => setTimeout(r, 400));
          }
          
          if (isBoss) {
            const hpRatio = e.hp / e.maxHp;
            if (hpRatio < 0.4) {
              // Boss低血量：塞诅咒骰子
              setGame(prev => ({
                ...prev,
                ownedDice: [...prev.ownedDice, { defId: 'cursed', level: 1 }],
                diceBag: [...prev.diceBag, 'cursed'],
              }));
              addLog(`${e.name} 施放诅咒，向你的骰子库塞入了一颗诅咒骰子！`);
              addFloatingText('+诅咒骰子', 'text-purple-400', undefined, 'player');
              playSound('enemy_skill');
              await new Promise(r => setTimeout(r, 400));
            } else if (game.battleTurn % 2 === 0) {
              // Boss正常：每2回合塞碎裂骰子
              setGame(prev => ({
                ...prev,
                ownedDice: [...prev.ownedDice, { defId: 'cracked', level: 1 }],
                diceBag: [...prev.diceBag, 'cracked'],
              }));
              addLog(`${e.name} 向你的骰子库塞入了一颗碎裂骰子！`);
              addFloatingText('+碎裂骰子', 'text-red-400', undefined, 'player');
              playSound('enemy_skill');
              await new Promise(r => setTimeout(r, 400));
            }
          }
        }

    // 先计算谁会被毒死（在state更新之前）
    const poisonSurvivors = enemies.filter(e => {
      if (e.hp <= 0) return false;
      const pois = e.statuses.find(s => s.type === 'poison');
      if (pois && pois.value > 0) return e.hp - pois.value > 0;
      return true;
    });
// --- 4. Enemy Turn End: process each enemy's poison ---
    setEnemies(prev => prev.map(e => {
      if (e.hp <= 0) return e;
      let nextStatuses = [...e.statuses];
      const poison = nextStatuses.find(s => s.type === 'poison');
      if (poison && poison.value > 0) {
        addLog(`${e.name} \u56e0\u4e2d\u6bd2\u53d7\u5230\u4e86 ${poison.value} \u70b9\u4f24\u5bb3\u3002`);
        addFloatingText(`-${poison.value}`, 'text-purple-400', <PixelPoison size={2} />, 'enemy');
        nextStatuses = nextStatuses.map(s => s.type === 'poison' ? { ...s, value: s.value - 1 } : s).filter(s => s.value > 0);
        const newHp = Math.max(0, e.hp - poison.value);
        nextStatuses = tickStatuses(nextStatuses);
        return { ...e, hp: newHp, statuses: nextStatuses };
      }
      nextStatuses = tickStatuses(nextStatuses);
      return { ...e, statuses: nextStatuses };
    }));

    await new Promise(r => setTimeout(r, 600));

    // Check if all enemies died from poison
    // Note: we need to re-read enemies after the state update, but since this is async
    // we'll check based on the computed values
    const aliveAfterPoison = enemies.filter(e => e.hp > 0);
    if (aliveAfterPoison.length === 0) {
      const nextWaveIdx = game.currentWaveIndex + 1;
      if (nextWaveIdx < game.battleWaves.length) {
        const nextWave = game.battleWaves[nextWaveIdx].enemies;
        setEnemies(nextWave);
        setEnemyEffects({}); setDyingEnemies(new Set());
        setGame(prev => ({ ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: prev.maxPlays, freeRerollsLeft: prev.freeRerollsPerTurn, armor: 0 }));
        setRerollCount(0);
          setWaveAnnouncement(nextWaveIdx + 1);
        addLog(`\u7b2c ${nextWaveIdx + 1} \u6ce2\u654c\u4eba\u6765\u88ad\uff01`);
        rollAllDice();
        return;
      }
      handleVictory();
      return;
    }

    // --- 5. Player Turn Start ---
    
      // 薛定谔的袋子：若上回合未使用重Roll，本回合额外抽1颗
      let schrodingerBonus = 0;
      if (game.relics.some(r => r.id === 'schrodinger_bag') && rerollCount === 0) {
        schrodingerBonus = 1;
        addLog('薛定谔的袋子：未重Roll，下回合额外抽1颗骰子！');
      }
setGame(prev => {
      const nextTurn = prev.battleTurn + 1;
      let nextStatuses = [...prev.statuses];
      let burnDamage = 0;
      const burn = prev.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        burnDamage = burn.value;
        addLog(`\u4f60\u56e0\u707c\u70e7\u53d7\u5230\u4e86 ${burnDamage} \u70b9\u4f24\u5bb3\u3002`);
        addFloatingText(`-${burnDamage}`, 'text-orange-500', <PixelFlame size={2} />, 'player');
        const nextBurnValue = Math.floor(burn.value / 2);
        nextStatuses = nextStatuses.map(s => s.type === 'burn' ? { ...s, value: nextBurnValue } : s).filter(s => s.value > 0);
      }
      nextStatuses = tickStatuses(nextStatuses);
      currentPlayerHp = Math.max(0, prev.hp - burnDamage);

      // Update all alive enemies' intents for next turn
      setEnemies(prevEnemies => prevEnemies.map(e => {
        if (e.hp <= 0 || !e.pattern) return e;
        return e; // pattern no longer sets intent
      }));

      return { 
        ...prev, 
        battleTurn: nextTurn, 
        hp: currentPlayerHp,
        statuses: nextStatuses,
        isEnemyTurn: false
      };
    });

    await new Promise(r => setTimeout(r, 100));

    if (currentPlayerHp <= 0) { playSound('defeat'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    setGame(prev => ({ 
      ...prev, 
      isEnemyTurn: false, 
      armor: 0,
      playsLeft: prev.maxPlays,
      freeRerollsLeft: prev.freeRerollsPerTurn
    }));

    // === 留手牌机制 ===
    // 未使用的骰子留在手中，下回合只补抽到 drawCount 上限
    const remainingDice = dice.filter(d => !d.spent);
    const remainingCount = remainingDice.length;
    
    // Use setTimeout to ensure previous state updates are flushed
    setTimeout(() => {
      // Read latest game state from ref (avoids stale closure)
      const g = gameRef.current;
      setRerollCount(0); // Reset reroll count for new turn
      const needDraw = Math.max(0, g.drawCount - remainingCount);
      
      let finalBag = [...g.diceBag];
      let finalDiscard = [...g.discardPile];
      let drawnDice: Die[] = [];
      let wasShuffled = false;
      
      if (needDraw > 0) {
        const result = drawFromBag(finalBag, finalDiscard, needDraw);
        drawnDice = result.drawn;
        finalBag = result.newBag;
        finalDiscard = result.newDiscard;
        wasShuffled = result.shuffled;
      }
      
      if (wasShuffled) { setShuffleAnimating(true); setTimeout(() => setShuffleAnimating(false), 800); addToast('\u2728 \u5f03\u9ab0\u5e93\u5df2\u6d17\u56de\u9ab0\u5b50\u5e93!', 'buff'); }
      
      // Merge kept dice + fresh dice
      const keptDice: Die[] = remainingDice.map((d) => ({
        ...d,
        selected: false,
        kept: true,
      }));
      // drawnDice already have unique ids from drawFromBag
      const freshDice: Die[] = drawnDice.map((d) => ({
        ...d,
        rolling: true,
        kept: false,
        value: Math.floor(Math.random() * 6) + 1,
      }));
      
      // Update game state (pure, no side effects)
      setGame(prev => ({ ...prev, diceBag: finalBag, discardPile: finalDiscard }));
      
      // Side effects: animations and dice update
      setDiceDrawAnim(true);
      setTimeout(() => setDiceDrawAnim(false), 400);
      setDice([...keptDice, ...freshDice]);
      
      // Roll animation for fresh dice only
      const doRoll = async () => {
        const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
        for (let f = 0; f < frameTimes.length; f++) {
          await new Promise(r => setTimeout(r, frameTimes[f]));
          setDice(pd => pd.map(d => d.rolling ? { ...d, value: rollDiceDef(getDiceDef(d.diceDefId)) } : d));
          if (f === 3) playSound('reroll');
        }
        setDice(pd => pd.map(d => ({ ...d, rolling: false, kept: false })));
        // 元素骰子坍缩 + 小丑骰子1-9随机
        setDice(prev => applyDiceSpecialEffects(prev));
        playSound('dice_lock');
        // Auto-sort dice by value ascending after roll
        await new Promise(r => setTimeout(r, 200));
        setDice(prev => [...prev].sort((a, b) => a.value - b.value));
      };
      doRoll();
    }, 100);
    playSound('roll');
  };

  // Auto-switch target when current target dies
  useEffect(() => {
    if (game.phase !== 'battle') return;
    const alive = enemies.filter(e => e.hp > 0);
    if (alive.length === 0) return;
    const currentTarget = alive.find(e => e.uid === game.targetEnemyUid);
    if (!currentTarget) {
      // Current target is dead or not set, switch to first alive enemy
      setGame(prev => ({ ...prev, targetEnemyUid: (alive.find(e => e.combatType === 'guardian') || alive[0]).uid }));
    }
  }, [enemies, game.phase, game.targetEnemyUid]);

useEffect(() => {
    if (
      game.phase === 'battle' && 
      !game.isEnemyTurn && 
      enemies.length > 0 && 
      enemies.some(e => e.hp > 0) && 
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
  }, [game.phase, game.isEnemyTurn, enemies, game.hp, dice, game.playsLeft]);

  const handleVictory = () => {
    // 战斗结束：销毁敌人塞的废骰子（cursed/cracked）
    setGame(prev => ({
      ...prev,
      ownedDice: prev.ownedDice.filter(d => d.defId !== 'cursed' && d.defId !== 'cracked'),
      diceBag: prev.diceBag.filter(id => id !== 'cursed' && id !== 'cracked'),
      discardPile: prev.discardPile.filter(id => id !== 'cursed' && id !== 'cracked'),
    }));

    // 战斗胜利统计
    const currentNode = game.map.find(n => n.id === game.currentNodeId);
    const nodeType = currentNode?.type || 'enemy';
    const killedCount = enemies.filter(e => e.hp <= 0).length;
    setGame(prev => {
      const s = { ...prev.stats };
      s.battlesWon += 1;
      s.enemiesKilled += killedCount;
      if (nodeType === 'elite') s.elitesWon += 1;
      if (nodeType === 'boss') s.bossesWon += 1;
      return { ...prev, stats: s };
    });
    if (enemies.length === 0) return;
    const allWaveEnemies = game.battleWaves.flatMap(w => w.enemies);
    playSound('victory');
    addLog(`击败了 ${enemies[0]?.name || ""}！`);
    
    let baseGold = enemies.reduce((s,e) => s + e.dropGold, 0);
    // on_battle_end 遗物触发（如废品回收站）
    game.relics.filter(r => r.trigger === 'on_battle_end').forEach(relic => {
      const res = relic.effect({
        cursedDiceInHand: dice.filter(d => getDiceDef(d.diceDefId).isCursed).length,
        crackedDiceInHand: dice.filter(d => getDiceDef(d.diceDefId).isCracked).length,
      });
      if (res.goldBonus && res.goldBonus > 0) {
        baseGold += res.goldBonus;
        addToast(`♻️ ${relic.name}: +${res.goldBonus}金币`, 'gold');
      }
    });
    const loot: LootItem[] = [
      { id: 'gold', type: 'gold', value: baseGold, collected: false }
    ];

    // Boss rewards: +1 draw count
    const victoryNode = game.map.find(n => n.id === game.currentNodeId);
    if (victoryNode?.type === 'boss') {
      loot.push({ id: 'bossDrawCount', type: 'diceCount', value: 1, collected: false });
    }

    // Elite rewards: +1 Dice, +2 Global Rerolls, or +1 Free Reroll per turn
    if (enemies.find(e => e.rerollReward)?.rerollReward) {
      const eliteRewards = LOOT_CONFIG.eliteRewards;
      const selectedReward = eliteRewards[Math.floor(Math.random() * eliteRewards.length)];
      
      if (selectedReward.type === 'freeRerollPerTurn') {
        loot.push({ id: 'freeReroll', type: 'reroll', value: selectedReward.value, collected: false });
      } else {
        loot.push({ id: selectedReward.type, type: selectedReward.type as any, value: selectedReward.value, collected: false });
      }
    }

    if (allWaveEnemies.some(e => e.dropAugment)) {
      const options: Augment[] = [];
      const pool = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5);
      for (let i = 0; i < LOOT_CONFIG.augmentChoiceCount; i++) options.push(pool[i]);
      loot.push({ id: 'augment', type: 'augment', augmentOptions: options, collected: false });
    }

    // 遗物掉落：精英战/Boss战必掉，普通战30%概率
    const battleType = allWaveEnemies.some(e => e.name.includes('Boss')) ? 'boss' : 
                       allWaveEnemies.some(e => e.rerollReward) ? 'elite' : 'enemy';
    const relicDropChance = battleType === 'enemy' ? 0.3 : 1.0;
    if (Math.random() < relicDropChance) {
      const relicPool = getRelicRewardPool(battleType);
      const ownedRelicIds = game.relics.map(r => r.id);
      const newRelics = pickRandomRelics(relicPool, 1, ownedRelicIds);
      if (newRelics.length > 0) {
        const newRelic = newRelics[0];
        loot.push({ id: 'relic-' + newRelic.id, type: 'relic' as any, value: 0, collected: true, relicData: newRelic });
        // 直接添加遗物到状态（在下面的setGame中处理）
        setTimeout(() => {
          setGame(prev => ({
            ...prev,
            relics: [...prev.relics, { ...newRelic }],
          }));
          addToast('✦ 获得遗物: ' + newRelic.name + '!', 'buff');
        }, 500);
      }
    }
    setGame(prev => {
      const newMap = prev.map.map(n => n.id === prev.currentNodeId ? { ...n, completed: true } : n);
      
      if (prev.currentNodeId && prev.map.find(n => n.id === prev.currentNodeId)?.type === 'boss') {
        const bossNode = prev.map.find(n => n.id === prev.currentNodeId);
        // 只有最终Boss(depth>=14)才进入胜利画面，中层Boss继续走图拿战利品
        if (bossNode && bossNode.depth >= 14) {
          // 判断是否为最终章
          if (prev.chapter >= CHAPTER_CONFIG.totalChapters) {
            return { ...prev, map: newMap, phase: 'victory', isEnemyTurn: false };
          } else {
            // 进入大关过渡
            return { ...prev, map: newMap, phase: 'chapterTransition' as any, isEnemyTurn: false };
          }
        }
        // 中层Boss：继续走正常战利品流程
      }

      return { 
        ...prev, 
        map: newMap,
        phase: 'diceReward',
        lootItems: loot,
        isEnemyTurn: false,
        relics: prev.relics.map(r => r.id === 'emergency_hourglass' ? { ...r, counter: 0 } : r)
      };
    });
  };

  // === 大关过渡：进入下一章 ===
  const handleNextChapter = () => {
    setGame(prev => {
      const nextChapter = prev.chapter + 1;
      const healAmount = Math.floor(prev.maxHp * CHAPTER_CONFIG.chapterHealPercent);
      const newHp = Math.min(prev.maxHp, prev.hp + healAmount);
      const bonusGold = CHAPTER_CONFIG.chapterBonusGold;
      const newMap = generateMap();
      const diceIds = prev.ownedDice.map(d => d.defId);
      const newBag = initDiceBag(diceIds);
      return {
        ...prev,
        chapter: nextChapter,
        map: newMap,
        currentNodeId: null,
        phase: 'map' as const,
        hp: newHp,
        armor: 0,
        souls: prev.souls + bonusGold,
        diceBag: newBag,
        discardPile: [],
        statuses: [],
        battleTurn: 0,
        isEnemyTurn: false,
        battleWaves: [],
        currentWaveIndex: 0,
        logs: [...prev.logs, `\n=== 第${nextChapter}章: ${CHAPTER_CONFIG.chapterNames[nextChapter - 1]} ===\n回复了 ${healAmount} HP，获得 ${bonusGold} 金币`],
      };
    });
    setEnemies([]);
    playSound('victory');
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
          nextState.freeRerollsPerTurn += item.value || 0;
          addLog(`获得了 ${item.value} 次全局重骰机会。`);
        }
      } else if (item.type === 'maxPlays') {
        nextState.maxPlays += item.value || 0;
        addLog(`获得了 ${item.value} 次出牌机会。`);
      } else if (item.type === 'specialDice' && item.diceDefId) {
        nextState.ownedDice = [...nextState.ownedDice, { defId: item.diceDefId!, level: 1 }];
        const ddef = getDiceDef(item.diceDefId);
        addLog(`获得了特殊骰子: ${ddef.name}。`);
      } else if (item.type === 'diceCount') {
        const oldDice = nextState.drawCount;
        nextState.drawCount = Math.min(6, nextState.drawCount + (item.value || 0));
        if (nextState.drawCount > oldDice) {
          nextState.enemyHpMultiplier += 0.25;
        }
        addLog(`获得了 ${item.value} 颗骰子。`);
      }

      return nextState;
    });
    
    // Dice gained toast — outside setGame to avoid StrictMode double-fire
    if (item.type === 'specialDice' && item.diceDefId) {
      const ddef = getDiceDef(item.diceDefId);
      addToast(`获得了特殊骰子: ${ddef.name}`);
    } else if (item.type === 'diceCount' && game.drawCount < 6) {
      addToast("获得诅咒之力，敌人也都变强了");
      addLog("获得诅咒之力，敌人血量提升 25%。");
    }
  };

  const selectLootAugment = (aug: Augment) => {
    if (!pendingLootAugment) return;
    playSound('select');
    
    // Augment module: find empty slot or replace
    const existingIdx = game.augments.findIndex(a => a?.id === aug.id);
    if (existingIdx !== -1) {
      // Upgrade existing
      setGame(prev => {
        const nextAugs = [...prev.augments];
        const existing = nextAugs[existingIdx]!;
        nextAugs[existingIdx] = { ...existing, level: (existing.level || 1) + 1 };
        const nextLoot = prev.lootItems.map(i => i.id === pendingLootAugment.id ? { ...i, collected: true } : i);
        addLog(`\u6A21\u5757\u5347\u7EA7: ${aug.name} Lv.${(existing.level || 1) + 1}`);
        return { ...prev, augments: nextAugs, lootItems: nextLoot };
      });
      setPendingLootAugment(null);
    } else {
      const emptyIdx = game.augments.findIndex(a => a === null);
      if (emptyIdx !== -1) {
        setGame(prev => {
          const nextAugs = [...prev.augments];
          nextAugs[emptyIdx] = { ...aug, level: 1 };
          const nextLoot = prev.lootItems.map(i => i.id === pendingLootAugment.id ? { ...i, collected: true } : i);
          addLog(`\u83B7\u5F97\u65B0\u6A21\u5757: ${aug.name}`);
          return { ...prev, augments: nextAugs, lootItems: nextLoot };
        });
        setPendingLootAugment(null);
      } else {
        // All slots full, need replacement UI
        setGame(prev => ({ ...prev, pendingReplacementAugment: { ...aug, level: 1 } }));
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
      const newAugments = [...prev.augments];
      const emptyIdx = newAugments.findIndex(a => a === null);
      if (emptyIdx !== -1) {
        newAugments[emptyIdx] = { ...aug, level: 1 };
        addLog(`\u83B7\u5F97\u4E86\u65B0\u6A21\u5757: ${aug.name}`);
        return { ...prev, augments: newAugments, phase: 'map' };
      } else {
        // All 5 slots full, need to replace
        return { ...prev, pendingReplacementAugment: { ...aug, level: 1 } };
      }
    });
  };

  const nextNode = () => {
    const next = game.currentNode + 1;
    if (next === 4 || next === 9) {
      setGame(prev => ({ ...prev, phase: 'campfire', currentNode: next }));
    } else if (next === 5) {
      // 游荡商人：随机3个商品
      const [minP, maxP] = SHOP_CONFIG.priceRange;
      const rp = () => Math.floor(Math.random() * (maxP - minP + 1)) + minP;
      const candidates: ShopItem[] = [];
      const sAugs = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5);
      for (const aug of sAugs.slice(0, 3)) {
        candidates.push({ id: 'aug_' + aug.id, type: 'augment' as const, augment: aug, label: aug.name, desc: aug.description, price: rp() });
      }
      const sDice = [...DICE_BY_RARITY.uncommon, ...DICE_BY_RARITY.rare].sort(() => Math.random() - 0.5);
      for (const d of sDice.slice(0, 2)) {
        candidates.push({ id: 'dice_' + d.id, type: 'specialDice' as const, diceDefId: d.id, label: d.name, desc: d.description + ' [' + d.faces.join(',') + ']', price: d.rarity === 'rare' ? rp() + 30 : rp() + 10 });
      }
      candidates.push({ id: 'reroll_legacy', type: 'reroll' as const, label: '重掷强化', desc: '永久增加每回合 +1 次免费重掷', price: rp() });
      const shopItems: ShopItem[] = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
      setGame(prev => ({ ...prev, phase: 'shop', currentNode: next, shopItems }));
    } else if (next === 7) {
      setGame(prev => ({ ...prev, phase: 'event', currentNode: next }));
    } else {
      startBattle(next);
    }
  };

  
  const COMBAT_TYPE_DESC: Record<string, { name: string; icon: string; color: string; desc: string }> = {
    warrior: { name: '战士', icon: '', color: 'var(--pixel-red)', desc: '近战类型，需要接近后才能攻击。每回合逼近1步，到达后每回合普通攻击。' },
    guardian: { name: '守护者', icon: '', color: 'var(--pixel-blue)', desc: '重装近战类型，需要接近后才能攻击。交替攻击和举盾防御，获得额外护甲。' },
    ranger: { name: '游侠', icon: '', color: 'var(--pixel-green)', desc: '远程类型，从远处就能发动攻击。伤害稳定但较低，持续输出。' },
    caster: { name: '施法者', icon: '', color: 'var(--pixel-purple)', desc: '远程魔法类型，从远处就能发动攻击。会释放强力法术，可能附带特殊效果。' },
    priest: { name: '牧师', icon: '', color: 'var(--pixel-gold)', desc: '治疗类型，交替攻击和治疗友方。优先治疗血量最低的友方。' },
  };

  const getEffectiveAttackDmg = (e: Enemy) => {
    let val = e.attackDmg;
    const weak = e.statuses.find(s => s.type === 'weak');
    if (weak) val = Math.floor(val * 0.75);
    const playerVuln = game.statuses.find(s => s.type === 'vulnerable');
    if (playerVuln) val = Math.floor(val * 1.5);
    const strength = e.statuses.find(s => s.type === 'strength');
    if (strength) val += strength.value;
    return val;
  };

  // --- GameContext Provider Value ---
  const contextValue = {
    game, setGame,
    enemies, setEnemies, targetEnemy,
    dice, setDice,
    showTutorial, setShowTutorial,
    showHandGuide, setShowHandGuide,
    showDiceGuide, setShowDiceGuide,
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

  if (game.phase === 'chapterTransition') {
    return (
      <GameContext.Provider value={contextValue}>
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #080b0e 0%, #1a1520 50%, #0e1317 100%)' }}>
          <ChapterTransition />
        </div>
      </GameContext.Provider>
    );
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
        {game.phase === 'diceReward' && <DiceRewardScreen />}
        {game.phase === 'loot' && <LootScreen />}
        {game.phase === 'shop' && <ShopScreen />}
        {game.phase === 'treasure' && <ShopScreen treasureMode={true} />}
        {game.phase === 'campfire' && <CampfireScreen />}
        {game.phase === 'event' && <EventScreen />}

        {/* 战前技能模块选择界面 - extracted to SkillSelectScreen */}
        {game.phase === 'skillSelect' && <SkillSelectScreen />}

        {game.phase === 'battle' && enemies.length > 0 && (
          <motion.div 
            animate={screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
            className="flex flex-col h-full relative"
          >
            {/* ============================================
                沉浸式第一人称战斗界面
                ============================================ */}

            {/* 地牢环境背景层 */}
            <div className="absolute inset-0 battle-open-bg" />
            <div className="absolute inset-0 battle-vignette z-[1]" />
            <div className="absolute inset-0 dungeon-stain pointer-events-none z-[1]" />
            
            {/* 远处拱门/石柱轮廓 */}
            <div className="battle-archway" />
            
            {/* 左右火把光源 */}
            <div className="battle-torch-left battle-torch-flame" />
            <div className="battle-torch-right battle-torch-flame" style={{ animationDelay: '0.3s' }} />
            
            {/* 像素火把SVG — 左侧 */}
            <div className="absolute left-[2%] top-[15%] z-[3] pointer-events-none battle-torch-flame" style={{ opacity: 0.75 }}>
              <svg width="18" height="42" viewBox="0 0 18 42" style={{ imageRendering: 'pixelated' as any }}>
                <rect x="8" y="18" width="2" height="24" fill="#5a4030" />
                <rect x="7" y="16" width="4" height="4" fill="#8b5a2c" />
                <rect x="6" y="14" width="6" height="4" fill="#c87c3c" />
                <rect x="5" y="10" width="8" height="6" fill="#e8a030" />
                <rect x="6" y="6" width="6" height="6" fill="#f0c848" />
                <rect x="7" y="3" width="4" height="5" fill="#fff4c0" />
                <rect x="8" y="1" width="2" height="3" fill="#fffde8" />
              </svg>
            </div>
            {/* 像素火把SVG — 右侧 */}
            <div className="absolute right-[2%] top-[15%] z-[3] pointer-events-none battle-torch-flame" style={{ opacity: 0.75, animationDelay: '0.4s' }}>
              <svg width="18" height="42" viewBox="0 0 18 42" style={{ imageRendering: 'pixelated' as any }}>
                <rect x="8" y="18" width="2" height="24" fill="#5a4030" />
                <rect x="7" y="16" width="4" height="4" fill="#8b5a2c" />
                <rect x="6" y="14" width="6" height="4" fill="#c87c3c" />
                <rect x="5" y="10" width="8" height="6" fill="#e8a030" />
                <rect x="6" y="6" width="6" height="6" fill="#f0c848" />
                <rect x="7" y="3" width="4" height="5" fill="#fff4c0" />
                <rect x="8" y="1" width="2" height="3" fill="#fffde8" />
              </svg>
            </div>

            {/* 环境粒子 — 飘散的灰尘/余烬 */}
            <CSSParticles type="ember" count={8} className="opacity-25 z-[2]" />
            <CSSParticles type="sparkle" count={4} className="opacity-15 z-[2]" />
            <CSSParticles type="float" count={4} className="opacity-15 z-[2]" />

            {/* 地面低雾 */}
            <div className="battle-ground-fog" />

            {/* 环境雾气层 */}
            <div className="absolute inset-0 z-[2] pointer-events-none">
              <div className="absolute bottom-[35%] left-0 right-0 h-[35%] animate-fog-drift" 
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(120,90,50,0.08) 0%, transparent 65%)' }} />
              <div className="absolute bottom-[20%] left-0 right-0 h-[20%] animate-fog-drift"
                style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(100,80,55,0.06) 0%, transparent 60%)', animationDelay: '3s' }} />
            </div>

            {/* 战斗闪光覆盖层 */}
            <AnimatePresence>
              {(playerEffect === 'attack' || Object.values(enemyEffects).includes('attack')) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.12, 0.05, 0.08, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, times: [0, 0.15, 0.3, 0.5, 1] }}
                  className={`absolute inset-0 z-[60] pointer-events-none ${playerEffect === 'attack' ? 'bg-red-500' : 'bg-white'}`}
                />
              )}
            </AnimatePresence>

            {/* === 玩家Debuff屏幕特效层 === */}
            {game.statuses.some(s => s.type === 'burn') && (
              <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-burn" />
            )}
            {game.statuses.some(s => s.type === 'poison') && (
              <>
                <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-poison" />
                <div className="absolute inset-0 z-[5] pointer-events-none debuff-poison-bubbles">
                  {Array.from({length: 8}).map((_, i) => (
                    <div key={i} className="debuff-poison-bubble" style={{
                      left: `${10 + Math.random() * 80}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${2 + Math.random() * 2}s`,
                    }} />
                  ))}
                </div>
              </>
            )}
            {game.statuses.some(s => s.type === 'weak') && (
              <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-weak" />
            )}
            {game.statuses.some(s => s.type === 'vulnerable') && (
              <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-vulnerable" />
            )}
            
            {/* ===== 上半区：3D立体敌人舞台 ===== */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-[3] min-h-0">
              {/* 透视地板 */}
              <div className="battle-floor-perspective" />
              
              {/* 左上角关卡位置信息 */}
              {/* 波次信息 - 点击查看详情 */}
              {game.battleWaves.length > 0 && (
                <div 
                  className="absolute top-2 left-2 z-20 flex flex-col gap-1 cursor-pointer"
                  onClick={() => setShowWaveDetail(true)}
                >
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[rgba(8,11,14,0.8)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>
                      <PixelSkull size={1} className="inline-block mr-0.5" style={{ verticalAlign: 'middle' }} />
                    <span className="text-[10px] text-[var(--pixel-orange)] font-bold">第{game.currentWaveIndex + 1}波</span>
                    <span className="text-[9px] text-[var(--dungeon-text-dim)]">/ {game.battleWaves.length}波</span>
                  </div>
                  {game.currentWaveIndex + 1 < game.battleWaves.length && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[rgba(8,11,14,0.65)] border border-[rgba(255,255,255,0.06)]" style={{borderRadius:'2px'}}>
                      <span className="text-[8px] text-[var(--dungeon-text-dim)]">下波:</span>
                      {game.battleWaves[game.currentWaveIndex + 1].enemies.slice(0, 3).map((ne, ni) => (
                        <div key={ni} className="inline-flex items-center" title={ne.name} style={{ transform: 'scale(0.5)', transformOrigin: 'center', margin: '-2px' }}>
                          {hasSpriteData(ne.name) ? <PixelSprite name={ne.name} size={2} /> : <PixelSkull size={2} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

                {/* Multi-enemy fixed-slot display (no reflow on death) */}
                <div className="relative" style={{ minHeight: '180px', display: 'grid', gridTemplateColumns: `repeat(${Math.max(enemies.length, 1)}, 1fr)`, alignItems: 'end', justifyItems: 'center', gap: '4px' }}>
                {[...enemies]  /* 不排序，保持稳定渲染顺序避免位置闪现 */
                  .map((enemy) => {
                    const effect = enemyEffects[enemy.uid] || null;
                    if (enemy.hp <= 0 && effect !== 'death') {
                      return <div key={enemy.uid} style={{ minWidth: '60px', minHeight: '100px' }} />;
                    }
                  const isTarget = isAoeActive ? (enemy.hp > 0) : (enemy.uid === (targetEnemyUid || enemies.find(e => e.hp > 0)?.uid));
                  const currentNode = game.map.find(n => n.id === game.currentNodeId);
                  const baseSpriteSize = currentNode?.type === 'boss' ? 12 : currentNode?.type === 'elite' ? 10 : 7;
                  
                // Distance-based visual scaling - USE SCALE for clear depth
                const dist = enemy.distance || 0;
                // Scale: distance 0 = 1.15 (big, in your face), 1 = 0.95, 2 = 0.75, 3 = 0.6
                const depthScale = dist === 0 ? 1.35 : dist === 1 ? 0.95 : dist === 2 ? 0.75 : 0.6;
                  const depthY = dist >= 3 ? -50 : dist === 2 ? -25 : dist === 1 ? -5 : 25;
                  const depthOpacity = 1.0; // No opacity reduction - use brightness for depth
                  const isAttackReady = dist === 0;
                    const depthBrightness = dist >= 3 ? 0.82 : dist === 2 ? 0.9 : dist === 1 ? 0.95 : 1.0;
                  const depthZ = dist >= 3 ? 1 : dist === 2 ? 3 : dist === 1 ? 5 : 7;
                  const spriteSize = Math.max(4, Math.round(baseSpriteSize * depthScale));
                  
                  return (
                    <motion.div 
                      key={enemy.uid}
                      onClick={() => {
                        // Guardian taunt: if any guardian is alive, can only target guardians (or this IS a guardian)
                        const aliveGuardian = enemies.find(e => e.hp > 0 && e.combatType === 'guardian' && e.uid !== enemy.uid);
                        if (aliveGuardian && enemy.combatType !== 'guardian') {
                          addToast('盾卫强制嘲讽！必须先击败盾卫');
                          return;
                        }
                        setGame(prev => ({ ...prev, targetEnemyUid: enemy.uid }));
                      }}
                      initial={{ scale: depthScale * 0.8, opacity: 0, y: depthY + 20 }}
                      animate={effect === 'death'
                        ? { scale: [1, 1.1, 0.95, 1.05, 1.2, 1.4, 0.5, 0], opacity: [1, 1, 1, 1, 0.9, 0.7, 0.3, 0], y: [0, -5, 0, -3, -10, -25, -35, 10], rotate: [0, -5, 5, -3, 8, -15, 30, 0], filter: ['brightness(1)', 'brightness(1)', 'brightness(1)', 'brightness(1.5)', 'brightness(2)', 'brightness(3)', 'brightness(5)', 'brightness(0)'] }
                        : effect === 'attack' 
                        ? { y: [0, -8, 30, 0], scale: [1, 1.05, 1.12, 1] } 
                        : effect === 'defend' 
                        ? { scale: [1, 1.08, 1] } 
                        : effect === 'skill'
                        ? { scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }
                        : playerEffect === 'attack' && isTarget
                        ? { x: [0, -4, 6, -3, 0], scale: [1, 0.97, 1.01, 0.99, 1] }
                        : { scale: depthScale, y: depthY, opacity: depthOpacity }
                      }
                      transition={{ duration: effect === 'death' ? 1.8 : 0.4, ease: effect === 'death' ? [0.25, 0.1, 0.25, 1] : 'easeOut' }}
                      className={`relative cursor-pointer group flex flex-col items-center`}
                      style={{ zIndex: isTarget ? 10 : depthZ, filter: `brightness(${depthBrightness})` }}
                    >
                      {/* Target indicator arrow */}
                      {isTarget && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                            <svg width="10" height="8" viewBox="0 0 10 8" style={{imageRendering:'pixelated'}}>
                              <polygon points="5,8 0,0 10,0" fill="var(--pixel-orange)" />
                            </svg>
                          </motion.div>
                        </div>
                      )}

                      {/* Combat type indicator — click to show enemy info */}
                      <div className="flex items-center justify-center mb-1 px-1.5 py-0.5 cursor-pointer hover:brightness-125 transition-all"
                        onClick={(e) => { e.stopPropagation(); setEnemyInfoTarget(enemy.uid); }}
                        style={{
                          background: 'rgba(8,11,14,0.85)',
                          border: '2px solid ' + (
                            enemy.combatType === 'warrior' ? 'var(--pixel-red)' :
                            enemy.combatType === 'guardian' ? 'var(--pixel-blue)' :
                            enemy.combatType === 'ranger' ? 'var(--pixel-green)' :
                            enemy.combatType === 'caster' ? 'var(--pixel-purple)' :
                            'var(--pixel-gold)'
                          ),
                          borderRadius: '2px',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          color: enemy.combatType === 'warrior' ? 'var(--pixel-red-light)' :
                            enemy.combatType === 'guardian' ? 'var(--pixel-blue-light)' :
                            enemy.combatType === 'ranger' ? 'var(--pixel-green-light)' :
                            enemy.combatType === 'caster' ? 'var(--pixel-purple-light)' :
                            'var(--pixel-gold-light)',
                        }}
                      >
                        {enemy.combatType === 'warrior' && <><PixelSword size={2} /><span className="ml-0.5">战</span></>}
                        {enemy.combatType === 'guardian' && <><PixelShield size={2} /><span className="ml-0.5">盾</span></>}
                        {enemy.combatType === 'ranger' && <><PixelAttackIntent size={2} /><span className="ml-0.5">弓</span></>}
                        {enemy.combatType === 'caster' && <><PixelMagic size={2} /><span className="ml-0.5">术</span></>}
                        {enemy.combatType === 'priest' && <><PixelHeart size={2} /><span className="ml-0.5">牧</span></>}
                        <span className="ml-1 font-mono text-[var(--dungeon-text-dim)]">{enemy.attackDmg}</span>
                      </div>

                      {/* Enemy name + distance */}
                      <div className="text-center mb-0.5">
                        <span className="font-bold text-[var(--dungeon-text-bright)] text-[12px] pixel-text-shadow">{enemy.name}</span><span className="ml-1 text-[9px] font-mono px-1 py-0" style={{borderRadius: '2px',border: '1px solid ' + ((enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? 'var(--pixel-orange)' : 'var(--pixel-cyan)'),color: (enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? 'var(--pixel-orange-light)' : 'var(--pixel-cyan-light)',background: (enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? 'rgba(224,120,48,0.15)' : 'rgba(48,216,208,0.15)',}}>{(enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? '近' : '远'}</span>
                        {enemy.distance > 0 && (
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <div key={idx} className="w-1.5 h-1.5" style={{
                                background: idx < enemy.distance ? 'var(--pixel-orange)' : 'rgba(255,255,255,0.15)',
                                borderRadius: '1px',
                                boxShadow: idx < enemy.distance ? '0 0 3px rgba(224,120,48,0.5)' : 'none'
                              }} />
                            ))}
                            <span className="text-[9px] text-[var(--pixel-orange-light)] font-mono ml-0.5">{'距'}{enemy.distance}</span>
                          </div>
                        )}
                      </div>

                      {/* HP bar */}
                      <div className="pixel-hp-bar h-2.5 w-20 relative mb-1">
                        <motion.div 
                          className={`h-full ${enemy.armor > 0 ? 'pixel-hp-fill-armor' : 'pixel-hp-fill-critical'}`}
                          initial={{ width: '100%' }}
                          animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[9px] font-mono font-bold text-white pixel-text-shadow">
                            {enemy.hp}/{enemy.maxHp}
                          </span>
                        </div>
                      </div>
                      
                      {/* Status effects */}
                      <div className="flex flex-wrap gap-0.5 justify-center mb-1 min-h-[12px]">
                        {enemy.armor > 0 && <StatusIcon status={{ type: 'armor', value: enemy.armor }} align="center" />}
                        {enemy.statuses.map((s, i) => <StatusIcon key={i} status={s} align="center" />)}
                      </div>

                      {/* Enemy sprite */}
                      <div className="animate-enemy-breathe relative">
                        {hasSpriteData(enemy.name) ? (
                          <PixelSprite name={enemy.name} size={spriteSize} />
                        ) : (
                          <PixelSkull size={spriteSize} />
                        )}
                        
                        {enemy.statuses.some(s => s.type === 'burn') && (
                          <>
                            <div className="absolute inset-[-6px] pointer-events-none enemy-debuff-burn" style={{borderRadius:'50%'}} />
                            <div className="absolute inset-[-8px] pointer-events-none enemy-burn-particles">
                              {Array.from({length: 4}).map((_, pi) => (
                                <div key={pi} className="enemy-burn-spark" style={{
                                  left: `${20 + Math.random() * 60}%`,
                                  animationDelay: `${Math.random() * 1.5}s`,
                                }} />
                              ))}
                            </div>
                          </>
                        )}
                        {enemy.statuses.some(s => s.type === 'poison') && (
                          <>
                            <div className="absolute inset-[-6px] pointer-events-none enemy-debuff-poison" style={{borderRadius:'50%'}} />
                            <div className="absolute inset-[-8px] pointer-events-none enemy-poison-drips">
                              {Array.from({length: 3}).map((_, pi) => (
                                <div key={pi} className="enemy-poison-drip" style={{
                                  left: `${25 + Math.random() * 50}%`,
                                  animationDelay: `${Math.random() * 2}s`,
                                }} />
                              ))}
                            </div>
                          </>
                        )}
                        {enemy.statuses.some(s => s.type === 'weak') && (
                          <div className="absolute inset-[-4px] pointer-events-none enemy-debuff-weak" style={{borderRadius:'50%'}} />
                        )}
                        {enemy.statuses.some(s => s.type === 'vulnerable') && (
                          <div className="absolute inset-[-4px] pointer-events-none enemy-debuff-vulnerable" style={{borderRadius:'50%'}} />
                        )}

                        {isTarget && (
                          <div className="absolute inset-[-6px] pointer-events-none enemy-target-glow" />

                        )}
                      </div>
                      
                      {/* Shadow on floor */}
                      <div className="mt-1" style={{
                        width: '150%',
                        height: '18px',
                        background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)',
                        borderRadius: '50%',
                        marginLeft: '-25%',
                        filter: 'blur(3px)',
                        transform: 'scaleY(0.6)',
                      }} />

                      {/* Distance indicator */}
                      {dist > 0 && (
                        <div className="distance-indicator mt-0.5">
                          {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className={i < dist ? 'distance-dot' : 'distance-dot-empty'} />
                          ))}
                        </div>
                      )}

                      {/* Attack/skill effects overlay */}
                      <AnimatePresence>
                        {effect === 'attack' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                            animate={{ opacity: 1, scale: 2, y: 80 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                          >
                            <PixelSword size={5} />
                          </motion.div>
                        )}
                        {playerEffect === 'attack' && isTarget && (
                          <motion.div
                            initial={{ opacity: 1, scaleX: 0 }}
                            animate={{ opacity: [1, 1, 0], scaleX: [0, 1.2, 1.5], rotate: -15 }}
                            transition={{ duration: 0.35 }}
                            className="absolute inset-[-10px] pointer-events-none z-30 slash-effect"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Wave announcement overlay */}
              <AnimatePresence>
                {waveAnnouncement !== null && (
                  <motion.div
                    key={`wave-${waveAnnouncement}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 1, 0], scale: [0.5, 1.2, 1, 1, 0.8], y: [0, 0, 0, 0, -30] }}
                    transition={{ duration: 2.5, times: [0, 0.15, 0.3, 0.75, 1] }}
                    onAnimationComplete={() => setWaveAnnouncement(null)}
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                  >
                    <div className="text-center">
                      <div className="text-3xl font-black pixel-text-shadow" style={{ color: 'var(--pixel-orange)', letterSpacing: '4px' }}>
                        {'\u7b2c'} {waveAnnouncement} {'\u6ce2'}
                      </div>
                      <div className="text-sm font-bold mt-1 pixel-text-shadow" style={{ color: 'var(--pixel-orange-light)' }}>
                        {'\u654c\u4eba\u6765\u88ad\uff01'}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 波次详情弹窗 */}
              <AnimatePresence>
                {showWaveDetail && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.7)]"
                    onClick={() => setShowWaveDetail(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 20 }}
                      className="bg-[var(--dungeon-panel-bg)] border-2 border-[var(--dungeon-panel-border)] p-3 max-w-[280px] w-[90%]"
                      style={{ borderRadius: '4px' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="text-[12px] font-bold text-[var(--dungeon-text-bright)] mb-2 text-center pixel-text-shadow">波次详情</div>
                      {game.battleWaves.map((wave, wi) => (
                        <div key={wi} className={`mb-2 p-2 border ${wi === game.currentWaveIndex ? 'border-[var(--pixel-orange)] bg-[rgba(224,120,48,0.1)]' : 'border-[rgba(255,255,255,0.08)]'}`} style={{borderRadius:'3px'}}>
                          <div className="text-[11px] font-bold mb-1" style={{ color: wi === game.currentWaveIndex ? 'var(--pixel-orange)' : 'var(--dungeon-text-dim)' }}>
                            第{wi + 1}波 {wi === game.currentWaveIndex ? '(当前)' : wi < game.currentWaveIndex ? '(已清除)' : ''}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {wave.enemies.map((we, ei) => (
                              <div key={ei} className="flex items-center gap-0.5 px-1 py-0.5 bg-[rgba(255,255,255,0.04)]" style={{borderRadius:'2px'}}>
                                <span className="text-[10px] text-[var(--dungeon-text)]">{we.name}</span>
                                <span className="text-[9px] text-[var(--dungeon-text-dim)]">HP{we.maxHp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="w-full mt-1 py-1 text-[11px] text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] transition-colors" onClick={() => setShowWaveDetail(false)}>关闭</button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="first-person-hands">
                {/* 左手 — 持骰子 */}
                <div className={`hand-left ${dice.some(d => d.rolling) ? 'hand-left-rolling' : handLeftThrow ? 'hand-left-throw' : ''}`}>
                  <svg width="130" height="160" viewBox="0 0 90 110" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))', transform: 'scaleX(-1)' }}>
                    <defs>
                      <linearGradient id="diceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e8eef4" />
                        <stop offset="50%" stopColor="#c8d0d8" />
                        <stop offset="100%" stopColor="#a0aab4" />
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
                    <rect x="22" y="10" width="44" height="44" rx="3" fill="rgba(0,0,0,0.25)" />
                    {/* 骰子主体 */}
                    <rect x="18" y="6" width="44" height="44" rx="3" fill="url(#diceGrad)" stroke="#8899aa" strokeWidth="3" />
                    {/* 骰子顶部高光 */}
                    <rect x="20" y="8" width="40" height="4" rx="1" fill="rgba(255,255,255,0.35)" />
                    {/* 骰子侧面暗部 */}
                    <rect x="18" y="38" width="44" height="12" rx="2" fill="rgba(0,0,0,0.08)" />
                    {/* 骰子面 — 5点梅花型 */}
                    <circle cx="30" cy="18" r="3.5" fill="#3a4050" />
                    <circle cx="50" cy="18" r="3.5" fill="#3a4050" />
                    <circle cx="40" cy="28" r="3.5" fill="#3a4050" />
                    <circle cx="30" cy="38" r="3.5" fill="#3a4050" />
                    <circle cx="50" cy="38" r="3.5" fill="#3a4050" />
                    {/* 骰子外发光 */}
                    <rect x="20" y="8" width="40" height="40" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  </svg>
                </div>
                {/* 右手 — 持附魔匕首 */}
                <div className={`hand-right ${playerEffect === 'attack' ? 'hand-right-attacking' : ''}`}>
                  <svg width="140" height="180" viewBox="0 0 100 130" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))', transform: 'scaleX(-1)' }}>
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

                {/* === 结算演出覆盖层 === */}
                {settlementPhase && settlementData && (
                  <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pointer-events-none" style={{background: 'rgba(0,0,0,0.82)'}}>
                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                      {/* 牌型名称 */}
                      <div className="text-2xl font-bold text-[var(--pixel-gold)] pixel-text-shadow animate-bounce-in"
                        style={{textShadow: '0 0 20px rgba(212,160,48,0.8), 0 2px 4px rgba(0,0,0,0.8)'}}>
                        ◆ {settlementData.bestHand} ◆
                      {settlementData.isSameElement && (
                        <div className="text-sm font-bold text-[var(--pixel-cyan)] mt-1 animate-pulse" style={{textShadow: '0 0 15px rgba(48,216,208,0.9), 0 0 30px rgba(48,216,208,0.5)'}}>
                          元素共鸣 ×2
                        </div>
                      )}
                      </div>
                      
                      {/* 骰子展示区 */}
                      <div className="flex gap-2 mt-2">
                        {settlementData.selectedDice.map((d, i) => (
                          <div key={d.id}
                            className={`relative transition-all duration-300 ${
                              settlementPhase === 'dice' && settlementData.currentEffectIdx >= i
                                ? 'scale-110' : ''
                            } ${getDiceElementClass(d.element, settlementPhase === 'dice' && settlementData.currentEffectIdx >= i, false, false, d.diceDefId)}`}
                            style={{
                              fontSize: '20px', width: '48px', height: '48px',
                              boxShadow: settlementPhase === 'dice' && settlementData.currentEffectIdx >= i
                                ? '0 0 16px rgba(212,160,48,0.7), 0 0 4px rgba(212,160,48,0.4)' : 'none',
                              animationDelay: `${i * 100}ms`,
                            }}>
                            <span className={`${d.element === 'normal' ? 'font-semibold' : 'font-black pixel-text-shadow'}`}>{d.value}</span>
                            {d.element !== 'normal' && (
                              <div className="absolute top-0.5 right-0.5 pointer-events-none">
                                <ElementBadge element={d.element} size={7} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* 计分条 */}
                      <div className="flex items-center gap-3 mt-2 px-4 py-2 bg-[var(--dungeon-panel)] border-2 border-[var(--dungeon-panel-border)]" style={{borderRadius: '4px'}}>
                        <span key={`base-${settlementData.currentBase}`} className="text-[var(--pixel-blue)] font-bold text-lg font-mono animate-mult-pop">
                          {settlementData.currentBase}
                        </span>
                        <span key={`x-${settlementPhase === 'mult' ? 'flash' : 'idle'}`} className={`text-[var(--dungeon-text-dim)] text-lg font-bold ${settlementPhase === 'mult' || settlementPhase === 'effects' || settlementPhase === 'damage' ? 'animate-percent-flash' : ''}`}>×</span>
                        <span key={`mult-${settlementPhase === 'mult' ? 'flash' : 'idle'}`} className={`text-[var(--pixel-red)] font-bold text-lg font-mono ${settlementPhase === 'mult' || settlementPhase === 'effects' || settlementPhase === 'damage' ? 'animate-percent-flash' : 'opacity-50'}`}>
                          {Math.round(settlementData.currentMult * 100)}%
                        </span>
                      </div>
                      
                      {/* 触发效果列表 */}
                      {settlementPhase === 'effects' && settlementData.triggeredEffects.length > 0 && (
                        <div className="flex flex-col items-center gap-1 mt-1">
                          {settlementData.triggeredEffects.map((eff, i) => (
                            <div key={i} className="text-xs px-2 py-1 bg-[var(--pixel-green-dark)] border border-[var(--pixel-green)] text-[var(--pixel-green-light)] animate-fade-in"
                              style={{borderRadius: '2px', animationDelay: `${i * 100}ms`}}>
                              ◆ {eff.name}: {eff.detail}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 最终伤害 */}
                      {settlementPhase === 'damage' && (
                        <div className="mt-2">
                          <span className="text-lg font-bold text-[var(--dungeon-text-dim)]">
                            {settlementData.finalDamage > 0 ? 'DAMAGE' : 'EFFECT'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {expectedOutcome && !game.isEnemyTurn && (
                  <div className="absolute z-[12] bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    {/* 牌型名称 — 大号 + 强发光 */}
                    <motion.div 
                      animate={{ scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      className="px-3 py-1 bg-[rgba(10,10,15,0.92)] border-2 border-[var(--pixel-green)] text-[var(--pixel-green-light)] font-bold text-sm tracking-wider pixel-text-shadow"
                      style={{ borderRadius: '2px', boxShadow: '0 0 8px rgba(60,200,100,0.3), inset 0 0 6px rgba(60,200,100,0.08)' }}
                    >
                      ◆ {expectedOutcome.bestHand} ◆
                      {game.handLevels[expectedOutcome.bestHand] > 1 && (
                        <span className="ml-1 text-xs opacity-70">Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                      )}
                    </motion.div>
                    
                    {/* 效果预览行 — 更大更醒目，点击打开计算详情 */}
                    <div 
                      className="flex items-center gap-2 px-2.5 py-0.5 bg-[rgba(10,10,15,0.88)] border border-[var(--dungeon-panel-highlight)] pointer-events-auto cursor-pointer active:scale-95 transition-transform"
                      onClick={() => setShowCalcModal(true)}
                      style={{ borderRadius: '2px', boxShadow: '0 0 8px rgba(0,0,0,0.5)' }}
                    >
                      {expectedOutcome.damage > 0 && (
                        <motion.span 
                          animate={{ scale: [1, 1.2, 1], textShadow: ['0 0 4px rgba(200,64,60,0.5)', '0 0 12px rgba(200,64,60,0.8)', '0 0 4px rgba(200,64,60,0.5)'] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="flex items-center gap-1 text-[var(--pixel-red-light)] text-sm font-black pixel-text-shadow"
                        >
                          <PixelZap size={2} />{expectedOutcome.damage}
                        </motion.span>
                      )}
                      {expectedOutcome.armor > 0 && (
                        <span className="flex items-center gap-0.5 text-[var(--pixel-blue-light)] text-xs font-bold pixel-text-shadow">
                          <PixelShield size={2} />+{expectedOutcome.armor}
                        </span>
                      )}
                      {expectedOutcome.heal > 0 && (
                        <span className="flex items-center gap-0.5 text-[var(--pixel-green-light)] text-xs font-bold pixel-text-shadow">
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
                          <span key={i} className="flex items-center gap-0.5 text-[var(--pixel-green)] text-[11px] font-bold">
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

              {/* Fullscreen Damage Overlay */}
              <AnimatePresence>
                {showDamageOverlay && (
                  <motion.div
                    key="damage-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,40,40,0.15) 0%, transparent 70%)' }}
                  >
                    {/* Explosion rings */}
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0.8 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="absolute w-32 h-32 rounded-full"
                      style={{ border: '3px solid rgba(255,80,40,0.6)', boxShadow: '0 0 40px rgba(255,80,40,0.4)' }}
                    />
                    <motion.div
                      initial={{ scale: 0.2, opacity: 0.6 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                      className="absolute w-24 h-24 rounded-full"
                      style={{ border: '2px solid rgba(255,200,60,0.5)', boxShadow: '0 0 30px rgba(255,200,60,0.3)' }}
                    />
                    {/* Screen flash */}
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                      style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%)' }}
                    />
                    {/* Main damage number */}
                    <motion.div
                      initial={{ scale: 0.1, opacity: 0 }}
                      animate={{ scale: [0.1, 1.4, 1.0], opacity: [0, 1, 1] }}
                      transition={{ duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }}
                      className="flex flex-col items-center gap-1"
                    >
                      {showDamageOverlay.damage > 0 && (
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], textShadow: ['0 0 30px rgba(255,60,60,0.8)', '0 0 60px rgba(255,60,60,1)', '0 0 30px rgba(255,60,60,0.8)'] }}
                          transition={{ repeat: 2, duration: 0.4 }}
                          className={`font-black pixel-text-shadow ${showDamageOverlay.damage >= 40 ? "text-7xl text-[var(--pixel-gold)]" : showDamageOverlay.damage >= 20 ? "text-6xl text-[var(--pixel-orange)]" : "text-5xl text-[var(--pixel-red)]"}`}
                          style={{ textShadow: showDamageOverlay.damage >= 40 ? '0 0 60px rgba(212,160,48,1), 0 0 120px rgba(212,160,48,0.7), 0 4px 0 rgba(0,0,0,0.5)' : showDamageOverlay.damage >= 20 ? '0 0 50px rgba(224,120,48,0.9), 0 0 100px rgba(224,120,48,0.5), 0 4px 0 rgba(0,0,0,0.5)' : '0 0 40px rgba(255,60,60,0.9), 0 0 80px rgba(255,60,60,0.5), 0 4px 0 rgba(0,0,0,0.5)', letterSpacing: '2px' }}
                        >
                          {showDamageOverlay.damage}
                        </motion.div>
                      )}
                      <div className="flex items-center gap-3">
                        {showDamageOverlay.armor > 0 && (
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-[var(--pixel-blue)] pixel-text-shadow"
                          >
                            +{showDamageOverlay.armor} 护甲
                          </motion.span>
                        )}
                        {showDamageOverlay.heal > 0 && (
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-emerald-400 pixel-text-shadow"
                          >
                            +{showDamageOverlay.heal} 治疗
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                    {/* Particle burst */}
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{
                          x: Math.cos(i * 30 * Math.PI / 180) * (80 + Math.random() * 60),
                          y: Math.sin(i * 30 * Math.PI / 180) * (80 + Math.random() * 60),
                          opacity: 0,
                          scale: 0.3,
                        }}
                        transition={{ duration: 0.8 + Math.random() * 0.4, ease: 'easeOut', delay: 0.05 }}
                        className="absolute w-2 h-2"
                        style={{
                          background: i % 3 === 0 ? 'var(--pixel-red)' : i % 3 === 1 ? 'var(--pixel-orange)' : 'var(--pixel-gold)',
                          borderRadius: '1px',
                          boxShadow: '0 0 6px currentColor',
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>


              {/* 玩家状态行：HP + 状态图标 */}
              <div className="px-3 py-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <motion.div 
                    animate={hpGained ? { scale: [1, 1.1, 1] } : playerEffect === 'attack' ? { y: [0, -6, 0] } : {}}
                    className="flex items-center gap-1"
                  >
                    <PixelHeart size={1} />
                    <span className="font-bold text-[11px] text-[var(--dungeon-text)] pixel-text-shadow">守夜人</span>
                  </motion.div>
                  <span className="ml-auto text-[9px] font-mono font-bold text-[var(--pixel-gold)] tracking-wider px-1.5 py-0.5 bg-[rgba(212,160,48,0.1)] border border-[var(--pixel-gold-dark)]" style={{borderRadius:"2px"}}>R{game.battleTurn}</span>
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
                    <span className="text-[10px] font-mono font-bold text-white pixel-text-shadow">
                      {game.hp}/{game.maxHp} {game.armor > 0 && `[+${game.armor}]`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 骰子操作面板 */}

              {/* 敌人信息弹窗 */}
              <AnimatePresence>
                {enemyInfoTarget && (() => {
                  const infoEnemy = enemies.find(e => e.uid === enemyInfoTarget);
                  if (!infoEnemy) return null;
                  const typeInfo = COMBAT_TYPE_DESC[infoEnemy.combatType] || COMBAT_TYPE_DESC.warrior;
                  const isMelee = infoEnemy.combatType === 'warrior' || infoEnemy.combatType === 'guardian';
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
                      onClick={() => setEnemyInfoTarget(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.85, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.85, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="w-[85vw] max-w-sm pixel-panel p-3 bg-[var(--dungeon-bg)]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{infoEnemy.emoji}</span>
                            <div>
                              <div className="text-sm font-black text-[var(--dungeon-text-bright)] pixel-text-shadow">{infoEnemy.name}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-xs" style={{ color: typeInfo.color }}>{typeInfo.icon} {typeInfo.name}</span>
                                <span className="text-[10px] text-[var(--dungeon-text-dim)]">|</span>
                                <span className="text-[11px] font-mono text-[var(--pixel-red-light)]">{infoEnemy.attackDmg} ATK</span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => setEnemyInfoTarget(null)} className="text-[var(--dungeon-text-dim)] hover:text-white text-sm font-bold"></button>
                        </div>
                        
                        <div className="text-[11px] text-[var(--dungeon-text)] leading-relaxed mb-2 px-1" style={{ borderLeft: '2px solid ' + typeInfo.color, paddingLeft: '6px' }}>
                          {typeInfo.desc}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>
                            <div className="text-[9px] text-[var(--dungeon-text-dim)]">生命</div>
                            <div className="text-[12px] font-mono font-bold text-[var(--pixel-red-light)]">{infoEnemy.hp}/{infoEnemy.maxHp}</div>
                          </div>
                          <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>
                            <div className="text-[9px] text-[var(--dungeon-text-dim)]">护甲</div>
                            <div className="text-[12px] font-mono font-bold text-[var(--pixel-blue-light)]">{infoEnemy.armor}</div>
                          </div>
                          <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>
                            <div className="text-[9px] text-[var(--dungeon-text-dim)]">距离</div>
                            <div className="text-[12px] font-mono font-bold" style={{ color: isMelee && infoEnemy.distance > 0 ? 'var(--pixel-orange)' : 'var(--pixel-green-light)' }}>
                              {infoEnemy.distance === 0 ? '近身' : `距离 ${infoEnemy.distance}`}
                            </div>
                          </div>
                          <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>
                            <div className="text-[9px] text-[var(--dungeon-text-dim)]">行动</div>
                            <div className="text-[12px] font-mono font-bold text-[var(--dungeon-text)]">
                              {isMelee && infoEnemy.distance > 0 ? '逼近中' : '攻击'}
                            </div>
                          </div>
                        </div>
                        
                        {infoEnemy.statuses.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {infoEnemy.statuses.map((s, idx) => (
                              <span key={idx} className="text-[10px] px-1 py-0.5 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)] text-[var(--dungeon-text)]" style={{borderRadius:'2px'}}>
                                {s.type} {s.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              <div className="px-2 pb-1 pt-0.5 border-t-2 border-[var(--dungeon-panel-border)]">

                {/* 骰子库 + 骰子队列流转 + 弃骰库 (对齐) */}
                <div className="flex items-center gap-1 mb-0.5 px-1 mt-1">
                  <DiceBagPanel ownedDice={game.ownedDice.map(d => d.defId)} diceBag={game.diceBag} discardPile={game.discardPile} position="left" />
                  {/* 骰子队列流转缩略图 */}
                   <div className="flex-1 flex gap-px overflow-hidden items-center justify-center relative h-5">
                    {/* Left: Draw pile - only diceBag remaining, highlight next-to-draw */}
                    <div className="flex gap-px items-center justify-end flex-1 overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        {(() => {
                          const bagDice = game.diceBag.map((defId, i) => ({ defId, idx: i }));
                          const drawCount = game.drawCount || 4;
                          const handSize = dice.filter(d => !d.spent).length;
                          const nextDrawCount = Math.max(0, drawCount - handSize);
                          return bagDice.map(({ defId, idx }) => {
                            const isNextDraw = idx < nextDrawCount;
                            return (
                              <motion.div
                                key={defId + "-bag-" + idx}
                                layout
                                initial={shuffleAnimating ? { opacity: 0, x: 60, scale: 0.3 } : { opacity: 0, y: 10, scale: 0.5 }}
                                animate={{
                                  opacity: isNextDraw ? 1 : 0.6,
                                  y: isNextDraw ? -1 : 0,
                                  x: 0,
                                  scale: isNextDraw ? 1.15 : 1,
                                }}
                                exit={{ opacity: 0, scale: 0.3, y: -8 }}
                                transition={shuffleAnimating
                                  ? { type: "spring", stiffness: 200, damping: 20, delay: idx * 0.04 }
                                  : { type: "spring", stiffness: 300, damping: 25 }}
                              >
                                <MiniDice defId={defId} size={14} highlight={isNextDraw} />
                              </motion.div>
                            );
                          });
                        })()}
                      </AnimatePresence>
                      {game.diceBag.length === 0 && !shuffleAnimating && (
                        <span className="text-[7px] text-[var(--dungeon-text-dim)] font-mono italic">empty</span>
                      )}
                    </div>
                    {/* Separator */}
                    <div className="w-px h-4 bg-[var(--dungeon-text-dim)] opacity-40 mx-1 shrink-0" />
                    {/* Right: Discard pile queue */}
                    <div className="flex gap-px items-center justify-start flex-1 overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        {game.discardPile.map((defId, i) => (
                          <motion.div
                            key={defId + "-disc-" + i}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.5 }}
                            animate={shuffleAnimating
                              ? { opacity: 0, x: -60, scale: 0.3, transition: { duration: 0.3, delay: i * 0.03 } }
                              : { opacity: 0.3, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -40, scale: 0.3 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <MiniDice defId={defId} size={14} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {game.discardPile.length === 0 && (
                        <span className="text-[7px] text-[var(--dungeon-text-dim)] font-mono italic">empty</span>
                      )}
                    </div>
                  </div>
                  <DiceBagPanel ownedDice={game.ownedDice.map(d => d.defId)} diceBag={game.diceBag} discardPile={game.discardPile} position="right" />
                </div>

                {/* 骰子行 */}
                <div className="flex justify-center gap-2.5 mb-1.5 min-h-[80px] items-end relative pt-[20px]">
                  {dice.filter(d => !d.spent).map((die) => (
                      <motion.button
                        key={`die-${die.id}`}
                        initial={false}
                        animate={diceDiscardAnim && !die.spent ? {
                          y: -100,
                          x: 80,
                          opacity: 0,
                          scale: 0.3,
                          rotate: 180
                        } : die.rolling ? { 
                          rotate: [0, 90, 180, 270, 360],
                          scale: [1, 1.15, 1, 1.15, 1],
                          y: [0, -10, 0, -8, 0],
                          opacity: 1
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
                        transition={diceDiscardAnim && !die.spent ? { duration: 0.25, ease: 'easeIn' } : die.rolling ? { repeat: Infinity, duration: 0.15, ease: 'linear' } : die.playing ? { duration: 0.4, ease: 'easeOut' } : die.selected ? { duration: 0.12, type: 'spring', stiffness: 500, damping: 25 } : { duration: 0.06, ease: 'easeOut' }}
                        onClick={() => !die.rolling && !game.isEnemyTurn && game.playsLeft > 0 && toggleSelect(die.id)}
                        className={`${getDiceElementClass(
                          isNormalAttackMulti && die.selected && die.element !== 'normal' ? 'normal' : die.element,
                          die.selected, die.rolling, invalidDiceIds.has(die.id),
                          isNormalAttackMulti && die.selected ? undefined : die.diceDefId
                        )} ${die.selected ? 'dice-selected-enhanced' : ''} ${(!die.selected && (game.isEnemyTurn || game.playsLeft <= 0)) ? 'pointer-events-none' : ''}`}
                        style={{ 
                          fontSize: '26px', width: '56px', height: '56px',
                          ...(!die.selected && (game.isEnemyTurn || game.playsLeft <= 0) ? { filter: 'grayscale(0.5) brightness(0.7)', opacity: 0.6 } : invalidDiceIds.has(die.id) && !die.selected ? { filter: 'grayscale(0.4) brightness(0.7)', opacity: 0.65 } : {})
                        }}
                      >
                        <span className={`${(die.element === 'normal' || (isNormalAttackMulti && die.selected)) ? 'font-semibold' : 'font-black pixel-text-shadow'}`}>
                          {die.rolling ? "?" : die.value}
                        </span>
                        {!die.rolling && die.element !== 'normal' && !(isNormalAttackMulti && die.selected) && (
                          <div className="absolute top-0.5 right-0.5 pointer-events-none">
                            <ElementBadge element={die.element} size={8} />
                          </div>
                        )}
                      </motion.button>
                  ))}
                  {dice.every(d => d.spent) && (
                    <div className="text-[var(--dungeon-text-dim)] text-[11px] font-bold py-4">所有骰子已使用</div>
                  )}
                </div>


{/* 选中骰子tips - 固定高度占位，避免布局跳动 */}
                <div className="relative h-[22px] mx-1 mb-0.5">
                  {(() => {
                    const selectedDice = dice.filter(d => d.selected && !d.spent);
                    if (selectedDice.length === 0) return null;
                    const lastSelected = selectedDice[selectedDice.length - 1];
                    const def = getDiceDef(lastSelected.diceDefId);
                    const showAsNormal = isNormalAttackMulti && (def.element !== 'normal' || !!def.onPlay);
                    return (
                      <div className="absolute inset-0 px-2 py-0.5 bg-[rgba(8,11,14,0.85)] border border-[var(--dungeon-panel-border)] overflow-hidden" style={{borderRadius:'2px'}}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-[var(--dungeon-text-bright)]">{showAsNormal ? '普通骰子' : def.name}</span>
                          <span className="text-[9px] text-[var(--dungeon-text-dim)]">[{def.faces.join(',')}]</span>
                          {def.element !== 'normal' && (
                            <span className="text-[9px]" style={{ color: ELEMENT_COLORS[def.element] }}>{ELEMENT_NAMES[def.element]}</span>
                          )}
                          {def.onPlay && (
                            <span className="text-[9px] text-[var(--pixel-orange-light)] ml-1">{getOnPlayDescription(def.onPlay)}</span>
                          )}
                      {showAsNormal && (
                        <span className="text-[9px] text-[var(--pixel-orange)] ml-1">效果已禁用</span>
                      )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 操作按钮行 */}
                <div className="flex gap-1.5 items-center">
                  {/* 重掷按钮 - HP cost escalation with blood effect */}
                  <motion.button
                    disabled={dice.every(d => d.spent || d.selected) || game.isEnemyTurn || dice.some(d => d.playing) || game.playsLeft <= 0 || (!canAffordReroll && currentRerollCost > 0)}
                    onClick={() => {
                      if (game.isEnemyTurn) { addToast('敵人回合中，无法操作'); return; }
                      if (dice.some(d => d.playing)) { addToast('正在出牌中...'); return; }
                      if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }
                      if (dice.every(d => d.spent || d.selected)) { addToast('没有可重掷的骰子'); return; }
                      rerollUnselected();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-10 px-3 ${currentRerollCost <= 0 ? 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]' : currentRerollCost <= 4 ? 'bg-[#4a1a1a] border-[#c04040] text-[#ff8080]' : 'bg-[#5a0a0a] border-[#ff2020] text-[#ff4040]'} disabled:opacity-30 border-3 flex items-center justify-center gap-1.5 transition-all shrink-0 relative overflow-hidden`}
                    style={{borderRadius:'2px', boxShadow: currentRerollCost <= 0 ? '0 0 8px rgba(60,200,100,0.2), inset -2px -2px 0 rgba(0,0,0,0.3)' : `0 0 ${Math.min(16, 6 + currentRerollCost)}px rgba(255,40,40,${Math.min(0.6, 0.2 + currentRerollCost * 0.05)}), inset -2px -2px 0 rgba(0,0,0,0.3)`}}
                  >
                    {/* Blood drip particles when cost > 0 */}
                    {currentRerollCost > 0 && (
                      <>
                        {[...Array(Math.min(6, Math.floor(currentRerollCost / 2) + 2))].map((_, i) => (
                          <span
                            key={i}
                            className="absolute rounded-full animate-pulse"
                            style={{
                              width: `${2 + Math.random() * 2}px`,
                              height: `${2 + Math.random() * 2}px`,
                              backgroundColor: `rgba(255, ${30 + Math.random() * 40}, ${30 + Math.random() * 40}, ${0.4 + Math.random() * 0.4})`,
                              left: `${10 + Math.random() * 80}%`,
                              top: `${10 + Math.random() * 80}%`,
                              animationDelay: `${Math.random() * 2}s`,
                              animationDuration: `${0.8 + Math.random() * 1.2}s`,
                            }}
                          />
                        ))}
                      </>
                    )}
                    <PixelRefresh size={2} />
                    {currentRerollCost <= 0 ? (
                      <span className="text-[11px] font-mono font-bold">FREE</span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold flex items-center gap-0.5">
                        <span>-{currentRerollCost}</span>
                        <PixelHeart size={1.5} />
                      </span>
                    )}
                  </motion.button>
                  
                  {/* 主行动按钮 */}
                  <AnimatePresence mode="wait">
                    {game.isEnemyTurn ? (
                      <motion.div
                        key="enemy-turn"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex-1 py-2.5 bg-[var(--pixel-red-dark)] text-[var(--pixel-red-light)] border-3 border-[var(--pixel-red)] flex items-center justify-center font-bold text-[12px] tracking-[0.1em] battle-action-btn"
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
                        disabled={dice.some(d => d.playing) || game.playsLeft <= 0 || false /* always allow play */}
                        className={`flex-1 py-2.5 ${false /* always allow play */ ? 'bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)]' : 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]'} disabled:opacity-50 border-3 flex items-center justify-center gap-2 font-bold text-[12px] tracking-[0.05em] battle-action-btn`}
                        style={{borderRadius:'2px', boxShadow: currentHands.bestHand !== '普通攻击' ? '0 0 10px rgba(60,200,100,0.25), inset -2px -2px 0 rgba(0,0,0,0.3)' : 'inset -2px -2px 0 rgba(0,0,0,0.3)'}}
                      >
                        <PixelPlay size={2} /> {game.playsLeft > 0 ? (false /* always allow play */ ? '普通攻击' : `出牌: ${currentHands.bestHand}`) : '出牌次数耗尽'}
                      </motion.button>
                    ) : (dice.every(d => d.spent) || game.playsLeft <= 0) ? (
                      <motion.button
                        key="end"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        disabled={true}
                        className="flex-1 py-2.5 bg-[var(--dungeon-panel)] text-[var(--dungeon-text-dim)] border-3 border-[var(--dungeon-panel-border)] font-bold text-[12px] tracking-[0.05em]"
                        style={{borderRadius:'2px'}}
                      >
                        回合结束中...
                      </motion.button>
                    ) : (
                      <motion.button
                        key="endTurn"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onClick={() => endTurn()}
                        disabled={game.isEnemyTurn || dice.some(d => d.playing)}
                        className="flex-1 py-2.5 bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold)] text-[var(--pixel-gold-light)] disabled:opacity-50 border-3 flex items-center justify-center gap-2 font-bold text-[12px] tracking-[0.05em] battle-action-btn"
                        style={{borderRadius:'2px', boxShadow: '0 0 8px rgba(200,168,60,0.2), inset -2px -2px 0 rgba(0,0,0,0.3)'}}
                      >
                        ⏭ 结束回合
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>


              {/* 遗物栏 - 无限遗物icon展示 + 增幅模块 */}
              <div className="px-2 pb-1 pt-1 border-t-2 border-[var(--dungeon-panel-border)]">
                <div className="flex flex-wrap gap-1 items-center min-h-[28px]">
                  {game.relics.length === 0 && game.augments.every(a => !a) && (
                    <div className="flex-1 flex items-center justify-center opacity-30">
                      <span className="text-[8px] text-[var(--dungeon-text-dim)]">暂无遗物</span>
                    </div>
                  )}
                  {game.relics.map((relic, i) => {
                    const isActive = relic.trigger === 'passive' || (relic.trigger === 'on_play' && game.phase === 'battle');
                    const iconMap: Record<string, string> = {
                      blade: '⚔', flag: '⚑', weight: '⚓', pendulum: '☸',
                      grail: '☕', gauge: '≡', prism: '◇', resonator: '☉',
                      diamond: '♦', hourglass: '⌛', fangs: '☠', contract: '✉',
                      recycle: '♻', hand: '✋', eye: '◉', infinity: '∞', bag: '☣',
                    };
                    return (
                      <motion.div
                        key={relic.id + "-r-" + i}
                        animate={isActive ? { scale: [1, 1.15, 1], y: [0, -2, 0] } : { scale: 1 }}
                        transition={isActive ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : { duration: 0.3 }}
                        className={`w-7 h-8 flex flex-col items-center justify-center cursor-pointer border-2 transition-all duration-200 ${
                          isActive
                            ? "border-[var(--pixel-gold)] bg-gradient-to-b from-[rgba(212,160,48,0.35)] to-[rgba(180,120,30,0.15)]"
                            : "bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] hover:border-[var(--dungeon-text-dim)]"
                        }`}
                        style={{ borderRadius: "2px", ...(isActive ? { boxShadow: '0 0 8px rgba(212,160,48,0.5)' } : {}) }}
                        title={`${relic.name}: ${relic.description}`}
                      >
                        <span className={`text-[14px] leading-none ${isActive ? "text-[var(--pixel-gold-light)]" : "text-[var(--dungeon-text-dim)]"}`}>
                          {iconMap[relic.icon] || '✦'}
                        </span>
                        {relic.counter !== undefined && (
                          <span className="text-[6px] font-mono font-bold text-[var(--pixel-orange-light)] leading-none mt-px">
                            {relic.counter}{relic.counterLabel || ''}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                  {game.augments.filter(Boolean).map((aug, i) => {
                    if (!aug) return null;
                    const isActive = activeAugments.some(a => a.id === aug.id);
                    return (
                      <motion.div
                        key={"aug-" + aug.id + "-" + i}
                        onClick={() => setSelectedAugment(aug)}
                        animate={isActive ? { scale: [1, 1.15, 1], y: [0, -2, 0] } : { scale: 1 }}
                        transition={isActive ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : { duration: 0.3 }}
                        className={`w-7 h-8 flex flex-col items-center justify-center cursor-pointer border-2 transition-all duration-200 ${
                          isActive
                            ? "border-[var(--pixel-gold)] bg-gradient-to-b from-[rgba(212,160,48,0.35)] to-[rgba(180,120,30,0.15)]"
                            : "bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] hover:border-[var(--dungeon-text-dim)]"
                        }`}
                        style={{ borderRadius: "2px", ...(isActive ? { boxShadow: '0 0 8px rgba(212,160,48,0.5)' } : {}) }}
                        title={`${aug.name}: ${aug.description}`}
                      >
                        <div className={`shrink-0 ${isActive ? "text-[var(--pixel-gold-light)]" : "text-[var(--dungeon-text-dim)]"}`} style={isActive ? { filter: 'drop-shadow(0 0 3px rgba(212,160,48,0.6))' } : {}}>
                          {getAugmentIcon(aug.condition, 12)}
                        </div>
                        <span className="text-[5px] font-bold leading-none px-0.5 py-px truncate max-w-full" style={{ color: getConditionInfo(aug.condition).color, backgroundColor: getConditionInfo(aug.condition).bgColor, border: `1px solid ${getConditionInfo(aug.condition).borderColor}`, borderRadius: '1px' }}>
                          {getConditionInfo(aug.condition).abbr}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <CollapsibleLog logs={game.logs} />
            </div>

            {/* ===== 弹窗和模态框保持不变 ===== */}

            {/* Hand Types Guide Modal - extracted to HandGuideModal component */}
            <HandGuideModal />

            

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
                      <h3 className="text-[12px] font-bold text-[var(--dungeon-text-bright)] tracking-[0.1em] pixel-text-shadow">◆ 结果计算详情 ◆</h3>
                      <button onClick={() => setShowCalcModal(false)} className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text-bright)]">
                        <PixelClose size={2} />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-[var(--dungeon-text-dim)]">激活牌型</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-[var(--pixel-green)]">{expectedOutcome.bestHand}</span>
                          {game.handLevels[expectedOutcome.bestHand] > 1 && (
                            <span className="text-[10px] bg-[var(--pixel-green-dark)] text-[var(--pixel-green)] px-1 py-0.5 border border-[var(--pixel-green)] font-bold" style={{borderRadius:'2px'}}>Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                          )}
                          <span className="text-[10px] text-[var(--dungeon-text-dim)] font-mono">(基础 {expectedOutcome.baseHandValue} / 倍率 x{expectedOutcome.handMultiplier.toFixed(1)})</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-[var(--dungeon-text-dim)]">选中骰子</span>
                        <div className="flex gap-1">
                          {expectedOutcome.selectedValues.map((v, i) => (
                            <span key={i} className="w-5 h-5 flex items-center justify-center bg-[var(--dungeon-bg)] border border-[var(--dungeon-panel-border)] text-[11px] font-bold text-[var(--dungeon-text-bright)]" style={{borderRadius:'2px'}}>{v}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-[var(--dungeon-text-dim)]">基础点数 (X)</span>
                        <span className="text-[12px] font-bold text-[var(--dungeon-text-bright)]">{expectedOutcome.X}</span>
                      </div>
                      <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-[var(--dungeon-text-dim)]">牌型基础伤害 <span className="text-[10px] opacity-50">({expectedOutcome.baseHandValue} + {expectedOutcome.X}) × {Math.round(expectedOutcome.handMultiplier * 100)}%</span></span>
                          <span className="text-[var(--dungeon-text)]">{expectedOutcome.baseDamage}</span>
                        </div>
                        {expectedOutcome.extraDamage !== 0 && (
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[var(--dungeon-text-dim)]">加成伤害 <span className="text-[10px] opacity-50">× {Math.round(expectedOutcome.multiplier * 100)}%</span></span>
                            <span className="text-[var(--pixel-gold)]">+{expectedOutcome.extraDamage}</span>
                          </div>
                        )}
                        {expectedOutcome.pierceDamage > 0 && (
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[var(--dungeon-text-dim)]">穿透伤害</span>
                            <span className="text-[var(--pixel-purple)]">+{expectedOutcome.pierceDamage}</span>
                          </div>
                        )}
                        
                        {/* Status Modifiers */}
                        {game.statuses.find(s => s.type === 'weak') && (
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[var(--dungeon-text-dim)] flex items-center gap-1">
                              <PixelArrowDown size={1} /> 虚弱修正
                            </span>
                            <span className="text-[var(--dungeon-text-dim)]">x0.75</span>
                          </div>
                        )}
                        {targetEnemy?.statuses.find(s => s.type === 'vulnerable') && (
                          <div className="flex justify-between items-center text-[12px]">
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
                          <div className="text-[11px] font-bold text-[var(--dungeon-text-dim)] tracking-[0.1em]">附加效果</div>
                          <div className="flex flex-wrap gap-2">
                            {expectedOutcome.statusEffects.map((s, i) => {
                              const info = STATUS_INFO[s.type];
                              return (
                                <div key={i} className={`flex items-center gap-1 px-2 py-1 bg-[var(--dungeon-bg)] border border-[var(--dungeon-panel-border)] ${info.color}`} style={{borderRadius:'2px'}}>
                                  {info.icon}
                                  <span className="text-[11px] font-bold">{info.label} +{s.value}</span>
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
              <div className="text-[11px] tracking-[0.15em] text-[var(--pixel-green)] font-bold mb-2">◆ 牌型详情 ◆</div>
              <h3 className="text-xl font-bold text-[var(--dungeon-text-bright)] mb-3 pixel-text-shadow">{selectedHandTypeInfo.name}</h3>
              <p className="text-[var(--dungeon-text)] text-[13px] leading-relaxed mb-6">{formatDescription(selectedHandTypeInfo.description)}</p>
              <button 
                onClick={() => setSelectedHandTypeInfo(null)}
                className="w-full py-3 pixel-btn pixel-btn-ghost text-xs font-bold"
              >
                确认
              </button>
            </motion.div>
          </div>
        )}

        {/* Enemy info modal removed - no more intent system */}
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
                  <div className="text-[var(--dungeon-text-dim)] text-[12px] tracking-[0.1em] mb-3 relative z-10 flex items-center gap-1">
                    <span className="text-[var(--pixel-green)]">{getAugmentIcon(selectedAugment.condition, 12)}</span>
                    触发条件: {
                    selectedAugment.condition === 'high_card' ? '普通攻击' : 
                    selectedAugment.condition === 'pair' ? '对子' :
                    selectedAugment.condition === 'two_pair' ? '连对' :
                    selectedAugment.condition === 'n_of_a_kind' ? 'N条' :
                    selectedAugment.condition === 'full_house' ? '葫芦' :
                    selectedAugment.condition === 'straight' ? '顺子' :
                    selectedAugment.condition === 'same_element' ? '同元素' :
                    selectedAugment.condition === 'element_count' ? '元素计数' : selectedAugment.condition
                  }</div>
                  <div className="text-[var(--dungeon-text)] text-[13px] mb-5 relative z-10">{formatDescription(selectedAugment.description)}</div>
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

      {/* Toasts */}
      <ToastDisplay />

      {/* Replacement Modal */}
      <ReplacementModal />
      </div>
    </div>
      {/* Dice Guide Modal - Global */}
      {/* Global Hand Guide Modal */}
      <HandGuideModal />
</GameContext.Provider>
  );
}
