/**
 * MiniDice — 迷你骰子缩略图组件
 * ARCH-H: 从 DiceBagPanel.tsx 提取
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDiceDef } from '../data/dice';
import { ElementBadge, RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { DiceFacePattern } from './DiceFacePattern';
import { PixelDiceRenderer, hasPixelRenderer } from './PixelDiceRenderer';
import { PixelDice } from './PixelIcons';
import { formatDescription } from '../utils/richText';
import { getUpgradedFaces } from '../data/dice';

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

const getDefColor = (defId: string) => {
  if (DICE_MINI_COLORS[defId]) return DICE_MINI_COLORS[defId];
  if (defId.startsWith('w_')) return { bg: '#6a4040', border: '#c06060', dot: '#ffe0d0' };
  if (defId.startsWith('mage_')) return { bg: '#3a2858', border: '#7040b8', dot: '#d0a0ff' };
  if (defId.startsWith('r_')) return { bg: '#204830', border: '#40a060', dot: '#a0ffc0' };
  return DICE_MINI_COLORS.standard;
};

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

  if (hasPixelRenderer(defId)) {
    return <PixelDiceRenderer diceDefId={defId} value="?" size={s} />;
  }

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
      {defId === 'magnet' ? (
        <svg width={inner} height={inner} viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
          <rect x="0" y="0" width="4" height="8" fill="#c03048" />
          <rect x="4" y="0" width="4" height="8" fill="#3070c0" />
          <rect x="2" y="3" width="4" height="2" fill="#808890" />
        </svg>
      ) : defId === 'elemental' ? (
        <svg width={inner} height={inner} viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
          <polygon points="4,0.5 7.5,4 4,7.5 0.5,4" fill="none" stroke="#b080e0" strokeWidth="0.8" />
          <rect x="3.2" y="1.2" width="1.6" height="1.6" fill="#e07830" />
          <rect x="5.2" y="3.2" width="1.6" height="1.6" fill="#50b8e0" />
          <rect x="3.2" y="5.2" width="1.6" height="1.6" fill="#8060c0" />
          <rect x="1.2" y="3.2" width="1.6" height="1.6" fill="#70c030" />
          <rect x="3.2" y="3.2" width="1.6" height="1.6" fill="#d4a030" />
        </svg>
      ) : (
        <svg width={inner} height={inner} viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
          <circle cx="4" cy="4" r="2" fill={colors.dot} />
        </svg>
      )}
      {s >= 20 && defId !== 'standard' && defId !== 'elemental' && defId !== 'magnet' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.25, padding: '2px' }}>
          <DiceFacePattern diceDefId={defId} />
        </div>
      )}
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
