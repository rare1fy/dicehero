import React from 'react';
import { motion } from 'motion/react';
import { PixelSkull } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';

export const GameOverScreen: React.FC = () => {

  return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] p-6 text-center relative overflow-hidden sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
        <div className="absolute inset-0 pixel-grid-bg opacity-20" />
        <CSSParticles type="ember" count={8} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full"
        >
          <div className="flex justify-center mb-6"><PixelSkull size={8} /></div>
          <h1 className="text-3xl font-black mb-5 text-[var(--pixel-red)] pixel-text-shadow tracking-wide">◆ 意识消散 ◆</h1>
          <p className="text-[var(--dungeon-text-dim)] mb-10 max-w-xs mx-auto leading-relaxed text-[11px]">你在永夜的深处迷失了方向，所有的记忆与意志都化为了虚无...</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full max-w-[220px] mx-auto py-3 pixel-btn pixel-btn-danger text-sm block"
          >
            ▶ 重塑意识
          </button>
        </motion.div>
      </div>
  );
};
