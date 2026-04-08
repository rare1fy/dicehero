import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PixelSkull } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';
import { useGameContext } from '../contexts/GameContext';

/** 读取/保存Meta-Progression到localStorage */
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
  const { game } = useGameContext();
  const lostQuota = game.blackMarketQuota || 0;
  const savedQuota = game.evacuatedQuota || 0;

  // 死亡时：已撤离配额保存到永久存储，未撤离的清零
  useEffect(() => {
    if (savedQuota > 0) {
      const meta = loadMeta();
      meta.permanentQuota = (meta.permanentQuota || 0) + savedQuota;
      meta.totalRuns = (meta.totalRuns || 0) + 1;
      if ((game.totalOverkillThisRun || 0) > (meta.highestOverkill || 0)) {
        meta.highestOverkill = game.totalOverkillThisRun || 0;
      }
      saveMeta(meta);
    }
  }, []);

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
          <h1 className="text-3xl font-black mb-3 text-[var(--pixel-red)] pixel-text-shadow tracking-wide">◆ 意识消散 ◆</h1>
          <p className="text-[var(--dungeon-text-dim)] mb-4 max-w-xs mx-auto leading-relaxed text-[11px]">你在永夜的深处迷失了方向，所有的记忆与意志都化为了虚无...</p>
          
          {/* 魂晶结算 */}
          {(lostQuota > 0 || savedQuota > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-3 border border-purple-500/30 bg-purple-900/20 max-w-xs mx-auto"
              style={{ borderRadius: '4px' }}
            >
              <div className="text-[10px] text-purple-300 font-bold mb-2">💠 魂晶结算</div>
              {lostQuota > 0 && (
                <div className="text-[9px] text-red-400">
                  未撤离配额: <span className="font-bold">-{lostQuota}</span> (已清零)
                </div>
              )}
              {savedQuota > 0 && (
                <div className="text-[9px] text-green-400">
                  已撤离配额: <span className="font-bold">+{savedQuota}</span> (已存入永久账户)
                </div>
              )}
              <div className="text-[8px] text-[var(--dungeon-text-dim)] mt-1">
                永久账户余额: {loadMeta().permanentQuota}
              </div>
            </motion.div>
          )}

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