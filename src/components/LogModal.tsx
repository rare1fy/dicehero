import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelClose } from './PixelIcons';
import { useGameContext } from '../contexts/GameContext';

interface Props { visible: boolean; onClose: () => void; }

export const LogModal: React.FC<Props> = ({ visible, onClose }) => {
  const { game } = useGameContext();
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visible, game.logs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'rgba(4,3,6,0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="pixel-panel w-full max-w-sm mx-4 overflow-hidden"
            style={{ maxHeight: '70dvh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 bg-[var(--dungeon-panel)] border-b-2 border-[var(--dungeon-panel-border)]">
              <h3 className="text-sm font-black text-[var(--dungeon-text-bright)] pixel-text-shadow">战斗日志</h3>
              <button onClick={onClose} className="p-1 hover:opacity-70"><PixelClose size={2} /></button>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto min-h-0 p-3 space-y-0.5"
              style={{ WebkitOverflowScrolling: 'touch' } as any}>
              {game.logs.length === 0 ? (
                <div className="text-center text-[var(--dungeon-text-dim)] text-[10px] py-8">暂无日志</div>
              ) : game.logs.map((log, i) => (
                <div key={i} className="flex gap-1 text-[9px] text-[var(--dungeon-text-dim)]">
                  <span className="opacity-40 shrink-0">{'>>'}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
