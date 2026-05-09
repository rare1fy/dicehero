/**
 * DeathTransition.tsx — 玩家致命一击后的死亡过渡演出 (2026-05-09 v5)
 *
 * v5 调整（用户反馈：v4 700ms 还是太长）：
 *   总时长压到 500ms：手部 220ms + 黑幕 180ms + 缓冲 100ms。
 *
 * 时序（总时长 500ms）：
 *   1. (0.00s - 0.22s) 双手急促抖动 → 失重坠落出屏
 *   2. (0.22s - 0.40s) 黑幕在 0.18s 内 fade 满
 *   3. (0.40s - 0.50s) 黑幕保持，外层切换到 GameOverScreen
 */
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { ClassLeftHand, ClassRightHand } from './ClassHands';

interface DeathTransitionProps {
  visible: boolean;
  onComplete?: () => void;
}

const HANDS_DURATION_MS = 220;
const FADE_BLACK_MS = 180;
const HOLD_MS = 100;
const TOTAL_DURATION_MS = HANDS_DURATION_MS + FADE_BLACK_MS + HOLD_MS;

/**
 * 战斗场景双手 transform（来自 index.css .hand-left/right）：
 *   .hand-left  : rotate(15deg)  scale(0.92), 锚 bottom-left, left:-32px bottom:-42px
 *   .hand-right : rotate(-15deg) scale(0.92), 锚 bottom-right, right:-32px bottom:-42px
 * 在战斗布局中，stage 容器底部约对应屏幕约 60~70% vh 处（BattleHud 占下半部）。
 * DeathTransition 是 fullscreen 覆盖，把双手 anchor 定在屏幕底部 35vh 附近，
 * 让用户视觉上看到"那双手还在原位"。
 */
const LEFT_BASE_ROT = 15;
const RIGHT_BASE_ROT = -15;
const HAND_SCALE = 0.92;
/** 双手垂直位置：从屏幕底部往上 28%（≈ 360px on 1280h），近似战斗中 stage 容器底部 */
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

  // [v4] 5 帧 keyframes：抖2拍 → 失重 → 急坠 → 消失。300ms 内观感清晰
  const tShake = [0, 0.2, 0.4, 0.7, 1] as const;

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
          x: [0, -3, 2, -22, -50],
          y: [0, 2, -1, 120, 320],
          rotate: [LEFT_BASE_ROT, LEFT_BASE_ROT - 3, LEFT_BASE_ROT + 2, LEFT_BASE_ROT - 35, LEFT_BASE_ROT - 70],
          scale: [HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE * 0.92, HAND_SCALE * 0.85],
          opacity: [1, 1, 1, 0.75, 0],
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
          x: [0, 3, -2, 22, 50],
          y: [0, 2, -1, 120, 320],
          rotate: [RIGHT_BASE_ROT, RIGHT_BASE_ROT + 3, RIGHT_BASE_ROT - 2, RIGHT_BASE_ROT + 35, RIGHT_BASE_ROT + 70],
          scale: [HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE * 0.92, HAND_SCALE * 0.85],
          opacity: [1, 1, 1, 0.75, 0],
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
