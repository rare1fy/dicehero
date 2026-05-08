/**
 * BossTauntEntrance.tsx - Boss 路过嘲讽登场演出 v4 (2026-05-08)
 *
 * 演出时序：
 *   idle  -> enter  : Boss从上方远处(y=-220, scale=0.35)飞入居中位置(y=0, scale=1.0)
 *   enter -> talk1 : 停在中央说第一句台词（气泡在Boss上方）
 *   talk1 -> approach : 玩家点击 -> Boss向前位移到玩家面前(y=+70, scale=1.18)并震动摇晃两下
 *   approach -> talk2 : 震动结束后说第二句（更贴近屏幕底部）
 *   talk2 -> exit  : 玩家点击 -> Boss原地淡出缩小 -> onDismiss
 *
 * 布局特点：
 *   - 所有元素水平居中（flex column + items-center）
 *   - 气泡紧贴Boss上方（marginBottom: 10px 保持视觉连接）
 *   - "点击继续" 文字放屏幕底部居中
 *   - 点击响应区覆盖整个 overlay（inset:0 + pointer-events:all）
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelSprite } from './PixelSprite';

interface BossTauntProps {
  visible: boolean;
  bossName: string;
  chapter: number;
  lines: string[];
  onDismiss?: () => void;
}

const CHAPTER_GLOW: Record<number, string> = {
  1: '#e06030',
  2: '#4898e8',
  3: '#f09030',
  4: '#c060e8',
  5: '#e8c840',
};

type Phase = 'idle' | 'enter' | 'talk1' | 'approach' | 'talk2' | 'exit';

export const BossTauntEntrance: React.FC<BossTauntProps> = ({
  visible, bossName, chapter, lines, onDismiss,
}) => {
  const glowColor = CHAPTER_GLOW[chapter] || CHAPTER_GLOW[1];
  const [phase, setPhase] = useState<Phase>('idle');

  const safeLines = lines.length >= 2
    ? lines.slice(0, 2)
    : lines.length === 1
    ? [lines[0], lines[0]]
    : ['...', 'enjoy your last battle.'];

  useEffect(() => {
    if (!visible) { setPhase('idle'); return; }
    setPhase('enter');
    const t = window.setTimeout(() => setPhase('talk1'), 720);
    return () => window.clearTimeout(t);
  }, [visible]);

  const handleTap = useCallback(() => {
    if (phase === 'talk1') {
      setPhase('approach');
      window.setTimeout(() => setPhase('talk2'), 680);
    } else if (phase === 'talk2') {
      setPhase('exit');
      window.setTimeout(() => { onDismiss?.(); }, 380);
    }
  }, [phase, onDismiss]);

  const showBubble = phase === 'talk1' || phase === 'talk2';
  const currentLine = phase === 'talk2' ? safeLines[1] : safeLines[0];

  const spriteAnimate =
    phase === 'enter'    ? { y: 0,    opacity: 1, scale: 1.0,  x: 0,               rotate: 0 } :
    phase === 'talk1'    ? { y: 0,    opacity: 1, scale: 1.0,  x: 0,               rotate: 0 } :
    // [FIX 2026-05-08] approach/talk2 不再纵向下压，靠 scale 1.18 传达"逼近"感
    phase === 'approach' ? { y: 0,    opacity: 1, scale: 1.18, x: [0, -5, 5, -4, 4, -3, 3, 0], rotate: [0, -3, 3, -3, 3, -2, 2, 0] } :
    phase === 'talk2'    ? { y: 0,    opacity: 1, scale: 1.18, x: 0,               rotate: 0 } :
    phase === 'exit'     ? { y: 0,    opacity: 0, scale: 0.9,  x: 0,               rotate: 0 } :
                           { y: -220, opacity: 0, scale: 0.35, x: 0,               rotate: 0 };

  const spriteTransition =
    phase === 'enter'    ? { duration: 0.72, ease: 'easeOut' as const } :
    phase === 'approach' ? { duration: 0.68, ease: 'easeInOut' as const } :
    phase === 'exit'     ? { duration: 0.36, ease: 'easeIn' as const } :
    { duration: 0.18 };

  const [tapHint, setTapHint] = useState(true);
  useEffect(() => {
    if (!showBubble) return;
    const t = window.setInterval(() => setTapHint(p => !p), 600);
    return () => window.clearInterval(t);
  }, [showBubble]);

  const interactive = phase === 'talk1' || phase === 'talk2';

  return (
    <AnimatePresence>
      {visible && phase !== 'idle' && (
        <>
          {/* ── 场景层：Boss 精灵 + 气泡（贴地，和普通敌人同一高度）── */}
          <motion.div
            key="boss-taunt-scene"
            style={{
              // [FIX v6] 改用 absolute，相对根容器定位，避免被战斗场景的 filter/overflow 截断
              // 根容器是 relative h-[100dvh]，无 transform/filter，绝对定位安全
              position: 'absolute',
              inset: 0,
              zIndex: 200,
              pointerEvents: interactive ? 'all' : 'none',
              // 靠底对齐，paddingBottom 让 Boss 脚底落在战斗背景"地面线"位置
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: '38%',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={handleTap}
          >
            {/* 气泡：在 Boss 上方 */}
            <AnimatePresence mode="wait">
              {showBubble && (
                <motion.div
                  key={`bubble-${phase}`}
                  initial={{ opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.92 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    maxWidth: '240px',
                    minWidth: '110px',
                    padding: '10px 14px',
                    marginBottom: '10px',
                    background: 'rgba(30,18,0,0.96)',
                    border: `2px solid ${glowColor}`,
                    borderRadius: '3px',
                    fontFamily: '"fusion-pixel", monospace',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    color: glowColor,
                    textAlign: 'center' as const,
                    wordBreak: 'break-word' as const,
                    position: 'relative',
                    pointerEvents: 'none',
                  }}
                >
                  {currentLine}
                  <svg
                    width="12" height="7" viewBox="0 0 12 7"
                    style={{ position: 'absolute', bottom: '-7px', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <polygon points="0,0 12,0 6,7" fill="rgba(30,18,0,0.96)" />
                    <line x1="0" y1="0" x2="6" y2="7" stroke={glowColor} strokeWidth="2" />
                    <line x1="12" y1="0" x2="6" y2="7" stroke={glowColor} strokeWidth="2" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Boss 精灵 */}
            <motion.div
              initial={{ y: -220, opacity: 0, scale: 0.35, x: 0, rotate: 0 }}
              animate={spriteAnimate}
              transition={spriteTransition}
              style={{
                filter:
                  phase === 'approach'
                    ? `drop-shadow(0 0 22px ${glowColor}) drop-shadow(0 0 50px ${glowColor}b0)`
                    : phase === 'enter' || phase === 'talk1' || phase === 'talk2'
                      ? `drop-shadow(0 0 14px ${glowColor}a0) drop-shadow(0 0 30px ${glowColor}60)`
                      : `drop-shadow(0 0 8px ${glowColor}80)`,
                imageRendering: 'pixelated',
                pointerEvents: 'none',
              }}
            >
              <PixelSprite name={bossName} size={8} />
            </motion.div>

            {/* 名牌 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: phase === 'exit' ? 0 : 1, y: 0 }}
              transition={{ duration: 0.25, delay: phase === 'enter' ? 0.3 : 0 }}
              style={{
                marginTop: '6px',
                padding: '2px 14px',
                background: 'rgba(0,0,0,0.82)',
                border: `1px solid ${glowColor}`,
                borderRadius: '2px',
                fontFamily: '"fusion-pixel", monospace',
                fontSize: '11px',
                color: glowColor,
                letterSpacing: '2px',
                textShadow: '1px 1px 0 #000',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {bossName}
            </motion.div>
          </motion.div>

          {/* ── UI 层：点击继续提示（fixed，独立于场景层，不受场景布局影响）── */}
          <AnimatePresence>
            {showBubble && (
              <motion.div
                key="tap-hint-ui"
                initial={{ opacity: 0 }}
                animate={{ opacity: tapHint ? 0.85 : 0.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  bottom: '14%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1100,
                  fontFamily: '"fusion-pixel", monospace',
                  fontSize: '11px',
                  color: glowColor,
                  textShadow: '1px 1px 0 #000',
                  pointerEvents: 'none',
                  letterSpacing: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                ▶ 点击继续 ◀
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
