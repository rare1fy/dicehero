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
import { onDeferredFloat, emitDeferredFloat, isRewardBusy } from '../logic/rewardEvents';

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
  // [BOSS-TAUNT 2026-05-08] 战斗开场挑衅短演出：Boss 本尊登场 + 两句挑衅台词，在 BossEntrance 横幅之前播放
  const [bossTaunt, setBossTaunt] = useState<{ visible: boolean; name: string; chapter: number; lines: string[]; onDismiss?: () => void }>({ visible: false, name: '', chapter: 1, lines: [] });
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
  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;
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
  /** [2026-05-09] Boss phase2 气泡专用 set（70% 阈值触发一次） */
  const [enemyQuotedPhase2, setEnemyQuotedPhase2] = useState<Set<string>>(new Set());

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

  /**
   * [2026-05-08] 短期不重复缓存：保存最近用过的台词字符串，下一次抽取尽量避开。
   * 容量 = 16，用 ref 存避免引起重渲染。Boss 台词系统重度依赖此机制减少重复感。
   */
  const recentQuotesRef = useRef<string[]>([]);
  const recordRecentQuote = (s: string) => {
    const arr = recentQuotesRef.current;
    arr.push(s);
    if (arr.length > 16) arr.shift();
  };

  /**
   * pickQuote — 从池中随机取一条台词。
   * 优先从"未在最近 16 条记录中"的候选里抽；如果池子里所有项都已用过，回退到全池随机（避免无限循环）。
   * 不传池或池为空时返回 null。
   */
  const pickQuote = (arr?: string[]): string | null => {
    if (!arr || arr.length === 0) return null;
    const recent = recentQuotesRef.current;
    const fresh = arr.filter(s => !recent.includes(s));
    const pool = fresh.length > 0 ? fresh : arr;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    recordRecentQuote(picked);
    return picked;
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
  const [toasts, setToasts] = useState<{ id: number; message: string; type?: string; icon?: 'gold' | 'dice' | 'relic' | 'remove' | 'check' | 'star' | 'shuffle'; relicId?: string }[]>([]);
  const toastIdRef = useRef(0);
  const toastCdMap = useRef<Map<string, number>>(new Map());

  const addToast = (
    message: string,
    type: 'info' | 'damage' | 'heal' | 'gold' | 'buff' = 'info',
    options?: { icon?: 'gold' | 'dice' | 'relic' | 'remove' | 'check' | 'star' | 'shuffle'; relicId?: string }
  ) => {
    // [TOAST-FILTER 2026-05-08] 刘叔要求：屏蔽"获得类" toast（太频繁）。
    // [TOAST-ICON 2026-05-09] 带 icon 的 toast 属于业务明确通知，不受"获得"过滤影响。
    if (!options?.icon && /获得/.test(message)) return;
    const now = Date.now();
    const lastTime = toastCdMap.current.get(message) || 0;
    if (now - lastTime < 3000) return;
    toastCdMap.current.set(message, now);

    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type, icon: options?.icon, relicId: options?.relicId }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  // ==================== 浮动文字 ====================
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; color: string; icon?: React.ReactNode; target: 'player' | 'enemy'; large?: boolean }[]>([]);
  // [FLOAT-DEDUP 2026-05-08] 防 StrictMode/updater 内副作用双触发：
  // 1) 短时间内 (<120ms) 同 target 且 text+color 完全相同的飘字去重
  // 2) 按 target 分队列排 lane，避免新旧飘字堆叠
  const floatDedupRef = useRef<Map<string, number>>(new Map());
  const floatLaneRef = useRef<{ player: number; enemy: number }>({ player: 0, enemy: 0 });
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
    // [REWARD-GATE v2] 金色奖励飘字（text-amber-200）在 overlay 显示期间自动走闸门堆积。
    // 判据是 isRewardBusy()（= showDamageOverlay !== null），不碰 phase3 的紫色/黄色演出飘字。
    // 事件/商店/回合开始等非出牌场景 busy=false，直通。
    if (!large && color === 'text-amber-200' && isRewardBusy()) {
      emitDeferredFloat(text, color, icon, target);
      return;
    }

    // [DEDUP] 防 StrictMode 下 setGame updater 内部调 addFloatingText 被双触发
    // 同 target + 同 text + 同 color 在 150ms 内只发一次
    const key = `${target}|${text}|${color}`;
    const now = Date.now();
    const last = floatDedupRef.current.get(key) || 0;
    if (now - last < 150) return;
    floatDedupRef.current.set(key, now);
    // 定期清理 dedup map
    if (floatDedupRef.current.size > 40) {
      floatDedupRef.current.forEach((t, k) => { if (now - t > 2000) floatDedupRef.current.delete(k); });
    }

    // [LANE] 按 target 分队列错开，避免堆叠。横向在 ±80px 内轮转，纵向每条向下偏移 34px。
    const lane = floatLaneRef.current[target];
    floatLaneRef.current[target] = (lane + 1) % 6;
    // lane 0..5 对应 横向 -80/-48/-16/16/48/80，加 ±6px 随机抖动避免完全重合
    const xBase = (lane - 2.5) * 32;
    const x = xBase + (Math.random() * 12 - 6);
    // 纵向间距 34px（之前 18px 偏紧，两条接连冒出会贴死）
    const y = (lane % 3) * 34 + (Math.random() * 6 - 3);

    const id = `${now}-${Math.random()}`;
    setFloatingTexts(prev => [...prev, { id, text, x, y, color, icon, target, large }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, large ? 3500 : 2200);
  };

  const addLog = (msg: string) => {
    setGame(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 15) }));
  };

  // [REWARD-GATE v2] 订阅"延迟飘字"闸门：
  // 业务侧调用 emitDeferredFloat() 的飘字会在 showDamageOverlay 显示期间堆积，
  // overlay 关闭瞬间 flush 回调到这里 → 走 addFloatingText 正常渲染。
  useEffect(() => {
    const off = onDeferredFloat((text, color, icon, target) => {
      addFloatingText(text, color, icon as React.ReactNode, target);
    });
    return () => { off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    bossTaunt, setBossTaunt,
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
    enemyQuotedPhase2, setEnemyQuotedPhase2,
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
    enemiesRef,

    // 选牌 UI
    selectedHandTypeInfo, setSelectedHandTypeInfo,
    lastTappedDieId, setLastTappedDieId,
  };
}

export type BattleState = ReturnType<typeof useBattleState>;
