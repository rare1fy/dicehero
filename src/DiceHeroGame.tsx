/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// 像素图标组件 — 替代所有 lucide-react 和 emoji
import { PixelDice } from './components/PixelIcons';
import { motion, AnimatePresence } from 'motion/react';

// --- Modular Imports ---
import type { MapNode, Relic } from './types/game';
import { ALL_RELICS } from './data/relics';
import { createInitialGameState } from './logic/gameInit';
import { formatDescription } from './utils/richText';
import { GameContext } from './contexts/GameContext';
import { BattleContext } from './contexts/BattleContext';
import type { BattleContextType } from './contexts/BattleContext';
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
import { ClassSelectScreen } from './components/ClassSelectScreen';
import { SkillSelectScreen } from './components/SkillSelectScreen';
import { ChapterTransition } from './components/ChapterTransition';
import { BossEntrance } from './components/BossEntrance';
import { ClassInfoModal } from './components/ClassInfoModal';
import CalcModal from './components/CalcModal';
import { HandGuideModal } from './components/HandGuideModal';
import { DiceGuideModal } from './components/DiceGuideModal';
import { ReplacementModal } from './components/ReplacementModal';
import { ToastDisplay } from './components/ToastDisplay';
import { RelicDetailModal } from './components/RelicPanelView';
import { BattleSceneView } from './components/BattleSceneView';

// --- Hooks ---
import { useBattleState } from './hooks/useBattleState';
import { useBattleLifecycle } from './hooks/useBattleLifecycle';
import { useBattleCombat } from './hooks/useBattleCombat';

// --- Context Builders ---
import { buildGameContext, buildBattleContext } from './contexts/contextBuilders';

const META_KEY = 'dicehero_meta';
const loadMeta = () => {
  try { const raw = localStorage.getItem(META_KEY); if (raw) return JSON.parse(raw); } catch {}
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
};

export default function DiceHeroGame() {
  // === Phase G: 战斗状态聚合 ===
  const state = useBattleState();

  // === Phase H: 战斗生命周期 ===
  const lifecycle = useBattleLifecycle(state);

  // === Phase I: 战斗逻辑 ===
  const combat = useBattleCombat(state, lifecycle);

  // === Phase J: Context 构建 ===
  const contextValue = buildGameContext(state, lifecycle, combat);
  const battleContextValue: BattleContextType = buildBattleContext(state, lifecycle, combat);

  // 解构 JSX 需要的状态
  const { game, setGame, enemies, dice, targetEnemy,
    battleTransition, bossEntrance,
    showCalcModal, setShowCalcModal,
    showClassInfo, setShowClassInfo,
    selectedHandTypeInfo, setSelectedHandTypeInfo,
  } = state;

  const { expectedOutcome } = combat;

  // === 早期返回：特殊 phase ===
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
    console.log('[RENDER_GAMEOVER] phase=', game.phase, 'hp=', game.hp, 'callstack=', new Error('render gameover').stack?.substring(0,500));
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

  // === 主渲染：battle / map / merchant / campfire / event / ... ===
  return (
    <GameContext.Provider value={contextValue}>
    <BattleContext.Provider value={battleContextValue}>
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

        {/* 战前技能模块选择界面 */}
        {game.phase === 'skillSelect' && <SkillSelectScreen />}

        {/* 战斗场景 */}
        {game.phase === 'battle' && enemies.length > 0 && (
          <BattleSceneView />
        )}

      {/* RelicDetailModal */}
      <RelicDetailModal />

      {/* Calculation Modal */}
      <CalcModal
        visible={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        expectedOutcome={expectedOutcome}
        selectedDice={dice.filter(d => d.selected && !d.spent)}
        game={game}
        targetEnemy={targetEnemy}
      />

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
      </AnimatePresence>

      {/* 职业信息弹窗 */}
      <ClassInfoModal visible={showClassInfo} onClose={() => setShowClassInfo(false)} classId={game.playerClass} />

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
</BattleContext.Provider>
</GameContext.Provider>
  );
}
