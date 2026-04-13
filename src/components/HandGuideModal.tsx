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
                const mult = ht.mult + (level - 1) * 0.3;
                return (
                  <div key={ht.id} className="py-2 border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        {ht.icon}
                        <span className="text-[11px] font-bold text-[var(--dungeon-text-bright)]">{ht.name}</span>
                        <span className="text-[8px] text-[var(--dungeon-text-dim)]">Lv.{level}</span>
                      </div>
                      <div className="text-[10px] font-bold">
                        <span className="text-[var(--dungeon-text-dim)]">点数和 ×</span>
                        <span className="text-[var(--pixel-cyan)] ml-0.5">{Math.round(mult * 100)}%</span>
                      </div>
                    </div>
                    {ht.description && (
                      <div className="text-[9px] text-[var(--dungeon-text-dim)] leading-snug pl-5">
                        {ht.description}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="mt-3 pt-2 text-[8px] text-[var(--dungeon-text-dim)] text-center">
                牌型等级越高，倍率越高。营火/事件可升级牌型。
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
