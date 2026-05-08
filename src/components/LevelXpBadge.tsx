/**
 * LevelXpBadge.tsx — 等级徽章 + 可弹出经验条
 *
 * 设计要点（2026-05-08 刘叔 review 迭代）：
 *  - 徽章：去掉紫色外框，只保留像素星 + "Lv N" 文字（带像素描边）
 *  - 经验条：去重边框 + 刻度，单条圆角像素进度条，右侧小字 xp/next
 *  - 自动消失：无论是自动弹出（收到经验）还是手动点击，都统一在 2s 后收起
 *  - 不在 xp=0 时闪出 "+0"（只有 lastXpGain>0 时才播动画；进度条宽度用 initial=animate 避免从 100% 闪到 0%）
 *  - 升级：徽章金色闪光 + scale 弹跳 + "LV UP" 浮字
 *
 *  碎片飞入动画已拆到 <XpShardLayer>（全屏层），本组件只负责徽章 + 经验条显示。
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelStar } from './PixelIcons';

interface LevelXpBadgeProps {
  level: number;
  xp: number;
  xpToNext: number;
  lastXpGain?: number;
  lastXpGainAt?: number;
}

const AUTO_CLOSE_MS = 2000;

export const LevelXpBadge: React.FC<LevelXpBadgeProps> = ({ level, xp, xpToNext, lastXpGain, lastXpGainAt }) => {
  const [open, setOpen] = useState(false);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [levelUpLabel, setLevelUpLabel] = useState<number | null>(null);
  const prevLevelRef = useRef(level);
  const prevGainAtRef = useRef<number | undefined>(lastXpGainAt);
  const autoCloseTimerRef = useRef<number | null>(null);
  const pct = Math.min(100, Math.max(0, Math.round((xp / Math.max(1, xpToNext)) * 100)));

  const scheduleAutoClose = () => {
    if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
  };

  // 收到经验增益 → 弹出经验条（只有 lastXpGain>0 才触发，避免初始闪现）
  useEffect(() => {
    if (lastXpGainAt && lastXpGainAt !== prevGainAtRef.current) {
      prevGainAtRef.current = lastXpGainAt;
      if ((lastXpGain || 0) > 0) {
        setOpen(true);
        scheduleAutoClose();
      }
    }
  }, [lastXpGainAt, lastXpGain]);

  // 升级
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setLevelUpFlash(true);
      setLevelUpLabel(level);
      setOpen(true);
      scheduleAutoClose();
      window.setTimeout(() => setLevelUpFlash(false), 600);
      window.setTimeout(() => setLevelUpLabel(null), 1600);
    }
    prevLevelRef.current = level;
  }, [level]);

  // 点击徽章 → 开/关，开的话也启动 2s 自动消失
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
    } else {
      setOpen(true);
      scheduleAutoClose();
    }
  };

  return (
    <div
      className="relative shrink-0 flex items-center gap-0.5"
      data-xp-badge="1"
      style={{ fontFamily: '"fusion-pixel", monospace' }}
    >
      {/* 徽章本体 —— 裸像素星 + Lv 数字（无外框） */}
      <motion.button
        onClick={handleClick}
        animate={levelUpFlash ? { scale: [1, 1.4, 1], rotate: [0, -6, 6, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0 leading-none"
        style={{ height: 14 }}
        title="点击查看经验"
      >
        <PixelStar
          size={1}
          style={{
            filter: levelUpFlash
              ? 'drop-shadow(0 0 4px #fff7b0) drop-shadow(0 0 8px #ffd24a)'
              : 'drop-shadow(0 0 2px rgba(80,160,255,0.55))',
          }}
        />
        <span
          className="text-[10px] font-black tracking-wider pixel-text-shadow"
          style={{
            color: levelUpFlash ? '#fff2a0' : '#a0d0ff',
            textShadow: '0 1px 0 rgba(0,0,0,0.9), 0 0 3px rgba(60,140,255,0.55)',
          }}
        >
          Lv{level}
        </span>
      </motion.button>

      {/* LV UP 浮字 */}
      <AnimatePresence>
        {levelUpLabel !== null && (
          <motion.div
            key="lvup"
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-2, -14, -22, -30], scale: [0.6, 1.2, 1.1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none z-[105] whitespace-nowrap"
            style={{
              fontFamily: '"fusion-pixel", monospace',
              fontSize: 11,
              fontWeight: 900,
              color: 'var(--pixel-gold)',
              textShadow: '0 0 6px rgba(232,184,48,1), 0 0 12px rgba(232,184,48,0.6), 0 2px 0 rgba(0,0,0,0.8)',
            }}
          >
            LV UP!
          </motion.div>
        )}
      </AnimatePresence>

      {/* 弹出的经验条 */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="xpbar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 pointer-events-none z-[102] flex items-center gap-1"
            style={{ bottom: 'calc(100% + 3px)', whiteSpace: 'nowrap' }}
          >
            {/* 主体经验条：像素风单条 */}
            <div
              className="relative"
              style={{
                width: 96,
                height: 6,
                background: 'rgba(8,4,18,0.88)',
                boxShadow: '0 0 0 1px rgba(48,130,255,0.9), 0 0 6px rgba(40,100,220,0.5)', // [COLOR 2026-05-08] 经验条蓝色
              }}
            >
              <motion.div
                className="h-full"
                initial={{ width: pct + '%' }}
                animate={{ width: pct + '%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  background: levelUpFlash
                    ? 'linear-gradient(90deg, #fff9c4 0%, #ffd24a 50%, #fff2a0 100%)'
                    : 'linear-gradient(90deg, #1a60e0 0%, #4090ff 50%, #80c0ff 100%)',
                  boxShadow: '0 0 4px rgba(80,160,255,0.9)',
                }}
              />
            </div>
            {/* 右侧数字 */}
            <span
              className="font-mono font-bold"
              style={{
                fontSize: 9,
                color: '#a0d0ff',
                textShadow: '0 1px 0 rgba(0,0,0,0.9)',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {xpToNext > 0 ? `${xp}/${xpToNext}` : 'MAX'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};