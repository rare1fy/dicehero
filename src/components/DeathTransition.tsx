/**
 * DeathTransition.tsx — 玩家致命一击后的死亡过渡演出 (2026-05-09 v2)
 *
 * v2 时序（总时长约 1.4s）：
 *   1. (0.0s - 0.5s) 双手在屏幕底部紧张抖动（颤抖）→ 失重坠落出屏外
 *   2. (0.5s - 1.0s) 黑幕在 0.5s 内 fade 满（用户要求加速）
 *   3. (1.0s - 1.4s) 黑幕保持，外层切换到 GameOverScreen，由它自身 fade in
 *
 * v2 改动：
 *   - 双手用大尺寸 PixelFist（size 8），放屏幕底部偏左+偏右模拟"玩家自己的手"
 *   - 抖动幅度更紧张（高频小幅），坠落带向下旋转 + 透明度衰减
 *   - 黑幕 fade 从 1.1s 缩到 0.5s
 */
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PixelFist } from './PixelIcons';

interface DeathTransitionProps {
  visible: boolean;
  onComplete?: () => void;
}

const HANDS_DURATION_MS = 500;
const FADE_BLACK_MS = 500;
const HOLD_MS = 400;
const TOTAL_DURATION_MS = HANDS_DURATION_MS + FADE_BLACK_MS + HOLD_MS;

export const DeathTransition: React.FC<DeathTransitionProps> = ({ visible, onComplete }) => {
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => onComplete?.(), TOTAL_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 9998 }}
      aria-hidden
    >
      {/* 双手抖动→坠落：屏幕底部 1/4 处左右开展，模拟玩家视角双手 */}
      {/* 左手（偏左、稍微向内倾） */}
      <motion.div
        className="absolute"
        style={{ left: '20%', bottom: '25%' }}
        initial={{ x: 0, y: 0, opacity: 1, rotate: -22 }}
        animate={{
          // 紧张抖动（前 60%）→ 坠落（后 40%）
          x: [0, -3, 3, -2, 2, -2, 2, -1, 0, -8, -16],
          y: [0, 2, -1, 2, -1, 1, 0, 1, 6, 80, 220],
          opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.7, 0],
          rotate: [-22, -25, -19, -24, -20, -23, -20, -22, -22, -45, -75],
        }}
        transition={{
          duration: HANDS_DURATION_MS / 1000,
          ease: 'easeIn',
          times: [0, 0.06, 0.13, 0.2, 0.27, 0.34, 0.41, 0.48, 0.55, 0.78, 1],
        }}
      >
        <div style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 8px rgba(220,50,50,0.4))' }}>
          <PixelFist size={8} />
        </div>
      </motion.div>

      {/* 右手（偏右、镜像、稍微向内倾） */}
      <motion.div
        className="absolute"
        style={{ right: '20%', bottom: '25%' }}
        initial={{ x: 0, y: 0, opacity: 1, rotate: 22 }}
        animate={{
          x: [0, 3, -3, 2, -2, 2, -2, 1, 0, 8, 16],
          y: [0, -1, 2, -1, 2, 0, 1, 0, 6, 80, 220],
          opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.7, 0],
          rotate: [22, 19, 25, 20, 24, 21, 23, 22, 22, 45, 75],
        }}
        transition={{
          duration: HANDS_DURATION_MS / 1000,
          ease: 'easeIn',
          times: [0, 0.06, 0.13, 0.2, 0.27, 0.34, 0.41, 0.48, 0.55, 0.78, 1],
        }}
      >
        {/* 右手用 scaleX(-1) 镜像 */}
        <div style={{ transform: 'scaleX(-1)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 8px rgba(220,50,50,0.4))' }}>
          <PixelFist size={8} />
        </div>
      </motion.div>

      {/* 黑幕：手坠落完后开始 fade，0.5s 内全黑 */}
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
