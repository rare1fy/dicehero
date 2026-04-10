/**
 * Toast 通知显示组件 — 统一黑色半透明横幅
 */
import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';

export const ToastDisplay: React.FC = () => {
  const { toasts } = useContext(GameContext);

  return (
    <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-1.5 pointer-events-none w-full max-w-xs px-4">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-1.5 text-center"
            style={{
              background: 'rgba(10,8,6,0.9)',
              borderRadius: '4px',
              border: '2px solid rgba(255,255,255,0.08)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <span className="text-[11px] font-bold text-[var(--dungeon-text)] pixel-text-shadow">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
