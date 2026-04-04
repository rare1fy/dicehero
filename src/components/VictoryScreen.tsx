import React from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelTrophy } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';

export const VictoryScreen: React.FC = () => {
  const { game } = useGameContext();

  return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] p-6 text-center relative overflow-hidden sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
        <div className="absolute inset-0 pixel-grid-bg opacity-20" />
        <CSSParticles type="sparkle" count={10} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full"
        >
          <div className="flex justify-center mb-6"><PixelTrophy size={8} /></div>
          <h1 className="text-3xl font-black mb-5 text-[var(--pixel-green)] pixel-text-shadow tracking-wide">◆ 黎明已至 ◆</h1>
          <p className="text-[var(--dungeon-text-dim)] mb-10 max-w-xs mx-auto leading-relaxed text-[11px]">你成功穿越了永夜，带回了希望的火种。世界将记住你的名字。</p>
          
          <div className="pixel-panel p-5 w-full max-w-xs mb-8 mx-auto text-center">
            <div className="text-[9px] text-[var(--dungeon-text-dim)] mb-2">◆ 最终金币评价 ◆</div>
            <div className="text-4xl font-bold text-[var(--pixel-gold)] pixel-text-shadow">{game.souls}</div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full max-w-[220px] mx-auto py-3 pixel-btn pixel-btn-primary text-sm block"
          >
            ▶ 再续传奇
          </button>
        </motion.div>
      </div>
  );
};
