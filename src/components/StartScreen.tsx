import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelDice, PixelBook, PixelHeart, PixelRefresh, PixelPlay } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';
import { TutorialOverlay, isTutorialCompleted } from './TutorialOverlay';

export const StartScreen: React.FC = () => {
  const { game, setGame, showTutorial, setShowTutorial } = useGameContext();

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] p-6 overflow-hidden relative sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
      {/* 像素暗纹背景 */}
      <div className="absolute inset-0 pixel-grid-bg opacity-30" />
      <div className="absolute inset-0 dungeon-bg" />
      
      {/* 像素浮动粒子 */}
      <CSSParticles type="sparkle" count={6} />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-center w-full"
      >
        {/* 像素骰子图标 */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-4 flex justify-center"
        >
          <PixelDice size={4} />
        </motion.div>
        
        {/* 像素标题 */}
        <h1 className="text-4xl font-black tracking-tight mb-3 pixel-text-shadow" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.9), 0 0 20px rgba(224,120,48,0.3)' }}>
          <span className="text-[var(--dungeon-text-bright)]">DICE</span>
          <span className="text-[var(--pixel-green)]"> BATTLE</span>
        </h1>
        <p className="text-[var(--pixel-gold)] text-[10px] tracking-[0.25em] mb-3 pixel-text-shadow">◆ 骰 战 · 永 夜 之 途 ◆</p>
        <p className="text-[var(--dungeon-text-dim)] text-[8px] mb-12">— Roguelike 骰子构筑 —</p>
        
        {/* 像素开始按钮 */}
        <button 
          onClick={() => {
            if (!isTutorialCompleted()) {
              setShowTutorial(true);
            } else {
              setGame(prev => ({ ...prev, phase: 'map' }));
            }
          }}
          className="group relative w-full max-w-[220px] mx-auto py-3 pixel-btn pixel-btn-primary text-sm block mb-5"
        >
          <span className="relative z-10">▶ 开启征程</span>
        </button>

        {/* 教程按钮 */}
        <button
          onClick={() => setShowTutorial(true)}
          className="text-[var(--dungeon-text-dim)] hover:text-[var(--pixel-green)] text-[9px] transition-colors mb-8 flex items-center gap-1 mx-auto"
        >
          <PixelBook size={2} /> 查看教程
        </button>

        <div className="flex gap-3 justify-center opacity-50 text-[9px] flex-wrap text-[var(--dungeon-text-dim)]">
          <div className="flex items-center gap-1"><PixelHeart size={2} /> {game.maxHp}</div>
          <div className="flex items-center gap-1"><PixelRefresh size={2} /> {game.globalRerolls}</div>
          <div className="flex items-center gap-1"><PixelDice size={2} /> {game.diceCount}</div>
          <div className="flex items-center gap-1"><PixelPlay size={2} /> {game.maxPlays}</div>
        </div>
      </motion.div>
      
      {/* 教程覆盖层 */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onComplete={() => {
            setShowTutorial(false);
            setGame(prev => ({ ...prev, phase: 'map' }));
          }} />
        )}
      </AnimatePresence>
    </div>
  );
};
