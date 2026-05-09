/**
 * DeathTransition.tsx — 玩家致命一击后的死亡过渡演出 (2026-05-09 v3)
 *
 * v3 关键改动（用户反馈）：
 *   不再用临时 PixelFist 摆拍。直接用游戏内 EnemyStageView 一直显示的同一对
 *   ClassLeftHand / ClassRightHand SVG 在屏幕底部双角渲染（与战斗中位置接近），
 *   播放：紧张抖动 → 失重下坠出屏 → 黑幕 fade。
 *   视觉等同于"战斗中那双手在玩家被击杀的瞬间脱力"。
 *
 * 时序（总时长 ~1.4s）：
 *   1. (0.0s - 0.5s) 双手抖动 → 失重坠落出屏
 *   2. (0.5s - 1.0s) 黑幕在 0.5s 内 fade 满
 *   3. (1.0s - 1.4s) 黑幕保持，外层切换到 GameOverScreen
 */
import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { ClassLeftHand, ClassRightHand } from './ClassHands';

interface DeathTransitionProps {
  visible: boolean;
  onComplete?: () => void;
}

const HANDS_DURATION_MS = 500;
const FADE_BLACK_MS = 500;
const HOLD_MS = 400;
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

  const tShake = [0, 0.06, 0.12, 0.18, 0.24, 0.30, 0.36, 0.42, 0.55, 0.78, 1] as const;

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
          x: [0, -2, 2, -3, 2, -2, 1, -1, -6, -22, -50],
          y: [0, 1, -1, 2, -1, 1, 0, 2, 18, 120, 320],
          rotate: [
            LEFT_BASE_ROT, LEFT_BASE_ROT - 2, LEFT_BASE_ROT + 2, LEFT_BASE_ROT - 3,
            LEFT_BASE_ROT + 1, LEFT_BASE_ROT - 2, LEFT_BASE_ROT, LEFT_BASE_ROT - 1,
            LEFT_BASE_ROT - 8, LEFT_BASE_ROT - 35, LEFT_BASE_ROT - 70,
          ],
          scale: [
            HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE,
            HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE * 0.98,
            HAND_SCALE * 0.92, HAND_SCALE * 0.85,
          ],
          opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.75, 0],
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
          x: [0, 2, -2, 3, -2, 2, -1, 1, 6, 22, 50],
          y: [0, -1, 2, -1, 2, 0, 1, 2, 18, 120, 320],
          rotate: [
            RIGHT_BASE_ROT, RIGHT_BASE_ROT + 2, RIGHT_BASE_ROT - 2, RIGHT_BASE_ROT + 3,
            RIGHT_BASE_ROT - 1, RIGHT_BASE_ROT + 2, RIGHT_BASE_ROT, RIGHT_BASE_ROT + 1,
            RIGHT_BASE_ROT + 8, RIGHT_BASE_ROT + 35, RIGHT_BASE_ROT + 70,
          ],
          scale: [
            HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE,
            HAND_SCALE, HAND_SCALE, HAND_SCALE, HAND_SCALE * 0.98,
            HAND_SCALE * 0.92, HAND_SCALE * 0.85,
          ],
          opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.75, 0],
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
