/**
 * BossEntrance — Boss出场演出（像素风警告横幅）
 * 全屏暗幕 + 像素锯齿边框WARNING横条 + Boss名号 + 闪烁警告
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BossEntranceProps {
  visible: boolean;
  bossName: string;
  subtitle?: string;
  chapter: number;
}

const CHAPTER_COLORS: Record<number, { primary: string; glow: string; bg: string; stripe: string }> = {
  1: { primary: '#c8403c', glow: 'rgba(200,64,60,0.6)', bg: 'rgba(10,2,2,0.96)', stripe: '#3a0808' },
  2: { primary: '#68a0e8', glow: 'rgba(100,160,240,0.6)', bg: 'rgba(2,4,12,0.96)', stripe: '#081828' },
  3: { primary: '#f0a040', glow: 'rgba(240,160,64,0.6)', bg: 'rgba(12,4,0,0.96)', stripe: '#281004' },
  4: { primary: '#b068e8', glow: 'rgba(176,104,232,0.6)', bg: 'rgba(6,2,12,0.96)', stripe: '#140828' },
  5: { primary: '#e8d068', glow: 'rgba(232,208,104,0.6)', bg: 'rgba(8,6,2,0.96)', stripe: '#1c1808' },
};

const CHAPTER_SUBTITLES: Record<number, string> = {
  1: '幽暗森林之主',
  2: '冰封山脉之王',
  3: '熔岩深渊守卫',
  4: '暗影要塞领主',
  5: '永恒之巅主宰',
};

export const BossEntrance: React.FC<BossEntranceProps> = ({ visible, bossName, subtitle, chapter }) => {
  const colors = CHAPTER_COLORS[chapter] || CHAPTER_COLORS[1];
  const sub = subtitle || CHAPTER_SUBTITLES[chapter] || '深渊之主';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boss-entrance"
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ zIndex: 998, background: colors.bg, overflow: 'hidden', imageRendering: 'pixelated' as any }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* 扫描线 */}
          <div className="absolute inset-0 pointer-events-none scanlines" style={{ opacity: 0.3 }} />

          {/* 闪烁背景脉冲 */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0, 0.08, 0, 0.05, 0, 0.1, 0] }}
            transition={{ duration: 2, times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 0.85] }}
            style={{ background: `radial-gradient(ellipse at 50% 50%, ${colors.glow} 0%, transparent 55%)` }}
          />

          {/* === 中央警告横条 === */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            className="relative w-full"
            style={{ maxWidth: '360px' }}
          >
            {/* 上边像素锯齿 */}
            <div style={{
              height: '4px', width: '100%',
              background: `repeating-linear-gradient(90deg, ${colors.primary} 0px, ${colors.primary} 4px, transparent 4px, transparent 8px)`,
            }} />
            {/* 上边框线 */}
            <div style={{ height: '2px', background: colors.primary }} />

            {/* 横条主体 */}
            <div style={{
              background: `repeating-linear-gradient(90deg, ${colors.stripe} 0px, ${colors.stripe} 8px, transparent 8px, transparent 16px)`,
              padding: '12px 16px',
              position: 'relative',
            }}>
              {/* WARNING 闪烁 */}
              <motion.div
                animate={{ opacity: [1, 0.3, 1, 0.3, 1] }}
                transition={{ duration: 1.5, delay: 0.3, repeat: 0 }}
                style={{
                  fontFamily: 'fusion-pixel, monospace',
                  fontSize: '8px',
                  color: colors.primary,
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  marginBottom: '6px',
                  textShadow: `0 0 4px ${colors.glow}`,
                }}
              >
                ▲ WARNING ▲
              </motion.div>

              {/* Boss名号 */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, x: [0, -2, 2, -1, 1, 0] }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  fontFamily: 'fusion-pixel, monospace',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#fff',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                  textShadow: `0 0 8px ${colors.glow}, 0 2px 0 rgba(0,0,0,0.9), 0 0 20px ${colors.glow}`,
                  lineHeight: 1.2,
                }}
              >
                {bossName}
              </motion.div>

              {/* 副标题 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                style={{
                  fontFamily: 'fusion-pixel, monospace',
                  fontSize: '9px',
                  color: colors.primary,
                  textAlign: 'center',
                  letterSpacing: '0.25em',
                  marginTop: '4px',
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
                  fontSize: '7px',
                  color: colors.primary,
                  textAlign: 'center',
                  letterSpacing: '0.4em',
                  marginTop: '8px',
                }}
              >
                ◆ BOSS BATTLE ◆
              </motion.div>
            </div>

            {/* 下边框线 */}
            <div style={{ height: '2px', background: colors.primary }} />
            {/* 下边像素锯齿 */}
            <div style={{
              height: '4px', width: '100%',
              background: `repeating-linear-gradient(90deg, ${colors.primary} 0px, ${colors.primary} 4px, transparent 4px, transparent 8px)`,
            }} />
          </motion.div>

          {/* 全屏震动 */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ x: [0, -3, 4, -2, 3, -1, 0], y: [0, 2, -3, 2, -1, 0] }}
            transition={{ duration: 0.5, delay: 0.4 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BossEntrance;
