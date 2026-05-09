/**
 * LevelXpBadge.tsx — 等级徽章 + 可弹出经验条
 *
 * 设计要点（2026-05-08 刘叔 v3 迭代）：
 *  - 徽章图标：用 PixelXpSpark 四瓣闪光（和经验碎片同款），颜色全线蓝色
 *  - 徽章文字：蓝色 pixel-blue + 金色升级闪光
 *  - 经验条：加大（宽 144 / 高 11），硬边深槽 + 纯色蓝填充 + inset 双向高光 + 4段刻度
 *  - 自动消失：弹出后 3.5s 自动收起（从 2s 加长），给刘叔足够时间看清
 *  - 不在 xp=0 时闪出 "+0"
 *  - 升级：蓝→金切换 + scale 弹跳 + "LV UP" 浮字 + halo 脉动
 *
 *  碎片飞入动画已拆到 <XpShardLayer>（全屏层），本组件只负责徽章 + 经验条显示。
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelXpSpark } from './PixelIcons';

interface LevelXpBadgeProps {
  level: number;
  xp: number;
  xpToNext: number;
  lastXpGain?: number;
  lastXpGainAt?: number;
}

const AUTO_CLOSE_MS = 3500;

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
      window.setTimeout(() => setLevelUpFlash(false), 700);
      window.setTimeout(() => setLevelUpLabel(null), 1800);
    }
    prevLevelRef.current = level;
  }, [level]);

  // 点击徽章 → 开/关
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
      className="relative shrink-0 flex items-center gap-1"
      data-xp-badge="1"
      style={{ fontFamily: '"fusion-pixel", monospace' }}
    >
      {/* 徽章本体 —— PixelXpSpark 闪光图标 + "Lv N" 蓝色文字 */}
      <motion.button
        onClick={handleClick}
        animate={levelUpFlash ? { scale: [1, 1.45, 1], rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 leading-none"
        style={{ height: 16 }}
        title="点击查看经验"
      >
        <PixelXpSpark
          size={1}
          style={{
            filter: levelUpFlash
              ? 'drop-shadow(0 0 5px #fff7b0) drop-shadow(0 0 10px #ffd24a)'
              : 'none',
          }}
        />
        <span
          className="text-[10px] font-black tracking-wider pixel-text-shadow"
          style={{
            color: levelUpFlash ? '#fff2a0' : '#a8d0ff',
            textShadow: '0 1px 0 rgba(0,0,0,0.9), 0 0 3px rgba(104,160,232,0.65)',
          }}
        >
          Lv {level}
        </span>
      </motion.button>

      {/* LV UP 浮字 */}
      <AnimatePresence>
        {levelUpLabel !== null && (
          <motion.div
            key="lvup"
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-2, -14, -22, -30], scale: [0.6, 1.3, 1.2, 1.05] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
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

      {/* 弹出的经验条 —— 加大加亮（v3 迭代） */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="xpbar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute left-0 pointer-events-none z-[102] flex items-center gap-1.5"
            style={{ bottom: 'calc(100% + 4px)', whiteSpace: 'nowrap' }}
          >
            {/* [2026-05-10 像素风] 深槽 + 3 阶 stepped 填充 + 1px 顶部硬高光 + 6 段对齐刻度 */}
            <div
              className="relative"
              style={{
                width: 144,
                height: 11,
                background: '#0a0e14',
                border: '1px solid #1c2632',
                /* 去掉所有 blur 阴影；只用 1px 硬偏移做立体感 */
                boxShadow:
                  'inset 0 1px 0 rgba(0,0,0,0.9), ' +
                  'inset 1px 0 0 rgba(0,0,0,0.7), ' +
                  '0 1px 0 rgba(40,72,120,0.55)',
                imageRendering: 'pixelated',
                borderRadius: 0,
              }}
            >
              <motion.div
                className="h-full"
                initial={{ width: pct + '%' }}
                animate={{ width: pct + '%' }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
                style={{
                  /* 3 阶 stepped：暗→中→亮，硬切色块（无平滑渐变） */
                  background: levelUpFlash
                    ? 'linear-gradient(180deg, #fff7c8 0%, #fff7c8 27%, #ffd24a 27%, #ffd24a 73%, #b07a14 73%, #b07a14 100%)'
                    : 'linear-gradient(180deg, #d8ecff 0%, #d8ecff 27%, #5a8cc8 27%, #5a8cc8 73%, #2c4878 73%, #2c4878 100%)',
                  /* 右沿 1px 硬亮边，模拟"前进光"；无 blur */
                  boxShadow: levelUpFlash
                    ? 'inset -1px 0 0 #fff7c8, inset 0 1px 0 #fff7c8'
                    : 'inset -1px 0 0 #d8ecff, inset 0 1px 0 #d8ecff',
                  imageRendering: 'pixelated',
                }}
              />
              {/* 6 段对齐刻度：每 24px 一道 1px 黑色硬线（144/6 整除） */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, ' +
                      'transparent 0, transparent 23px, ' +
                      'rgba(0,0,0,0.7) 23px, rgba(0,0,0,0.7) 24px)',
                  imageRendering: 'pixelated',
                }}
              />
              {/* 顶部 1px 硬高光（不渐变） */}
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                  height: 1,
                  background: levelUpFlash ? 'rgba(255,247,200,0.5)' : 'rgba(216,236,255,0.45)',
                }}
              />
              {/* 底部 1px 硬阴影 */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: 1,
                  background: 'rgba(0,0,0,0.55)',
                }}
              />
            </div>
            {/* 右侧数字 */}
            <span
              className="font-mono font-bold"
              style={{
                fontSize: 10,
                color: '#a8d0ff',
                textShadow: '0 1px 0 rgba(0,0,0,0.9), 0 0 3px rgba(104,160,232,0.55)',
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
