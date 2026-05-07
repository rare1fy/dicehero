/**
 * LevelXpBadge.tsx — 等级徽章 + 可弹出经验条
 *
 * 设计要点（2026-05-08 刘叔指令）：
 *  1. 占位在玩家 HUD 状态行，形态 = 像素星 + Lv 数字
 *  2. 点击徽章：向上弹出经验条（显示 当前/下一级）；再点收起
 *  3. 接收经验：自动弹出 → 经验碎片从徽章飞入经验条 → 经验条条填充 → 2s 后自动收起
 *  4. 升级：经验条闪白 + 徽章 scale 弹跳 + "LV UP" 浮字
 *
 * 像素风 & fusion-pixel 字体，复用 PixelStar / 现有 CSS 变量。
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelStar } from './PixelIcons';

interface LevelXpBadgeProps {
  level: number;
  xp: number;
  xpToNext: number;
  /** 最近一次获得的经验量（未使用时传 undefined） */
  lastXpGain?: number;
  /** 最近一次获得的时间戳，变化会触发"接收动画" */
  lastXpGainAt?: number;
}

export const LevelXpBadge: React.FC<LevelXpBadgeProps> = ({ level, xp, xpToNext, lastXpGain, lastXpGainAt }) => {
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [shards, setShards] = useState<number[]>([]);  // 飞行中的经验碎片 id 列表
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [levelUpLabel, setLevelUpLabel] = useState<number | null>(null);
  const prevLevelRef = useRef(level);
  const prevGainAtRef = useRef<number | undefined>(lastXpGainAt);
  const autoCloseTimerRef = useRef<number | null>(null);

  const open = manuallyOpen || autoOpen;
  const pct = Math.min(100, Math.round((xp / Math.max(1, xpToNext)) * 100));

  // 监听经验增益事件
  useEffect(() => {
    if (lastXpGainAt && lastXpGainAt !== prevGainAtRef.current) {
      prevGainAtRef.current = lastXpGainAt;
      const gain = lastXpGain || 0;
      if (gain <= 0) return;

      setAutoOpen(true);

      // 按经验量生成 3-6 个碎片，错峰飞入
      const shardCount = Math.min(6, Math.max(3, Math.floor(gain / 10)));
      const ids: number[] = [];
      for (let i = 0; i < shardCount; i++) ids.push(Date.now() + i);
      setShards(ids);
      // 每个碎片存活 0.6s，错峰发射
      ids.forEach((id, idx) => {
        setTimeout(() => {
          setShards(prev => prev.filter(x => x !== id));
        }, 600 + idx * 80);
      });

      // 2s 后自动收起
      if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = window.setTimeout(() => {
        setAutoOpen(false);
      }, 2000);
    }
  }, [lastXpGainAt, lastXpGain]);

  // 监听升级
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setLevelUpFlash(true);
      setLevelUpLabel(level);
      setAutoOpen(true);
      window.setTimeout(() => setLevelUpFlash(false), 600);
      window.setTimeout(() => setLevelUpLabel(null), 1600);
      if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = window.setTimeout(() => setAutoOpen(false), 2500);
    }
    prevLevelRef.current = level;
  }, [level]);

  return (
    <div className="relative shrink-0" style={{ fontFamily: '"fusion-pixel", monospace' }}>
      {/* 徽章本体 —— 像素星 + Lv 数字 */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); setManuallyOpen(v => !v); }}
        animate={levelUpFlash ? { scale: [1, 1.4, 1], rotate: [0, -6, 6, 0] } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-0.5 px-1 py-0.5 cursor-pointer"
        style={{
          background: levelUpFlash
            ? 'linear-gradient(180deg, rgba(255,240,160,1) 0%, rgba(232,184,48,0.9) 100%)'
            : 'linear-gradient(180deg, rgba(60,40,90,0.85) 0%, rgba(30,20,60,0.95) 100%)',
          border: '2px solid ' + (levelUpFlash ? '#fff9c4' : '#c080ff'),
          borderRadius: 2,
          boxShadow: levelUpFlash
            ? '0 0 12px rgba(255,240,160,0.9), 0 0 20px rgba(232,184,48,0.6)'
            : '0 0 6px rgba(160,80,224,0.4)',
          minWidth: 34,
          height: 16,
          lineHeight: 1,
        }}
        title="点击查看经验"
      >
        <PixelStar size={1} />
        <span className="text-[10px] font-black tracking-wider pixel-text-shadow" style={{ color: levelUpFlash ? '#3a1a00' : '#fff' }}>
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

      {/* 弹出的经验条（绝对定位到徽章上方） */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="xpbar"
            initial={{ opacity: 0, y: 6, scaleX: 0.3 }}
            animate={{ opacity: 1, y: 0, scaleX: 1 }}
            exit={{ opacity: 0, y: 6, scaleX: 0.5 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute left-0 pointer-events-none z-[102]"
            style={{
              bottom: 'calc(100% + 4px)',
              transformOrigin: 'left center',
              width: 120,
            }}
          >
            {/* 经验条容器 */}
            <div
              className="relative"
              style={{
                height: 10,
                background: 'rgba(10,6,20,0.92)',
                border: '2px solid #c080ff',
                borderRadius: 2,
                boxShadow: '0 0 10px rgba(160,80,224,0.55), inset 0 0 4px rgba(0,0,0,0.6)',
                padding: 1,
              }}
            >
              <motion.div
                className="h-full"
                animate={{ width: pct + '%' }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{
                  background: levelUpFlash
                    ? 'linear-gradient(90deg, #fff9c4 0%, #ffd24a 50%, #fff9c4 100%)'
                    : 'linear-gradient(90deg, #a050e0 0%, #c080ff 50%, #e0a0ff 100%)',
                  boxShadow: '0 0 6px rgba(192,128,255,0.8)',
                }}
              />
              {/* 刻度小段 */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 11px, rgba(0,0,0,0.35) 11px, rgba(0,0,0,0.35) 12px)',
              }} />
            </div>
            {/* 数字标签 */}
            <div className="flex items-center justify-between mt-0.5" style={{ fontSize: 8, lineHeight: 1 }}>
              <span style={{ color: '#c080ff', textShadow: '0 1px 0 rgba(0,0,0,0.7)' }}>EXP</span>
              <span className="font-mono font-bold" style={{ color: '#fff', textShadow: '0 1px 0 rgba(0,0,0,0.7)' }}>
                {xp}/{xpToNext}
              </span>
            </div>

            {/* 经验碎片飞入动画 —— 从徽章左下（起点 0,30）飞到经验条中部 */}
            <AnimatePresence>
              {shards.map((id, idx) => (
                <motion.span
                  key={id}
                  initial={{ opacity: 0, x: 0, y: 30, scale: 0.4, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    x: [0, 18 + idx * 12, 40 + idx * 12],
                    y: [30, 10, 5],
                    scale: [0.4, 1.1, 0.6],
                    rotate: [0, 120 + idx * 30, 240],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, delay: idx * 0.06, ease: 'easeOut' }}
                  className="absolute"
                  style={{
                    left: 0, top: 0,
                    width: 6, height: 6,
                    background: 'linear-gradient(180deg, #e0a0ff 0%, #a050e0 100%)',
                    borderRadius: 1,
                    boxShadow: '0 0 6px rgba(192,128,255,0.9), 0 0 12px rgba(160,80,224,0.6)',
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};