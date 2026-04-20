/**
 * useBattleState.ts — 战斗状态聚合 Hook
 * 提取自 DiceHeroGame.tsx Phase G (Round3)
 * 包含所有 useState / useRef / 小工具函数 / GM useEffects
 */
import React, { useState, useEffect, useRef } from 'react';
import type { Die, Enemy, MapNode, Relic, GameState } from '../types/game';
import { createInitialGameState } from '../logic/gameInit';
import { isTutorialCompleted } from '../components/TutorialOverlay';
import { NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES } from '../config/enemies';
import { ANIMATION_TIMING } from '../config';
import { playSound, startBGM, stopBGM } from '../utils/sound';
import type { EnemyEffectType, PlayerEffectType, SettlementPhase, SettlementData } from '../contexts/BattleContext';

/** 扩展特效类型：包含 hit/debuff（战斗引擎内部使用，不暴露到 Context） */
export type InternalEnemyEffectType = EnemyEffectType | 'hit' | 'debuff';

export function useBattleState() {
  // ==================== 核心游戏状态 ====================
  const [game, setGame] = useState<GameState>(createInitialGameState);

  // ==================== UI 开关状态 ====================
  const [showHandGuide, setShowHandGuide] = useState(false);
  const [showDiceGuide, setShowDiceGuide] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showClassInfo, setShowClassInfo] = useState(false);
  const [battleTransition, setBattleTransition] = useState<'none' | 'fadeIn' | 'hold' | 'fadeOut'>('none');
  const [bossEntrance, setBossEntrance] = useState<{ visible: boolean; name: string; chapter: number }>({ visible: false, name: '', chapter: 1 });
  const [showTutorial, setShowTutorial] = useState(!isTutorialCompleted());

  // ==================== GM 延迟触发状态 ====================
  const [gmPendingVictory, setGmPendingVictory] = useState(false);
  const [gmPendingNextWave, setGmPendingNextWave] = useState(false);

  // ==================== 骰子状态 ====================
  const [dice, setDice] = useState<Die[]>([]);
  const gameRef = useRef(game);
  gameRef.current = game;
  const playsPerEnemyRef = useRef<Record<string, number>>({});
  const [_diceDrawAnim, setDiceDrawAnim] = useState(false);
  const [diceDiscardAnim, _setDiceDiscardAnim] = useState(false);
  const [shuffleAnimating, setShuffleAnimating] = useState(false);

  // ==================== 敌人状态 ====================
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [rerollCount, setRerollCount] = useState(0);
  const targetEnemyUid = game.targetEnemyUid;
  const targetEnemy = (() => {
    return enemies.find(e => e.uid === targetEnemyUid && e.hp > 0) || enemies.find(e => e.hp > 0) || null;
  })();
  const [selectedHandTypeInfo, setSelectedHandTypeInfo] = useState<{ name: string; description: string } | null>(null);
  const [lastTappedDieId, setLastTappedDieId] = useState<number | null>(null);

  // ==================== 敌人特效状态 ====================
  const [enemyEffects, setEnemyEffects] = useState<Record<string, InternalEnemyEffectType>>({});
  const [_dyingEnemies, setDyingEnemies] = useState<Set<string>>(new Set());
  const setEnemyEffectForUid = (uid: string, effect: InternalEnemyEffectType) => setEnemyEffects(prev => ({ ...prev, [uid]: effect }));

  const [playerEffect, setPlayerEffect] = useState<PlayerEffectType>(null);
  const [enemyInfoTarget, setEnemyInfoTarget] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [hpGained, setHpGained] = useState(false);
  const [_armorGained, setArmorGained] = useState(false);
  const [rerollFlash, setRerollFlash] = useState(false);

  // ==================== 敌人台词气泡 ====================
  const [enemyQuotes, setEnemyQuotes] = useState<Record<string, string>>({});
  const [enemyQuotedLowHp, setEnemyQuotedLowHp] = useState<Set<string>>(new Set());

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

  const pickQuote = (arr?: string[]): string | null => {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const getEnemyQuotes = (enemyId: string) => {
    const all = [...NORMAL_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];
    return all.find(e => e.id === enemyId)?.quotes;
  };

  const enemyPreAction = async (e: Enemy, quoteType: 'attack' | 'defend' | 'skill' | 'heal') => {
    const q = getEnemyQuotes(e.configId);
    const lines = q?.[quoteType] ?? q?.attack;
    const line = pickQuote(lines ?? []);
    if (line) {
      setEnemyEffectForUid(e.uid, 'speaking');
      showEnemyQuote(e.uid, line, 1800);
      playSound('enemy_speak');
      await new Promise(r => setTimeout(r, ANIMATION_TIMING.speakingEffectDuration + 200));
      setEnemyEffectForUid(e.uid, null);
      return true;
    }
    return false;
  };

  // ==================== 结算演出状态 ====================
  const [showDamageOverlay, setShowDamageOverlay] = useState<{ damage: number; armor: number; heal: number } | null>(null);
  const [settlementPhase, setSettlementPhase] = useState<SettlementPhase>(null);
  const [flashingRelicIds, setFlashingRelicIds] = useState<string[]>([]);
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null);
  const [showRelicPanel, setShowRelicPanel] = useState(false);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);

  // ==================== Toast 系统 ====================
  const [toasts, setToasts] = useState<{ id: number; message: string; type?: string }[]>([]);
  const toastIdRef = useRef(0);
  const toastCdMap = useRef<Map<string, number>>(new Map());

  const addToast = (message: string, type: 'info' | 'damage' | 'heal' | 'gold' | 'buff' = 'info') => {
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

  // ==================== 浮动文字 ====================
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; color: string; icon?: React.ReactNode; target: 'player' | 'enemy'; large?: boolean }[]>([]);
  const [_campfireView, setCampfireView] = useState<'main' | 'upgrade'>('main');
  const [skillTriggerTexts, _setSkillTriggerTexts] = useState<{ id: string; name: string; icon: React.ReactNode; color: string; x: number; delay: number }[]>([]);
  const [handLeftThrow, setHandLeftThrow] = useState(false);
  const [waveAnnouncement, setWaveAnnouncement] = useState<number | null>(null);
  const [showWaveDetail, setShowWaveDetail] = useState(false);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);

  // ==================== 战前遗物选择 ====================
  const [startingRelicChoices, setStartingRelicChoices] = useState<Relic[]>([]);
  const [pendingBattleNode, setPendingBattleNode] = useState<MapNode | null>(null);

  // ==================== 工具函数 ====================
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

  return {
    // 核心状态
    game, setGame,
    dice, setDice,
    enemies, setEnemies,
    rerollCount, setRerollCount,
    targetEnemyUid, targetEnemy,

    // UI 开关
    showHandGuide, setShowHandGuide,
    showDiceGuide, setShowDiceGuide,
    showCalcModal, setShowCalcModal,
    showClassInfo, setShowClassInfo,
    battleTransition, setBattleTransition,
    bossEntrance, setBossEntrance,
    showTutorial, setShowTutorial,

    // GM 状态
    gmPendingVictory, setGmPendingVictory,
    gmPendingNextWave, setGmPendingNextWave,

    // 骰子动画
    _diceDrawAnim, setDiceDrawAnim,
    diceDiscardAnim, _setDiceDiscardAnim,
    shuffleAnimating, setShuffleAnimating,

    // 敌人特效
    enemyEffects, setEnemyEffects,
    _dyingEnemies, setDyingEnemies,
    setEnemyEffectForUid,
    playerEffect, setPlayerEffect,
    enemyInfoTarget, setEnemyInfoTarget,
    screenShake, setScreenShake,
    hpGained, setHpGained,
    _armorGained, setArmorGained,
    rerollFlash, setRerollFlash,

    // 敌人台词
    enemyQuotes, setEnemyQuotes,
    enemyQuotedLowHp, setEnemyQuotedLowHp,
    showEnemyQuote,
    pickQuote,
    getEnemyQuotes,
    enemyPreAction,

    // 结算演出
    showDamageOverlay, setShowDamageOverlay,
    settlementPhase, setSettlementPhase,
    flashingRelicIds, setFlashingRelicIds,
    selectedRelic, setSelectedRelic,
    showRelicPanel, setShowRelicPanel,
    settlementData, setSettlementData,

    // Toast
    toasts, addToast,

    // 浮动文字
    floatingTexts,
    skillTriggerTexts,
    handLeftThrow, setHandLeftThrow,
    waveAnnouncement, setWaveAnnouncement,
    showWaveDetail, setShowWaveDetail,
    showChallengeDetail, setShowChallengeDetail,

    // 战前遗物
    startingRelicChoices, setStartingRelicChoices,
    pendingBattleNode, setPendingBattleNode,

    // 工具函数
    addFloatingText,
    addLog,
    _campfireView, setCampfireView,

    // Refs
    gameRef,
    playsPerEnemyRef,

    // 选牌 UI
    selectedHandTypeInfo, setSelectedHandTypeInfo,
    lastTappedDieId, setLastTappedDieId,
  };
}

export type BattleState = ReturnType<typeof useBattleState>;
