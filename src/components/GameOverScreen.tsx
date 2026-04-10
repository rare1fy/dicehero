import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PixelSkull, PixelSoulCrystal } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';
import { useGameContext } from '../contexts/GameContext';

const META_KEY = 'dicehero_meta';
const loadMeta = () => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
};
const saveMeta = (meta: any) => {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* ignore */ }
};

export const GameOverScreen: React.FC = () => {
  const { game, resetGame } = useGameContext();
  const lostQuota = game.blackMarketQuota || 0;
  const savedQuota = game.evacuatedQuota || 0;

  useEffect(() => {
    const meta = loadMeta();
    if (savedQuota > 0) {
      meta.permanentQuota = (meta.permanentQuota || 0) + savedQuota;
    }
    meta.totalRuns = (meta.totalRuns || 0) + 1;
    if ((game.totalOverkillThisRun || 0) > (meta.highestOverkill || 0)) {
      meta.highestOverkill = game.totalOverkillThisRun || 0;
    }
    saveMeta(meta);
  }, []);

  const returnToTitle = () => {
    resetGame();
  };

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
        <h1 className="text-3xl font-black mb-3 text-[var(--pixel-red)] pixel-text-shadow tracking-wide">◆ 黑夜吞噬 ◆</h1>
        <p className="text-[var(--dungeon-text-dim)] mb-4 max-w-xs mx-auto leading-relaxed text-[11px]">永夜降临，黑暗将你彻底吞噬。骰子停止了转动，光芒在无尽的深渊中熄灭...</p>
        
        {(lostQuota > 0 || savedQuota > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 p-3 border border-purple-500/30 bg-purple-900/20 max-w-xs mx-auto"
            style={{ borderRadius: '4px' }}
          >
            <div className="text-[10px] text-purple-300 font-bold mb-2 flex items-center justify-center gap-1">
              <PixelSoulCrystal size={2} /> {'\u9B42\u6676\u7ED3\u7B97'}
            </div>
            {lostQuota > 0 && (
              <div className="text-[9px] text-red-400">
                {'\u672A\u64A4\u79BB\u9B42\u6676'}: <span className="font-bold">-{lostQuota}</span> ({'\u5DF2\u6E05\u96F6'})
              </div>
            )}
            {savedQuota > 0 && (
              <div className="text-[9px] text-green-400">
                {'\u5DF2\u64A4\u79BB\u9B42\u6676'}: <span className="font-bold">+{savedQuota}</span> ({'\u5DF2\u5B58\u5165\u6C38\u4E45\u8D26\u6237'})
              </div>
            )}
            <div className="text-[8px] text-[var(--dungeon-text-dim)] mt-1">
              {'\u6C38\u4E45\u8D26\u6237\u4F59\u989D'}: {loadMeta().permanentQuota}
            </div>
          </motion.div>
        )}

        <button 
          onClick={returnToTitle}
          className="w-full max-w-[220px] mx-auto py-3 pixel-btn pixel-btn-danger text-sm block"
        >
          {'\u25B6 \u8FD4\u56DE\u4E3B\u9875'}
        </button>
      </motion.div>
    </div>
  );
};