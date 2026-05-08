content = """/**
 * BossTauntEntrance.tsx — Boss 路过嘲讽登场演出（刘叔 2026-05-08 重写）
 *
 * 不再是全屏弹窗，而是 Boss 本尊真正出现在战斗场景中：
 *   - 从右侧走入画面，落在敌人区域右侧位置
 *   - 登场时有弹跳缩放 + 发光脉冲（和 Boss 战斗入场动画同级）
 *   - 对话气泡用 boss 配色（金色），区别于普通敌人的白色气泡
 *   - 无全屏遮罩，玩家能看到背后的战斗场景
 *   - 说完两句台词后走回右侧退场
 *
 * 动画时序（总 ~2.8s）：
 *   0    → 400ms  ：从右侧 x=140 走入，落地 x=0，同步缩放弹跳
 *   400  → 500ms  ：落地冲击帧（轻微下压）
 *   500  → 1300ms ：第一句台词气泡出现
 *   1300 → 2100ms ：切换到第二句台词
 *   2100 → 2600ms ：气泡消失，Boss 退场向右走出（x 回 140，opacity->0）
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelSprite } from './PixelSprite';

interface BossTauntProps {
  visible: boolean;
  bossName: string;
  chapter: number;
  lines: string[];
}

// Boss 专属气泡配色（金色系），区别于普通敌人白色气泡
const CHAPTER_GLOW: Record<number, string> = {
  1: '#e06030',
  2: '#4898e8',
  3: '#f09030',
  4: '#c060e8',
  5: '#e8c840',
};

export const BossTauntEntrance: React.FC<BossTauntProps> = ({ visible, bossName, chapter, lines }) => {
  const glowColor = CHAPTER_GLOW[chapter] || CHAPTER_GLOW[1];

  // 动画阶段
  const [phase, setPhase] = useState<'idle' | 'enter' | 'talk1' | 'talk2' | 'exit'>('idle');

  useEffect(() => {
    if (!visible) {
      setPhase('idle');
      return;
    }
    setPhase('enter');
    const t1 = window.setTimeout(() => setPhase('talk1'), 480);
    const t2 = window.setTimeout(() => setPhase('talk2'), 1380);
    const t3 = window.setTimeout(() => setPhase('exit'), 2180);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [visible]);

  const safeLines = lines.length >= 2
    ? lines.slice(0, 2)
    : lines.length === 1
    ? [lines[0], lines[0]]
    : ['……', '你的末日已经近了。'];

  const currentLine = phase === 'talk2' ? safeLines[1] : safeLines[0];
  const showBubble = phase === 'talk1' || phase === 'talk2';

  // Boss精灵的动画变体
  const spriteVariants = {
    hidden: { x: 160, opacity: 0, scale: 0.7 },
    enter: {
      x: 0,
      opacity: 1,
      scale: [0.7, 1.18, 0.94, 1.06, 1.0] as number[],
      transition: {
        x: { duration: 0.42, ease: [0.2, 0.8, 0.3, 1.0] as number[] },
        opacity: { duration: 0.2 },
        scale: { duration: 0.55, times: [0, 0.42, 0.65, 0.82, 1.0], ease: 'easeOut' },
      },
    },
    talk: {
      x: 0,
      opacity: 1,
      scale: 1.0,
      transition: { duration: 0.18 },
    },
    exit: {
      x: 160,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.38, ease: [0.5, 0.0, 0.8, 0.4] as number[] },
    },
  };

  const currentVariant =
    phase === 'enter' ? 'enter' :
    phase === 'exit' ? 'exit' :
    phase === 'idle' ? 'hidden' :
    'talk';

  return (
    <AnimatePresence>
      {visible && phase !== 'idle' && (
        /* 定位在战斗场景右侧，z-[30] 和敌人卡片同层，不遮住左侧敌人 */
        <motion.div
          key="boss-taunt-stage"
          className="absolute pointer-events-none"
          style={{
            right: '8px',
            top: '50%',
            transform: 'translateY(-60%)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          {/* 地面光晕圈 */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.3 }}
            animate={
              phase === 'enter' || phase === 'talk1' || phase === 'talk2'
                ? { opacity: [0, 0.6, 0.35], scaleX: [0.3, 1.2, 1.0], transition: { duration: 0.5 } }
                : { opacity: 0, transition: { duration: 0.2 } }
            }
            style={{
              position: 'absolute',
              bottom: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '12px',
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${glowColor}90 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Boss 气泡（金色配色） */}
          <div style={{ position: 'relative', minHeight: '36px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              {showBubble && (
                <motion.div
                  key={`bubble-${phase}`}
                  initial={{ opacity: 0, y: 6, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'relative',
                    maxWidth: '150px',
                    minWidth: '70px',
                    padding: '5px 8px',
                    background: 'rgba(40,28,0,0.95)',
                    border: `2px solid ${glowColor}`,
                    borderRadius: '2px',
                    fontFamily: '"fusion-pixel", monospace',
                    fontSize: '10px',
                    lineHeight: 1.4,
                    color: glowColor,
                    textAlign: 'center' as const,
                    wordBreak: 'break-all' as const,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.7), 0 0 8px ${glowColor}60`,
                  }}
                >
                  {currentLine}
                  <svg
                    width="8" height="5" viewBox="0 0 8 5"
                    style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', display: 'block' }}
                  >
                    <polygon points="0,0 8,0 4,5" fill="rgba(40,28,0,0.95)" />
                    <line x1="0" y1="0" x2="4" y2="5" stroke={glowColor} strokeWidth="2" />
                    <line x1="8" y1="0" x2="4" y2="5" stroke={glowColor} strokeWidth="2" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Boss 像素本尊 — size=7 让他比普通敌人更大更有压迫感 */}
          <motion.div
            variants={spriteVariants}
            initial="hidden"
            animate={currentVariant}
            style={{
              filter: phase === 'enter'
                ? `drop-shadow(0 0 14px ${glowColor}) drop-shadow(0 0 30px ${glowColor}80)`
                : `drop-shadow(0 0 7px ${glowColor}70)`,
              imageRendering: 'pixelated',
            }}
          >
            <PixelSprite name={bossName} size={7} />
          </motion.div>

          {/* Boss 名字标签 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={phase !== 'idle' && phase !== 'exit' ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.3 }}
            style={{
              padding: '2px 10px',
              background: 'rgba(0,0,0,0.75)',
              border: `1px solid ${glowColor}`,
              borderRadius: '2px',
              fontFamily: '"fusion-pixel", monospace',
              fontSize: '10px',
              color: glowColor,
              letterSpacing: '1px',
              textShadow: '1px 1px 0 #000',
              whiteSpace: 'nowrap',
            }}
          >
            {bossName}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
"""
open('src/components/BossTauntEntrance.tsx', 'w', encoding='utf-8').write(content)
print('OK')
