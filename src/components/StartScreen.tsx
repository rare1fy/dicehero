import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelDice, PixelBook, PixelHeart, PixelRefresh, PixelPlay, PixelSoulCrystal } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';
import { TutorialOverlay, isTutorialCompleted } from './TutorialOverlay';
import { SoulShop } from './SoulShop';
import { ALL_RELICS } from '../data/relics';

const META_KEY = 'dicehero_meta';
const loadMeta = () => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
};

export const StartScreen: React.FC = () => {
  const { game, setGame, showTutorial, setShowTutorial } = useGameContext();
  const [showSoulShop, setShowSoulShop] = useState(false);

  const startGame = () => {
    // 加载已解锁的常驻遗物
    const meta = loadMeta();
    const startRelics = (meta.unlockedStartRelics || [])
      .map((id: string) => ALL_RELICS[id])
      .filter(Boolean);

    if (startRelics.length > 0) {
      setGame(prev => ({
        ...prev,
        phase: 'map',
        relics: [...prev.relics, ...startRelics],
      }));
    } else {
      setGame(prev => ({ ...prev, phase: 'map' }));
    }
  };

  const meta = loadMeta();

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] p-6 overflow-hidden relative sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
      <div className="absolute inset-0 pixel-grid-bg opacity-30" />
      <div className="absolute inset-0 dungeon-bg" />
      <CSSParticles type="sparkle" count={6} />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-center w-full"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-4 flex justify-center"
        >
          <PixelDice size={4} />
        </motion.div>
        
        <h1 className="text-4xl font-black tracking-tight mb-3 pixel-text-shadow" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.9), 0 0 20px rgba(224,120,48,0.3)' }}>
          <span className="text-[var(--dungeon-text-bright)]">DICE</span>
          <span className="text-[var(--pixel-green)]"> BATTLE</span>
        </h1>
        <p className="text-[var(--pixel-gold)] text-[10px] tracking-[0.25em] mb-3 pixel-text-shadow">{'\u25C6 \u9A78 \u6218 \u00B7 \u6C38 \u591C \u4E4B \u9003 \u25C6'}</p>
        <p className="text-[var(--dungeon-text-dim)] text-[8px] mb-10">{'\u2014 Roguelike \u9AB0\u5B50\u6784\u7B51 \u2014'}</p>
        
        {/* 开始按钮 */}
        <button 
          onClick={() => {
            if (!isTutorialCompleted()) {
              setShowTutorial(true);
            } else {
              startGame();
            }
          }}
          className="group relative w-full max-w-[220px] mx-auto py-3 pixel-btn pixel-btn-primary text-sm block mb-4"
        >
          <span className="relative z-10">{'\u25B6 \u5F00\u542F\u5F81\u7A0B'}</span>
        </button>

        {/* 魂晶商店按钮 */}
        <button
          onClick={() => setShowSoulShop(true)}
          className="group relative w-full max-w-[220px] mx-auto py-2.5 pixel-btn text-sm block mb-5 border-purple-500/50 hover:border-purple-400 transition-colors"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-purple-300">
            <PixelSoulCrystal size={2} />
            {'\u9B42\u6676\u5546\u5E97'}
            {meta.permanentQuota > 0 && (
              <span className="text-[9px] text-purple-400 font-mono">({meta.permanentQuota})</span>
            )}
          </span>
        </button>

        {/* 教程按钮 */}
        <button
          onClick={() => setShowTutorial(true)}
          className="text-[var(--dungeon-text-dim)] hover:text-[var(--pixel-green)] text-[9px] transition-colors mb-8 flex items-center gap-1 mx-auto"
        >
          <PixelBook size={2} /> {'\u67E5\u770B\u6559\u7A0B'}
        </button>

        <div className="flex gap-3 justify-center opacity-50 text-[9px] flex-wrap text-[var(--dungeon-text-dim)]">
          <div className="flex items-center gap-1"><PixelHeart size={2} /> {game.maxHp}</div>
          <div className="flex items-center gap-1"><PixelRefresh size={2} /> {game.globalRerolls}</div>
          <div className="flex items-center gap-1"><PixelDice size={2} /> {game.diceCount}</div>
          <div className="flex items-center gap-1"><PixelPlay size={2} /> {game.maxPlays}</div>
          {meta.unlockedStartRelics.length > 0 && (
            <div className="flex items-center gap-1 text-purple-400">
              <PixelSoulCrystal size={2} /> {meta.unlockedStartRelics.length}{'\u5E38\u9A7B'}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* 教程覆盖层 */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onComplete={() => {
            setShowTutorial(false);
            startGame();
          }} />
        )}
      </AnimatePresence>

      {/* 魂晶商店 */}
      <AnimatePresence>
        {showSoulShop && <SoulShop onClose={() => setShowSoulShop(false)} ownedRelicIds={game.relics.map(r => r.id)} />}
      </AnimatePresence>
    </div>
  );
};