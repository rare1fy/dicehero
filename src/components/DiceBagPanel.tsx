import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getDiceDef } from '../data/dice';
import { RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { PixelDice, PixelClose } from './PixelIcons';
import { formatDescription } from '../utils/richText';
import { MiniDice, DiceQueueThumbnail } from './MiniDice';

interface DiceBagPanelProps {
  ownedDice: string[];
  diceBag: string[];
  discardPile: string[];
  position?: 'left' | 'right';
}

/**
 * DiceBagPanel - 骰子库/弃骰库面板
 * position='left': 骰子库 (蓝色)
 * position='right': 弃骰库 (红色)
 */
export const DiceBagPanel: React.FC<DiceBagPanelProps> = ({ ownedDice: _ownedDice, diceBag, discardPile, position = 'left' }) => {
  const [expanded, setExpanded] = useState(false);
  const [tooltipDef, setTooltipDef] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number; dir: 'up' | 'down' }>({ left: 0, top: 0, dir: 'up' });
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
              <div className="flex-1 overflow-y-auto p-3 dicebag-scroll">
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
                          className={`flex flex-col items-center gap-0.5 p-1.5 border bg-[rgba(0,0,0,0.3)] cursor-pointer transition-all relative ${isTooltipActive ? 'ring-1 ring-[var(--pixel-gold)] z-30' : 'hover:brightness-125'}`}
                          style={{
                            borderColor: RARITY_COLORS[def.rarity] + '60',
                            borderRadius: '3px',
                            minWidth: '56px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const tooltipKey = `${defId}-${idx}`;
                            if (isTooltipActive) { setTooltipDef(null); return; }
                            const card = e.currentTarget as HTMLElement;
                            const cardRect = card.getBoundingClientRect();
                            // [2026-05-09] 用户要求 tooltip 始终在点击的骰子正上方居中
                            //   水平：以卡片中心为锚（translate -50%）
                            //   垂直：强制向上；仅当上方几乎无空间（< 60px）时才 fallback 向下
                            const spaceAbove = cardRect.top;
                            const dir: 'up' | 'down' = spaceAbove >= 60 ? 'up' : 'down';
                            const left = cardRect.left + cardRect.width / 2;
                            const top = dir === 'up' ? cardRect.top - 8 : cardRect.bottom + 8;
                            setTooltipPos({ left, top, dir });
                            setTooltipDef(tooltipKey);
                          }}
                        >
                          <MiniDice defId={defId} size={28} highlight />
                          <span className="text-[8px] font-bold text-[var(--dungeon-text)] leading-none text-center max-w-[52px] truncate">
                            {def.name}
                          </span>
                          <span className="text-[7px] font-bold" style={{ color: RARITY_TEXT_COLORS[def.rarity] }}>
                            {RARITY_LABELS[def.rarity]}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
            {/* tooltip 通过 Portal 挂到 document.body，避免父级 fixed 容器在 iOS Safari 下影响内部 fixed 定位 */}
            {tooltipDef && ReactDOM.createPortal((() => {
              const activeId = tooltipDef.split('-').slice(0, -1).join('-');
              const def = getDiceDef(activeId);
              if (!def) return null;
              const isUp = tooltipPos.dir === 'up';
              return (
                <motion.div
                  initial={{ opacity: 0, y: isUp ? 4 : -4, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="fixed p-2 text-[9px] leading-snug text-center pointer-events-none"
                  style={{
                    left: tooltipPos.left,
                    top: tooltipPos.top,
                    transform: `translate(-50%, ${isUp ? '-100%' : '0'})`,
                    width: '160px',
                    background: 'rgba(12,10,20,0.96)',
                    border: `2px solid ${RARITY_COLORS[def.rarity]}`,
                    borderRadius: '3px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.6)',
                    zIndex: 100,
                  }}
                >
                  <div className="text-[var(--dungeon-text-dim)] mb-1 font-mono">[{def.faces.join(',')}]</div>
                  <div className="text-[var(--dungeon-text)]">{formatDescription(def.description)}</div>
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      [isUp ? 'bottom' : 'top']: '-6px',
                      width: 0, height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      [isUp ? 'borderTop' : 'borderBottom']: `6px solid ${RARITY_COLORS[def.rarity]}`,
                    }}
                  />
                </motion.div>
              );
            })(), document.body)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
