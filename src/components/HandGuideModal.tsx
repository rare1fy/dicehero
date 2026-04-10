/**
 * 牌型图鉴模态框
 */
import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';
import { PixelClose } from './PixelIcons';
import { HAND_TYPES } from '../data/handTypes';

const FILTERED = ['同花顺','皇家同花顺','同花','满堂红','同元素对','同元素三条','同元素四条','同元素五条','同元素六骰'];

export const HandGuideModal: React.FC = () => {
  const { game, showHandGuide, setShowHandGuide } = useContext(GameContext);
  return (
    <AnimatePresence>
      {showHandGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setShowHandGuide(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="pixel-panel w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center bg-[var(--dungeon-bg-light)]">
              <h3 className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">◆ 牌型图鉴 ◆</h3>
              <button onClick={() => setShowHandGuide(false)} className="text-[var(--dungeon-text-dim)] hover:text-white"><PixelClose size={2} /></button>
            </div>
            <div className="overflow-y-auto p-3 flex-1">
              {HAND_TYPES.filter(h => !FILTERED.includes(h.name)).map(ht => {
                const level = game.handLevels[ht.id] || 1;
                const baseDmg = ht.base + (level - 1) * 3;
                const mult = ht.mult + (level - 1) * 0.3;
                return (
                  <div key={ht.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-[var(--dungeon-text-bright)]">{ht.name}</span>
                      <span className="text-[8px] text-[var(--dungeon-text-dim)] ml-1">Lv.{level}</span>
                    </div>
                    <div className="text-[9px]">
                      <span className="text-[var(--pixel-cyan)]">{baseDmg}</span>
                      <span className="text-[var(--dungeon-text-dim)] mx-0.5">×</span>
                      <span className="text-[var(--pixel-red)]">{mult.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
