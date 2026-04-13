/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
// 像素图标组件 — 替代所有 lucide-react 和 emoji
import { 
  PixelHeart, PixelShield, PixelRefresh, PixelPlay, PixelZap,
  PixelSkull, PixelFlame, PixelSword,
  PixelAttackIntent, PixelArrowUp, 
  PixelArrowDown, PixelClose, 
  PixelMagic, PixelPoison, PixelCoin, PixelDice, PixelSoulCrystal,
  PIXEL_ICON_MAP, PixelQuestion, PixelArrowRight
} from './components/PixelIcons';
import { RelicPixelIcon } from './components/PixelRelicIcons';
import { motion, AnimatePresence } from 'motion/react';

// --- Modular Imports ---
import type { Die, StatusEffect, Augment, MapNode, Enemy, LootItem, ShopItem, GameState , Relic } from './types/game';
import { INITIAL_STATS } from './types/game';
import { INITIAL_DICE_BAG, getDiceDef, rollDiceDef, DICE_BY_RARITY, getUpgradedOnPlay, getElementLevelBonus } from './data/dice';
import { drawFromBag, initDiceBag } from './data/diceBag';
import { DiceBagPanel, MiniDice } from './components/DiceBagPanel';
import { ElementBadge, getOnPlayDescription } from './components/PixelDiceShapes';
import { getRelicRewardPool, pickRandomRelics, RELICS_BY_RARITY } from './data/relics';
// augments import removed - unified into relics
import { getEnemiesForNode } from './data/enemies';
import { HAND_TYPES } from './data/handTypes';
import { STATUS_INFO } from './data/statusInfo';
import { playSound, playSettlementTick, playMultiplierTick, playHeavyImpact } from './utils/sound';
import { checkHands, canFormValidHand, findHandCandidates } from './utils/handEvaluator';
import { generateMap } from './utils/mapGenerator';
import { generateChallenge, checkChallenge } from './utils/instakillChallenge';
import { StatusIcon } from './components/StatusIcon';
import { getAugmentIcon, getDiceElementClass, getHpBarClass, ELEMENT_NAMES, ELEMENT_COLORS } from './utils/uiHelpers';
import { formatDescription } from './utils/richText';
import { CSSParticles } from './components/ParticleEffects';
import { isTutorialCompleted } from './components/TutorialOverlay';
import { GameContext } from './contexts/GameContext';
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
import { generateStartingRelicChoices } from './data/skillModules';
import { getConditionInfo } from './components/AugmentCard';
import { CollapsibleLog } from './components/CollapsibleLog';
import { startBGM, stopBGM } from './utils/sound';
import { PixelSprite, hasSpriteData } from './components/PixelSprite';
import { PLAYER_INITIAL, SHOP_CONFIG, LOOT_CONFIG, CHAPTER_CONFIG } from './config';
import { applyDiceSpecialEffects } from './logic/diceEffects';
import { createInitialGameState } from './logic/gameInit';
import { COMBAT_TYPE_DESC } from './logic/battleHelpers';
import { HandGuideModal } from './components/HandGuideModal';
import { DiceGuideModal } from './components/DiceGuideModal';
import { ChapterTransition } from './components/ChapterTransition';
import { SkillSelectScreen } from './components/SkillSelectScreen';
import { ClassSelectScreen } from './components/ClassSelectScreen';
import { ALL_RELICS } from './data/relics';

const META_KEY = 'dicehero_meta';
const loadMeta = () => {
  try { const raw = localStorage.getItem(META_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
};
import { ReplacementModal } from './components/ReplacementModal';
import { ToastDisplay } from './components/ToastDisplay';
import { EnemyQuoteBubble } from './components/EnemyQuoteBubble';
import { NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES } from './config/enemies';
import ForestBattleScene from './components/ForestBattleScene';
import IceBattleScene from './components/IceBattleScene';
import LavaBossScene from './components/LavaBossScene';
import ShadowBattleScene from './components/ShadowBattleScene';
import EternalBossScene from './components/EternalBossScene';
import { BossEntrance } from './components/BossEntrance';



// 遗物描述富文本高亮 — 只高亮触发条件关键词
const RELIC_TRIGGER_PATTERN = /普通攻击|对子|连对|三条|四条|五条|六条|葫芦|顺子|同元素|元素顺|元素葫芦|皇家元素顺|击杀|重Roll|重投|致命伤害|受到伤害/g;

function highlightRelicDesc(desc: string): React.ReactNode {
  if (!desc) return desc;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(RELIC_TRIGGER_PATTERN.source, 'g');
  while ((match = regex.exec(desc)) !== null) {
    if (match.index > lastIndex) {
      parts.push(desc.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} style={{ color: 'var(--pixel-gold)', fontWeight: 700 }}>
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < desc.length) {
    parts.push(desc.slice(lastIndex));
  }
  return parts.length > 1 ? <>{parts}</> : desc;
}

export default function DiceHeroGame() {
  const [game, setGame] = useState<GameState>(createInitialGameState);

  const [showHandGuide, setShowHandGuide] = useState(false);
  const [showDiceGuide, setShowDiceGuide] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [battleTransition, setBattleTransition] = useState<'none' | 'fadeIn' | 'hold' | 'fadeOut'>('none');
  const [bossEntrance, setBossEntrance] = useState<{ visible: boolean; name: string; chapter: number }>({ visible: false, name: '', chapter: 1 });
  const [pendingLootAugment, setPendingLootAugment] = useState<{id: string, options: Augment[] } | null>(null);
  const [showTutorial, setShowTutorial] = useState(!isTutorialCompleted());

  // GM: 杀死当前波次敌人 — 触发死亡动画+波次切换
  const [gmPendingVictory, setGmPendingVictory] = useState(false);
  const [gmPendingNextWave, setGmPendingNextWave] = useState(false);

  useEffect(() => {
    const flag = (game as any).gmKillWave;
    if (flag && game.phase === 'battle') {
      // 清除flag
      setGame(prev => { const { gmKillWave: _, ...rest } = prev as any; return rest; });
      // 触发死亡动画
      const alive = enemies.filter(e => e.hp > 0);
      alive.forEach(e => setEnemyEffectForUid(e.uid, 'death'));
      setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, hp: 0 } : e));
      // 延迟后通过state触发波次切换/胜利
      setTimeout(() => {
        const nextWaveIdx = game.currentWaveIndex + 1;
        if (nextWaveIdx < game.battleWaves.length) {
          setGmPendingNextWave(true);
        } else {
          setGmPendingVictory(true);
        }
      }, 1200);
    }
  }, [(game as any).gmKillWave]);

  // GM: 延迟触发胜利（从新的渲染周期获取最新state）
  useEffect(() => {
    if (gmPendingVictory) {
      setGmPendingVictory(false);
      handleVictory();
    }
  }, [gmPendingVictory]);

  // GM: 延迟触发下一波
  useEffect(() => {
    if (gmPendingNextWave && game.phase === 'battle') {
      setGmPendingNextWave(false);
      const nextWaveIdx = game.currentWaveIndex + 1;
      if (nextWaveIdx >= game.battleWaves.length) { handleVictory(); return; }
      const nextWave = game.battleWaves[nextWaveIdx].enemies;
      const currentNode = game.map.find(n => n.id === game.currentNodeId);
      const isBossWave = currentNode?.type === 'boss' && nextWave.length === 1 && nextWave[0].maxHp > 200;

      const doTransition = async () => {
        if (isBossWave) {
          playSound('boss_appear');
          setBossEntrance({ visible: true, name: nextWave[0].name, chapter: game.chapter });
          await new Promise(r => setTimeout(r, 2200));
          setBossEntrance(prev => ({ ...prev, visible: false }));
          await new Promise(r => setTimeout(r, 300));
        }
        setEnemies(nextWave);
        setEnemyEffects({}); setDyingEnemies(new Set());
        if (isBossWave && nextWave[0]) {
          setEnemyEffectForUid(nextWave[0].uid, 'boss_entrance');
          playSound('boss_laugh');
          await new Promise(r => setTimeout(r, 1300));
          setEnemyEffectForUid(nextWave[0].uid, null);
        }
        setEnemyQuotes({});
        setEnemyQuotedLowHp(new Set());
        setGame(prev => ({ ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: prev.maxPlays, freeRerollsLeft: prev.freeRerollsPerTurn, armor: 0, instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type), instakillCompleted: false, playsThisWave: 0, rerollsThisWave: 0 }));
        setRerollCount(0);
        setWaveAnnouncement(nextWaveIdx + 1);
        addLog(`第 ${nextWaveIdx + 1} 波敌人来袭！`);
        rollAllDice();
      };
      doTransition();
    }
  }, [gmPendingNextWave]);

  // BGM 管理
  useEffect(() => {
    if (game.phase === 'battle') {
      startBGM('battle');
    } else if (game.phase === 'map' || game.phase === 'merchant' || game.phase === 'campfire' || game.phase === 'event' || game.phase === 'diceReward' || game.phase === 'loot' || game.phase === 'skillSelect' || game.phase === 'treasure') {
      startBGM('explore');
    } else if (game.phase === 'start') {
      startBGM('start');
    } else if (game.phase === 'chapterTransition' as any) {
      stopBGM();
    } else if (game.phase === 'gameover' || game.phase === 'victory') {
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
  // 同步追踪每个敌人的出牌次数（避免 React setState 闭包延迟导致魂晶误判）
  const playsPerEnemyRef = useRef<Record<string, number>>({});
  const [_diceDrawAnim, setDiceDrawAnim] = useState(false); // 抽骰子入场动画
  const [diceDiscardAnim, _setDiceDiscardAnim] = useState(false);
  const [shuffleAnimating, setShuffleAnimating] = useState(false); // 洗牌动画状态 // 弃骰子退场动画
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [rerollCount, setRerollCount] = useState(0);
  const targetEnemyUid = game.targetEnemyUid;
  const targetEnemy = (() => {
    return enemies.find(e => e.uid === targetEnemyUid && e.hp > 0) || enemies.find(e => e.hp > 0) || null;
  })();
  const [selectedHandTypeInfo, setSelectedHandTypeInfo] = useState<{ name: string; description: string } | null>(null);

  const [enemyEffects, setEnemyEffects] = useState<Record<string, 'attack' | 'defend' | 'skill' | 'shake' | 'death' | 'speaking' | 'boss_entrance' | null>>({});
  const [_dyingEnemies, setDyingEnemies] = useState<Set<string>>(new Set());
  const setEnemyEffectForUid = (uid: string, effect: 'attack' | 'defend' | 'skill' | 'shake' | 'death' | 'speaking' | 'boss_entrance' | null) => setEnemyEffects(prev => ({ ...prev, [uid]: effect }));

  const [playerEffect, setPlayerEffect] = useState<'attack' | 'defend' | 'flash' | null>(null);
  const [enemyInfoTarget, setEnemyInfoTarget] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [hpGained, setHpGained] = useState(false);
  const [_armorGained, setArmorGained] = useState(false);
  const [rerollFlash, setRerollFlash] = useState(false);

  // === 敌人台词气泡 ===
  const [enemyQuotes, setEnemyQuotes] = useState<Record<string, string>>({});
  const [enemyQuotedLowHp, setEnemyQuotedLowHp] = useState<Set<string>>(new Set());

  /** 显示某个敌人的台词气泡，duration ms 后自动清除 */
  const showEnemyQuote = (uid: string, text: string, duration = 2500) => {
    setEnemyQuotes(prev => ({ ...prev, [uid]: text }));
    setTimeout(() => {
      setEnemyQuotes(prev => {
        const next = { ...prev };
        if (next[uid] === text) delete next[uid];
        return next;
      });
    }, duration);
  };

  /** 从台词数组随机取一条 */
  const pickQuote = (arr?: string[]): string | null => {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  /** 根据敌人 id 查找台词配置 */
  const getEnemyQuotes = (enemyId: string) => {
    const all = [...NORMAL_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];
    return all.find(e => e.id === enemyId)?.quotes;
  };

  /** 敌人行动前摇：说台词+震动+音效，返回是否说了话 */
  const enemyPreAction = async (e: Enemy, quoteType: 'attack' | 'defend' | 'skill' | 'heal') => {
    const q = getEnemyQuotes(e.configId);
    const lines = q?.[quoteType] ?? q?.attack; // fallback到attack台词
    const line = pickQuote(lines ?? []);
    if (line) {
      setEnemyEffectForUid(e.uid, 'speaking');
      showEnemyQuote(e.uid, line, 1800);
      playSound('enemy_speak');
      await new Promise(r => setTimeout(r, 600));
      setEnemyEffectForUid(e.uid, null);
      return true;
    }
    return false;
  };

  // === 结算演出状态 ===
  const [showDamageOverlay, setShowDamageOverlay] = useState<{damage: number, armor: number, heal: number} | null>(null);
  const [settlementPhase, setSettlementPhase] = useState<null | 'hand' | 'dice' | 'mult' | 'effects' | 'bounce' | 'damage'>(null);
  const [flashingRelicIds, setFlashingRelicIds] = useState<string[]>([]);
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null);
  const [showRelicPanel, setShowRelicPanel] = useState(false);
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
    isSameElement?: boolean;
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
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; color: string; icon?: React.ReactNode; target: 'player' | 'enemy'; large?: boolean }[]>([]);
  const [selectedAugment, setSelectedAugment] = useState<Augment | null>(null);
  const [_campfireView, setCampfireView] = useState<'main' | 'upgrade'>('main');
  const [skillTriggerTexts, _setSkillTriggerTexts] = useState<{ id: string; name: string; icon: React.ReactNode; color: string; x: number; delay: number }[]>([]);
  const [handLeftThrow, setHandLeftThrow] = useState(false);
  const [waveAnnouncement, setWaveAnnouncement] = useState<number | null>(null);
  const [showWaveDetail, setShowWaveDetail] = useState(false);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);

  // --- 战前遗物选择 ---
  const [startingRelicChoices, setStartingRelicChoices] = useState<Relic[]>([]);
  const [pendingBattleNode, setPendingBattleNode] = useState<MapNode | null>(null);

  // --- Actions ---

  const addFloatingText = (text: string, color: string = 'text-red-500', icon?: React.ReactNode, target: 'player' | 'enemy' = 'enemy', large = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.random() * 40 - 20;
    const y = Math.random() * 20 - 10;
    setFloatingTexts(prev => [...prev, { id, text, x, y, color, icon, target, large }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, large ? 3500 : 2200);
  };

  const addLog = (msg: string) => {
    setGame(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 15) }));
  };

  const handleSelectStartingRelic = (relic: Relic) => {
    playSound('select');
    const node = pendingBattleNode;
    if (!node) return;

    // 添加遗物到遗物列表
    setGame(prev => ({
      ...prev,
      relics: [...prev.relics, relic],
      hp: Math.max(1, prev.hp - (relic.rarity === 'common' ? 5 : relic.rarity === 'uncommon' ? 10 : 15)),
      maxHp: prev.maxHp - (relic.rarity === 'common' ? 5 : relic.rarity === 'uncommon' ? 10 : 15),
    }));

    addToast(`获得遗物「${relic.name}」!`, 'buff');
    addLog(`战前选择了遗物「${relic.name}」`);

    // 开始战斗
    setPendingBattleNode(null);
    startBattle(node);
  };

  const handleSkipStartingRelic = () => {
    playSound('select');
    const node = pendingBattleNode;
    if (!node) return;
    setPendingBattleNode(null);
    addLog('跳过了战前技能选择，直接进入战斗。');
    startBattle(node);
  };

  const startBattle = async (node: MapNode) => {
    // === 战斗转场 ===
    setBattleTransition('fadeIn');
    await new Promise(r => setTimeout(r, 200)); // 黑幕淡入
    setBattleTransition('hold');

    const waves = (() => {
      const chapterScale = CHAPTER_CONFIG.chapterScaling[Math.min(game.chapter - 1, CHAPTER_CONFIG.chapterScaling.length - 1)];
      return getEnemiesForNode(node, node.depth, game.enemyHpMultiplier * chapterScale.hpMult, chapterScale.dmgMult, game.chapter);
    })();
    const firstWave = waves[0]?.enemies || [];
    setEnemies(firstWave);
    setEnemyEffects({}); setDyingEnemies(new Set());
    // 出场台词
    setEnemyQuotes({});
    setEnemyQuotedLowHp(new Set());
    setTimeout(() => {
      firstWave.forEach((e, idx) => {
        const q = getEnemyQuotes(e.configId);
        const line = pickQuote(q?.enter);
        if (line) {
          setTimeout(() => {
            showEnemyQuote(e.uid, line, 3000);
            playSound('enemy_speak');
            setEnemyEffectForUid(e.uid, 'speaking');
            setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
          }, idx * 400);
        }
      });
    }, 300);
    setPlayerEffect(null);
    // Boss出场音效+演出
    if (node.type === 'boss') {
      playSound('boss_appear');
      // Boss战的wave2才是Boss单独出场，先打小怪(wave1)，所以出场演出在 wave transition 触发
      // 但如果只有1波(直接是boss)，则在这里触发
      if (waves.length === 1) {
        const bossEnemy = firstWave[0];
        if (bossEnemy) {
          setBossEntrance({ visible: true, name: bossEnemy.name, chapter: game.chapter });
          await new Promise(r => setTimeout(r, 2200));
          setBossEntrance(prev => ({ ...prev, visible: false }));
          await new Promise(r => setTimeout(r, 200));
          // 场景内演出：精灵缩放前冲+抖动+笑声
          setEnemyEffectForUid(bossEnemy.uid, 'boss_entrance');
          playSound('boss_laugh');
          await new Promise(r => setTimeout(r, 1300));
          setEnemyEffectForUid(bossEnemy.uid, null);
        }
      }
    }
    playsPerEnemyRef.current = {}; // 重置同步出牌追踪
    const battleChallenge = generateChallenge(node.depth, game.chapter, game.drawCount, node.type);
    setGame(prev => ({ 
      ...prev, 
      phase: 'battle', 
      battleTurn: 1, 
      currentNodeId: node.id, 
      armor: 0, 
      statuses: [],
      playsPerEnemy: {},
      battleWaves: waves,
      currentWaveIndex: 0,
      targetEnemyUid: (firstWave.find(e => e.combatType === 'guardian') || firstWave[0])?.uid || null,
      diceBag: initDiceBag(prev.ownedDice),
      discardPile: [], // 新战斗开始时清空所有状态效果
      freeRerollsLeft: prev.freeRerollsPerTurn + prev.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => sum + (r.effect({}).extraReroll || 0), 0),
      playsLeft: prev.maxPlays + prev.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => sum + (r.effect({}).extraPlay || 0), 0),
      isEnemyTurn: false,
      instakillChallenge: battleChallenge,
      instakillCompleted: false,
      playsThisWave: 0,
      rerollsThisWave: 0,
    }));
    // 直接用新bag抽取（避免闭包旧值问题）
    const freshBag = initDiceBag(game.ownedDice);
    const drawCountBonus = game.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => { const eff = r.effect({}); return sum + (eff.drawCountBonus || 0) + (eff.extraDraw || 0); }, 0);
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
        const elems = ['fire', 'ice', 'thunder', 'poison', 'holy'] as const;
        const randElem = def.isElemental ? elems[Math.floor(Math.random() * elems.length)] : d.element;
        return { ...d, value: rollDiceDef(def), element: randElem as any };
      }));
      if (f === 3) playSound('reroll');
    setGame(prev => ({ ...prev, stats: { ...prev.stats, totalRerolls: prev.stats.totalRerolls + 1 } }));
    }
    setDice(prev => prev.map(d => ({ ...d, rolling: false })));
    // 元素骰子坍缩 + 小丑骰子1-9随机
    setDice(prev => applyDiceSpecialEffects(prev, { hasLimitBreaker: game.relics.some(r => r.id === 'limit_breaker') }));
    playSound('dice_lock');
    await new Promise(r => setTimeout(r, 200));
    setDice(prev => [...prev]);
    addLog(`[骰] ${freshDrawn.map(d => `${d.value}(${ELEMENT_NAMES[d.element]})`).join(' ')}`);

    setRerollCount(0);
    addLog(`遇到 ${firstWave.map(e => e.name).join('、')}！`);

    // === 转场淡出 ===
    setBattleTransition('fadeOut');
    setTimeout(() => setBattleTransition('none'), 300);
  };

  const startNode = (node: MapNode) => {
    playSound('select');
    // --- Relic on_move effects ---
    let moveGoldBonus = 0;
    game.relics.filter(r => r.trigger === 'on_move').forEach(relic => {
      if (relic.id === 'treasure_map_relic' && node.type !== 'treasure') return;
      if (relic.id === 'navigator_compass') {
        // 导航罗盘：计数器模式，每3步积累一次buff
        const compass = game.relics.find(r => r.id === 'navigator_compass');
        const newCounter = ((compass?.counter || 0) + 1);
        const maxC = compass?.maxCounter || 3;
        if (newCounter >= maxC) {
          addToast(`导航罗盘: 3步已满，下次出牌+8伤害+5护甲！`, 'buff');
          setGame(prev => ({
            ...prev,
            relics: prev.relics.map(r => r.id === 'navigator_compass' ? { ...r, counter: 0 } : r),
          }));
        } else {
          setGame(prev => ({
            ...prev,
            relics: prev.relics.map(r => r.id === 'navigator_compass' ? { ...r, counter: newCounter } : r),
          }));
        }
        return;
      }
      const res = relic.effect({});
      if (res.goldBonus) {
        moveGoldBonus += res.goldBonus;
      }
    });
    if (moveGoldBonus > 0) {
      setGame(prev => ({ ...prev, souls: prev.souls + moveGoldBonus, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + moveGoldBonus } }));
      addToast(`移动奖励: +${moveGoldBonus}金币`, 'buff');
    }
    // --- Relic counter: 急救沙漏 CD 减1 ---
    setGame(prev => ({
      ...prev,
      relics: prev.relics.map(r => r.id === 'emergency_hourglass' && (r.counter || 0) > 0 ? { ...r, counter: (r.counter || 0) - 1 } : r),
    }));
    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      if (node.depth === 0) {
        // 第一个节点：战前三选一强化
        const relicChoices = generateStartingRelicChoices(game.relics.map(r => r.id));
        setStartingRelicChoices(relicChoices);
        setPendingBattleNode(node);
        setGame(prev => ({ ...prev, phase: 'skillSelect', currentNodeId: node.id }));
      } else {
        startBattle(node);
      }
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
      // 候选：遗物
      const shuffledRelics = pickRandomRelics([...RELICS_BY_RARITY.common, ...RELICS_BY_RARITY.uncommon, ...RELICS_BY_RARITY.rare], 3, game.relics.map(r => r.id));
      for (const shopRelic of shuffledRelics) {
        candidateItems.push({
          id: 'relic_' + shopRelic.id, type: 'augment' as const, augment: { ...shopRelic, condition: 'passive' as any } as any,
          label: shopRelic.name, desc: shopRelic.description, price: randPrice()
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
      // 始终添加删除骰子选项，价格随机
      const [rmMin, rmMax] = SHOP_CONFIG.priceRange;
      const removeDicePrice = Math.floor(Math.random() * (rmMax - rmMin + 1)) + rmMin;
      shopItems.push({
        id: 'removeDice_fixed', type: 'removeDice' as const,
        label: '骰子净化', desc: '移除一颗骰子，瘦身构筑',
        price: removeDicePrice
      });
      setGame(prev => ({ ...prev, phase: 'merchant', currentNodeId: node.id, shopItems }));
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
    const g = gameRef.current;
    
    // === 法师【星界蓄力】：保留未出牌骰子 ===
    let keptDice: Die[] = [];
    if (g.playerClass === 'mage') {
      keptDice = dice.filter(d => !d.spent); // 保留所有未使用的骰子
      // 蓄力手牌上限：4→5→6
      const chargeStacks = g.chargeStacks || 0;
      const handLimit = Math.min(6, g.drawCount + chargeStacks);
      if (keptDice.length > handLimit) {
        // 超出上限：丢弃多余的（保留最后获得的）
        const excess = keptDice.slice(0, keptDice.length - handLimit);
        keptDice = keptDice.slice(keptDice.length - handLimit);
        // 多余骰子放回弃骰库
        setGame(prev => ({ ...prev, discardPile: [...prev.discardPile, ...excess.map(d => d.diceDefId)] }));
      }
    }
    
    // 非法师或法师无保留时：全部丢弃
    const handDefIds = (g.playerClass === 'mage' ? [] : dice.filter(d => !d.spent)).map(d => d.diceDefId);
    const currentDiscard = [...g.discardPile, ...handDefIds];
    const relicDrawBonus = g.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => { const eff = r.effect({}); return sum + (eff.drawCountBonus || 0) + (eff.extraDraw || 0); }, 0);
    
    // 法师：抽取数量 = 手牌上限 - 已保留数量
    const chargeStacks = g.chargeStacks || 0;
    const handLimit = g.playerClass === 'mage' ? Math.min(6, g.drawCount + chargeStacks) : g.drawCount;
    const count = Math.max(0, handLimit - keptDice.length) + relicDrawBonus;
    
    // 从骰子库抽取（包含刚放回的手牌骰子）
    const { drawn, newBag, newDiscard, shuffled } = drawFromBag(g.diceBag, currentDiscard, count);
    
    // Shuffle notice
    if (shuffled) {
            setShuffleAnimating(true);
            setTimeout(() => setShuffleAnimating(false), 800);
      addToast('\u2728 弃骰库已洗回骰子库!', 'buff');
    }
    
    // 原子更新骰子库状态
    setGame(prev => ({ ...prev, diceBag: newBag, discardPile: newDiscard }));

    // 设置rolling状态（动画）— 法师保留的骰子不rolling
    setDice([...keptDice, ...drawn.map(d => ({ ...d, rolling: true, value: Math.floor(Math.random() * 6) + 1 }))]);

    // 快速翻滚动画 — 8帧，递减速度
    const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
    for (let i = 0; i < frameTimes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[i]));
      setDice(prev => prev.map(d => {
        const def = getDiceDef(d.diceDefId);
        const elems = ['fire', 'ice', 'thunder', 'poison', 'holy'] as const;
        const randElem = def.isElemental ? elems[Math.floor(Math.random() * elems.length)] : d.element;
        return { ...d, value: rollDiceDef(def), element: randElem as any };
      }));
      if (i === 3) playSound('reroll');
    }

    // 落定 — 使用预先抽取的结果
    setDice(prev => prev.map(d => ({ ...d, rolling: false })));
    playSound('dice_lock');
    addLog(`[骰] ${drawn.map(d => `${d.value}(${ELEMENT_NAMES[d.element]})`).join(' ')}`);
  };

  // Calculate reroll HP cost: first N rerolls free, then 2, 4, 8, 16...
  // 非战士职业：超过免费次数后不允许重投（不再卖血）
  const getRerollHpCost = (count: number): number => {
    const extraFreeRerolls = game.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => sum + (r.effect({}).extraReroll || 0), 0);
    const freeCount = (game.freeRerollsPerTurn || 1) + extraFreeRerolls;
    if (count < freeCount) return 0;
    // 非战士无法卖血重投
    if (game.playerClass !== 'warrior') return -1; // -1表示不可用
    const paidIndex = count - freeCount;
    return Math.pow(2, paidIndex + 1); // 2, 4, 8, 16, 32...
  };
  const currentRerollCost = getRerollHpCost(rerollCount);
  const canReroll = currentRerollCost !== -1; // 非战士免费次数用完后不可重投
  const canAffordReroll = canReroll && (currentRerollCost <= 0 || game.hp > currentRerollCost);
  const extraFreeRerollsForDisplay = game.relics.filter(r => r.trigger === 'passive').reduce((sum, r) => sum + (r.effect({}).extraReroll || 0), 0);
  const freeRerollsRemaining = Math.max(0, (game.freeRerollsPerTurn || 1) + extraFreeRerollsForDisplay - rerollCount);

  const rerollSelected = async () => {
    if (game.isEnemyTurn || game.playsLeft <= 0) return;
    
    // 选中的骰子才是要重roll的
    const toReroll = dice.filter(d => d.selected && !d.spent);
    if (toReroll.length === 0) {
      addToast('请先选中要重掷的骰子');
      return;
    }

    // Check HP cost
    let hpCost = getRerollHpCost(rerollCount);
    if (hpCost === -1) {
      addToast('免费重投次数已用完', 'info');
      return;
    }
    // 诅咒骰子：要重roll的骰子中有诅咒骰子时，代价翻倍
    const hasCursedInReroll = toReroll.some(d => getDiceDef(d.diceDefId).isCursed);
    if (hasCursedInReroll) hpCost *= 2;
    if (hpCost > 0 && game.hp <= hpCost) {
      addToast(`生命不足！重掷需要 ${hpCost} HP`, 'damage');
      setRerollFlash(true);
      setTimeout(() => setRerollFlash(false), 500);
      return;
    }

    // Apply HP cost + 战士血怒叠加
    if (hpCost > 0) {
      setGame(prev => {
        let goldBonus = 0;
        prev.relics.filter(r => r.trigger === 'on_reroll').forEach(relic => {
          const res = relic.effect({ hpLostThisTurn: hpCost });
          if (res.goldBonus) goldBonus += res.goldBonus;
        });
        // 战士【血怒战意】：卖血重投次数+1，用于伤害计算
        const newBloodRerolls = (prev.bloodRerollCount || 0) + 1;
        return { ...prev, hp: prev.hp - hpCost, bloodRerollCount: newBloodRerolls, souls: prev.souls + goldBonus, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + goldBonus } };
      });
      addFloatingText(`-${hpCost}`, 'text-red-500', undefined, 'player');
      // 显示血怒加成
      const newCount = (game.bloodRerollCount || 0) + 1;
      addFloatingText(`血怒+${newCount * 15}%`, 'text-orange-400', undefined, 'player');
      const rerollGoldBonus = game.relics.filter(r => r.trigger === 'on_reroll').reduce((sum, relic) => {
        const res = relic.effect({ hpLostThisTurn: hpCost });
        return sum + (res.goldBonus || 0);
      }, 0);
      if (rerollGoldBonus > 0) {
        setTimeout(() => addFloatingText(`+${rerollGoldBonus}`, 'text-yellow-400', <PixelCoin size={2} />, 'player'), 300);
      }
      addLog(`重掷消耗 ${hpCost} HP（血怒+${newCount * 15}%伤害）`);
    }
    
    playSound('roll');
    const rerollIds = new Set(toReroll.map(d => d.id));
    // 先取消选中，让骰子回到正常位置，再开始rolling动画
    setDice(prev => prev.map(d => rerollIds.has(d.id) ? { ...d, selected: false, rolling: true } : d));

    // 快速翻滚动画
    const frameTimes = [30, 40, 50, 60, 80, 100, 120, 150];
    for (let i = 0; i < frameTimes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, frameTimes[i]));
      setDice(prev => prev.map(d => {
        if (!rerollIds.has(d.id)) return d;
        const def = getDiceDef(d.diceDefId);
        const elems = ['fire', 'ice', 'thunder', 'poison', 'holy'] as const;
        const randElem = def.isElemental ? elems[Math.floor(Math.random() * elems.length)] : d.element;
        return { ...d, value: rollDiceDef(def), element: randElem as any };
      }));
    }

    // 落定：将选中骰子弃置，从骰子库抽新的替换
    const rerollDefIds = toReroll.map(d => d.diceDefId);

    setGame(prev => {
      const newDiscard = [...prev.discardPile, ...rerollDefIds];
      const { drawn, newBag, newDiscard: finalDiscard, shuffled } = drawFromBag(prev.diceBag, newDiscard, rerollDefIds.length);
      if (shuffled) {
        setShuffleAnimating(true);
        setTimeout(() => setShuffleAnimating(false), 800);
        addToast(' 弃骰库洗回骰子库', 'info');
      }

      // 使用函数式setDice避免闭包快照问题
      setTimeout(() => {
        setDice(prevDice => {
          let drawIdx = 0;
          const newDice = prevDice.map(d => {
            if (!rerollIds.has(d.id)) return { ...d, rolling: false };
            if (drawIdx < drawn.length) {
              const newDie = drawn[drawIdx];
              drawIdx++;
              return { ...newDie, id: d.id, rolling: false, selected: false };
            }
            return { ...d, rolling: false, selected: false };
          });
          const result = applyDiceSpecialEffects(newDice, { hasLimitBreaker: game.relics.some(r => r.id === 'limit_breaker') });
          addLog(`重掷结果: ${result.filter(nd => rerollIds.has(nd.id)).map(nd => `${nd.value}(${ELEMENT_NAMES[nd.element]})`).join(', ')}`);
          return result;
        });
      }, 0);

      return {
        ...prev,
        diceBag: newBag,
        discardPile: finalDiscard,
      };
    });

    playSound('dice_lock');
    await new Promise(r => setTimeout(r, 200));
    setDice(prev => [...prev].map(d => ({ ...d, rolling: false })));
    setRerollCount(prev => prev + 1);
    // 追踪本波重投次数（洞察弱点用）
    setGame(prev => ({
      ...prev, rerollsThisWave: (prev.rerollsThisWave || 0) + 1
    }));
  };

  // 双击锁定骰子（已弃用 — 现在选中即重roll目标）
  const toggleLock = (_id: number) => {};

  const toggleSelect = (id: number) => {
    const die = dice.find(d => d.id === id);
    if (!die) return;
    if (die.spent) { addToast('该骰子已使用'); return; }
    if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
    if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }
    
    const isCurrentlySelected = die.selected;

    playSound('select');
    setDice(prev => {
      const next = prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d);
      const newSelected = next.filter(d => d.selected && !d.spent);
      
      // === 非战士普攻单选限制 ===
      if (game.playerClass !== 'warrior' && !isCurrentlySelected && newSelected.length > 1) {
        const handResult = checkHands(newSelected, { straightUpgrade: game.relics.some(r => r.id === 'dimension_crush') ? 1 : 0 });
        if (handResult.activeHands.includes('普通攻击') && handResult.activeHands.length === 1) {
          // 非战士多选普攻：禁止，只保留最新选的
          setTimeout(() => addToast('不成牌型时只能选1颗骰子', 'info'), 50);
          return prev.map(d => d.id === id ? { ...d, selected: true } : { ...d, selected: false });
        }
      }
      
      // 战士多选普攻提示
      if (game.playerClass === 'warrior' && !isCurrentlySelected && newSelected.length > 1) {
        const hasSpecial = newSelected.some(d => {
          const def = getDiceDef(d.diceDefId);
          return def.element !== 'normal' || !!def.onPlay;
        });
        if (hasSpecial) {
          const handResult = checkHands(newSelected, { straightUpgrade: game.relics.some(r => r.id === 'dimension_crush') ? 1 : 0 });
          if (handResult.activeHands.includes('普通攻击') && handResult.activeHands.length === 1) {
            setTimeout(() => addToast('多选普通攻击：特殊骰子效果将被禁用！', 'info'), 50);
          }
        }
      }
      return next;
    });
  };

  // 降维打击遗物：顺子所需骰子数-1
  const straightUpgrade = useMemo(() => {
    return game.relics.some(r => r.id === 'dimension_crush') ? 1 : 0;
  }, [game.relics]);

  const currentHands = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    // 分裂骰子：手牌中当普通骰子，结算演出时才分裂
    return checkHands(selected, { straightUpgrade });
  }, [dice, straightUpgrade]);

  // 多选普通攻击检测：选了多颗骰子但不成牌型
  const isNormalAttackMulti = useMemo(() => {
    const selected = dice.filter(d => d.selected && !d.spent);
    return selected.length > 1 && currentHands.activeHands.includes('普通攻击') && currentHands.activeHands.length === 1;
  }, [dice, currentHands]);

  // 牌型提示：哪些骰子可以组成牌型（发光+漂浮）
  const handHintIds = useMemo(() => {
    if (game.phase !== 'battle' || game.isEnemyTurn || game.playsLeft <= 0) return new Set<number>();
    const selected = dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0) {
      // 无选中：全局检测
      return findHandCandidates(dice);
    }
    // 有选中骰子：找能和已选骰子一起组成/增强牌型的未选骰子
    const available = dice.filter(d => !d.spent && !d.rolling && !d.selected);
    const result = new Set<number>();
    for (const other of available) {
      const combo = [...selected, other];
      const hand = checkHands(combo);
      if (hand.activeHands.some(h => h !== '普通攻击')) {
        result.add(other.id);
      }
    }
    return result;
  }, [dice, game.phase, game.isEnemyTurn, game.playsLeft]);

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
    const { bestHand, allHands: _allHands, activeHands } = currentHands;
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
    let holyPurify = 0; // 净化debuff数量（0=不净化）
    let pierceDamage = 0;
    let armorBreak = false;
    let multiplier = 1;
    let goldBonus = 0;
    const triggeredAugments: { name: string, details: string, rawDamage?: number, rawMult?: number, relicId?: string, icon?: string }[] = [];

    activeAugments.forEach(aug => {
      const res = aug.effect(X, selected, aug.level || 1, { rerollsThisTurn: rerollCount, currentHp: game.hp, maxHp: game.maxHp, currentGold: game.souls });
      const details: string[] = [];

      if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
      if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
      if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
      if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率${Math.round(res.multiplier * 100)}%`); }
      if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
      if (res.goldBonus) { goldBonus += res.goldBonus; details.push(`\u91D1\u5E01+${res.goldBonus}`); }
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
        triggeredAugments.push({ name: aug.name, details: details.join(', '), rawDamage: (res.damage || 0) + (res.pierce || 0), rawMult: res.multiplier && res.multiplier !== 1 ? res.multiplier : undefined });
      }
    });

    // --- Relic on_play effects ---
    game.relics.filter(r => r.trigger === 'on_play').forEach(relic => {
      const relicCtx = {
        handType: bestHand,
        diceCount: selected.length,
        diceValues: selected.map(d => d.value),
        diceDefIds: selected.map(d => d.diceDefId),
        pointSum: X,
        loadedDiceCount: selected.filter(d => getDiceDef(d.diceDefId).id === 'heavy').length,
        rerollsThisTurn: rerollCount,
        currentHp: game.hp,
        maxHp: game.maxHp,
        hasSplitDice: selected.some(d => getDiceDef(d.diceDefId).id === 'split'),
        splitDiceValue: selected.find(d => getDiceDef(d.diceDefId).id === 'split')?.value || 0,
        elementsUsedThisBattle: new Set(game.elementsUsedThisBattle || []),
        hasSpecialDice: selected.some(d => !['standard', 'heavy'].includes(getDiceDef(d.diceDefId).id)),
        consecutiveNormalAttacks: game.consecutiveNormalAttacks || 0,
        enemiesKilledThisBattle: game.enemiesKilledThisBattle || 0,
        hpLostThisBattle: game.hpLostThisBattle || 0,
        hpLostThisTurn: game.hpLostThisTurn || 0,
        currentDepth: game.map.find(n => n.id === game.currentNodeId)?.depth || 0,
        floorsCleared: game.relics.find(r => r.id === 'floor_conqueror')?.counter || 0,
      };
      const res = relic.effect(relicCtx);
      const details = [];
      if (res.damage) { extraDamage += res.damage; details.push(`伤害+${res.damage}`); }
      if (res.armor) { extraArmor += res.armor; details.push(`护甲+${res.armor}`); }
      if (res.heal) { extraHeal += res.heal; details.push(`回复+${res.heal}`); }
      if (res.multiplier && res.multiplier !== 1) { multiplier *= res.multiplier; details.push(`倍率${Math.round(res.multiplier * 100)}%`); }
      if (res.pierce) { pierceDamage += res.pierce; details.push(`穿透+${res.pierce}`); }
      if (res.goldBonus) { goldBonus += res.goldBonus; details.push(`金币+${res.goldBonus}`); }
      if (res.goldBonus) { /* toast will be shown in playHand */ }
      // 净化效果：移除玩家负面状态
      if (res.purifyDebuff) {
        holyPurify += (typeof res.purifyDebuff === 'number' ? res.purifyDebuff : 1);
        details.push('净化');
      }
      if (details.length > 0) {
        triggeredAugments.push({ name: relic.name, details: details.join(', '), rawDamage: (res.damage || 0) + (res.pierce || 0), rawMult: res.multiplier && res.multiplier !== 1 ? res.multiplier : undefined, relicId: relic.id, icon: relic.icon });
      }
    });

    // --- Relic rageFireBonus: 怒火燎原累积伤害消费 ---
    if ((game.rageFireBonus || 0) > 0) {
      extraDamage += game.rageFireBonus!;
      triggeredAugments.push({ name: '怒火燎原', details: `伤害+${game.rageFireBonus}`, rawDamage: game.rageFireBonus!, relicId: 'rage_fire_relic', icon: 'blade' });
      setGame(prev => ({ ...prev, rageFireBonus: 0 }));
    }

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
      const diceLevel = game.ownedDice.find(od => od.defId === d.diceDefId)?.level || 1;
      const levelBonus = getElementLevelBonus(diceLevel);
      const totalElementBonus = elementBonus * levelBonus;
      
      // 元素骰子：根据坍缩后的元素产生不同效果
      if (def.isElemental && d.collapsedElement) {
        const diceValue = d.value;
        switch (d.collapsedElement) {
          case 'fire':
            // 火：摧毁敌人所有护甲 + 基于点数的真实伤害 + 点数灼烧
            pierceDamage += Math.floor(diceValue * 2 * totalElementBonus);
            armorBreak = true;
            statusEffects.push({ type: 'burn', value: diceValue });
            break;
          case 'ice':
            // 冰：冻结1回合，点数结算减半
            // 检查目标是否有冰冻免疫
            if (!targetEnemy?.statuses?.some(s => (s.type as string) === 'freeze_immune')) {
              statusEffects.push({ type: 'freeze', value: 1, duration: 1 });
            }
            // 冰元素点数减半已在baseDamage计算前处理
            break;
          case 'thunder':
            // 雷：对其他敌人造成等量穿透伤害（AOE标记）
            pierceDamage += Math.floor(diceValue * 2 * totalElementBonus);
            break;
          case 'poison':
            // 毒：叠加毒层，跨回合持续掉血
            const poisonStacks = Math.floor((diceValue + 2) * totalElementBonus);
            const existingPoison = statusEffects.find(es => es.type === 'poison');
            if (existingPoison) existingPoison.value += poisonStacks;
            else statusEffects.push({ type: 'poison', value: poisonStacks });
            break;
          case 'holy':
            // 圣光：恢复等同点数的生命值
            extraHeal += Math.floor(diceValue * elementBonus);
            // 标记需要圣光净化（副作用延迟到 playHand 中执行）
            holyPurify += 1;
            break;
        }
        return; // 元素骰子不走普通onPlay
      }
      
      // 碎裂骰子：反噬伤害
      if (def.onPlay?.selfDamage) {
        extraHeal -= def.onPlay.selfDamage; // 负回血 = 自伤
      }
      
      if (!def.onPlay) return;
      const upgradedOp = getUpgradedOnPlay(def, diceLevel);
      const op = upgradedOp || def.onPlay;
      // 深度缩放：根据战斗阶段提升骰子onPlay效果（每3层+15%基础伤害，每5层+0.05倍率）
      const depthDmgBonus = 1 + Math.floor((game.depth || 0) / 3) * 0.15;
      const depthMultBonus = Math.floor((game.depth || 0) / 5) * 0.05;
      if (op.bonusDamage) extraDamage += Math.floor(op.bonusDamage * elementBonus * depthDmgBonus);
      if (op.bonusMult) multiplier *= (1 + (op.bonusMult - 1 + depthMultBonus) * elementBonus);
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

    const totalDamage = Math.floor(baseDamage * multiplier) + extraDamage + pierceDamage;

    // Apply status modifiers
    let modifiedDamage = totalDamage;
    const playerWeak = game.statuses.find(s => s.type === 'weak');
    if (playerWeak) modifiedDamage = Math.floor(modifiedDamage * 0.75);
    
    const enemyVulnerable = targetEnemy?.statuses.find(s => s.type === 'vulnerable');
    if (enemyVulnerable) modifiedDamage = Math.floor(modifiedDamage * 1.5);

    // === 职业伤害加成 ===
    // 战士【血怒战意】：每次卖血重投+15%伤害
    if (game.playerClass === 'warrior' && (game.bloodRerollCount || 0) > 0) {
      modifiedDamage = Math.floor(modifiedDamage * (1 + (game.bloodRerollCount || 0) * 0.15));
    }
    // 战士【狂暴】：血量<30%时伤害×1.3
    if (game.playerClass === 'warrior' && game.hp < game.maxHp * 0.3) {
      modifiedDamage = Math.floor(modifiedDamage * 1.3);
    }
    // 盗贼【连击加成】：第2次出牌×1.2
    if (game.playerClass === 'rogue' && (game.comboCount || 0) >= 1) {
      modifiedDamage = Math.floor(modifiedDamage * 1.2);
    }

    return {
      damage: modifiedDamage,
      armor: Math.floor(baseArmor + extraArmor),
      heal: extraHeal,
      baseDamage,
      baseHandValue,
      handMultiplier,
      extraDamage: modifiedDamage - baseDamage - pierceDamage,
      pierceDamage,
      armorBreak,
      multiplier,
      triggeredAugments,
      bestHand,
      statusEffects,
      X,
      selectedValues: selected.map(d => d.value),
      goldBonus,
      holyPurify,
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
    const hasThunderDice = selected.some(d => d.element === 'thunder');
    if (hasDiceAoe || hasThunderDice) return true;
      if (currentHands.activeHands.some(h => ['顺子', '4顺', '5顺', '6顺'].includes(h))) return true;
    const { activeHands } = currentHands;
    if (activeHands.some(h => h.includes('元素') || h.includes('皇家'))) return true;
    return false;
  }, [dice, expectedOutcome, currentHands]);

  const playHand = async () => {
    playSound('select');
    const selected = dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0) { addToast('请先选择骰子'); return; }
    if (enemies.length === 0 || !targetEnemy) return;
    if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
    if (dice.some(d => d.playing)) { addToast('正在出牌中...'); return; }
    if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }

    // 追踪对每个敌人的出牌次数（用于首次秒杀魂晶判定）
    // 使用 ref 同步读写，避免 React setState 闭包延迟
    const targetUidForTracking = targetEnemy.uid;
    const playsBefore = playsPerEnemyRef.current[targetUidForTracking] || 0;
    playsPerEnemyRef.current = { ...playsPerEnemyRef.current, [targetUidForTracking]: playsBefore + 1 };
    
    // === 盗贼连击终结判定 ===
    const currentCombo = game.comboCount || 0;
    const lastHandType = game.lastPlayHandType;
    const thisHandType = currentHands.bestHand;
    // 连击终结：两次不同牌型（不含普通攻击）+25%
    let comboFinisherBonus = 0;
    if (game.playerClass === 'rogue' && currentCombo >= 1 && lastHandType && lastHandType !== thisHandType && lastHandType !== '普通攻击' && thisHandType !== '普通攻击') {
      comboFinisherBonus = 0.25;
    }

    setGame(prev => ({
      ...prev,
      playsLeft: prev.playsLeft - 1,
      playsPerEnemy: { ...playsPerEnemyRef.current },
      // 盗贼连击追踪
      comboCount: (prev.comboCount || 0) + 1,
      lastPlayHandType: thisHandType,
    }));

    const outcome = expectedOutcome;
    if (!outcome) return;
    // --- Apply goldBonus from augments/relics (only on actual play, not preview) ---
    if (outcome.goldBonus && outcome.goldBonus > 0) {
      setGame(prev => ({ ...prev, souls: prev.souls + outcome.goldBonus, stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + outcome.goldBonus } }));
      addFloatingText(`+${outcome.goldBonus}`, 'text-yellow-400', <PixelCoin size={2} />, 'player');
    }

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
    setShowRelicPanel(true); // 结算时展开遗物面板
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
      isSameElement: currentHands.activeHands.some(h => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h)),
    });
    playSound('augment_activate');
    await new Promise(r => setTimeout(r, 600));

    // ========================================
    // Phase 2: 逐颗骰子计分 (每颗0.3s) — 分裂骰子在此阶段弹出
    // ========================================
    setSettlementPhase('dice');
    let runningBase = outcome.baseHandValue;
    let settleDice = [...selected]; // 实际参与结算的骰子列表
    let splitOccurred = false;
    for (let i = 0; i < settleDice.length; i++) {
      runningBase += settleDice[i].value;
      const currentRunning = runningBase;
      setSettlementData(prev => prev ? { ...prev, currentBase: currentRunning, currentEffectIdx: i, selectedDice: [...settleDice] } : prev);
      playSettlementTick(i);
      await new Promise(r => setTimeout(r, 280));

      // 分裂骰子：播放到它时额外弹出一颗随机点数骰子
      if (settleDice[i].diceDefId === 'split') {
        const splitFaces = [1, 2, 3, 4, 5, 6];
        const splitValue = splitFaces[Math.floor(Math.random() * splitFaces.length)]; // 复制相同点数
        const splitDie: Die = {
          id: settleDice[i].id + 9000,
          diceDefId: 'standard',
          value: splitValue,
          element: 'normal',
          selected: true,
          spent: false,
          rolling: false,
        };
        // 插入到当前位置之后
        settleDice.splice(i + 1, 0, splitDie);
        splitOccurred = true;
        playSound('augment_activate');
        // 更新显示 — 新骰子弹出，同时把新骰子的值也加入计分并点亮
        runningBase += splitValue;
        const splitRunning = runningBase;
        i++; // 跳过新插入的骰子，避免循环重复处理
        setSettlementData(prev => prev ? { ...prev, selectedDice: [...settleDice], currentBase: splitRunning, currentEffectIdx: i } : prev);
        await new Promise(r => setTimeout(r, 400));
        addLog(`分裂骰子分裂！额外弹出点数 ${splitValue}`);
        addToast(`分裂! 弹出点数 ${splitValue}`, 'buff');
      }
    }

    // 如果发生了分裂，重新计算牌型和伤害

    // 磁吸骰子：随机同化一颗同伴骰子的点数为自身点数（已被影响的不再重复）
    let magnetOccurred = false;
    const magnetizedIds = new Set<number>(); // 已被磁吸影响的骰子ID
    for (let i = 0; i < settleDice.length; i++) {
      if (settleDice[i].diceDefId === 'magnet' && settleDice.length > 1) {
        const magnetValue = settleDice[i].value;
        // 找到所有非磁吸且未被磁吸过的同伴骰子
        const targets = settleDice.filter((d, idx) => idx !== i && d.diceDefId !== 'magnet' && !magnetizedIds.has(d.id));
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          const oldValue = target.value;
          target.value = magnetValue;
          magnetizedIds.add(target.id);
          magnetOccurred = true;
          playSound('augment_activate');
          setSettlementData(prev => prev ? { ...prev, selectedDice: [...settleDice] } : prev);
          await new Promise(r => setTimeout(r, 400));
          const targetDef = getDiceDef(target.diceDefId);
          addLog(`磁吸骰子同化！${targetDef.name}的点数 ${oldValue} → ${magnetValue}`);
          addToast(`?? ${targetDef.name} ${oldValue}→${magnetValue}`, 'buff');
        }
      }
    }

    // 如果发生了磁吸，也需要重新计算牌型和伤害（和分裂一样的逻辑）
    if (magnetOccurred && !splitOccurred) {
      const newHandResult = checkHands(settleDice, { straightUpgrade });
      const newBestHand = newHandResult.bestHand;
      if (newBestHand !== outcome.bestHand) {
        addLog(`磁吸改变了牌型！${outcome.bestHand} → ${newBestHand}`);
        addToast(` 牌型变化: ${outcome.bestHand} → ${newBestHand}`, newBestHand === '普通攻击' ? 'damage' : 'buff');
        playSound(newBestHand === '普通攻击' ? 'hit' : 'augment_activate');
      }
      const newX = settleDice.reduce((sum, d) => sum + d.value, 0);
      let newHandMult = 1;
      newHandResult.activeHands.forEach(handName => {
        const handDef = HAND_TYPES.find(h => h.name === handName);
        if (handDef) {
          const level = game.handLevels[handName] || 1;
          const levelBonusMult = (level - 1) * 0.3;
          newHandMult += (((handDef as any).mult || 1) - 1) + levelBonusMult;
        }
      });
      const newBaseDamage = Math.floor(newX * newHandMult);
      const newTotalDamage = Math.floor((newBaseDamage + (outcome.damage - Math.floor(outcome.X * outcome.handMultiplier))) * outcome.multiplier) + outcome.pierceDamage;
      outcome.damage = Math.max(0, newTotalDamage);
      outcome.bestHand = newBestHand;
      outcome.X = newX;
      outcome.handMultiplier = newHandMult;
      runningBase = 0;
      settleDice.forEach(d => runningBase += d.value);
      runningBase += outcome.baseHandValue;
      setSettlementData(prev => prev ? {
        ...prev,
        bestHand: newBestHand,
        selectedDice: [...settleDice],
        currentBase: runningBase,
        currentMult: newHandMult,
        finalDamage: outcome.damage,
      } : prev);
      await new Promise(r => setTimeout(r, 500));
    }
    if (splitOccurred) {
      const newHandResult = checkHands(settleDice, { straightUpgrade });
      const newBestHand = newHandResult.bestHand;
      if (newBestHand !== outcome.bestHand) {
        addLog(`分裂改变了牌型！${outcome.bestHand} → ${newBestHand}`);
        addToast(` 牌型变化: ${outcome.bestHand} → ${newBestHand}`, newBestHand === '普通攻击' ? 'damage' : 'buff');
        playSound(newBestHand === '普通攻击' ? 'hit' : 'augment_activate');
      }
      // 重新计算伤害（用新的骰子列表和牌型）
      const newX = settleDice.reduce((sum, d) => sum + d.value, 0);
      let newHandMult = 1;
      newHandResult.activeHands.forEach(handName => {
        const handDef = HAND_TYPES.find(h => h.name === handName);
        if (handDef) {
          const level = game.handLevels[handName] || 1;
          const levelBonusMult = (level - 1) * 0.3;
          newHandMult += (((handDef as any).mult || 1) - 1) + levelBonusMult;
        }
      });
      const newBaseDamage = Math.floor(newX * newHandMult);
      const newTotalDamage = Math.floor((newBaseDamage + (outcome.damage - Math.floor(outcome.X * outcome.handMultiplier))) * outcome.multiplier) + outcome.pierceDamage;
      // 更新 outcome 的伤害值（用闭包变量）
      outcome.damage = Math.max(0, newTotalDamage);
      outcome.bestHand = newBestHand;
      outcome.X = newX;
      outcome.handMultiplier = newHandMult;
      runningBase = 0;
      settleDice.forEach(d => runningBase += d.value);
      runningBase += outcome.baseHandValue;
      setSettlementData(prev => prev ? {
        ...prev,
        bestHand: newBestHand,
        selectedDice: [...settleDice],
        currentBase: runningBase,
        currentMult: newHandMult,
        finalDamage: outcome.damage,
      } : prev);
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 200));

    // Phase 2.5: 倍率强调动画 (0.5s)
    // ========================================
    setSettlementPhase('mult');
    playMultiplierTick(0);
    await new Promise(r => setTimeout(r, 500));


    // ========================================
    // Phase 3: 特殊效果触发 (每个0.4s)
    // ========================================
    setSettlementPhase('effects');
    
    // 收集所有触发效果
    const allEffects: { name: string; detail: string; type: 'damage' | 'mult' | 'status' | 'heal' | 'armor'; rawValue?: number; rawMult?: number; relicId?: string; icon?: string }[] = [];
    
    // 骰子onPlay效果
    const skipOnPlaySettlement = selected.length > 1 && currentHands.activeHands.includes('普通攻击') && currentHands.activeHands.length === 1;
    selected.forEach(d => {
      const def = getDiceDef(d.diceDefId);
      if (skipOnPlaySettlement || !def.onPlay) return;
      const diceLevel = game.ownedDice.find(od => od.defId === d.diceDefId)?.level || 1;
      const op = getUpgradedOnPlay(def, diceLevel) || def.onPlay;
      if (op.bonusDamage) allEffects.push({ name: def.name, rawValue: op.bonusDamage, detail: `伤害+${op.bonusDamage}`, type: 'damage' });
      if (op.bonusMult) allEffects.push({ name: def.name, rawMult: op.bonusMult, detail: `倍率${Math.round(op.bonusMult * 100)}%`, type: 'mult' });
      if (op.heal) allEffects.push({ name: def.name, detail: `回复${op.heal}HP`, type: 'heal' });
      if (op.pierce) allEffects.push({ name: def.name, rawValue: op.pierce, detail: `穿透+${op.pierce}`, type: 'damage' });
      if (op.statusToEnemy) {
        const info = STATUS_INFO[op.statusToEnemy.type];
        allEffects.push({ name: def.name, detail: `${info.label}+${op.statusToEnemy.value}`, type: 'status' });
      }
    });
    
    // 遗物效果
    outcome.triggeredAugments.forEach(aug => {
      allEffects.push({ name: aug.name, detail: aug.details, type: aug.rawMult ? 'mult' : 'damage', rawValue: aug.rawDamage || undefined, rawMult: aug.rawMult || undefined, relicId: aug.relicId, icon: aug.icon });
    });
    
    // 逐个展示效果
    for (let i = 0; i < allEffects.length; i++) {
      setSettlementData(prev => prev ? {
        ...prev,
        triggeredEffects: allEffects.slice(0, i + 1),
        // 动态更新基础值和倍率显示
        ...(allEffects[i].rawValue ? { currentBase: (prev?.currentBase || 0) + allEffects[i].rawValue } : {}),
        ...(allEffects[i].rawMult ? { currentMult: (prev?.currentMult || 1) * allEffects[i].rawMult } : {}),
        currentEffectIdx: i,
      } : prev);
      playMultiplierTick(i + 1);
      // 遗物icon刷光
      if (allEffects[i].relicId) {
        setFlashingRelicIds(prev => [...prev, allEffects[i].relicId!]);
        setTimeout(() => setFlashingRelicIds(prev => prev.filter(id => id !== allEffects[i].relicId)), 800);
      }
      await new Promise(r => setTimeout(r, 350));
    }
    if (allEffects.length > 0) await new Promise(r => setTimeout(r, 200));

    // 结算演出Q弹定格动画
    setSettlementPhase('bounce');
    await new Promise(r => setTimeout(r, 500));

    // ========================================
    // Phase 4: 最终伤害飞出 (0.8s)
    // ========================================
    setSettlementPhase('damage');
    // 卡肉顿帧：大伤害时冻结画面+重击音效+强烈震动
    const maxEnemyHp = enemies.reduce((max, e) => Math.max(max, e.maxHp || e.hp), 1);
    const damageRatio = outcome.damage / maxEnemyHp;
    const isHeavyHit = damageRatio >= 0.5 || outcome.damage >= 60;
    const isMassiveHit = damageRatio >= 1.0 || outcome.damage >= 120;

    if (isMassiveHit) {
      // 毁灭级：重击音效 + 长顿帧 + 强震
      playHeavyImpact(1.0);
      setScreenShake(true);
      await new Promise(r => setTimeout(r, 150)); // 卡肉冻结
      playSound('critical');
      setTimeout(() => playSound('critical'), 120);
      setTimeout(() => playSound('critical'), 250);
    } else if (isHeavyHit) {
      // 重击：双重暴击 + 中等顿帧
      playHeavyImpact(0.6);
      setScreenShake(true);
      await new Promise(r => setTimeout(r, 100)); // 卡肉冻结
      playSound('critical');
      setTimeout(() => playSound('critical'), 150);
    } else if (outcome.damage >= 20) {
      playSound('critical');
      setScreenShake(true);
    } else if (outcome.damage > 0) {
      playSound('hit');
      setScreenShake(true);
    }
    setShowDamageOverlay({ damage: outcome.damage, armor: outcome.armor, heal: outcome.heal || 0 });
    setTimeout(() => setShowDamageOverlay(null), isMassiveHit ? 2500 : 1800);
    setTimeout(() => setScreenShake(false), isMassiveHit ? 500 : isHeavyHit ? 400 : 300);
    
    await new Promise(r => setTimeout(r, isMassiveHit ? 1200 : isHeavyHit ? 1000 : 800));

    // ========================================
    // 清理结算演出，应用实际效果
    // ========================================
    setSettlementPhase(null);
    setSettlementData(null);
    setShowRelicPanel(false); // 结算结束关闭遗物面板

    // --- Apply damage to enemy (with AOE support) ---
    const targetUid = targetEnemy.uid;
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
          setEnemyEffectForUid(e.uid, 'death'); playSound('enemy_death');
          const dq2 = getEnemyQuotes(e.configId);
          const dl2 = pickQuote(dq2?.death);
          if (dl2) showEnemyQuote(e.uid, dl2, 2000);
        }
        return { ...e, hp: newHp, armor: arm, statuses: newStatuses };
      }));
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
      if (finalEnemyHp <= 0) {
      setEnemyEffectForUid(targetUid, 'death'); playSound('enemy_death');
      const dq = getEnemyQuotes(targetEnemy.configId);
      const dl = pickQuote(dq?.death);
      if (dl) showEnemyQuote(targetUid, dl, 2000);
    } else if (finalEnemyHp / targetEnemy.maxHp < 0.3 && !enemyQuotedLowHp.has(targetUid)) {
        const lqc = getEnemyQuotes(targetEnemy.configId);
        const ll = pickQuote(lqc?.lowHp);
        if (ll) {
          showEnemyQuote(targetUid, ll, 3000);
          playSound('enemy_speak');
          setEnemyEffectForUid(targetUid, 'speaking');
          setTimeout(() => setEnemyEffectForUid(targetUid, null), 400);
          setEnemyQuotedLowHp(prev => new Set([...prev, targetUid]));
        }
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
        return { ...e, hp: Math.max(0, finalEnemyHp), armor: enemyArmor, statuses: newStatuses };
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


    // Track kills for war_profiteer_relic
    const killCount = enemies.filter(e => e.hp <= 0).length;
    if (killCount > 0) {
      setGame(prev => ({ ...prev, enemiesKilledThisBattle: (prev.enemiesKilledThisBattle || 0) + killCount }));
    }
    // on_kill 遗物效果：检查是否有敌人被击杀
    // Pre-compute killed enemies data synchronously (avoid stale closure)
    const killedEnemiesData: Array<{uid: string, overkill: number}> = [];
    if (hasAoe) {
      enemies.filter(e => e.hp > 0).forEach(e => {
        let dmg = outcome.damage;
        let arm = e.armor;
        if (outcome.armorBreak) { arm = 0; }
        if (arm > 0) { dmg = Math.max(0, dmg - arm); }
        const newHp = e.hp - dmg;
        if (newHp <= 0) { killedEnemiesData.push({ uid: e.uid, overkill: Math.abs(newHp) }); }
      });
    } else {
      if (finalEnemyHp <= 0) {
        killedEnemiesData.push({ uid: targetUid, overkill: Math.abs(finalEnemyHp) });
      }
    }
    // === 洞察弱点检测（使用结算演出后的最终数据） ===
    const finalHandResult = checkHands(settleDice, { straightUpgrade });
    const totalDiceInHand = dice.filter(d => !d.spent).length;
    setGame(prev => {
      const newPlaysWave = (prev.playsThisWave || 0) + 1;
      let challenge = prev.instakillChallenge;
      if (challenge && !challenge.completed) {
        challenge = checkChallenge(challenge, {
          selectedDice: settleDice,
          activeHands: finalHandResult.activeHands,
          pointSum: outcome.X,
          rerollsUsedSinceLastPlay: prev.rerollsThisWave || 0,
          totalDiceInHand: totalDiceInHand,
          ownedDiceTypes: [...new Set(prev.ownedDice.map(d => d.defId))],
          killedThisPlay: killedEnemiesData.length,
        });
      }
      return { ...prev, playsThisWave: newPlaysWave, instakillChallenge: challenge, rerollsThisWave: 0 };
    });

    // 洞察弱点进度提示（在state更新后检测）
    setTimeout(() => {
      const g = gameRef.current;
      const ch = g.instakillChallenge;
      if (ch && !ch.completed && ch.progress && ch.progress > 0 && ch.value && ch.value > 0) {
        addFloatingText(`◆ ${ch.progress}/${ch.value}`, 'text-[var(--pixel-gold)]', undefined, 'enemy');
        playSound('coin');
        // 敌人受击反馈：轻微震动
        enemies.filter(e => e.hp > 0).forEach(e => {
          setEnemyEffectForUid(e.uid, 'shake');
          setTimeout(() => setEnemyEffectForUid(e.uid, null), 300);
        });
      }
    }, 400);

    // 检测挑战达成 → 触发战斗援助效果
    setTimeout(() => {
      const currentChallenge = gameRef.current.instakillChallenge;
      if (currentChallenge?.completed && !gameRef.current.instakillCompleted) {
        setGame(prev => ({ ...prev, instakillCompleted: true }));
        playSound('critical');
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 600);

        // 随机选择一种援助效果
        const g = gameRef.current;
        const currentNode = g.map.find(n => n.id === g.currentNodeId);
        const depth = currentNode?.depth || 0;
        const chapter = g.chapter;
        const isBoss = currentNode?.type === 'boss';

        const aidRoll = Math.random();
        if (aidRoll < 0.2) {
          // 效果1：对全场敌人造成大量伤害（基于敌人最大HP的百分比）
          const pct = isBoss ? 0.3 : 0.5;
          const dmgText = `${Math.round(pct * 100)}%`;
          addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
          addToast(`◆ 洞察弱点！全场敌人受到${dmgText}最大生命值伤害`, 'buff');
          addLog(`洞察弱点达成！全场敌人受到${dmgText}最大HP伤害`);
          setTimeout(() => {
            setEnemies(prev => prev.map(e => {
              if (e.hp <= 0) return e;
              const dmg = Math.floor(e.maxHp * pct);
              const newHp = Math.max(1, e.hp - dmg);
              return { ...e, hp: newHp };
            }));
            enemies.filter(e => e.hp > 0).forEach(e => {
              addFloatingText(`-${Math.floor(e.maxHp * pct)}`, 'text-red-500', <PixelHeart size={2} />, 'enemy');
              setEnemyEffectForUid(e.uid, 'hit');
            });
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 300);
          }, 800);
        } else if (aidRoll < 0.4) {
          // 效果2：全场敌人HP降至N%
          const targetPct = isBoss ? 0.5 : 0.35;
          const pctText = `${Math.round(targetPct * 100)}%`;
          addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
          addToast(`◆ 洞察弱点！全场敌人血量降至${pctText}`, 'buff');
          addLog(`洞察弱点达成！全场敌人血量降至${pctText}`);
          setTimeout(() => {
            setEnemies(prev => prev.map(e => {
              if (e.hp <= 0) return e;
              const cap = Math.floor(e.maxHp * targetPct);
              if (e.hp <= cap) return e;
              return { ...e, hp: cap };
            }));
            enemies.filter(e => e.hp > 0).forEach(e => {
              setEnemyEffectForUid(e.uid, 'hit');
            });
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 300);
          }, 800);
        } else if (aidRoll < 0.6) {
          // 效果3：全场敌人施加大量灼烧+中毒
          const stacks = 3 + depth + (chapter - 1) * 2;
          addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
          addToast(`◆ 洞察弱点！全场敌人获得${stacks}层灼烧+${stacks}层中毒`, 'buff');
          addLog(`洞察弱点达成！全场敌人获得${stacks}层灼烧和中毒`);
          setTimeout(() => {
            setEnemies(prev => prev.map(e => {
              if (e.hp <= 0) return e;
              const newStatuses = [...(e.statuses || [])];
              const burnIdx = newStatuses.findIndex(s => s.type === 'burn');
              if (burnIdx >= 0) newStatuses[burnIdx] = { ...newStatuses[burnIdx], stacks: newStatuses[burnIdx].stacks + stacks };
              else newStatuses.push({ type: 'burn', stacks, duration: 99 });
              const poisonIdx = newStatuses.findIndex(s => s.type === 'poison');
              if (poisonIdx >= 0) newStatuses[poisonIdx] = { ...newStatuses[poisonIdx], stacks: newStatuses[poisonIdx].stacks + stacks };
              else newStatuses.push({ type: 'poison', stacks, duration: 99 });
              return { ...e, statuses: newStatuses };
            }));
            enemies.filter(e => e.hp > 0).forEach(e => {
              setEnemyEffectForUid(e.uid, 'debuff');
            });
          }, 800);
        } else if (aidRoll < 0.8) {
          // 效果4：本场战斗骰子上限+1，立刻补抽
          addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
          addToast(`◆ 洞察弱点！本场战斗骰子上限+1，立刻补抽！`, 'buff');
          addLog(`洞察弱点达成！骰子上限+1（本场战斗）`);
          setTimeout(() => {
            setGame(prev => ({
              ...prev,
              drawCount: prev.drawCount + 1,
              tempDrawCountBonus: (prev.tempDrawCountBonus || 0) + 1,
            }));
            // 立刻补抽1颗骰子到手中
            setGame(prev => {
              const bag = [...prev.diceBag];
              if (bag.length === 0) return prev;
              const idx = Math.floor(Math.random() * bag.length);
              const defId = bag.splice(idx, 1)[0];
              const def = getDiceDef(defId);
              const elems = ['fire', 'ice', 'thunder', 'poison', 'holy'] as const;
              const newDie: Die = {
                id: Date.now() + 9000,
                diceDefId: defId,
                value: rollDiceDef(def),
                element: def.isElemental ? elems[Math.floor(Math.random() * elems.length)] : 'normal',
                selected: false,
                spent: false,
                rolling: false,
              };
              setDice(prev2 => [...prev2, newDie]);
              return { ...prev, diceBag: bag };
            });
            addFloatingText(`+1骰子`, 'text-yellow-300', <PixelDice size={2} />, 'player');
          }, 800);
        } else {
          // 效果5：骰子库全部临时替换为随机一种强力骰子
          const strongPool = [
            { id: 'blade', name: '锋刃骰子' },
            { id: 'amplify', name: '倍增骰子' },
            { id: 'split', name: '分裂骰子' },
            { id: 'magnet', name: '磁吸骰子' },
            { id: 'joker', name: '小丑骰子' },
            { id: 'chaos', name: '混沌骰子' },
            { id: 'elemental', name: '元素骰子' },
          ];
          const pick = strongPool[Math.floor(Math.random() * strongPool.length)];
          addFloatingText(`✦ 弱点击破 ✦`, 'text-yellow-300', undefined, 'enemy', true);
          addToast(`◆ 洞察弱点！骰子库全部变为${pick.name}！`, 'buff');
          addLog(`洞察弱点达成！骰子库临时替换为${pick.name}`);
          setTimeout(() => {
            setGame(prev => ({
              ...prev,
              diceBag: prev.diceBag.map(() => pick.id),
              discardPile: prev.discardPile.map(() => pick.id),
            }));
          }, 800);
        }
      }
    }, 600);

    setTimeout(() => {
      // Use pre-computed kill data instead of stale enemies closure
      if (killedEnemiesData.length > 0) {
        game.relics.filter(r => r.trigger === 'on_kill').forEach(relic => {
          killedEnemiesData.forEach(killedData => {
            const overkill = killedData.overkill;
            const res = relic.effect({ overkillDamage: overkill });
            if (res.heal && res.heal > 0) {
              setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + res.heal) }));
              addToast(` ${relic.name}: +${res.heal}HP`, 'heal');

            }
          });
        });

          // 溢出导管: 溢出伤害转移给随机敌人
          const overflowRelic = game.relics.find(r => r.id === 'overflow_conduit');
          if (overflowRelic) {
            killedEnemiesData.forEach(killedData => {
              const overkill = killedData.overkill;
              if (overkill > 0) {
                const aliveOthers = enemies.filter(e => e.hp > 0 && e.uid !== killedData.uid);
                if (aliveOthers.length > 0) {
                  const target = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
                  setEnemies(prev => prev.map(e => e.uid === target.uid ? { ...e, hp: Math.max(0, e.hp - overkill) } : e));
 addLog(' 溢出导管: ' + overkill + ' 点溢出伤害转移给 ' + target.name + '!');
                  addFloatingText('-' + overkill, 'text-orange-400', null, 'enemy');
                  playSound('hit');
                }
              }
            });
          }
      }
    }, 300);

    // 魂晶获取：首次出牌秒杀敌人时，溢出伤害×当前倍率=魂晶（同步执行，不在setTimeout中）
    if (killedEnemiesData.length > 0) {
      const currentNode = game.map.find(n => n.id === game.currentNodeId);
      const currentDepth = currentNode?.depth || 0;
      const depthMult = game.soulCrystalMultiplier + currentDepth * 0.1;
      let totalSoulGain = 0;
      killedEnemiesData.forEach(killedData => {
        // 只有当该敌人是本次出牌的直接目标，且是首次对其出牌时才给魂晶
        const isDirectTarget = killedData.uid === targetUidForTracking;
        // playsBefore 是本次出牌前对目标的出牌次数（来自 ref 同步值）
        if (isDirectTarget && playsBefore === 0 && killedData.overkill > 0) {
          const enemy = enemies.find(e => e.uid === killedData.uid);
          const cappedOverkill = Math.min(killedData.overkill, enemy?.maxHp || 50);
          const gain = Math.max(1, Math.ceil(cappedOverkill * depthMult * 0.5));
          totalSoulGain += gain;
        }
      });
      if (totalSoulGain > 0) {
        setGame(prev => ({
          ...prev,
          blackMarketQuota: (prev.blackMarketQuota || 0) + totalSoulGain,
          totalOverkillThisRun: (prev.totalOverkillThisRun || 0) + totalSoulGain,
        }));
        addFloatingText(`+${totalSoulGain} 魂晶`, 'text-purple-300', <PixelSoulCrystal size={3} />, 'player', true);
        addToast(`+${totalSoulGain} 魂晶 (${Math.round(depthMult * 100)}%倍率)`, 'buff');
      }
    }

    // Mark dice as spent & add to discard pile
    const selectedDiceForSpent = dice.filter(d => d.selected && !d.spent);
    const spentDefIds = selectedDiceForSpent.map(d => d.diceDefId);
    
    // === 盗贼【灵巧回收】：第1次出牌时弹回点数最小的骰子 ===
    let bouncedDieId: number | null = null;
    if (game.playerClass === 'rogue' && (game.comboCount || 0) === 0 && selectedDiceForSpent.length >= 2) {
      // 找到点数最小的骰子
      const sorted = [...selectedDiceForSpent].sort((a, b) => a.value - b.value);
      bouncedDieId = sorted[0].id;
    }
    
    setDice(prev => prev.map(d => {
      if (!d.selected) return d;
      if (d.id === bouncedDieId) {
        // 弹回的骰子：不消耗，取消选中
        return { ...d, selected: false, playing: false, spent: false };
      }
      return { ...d, spent: true, selected: false, playing: false };
    }));
    if (bouncedDieId) {
      const bouncedDie = selectedDiceForSpent.find(d => d.id === bouncedDieId);
      if (bouncedDie) {
        addFloatingText(`↩ ${bouncedDie.value}点弹回`, 'text-green-400', undefined, 'player');
        // 弹回的骰子不放入弃骰库
        const filteredSpent = spentDefIds.filter((_, i) => selectedDiceForSpent[i].id !== bouncedDieId);
        const usedElements = selectedDiceForSpent.filter(d => d.id !== bouncedDieId && d.element !== 'normal').map(d => d.element);
        const isNormalAttackPlay = bestHand === '普通攻击';
        setGame(prev => ({ ...prev, discardPile: [...prev.discardPile, ...filteredSpent], elementsUsedThisBattle: [...new Set([...(prev.elementsUsedThisBattle || []), ...usedElements])], consecutiveNormalAttacks: isNormalAttackPlay ? (prev.consecutiveNormalAttacks || 0) + 1 : 0 }));
      }
    } else {
      const usedElements = dice.filter(d => d.selected && !d.spent && d.element !== 'normal').map(d => d.element);
      const isNormalAttackPlay = bestHand === '普通攻击';
      setGame(prev => ({ ...prev, discardPile: [...prev.discardPile, ...spentDefIds], elementsUsedThisBattle: [...new Set([...(prev.elementsUsedThisBattle || []), ...usedElements])], consecutiveNormalAttacks: isNormalAttackPlay ? (prev.consecutiveNormalAttacks || 0) + 1 : 0 }));
    }

    let logMsg = `打出 ${bestHand}，造成 ${outcome.damage} 伤害`;
    if (outcome.armor > 0) logMsg += `，获得 ${outcome.armor} 护甲`;
    if (outcome.heal > 0) logMsg += `，回复 ${outcome.heal} 生命`;
    if (outcome.triggeredAugments.length > 0) {
      const augDetails = outcome.triggeredAugments.map(a => `${a.name}(${a.details})`).join(', ');
      logMsg += ` (触发: ${augDetails})`;
    }

    // 圣光净化：出牌后才执行副作用（清除负面状态或移除诅咒骰子）
    if (outcome.holyPurify) {
      const purifyCount = typeof outcome.holyPurify === 'number' ? outcome.holyPurify : 1;
      const negativeStatuses = game.statuses.filter(s => ['poison', 'burn', 'vulnerable', 'weak'].includes(s.type));
      if (negativeStatuses.length > 0) {
        // 净化数量：purifyCount>=99表示全部净化
        const toPurge = purifyCount >= 99 ? negativeStatuses : 
          negativeStatuses.sort(() => Math.random() - 0.5).slice(0, purifyCount);
        const purgeTypes = new Set(toPurge.map(s => s.type));
        setGame(prev => ({
          ...prev,
          statuses: prev.statuses.filter(s => !purgeTypes.has(s.type)),
        }));
        const purgedNames = toPurge.map(s => s.type).join('、');
        addLog(`净化！清除了 ${purgedNames}`);
        addFloatingText(`净化 ${toPurge.length > 1 ? '×' + toPurge.length : purgedNames}`, 'text-cyan-300', undefined, 'player');
      } else {
        const cursedIdx = game.ownedDice.findIndex(d => d.defId === 'cursed' || d.defId === 'cracked');
        if (cursedIdx >= 0) {
          const cursedDefId = game.ownedDice[cursedIdx].defId;
          const cursedDef = getDiceDef(cursedDefId);
          setGame(prev => {
            const newOwned = [...prev.ownedDice];
            newOwned.splice(cursedIdx, 1);
            let removedFromBag = false;
            const newBag = prev.diceBag.filter(id => {
              if (!removedFromBag && id === cursedDefId) {
                removedFromBag = true;
                return false;
              }
              return true;
            });
            let removedFromDiscard = false;
            const newDiscard = prev.discardPile.filter(id => {
              if (!removedFromDiscard && id === cursedDefId) {
                removedFromDiscard = true;
                return false;
              }
              return true;
            });
            return { ...prev, ownedDice: newOwned, diceBag: newBag, discardPile: newDiscard };
          });
          addLog(`净化！移除了 ${cursedDef.name}`);
          addFloatingText(`净化 ${cursedDef.name}`, 'text-cyan-300', undefined, 'player');
        }
      }
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
          // Boss出场演出：如果当前是boss节点且下一波只有1个敌人(boss单独出场)
          const currentNode = game.map.find(n => n.id === game.currentNodeId);
          const isBossWave = currentNode?.type === 'boss' && nextWave.length === 1 && nextWave[0].maxHp > 200;
          if (isBossWave) {
            playSound('boss_appear');
            setBossEntrance({ visible: true, name: nextWave[0].name, chapter: game.chapter });
            await new Promise(r => setTimeout(r, 2200));
            setBossEntrance(prev => ({ ...prev, visible: false }));
            await new Promise(r => setTimeout(r, 300));
          }
          setEnemies(nextWave);
          setEnemyEffects({}); setDyingEnemies(new Set());
          // Boss场景内演出：缩放前冲+抖动+笑声
          if (isBossWave && nextWave[0]) {
            setEnemyEffectForUid(nextWave[0].uid, 'boss_entrance');
            playSound('boss_laugh');
            await new Promise(r => setTimeout(r, 1300));
            setEnemyEffectForUid(nextWave[0].uid, null);
          }
          setEnemyQuotes({});
          setEnemyQuotedLowHp(new Set());
          setTimeout(() => {
            nextWave.forEach((e, idx) => {
              const q = getEnemyQuotes(e.configId);
              const line = pickQuote(q?.enter);
              if (line) {
                setTimeout(() => showEnemyQuote(e.uid, line, 3000), idx * 400);
              }
            });
          }, 300);
          setGame(prev => ({ ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: prev.maxPlays, freeRerollsLeft: prev.freeRerollsPerTurn, armor: 0, instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type), instakillCompleted: false, playsThisWave: 0, rerollsThisWave: 0 }));
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

    // === 职业回合结束处理 ===
    // 法师【星界蓄力】：未出牌时叠加蓄力层+护盾
    const playedThisTurn = game.playsLeft < game.maxPlays; // 本回合是否出过牌
    if (game.playerClass === 'mage' && !playedThisTurn) {
      const newChargeStacks = Math.min((game.chargeStacks || 0) + 1, 2); // 最多蓄力2回合
      setGame(prev => ({
        ...prev, chargeStacks: newChargeStacks, armor: prev.armor + 6,
      }));
      addFloatingText(`蓄力 Lv.${(game.chargeStacks || 0) + 1}`, 'text-purple-400', undefined, 'player');
      addFloatingText('+6护甲', 'text-blue-400', undefined, 'player');
    } else if (game.playerClass === 'mage' && playedThisTurn) {
      // 出了牌就重置蓄力
      setGame(prev => ({ ...prev, chargeStacks: 0 }));
    }

    // 重置战士血怒/盗贼连击计数
    setGame(prev => ({ ...prev, isEnemyTurn: true, bloodRerollCount: 0, comboCount: 0, lastPlayHandType: undefined }));

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
      // 急救沙漏: 毒伤致命保护
      if (currentPlayerHp <= 0 && prev.hp > 0) {
        const hgR = prev.relics.find(r => r.id === 'emergency_hourglass');
        if (hgR && (hgR.counter || 0) === 0) {
          currentPlayerHp = prev.hp;
          return { ...prev, hp: currentPlayerHp,
            relics: prev.relics.map(r => r.id === 'emergency_hourglass' ? { ...r, counter: 15 } : r)
          };
        }
      }
      return { ...prev, hp: currentPlayerHp, statuses: nextStatuses };
    });

    await new Promise(r => setTimeout(r, 600));
    if (currentPlayerHp <= 0) { playSound('player_death'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    // --- 2. Process each enemy's burn damage ---
    let enemyDeathsFromBurn: string[] = [];
    setEnemies(prev => prev.map(e => {
      if (e.hp <= 0) return e;
      const burn = e.statuses.find(s => s.type === 'burn');
      if (burn && burn.value > 0) {
        const dmg = burn.value;
        addLog(`${e.name} \u56e0\u707c\u70e7\u53d7\u5230\u4e86 ${dmg} \u70b9\u4f24\u5bb3\u3002`);
        addFloatingText(`-${dmg}`, 'text-orange-500', <PixelFlame size={2} />, 'enemy');
        // 灼烧只存在一回合，造成伤害后直接移除
        const nextStatuses = e.statuses.filter(s => s.type !== 'burn');
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
        setGame(prev => ({ ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: prev.maxPlays, freeRerollsLeft: prev.freeRerollsPerTurn, armor: 0, instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type), instakillCompleted: false, playsThisWave: 0, rerollsThisWave: 0 }));
        setRerollCount(0);
          setWaveAnnouncement(nextWaveIdx + 1);
        addLog(`\u7b2c ${nextWaveIdx + 1} \u6ce2\u654c\u4eba\u6765\u88ad\uff01`);
        rollAllDice();
        return;
      }
      handleVictory();
      return;
    }

    // --- 2.5. Pre-Action: process each enemy's poison ---
    const enemyDeathsFromPoison: string[] = [];
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
        if (newHp <= 0) enemyDeathsFromPoison.push(e.uid);
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
    const aliveAfterPoison = enemies.filter(e => e.hp > 0 && !enemyDeathsFromPoison.includes(e.uid));
    if (aliveAfterPoison.length === 0 && enemyDeathsFromPoison.length > 0) {
      const nextWaveIdx = game.currentWaveIndex + 1;
      if (nextWaveIdx < game.battleWaves.length) {
        const nextWave = game.battleWaves[nextWaveIdx].enemies;
        setEnemies(nextWave);
        setEnemyEffects({}); setDyingEnemies(new Set());
        setGame(prev => ({ ...prev, currentWaveIndex: nextWaveIdx, targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null, isEnemyTurn: false, playsLeft: prev.maxPlays, freeRerollsLeft: prev.freeRerollsPerTurn, armor: 0, instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type), instakillCompleted: false, playsThisWave: 0, rerollsThisWave: 0 }));
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
              await enemyPreAction(e, 'defend');
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
            await enemyPreAction(e, 'heal');
            setEnemyEffectForUid(e.uid, 'skill');
            playSound('enemy_skill');
            const allies = currentEnemies.filter(en => en.hp > 0 && en.uid !== e.uid);
            const damagedAllies = allies.filter(en => en.hp < en.maxHp);
            const selfDamaged = e.hp < e.maxHp;
            
            if (damagedAllies.length > 0) {
              // Priority 1: Heal the most damaged ally
              const lowestAlly = damagedAllies.reduce((a, b) => (a.hp / a.maxHp) < (b.hp / b.maxHp) ? a : b);
              const healVal = Math.floor(e.attackDmg * 4.0);
              setEnemies(prev => prev.map(en => en.uid === lowestAlly.uid ? { ...en, hp: Math.min(en.maxHp, en.hp + healVal) } : en));
              addLog(`${e.name} 治疗了 ${lowestAlly.name} ${healVal} HP。`);
              addFloatingText(`+${healVal}`, 'text-emerald-500', undefined, 'enemy');
              playSound('enemy_heal');
            } else if (selfDamaged) {
              // Priority 2: Heal self if damaged
              const healVal = Math.floor(e.attackDmg * 3.0);
              setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, hp: Math.min(en.maxHp, en.hp + healVal) } : en));
              addLog(`${e.name} 治疗自己 ${healVal} HP。`);
              playSound('enemy_heal');
            } else if (allies.length > 0) {
              // Priority 3: Buff ally - alternate between strength and armor
              const target = allies[Math.floor(Math.random() * allies.length)];
              if (game.battleTurn % 2 === 0) {
                // Even turns: give strength
                setEnemies(prev => prev.map(en => {
                  if (en.uid !== target.uid) return en;
                  const existing = en.statuses.find(s => s.type === 'strength');
                  if (existing) {
                    return { ...en, statuses: en.statuses.map(s => s.type === 'strength' ? { ...s, value: s.value + 3 } : s) };
                  }
                  return { ...en, statuses: [...en.statuses, { type: 'strength' as any, value: 3 }] };
                }));
                addLog(`${e.name} 为 ${target.name} 施加了力量强化！`);
                addFloatingText('力量+3', 'text-red-400', undefined, 'enemy');
              } else {
                // Odd turns: give armor
                const armorVal = Math.floor(e.attackDmg * 3);
                setEnemies(prev => prev.map(en => en.uid === target.uid ? { ...en, armor: en.armor + armorVal } : en));
                addLog(`${e.name} 为 ${target.name} 施加了护甲祝福（+${armorVal}护甲）！`);
                addFloatingText(
`护甲+${armorVal}`
, 'text-cyan-400', undefined, 'enemy');
              }
            } else {
              // Priority 4: No allies - debuff player with various effects
              const debuffRoll = Math.random();
              if (debuffRoll < 0.35) {
                // Weak
                setGame(prev => {
                  const weakStatus = prev.statuses.find(s => s.type === 'weak');
                  if (weakStatus) {
                    return { ...prev, statuses: prev.statuses.map(s => s.type === 'weak' ? { ...s, value: s.value + 1, duration: 3 } : s) };
                  }
                  return { ...prev, statuses: [...prev.statuses, { type: 'weak' as any, value: 1, duration: 3 }] };
                });
                addLog(`${e.name} 对你施加了虚弱！`);
                addFloatingText('虚弱!', 'text-purple-400', undefined, 'player');
              } else if (debuffRoll < 0.6) {
                // Vulnerable
                setGame(prev => {
                  const vulnStatus = prev.statuses.find(s => s.type === 'vulnerable');
                  if (vulnStatus) {
                    return { ...prev, statuses: prev.statuses.map(s => s.type === 'vulnerable' ? { ...s, value: s.value + 1, duration: 3 } : s) };
                  }
                  return { ...prev, statuses: [...prev.statuses, { type: 'vulnerable' as any, value: 1, duration: 3 }] };
                });
                addLog(`${e.name} 对你施加了易伤！`);
                addFloatingText('易伤!', 'text-orange-400', undefined, 'player');
              } else {
                // Insert curse dice
                const curseDice = Math.random() < 0.5 ? 'cursed' : 'cracked';
                const curseName = curseDice === 'cursed' ? '诅咒骰子' : '碎裂骰子';
                setGame(prev => ({
                  ...prev,
                  ownedDice: [...prev.ownedDice, { defId: curseDice, level: 1 }],
                  diceBag: [...prev.diceBag, curseDice],
                }));
                addLog(`${e.name} 向你的骰子库塞入了一颗${curseName}！`);
                addFloatingText(
`+${curseName}`
, 'text-red-400', undefined, 'player');
                playSound('enemy_skill');
              }
            }
            
            await new Promise(r => setTimeout(r, 300));
            setEnemyEffectForUid(e.uid, null);
            continue;
          }
          
          // Caster (ranged mage): never attacks directly, only applies DoT effects
          if (e.combatType === 'caster') {
            await enemyPreAction(e, 'skill');
            setEnemyEffectForUid(e.uid, 'skill');
            playSound('enemy_skill');
            
            // Randomly choose a DoT: poison, burn, or both
            const dotRoll = Math.random();
            if (dotRoll < 0.4) {
              // Apply poison
              const poisonVal = Math.max(2, Math.floor(e.attackDmg * 0.4));
              setGame(prev => {
                const existing = prev.statuses.find(s => s.type === 'poison');
                if (existing) {
                  return { ...prev, statuses: prev.statuses.map(s => s.type === 'poison' ? { ...s, value: s.value + poisonVal } : s) };
                }
                return { ...prev, statuses: [...prev.statuses, { type: 'poison' as any, value: poisonVal }] };
              });
              addLog(`${e.name} 释放毒雾，施加了 ${poisonVal} 层毒素！`);
              addFloatingText(`毒素+${poisonVal}`, 'text-emerald-400', undefined, 'player');
            } else if (dotRoll < 0.7) {
              // Apply burn
              const burnVal = Math.max(1, Math.floor(e.attackDmg * 0.3));
              setGame(prev => {
                const existing = prev.statuses.find(s => s.type === 'burn');
                if (existing) {
                  return { ...prev, statuses: prev.statuses.map(s => s.type === 'burn' ? { ...s, value: s.value + burnVal, duration: 3 } : s) };
                }
                return { ...prev, statuses: [...prev.statuses, { type: 'burn' as any, value: burnVal, duration: 3 }] };
              });
              addLog(`${e.name} 释放火球，施加了灼烧！`);
              addFloatingText(`灼烧+${burnVal}`, 'text-orange-400', undefined, 'player');
            } else {
              // Apply both poison + weak
              const poisonVal = Math.max(1, Math.floor(e.attackDmg * 0.25));
              setGame(prev => {
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
              addLog(`${e.name} 施放诅咒，施加了毒素和虚弱！`);
              addFloatingText(`毒素+${poisonVal}`, 'text-emerald-400', undefined, 'player');
              setTimeout(() => addFloatingText('虚弱', 'text-purple-400', undefined, 'player'), 200);
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
          await enemyPreAction(e, 'attack');
          setEnemyEffectForUid(e.uid, 'attack');
          setScreenShake(true);
          
          let damage = e.attackDmg;
          // Warrior: melee powerhouse - 30% bonus at close range (the real threat)
          if (e.combatType === 'warrior') {
            damage = Math.floor(damage * 1.3);
          }
          // Ranger: attacks twice, damage escalates each attack (+1 per hit)
          if (e.combatType === 'ranger') {
            const hitCount = e.attackCount || 0;
            damage = Math.max(1, Math.floor(damage * 0.40) + hitCount);
            if (isSlowed) damage = Math.floor(damage * 0.5);
            // 递增攻击计数
            setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, attackCount: hitCount + 2 } : en));
          }
          // Caster: handled above (dot-only, no direct attack)
          const str = e.statuses.find(s => s.type === 'strength');
          if (str) damage += str.value;
          const weak = e.statuses.find(s => s.type === 'weak');
          if (weak) damage = Math.max(1, Math.floor(damage * 0.75));
          
          
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
            // 急救沙漏: 免疫致命伤害
            if (newHp <= 0 && prev.hp > 0) {
              const hgRelic = prev.relics.find(r => r.id === 'emergency_hourglass');
              if (hgRelic && (hgRelic.counter || 0) === 0) {
                newHp = prev.hp; // 完全无视这次伤害
                newArmor = prev.armor;
                return { ...prev, hp: newHp, armor: newArmor,
                  relics: prev.relics.map(r => r.id === 'emergency_hourglass' ? { ...r, counter: 15 } : r)
                };
              }
            }
            return { ...prev, hp: newHp, armor: newArmor, hpLostThisTurn: (prev.hpLostThisTurn || 0) + (prev.hp - newHp), hpLostThisBattle: (prev.hpLostThisBattle || 0) + (prev.hp - newHp) };
          });
          
          // --- Relic on_damage_taken effects ---
          game.relics.filter(r => r.trigger === 'on_damage_taken').forEach(relic => {
            const res = relic.effect({});
            if (res.damage) {
              setGame(prev => ({ ...prev, rageFireBonus: (prev.rageFireBonus || 0) + res.damage }));
              addToast(`${relic.name}: 下次出牌+${res.damage}伤害`, 'buff');
            }
          });
          addFloatingText(`-${damage}`, 'text-red-500', undefined, 'player');
          setPlayerEffect('flash');
          addLog(`${e.name} 攻击造成 ${damage} 伤害！`);
          playSound('enemy');
          // 30% 概率触发攻击台词
          if (Math.random() < 0.3) {
            const aqc = getEnemyQuotes(e.configId);
            const al = pickQuote(aqc?.attack);
            if (al) showEnemyQuote(e.uid, al, 1800);
          }
          // 受重击台词（单次伤害超过 15）
          if (damage >= 15) {
            const hqc = getEnemyQuotes(e.configId);
            const hl = pickQuote(hqc?.hurt);
            if (hl) setTimeout(() => showEnemyQuote(e.uid, hl, 2000), 600);
          }
          
          // Ranger: second hit after short delay (also escalated)
          if (e.combatType === 'ranger') {
            await new Promise(r => setTimeout(r, 250));
            const hitCount = (e.attackCount || 0);
            const secondHit = Math.max(1, Math.floor(e.attackDmg * 0.40) + hitCount + 1);
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
          
          if (isElite && game.battleTurn % 3 === 0) {
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
            if (hpRatio < 0.4 && game.battleTurn % 2 === 0) {
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
            } else if (game.battleTurn % 3 === 0) {
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


        // --- 3.6. Elite/Boss: 叠护甲 ---
        // 部分精英每3回合叠一次护甲，Boss每2回合叠一次护甲
        for (const e of currentEnemies.filter(en => en.hp > 0)) {
          const isElite = e.maxHp > 80 && e.maxHp <= 200;
          const isBoss = e.maxHp > 200;
          
          if (isElite && game.battleTurn % 3 === 0 && game.battleTurn > 0) {
            const armorVal = Math.floor(e.attackDmg * 1.5);
            setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + armorVal } : en));
            addLog(`${e.name} 凝聚了护甲（+${armorVal}）！`);
            addFloatingText(
`护甲+${armorVal}`
, 'text-cyan-400', undefined, 'enemy');
            playSound('enemy_defend');
            await new Promise(r => setTimeout(r, 300));
          }
          
          if (isBoss && game.battleTurn % 2 === 0 && game.battleTurn > 0) {
            const armorVal = Math.floor(e.attackDmg * 2.0);
            setEnemies(prev => prev.map(en => en.uid === e.uid ? { ...en, armor: en.armor + armorVal } : en));
            addLog(`${e.name} 释放了护盾（+${armorVal}护甲）！`);
            addFloatingText(
`护盾+${armorVal}`
, 'text-cyan-300', undefined, 'enemy');
            playSound('enemy_defend');
            await new Promise(r => setTimeout(r, 300));
          }
        }


    // --- 5. Player Turn Start ---
    
      // 薛定谔的袋子：若上回合未使用重Roll，本回合额外抽1颗
      let _schrodingerBonus = 0;
      if (game.relics.some(r => r.id === 'schrodinger_bag') && rerollCount === 0) {
        _schrodingerBonus = 1;
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
        // 灼烧只存在一回合，造成伤害后直接移除
        nextStatuses = nextStatuses.filter(s => s.type !== 'burn');
      }
      nextStatuses = tickStatuses(nextStatuses);
      currentPlayerHp = Math.max(0, prev.hp - burnDamage);
      // 急救沙漏: 火伤致命保护
      if (currentPlayerHp <= 0 && prev.hp > 0) {
        const hgR = prev.relics.find(r => r.id === 'emergency_hourglass');
        if (hgR && (hgR.counter || 0) === 0) {
          currentPlayerHp = prev.hp;
          return { ...prev, hp: currentPlayerHp,
            relics: prev.relics.map(r => r.id === 'emergency_hourglass' ? { ...r, counter: 15 } : r)
          };
        }
      }

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

    if (currentPlayerHp <= 0) { playSound('player_death'); setGame(prev => ({ ...prev, phase: 'gameover' })); return; }

    setGame(prev => ({ 
      ...prev, 
      isEnemyTurn: false, 
      armor: 0,
      playsLeft: prev.maxPlays,
      freeRerollsLeft: prev.freeRerollsPerTurn,
      hpLostThisTurn: 0,
      consecutiveNormalAttacks: 0,
    }));

    // === 留手牌机制 ===
    // 未使用的骰子留在手中，下回合只补抽到 drawCount 上限
    const remainingDice = dice.filter(d => !d.spent);
    const remainingCount = remainingDice.length;
    
    // Capture schrodinger bonus before entering setTimeout (closure captures value)
    const schrodingerBonus = _schrodingerBonus;
    // Use setTimeout to ensure previous state updates are flushed
    setTimeout(() => {
      // Read latest game state from ref (setTimeout ensures prior setGame calls are flushed)
      const g = gameRef.current;
      setRerollCount(0); // Reset reroll count for new turn
      const needDraw = Math.max(0, g.drawCount + schrodingerBonus - remainingCount);
      
      // 直接从 gameRef.current 读取最新状态进行抽牌计算
      // setTimeout 保证之前的 setGame 已 flush，gameRef.current 是最新值
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
      
      // 原子更新骰子库状态
      setGame(prev => ({ ...prev, diceBag: finalBag, discardPile: finalDiscard }));
      
      if (wasShuffled) { setShuffleAnimating(true); setTimeout(() => setShuffleAnimating(false), 800); addToast('\u2728 \u5f03\u9ab0\u5e93\u5df2\u6d17\u56de\u9ab0\u5b50\u5e93!', 'buff'); }
      
      // Merge kept dice + fresh dice
      const keptDice: Die[] = remainingDice.map((d) => ({
        ...d,
        selected: false,
        kept: true,
      }));
      // drawnDice is computed synchronously above, guaranteed to have values
      const freshDice: Die[] = drawnDice.map((d) => ({
        ...d,
        rolling: true,
        kept: false,
        value: Math.floor(Math.random() * 6) + 1,
      }));
      
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
        setDice(prev => applyDiceSpecialEffects(prev, { hasLimitBreaker: game.relics.some(r => r.id === 'limit_breaker') }));
        playSound('dice_lock');
        await new Promise(r => setTimeout(r, 200));
        setDice(prev => [...prev]);
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

// 全局安全网：战斗中HP<=0时强制进入gameover
useEffect(() => {
    if (game.phase === 'battle' && game.hp <= 0) {
      playSound('player_death');
      setGame(prev => ({ ...prev, hp: 0, phase: 'gameover' }));
    }
  }, [game.phase, game.hp]);

useEffect(() => {
    const unspentDice = dice.filter(d => !d.spent);
    if (
      game.phase === 'battle' && 
      !game.isEnemyTurn && 
      enemies.length > 0 && 
      enemies.some(e => e.hp > 0) && 
      game.hp > 0 &&
      dice.length > 0 &&
      !dice.some(d => d.rolling) &&
      !dice.some(d => d.playing) &&
      // 只在出牌次数耗尽时自动结束，或者所有骰子都用完且确实出过牌(playsLeft < maxPlays)
      (game.playsLeft <= 0 || (unspentDice.length === 0 && game.playsLeft < game.maxPlays))
    ) {
      const timer = setTimeout(() => {
        endTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game.phase, game.isEnemyTurn, enemies, game.hp, dice, game.playsLeft]);

  const handleVictory = () => {
    // 战斗结束：销毁敌人塞的废骰子（cursed/cracked）+ 清除临时drawCount加成
    setGame(prev => ({
      ...prev,
      ownedDice: prev.ownedDice.filter(d => d.defId !== 'cursed' && d.defId !== 'cracked'),
      diceBag: prev.diceBag.filter(id => id !== 'cursed' && id !== 'cracked'),
      discardPile: prev.discardPile.filter(id => id !== 'cursed' && id !== 'cracked'),
      // 清除洞察弱点临时骰子上限加成
      drawCount: prev.drawCount - (prev.tempDrawCountBonus || 0),
      tempDrawCountBonus: 0,
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
    // --- 层厅征服者: counter 递增 ---
    setGame(prev => ({
      ...prev,
      relics: prev.relics.map(r => r.id === 'floor_conqueror' ? { ...r, counter: (r.counter || 0) + 1 } : r),
    }));
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
        currentGold: game.souls,
      });
      if (res.goldBonus && res.goldBonus > 0) {
        baseGold += res.goldBonus;
        addToast(` ${relic.name}: +${res.goldBonus}金币`, 'gold');
      }
    });
    const loot: LootItem[] = [
      { id: 'gold', type: 'gold', value: baseGold, collected: false }
    ];

    // Boss rewards: +1 draw count (手牌上限+1)
    const victoryNode = game.map.find(n => n.id === game.currentNodeId);
    if (victoryNode?.type === 'boss') {
      loot.push({ id: 'bossDrawCount', type: 'diceCount', value: 1, collected: false });
    }

    // Elite rewards: +1 Dice, +2 Global Rerolls, or +1 Free Reroll per turn
    // 中Boss(非终Boss)也走骰子奖励，不随机给重roll
    const mapMaxDepth = Math.max(...game.map.map(n => n.depth));
    const isMidBoss = victoryNode?.type === 'boss' && victoryNode.depth < mapMaxDepth;
    if (isMidBoss) {
      // 中Boss必给+1骰子（额外的，在diceReward阶段选新骰子之外再加一颗手牌）
      // 不走随机elite奖励
    } else if (enemies.find(e => e.rerollReward)?.rerollReward) {
      const eliteRewards = LOOT_CONFIG.eliteRewards;
      const selectedReward = eliteRewards[Math.floor(Math.random() * eliteRewards.length)];
      
      if (selectedReward.type === 'freeRerollPerTurn') {
        loot.push({ id: 'freeReroll', type: 'reroll', value: selectedReward.value, collected: false });
      } else {
        loot.push({ id: selectedReward.type, type: selectedReward.type as any, value: selectedReward.value, collected: false });
      }
    }

    // (augment loot removed - unified into relic drops)

    // 一击必杀挑战奖励：额外宝箱（点击后随机开启）
    if (game.instakillCompleted || gameRef.current.instakillCompleted) {
      loot.push({ id: 'challenge_chest', type: 'challengeChest' as any, value: 0, collected: false });
    }








    // 遗物掉落：精英战/Boss战必掉，普通战30%概率
    const battleType = allWaveEnemies.some(e => e.name.includes('Boss')) ? 'boss' : 
                       allWaveEnemies.some(e => e.rerollReward) ? 'elite' : 'enemy';
    const relicDropChance = battleType === 'enemy' ? 0 : 1.0;
    if (Math.random() < relicDropChance) {
      const relicPool = getRelicRewardPool(battleType as 'elite' | 'boss');
      const ownedRelicIds = game.relics.map(r => r.id);
      const newRelics = pickRandomRelics(relicPool, 1, ownedRelicIds);
      if (newRelics.length > 0) {
        const newRelic = newRelics[0];
        loot.push({ id: 'relic-' + newRelic.id, type: 'relic' as any, value: 0, collected: false, relicData: newRelic });
        
      }
    }
    setGame(prev => {
      const newMap = prev.map.map(n => n.id === prev.currentNodeId ? { ...n, completed: true } : n);
      
      if (prev.currentNodeId && prev.map.find(n => n.id === prev.currentNodeId)?.type === 'boss') {
        const bossNode = prev.map.find(n => n.id === prev.currentNodeId);
        const mapMaxDepth = Math.max(...prev.map.map(n => n.depth));
        // 最终Boss = 当前地图最大深度的Boss节点
        if (bossNode && bossNode.depth >= mapMaxDepth) {
          // 判断是否为最终章
          if (prev.chapter >= CHAPTER_CONFIG.totalChapters) {
            return { ...prev, map: newMap, phase: 'victory', isEnemyTurn: false, stats: { ...prev.stats, bossesKilled: (prev.stats.bossesKilled || 0) + 1 } };
          } else {
            // 进入大关过渡
            return { ...prev, map: newMap, phase: 'chapterTransition' as any, isEnemyTurn: false, stats: { ...prev.stats, bossesKilled: (prev.stats.bossesKilled || 0) + 1 } };
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
        relics: prev.relics.map(r => r.id === 'emergency_hourglass' && (r.counter || 0) > 0 ? { ...r, counter: (r.counter || 0) - 1 } : r)
      };
    });
  };

  // === 大关过渡：进入下一章 ===
  const _handleNextChapter = () => {
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
      } else if ((item.type as string) === 'challengeChest') {
        // 挑战宝箱：随机开出奖励
        playSound('shop_buy');
        const roll = Math.random();
        if (roll < 0.4) {
          const gold = 30 + Math.floor(Math.random() * 40);
          nextState.souls += gold;
          addLog(`开启挑战宝箱：获得 ${gold} 金币`);
          addToast(`🎁 挑战宝箱：+${gold}金币`, 'gold');
        } else if (roll < 0.75) {
          const pool = [...(DICE_BY_RARITY.uncommon || []), ...(DICE_BY_RARITY.rare || [])];
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (pick) {
            nextState.ownedDice = [...nextState.ownedDice, { defId: pick.id, level: 1 }];
            addLog(`开启挑战宝箱：获得 ${pick.name}`);
            addToast(`🎁 挑战宝箱：${pick.name}`, 'buff');
          } else {
            nextState.souls += 50;
            addToast(`🎁 挑战宝箱：+50金币`, 'gold');
          }
        } else {
          const relicPool = [...(RELICS_BY_RARITY.common || []), ...(RELICS_BY_RARITY.uncommon || [])];
          const ownedIds = nextState.relics.map((r: any) => r.id);
          const available = relicPool.filter(r => !ownedIds.includes(r.id));
          if (available.length > 0) {
            const pick = available[Math.floor(Math.random() * available.length)];
            nextState.relics = [...nextState.relics, { ...pick }];
            addLog(`开启挑战宝箱：获得遗物 ${pick.name}`);
            addToast(`🎁 挑战宝箱：${pick.name}`, 'buff');
          } else {
            nextState.souls += 60;
            addToast(`🎁 挑战宝箱：+60金币`, 'gold');
          }
        }
      }

      // 遗物拾取
      if (item.type === 'relic' && item.relicData) {
        nextState.relics = [...nextState.relics, { ...item.relicData }];
        addLog(`获得遗物: ${item.relicData.name}`);
      }

      return nextState;
    });

    // 閬楃墿 toast
    if (item.type === 'relic' && item.relicData) {
      addToast(' 获得遗物: ' + item.relicData.name + '!', 'buff');
    }
    
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
      
      addLog(`替换了遗物: ${oldAug?.name} -> ${newAug.name}，返还了 ${refund} 金币。`);
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
      const sRelics = pickRandomRelics([...RELICS_BY_RARITY.common, ...RELICS_BY_RARITY.uncommon, ...RELICS_BY_RARITY.rare], 3, game.relics.map(r => r.id));
      for (const aug of sRelics) {
        candidates.push({ id: 'aug_' + aug.id, type: 'augment' as const, augment: { ...aug, condition: 'passive' as any } as any, label: aug.name, desc: aug.description, price: rp() });
      }
      const sDice = [...DICE_BY_RARITY.uncommon, ...DICE_BY_RARITY.rare].sort(() => Math.random() - 0.5);
      for (const d of sDice.slice(0, 2)) {
        candidates.push({ id: 'dice_' + d.id, type: 'specialDice' as const, diceDefId: d.id, label: d.name, desc: d.description + ' [' + d.faces.join(',') + ']', price: d.rarity === 'rare' ? rp() + 30 : rp() + 10 });
      }
      candidates.push({ id: 'reroll_legacy', type: 'reroll' as const, label: '重掷强化', desc: '永久增加每回合 +1 次免费重掷', price: rp() });
      const shopItems: ShopItem[] = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
      // 始终添加删除骰子选项
      shopItems.push({
        id: 'removeDice_fixed', type: 'removeDice' as const,
        label: '骰子净化', desc: '移除一颗骰子，瘦身构筑',
        price: Math.floor(Math.random() * 61) + 20 // 20-80随机
      });
      setGame(prev => ({ ...prev, phase: 'merchant', currentNode: next, shopItems }));
    } else if (next === 7) {
      setGame(prev => ({ ...prev, phase: 'event', currentNode: next }));
    } else {
      startBattle(next);
    }
  };

  
  // COMBAT_TYPE_DESC 已提取到 logic/battleHelpers.ts

  const _getEffectiveAttackDmg = (e: Enemy) => {
    let val = e.attackDmg;
    const weak = e.statuses.find(s => s.type === 'weak');
    if (weak) val = Math.floor(val * 0.75);
    const playerVuln = game.statuses.find(s => s.type === 'vulnerable');
    if (playerVuln) val = Math.floor(val * 1.5);
    const strength = e.statuses.find(s => s.type === 'strength');
    if (strength) val += strength.value;
    return val;
  };

  const resetGame = () => {
    setGame(createInitialGameState());
    setDice([]);
    setEnemies([]);
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
    startingRelicChoices,
    pendingBattleNode,
    startNode, startBattle,
    collectLoot, finishLoot,
    selectLootAugment, replaceAugment,
    pickReward, nextNode,
    toasts, addToast,
    addLog,
    handleSelectStartingRelic, handleSkipStartingRelic,
    resetGame,
  };


  if (game.phase === 'start') {
    return <GameContext.Provider value={contextValue}><StartScreen /></GameContext.Provider>;
  }

  if ((game.phase as string) === 'classSelect') {
    return (
      <GameContext.Provider value={contextValue}>
        <ClassSelectScreen onSelect={(classId) => {
          const newState = createInitialGameState(classId);
          const meta = loadMeta();
          const startRelics = (meta.unlockedStartRelics || [])
            .map((id: string) => ALL_RELICS[id])
            .filter(Boolean);
          setGame({
            ...newState,
            phase: 'map',
            relics: startRelics,
          });
        }} />
      </GameContext.Provider>
    );
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

      {/* 战斗转场遮罩 */}
      {battleTransition !== 'none' && (
        <div
          className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-black"
          style={{
            opacity: battleTransition === 'fadeOut' ? 0 : 1,
            transition: battleTransition === 'fadeIn' ? 'opacity 0.2s ease-in'
              : battleTransition === 'fadeOut' ? 'opacity 0.3s ease-out' : 'none',
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PixelDice size={4} />
          </motion.div>
          <div className="mt-3 text-[10px] text-[var(--dungeon-text-dim)] tracking-[0.2em] font-mono">
            {'Loading'.split('').map((ch, i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
              >{ch}</motion.span>
            ))}
            <motion.span
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
            >...</motion.span>
          </div>
        </div>
      )}

      {/* Boss出场演出遮罩 */}
      <BossEntrance
        visible={bossEntrance.visible}
        bossName={bossEntrance.name}
        chapter={bossEntrance.chapter}
      />

      <div className="flex-1 overflow-hidden relative">
        {game.phase === 'map' && <MapScreen />}
        {game.phase === 'diceReward' && <DiceRewardScreen />}
        {game.phase === 'loot' && <LootScreen />}
        {game.phase === 'merchant' && <ShopScreen />}
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

            
            {/* ===== 上半区：3D立体敌人舞台 ===== */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-[3] min-h-0 overflow-hidden">
              {/* ▶ 场景背景层 — 按章节+Boss状态选择 */}
              {(() => {
                const node = game.map.find(n => n.id === game.currentNodeId);
                const isBossNode = node?.type === 'boss';
                const ch = game.chapter;
                if (ch <= 1) return <ForestBattleScene isBoss={isBossNode} />;
                if (ch <= 2) return <IceBattleScene isBoss={isBossNode} />;
                if (ch <= 3) return <LavaBossScene isBoss={isBossNode} />;
                if (ch <= 4) return <ShadowBattleScene isBoss={isBossNode} />;
                return <EternalBossScene isBoss={isBossNode} />;
              })()}

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

              {/* 洞察弱点 */}
              {game.instakillChallenge && (
                <motion.div
                  className="absolute top-2 right-2 z-20 max-w-[130px]"
                  animate={game.instakillCompleted ? {
                    scale: [1, 1.15, 1.05, 1.15, 1],
                    rotate: [0, -2, 2, -2, 0],
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <div
                    className={`px-1.5 py-1 bg-[rgba(8,11,14,0.85)] border cursor-pointer transition-all ${
                      game.instakillCompleted ? 'border-[var(--pixel-gold)]' :
                      'border-[rgba(212,160,48,0.4)]'
                    }`}
                    style={{
                      borderRadius:'2px',
                      boxShadow: game.instakillCompleted ? '0 0 12px rgba(212,160,48,0.6), 0 0 24px rgba(212,160,48,0.3), inset 0 0 8px rgba(212,160,48,0.15)' : 'none',
                    }}
                    onClick={() => setShowChallengeDetail(true)}
                  >
                    <div className="text-[7px] text-[var(--pixel-gold)] font-bold tracking-wider mb-0.5 text-center">
                      {game.instakillCompleted ? '✦ 弱点击破 ✦' : '◆ 洞察弱点'}
                    </div>
                    <div className={`text-[9px] font-bold text-center leading-tight ${
                      game.instakillCompleted ? 'text-[var(--pixel-gold)]' :
                      'text-[var(--dungeon-text-bright)]'
                    }`}>
                      {game.instakillChallenge.label}
                    </div>
                    {/* 有进度的条件显示进度 */}
                    {game.instakillChallenge.progress !== undefined && game.instakillChallenge.value && !game.instakillCompleted && (
                      <div className="mt-0.5">
                        <div className="h-1 bg-[rgba(255,255,255,0.1)] relative" style={{borderRadius:'1px'}}>
                          <div className="h-full bg-[var(--pixel-gold)]" style={{
                            width: `${Math.min(100, ((game.instakillChallenge.progress || 0) / (game.instakillChallenge.value || 1)) * 100)}%`,
                            borderRadius:'1px',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        <div className="text-[7px] text-[var(--dungeon-text-dim)] text-center mt-0.5 font-mono">
                          {game.instakillChallenge.progress || 0}/{game.instakillChallenge.value}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              <AnimatePresence>
                {showChallengeDetail && game.instakillChallenge && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.7)]"
                    onClick={() => setShowChallengeDetail(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 20 }}
                      className="pixel-panel p-4 max-w-[260px] w-[85%]"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-[0.15em] text-center mb-1">◆ 洞察弱点 ◆</div>
                      <div className="text-[13px] font-bold text-[var(--dungeon-text-bright)] text-center mb-2 pixel-text-shadow">{game.instakillChallenge.label}</div>
                      <div className="text-[10px] text-[var(--dungeon-text)] leading-relaxed text-center mb-3">{formatDescription(game.instakillChallenge.description)}</div>
                      <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mb-3 leading-relaxed border-t border-[var(--dungeon-panel-border)] pt-2">
                        达成条件后将获得强力战斗援助效果，并获得额外宝箱奖励
                      </div>
                      <button onClick={() => setShowChallengeDetail(false)} className="w-full py-1.5 pixel-btn pixel-btn-ghost text-[10px]">关闭</button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 敌人舞台光效 */}
              <div className="absolute inset-0 enemy-stage-glow pointer-events-none" />

              {/* 敌人浮动伤害数字 */}
              <AnimatePresence>
                {floatingTexts.filter(ft => ft.target === 'enemy').map(ft => (
                  <motion.div
                    key={ft.id}
                    initial={{ opacity: 0, y: 20 + ft.y, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -120 + ft.y, x: ft.x, scale: [0.5, 1.4, 1.1, 1.6] }}
                    transition={{ duration: 2.0, times: [0, 0.12, 0.75, 1] }}
                    className={`absolute z-50 font-black text-3xl pointer-events-none flex items-center gap-1 drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] ${ft.color}`}
                    style={{ top: '25%' }}
                  >
                    {ft.icon}
                    {ft.text}
                  </motion.div>
                ))}
              </AnimatePresence>

                {/* Multi-enemy fixed-slot display (no reflow on death) */}
                <div className="relative" style={{ minHeight: '180px', display: 'grid', gridTemplateColumns: `repeat(${Math.max(enemies.length, 1)}, 1fr)`, alignItems: 'end', justifyItems: 'center', gap: '12px' }}>
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
                // Scale: distance 0 = 1.25 (close, pressure), 1 = 0.95, 2 = 0.75, 3 = 0.6
                const depthScale = dist === 0 ? 1.25 : dist === 1 ? 0.95 : dist === 2 ? 0.75 : 0.6;
                  const depthY = dist >= 3 ? -50 : dist === 2 ? -25 : dist === 1 ? -5 : 30;
                  const depthOpacity = 1.0; // No opacity reduction - use brightness for depth
                  const _isAttackReady = dist === 0;
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
                        : effect === 'boss_entrance'
                        ? { scale: [0.6, 1.4, 1.3, 1.35, 1.25, 1.3, 1.2, 1.25], y: [60, -15, -5, -12, 0, -8, 2, 0], opacity: [0, 1, 1, 1, 1, 1, 1, 1], rotate: [0, 0, -3, 3, -2, 2, -1, 0] }
                        : effect === 'speaking'
                        ? { x: [0, -2, 2, -1.5, 1.5, -1, 1, 0], scale: [1, 1.02, 0.98, 1.01, 0.99, 1] }
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
                      transition={{ duration: effect === 'death' ? 1.8 : effect === 'boss_entrance' ? 1.2 : effect === 'speaking' ? 0.4 : 0.4, ease: effect === 'death' ? [0.25, 0.1, 0.25, 1] : 'easeOut' }}
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

                      {/* Enemy quote bubble */}
                      <EnemyQuoteBubble
                        text={enemyQuotes[enemy.uid] || null}
                        category={enemy.category}
                      />

                      {/* Enemy sprite */}
                      <div className={`relative ${
                        enemy.combatType === 'warrior' ? 'animate-enemy-breathe-warrior' :
                        enemy.combatType === 'caster' ? 'animate-enemy-breathe-caster' :
                        enemy.combatType === 'guardian' ? 'animate-enemy-breathe-guardian' :
                        enemy.combatType === 'ranger' ? 'animate-enemy-breathe-ranger' :
                        enemy.combatType === 'priest' ? 'animate-enemy-breathe-priest' :
                        'animate-enemy-breathe'
                      }`}>
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
                      <div className="mt-1 animate-enemy-shadow" style={{
                        width: '150%',
                        height: '18px',
                        background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)',
                        borderRadius: '50%',
                        marginLeft: '-25%',
                        filter: 'blur(3px)',
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
                {/* ═══ 骰子特效层（粒子独立于手） ═══ */}
                {dice.some(d => d.rolling) && (
                  <div className="hand-dice-fx">
                    {Array.from({length: 8}).map((_, i) => (
                      <div key={i} className="dice-particle" style={{
                        animationDelay: `${i * 0.08}s`,
                        left: `${15 + Math.sin(i * 0.8) * 12}%`,
                        top: `${20 + Math.cos(i * 1.1) * 15}%`,
                      }} />
                    ))}
                  </div>
                )}
                {/* ═══ 左手铠甲手套 + 骰子 ═══ */}
                <div className={`hand-left ${dice.some(d => d.rolling) ? 'hand-left-rolling' : handLeftThrow ? 'hand-left-throw' : ''}`}>
                  <svg width="150" height="210" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
                    {/* ── 魔能骰子（手掌上方，纯像素） ── */}
                    {/* 投影 */}
                    <rect x="12" y="6" width="26" height="26" fill="rgba(0,0,0,0.3)" />
                    {/* 外框 — 像素锯齿圆角 */}
                    <rect x="12" y="4" width="2" height="2" fill="#1a1430" />
                    <rect x="34" y="4" width="2" height="2" fill="#1a1430" />
                    <rect x="12" y="26" width="2" height="2" fill="#1a1430" />
                    <rect x="34" y="26" width="2" height="2" fill="#1a1430" />
                    <rect x="14" y="2" width="20" height="2" fill="#1a1430" />
                    <rect x="14" y="28" width="20" height="2" fill="#1a1430" />
                    <rect x="10" y="6" width="2" height="20" fill="#1a1430" />
                    <rect x="36" y="6" width="2" height="20" fill="#1a1430" />
                    {/* 主体填充 */}
                    <rect x="12" y="6" width="24" height="20" fill="#2c2050" />
                    <rect x="14" y="4" width="20" height="2" fill="#2c2050" />
                    <rect x="14" y="26" width="20" height="2" fill="#2c2050" />
                    {/* 内层深色 */}
                    <rect x="14" y="8" width="20" height="16" fill="#342868" />
                    {/* 能量核心 — 3层像素方块 */}
                    <rect x="18" y="10" width="12" height="12" fill="#4838a0" />
                    <rect x="20" y="12" width="8" height="8" fill="#6050c0" />
                    <rect x="22" y="14" width="4" height="4" fill="#9080ff" />
                    {/* 核心高光点 */}
                    <rect x="24" y="16" width="2" height="2" fill="#c0b0ff" />
                    {/* 顶部高光条 */}
                    <rect x="14" y="6" width="8" height="2" fill="#4a3c80" />
                    <rect x="14" y="8" width="4" height="2" fill="#4a3c80" />
                    {/* 底部暗边 */}
                    <rect x="14" y="24" width="20" height="2" fill="#1e1840" />
                    <rect x="34" y="10" width="2" height="16" fill="#1e1840" />
                    {/* 魔法纹路 — 像素十字 */}
                    <rect x="16" y="15" width="2" height="2" fill="#7060d0" opacity="0.5" />
                    <rect x="30" y="15" width="2" height="2" fill="#7060d0" opacity="0.5" />
                    <rect x="22" y="9" width="2" height="2" fill="#7060d0" opacity="0.4" />
                    <rect x="22" y="21" width="2" height="2" fill="#7060d0" opacity="0.4" />
                    {/* 四角能量点 */}
                    <rect x="14" y="6" width="2" height="2" fill="#8070e0" opacity="0.6" />
                    <rect x="32" y="6" width="2" height="2" fill="#8070e0" opacity="0.5" />
                    <rect x="14" y="24" width="2" height="2" fill="#8070e0" opacity="0.5" />
                    <rect x="32" y="24" width="2" height="2" fill="#8070e0" opacity="0.6" />
                    {/* ── 手背（直接托住骰子） ── */}
                    <rect x="8" y="28" width="30" height="14" fill="#58585e" />
                    <rect x="8" y="28" width="30" height="2" fill="#6a6a72" />
                    <rect x="8" y="40" width="30" height="2" fill="#3e3e46" />
                    <rect x="10" y="30" width="5" height="8" fill="#626268" />
                    <rect x="17" y="30" width="5" height="8" fill="#626268" />
                    <rect x="24" y="30" width="5" height="8" fill="#626268" />
                    <rect x="31" y="30" width="5" height="8" fill="#5a5a60" />
                    {/* 拇指 */}
                    <rect x="4" y="26" width="6" height="12" fill="#525258" />
                    <rect x="4" y="26" width="6" height="2" fill="#5e5e66" />
                    {/* ── 手臂铠甲 ── */}
                    <rect x="10" y="42" width="28" height="54" fill="#4a4a50" />
                    <rect x="10" y="42" width="28" height="2" fill="#5a5a62" />
                    <rect x="10" y="46" width="28" height="2" fill="#3a3a42" />
                    <rect x="10" y="50" width="28" height="2" fill="#5a5a62" />
                    <rect x="10" y="54" width="28" height="2" fill="#3a3a42" />
                    <rect x="10" y="58" width="28" height="2" fill="#5a5a62" />
                    <rect x="10" y="62" width="28" height="2" fill="#3a3a42" />
                    <rect x="10" y="66" width="28" height="2" fill="#5a5a62" />
                    <rect x="10" y="70" width="28" height="2" fill="#3a3a42" />
                    <rect x="10" y="74" width="28" height="2" fill="#5a5a62" />
                    <rect x="10" y="78" width="28" height="2" fill="#3a3a42" />
                    <rect x="10" y="82" width="28" height="2" fill="#5a5a62" />
                    <rect x="10" y="86" width="28" height="2" fill="#3a3a42" />
                    <rect x="10" y="90" width="28" height="2" fill="#5a5a62" />
                    <rect x="12" y="44" width="2" height="52" fill="#5e5e68" />
                    <rect x="12" y="48" width="2" height="2" fill="#6a6a72" />
                    <rect x="12" y="60" width="2" height="2" fill="#6a6a72" />
                    <rect x="12" y="72" width="2" height="2" fill="#6a6a72" />
                    <rect x="12" y="84" width="2" height="2" fill="#6a6a72" />
                  </svg>
                </div>
                {/* 右手 — 铠甲手套持阔剑 */}
                <div className={`hand-right ${playerEffect === 'attack' ? 'hand-right-attacking' : ''}`}>
                  <svg width="155" height="215" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
                    {/* === 剑刃 — 暗黑阔剑 === */}
                    {/* 剑尖 */}
                    <rect x="21" y="0" width="6" height="2" fill="#606878" />
                    <rect x="19" y="2" width="10" height="2" fill="#505868" />
                    {/* 刃身 — 冷铁色 */}
                    <rect x="17" y="4" width="14" height="36" fill="#3c4450" />
                    {/* 刃中线 — 暗银高光 */}
                    <rect x="22" y="2" width="4" height="38" fill="#4a5566" />
                    {/* 刃左暗面 */}
                    <rect x="17" y="4" width="2" height="36" fill="#282e38" />
                    {/* 刃右暗面 */}
                    <rect x="29" y="4" width="2" height="36" fill="#303842" />
                    {/* 刃边冷光 */}
                    <rect x="19" y="4" width="2" height="36" fill="#4a5260" />
                    {/* 暗纹蚀刻 */}
                    <rect x="20" y="10" width="8" height="1" fill="rgba(0,0,0,0.2)" />
                    <rect x="20" y="20" width="8" height="1" fill="rgba(0,0,0,0.15)" />
                    <rect x="20" y="30" width="8" height="1" fill="rgba(0,0,0,0.2)" />
                    {/* 暗红邪能纹 */}
                    <rect x="22" y="8" width="4" height="2" fill="#8a2020" opacity="0.5" />
                    <rect x="22" y="18" width="4" height="2" fill="#8a2020" opacity="0.35" />
                    <rect x="22" y="28" width="4" height="2" fill="#8a2020" opacity="0.45" />
                    {/* === 护手 — 暗铁 === */}
                    <rect x="8" y="40" width="32" height="4" fill="#2a2a30" />
                    <rect x="8" y="40" width="32" height="2" fill="#3a3a42" />
                    <rect x="8" y="42" width="32" height="2" fill="#1e1e24" />
                    {/* 护手端饰 — 暗银尖角 */}
                    <rect x="6" y="40" width="4" height="4" fill="#3e3e48" />
                    <rect x="38" y="40" width="4" height="4" fill="#3e3e48" />
                    {/* 护手中央 — 暗红宝石 */}
                    <rect x="21" y="40" width="6" height="4" fill="#601818" />
                    <rect x="23" y="40" width="2" height="2" fill="#a03030" />
                    {/* === 握柄 — 暗黑皮革 === */}
                    <rect x="18" y="44" width="12" height="14" fill="#1a1418" />
                    <rect x="18" y="46" width="12" height="2" fill="#241c20" />
                    <rect x="18" y="50" width="12" height="2" fill="#241c20" />
                    <rect x="18" y="54" width="12" height="2" fill="#241c20" />
                    <rect x="20" y="44" width="2" height="14" fill="#201820" />
                    {/* 柄尾 — 暗铁 */}
                    <rect x="16" y="58" width="16" height="4" fill="#2a2a30" />
                    <rect x="16" y="58" width="16" height="2" fill="#3a3a42" />
                    <rect x="22" y="58" width="4" height="4" fill="#3e3e48" />
                    {/* === 手部铠甲 === */}
                    <rect x="12" y="52" width="24" height="10" fill="#4a4a50" />
                    <rect x="12" y="52" width="24" height="2" fill="#5a5a62" />
                    <rect x="12" y="56" width="24" height="2" fill="#3a3a42" />
                    <rect x="14" y="54" width="4" height="6" fill="#525258" />
                    <rect x="20" y="54" width="4" height="6" fill="#525258" />
                    <rect x="26" y="54" width="4" height="6" fill="#4e4e56" />
                    <rect x="32" y="54" width="4" height="6" fill="#484850" />
                    {/* === 手臂铠甲 — 延长 === */}
                    <rect x="12" y="62" width="24" height="34" fill="#4a4a50" />
                    <rect x="12" y="64" width="24" height="2" fill="#5a5a62" />
                    <rect x="12" y="68" width="24" height="2" fill="#3a3a42" />
                    <rect x="12" y="72" width="24" height="2" fill="#5a5a62" />
                    <rect x="12" y="76" width="24" height="2" fill="#3a3a42" />
                    <rect x="12" y="80" width="24" height="2" fill="#5a5a62" />
                    <rect x="12" y="84" width="24" height="2" fill="#3a3a42" />
                    <rect x="14" y="62" width="2" height="34" fill="#5e5e68" />
                    {/* 铆钉 */}
                    <rect x="16" y="66" width="2" height="2" fill="#6a6a72" />
                    <rect x="30" y="74" width="2" height="2" fill="#6a6a72" />
                    <rect x="16" y="82" width="2" height="2" fill="#6a6a72" />
                    {/* 攻击发光 */}
                    {playerEffect === 'attack' && (
                      <>
                        <rect x="16" y="4" width="16" height="36" fill="rgba(48,216,208,0.2)" />
                        <rect x="22" y="0" width="4" height="40" fill="rgba(48,216,208,0.35)" />
                        <rect x="20" y="0" width="8" height="2" fill="rgba(48,216,208,0.6)" />
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
                  <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] pointer-events-none" style={{background: 'rgba(0,0,0,0.7)'}}>
                    <div className="flex flex-col items-center animate-fade-in">
                      {/* 牌型卡片 */}
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative px-6 py-3"
                        style={{
                          background: 'linear-gradient(180deg, rgba(20,16,30,0.95) 0%, rgba(12,10,20,0.98) 100%)',
                          border: '3px solid var(--pixel-gold)',
                          borderRadius: '2px',
                          boxShadow: '0 0 20px rgba(212,160,48,0.3), 0 0 40px rgba(212,160,48,0.1), inset 0 1px 0 rgba(255,240,180,0.1), inset 0 -2px 0 rgba(0,0,0,0.4)',
                        }}
                      >
                        {/* 像素角装饰 */}
                        <div className="absolute -top-[3px] -left-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
                        <div className="absolute -top-[3px] -right-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
                        <div className="absolute -bottom-[3px] -left-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
                        <div className="absolute -bottom-[3px] -right-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
                        <div className="text-center">
                          <div className="text-2xl font-black tracking-wider text-[var(--pixel-gold)] pixel-text-shadow"
                            style={{textShadow: '0 0 16px rgba(212,160,48,0.9), 0 2px 0 rgba(0,0,0,0.8)'}}>
                            {settlementData.bestHand}
                          </div>
                          {settlementData.isSameElement && (
                            <div className="text-[10px] font-bold text-[var(--pixel-cyan)] mt-1 animate-pulse tracking-widest"
                              style={{textShadow: '0 0 10px rgba(48,216,208,0.8)'}}>
                              ★ 元素共鸣 ×2 ★
                            </div>
                          )}
                        </div>
                      </motion.div>
                      
                      {/* 骰子展示区 */}
                      <div className="flex gap-2 mt-5">
                        {settlementData.selectedDice.map((d, i) => (
                          <motion.div key={d.id}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: settlementPhase === 'dice' && settlementData.currentEffectIdx >= i ? 1.1 : 1, rotate: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.3, type: 'spring', stiffness: 300 }}
                            className={`relative ${getDiceElementClass(d.element, settlementPhase === 'dice' && settlementData.currentEffectIdx >= i, false, false, d.diceDefId)}`}
                            style={{
                              fontSize: '20px', width: '48px', height: '48px',
                              boxShadow: settlementPhase === 'dice' && settlementData.currentEffectIdx >= i
                                ? '0 0 16px rgba(212,160,48,0.7), 0 0 4px rgba(212,160,48,0.4)' : 'none',
                            }}>
                            <span className={`${d.element === 'normal' ? 'font-semibold' : 'font-black pixel-text-shadow'}`}>{d.value}</span>
                            {d.element !== 'normal' && (
                              <div className="absolute top-0.5 right-0.5 pointer-events-none">
                                <ElementBadge element={d.element} size={7} />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* 计分条 — 像素风格卡片 */}
                      <motion.div
                        className="relative flex items-center justify-center gap-2 mt-3 px-5 py-2.5"
                        style={{
                          background: 'linear-gradient(180deg, rgba(16,20,28,0.95) 0%, rgba(8,12,18,0.98) 100%)',
                          border: '2px solid var(--dungeon-panel-border)',
                          borderRadius: '2px',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.5)',
                          minWidth: '140px',
                        }}
                        animate={settlementPhase === 'bounce' ? {
                          scale: [1, 1.25, 0.9, 1.05, 1],
                          borderColor: ['var(--dungeon-panel-border)', 'var(--pixel-gold)', 'var(--pixel-orange)', 'var(--pixel-gold)', 'var(--dungeon-panel-border)'],
                        } : { scale: 1 }}
                        transition={settlementPhase === 'bounce' ? {
                          duration: 0.5,
                          times: [0, 0.25, 0.5, 0.75, 1],
                          ease: 'easeOut',
                        } : { duration: 0 }}
                      >
                        <span key={`base-${settlementData.currentBase}-${settlementData.currentEffectIdx}`}
                          className={`text-[var(--pixel-blue)] font-black text-2xl font-mono animate-value-pop ${settlementPhase === "effects" ? "settlement-value-glow-blue" : ""}`}
                          style={{ textShadow: '0 0 8px rgba(60,120,220,0.5)' }}>
                          {settlementData.currentBase}
                        </span>
                        <span className={`text-[var(--dungeon-text-dim)] text-lg font-black ${settlementPhase === 'mult' || settlementPhase === 'effects' || settlementPhase === 'damage' ? 'animate-percent-flash' : ''}`}>×</span>
                        <span key={`mult-${Math.round(settlementData.currentMult * 100)}-${settlementData.currentEffectIdx}`}
                          className={`text-[var(--pixel-red)] font-black text-2xl font-mono ${settlementPhase === "mult" || settlementPhase === "effects" || settlementPhase === "damage" ? "animate-value-pop settlement-value-glow-red" : "opacity-40"}`}
                          style={{ textShadow: settlementPhase === 'mult' || settlementPhase === 'effects' ? '0 0 8px rgba(220,60,60,0.5)' : 'none' }}>
                          {Math.round(settlementData.currentMult * 100)}%
                        </span>
                      </motion.div>
                      
                      {/* 触发效果列表 */}
                      {settlementPhase === 'effects' && settlementData.triggeredEffects.length > 0 && (
                        <div className="flex flex-col items-center gap-1 mt-2">
                          {settlementData.triggeredEffects.map((eff, i) => (
                            <motion.div key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.08 }}
                              className={`text-[10px] px-3 py-1 border font-bold flex items-center gap-1.5 ${eff.type === "mult" ? "bg-[rgba(224,60,60,0.15)] border-[var(--pixel-red)] text-[var(--pixel-red-light)]" : eff.type === "heal" ? "bg-[rgba(60,180,60,0.15)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]" : "bg-[rgba(60,120,224,0.15)] border-[var(--pixel-blue)] text-[var(--pixel-blue-light)]"}`}
                              style={{borderRadius: "2px"}}>
                              {eff.relicId && <RelicPixelIcon relicId={eff.relicId} size={2} />}
                              <span>{eff.type === "mult" ? "×" : "+"} {eff.name}: {eff.detail}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {expectedOutcome && !game.isEnemyTurn && !settlementPhase && (
                  <div className="absolute z-[80] bottom-2 left-2 right-2 flex justify-center pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="max-w-[340px]"
                  >
                    {/* 一体化预览+激活遗物卡片 */}
                    <div className="relative flex flex-col pointer-events-auto"
                      style={{
                        background: 'linear-gradient(180deg, rgba(20,16,10,0.92) 0%, rgba(14,10,6,0.96) 100%)',
                        border: '2px solid var(--pixel-gold)',
                        borderRadius: '3px',
                        boxShadow: '0 0 12px rgba(212,160,48,0.2), 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,160,48,0.1)',
                        padding: '5px 10px 4px',
                      }}
                    >
                      {/* 上部：牌型+数值 */}
                      <div className="flex items-center justify-between gap-2 pointer-events-auto cursor-pointer" onClick={() => setShowCalcModal(true)}>
                        {/* 左侧：牌型名 */}
                        <div className="text-[12px] font-black tracking-wider text-[var(--pixel-gold-light)] pixel-text-shadow leading-tight shrink-0"
                          style={{ textShadow: '0 0 8px rgba(212,160,48,0.5)' }}>
                          {expectedOutcome.bestHand}
                          {game.handLevels[expectedOutcome.bestHand] > 1 && (
                            <span className="ml-1 text-[8px] opacity-60 font-mono">Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                          )}
                        </div>
                        {/* 右侧：数值 */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {expectedOutcome.damage > 0 && (
                            <motion.span
                              animate={{ textShadow: ['0 0 4px rgba(200,64,60,0.4)', '0 0 10px rgba(200,64,60,0.7)', '0 0 4px rgba(200,64,60,0.4)'] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                              className="flex items-center gap-0.5 text-[var(--pixel-red-light)] text-[13px] font-black font-mono pixel-text-shadow"
                            >
                              <PixelZap size={1.5} />{expectedOutcome.damage}
                            </motion.span>
                          )}
                          {expectedOutcome.armor > 0 && (
                            <span className="flex items-center gap-0.5 text-[var(--pixel-blue-light)] text-[10px] font-bold font-mono pixel-text-shadow">
                              <PixelShield size={1.5} />+{expectedOutcome.armor}
                            </span>
                          )}
                          {expectedOutcome.heal > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold font-mono pixel-text-shadow">
                              <PixelHeart size={1.5} />+{expectedOutcome.heal}
                            </span>
                          )}
                          {expectedOutcome.statusEffects && expectedOutcome.statusEffects.length > 0 && (
                            expectedOutcome.statusEffects.map((s, i) => {
                              const info = STATUS_INFO[s.type];
                              return (
                                <span key={i} className={`flex items-center gap-0.5 text-[9px] font-bold ${info.color}`}>
                                  {info.icon}{s.value}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* 激活遗物+战斗遗物行 */}
                      {(() => {
                        const outcomeTriggeredRelicIds = new Set(
                          (expectedOutcome?.triggeredAugments || []).filter(ta => ta.relicId).map(ta => ta.relicId!)
                        );
                        const sceneTriggeredRelics = game.relics.filter(relic =>
                          flashingRelicIds.includes(relic.id) || outcomeTriggeredRelicIds.has(relic.id)
                        );
                        const sceneTriggeredAugs = game.augments.filter(Boolean).filter(aug =>
                          aug && activeAugments.some(a => a.id === aug!.id)
                        );
                        if (sceneTriggeredRelics.length === 0 && sceneTriggeredAugs.length === 0) return null;
                        return (
                          <>
                            <div className="w-full h-[1px] my-[3px]" style={{ background: 'linear-gradient(90deg, transparent, var(--pixel-gold), transparent)', opacity: 0.25 }} />
                            <div className="flex items-center gap-1 flex-wrap pointer-events-auto">
                              {sceneTriggeredRelics.map((relic, i) => (
                                <motion.div
                                  key={relic.id + "-sr-" + i}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 flex items-center justify-center cursor-pointer border border-[var(--pixel-gold)] shrink-0"
                                  style={{ borderRadius: '2px', background: 'rgba(212,160,48,0.12)', boxShadow: '0 0 6px rgba(212,160,48,0.3)' }}
                                  onClick={() => setSelectedRelic(relic)}
                                >
                                  <RelicPixelIcon relicId={relic.id} size={1.5} />
                                </motion.div>
                              ))}
                              {sceneTriggeredAugs.map((aug, i) => {
                                if (!aug) return null;
                                return (
                                  <motion.div
                                    key={"saug-" + aug.id + "-" + i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-6 h-6 flex items-center justify-center cursor-pointer border border-[var(--pixel-gold)] shrink-0"
                                    style={{ borderRadius: '2px', background: 'rgba(212,160,48,0.12)', boxShadow: '0 0 6px rgba(212,160,48,0.3)' }}
                                    onClick={() => setSelectedAugment(aug)}
                                  >
                                    <div className="text-[var(--pixel-gold-light)]" style={{ filter: 'drop-shadow(0 0 2px rgba(212,160,48,0.5))' }}>
                                      {getAugmentIcon(aug.condition, 10)}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
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
                  ft.large ? (
                    // large飘字：用fixed定位在屏幕中央上方，不受父容器裁切
                    <motion.div
                      key={ft.id}
                      initial={{ opacity: 0, y: 20, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 1, 1, 0], y: [-30, -60, -70, -80, -100], scale: [0.5, 1.4, 1.3, 1.3, 1.5] }}
                      transition={{ duration: 2.0, times: [0, 0.1, 0.3, 0.8, 1] }}
                      className="fixed z-[200] font-black text-2xl pointer-events-none flex items-center gap-1.5 text-purple-300"
                      style={{
                        top: '35%', left: '50%', transform: 'translateX(-50%)',
                        textShadow: '0 0 16px rgba(168,85,247,0.9), 0 0 32px rgba(168,85,247,0.5), 0 2px 4px rgba(0,0,0,0.9)',
                      }}
                    >
                      {ft.icon}
                      {ft.text}
                    </motion.div>
                  ) : (
                  <motion.div
                    key={ft.id}
                    initial={{ opacity: 0, y: 0 + ft.y, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -80 + ft.y, x: ft.x, scale: [0.5, 2.0, 1.8, 2.2] }}
                    transition={{ duration: 1.8, times: [0, 0.1, 0.75, 1] }}
                    className={`absolute z-50 font-bold text-xl pointer-events-none flex items-center gap-1 pixel-text-shadow ${ft.color}`}
                    style={{ top: '-20px', left: '50%', marginLeft: '-20px' }}
                  >
                    {ft.icon}
                    {ft.text}
                  </motion.div>
                  )
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
              <div className="px-3 py-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <motion.div 
                    animate={hpGained ? { scale: [1, 1.1, 1] } : playerEffect === 'attack' ? { y: [0, -6, 0] } : {}}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <PixelHeart size={1} />
                    <span className="font-bold text-[11px] text-[var(--dungeon-text)] pixel-text-shadow">守夜人</span>
                  </motion.div>
                  {/* 状态图标内联 */}
                  <div className="flex items-center gap-0.5 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0">
                    {game.armor > 0 && <StatusIcon status={{ type: 'armor', value: game.armor }} align="left" />}
                    {game.statuses.map((s, i) => <StatusIcon key={i} status={s} align="left" />)}
                  </div>
                  <span className="ml-auto text-[9px] font-mono font-bold text-[var(--pixel-gold)] tracking-wider px-1.5 py-0.5 bg-[rgba(212,160,48,0.1)] border border-[var(--pixel-gold-dark)] shrink-0" style={{borderRadius:"2px"}}>R{game.battleTurn}</span>
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
                          {formatDescription(typeInfo.desc)}
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

              <div className="px-2 pb-3 pt-0.5 border-t-2 border-[var(--dungeon-panel-border)]">

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
                  {dice.filter(d => !d.spent).map((die) => {
                    const isHint = !die.selected && handHintIds.has(die.id) && !die.rolling;
                    return (
                      <div key={`die-wrap-${die.id}`} className={isHint ? 'dice-hand-hint-wrap' : ''}>
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
                        onDoubleClick={(e) => { e.stopPropagation(); toggleLock(die.id); }}
                        className={`${getDiceElementClass(
                          isNormalAttackMulti && die.selected && die.element !== 'normal' ? 'normal' : die.element,
                          die.selected, die.rolling, invalidDiceIds.has(die.id),
                          isNormalAttackMulti && die.selected ? undefined : die.diceDefId
                        )} ${die.selected ? 'dice-selected-enhanced' : ''} ${(!die.selected && (game.isEnemyTurn || game.playsLeft <= 0)) ? 'pointer-events-none' : ''}`}
                        style={{ 
                          fontSize: '26px', width: '56px', height: '56px',
                          ...(die.locked ? { boxShadow: '0 0 6px rgba(234,179,8,0.6)', borderColor: '#eab308' } : {}),
                          ...(!die.selected && (game.isEnemyTurn || game.playsLeft <= 0) ? { filter: 'grayscale(0.5) brightness(0.7)', opacity: 0.6 } : invalidDiceIds.has(die.id) && !die.selected && !handHintIds.has(die.id) ? { filter: 'grayscale(0.4) brightness(0.7)', opacity: 0.65 } : {})
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
                        {die.locked && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 pointer-events-none">
                            <svg width="10" height="10" viewBox="0 0 10 10" className="drop-shadow-[0_0_2px_rgba(234,179,8,0.8)]">
                              <rect x="1" y="5" width="8" height="5" rx="1" fill="#eab308"/>
                              <path d="M3 5V3a2 2 0 0 1 4 0v2" fill="none" stroke="#eab308" strokeWidth="1.5"/>
                            </svg>
                          </div>
                        )}
                      </motion.button>
                      </div>
                    );
                  })}
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
                  {/* 重掷按钮 */}
                  <motion.button
                    disabled={!dice.some(d => d.selected && !d.spent) || game.isEnemyTurn || dice.some(d => d.playing) || game.playsLeft <= 0 || !canAffordReroll}
                    onClick={() => {
                      if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; }
                      if (dice.some(d => d.playing)) { addToast('正在出牌中...'); return; }
                      if (game.playsLeft <= 0) { addToast('出牌次数已耗尽'); return; }
                      if (!dice.some(d => d.selected && !d.spent)) { addToast('请先选中要重掷的骰子'); return; }
                      if (!canReroll) { addToast('免费重投次数已用完'); return; }
                      rerollSelected();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-10 px-3 ${currentRerollCost <= 0 ? 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]' : currentRerollCost <= 4 ? 'bg-[#4a1a1a] border-[#c04040] text-[#ff8080]' : 'bg-[#5a0a0a] border-[#ff2020] text-[#ff4040]'} disabled:opacity-30 border-3 flex items-center justify-center gap-1.5 transition-all shrink-0 relative overflow-hidden`}
                    style={{boxShadow: currentRerollCost <= 0 ? 'inset 0 2px 0 rgba(60,200,100,0.3), inset 0 -2px 0 rgba(0,0,0,0.4), 0 3px 0 rgba(0,0,0,0.5)' : `inset 0 2px 0 rgba(255,60,60,0.25), inset 0 -2px 0 rgba(0,0,0,0.4), 0 3px 0 rgba(0,0,0,0.5), 0 0 ${Math.min(16, 6 + currentRerollCost)}px rgba(255,40,40,${Math.min(0.6, 0.2 + currentRerollCost * 0.05)})`}}
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
                      <span className="text-[11px] font-mono font-bold flex items-center gap-0.5">{freeRerollsRemaining}<span className="text-[9px] opacity-70">×</span></span>
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
                        className="flex-1 py-2.5 bg-[#a02820] text-[#ffc8c0] border-3 border-[#2a0808] flex items-center justify-center font-bold text-[12px] tracking-[0.1em] battle-action-btn"
                        style={{boxShadow: 'inset 0 2px 0 #d04838, inset 0 -2px 0 #601008, 0 4px 0 #1a0404'}}
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
                        className={`flex-1 py-2.5 ${false /* always allow play */ ? 'bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)]' : 'bg-[#18803a] border-[#0a3014] text-[#c8ffd0]'} disabled:opacity-50 border-3 flex items-center justify-center gap-2 font-bold text-[12px] tracking-[0.05em] battle-action-btn`}
                        style={{boxShadow: 'inset 0 2px 0 #3ccc60, inset 0 -2px 0 #0c4418, inset 2px 0 0 #28a848, inset -2px 0 0 #105820, 0 4px 0 #042a0c', textShadow: '1px 1px 0 #042a0c'}}
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
                        className="flex-1 py-2.5 bg-[#907020] border-[#2a2008] text-[#fff0c0] disabled:opacity-50 border-3 flex items-center justify-center gap-2 font-bold text-[12px] tracking-[0.05em] battle-action-btn"
                        style={{boxShadow: 'inset 0 2px 0 #c8a040, inset 0 -2px 0 #604008, inset 2px 0 0 #b09030, inset -2px 0 0 #705010, 0 4px 0 #1a1404', textShadow: '1px 1px 0 #2a2008'}}
                      >
                        <PixelArrowRight size={2} /> 结束回合
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>


              {/* 遗物库面板（收起状态） */}
              <div className="px-2 pb-2 pt-0"
                style={{
                  borderTop: '2px solid rgba(80,70,55,0.6)',
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.5), 0 -1px 0 rgba(120,100,70,0.25)',
                  background: 'linear-gradient(to bottom, rgba(40,34,26,0.6) 0%, rgba(20,18,14,0.3) 60%, transparent 100%)',
                }}
              >
                <button
                  onClick={() => setShowRelicPanel(prev => !prev)}
                  className="w-full flex flex-col items-center justify-center py-1.5 transition-colors"
                  style={{ textShadow: '0 0 4px rgba(212,160,48,0.3)' }}
                >
                  <span className="text-[11px] text-[var(--pixel-gold)] font-bold leading-none">▲</span>
                  <span className="text-[12px] text-[var(--pixel-gold)] hover:text-[var(--pixel-gold-light)] font-black tracking-[0.2em] leading-tight mt-0.5">遗物库</span>
                  <span className="text-[9px] text-[var(--dungeon-text-dim)] font-mono leading-none mt-0.5">- {game.relics.length + game.augments.filter(Boolean).length}件 -</span>
                </button>
              </div>

              {/* 遗物详情弹窗 */}
              {selectedRelic && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70" onClick={() => setSelectedRelic(null)}>
                  <div className="pixel-panel p-4 max-w-[280px] w-full mx-4" onClick={e => e.stopPropagation()}>
                    <div className="text-center mb-2">
                      <div className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">{selectedRelic.name}</div>
                      <div className="text-[8px] text-[var(--pixel-gold)] mt-0.5">{selectedRelic.rarity === 'common' ? '普通' : selectedRelic.rarity === 'uncommon' ? '精良' : selectedRelic.rarity === 'rare' ? '稀有' : '传说'}</div>
                    </div>
                    <div className="text-[10px] text-[var(--dungeon-text)] leading-relaxed text-center">{formatDescription(selectedRelic.description)}</div>
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">触发: {selectedRelic.trigger === 'on_play' ? '每次出牌' : selectedRelic.trigger === 'on_kill' ? '击杀时' : selectedRelic.trigger === 'on_reroll' ? '重 Roll时' : selectedRelic.trigger === 'on_battle_end' ? '战斗结束' : selectedRelic.trigger === 'on_fatal' ? '致命伤害时' : selectedRelic.trigger === 'on_turn_end' ? '回合结束' : '被动'}</div>
                    <button onClick={() => setSelectedRelic(null)} className="w-full mt-3 py-1.5 pixel-btn pixel-btn-ghost text-[10px]">关闭</button>
                  </div>
                </div>
              )}

              {/* 遗物库半窗口浮层 */}
              <AnimatePresence>
                {showRelicPanel && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[150] bg-black/50"
                    onClick={() => setShowRelicPanel(false)}
                  >
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute bottom-0 left-0 right-0 max-h-[55vh]"
                      style={{
                        background: 'linear-gradient(180deg, rgba(16,14,20,0.98) 0%, rgba(10,8,14,0.99) 100%)',
                        borderTop: '3px solid var(--pixel-gold)',
                        boxShadow: '0 -4px 24px rgba(0,0,0,0.6), 0 -1px 0 rgba(212,160,48,0.15)',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* 顶部栏 */}
                      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--dungeon-panel-border)]">
                        <span className="text-[11px] font-black text-[var(--pixel-gold)] tracking-wider pixel-text-shadow"
                          style={{ textShadow: '0 0 6px rgba(212,160,48,0.4)' }}>
                          遗物库 ({game.relics.length + game.augments.filter(Boolean).length})
                        </span>
                        <button
                          onClick={() => setShowRelicPanel(false)}
                          className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] px-1 py-0.5 transition-colors"
                        >
                          <PixelClose size={2} />
                        </button>
                      </div>
                      {/* 遗物网格 */}
                      <div className="overflow-y-auto p-3" style={{ maxHeight: 'calc(55vh - 40px)' }}>
                        {game.relics.length === 0 && game.augments.every(a => !a) && (
                          <div className="flex items-center justify-center py-6 opacity-30">
                            <span className="text-[10px] text-[var(--dungeon-text-dim)]">暂无遗物</span>
                          </div>
                        )}
                        {/* 遗物区 */}
                        {game.relics.length > 0 && (
                          <>
                            <div className="text-[8px] text-[var(--dungeon-text-dim)] font-bold tracking-wider mb-1.5">遗物</div>
                            <div className="grid grid-cols-6 gap-1.5 mb-3">
                              {game.relics.map((relic, i) => {
                                const isActive = expectedOutcome?.triggeredAugments?.some(ta => ta.relicId === relic.id) || false;
                                const isFlashing = flashingRelicIds.includes(relic.id);
                                return (
                                  <div
                                    key={relic.id + "-rp-" + i}
                                    className={`flex flex-col items-center justify-center cursor-pointer border-2 transition-all duration-200 ${
                                      isActive
                                        ? "border-[var(--pixel-gold)] bg-gradient-to-b from-[rgba(212,160,48,0.2)] to-[rgba(180,120,30,0.08)]"
                                        : "bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] hover:border-[var(--dungeon-text-dim)]"
                                    }`}
                                    style={{
                                      borderRadius: '3px',
                                      padding: '4px 2px 3px',
                                      ...(isActive ? { boxShadow: '0 0 8px rgba(212,160,48,0.3)' } : {}),
                                      ...(isFlashing ? { boxShadow: '0 0 16px rgba(255,255,255,0.9), 0 0 30px rgba(212,160,48,0.8)', animation: 'relic-flash 0.6s ease-out' } : {}),
                                    }}
                                    onClick={() => setSelectedRelic(relic)}
                                  >
                                    <RelicPixelIcon relicId={relic.id} size={2.5} />
                                    <span className="text-[6px] font-bold text-[var(--dungeon-text-dim)] mt-0.5 truncate max-w-full px-0.5 leading-none text-center">
                                      {relic.name.length > 4 ? relic.name.slice(0, 4) : relic.name}
                                    </span>
                                    {relic.counter !== undefined && (
                                      <span className="text-[6px] font-mono font-bold text-[var(--pixel-orange-light)] leading-none">
                                        {relic.counter}{relic.counterLabel || ''}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                        {/* 增强模块区 */}
                        {game.augments.filter(Boolean).length > 0 && (
                          <>
                            <div className="text-[8px] text-[var(--dungeon-text-dim)] font-bold tracking-wider mb-1.5">增强模块</div>
                            <div className="grid grid-cols-6 gap-1.5">
                              {game.augments.filter(Boolean).map((aug, i) => {
                                if (!aug) return null;
                                const isActive = activeAugments.some(a => a.id === aug.id);
                                return (
                                  <div
                                    key={"augp-" + aug.id + "-" + i}
                                    onClick={() => setSelectedAugment(aug)}
                                    className={`flex flex-col items-center justify-center cursor-pointer border-2 transition-all duration-200 ${
                                      isActive
                                        ? "border-[var(--pixel-gold)] bg-gradient-to-b from-[rgba(212,160,48,0.2)] to-[rgba(180,120,30,0.08)]"
                                        : "bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] hover:border-[var(--dungeon-text-dim)]"
                                    }`}
                                    style={{
                                      borderRadius: '3px',
                                      padding: '4px 2px 3px',
                                      ...(isActive ? { boxShadow: '0 0 8px rgba(212,160,48,0.3)' } : {}),
                                    }}
                                    title={`${aug.name}: ${aug.description}`}
                                  >
                                    <div className={`shrink-0 ${isActive ? "text-[var(--pixel-gold-light)]" : "text-[var(--dungeon-text-dim)]"}`} style={isActive ? { filter: 'drop-shadow(0 0 3px rgba(212,160,48,0.6))' } : {}}>
                                      {getAugmentIcon(aug.condition, 14)}
                                    </div>
                                    <span className="text-[5px] font-bold leading-none px-0.5 py-px truncate max-w-full mt-0.5" style={{ color: getConditionInfo(aug.condition).color, backgroundColor: getConditionInfo(aug.condition).bgColor, border: `1px solid ${getConditionInfo(aug.condition).borderColor}`, borderRadius: '1px' }}>
                                      {getConditionInfo(aug.condition).abbr}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                          <span className="text-[10px] text-[var(--dungeon-text-dim)] font-mono">(基础 {expectedOutcome.baseHandValue} / 倍率 {Math.round(expectedOutcome.handMultiplier * 100)}%)</span>
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
                        {expectedOutcome.armorBreak && (
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[var(--dungeon-text-dim)]">?? 破甲</span>
                            <span className="text-orange-400">摧毁护甲</span>
                          </div>
                        )}
                        {expectedOutcome.statusEffects?.filter(s => s.type === 'burn').length > 0 && (
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="text-[var(--dungeon-text-dim)]">?? 灼烧</span>
                            <span className="text-orange-400">+{expectedOutcome.statusEffects.filter(s => s.type === 'burn').reduce((sum, s) => sum + s.value, 0)}</span>
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
                  <div className="text-[var(--dungeon-text)] text-[13px] mb-3 relative z-10">{formatDescription(selectedAugment.description)}</div>
                  {/* 连招大师：显示当前数值加成 */}
                  {selectedAugment.id === 'combo_master' && (
                    <div className="text-[11px] mb-3 px-2 py-1.5 bg-[rgba(212,160,48,0.1)] border border-[var(--pixel-gold-dark)] relative z-10" style={{borderRadius:'2px'}}>
                      <div className="text-[var(--pixel-gold)] font-bold mb-1">当前连击加成</div>
                      <div className="text-[var(--dungeon-text-dim)]">
                        连续普攻次数: <span className="text-[var(--pixel-orange)] font-bold">{game.consecutiveNormalAttacks || 0}</span>
                      </div>
                      <div className="text-[var(--dungeon-text-dim)]">
                        额外伤害: <span className="text-[var(--pixel-red)] font-bold">+{(game.consecutiveNormalAttacks || 0) * 4}</span>
                      </div>
                      <div className="text-[var(--dungeon-text-dim)]">
                        倍率加成: <span className="text-[var(--pixel-cyan)] font-bold">+{Math.round((game.consecutiveNormalAttacks || 0) * 10)}%</span>
                      </div>
                      <div className="text-[8px] text-[var(--dungeon-text-dim)] mt-1 opacity-60">※ 每回合结束时重置</div>
                    </div>
                  )}
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
      <DiceGuideModal />
      {/* Global Hand Guide Modal */}
      <HandGuideModal />
</GameContext.Provider>
  );
}





