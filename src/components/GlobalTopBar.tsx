import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelCoin, PixelRefresh, PixelPlay, PixelSword } from './PixelIcons';
import { CHAPTER_CONFIG } from '../config';
import { StatsModal } from './StatsModal';
import { SettingsPanel } from './SettingsPanel';

export const GlobalTopBar: React.FC = () => {
  const { game, setShowTutorial, setShowHandGuide, setShowDiceGuide } = useGameContext();
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="flex justify-between items-center px-3 py-1.5 bg-[var(--dungeon-bg-light)] border-b-3 border-[var(--dungeon-panel-border)] z-30 shrink-0">
      <div className="flex items-center gap-1.5">
        {/* Chapter */}
        <div className="flex items-center gap-1 text-[var(--pixel-orange-light)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>
          <span className="font-bold">{game.chapter}-{CHAPTER_CONFIG.chapterNames[(game.chapter || 1) - 1]}</span>
        </div>
        <div className="w-[2px] h-4 bg-[var(--dungeon-panel-border)]" />
        {/* Gold */}
        <div className="flex items-center gap-1 text-[var(--pixel-gold)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative group cursor-help" style={{borderRadius:'2px'}}>
          <PixelCoin size={2} /> <span className="font-bold">{game.souls}</span>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-gold)] px-2 py-1 text-[8px] text-[var(--pixel-gold-light)] whitespace-nowrap z-50 pixel-text-shadow" style={{borderRadius:'2px'}}>
            金币 — 用于商店购买
          </div>
        </div>

        {/* Total Damage */}
        <div className="w-[2px] h-4 bg-[var(--dungeon-panel-border)]" />
        <button
          onClick={() => setShowStats(true)}
          className="flex items-center gap-1 text-[var(--pixel-red)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative group cursor-pointer hover:border-[var(--pixel-red)] transition-colors"
          style={{borderRadius:'2px'}}
        >
          <PixelSword size={2} /> <span className="font-bold">{game.stats.totalDamageDealt}</span>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-red)] px-2 py-1 text-[8px] text-[var(--pixel-red-light)] whitespace-nowrap z-50 pixel-text-shadow" style={{borderRadius:'2px'}}>
            总伤害 — 点击查看详细统计
          </div>
        </button>

        
        
        {/* Battle-specific: Plays & Free Rerolls */}
        {true && (
          <>
            <div className="w-[2px] h-4 bg-[var(--dungeon-panel-border)]" />
            <div className="flex items-center gap-1 text-[var(--pixel-red)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative group cursor-help" style={{borderRadius:'2px'}}>
              <PixelPlay size={2} /> <span className="font-bold">{game.playsLeft}/{game.maxPlays}</span>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-red)] px-2 py-1 text-[8px] text-[var(--pixel-red-light)] whitespace-nowrap z-50 pixel-text-shadow" style={{borderRadius:'2px'}}>
                出牌次数 — 每回合可出牌次数
              </div>
            </div>
            <div className="flex items-center gap-1 text-[var(--pixel-green)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative group cursor-help" style={{borderRadius:'2px'}}>
              <PixelRefresh size={2} /> <span className="font-bold">{game.freeRerollsLeft}</span>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-green)] px-2 py-1 text-[8px] text-[var(--pixel-green-light)] whitespace-nowrap z-50 pixel-text-shadow" style={{borderRadius:'2px'}}>
                重掷机会 — 本回合剩余重掷次数
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <SettingsPanel onResetTutorial={() => setShowTutorial(true)} onOpenHandGuide={() => setShowHandGuide(true)} onOpenDiceGuide={() => setShowDiceGuide(true)} />
      </div>
      <AnimatePresence>
        {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      </AnimatePresence>
    </div>
  );
};
