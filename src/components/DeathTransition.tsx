/**
 * DeathTransition.tsx — 玩家致命一击后的死亡过渡演出 (2026-05-09 v6)
 *
 * v6 调整（用户反馈：死亡太突然，要抖 2 拍再下落）：
 *   总时长 1000ms：抖动 420ms + 坠落 300ms + 黑幕 180ms + 缓冲 100ms。
 *   抖动阶段保留在原位（y 不变），先"定格颤抖"2 下节拍感；之后才失重下落。
 *
 * 时序（总 1000ms）：
 *   1. (0.00s - 0.42s) 双手原地抖动 2 拍（-3→+3→-3→+3→0）
 *   2. (0.42s - 0.72s) 失重坠落出屏（y: 0 → 320）
 *   3. (0.72s - 0.90s) 黑幕在 0.18s 内 fade 满
 *   4. (0.90s - 1.00s) 黑幕保持，外层切换到 GameOverScreen
 */
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { ClassLeftHand, ClassRightHand } from './ClassHands';

interface DeathTransitionProps {
  visible: boolean;
  onComplete?: () => void;
}

const SHAKE_MS = 420;
const FALL_MS = 300;
const HANDS_DURATION_MS = SHAKE_MS + FALL_MS;  // 720
const FADE_BLACK_MS = 180;
const HOLD_MS = 100;
const TOTAL_DURATION_MS = HANDS_DURATION_MS + FADE_BLACK_MS + HOLD_MS;  // 1000

const LEFT_BASE_ROT = 15;
const RIGHT_BASE_ROT = -15;
const HAND_SCALE = 0.92;
const HAND_BOTTOM_VH = '28vh';
const HAND_OFFSET_X = '-32px';

export const DeathTransition: React.FC<DeathTransitionProps> = ({ visible, onComplete }) => {
  const { game } = useGameContext();
  const playerClass = game.playerClass;

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => onComplete?.(), TOTAL_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [visible, onComplete]);

  if (!visible) return null;

  // 抖 2 拍：0 → -3 → +3 → -3 → +3 → 0 占 SHAKE_MS，之后立刻失重下落
  // 整体 8 帧 keyframe 映射到 HANDS_DURATION_MS 上
  const shakeRatio = SHAKE_MS / HANDS_DURATION_MS; // 0.583
  const tShake = [
    0,
    shakeRatio * 0.2,
    shakeRatio * 0.4,
    shakeRatio * 0.6,
    shakeRatio * 0.8,
    shakeRatio,
    shakeRatio + (1 - shakeRatio) * 0.5,
    1,
  ] as const;

  return (
    <div
      className="fixed inset-0 pointer-events-auto overflow-hidden"
      style={{ zIndex: 9998, background: 'var(--dungeon-bg)' }}
      aria-hidden
    >
      {/* 左手 */}
      <motion.div
        className="absolute"
        style={{
          left: HAND_OFFSET_X,
          bottom: HAND_BOTTOM_VH,
          transformOrigin: 'bottom left',
        }}
        initial={{ x: 0, y: 0, rotate: LEFT_BASE_ROT, scale: HAND_SCALE, opacity: 1 }}
        animate={{
          x: [0, -3, 3, -3, 3, 0, -22, -50],
          y: [0, 0, 0, 0, 0, 0, 120, 320],
          rotate: [
            LEFT_BASE_ROT,
            LEFT_BASE_ROT - 4, LEFT_BASE_ROT + 4,
            LEFT_BASE_ROT - 4, LEFT_BASE_ROT + 4,
            LEFT_BASE_ROT,
            LEFT_BASE_ROT - 35, LEFT_BASE_ROT - 70,
          ],
          scale: [HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE * 0.92, HAND_SCALE * 0.85],
          opacity: [1, 1, 1, 1, 1, 1, 0.75, 0],
        }}
        transition={{
          duration: HANDS_DURATION_MS / 1000,
          ease: 'easeIn',
          times: [...tShake],
        }}
      >
        <div style={{ filter: 'drop-shadow(0 0 6px rgba(220,40,40,0.55))' }}>
          <ClassLeftHand playerClass={playerClass} />
        </div>
      </motion.div>

      {/* 右手 */}
      <motion.div
        className="absolute"
        style={{
          right: HAND_OFFSET_X,
          bottom: HAND_BOTTOM_VH,
          transformOrigin: 'bottom right',
        }}
        initial={{ x: 0, y: 0, rotate: RIGHT_BASE_ROT, scale: HAND_SCALE, opacity: 1 }}
        animate={{
          x: [0, 3, -3, 3, -3, 0, 22, 50],
          y: [0, 0, 0, 0, 0, 0, 120, 320],
          rotate: [
            RIGHT_BASE_ROT,
            RIGHT_BASE_ROT + 4, RIGHT_BASE_ROT - 4,
            RIGHT_BASE_ROT + 4, RIGHT_BASE_ROT - 4,
            RIGHT_BASE_ROT,
            RIGHT_BASE_ROT + 35, RIGHT_BASE_ROT + 70,
          ],
          scale: [HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE * 0.92, HAND_SCALE * 0.85],
          opacity: [1, 1, 1, 1, 1, 1, 0.75, 0],
        }}
        transition={{
          duration: HANDS_DURATION_MS / 1000,
          ease: 'easeIn',
          times: [...tShake],
        }}
      >
        <div style={{ filter: 'drop-shadow(0 0 6px rgba(220,40,40,0.55))' }}>
          <ClassRightHand playerClass={playerClass} />
        </div>
      </motion.div>

      {/* 黑幕：手坠落完后开始 fade */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1] }}
        transition={{
          duration: TOTAL_DURATION_MS / 1000,
          times: [
            0,
            HANDS_DURATION_MS / TOTAL_DURATION_MS,
            (HANDS_DURATION_MS + FADE_BLACK_MS) / TOTAL_DURATION_MS,
            1,
          ],
        }}
      />
    </div>
  );
};

export default DeathTransition;
