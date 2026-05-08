/**
 * LevelUpModal.tsx — 升级三选一奖励弹窗
 *
 * 规则（刘叔 2026-05-08 拍板）：
 *  - 监听 GameState.pendingLevelUps 队列，非空时弹出
 *  - 三选一：生存 / 攻击 / 资源 各一张（来自 xpSystem.LEVEL_UP_REWARDS）
 *  - 选中后应用到 GameState 并从队列消费一个
 *
 * [PIXEL-REDO 2026-05-08]
 *  - 复刻游戏内 HUD 像素风：深色底 pixel-panel 外框 + 三色硬边条目
 *  - 按钮采用 inset 2px highlight + inset -2px shadow + 底 3-4px 硬阴影
 *  - 类别配色使用 var(--pixel-red / gold / abyss-light)，字体 pixel-text-shadow
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from '../contexts/GameContext';
import { getLevelUpChoices, type LevelRewardDef, type LevelRewardCategory } from '../logic/xpSystem';
import { PixelHeart, PixelSword, PixelCoin, PixelStar } from './PixelIcons';
import { playSound } from '../utils/sound';

// [PIXEL-REDO 2026-05-08] 与 HUD 配色一致：生存=血红、攻击=金、资源=深渊紫
const CATEGORY_META: Record<
  LevelRewardCategory,
  { label: string; color: string; colorDark: string; colorLight: string }
> = {
  survival: {
    label: '生存',
    color: 'var(--pixel-red)',
    colorDark: 'var(--pixel-red-dark)',
    colorLight: 'var(--pixel-red-light)',
  },
  offense: {
    label: '攻击',
    color: 'var(--pixel-gold)',
    colorDark: 'var(--pixel-gold-dark)',
    colorLight: 'var(--pixel-gold-light)',
  },
  resource: {
    label: '资源',
    color: 'var(--pixel-abyss-light)',
    colorDark: 'var(--pixel-abyss)',
    colorLight: '#c898ff',
  },
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

  const choices = useMemo(() => getLevelUpChoices(), [currentLevel]);

  React.useEffect(() => {
    if (currentLevel !== undefined) {
      playSound('levelup');
    }
  }, [currentLevel]);

  if (!currentLevel) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={'lvlup-' + currentLevel}
        className="fixed inset-0 z-[400] flex items-center justify-center px-4"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(212,160,48,0.08) 0%, rgba(10,9,8,0.94) 65%)',
          fontFamily: '"fusion-pixel", monospace',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* [PIXEL-REDO] 外层像素面板：深色底 + 3px 硬边框 + 4px 底阴影 + 金色外描边 */}
        <motion.div
          initial={{ scale: 0.85, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 6 }}
          transition={{ duration: 0.25, ease: 'backOut' }}
          className="relative w-full max-w-sm"
          style={{
            background: 'var(--dungeon-bg)',
            border: '3px solid var(--dungeon-panel-border)',
            borderRadius: 0,
            boxShadow:
              'inset 0 2px 0 var(--dungeon-panel-highlight), ' +
              'inset 0 -2px 0 rgba(0,0,0,0.6), ' +
              '0 4px 0 rgba(0,0,0,0.8), ' +
              '0 0 0 2px rgba(212,160,48,0.35)',
            imageRendering: 'pixelated',
          }}
        >
          {/* 顶部标题条 */}
          <div
            className="flex items-center justify-center gap-2 px-3 py-2"
            style={{
              background:
                'linear-gradient(180deg, rgba(212,160,48,0.22) 0%, rgba(139,106,16,0.12) 100%)',
              borderBottom: '2px solid var(--pixel-gold-dark)',
              boxShadow: 'inset 0 1px 0 rgba(240,200,80,0.35)',
            }}
          >
            <PixelStar size={1.6} />
            <span
              className="font-black pixel-text-shadow"
              style={{
                fontSize: 15,
                color: 'var(--pixel-gold-light)',
                letterSpacing: '0.12em',
                textShadow: '0 1px 0 rgba(0,0,0,0.95), 0 0 4px rgba(212,160,48,0.5)',
              }}
            >
              LEVEL UP · Lv{currentLevel}
            </span>
            <PixelStar size={1.6} />
          </div>

          {/* 提示 */}
          <div
            className="text-center px-3 py-1.5"
            style={{
              fontSize: 10,
              color: 'var(--dungeon-text)',
              letterSpacing: '0.14em',
              borderBottom: '1px solid var(--dungeon-panel-border)',
              background: 'rgba(8,11,14,0.4)',
            }}
          >
            选择一项永久成长
          </div>

          {/* 三选一 */}
          <div className="flex flex-col gap-2 p-3">
            {choices.map((reward, i) => {
              const meta = CATEGORY_META[reward.category];
              return (
                <motion.button
                  key={reward.id}
                  initial={{ x: -24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.25, ease: 'easeOut' }}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.98, y: 1 }}
                  onClick={() => handlePick(reward)}
                  className="relative w-full p-2.5 text-left cursor-pointer"
                  style={{
                    background: 'rgba(8,11,14,0.85)',
                    border: '3px solid ' + meta.color,
                    borderRadius: 0,
                    boxShadow:
                      'inset 0 2px 0 ' + meta.color + ', ' +
                      'inset 0 -2px 0 ' + meta.colorDark + ', ' +
                      'inset 2px 0 0 rgba(0,0,0,0.5), ' +
                      'inset -2px 0 0 rgba(0,0,0,0.5), ' +
                      '0 3px 0 rgba(0,0,0,0.7)',
                    imageRendering: 'pixelated',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: 'rgba(0,0,0,0.55)',
                        border: '2px solid ' + meta.colorDark,
                        boxShadow: 'inset 0 0 0 1px ' + meta.color + ', inset 0 2px 0 rgba(255,255,255,0.08)',
                        borderRadius: 0,
                      }}
                    >
                      {renderIcon(reward.category, 2)}
                    </div>

                    {/* [PIXEL-REDO v2 2026-05-08] chip 和标题分两行，彻底消除截图中观察到的行内重叠 */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center">
                        <span
                          className="font-mono font-black pixel-text-shadow inline-block"
                          style={{
                            fontSize: 9,
                            color: '#0a0908',
                            background: meta.color,
                            border: '1px solid ' + meta.colorDark,
                            padding: '2px 5px',
                            letterSpacing: '0.1em',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                            borderRadius: 0,
                            lineHeight: 1,
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div
                        className="font-black pixel-text-shadow"
                        style={{
                          fontSize: 14,
                          color: meta.colorLight,
                          textShadow: '0 1px 0 rgba(0,0,0,0.95)',
                          lineHeight: 1.2,
                        }}
                      >
                        {reward.title}
                      </div>
                      <div
                        className="pixel-text-shadow"
                        style={{
                          fontSize: 10,
                          color: 'var(--dungeon-text)',
                          lineHeight: 1.4,
                          textShadow: '0 1px 0 rgba(0,0,0,0.9)',
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
              className="text-center font-mono pixel-text-shadow"
              style={{
                fontSize: 9,
                color: 'var(--dungeon-text-dim)',
                letterSpacing: '0.12em',
                borderTop: '1px solid var(--dungeon-panel-border)',
                padding: '6px 0',
                background: 'rgba(8,11,14,0.5)',
              }}
            >
              还有 {queue.length - 1} 次升级待领取
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};