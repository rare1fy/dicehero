import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDescription } from '../utils/richText';
import { StatusEffect } from '../types/game';
import { STATUS_INFO } from '../data/statusInfo';

interface StatusIconProps {
  status: StatusEffect;
  align?: 'left' | 'right' | 'center';
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, align = 'center' }) => {
  const info = STATUS_INFO[status.type];
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // [2026-05-08 BUG-FIX] Tooltip 原来同时绑 hover + click + touch，导致：
  //   - 桌面：click 打开后 mouseleave 立刻关
  //   - 移动：onTouchEnd 立刻把刚打开的 tooltip 关掉，完全点不开
  // 改为：
  //   - 桌面：mouseenter/leave 负责 hover 预览
  //   - 点击：锁定打开，直到点击图标外或 3.5s 后自动关
  //   - 移动：tap（touchend）= 点击切换锁定态
  const [pinned, setPinned] = useState(false);
  const togglePin = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setPinned(p => !p);
  };
  useEffect(() => {
    if (!pinned) return;
    const onDocClick = (ev: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) {
        setPinned(false);
      }
    };
    const autoClose = setTimeout(() => setPinned(false), 3500);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
      clearTimeout(autoClose);
    };
  }, [pinned]);

  const alignClasses = {
    left: 'left-0 translate-x-0',
    right: 'right-0 left-auto translate-x-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  const arrowClasses = {
    left: 'left-4 translate-x-0',
    right: 'right-4 left-auto translate-x-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  const visible = showTooltip || pinned;

  return (
    <div
      ref={rootRef}
      className="relative group flex items-center gap-0.5 cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={togglePin}
      onTouchStart={() => { if (timerRef.current) clearTimeout(timerRef.current); }}
      onTouchEnd={(e) => {
        e.preventDefault(); // 避免紧跟着合成 click 被 stopPropagation 吞掉
        togglePin(e);
      }}
    >
      {/* 像素风状态徽章 */}
      <div className={`p-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] ${info.color} flex items-center justify-center`}
        style={{ borderRadius: '2px' }}
      >
        {info.icon}
      </div>
      <span className={`text-[10px] font-bold font-mono ${info.color} pixel-text-shadow`}>{status.value}</span>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`absolute bottom-full mb-2 w-40 p-2.5 pixel-panel z-[100] pointer-events-none max-w-[80vw] ${alignClasses[align]}`}
          >
            <div className={`text-[10px] font-bold mb-1.5 ${info.color} flex items-center gap-1.5 pixel-text-shadow`}>
              {info.icon} {info.label} {status.value}
            </div>
            <div className="text-[10px] text-[var(--dungeon-text-dim)] leading-relaxed">
              {formatDescription(info.description)}
            </div>
            <div className={`absolute top-full ${arrowClasses[align]} border-[5px] border-transparent border-t-[var(--dungeon-panel-border)]`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
