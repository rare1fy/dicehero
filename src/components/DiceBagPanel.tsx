import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDiceDef, getUpgradedFaces } from '../data/dice';
import { RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { PixelDice, PixelClose } from './PixelIcons';
import { formatDescription } from '../utils/richText';
import { MiniDice, DiceQueueThumbnail } from './MiniDice';

/**
 * DiceBagPanel - 骰子库/弃骰库面板
 * position='left': 骰子库 (蓝色)
 * position='right': 弃骰库 (红色)
 */
export const DiceBagPanel: React.FC<DiceBagPanelProps> = ({ ownedDice: _ownedDice, diceBag, discardPile, position = 'left' }) => {
  const [expanded, setExpanded] = useState(false);
  const [tooltipDef, setTooltipDef] = useState<string | null>(null);
  const isLeft = position === 'left';

  const targetList = isLeft ? diceBag : discardPile;
  const title = isLeft ? '骰子库' : '弃骰库';
  const accentColor = isLeft ? '#4080c0' : '#c05040';
  const accentLight = isLeft ? '#60a8e0' : '#e07060';
  const accentDark = isLeft ? '#203860' : '#602020';

  return (
    <>
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-2 py-1 transition-all hover:brightness-125"
          style={{
            background: `linear-gradient(180deg, ${accentDark}cc 0%, ${accentDark}88 100%)`,
            border: `2px solid ${accentColor}80`,
            borderRadius: '3px',
            boxShadow: `inset 0 1px 0 ${accentLight}30, 0 2px 0 rgba(0,0,0,0.4)`,
          }}
          title={title}
        >
          {isLeft ? (
            <PixelDice size={1.5} />
          ) : (
            <svg width="8" height="8" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
              <rect x="1" y="1" width="6" height="6" rx="1" fill={accentDark} stroke={accentLight} strokeWidth="0.8" />
              <circle cx="3" cy="3" r="0.8" fill={accentLight} /><circle cx="5" cy="5" r="0.8" fill={accentLight} />
            </svg>
          )}
          <span className="text-[10px] font-black font-mono pixel-text-shadow" style={{ color: accentLight }}>
            {targetList.length}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-[90vw] max-w-md max-h-[80vh] overflow-hidden flex flex-col pixel-panel"
            >
              {/* 头部 */}
              <div className="px-4 py-3 border-b-3 border-[var(--dungeon-panel-border)] flex items-center justify-between shrink-0"
                style={{ background: `linear-gradient(180deg, ${accentDark}60 0%, var(--dungeon-bg-light) 100%)` }}>
                <div className="flex items-center gap-2">
                  {isLeft ? <PixelDice size={2} /> : (
                    <svg width="14" height="14" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
                      <rect x="1" y="1" width="6" height="6" rx="1" fill={accentDark} stroke={accentLight} strokeWidth="0.8" />
                      <circle cx="3" cy="3" r="0.8" fill={accentLight} /><circle cx="5" cy="5" r="0.8" fill={accentLight} />
                    </svg>
                  )}
                  <div>
                    <h3 className="text-sm font-black pixel-text-shadow tracking-wide" style={{ color: accentLight }}>
                      {title}
                    </h3>
                    <span className="text-[8px] font-mono" style={{ color: accentColor }}>
                      共 {targetList.length} 颗骰子
                    </span>
                  </div>
                </div>
                <button onClick={() => setExpanded(false)} className="text-[var(--dungeon-text-dim)] hover:text-white">
                  <PixelClose size={2} />
                </button>
              </div>

              {/* 骰子网格 */}
              <div className="flex-1 overflow-y-auto p-3">
                {targetList.length === 0 ? (
                  <div className="text-center py-8 text-[var(--dungeon-text-dim)] text-xs">
                    {isLeft ? '骰子库已空，弃骰库将洗回' : '弃骰库为空'}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {targetList.map((defId, idx) => {
                      const def = getDiceDef(defId);
                      const isTooltipActive = tooltipDef === `${defId}-${idx}`;
                      return (
                        <motion.div
                          key={`${defId}-${idx}`}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.015 }}
                          className={`flex flex-col items-center gap-0.5 p-1.5 border bg-[rgba(0,0,0,0.3)] cursor-pointer transition-all ${isTooltipActive ? 'ring-1 ring-[var(--pixel-gold)]' : 'hover:brightness-125'}`}
                          style={{
                            borderColor: RARITY_COLORS[def.rarity] + '60',
                            borderRadius: '3px',
                            minWidth: '56px',
                          }}
                          onClick={(e) => { e.stopPropagation(); setTooltipDef(isTooltipActive ? null : `${defId}-${idx}`); }}
                        >
                          <MiniDice defId={defId} size={28} highlight />
                          <span className="text-[8px] font-bold text-[var(--dungeon-text)] leading-none text-center max-w-[52px] truncate">
                            {def.name}
                          </span>
                          <span className="text-[7px] font-bold" style={{ color: RARITY_TEXT_COLORS[def.rarity] }}>
                            {RARITY_LABELS[def.rarity]}
                          </span>
                          {isTooltipActive && (
                            <div className="w-full mt-1 p-1.5 rounded-sm text-[8px] leading-snug text-center"
                              style={{ background: 'rgba(0,0,0,0.6)', border: `1px solid ${RARITY_COLORS[def.rarity]}40` }}>
                              <div className="text-[var(--dungeon-text-dim)] mb-0.5">[{getUpgradedFaces(def, 1).join(',')}]</div>
                              <div className="text-[var(--dungeon-text)]">{formatDescription(def.description)}</div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
