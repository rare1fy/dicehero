/**
 * ChestOpenOverlay.tsx — 挑战宝箱开启演出
 *
 * [2026-05-07] 复用 TreasureScreen 的像素宝箱 + 粒子效果。
 * 独立为共享组件，供 LootScreen 挑战宝箱开启使用。
 *
 * 职责：仅做开箱演出，不做抽奖逻辑。演出结束调用 onDone 交给上层入账。
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ---- 像素宝箱 SVG（与 TreasureScreen 保持一致） ----
const PixelChest: React.FC<{ size?: number; isOpen?: boolean }> = ({ size = 4, isOpen = false }) => {
  const px = size;
  return (
    <svg width={px * 10} height={px * 8} viewBox="0 0 10 8" shapeRendering="crispEdges">
      <rect x="1" y={isOpen ? '4' : '3'} width="8" height="4" fill="#8B6914" />
      <rect x="2" y={isOpen ? '4' : '3'} width="6" height="1" fill="#ffe680" opacity="0.25" />
      <rect x="0" y={isOpen ? '0' : '1'} width="10" height={isOpen ? '3' : '2'} fill="#d4a030" />
      <rect x="1" y={isOpen ? '0' : '1'} width="8" height="1" fill="#ffe680" opacity="0.35" />
      <rect x="4" y={isOpen ? '5' : '3'} width="2" height="2" fill="#ffd700" />
      {isOpen && (<><rect x="2" y="3" width="6" height="1" fill="#ffe680" opacity="0.8" /><rect x="3" y="2" width="4" height="1" fill="#fff" opacity="0.5" /></>)}
    </svg>
  );
};

export interface ChestOpenOverlayProps {
  /** 演出结束后回调（约 1800ms 后触发） */
  onDone: () => void;
}

/** 挑战宝箱开启演出（抖动 → 打开 → 闪光 → 淡出） */
export const ChestOpenOverlay: React.FC<ChestOpenOverlayProps> = ({ onDone }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 50,
      y: 40 + (Math.random() - 0.5) * 30,
      color: '#d4a030',
      delay: Math.random() * 0.4,
    })),
  );

  useEffect(() => {
    const openTimer = setTimeout(() => setIsOpen(true), 900);
    const doneTimer = setTimeout(() => onDone(), 1800);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
      >
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: p.x + '%', y: p.y + '%' }}
            transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color, boxShadow: '0 0 6px ' + p.color }}
          />
        ))}
        <motion.div
          className="flex flex-col items-center"
          animate={isOpen ? {} : { scale: [1, 1.1, 1], rotate: [0, -2, 2, -2, 0] }}
          transition={{ repeat: isOpen ? 0 : Infinity, duration: 0.4 }}
        >
          <motion.div animate={isOpen ? { y: -20 } : {}} transition={{ type: 'spring', stiffness: 200 }}>
            <PixelChest size={10} isOpen={isOpen} />
          </motion.div>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-[11px] font-black tracking-widest text-[#ffe680] pixel-text-shadow"
            >
              ✦ 开启中 ✦
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
