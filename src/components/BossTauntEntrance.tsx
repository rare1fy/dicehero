/**
 * BossTauntEntrance.tsx - Boss 路过嘲讽登场演出 v7 (2026-05-08)
 *
 * 架构（v7 关键修改）：
 *   - 拆成两个导出组件：
 *     1. <BossTauntScene/>  : 场景层，挂在 EnemyStageView 内部，absolute inset:0
 *        贴着战斗场景底部（justifyContent:flex-end），与普通敌人并排高度
 *     2. <BossTauntHint/>   : UI 层，挂在 DiceHeroGame 根层，fixed 底部居中
 *        点击提示不被战斗场景 overflow:hidden 截断，保证可见
 *   - 共享状态通过外层 useBossTauntState 钩子驱动（phase 由 Scene 推进，Hint 只读展示）
 *
 * 演出时序：
 *   idle  -> enter   : Boss从上方飞入场景底部居中位置
 *   enter -> talk1   : 停在中央说第一句（气泡在Boss上方）
 *   talk1 -> approach: 玩家点击 -> Boss scale 1.18 并震动
 *   approach -> talk2: 说第二句
 *   talk2 -> exit    : 玩家点击 -> 淡出 -> onDismiss
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelSprite } from './PixelSprite';
import { playSound } from '../utils/sound';

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

// ============================================================
// 全局 phase 状态（场景层和UI层共享）
// 用 module-level state + subscribe 模式避免 props drilling
// ============================================================
let _phase: Phase = 'idle';
let _bossName = '';
let _chapter = 1;
let _lines: string[] = [];
let _onDismiss: (() => void) | undefined;
const _listeners = new Set<() => void>();

function _setPhase(p: Phase) {
  _phase = p;
  _listeners.forEach(fn => fn());
}

function useTauntState() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick(t => t + 1);
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  }, []);
  return { phase: _phase, bossName: _bossName, chapter: _chapter, lines: _lines };
}

// ============================================================
// 主入口：驱动 phase 推进，同时挂两个子层（场景层外面用，UI层用 Hint）
// ============================================================
export const BossTauntEntrance: React.FC<BossTauntProps> = ({
  visible, bossName, chapter, lines, onDismiss,
}) => {
  useEffect(() => {
    _bossName = bossName;
    _chapter = chapter;
    _lines = lines;
    _onDismiss = onDismiss;
    if (!visible) {
      _setPhase('idle');
      return;
    }
    _setPhase('enter');
    const t = window.setTimeout(() => _setPhase('talk1'), 720);
    return () => window.clearTimeout(t);
  }, [visible, bossName, chapter, lines, onDismiss]);

  // 这个组件自身不渲染任何 DOM —— 场景层和UI层是独立组件挂在不同位置
  return null;
};

// ============================================================
// 场景层：挂在 EnemyStageView 内部
// absolute inset:0 + flex end -> 贴战斗场景底部，Boss 脚与敌人并排
// ============================================================
export const BossTauntScene: React.FC = () => {
  const { phase, bossName, chapter, lines } = useTauntState();
  const glowColor = CHAPTER_GLOW[chapter] || CHAPTER_GLOW[1];

  const safeLines = lines.length >= 2
    ? lines.slice(0, 2)
    : lines.length === 1
    ? [lines[0], lines[0]]
    : ['...', 'enjoy your last battle.'];

  // 每句台词出现 / 屏震：用 phase 变化 effect 统一处理
  const [shakeKey, setShakeKey] = useState(0);
  useEffect(() => {
    if (phase === 'talk1') {
      // 第一句：低沉说话音
      playSound('boss_laugh');
    } else if (phase === 'talk2') {
      // 第二句：低沉说话音 + 屏震（屏震通过重置 key 触发容器动画）
      playSound('boss_laugh');
      setShakeKey(k => k + 1);
    }
  }, [phase]);

  const handleTap = useCallback(() => {
    if (_phase === 'talk1') {
      _setPhase('approach');
      window.setTimeout(() => _setPhase('talk2'), 680);
    } else if (_phase === 'talk2') {
      _setPhase('exit');
      window.setTimeout(() => { _onDismiss?.(); }, 380);
    }
  }, []);

  const showBubble = phase === 'talk1' || phase === 'talk2';
  const currentLine = phase === 'talk2' ? safeLines[1] : safeLines[0];
  const interactive = phase === 'talk1' || phase === 'talk2';
  const active = phase !== 'idle';

  const spriteAnimate =
    phase === 'enter'    ? { y: 0,    opacity: 1, scale: 1.0,  x: 0,                                rotate: 0 } :
    phase === 'talk1'    ? { y: 0,    opacity: 1, scale: 1.0,  x: 0,                                rotate: 0 } :
    phase === 'approach' ? { y: 0,    opacity: 1, scale: 1.18, x: [0, -5, 5, -4, 4, -3, 3, 0],      rotate: [0, -3, 3, -3, 3, -2, 2, 0] } :
    phase === 'talk2'    ? { y: 0,    opacity: 1, scale: 1.18, x: 0,                                rotate: 0 } :
    phase === 'exit'     ? { y: 0,    opacity: 0, scale: 0.9,  x: 0,                                rotate: 0 } :
                           { y: -220, opacity: 0, scale: 0.35, x: 0,                                rotate: 0 };

  const spriteTransition =
    phase === 'enter'    ? { duration: 0.72, ease: 'easeOut' as const } :
    phase === 'approach' ? { duration: 0.68, ease: 'easeInOut' as const } :
    phase === 'exit'     ? { duration: 0.36, ease: 'easeIn' as const } :
    { duration: 0.18 };

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="boss-taunt-scene"
          style={{
            // 相对 EnemyStageView 根容器定位
            // EnemyStageView 是 flex-col justify-center，敌人 grid 垂直居中
            // → BossTaunt 也用 center 对齐，Boss 位置天然与小怪一致
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            pointerEvents: interactive ? 'all' : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={handleTap}
        >
          {/* 屏震内层：用 shakeKey 重新挂载触发帧动画；只在 talk2 时抖 */}
          <motion.div
            key={`shake-${shakeKey}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            animate={
              shakeKey > 0 && phase === 'talk2'
                ? { x: [0, -8, 9, -7, 6, -4, 3, 0], y: [0, 4, -5, 3, -2, 2, 0, 0] }
                : { x: 0, y: 0 }
            }
            transition={{ duration: 0.45 }}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// UI 层：挂在 DiceHeroGame 根层，fixed 独立于战斗场景
// ============================================================
export const BossTauntHint: React.FC = () => {
  const { phase, chapter } = useTauntState();
  const glowColor = CHAPTER_GLOW[chapter] || CHAPTER_GLOW[1];
  const showBubble = phase === 'talk1' || phase === 'talk2';

  const [tapHint, setTapHint] = useState(true);
  useEffect(() => {
    if (!showBubble) return;
    const t = window.setInterval(() => setTapHint(p => !p), 600);
    return () => window.clearInterval(t);
  }, [showBubble]);

  return (
    <AnimatePresence>
      {showBubble && (
        <motion.div
          key="tap-hint-ui"
          initial={{ opacity: 0 }}
          animate={{ opacity: tapHint ? 0.9 : 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            bottom: '36%',      // 战斗场景中央下方，玩家UI上方缝隙，避开 Boss 精灵本体
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            fontFamily: '"fusion-pixel", monospace',
            fontSize: '12px',
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
  );
};
