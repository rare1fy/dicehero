/**
 * 增幅替换模态框
 */
import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';
import { PixelZap, PixelCoin } from './PixelIcons';
import { formatDescription } from '../utils/richText';

export const ReplacementModal: React.FC = () => {
  const { game, setGame, replaceAugment } = useContext(GameContext);
  
  if (!game.pendingReplacementAugment) return null;

  return (
    <AnimatePresence>
      {game.pendingReplacementAugment && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="inline-block px-3 py-1 bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold)] text-[var(--pixel-gold-light)] text-[11px] font-bold tracking-[0.15em] mb-3" style={{borderRadius:'2px'}}>
                ◆ 槽位已满 ◆
              </div>
              <h3 className="text-xl font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">选择要替换的模块</h3>
              <p className="text-[var(--dungeon-text-dim)] text-[12px] mt-2">替换现有模块将返还大量金币</p>
            </div>

            <div className="pixel-panel p-4 mb-6 flex items-center gap-3">
              <div className="w-14 h-14 bg-[var(--pixel-blue-dark)] border-3 border-[var(--pixel-blue)] flex items-center justify-center text-[var(--pixel-blue-light)]" style={{borderRadius:'2px'}}>
                <PixelZap size={4} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[var(--pixel-blue)] tracking-[0.1em] mb-0.5">新模块</div>
                <div className="text-base font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">{game.pendingReplacementAugment.name}</div>
                <div className="text-[12px] text-[var(--dungeon-text-dim)] mt-0.5">{formatDescription(game.pendingReplacementAugment.description)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {game.augments.map((aug, i) => aug && (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => replaceAugment(game.pendingReplacementAugment!, i)}
                  className="w-full pixel-panel p-3 flex items-center gap-3 transition-all group"
                  style={{ borderColor: 'var(--dungeon-panel-border)' }}
                >
                  <div className="w-9 h-9 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] flex items-center justify-center text-[var(--dungeon-text-dim)] group-hover:border-[var(--pixel-red)] group-hover:text-[var(--pixel-red)] transition-colors" style={{borderRadius:'2px'}}>
                    <PixelZap size={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[11px] font-bold text-[var(--dungeon-text-dim)] tracking-[0.1em] mb-0.5">替换槽位 {i + 1}</div>
                    <div className="text-xs font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">{aug.name} (Lv.{aug.level})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-[var(--pixel-green)] tracking-[0.1em] mb-0.5">返还</div>
                    <div className="text-xs font-bold text-[var(--pixel-green)] flex items-center gap-1">
                      <PixelCoin size={2} />
                      {(aug.level || 1) * 50}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={() => setGame(prev => ({ ...prev, pendingReplacementAugment: null }))}
              className="w-full mt-6 py-3 text-[11px] font-bold text-[var(--dungeon-text-dim)] tracking-[0.2em] hover:text-[var(--dungeon-text)] transition-colors"
            >
              放弃新模块
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
