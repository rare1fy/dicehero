/**
 * FloorSettlementScreen.tsx - Floor Settlement UI
 *
 * Displayed after completing a floor. Shows:
 * 1. Floor completion summary
 * 2. Three reward choices (pick one)
 * 3. Post-floor random event
 * 4. Advance to next floor button
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import {
  PixelHeart, PixelCoin, PixelDice, PixelStar,
  PixelArrowUp, PixelTreasure, PixelRefresh,
  PixelSword, PixelShield, PixelMerchant,
  PixelCampfire, PixelQuestion, PixelMagic,
} from './PixelIcons';
import type { LoopFloorTheme } from '../types/game';

// ============================================================
// Theme Config
// ============================================================

const themeNames: Record<LoopFloorTheme, string> = {
  forge: '熔炉层',
  bazaar: '集市层',
  sanctum: '圣域层',
  boss: 'Boss 层',
};

const themeColors: Record<LoopFloorTheme, string> = {
  forge: 'var(--pixel-red)',
  bazaar: 'var(--pixel-green)',
  sanctum: 'var(--pixel-blue)',
  boss: 'var(--pixel-purple)',
};

// Reward icon mapping
const rewardIcons: Record<string, React.ReactNode> = {
  heal: <PixelHeart size={3} />,
  gold: <PixelCoin size={3} />,
  upgrade_die: <PixelDice size={3} />,
  free_reroll: <PixelRefresh size={3} />,
  max_hp: <PixelShield size={3} />,
  draw_count: <PixelArrowUp size={3} />,
};

// Post-event icon mapping
const eventIcons: Record<string, React.ReactNode> = {
  merchant: <PixelMerchant size={3} />,
  gamble: <PixelCoin size={3} />,
  shrine: <PixelMagic size={3} />,
  nothing: <PixelQuestion size={3} />,
};

// ============================================================
// Settlement Phases
// ============================================================

type SettlementPhase = 'summary' | 'rewards' | 'post_event' | 'done';

// ============================================================
// Component
// ============================================================

export const FloorSettlementScreen: React.FC = () => {
  const { game, applyFloorReward, resolveFloorPostEvent, advanceToNextFloor } = useGameContext();
  const [phase, setPhase] = useState<SettlementPhase>('summary');
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [eventResolved, setEventResolved] = useState(false);

  const floor = game.loopFloors[game.currentFloorIndex];
  if (!floor) return null;

  const theme = floor.theme;
  const isLastFloor = game.currentFloorIndex >= game.loopFloors.length - 1;

  // Parse reward options from game state
  const rewardOptions = useMemo(() => {
    return game.floorRewardOptions || [];
  }, [game.floorRewardOptions]);

  // Parse post event from settlement seed
  const postEvent = useMemo(() => {
    return game.currentPostEvent || null;
  }, [game.currentPostEvent]);

  const handlePickReward = (rewardId: string) => {
    if (selectedReward) return;
    setSelectedReward(rewardId);
    applyFloorReward(rewardId);
    // Auto advance to post event after short delay
    setTimeout(() => {
      setPhase('post_event');
    }, 800);
  };

  const handleResolveEvent = () => {
    if (eventResolved) return;
    setEventResolved(true);
    resolveFloorPostEvent();
    setTimeout(() => {
      setPhase('done');
    }, 600);
  };

  const handleAdvance = () => {
    advanceToNextFloor();
  };

  return (
    <div className="flex flex-col h-full map-bg-dungeon text-[var(--dungeon-text)] relative overflow-hidden">
      <div className="absolute inset-0 pixel-dither-overlay" />

      {/* Header */}
      <div className="relative z-20 p-4 pt-3 text-center"
        style={{ background: 'linear-gradient(to bottom, #0c1018 40%, transparent)' }}>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black tracking-wider pixel-text-shadow"
          style={{ color: themeColors[theme] }}
        >
          {themeNames[theme]} 完成！
        </motion.h2>
        <p className="text-[10px] text-[var(--dungeon-text-dim)] mt-1 tracking-widest">
          第 {floor.floorIndex + 1} 层 · 移动点数 {floor.totalMovePoints} · 战斗 {floor.battleCount} 场
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pb-24">
        <AnimatePresence mode="wait">
          {/* Phase 1: Summary */}
          {phase === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="mb-6">
                <PixelTreasure size={6} />
              </div>
              <p className="text-base text-[var(--dungeon-text-bright)] mb-2 font-bold">
                层结算奖励
              </p>
              <p className="text-[10px] text-[var(--dungeon-text-dim)] mb-6">
                选择一个奖励带往下一层
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPhase('rewards')}
                className="px-8 py-3 font-black tracking-wider border-3 bg-[#1a1e2e] border-[var(--pixel-gold)] text-[var(--pixel-gold)] hover:bg-[#252a3a] cursor-pointer"
                style={{ borderRadius: '2px' }}
              >
                查看奖励
              </motion.button>
            </motion.div>
          )}

          {/* Phase 2: Reward Selection */}
          {phase === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-sm"
            >
              <p className="text-center text-sm font-bold text-[var(--dungeon-text-bright)] mb-4 tracking-wider">
                三选一
              </p>
              <div className="flex flex-col gap-3">
                {rewardOptions.map((rewardId, idx) => {
                  const reward = getRewardById(rewardId);
                  if (!reward) return null;
                  const isSelected = selectedReward === rewardId;
                  const isDisabled = selectedReward !== null && !isSelected;

                  return (
                    <motion.button
                      key={rewardId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: isDisabled ? 0.3 : 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={!isDisabled && !isSelected ? { scale: 1.02 } : {}}
                      whileTap={!isDisabled && !isSelected ? { scale: 0.98 } : {}}
                      onClick={() => handlePickReward(rewardId)}
                      disabled={isDisabled}
                      className={`flex items-center gap-4 p-4 border-3 transition-all w-full text-left
                        ${isSelected
                          ? 'bg-[#1a2a1e] border-[var(--pixel-green)] text-[var(--pixel-green)]'
                          : isDisabled
                            ? 'bg-[#0d1117] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)] cursor-not-allowed'
                            : 'bg-[#1a1e2e] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-bright)] hover:border-[var(--pixel-gold)] cursor-pointer'
                        }
                      `}
                      style={{ borderRadius: '2px' }}
                    >
                      <div className="flex-shrink-0" style={{ color: isSelected ? 'var(--pixel-green)' : 'var(--pixel-gold)' }}>
                        {rewardIcons[reward.type] || <PixelStar size={3} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm tracking-wider">{reward.label}</p>
                        <p className="text-[10px] mt-0.5 opacity-70">{reward.description}</p>
                      </div>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[var(--pixel-green)] font-black text-lg"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Phase 3: Post-floor Event */}
          {phase === 'post_event' && (
            <motion.div
              key="post_event"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-sm"
            >
              <p className="text-sm font-bold text-[var(--dungeon-text-bright)] mb-4 tracking-wider">
                层后事件
              </p>
              {postEvent ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 border-3 border-[var(--dungeon-panel-border)] bg-[#1a1e2e]"
                  style={{ borderRadius: '2px' }}
                >
                  <div className="mb-3" style={{ color: 'var(--pixel-gold)' }}>
                    {eventIcons[postEvent.type] || <PixelQuestion size={3} />}
                  </div>
                  <p className="font-bold text-base text-[var(--pixel-gold)] mb-1">{postEvent.label}</p>
                  <p className="text-[10px] text-[var(--dungeon-text-dim)] mb-4">{postEvent.description}</p>
                  {!eventResolved ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResolveEvent}
                      className="px-6 py-2 font-bold tracking-wider border-2 bg-[#1a1e2e] border-[var(--pixel-gold)] text-[var(--pixel-gold)] hover:bg-[#252a3a] cursor-pointer"
                      style={{ borderRadius: '2px' }}
                    >
                      确认
                    </motion.button>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[var(--pixel-green)] font-bold"
                    >
                      ✓ 已解决
                    </motion.p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 border-3 border-[var(--dungeon-panel-border)] bg-[#1a1e2e]"
                  style={{ borderRadius: '2px' }}
                >
                  <div className="mb-3" style={{ color: 'var(--dungeon-text-dim)' }}>
                    <PixelQuestion size={3} />
                  </div>
                  <p className="text-sm text-[var(--dungeon-text-dim)]">什么也没发生...</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPhase('done')}
                    className="mt-4 px-6 py-2 font-bold tracking-wider border-2 bg-[#1a1e2e] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)] hover:border-[var(--pixel-gold)] hover:text-[var(--pixel-gold)] cursor-pointer"
                    style={{ borderRadius: '2px' }}
                  >
                    继续
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Phase 4: Done - Advance */}
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="mb-4" style={{ color: 'var(--pixel-gold)' }}>
                <PixelArrowUp size={5} />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdvance}
                className="px-10 py-4 font-black tracking-wider text-lg border-3 bg-[#1a1e2e] border-[var(--pixel-gold)] text-[var(--pixel-gold)] hover:bg-[#252a3a] cursor-pointer"
                style={{ borderRadius: '2px' }}
              >
                {isLastFloor ? '进入下一章' : '前往下一层'}
              </motion.button>
              <p className="text-[10px] text-[var(--dungeon-text-dim)] mt-3 tracking-widest">
                {isLastFloor ? '准备迎接新的挑战...' : `下一层: 第 ${floor.floorIndex + 2} 层`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4"
        style={{ background: 'linear-gradient(to top, #0c1018 50%, transparent)' }}>
        <div className="flex justify-center items-center gap-6">
          <div className="flex items-center gap-1.5">
            <PixelHeart size={2} />
            <span className="font-mono font-bold text-base text-[var(--dungeon-text-bright)] pixel-text-shadow">{game.hp}</span>
          </div>
          <div className="h-4 w-[2px] bg-[var(--dungeon-panel-border)]" />
          <div className="flex items-center gap-1.5 text-[var(--pixel-gold)]">
            <PixelCoin size={2} />
            <span className="font-mono font-bold text-base pixel-text-shadow">{game.souls}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Helper: Get reward definition by ID
// ============================================================

import { FLOOR_REWARD_POOL } from '../config/loopFloors';

function getRewardById(id: string) {
  return FLOOR_REWARD_POOL.find(r => r.id === id) || null;
}
