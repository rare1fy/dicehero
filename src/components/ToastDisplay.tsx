/**
 * Toast 通知显示组件 — 统一黑色半透明横幅
 * [TOAST-ICON 2026-05-09] 支持可选 pixel icon 前缀（单行内联，10px 间距）
 */
import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';
import { PixelCoin, PixelDice, PixelClose, PixelStar, PixelRefresh } from './PixelIcons';
import { PixelCheck } from './PixelCheck';
import { RelicPixelIcon } from './PixelRelicIcons';

const renderIcon = (icon?: string, relicId?: string): React.ReactNode => {
  if (!icon) return null;
  switch (icon) {
    case 'gold': return <PixelCoin size={2} />;
    case 'dice': return <PixelDice size={2} />;
    case 'relic': return relicId ? <RelicPixelIcon relicId={relicId} size={2} /> : <PixelStar size={2} />;
    case 'remove': return <PixelClose size={2} />;
    case 'check': return <PixelCheck size={2} />;
    case 'star': return <PixelStar size={2} />;
    case 'shuffle': return <PixelRefresh size={2} />;
    default: return null;
  }
};

export const ToastDisplay: React.FC = () => {
  const { toasts } = useContext(GameContext);

  return (
    <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-1.5 pointer-events-none w-full max-w-xs px-4">
      <AnimatePresence>
        {toasts.map(t => {
          const iconNode = renderIcon((t as { icon?: string }).icon, (t as { relicId?: string }).relicId);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-1.5 text-center inline-flex items-center justify-center gap-1.5"
              style={{
                background: 'rgba(10,8,6,0.55)',
                borderRadius: '4px',
                border: '2px solid rgba(255,255,255,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              {iconNode && <span className="inline-flex items-center">{iconNode}</span>}
              <span className="text-[11px] font-bold text-[var(--dungeon-text)] pixel-text-shadow">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
