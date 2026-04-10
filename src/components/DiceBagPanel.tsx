import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDiceDef } from '../data/dice';
import { ElementBadge, RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { PixelDice, PixelClose } from './PixelIcons';

/** 骰子defId -> 缩略图主色 (与手牌CSS一致) */
const DICE_MINI_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  standard: { bg: '#98a0a8', border: '#a0a8b0', dot: '#1a1e25' },
  elemental: { bg: '#3a2858', border: '#7040b8', dot: '#d0a0ff' },
  heavy:    { bg: '#4a4a58', border: '#6a6a7a', dot: '#d0d0d8' },
  fire:     { bg: '#c04020', border: '#e07830', dot: '#ffe0a0' },
  ice:      { bg: '#2080a8', border: '#30a8d0', dot: '#c0e8ff' },
  thunder:  { bg: '#5040a0', border: '#8060c0', dot: '#ffe040' },
  poison:   { bg: '#408020', border: '#70c030', dot: '#c0ff80' },
  holy:     { bg: '#a08020', border: '#d4a030', dot: '#ffe890' },
  blade:    { bg: '#707888', border: '#98a8b8', dot: '#e0e8f0' },
  amplify:  { bg: '#4030a0', border: '#7060d0', dot: '#c0b0ff' },
  split:    { bg: '#206858', border: '#30b898', dot: '#80ffd0' },
  magnet:   { bg: '#602838', border: '#c03048', dot: '#4080d0' },
  joker:    { bg: '#a04080', border: '#e060b0', dot: '#ffe0f0' },
  chaos:    { bg: '#802020', border: '#c03030', dot: '#ffd040' },
  cursed:   { bg: '#402050', border: '#6030a0', dot: '#c080f0' },
  cracked:  { bg: '#383838', border: '#585858', dot: '#a0a0a0' },
};

const getDefColor = (defId: string) => DICE_MINI_COLORS[defId] || DICE_MINI_COLORS.standard;

interface DiceBagPanelProps {
  ownedDice: string[];
  diceBag: string[];
  discardPile: string[];
  position?: 'left' | 'right';
}

/**
 * MiniDice - 骰子队列中的迷你骰子缩略图
 * 保持颜色和特点与手牌一致
 */
export const MiniDice: React.FC<{ defId: string; size?: number; highlight?: boolean }> = ({ defId, size = 16, highlight = false }) => {
  const def = getDiceDef(defId);
  const colors = getDefColor(defId);
  const hasElement = def.element !== 'normal';
  const s = size;
  const inner = Math.max(6, s - 4);

  return (
    <div
      className="shrink-0 relative flex items-center justify-center"
      style={{
        width: s,
        height: s,
        ...(defId === 'elemental' ? {
          background: 'linear-gradient(135deg, #c04020, #3a1858, #2080a8, #5040a0, #408020, #a08020)',
          backgroundSize: '300% 300%',
          animation: 'elemental-flow 4s steps(8) infinite',
          border: `${highlight ? 2 : 1}px solid`,
          borderImage: 'linear-gradient(135deg, #e07830, #50b8e0, #8060c0, #70c030, #d4a030) 1',
          borderRadius: '0px',
          boxShadow: highlight
            ? '0 0 6px rgba(140,80,220,0.6), inset 1px 1px 0 rgba(255,255,255,0.15)'
            : '0 0 3px rgba(140,80,220,0.3), inset 1px 1px 0 rgba(255,255,255,0.1)',
        } : {
          background: `linear-gradient(180deg, ${colors.bg}dd 0%, ${colors.bg}99 100%)`,
          border: `${highlight ? 2 : 1}px solid ${colors.border}${highlight ? 'ff' : '88'}`,
          borderRadius: '2px',
          boxShadow: highlight
            ? `0 0 4px ${colors.border}66, inset 1px 1px 0 rgba(255,255,255,0.15)`
            : `inset 1px 1px 0 rgba(255,255,255,0.1)`,
        }),
      }}
      title={def.name}
    >
      {/* 骰子点 - 元素骰子用菱形多色标记 */}
      {defId === 'magnet' ? (
        <svg width={inner} height={inner} viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
          <rect x="0" y="0" width="4" height="8" fill="#c03048" />
          <rect x="4" y="0" width="4" height="8" fill="#3070c0" />
          <rect x="2" y="3" width="4" height="2" fill="#808890" />
        </svg>
      ) : defId === 'elemental' ? (
        <svg width={inner} height={inner} viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
          {/* 菱形外框 */}
          <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" fill="none" stroke="#b080e0" strokeWidth="0.8" />
          {/* 五色元素点 */}
          <rect x="3.2" y="1.2" width="1.6" height="1.6" fill="#e07830" /> {/* fire */}
          <rect x="5.2" y="3.2" width="1.6" height="1.6" fill="#50b8e0" /> {/* ice */}
          <rect x="3.2" y="5.2" width="1.6" height="1.6" fill="#8060c0" /> {/* thunder */}
          <rect x="1.2" y="3.2" width="1.6" height="1.6" fill="#70c030" /> {/* poison */}
          <rect x="3.2" y="3.2" width="1.6" height="1.6" fill="#d4a030" /> {/* holy center */}
        </svg>
      ) : (
        <svg width={inner} height={inner} viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
          <circle cx="4" cy="4" r="2" fill={colors.dot} />
        </svg>
      )}
      {/* 元素标记 */}
      {hasElement && s >= 14 && (
        <div className="absolute -top-0.5 -right-0.5 pointer-events-none">
          <ElementBadge element={def.element} size={Math.max(6, Math.floor(s * 0.45))} />
        </div>
      )}
    </div>
  );
};

/** 外部骰子队列缩略图 - 横排展示 */
export const DiceQueueThumbnail: React.FC<{
  diceIds: string[];
  maxShow?: number;
  direction?: 'ltr' | 'rtl';
}> = ({ diceIds, maxShow = 12, direction = 'ltr' }) => {
  const showIds = direction === 'ltr' ? diceIds.slice(0, maxShow) : diceIds.slice(-maxShow).reverse();
  const overflow = diceIds.length - maxShow;

  return (
    <div className={`flex items-center gap-px ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
      <AnimatePresence mode="popLayout">
        {showIds.map((defId, idx) => (
          <motion.div
            key={`${defId}-q-${idx}`}
            layout
            initial={{ opacity: 0, scale: 0.3, x: direction === 'ltr' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: idx * 0.01 }}
          >
            <MiniDice defId={defId} size={14} />
          </motion.div>
        ))}
      </AnimatePresence>
      {overflow > 0 && (
        <span className="text-[7px] font-mono font-bold text-[var(--dungeon-text-dim)] ml-0.5">+{overflow}</span>
      )}
    </div>
  );
};

/**
 * DiceBagPanel - 骰子库/弃骰库面板
 * position='left': 骰子库 (蓝色)
 * position='right': 弃骰库 (红色)
 */
export const DiceBagPanel: React.FC<DiceBagPanelProps> = ({ ownedDice: _ownedDice, diceBag, discardPile, position = 'left' }) => {
  const [expanded, setExpanded] = useState(false);
  const isLeft = position === 'left';

  const targetList = isLeft ? diceBag : discardPile;
  const title = isLeft ? '骰子库' : '弃骰库';
  const color = isLeft ? 'var(--pixel-blue)' : 'var(--pixel-red)';
  const lightColor = isLeft ? 'var(--pixel-blue-light)' : 'var(--pixel-red-light)';
  const darkColor = isLeft ? 'var(--pixel-blue-dark)' : 'var(--pixel-red-dark)';

  return (
    <>
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 px-1.5 py-0.5 bg-[var(--dungeon-panel-bg)] border-2 transition-colors ${
            isLeft
              ? 'border-[var(--pixel-blue)] hover:border-[var(--pixel-blue-light)]'
              : 'border-[var(--pixel-red)] hover:border-[var(--pixel-red-light)]'
          }`}
          style={{ borderRadius: '2px' }}
          title={isLeft ? '查看骰子库详情' : '查看弃骰库详情'}
        >
          {isLeft ? (
            <>
              <PixelDice size={2} />
              <span className="text-[9px] font-mono font-bold text-[var(--pixel-blue-light)]">{diceBag.length}</span>
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ imageRendering: 'pixelated' }}><rect x="1" y="1" width="8" height="8" rx="1" fill="var(--pixel-red-dark)" stroke="var(--pixel-red-light)" strokeWidth="1" /><circle cx="3.5" cy="3.5" r="1" fill="var(--pixel-red-light)" /><circle cx="6.5" cy="6.5" r="1" fill="var(--pixel-red-light)" /></svg>
              <span className="text-[9px] font-mono font-bold text-[var(--pixel-red-light)]">{discardPile.length}</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-[90vw] max-w-md max-h-[80vh] overflow-y-auto pixel-panel p-4 bg-[var(--dungeon-bg)]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black pixel-text-shadow tracking-wide" style={{ color: lightColor }}>
                  {title} ({targetList.length})
                </h3>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] text-xs font-bold"
                >
                  <PixelClose size={2} />
                </button>
              </div>

              {/* \u7EDF\u8BA1\u6805 */}
              <div className="px-2 py-1.5 mb-3 border-2 text-center" style={{ backgroundColor: darkColor, borderColor: color, borderRadius: '2px' }}>
                <div className="text-[8px] font-bold tracking-wider" style={{ color: lightColor }}>{title}</div>
                <div className="text-lg font-black" style={{ color: lightColor }}>{targetList.length}</div>
              </div>

              {/* \u9AB0\u5B50\u961F\u5217\u5217\u8868 - \u6BCF\u4E2A\u9AB0\u5B50\u72EC\u7ACB\u5C55\u793A */}
              {targetList.length === 0 ? (
                <div className="text-center py-8 text-[var(--dungeon-text-dim)] text-xs">
                  {isLeft ? '骰子库已空，弃骰库将洗回' : '弃骰库为空'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {targetList.map((defId, idx) => {
                    const def = getDiceDef(defId);
                    const _colors = getDefColor(defId);
                    return (
                      <motion.div
                        key={`${defId}-${idx}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex flex-col items-center gap-0.5 p-1.5 border-2 bg-[var(--dungeon-panel-bg)]"
                        style={{
                          borderColor: RARITY_COLORS[def.rarity] + '88',
                          borderRadius: '3px',
                          minWidth: '52px',
                        }}
                      >
                        {/* Mini dice - same style as queue */}
                        <MiniDice defId={defId} size={28} highlight />
                        {/* \u540D\u79F0 */}
                        <span className="text-[7px] font-bold text-[var(--dungeon-text)] leading-none text-center max-w-[48px] truncate">
                          {def.name}
                        </span>
                        {/* \u7A00\u6709\u5EA6 */}
                        <span className="text-[6px] font-bold" style={{ color: RARITY_TEXT_COLORS[def.rarity] }}>
                          {RARITY_LABELS[def.rarity]}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
