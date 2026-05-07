/**
 * LevelUpModal.tsx — 升级三选一奖励弹窗
 *
 * 规则（刘叔 2026-05-08 拍板）：
 *  - 监听 GameState.pendingLevelUps 队列，非空时弹出
 *  - 三选一：生存 / 攻击 / 资源 各一张（来自 xpSystem.LEVEL_UP_REWARDS）
 *  - 累加永久成长，不涉及即时效果，不影响出牌节奏
 *  - 选中后应用到 GameState 并从队列消费一个
 *  - 同一次出牌跨多级升级时，多次弹出（FIFO）
 *
 * 美术：严格像素风，复用 fusion-pixel 字体、PixelIcons 图标、章节配色风格
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '../contexts/GameContext';
import { getLevelUpChoices, type LevelRewardDef, type LevelRewardCategory } from '../logic/xpSystem';
import { PixelHeart, PixelSword, PixelCoin, PixelStar } from './PixelIcons';
import { playSound } from '../utils/sound';

const CATEGORY_META: Record<LevelRewardCategory, { label: string; color: string; glow: string }> = {
  survival: { label: '生存', color: '#ff6a78', glow: 'rgba(255,106,120,0.55)' },
  offense:  { label: '攻击', color: '#ffd24a', glow: 'rgba(255,210,74,0.55)' },
  resource: { label: '资源', color: '#a050e0', glow: 'rgba(160,80,224,0.55)' },
};

function renderIcon(cat: LevelRewardCategory, size: number = 2) {
  switch (cat) {
    case 'survival': return <PixelHeart size={size} />;
    case 'offense':  return <PixelSword size={size} />;
    case 'resource': return <PixelCoin size={size} />;
  }
}

export const LevelUpModal: React.FC = () => {
  const { game, setGame } = useGameContext();
  const queue = game.pendingLevelUps || [];
  const currentLevel = queue[0];

  const handlePick = (reward: LevelRewardDef) => {
    playSound('select');
    setGame(prev => {
      const patch = reward.apply(prev);
      const rest = (prev.pendingLevelUps || []).slice(1);
      return { ...prev, ...patch, pendingLevelUps: rest };
    });
  };

  // 每次"新的一级"弹出时才重新抽一组三张；消费一次后弹下一级时再抽。
  // 必须在早 return 之前调用，满足 React Hooks 规则
  const choices = useMemo(() => getLevelUpChoices(), [currentLevel]);

  if (!currentLevel) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={'lvlup-' + currentLevel}
        className="fixed inset-0 z-[400] flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(40,16,80,0.88) 0%, rgba(8,4,20,0.96) 70%)',
          fontFamily: '"fusion-pixel", monospace',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-col items-center gap-4 px-4 w-full max-w-md">
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            className="flex items-center gap-2"
          >
            <PixelStar size={2} style={{ filter: 'drop-shadow(0 0 8px #ffd24a) drop-shadow(0 0 14px #ffd24a)' }} />
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#fff2a0',
                letterSpacing: '0.08em',
                textShadow: '0 0 8px rgba(255,210,74,0.9), 0 2px 0 rgba(0,0,0,0.9)',
              }}
            >
              LEVEL UP · Lv{currentLevel}
            </span>
            <PixelStar size={2} style={{ filter: 'drop-shadow(0 0 8px #ffd24a) drop-shadow(0 0 14px #ffd24a)' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] tracking-wider"
            style={{ color: '#d8c8ff', textShadow: '0 1px 0 rgba(0,0,0,0.9)' }}
          >
            选择一项永久成长
          </motion.div>

          <div className="flex flex-col gap-3 w-full mt-1">
            {choices.map((reward, i) => {
              const meta = CATEGORY_META[reward.category];
              return (
                <motion.button
                  key={reward.id}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.35, ease: 'easeOut' }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePick(reward)}
                  className="relative w-full p-3 text-left cursor-pointer"
                  style={{
                    background: 'linear-gradient(180deg, rgba(28,12,48,0.95) 0%, rgba(12,6,24,0.98) 100%)',
                    border: 'none',
                    boxShadow:
                      '0 0 0 1px ' + meta.color + ', ' +
                      'inset 0 0 0 1px rgba(0,0,0,0.6), ' +
                      '0 0 10px ' + meta.glow,
                    imageRendering: 'pixelated',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: 'rgba(0,0,0,0.5)',
                        boxShadow: 'inset 0 0 0 1px ' + meta.color,
                      }}
                    >
                      {renderIcon(reward.category, 2)}
                    </div>

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-bold px-1 py-[1px]"
                          style={{
                            color: '#000',
                            background: meta.color,
                            letterSpacing: '0.05em',
                          }}
                        >
                          {meta.label}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: meta.color,
                            textShadow: '0 1px 0 rgba(0,0,0,0.9), 0 0 4px ' + meta.glow,
                          }}
                        >
                          {reward.title}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#e8d8ff',
                          lineHeight: 1.35,
                          textShadow: '0 1px 0 rgba(0,0,0,0.8)',
                        }}
                      >
                        {reward.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {queue.length > 1 && (
            <div
              style={{ fontSize: 10, color: '#a090c8', letterSpacing: '0.1em' }}
            >
              还有 {queue.length - 1} 次升级待领取
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
