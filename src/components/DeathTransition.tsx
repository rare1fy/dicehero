/**
 * DeathTransition.tsx — 玩家致命一击后的死亡过渡演出 (2026-05-09)
 *
 * 时序（总时长约 1.8s）：
 *   1. (0.0s - 0.6s) 双手像素剪影从玩家 HUD 位置开始抖动，慢慢向下掉落沉入屏幕外
 *   2. (0.6s - 1.1s) 整屏黑幕 fade out（遮住战斗场景，完成场景切换准备）
 *   3. (1.1s - 1.8s) 黑幕 fade in 到死亡结算界面（由外层在 visible=false 时挂载 GameOverScreen）
 *
 * 对外暴露：
 *   - visible: boolean   显示/隐藏整个过渡层
 *   - onComplete: () => void  过渡完成回调（外层在此切换 phase -> gameover）
 */
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PixelFist } from './PixelIcons';

interface DeathTransitionProps {
  visible: boolean;
  onComplete?: () => void;
}

const SHAKE_DURATION_MS = 600;
const FADE_OUT_DURATION_MS = 500;
const FADE_IN_DURATION_MS = 700;
const TOTAL_DURATION_MS = SHAKE_DURATION_MS + FADE_OUT_DURATION_MS + FADE_IN_DURATION_MS;

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
      {/* 双手抖动下坠 —— 沉到 UI 之下被完全遮住前，先短暂停留抖动 */}
      <motion.div
        className="absolute left-1/2"
        style={{ bottom: '30%', transform: 'translateX(-50%)' }}
        initial={{ y: 0, opacity: 1 }}
        animate={{
          x: [0, -8, 8, -6, 6, -4, 4, -2, 2, 0],
          y: [0, 4, 8, 14, 28, 60, 120, 260],
          opacity: [1, 1, 1, 1, 1, 0.85, 0.5, 0],
          rotate: [0, -4, 4, -3, 3, -2, 2, 0],
        }}
        transition={{
          duration: SHAKE_DURATION_MS / 1000,
          ease: 'easeIn',
          times: [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8, 1],
        }}
      >
        <div className="flex gap-3" style={{ filter: 'drop-shadow(0 0 8px rgba(255,80,80,0.4))' }}>
          <div style={{ transform: 'rotate(-18deg)' }}><PixelFist size={4} /></div>
          <div style={{ transform: 'rotate(18deg) scaleX(-1)' }}><PixelFist size={4} /></div>
        </div>
      </motion.div>

      {/* 黑幕淡入淡出 —— 全程覆盖整屏，负责遮掉战斗场景并切换到结算界面 */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0, 1, 1],
        }}
        transition={{
          duration: TOTAL_DURATION_MS / 1000,
          times: [
            0,
            SHAKE_DURATION_MS / TOTAL_DURATION_MS,
            (SHAKE_DURATION_MS + FADE_OUT_DURATION_MS) / TOTAL_DURATION_MS,
            1,
          ],
        }}
      />
    </div>
  );
};

export default DeathTransition;
