/**
 * Toast 通知显示组件
 */
import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';
import { PixelHeart, PixelZap, PixelCoin } from './PixelIcons';

export const ToastDisplay: React.FC = () => {
  const { toasts } = useContext(GameContext);

  const toastStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    info: { bg: 'bg-[var(--dungeon-panel)]/85', border: 'border-[var(--pixel-gold)]', text: 'text-[var(--pixel-gold)]', icon: <PixelZap size={2} /> },
    damage: { bg: 'bg-[#2e1010]/85', border: 'border-[var(--pixel-red)]', text: 'text-[var(--pixel-red-light)]', icon: <PixelHeart size={2} /> },
    heal: { bg: 'bg-[#102e1a]/85', border: 'border-[var(--pixel-green)]', text: 'text-[var(--pixel-green-light)]', icon: <PixelHeart size={2} /> },
    gold: { bg: 'bg-[#2e2810]/85', border: 'border-[var(--pixel-gold)]', text: 'text-[var(--pixel-gold-light)]', icon: <PixelCoin size={2} /> },
    buff: { bg: 'bg-[#10102e]/85', border: 'border-[var(--pixel-blue)]', text: 'text-[var(--pixel-blue-light)]', icon: <PixelZap size={2} /> },
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-xs px-4">
      <AnimatePresence>
        {toasts.map(t => {
          const style = toastStyles[t.type || 'info'] || toastStyles.info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={`${style.bg} border-3 ${style.border} ${style.text} px-3 py-2 flex items-center justify-center gap-2 backdrop-blur-sm`}
              style={{ borderRadius: '2px' }}
            >
              {style.icon}
              <span className="text-[12px] font-bold pixel-text-shadow text-center">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
