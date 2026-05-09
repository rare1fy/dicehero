/**
 * BossEntrance — Boss出场演出（像素风警告横幅）
 * 全屏暗幕 + 像素锯齿边框WARNING横条 + Boss名号 + 闪烁警告
 *
 * [2026-05-09 v2] isFinalBoss 模式：
 *   - 独立 FINAL BATTLE 标签 + 金色/紫色强化配色
 *   - 更长持续时间 + 双层震动 + 雷电粒子
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BossEntranceProps {
  visible: boolean;
  bossName: string;
  subtitle?: string;
  chapter: number;
  isFinalBoss?: boolean;
}

const CHAPTER_COLORS: Record<number, { primary: string; glow: string; bg: string; stripe: string }> = {
  1: { primary: '#c8403c', glow: 'rgba(200,64,60,0.6)', bg: 'rgba(10,2,2,0.75)', stripe: '#3a0808' },
  2: { primary: '#68a0e8', glow: 'rgba(100,160,240,0.6)', bg: 'rgba(2,4,12,0.75)', stripe: '#081828' },
  3: { primary: '#f0a040', glow: 'rgba(240,160,64,0.6)', bg: 'rgba(12,4,0,0.75)', stripe: '#281004' },
  4: { primary: '#b068e8', glow: 'rgba(176,104,232,0.6)', bg: 'rgba(6,2,12,0.75)', stripe: '#140828' },
  5: { primary: '#e8d068', glow: 'rgba(232,208,104,0.6)', bg: 'rgba(8,6,2,0.75)', stripe: '#1c1808' },
};

const CHAPTER_SUBTITLES: Record<number, string> = {
  1: '幽暗森林之主',
  2: '冰封山脉之王',
  3: '熔岩深渊守卫',
  4: '暗影要塞领主',
  5: '永恒之巅主宰',
};

/** 终极 BOSS 独立配色：金紫混合 + 更深暗幕 */
const FINAL_COLORS = { primary: '#f0c040', glow: 'rgba(240,192,64,0.75)', bg: 'rgba(8,2,14,0.92)', stripe: '#201040', accent: '#c060ff' };

export const BossEntrance: React.FC<BossEntranceProps> = ({ visible, bossName, subtitle, chapter, isFinalBoss }) => {
  const baseColors = CHAPTER_COLORS[chapter] || CHAPTER_COLORS[1];
  const colors = isFinalBoss ? FINAL_COLORS : baseColors;
  const sub = subtitle || (isFinalBoss ? '终焉主宰' : CHAPTER_SUBTITLES[chapter]) || '深渊之主';
  const accent = isFinalBoss ? FINAL_COLORS.accent : colors.primary;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boss-entrance"
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 998, background: colors.bg, overflow: 'hidden', imageRendering: 'pixelated' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 扫描线 */}
          <div className="absolute inset-0 pointer-events-none scanlines" style={{ opacity: isFinalBoss ? 0.5 : 0.3 }} />

          {/* 闪烁背景脉冲 */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: isFinalBoss ? [0, 0.2, 0.08, 0.16, 0.04, 0.22, 0.08, 0.2, 0] : [0, 0.08, 0, 0.05, 0, 0.1, 0] }}
            transition={{ duration: isFinalBoss ? 3.5 : 2, times: isFinalBoss ? [0, 0.08, 0.18, 0.28, 0.4, 0.55, 0.7, 0.85, 1] : [0, 0.1, 0.2, 0.4, 0.5, 0.7, 0.85] }}
            style={{ background: `radial-gradient(ellipse at 50% 50%, ${colors.glow} 0%, transparent ${isFinalBoss ? '65' : '55'}%)` }}
          />

          {/* 终极 BOSS 独有：金色雷电粒子 */}
          {isFinalBoss && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`bolt-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    width: '2px',
                    height: `${30 + Math.random() * 60}px`,
                    left: `${5 + (i / 12) * 90}%`,
                    top: `${Math.random() * 80}%`,
                    background: FINAL_COLORS.accent,
                    boxShadow: `0 0 8px ${FINAL_COLORS.primary}`,
                    imageRendering: 'pixelated',
                  }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0] }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.15, repeat: 1, repeatDelay: 1.2 }}
                />
              ))}
              {/* 金色火花飘落 */}
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={`spark-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    width: '3px',
                    height: '3px',
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    background: i % 2 === 0 ? FINAL_COLORS.primary : FINAL_COLORS.accent,
                    imageRendering: 'pixelated',
                  }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: 400 + Math.random() * 200, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.5 + Math.random(), delay: 0.3 + i * 0.08, repeat: Infinity }}
                />
              ))}
            </>
          )}

          {/* === 中央警告横条 === */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: isFinalBoss ? 0.6 : 0.4, delay: 0.15, ease: 'easeOut' }}
            className="relative w-full"
            style={{ maxWidth: isFinalBoss ? '420px' : '360px' }}
          >
            {/* 上边像素锯齿 */}
            <div style={{
              height: isFinalBoss ? '6px' : '4px', width: '100%',
              background: `repeating-linear-gradient(90deg, ${colors.primary} 0px, ${colors.primary} 4px, transparent 4px, transparent 8px)`,
            }} />
            {/* 上边框线 */}
            <div style={{ height: isFinalBoss ? '3px' : '2px', background: colors.primary }} />

            {/* 横条主体 */}
            <div style={{
              background: `repeating-linear-gradient(90deg, ${colors.stripe} 0px, ${colors.stripe} 8px, transparent 8px, transparent 16px)`,
              padding: isFinalBoss ? '16px 20px' : '12px 16px',
              position: 'relative',
            }}>
              {/* WARNING 闪烁 */}
              <motion.div
                animate={{ opacity: [1, 0.3, 1, 0.3, 1] }}
                transition={{ duration: 1.5, delay: 0.3, repeat: isFinalBoss ? 1 : 0 }}
                style={{
                  fontFamily: 'fusion-pixel, monospace',
                  fontSize: isFinalBoss ? '10px' : '8px',
                  color: isFinalBoss ? FINAL_COLORS.accent : colors.primary,
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  marginBottom: isFinalBoss ? '8px' : '6px',
                  textShadow: `0 0 4px ${colors.glow}`,
                }}
              >
                {isFinalBoss ? '◆◆ FINAL BATTLE ◆◆' : '▲ WARNING ▲'}
              </motion.div>

              {/* Boss名号 */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, x: isFinalBoss ? [0, -4, 4, -3, 3, -2, 2, 0] : [0, -2, 2, -1, 1, 0] }}
                transition={{ duration: isFinalBoss ? 1.1 : 0.8, delay: 0.4 }}
                style={{
                  fontFamily: 'fusion-pixel, monospace',
                  fontSize: isFinalBoss ? '28px' : '22px',
                  fontWeight: 'bold',
                  color: '#fff',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                  textShadow: `0 0 8px ${colors.glow}, 0 2px 0 rgba(0,0,0,0.9), 0 0 ${isFinalBoss ? '28' : '20'}px ${colors.glow}, 0 0 40px ${accent}80`,
                  lineHeight: 1.2,
                }}
              >
                {bossName}
              </motion.div>

              {/* 副标题 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isFinalBoss ? 0.9 : 0.7 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                style={{
                  fontFamily: 'fusion-pixel, monospace',
                  fontSize: isFinalBoss ? '11px' : '9px',
                  color: isFinalBoss ? FINAL_COLORS.accent : colors.primary,
                  textAlign: 'center',
                  letterSpacing: '0.25em',
                  marginTop: isFinalBoss ? '6px' : '4px',
                  textShadow: `0 0 6px ${colors.glow}`,
                }}
              >
                — {sub} —
              </motion.div>

              {/* BOSS BATTLE 底部 */}
              <motion.div
                animate={{ opacity: [0, 0.8, 0.4, 0.8, 0.4] }}
                transition={{ duration: 2, delay: 0.9 }}
                style={{
                  fontFamily: 'fusion-pixel, monospace',
                  fontSize: isFinalBoss ? '9px' : '7px',
                  color: colors.primary,
                  textAlign: 'center',
                  letterSpacing: '0.4em',
                  marginTop: isFinalBoss ? '10px' : '8px',
                }}
              >
                {isFinalBoss ? '◆ LAST STAND ◆' : '◆ BOSS BATTLE ◆'}
              </motion.div>
            </div>

            {/* 下边框线 */}
            <div style={{ height: isFinalBoss ? '3px' : '2px', background: colors.primary }} />
            {/* 下边像素锯齿 */}
            <div style={{
              height: isFinalBoss ? '6px' : '4px', width: '100%',
              background: `repeating-linear-gradient(90deg, ${colors.primary} 0px, ${colors.primary} 4px, transparent 4px, transparent 8px)`,
            }} />
          </motion.div>

          {/* 全屏震动（终 BOSS 更强） */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={isFinalBoss ? { x: [0, -6, 8, -4, 6, -3, 5, -2, 0], y: [0, 4, -5, 3, -3, 2, -2, 0] } : { x: [0, -3, 4, -2, 3, -1, 0], y: [0, 2, -3, 2, -1, 0] }}
            transition={{ duration: isFinalBoss ? 0.8 : 0.5, delay: 0.4 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BossEntrance;
