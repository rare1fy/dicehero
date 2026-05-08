/**
 * BossTauntEntrance.tsx — Boss 战斗开场挑衅短演出（刘叔 2026-05-08）
 *
 * 与 BossEntrance 的区别：
 *   - BossEntrance 是"警告横幅+闪烁"的大演出，在正式遭遇前做一次压迫感渲染
 *   - BossTauntEntrance 是"Boss 本尊在战斗场景中现身 + 说两句挑衅的台词 + 退场"的**快速短剧**
 *     不做全屏横幅，只在战斗场景中间一小块区域做戏剧感的 1 秒级插入
 *
 * 时序（总 ~2.4s，不可跳过）：
 *   0   → 300ms    ：暗幕 fade in + Boss 本尊像素从右侧滑入，落到中间偏上
 *   300 → 1800ms   ：气泡依次弹出两句挑衅台词（每句 700ms 显示 + 快切）
 *   1800→ 2400ms   ：Boss 原地静帧一瞬 + 淡出
 *
 * 像素风约束（刘叔 RULES）：
 *   - 禁用 emoji / css 渐变文字
 *   - 所有美术复用 PixelSprite + EnemyQuoteBubble + fusion-pixel 字体
 *   - 章节配色取自 BossEntrance.CHAPTER_COLORS
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelSprite } from './PixelSprite';

interface BossTauntProps {
  visible: boolean;
  bossName: string;
  chapter: number;
  /** 两句挑衅台词（来自 Boss.quotes.enter，取前 2 句） */
  lines: string[];
}

const CHAPTER_COLORS: Record<number, { primary: string; glow: string; bg: string }> = {
  1: { primary: '#c8403c', glow: 'rgba(200,64,60,0.55)', bg: 'rgba(10,2,2,0.65)' },
  2: { primary: '#68a0e8', glow: 'rgba(100,160,240,0.55)', bg: 'rgba(2,4,12,0.65)' },
  3: { primary: '#f0a040', glow: 'rgba(240,160,64,0.55)', bg: 'rgba(12,4,0,0.65)' },
  4: { primary: '#b068e8', glow: 'rgba(176,104,232,0.55)', bg: 'rgba(6,2,12,0.65)' },
  5: { primary: '#e8d068', glow: 'rgba(232,208,104,0.55)', bg: 'rgba(8,6,2,0.65)' },
};

export const BossTauntEntrance: React.FC<BossTauntProps> = ({ visible, bossName, chapter, lines }) => {
  const colors = CHAPTER_COLORS[chapter] || CHAPTER_COLORS[1];
  // 当前播到第几句台词
  const [lineIdx, setLineIdx] = useState(0);

  // 时序：
  //   0ms   可见 → 重置 lineIdx=0
  //   700ms 切到第 2 句
  useEffect(() => {
    if (!visible) return;
    setLineIdx(0);
    const t = window.setTimeout(() => setLineIdx(1), 900);
    return () => window.clearTimeout(t);
  }, [visible]);

  const safeLines = lines.length >= 2 ? lines.slice(0, 2) : lines.length === 1 ? [lines[0], lines[0]] : ['...', '...'];
  const currentLine = safeLines[lineIdx] || safeLines[0];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boss-taunt"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ zIndex: 1000, background: colors.bg }}
        >
          {/* Boss 本尊：从右侧滑入 */}
          <motion.div
            key="taunt-sprite"
            initial={{ x: 120, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.6, 0.3, 1.0] }}
            className="flex flex-col items-center gap-3"
            style={{
              filter: `drop-shadow(0 0 10px ${colors.glow}) drop-shadow(0 0 24px ${colors.glow})`,
            }}
          >
            {/* 像素本尊，放大到 size=8 给戏剧性 */}
            <div style={{ transform: 'translateY(-8px)' }}>
              <PixelSprite name={bossName} size={8} />
            </div>

            {/* Boss 名字横条（像素边框 + fusion-pixel 字体） */}
            <div
              style={{
                padding: '4px 16px',
                background: 'rgba(0,0,0,0.7)',
                border: `2px solid ${colors.primary}`,
                borderRadius: '2px',
                fontFamily: '"fusion-pixel", monospace',
                fontSize: '14px',
                color: colors.primary,
                letterSpacing: '2px',
                textShadow: '1px 1px 0 #000',
              }}
            >
              {bossName}
            </div>

            {/* 挑衅台词气泡（不用 EnemyQuoteBubble 是因为位置固定 + 更大） */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`line-${lineIdx}`}
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                style={{
                  maxWidth: '260px',
                  padding: '8px 14px',
                  background: '#f8f4e8',
                  border: '3px solid #2a1608',
                  borderRadius: '3px',
                  fontFamily: '"fusion-pixel", monospace',
                  fontSize: '12px',
                  color: '#2a1608',
                  lineHeight: '1.4',
                  boxShadow: `4px 4px 0 rgba(0,0,0,0.4)`,
                  textAlign: 'center' as const,
                }}
              >
                {currentLine}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
