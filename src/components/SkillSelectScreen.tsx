/**
 * 战前遗物选择界面
 */
import React, { useContext } from 'react';
import { motion } from 'motion/react';
import { GameContext } from '../contexts/GameContext';

/** 稀有度颜色映射 */
const RARITY_COLORS: Record<string, string> = {
  common: 'var(--dungeon-text-dim)',
  uncommon: 'var(--pixel-cyan)',
  rare: 'var(--pixel-purple)',
  legendary: 'var(--pixel-gold)',
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '精良',
  rare: '稀有',
  legendary: '传说',
};

export const SkillSelectScreen: React.FC = () => {
  const { startingRelicChoices, handleSelectStartingRelic, handleSkipStartingRelic } = useContext(GameContext);

  if (!startingRelicChoices || startingRelicChoices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full relative overflow-hidden"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,10,30,0.9)] via-[rgba(10,8,18,0.95)] to-[rgba(5,5,10,1)]" />
      <div className="absolute inset-0 dungeon-floor-cracks opacity-20" />
      
      {/* 标题区 */}
      <div className="relative z-10 text-center pt-6 pb-3">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-[11px] tracking-[0.2em] text-[var(--pixel-purple)] font-bold mb-1">◆ 战前准备 ◆</div>
          <h2 className="text-lg font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow mb-1">选择遗物</h2>
          <p className="text-[11px] text-[var(--dungeon-text-dim)]">选择一件遗物伴你踏上征途</p>
        </motion.div>
      </div>

      {/* 分支路径视觉 */}
      <div className="relative z-10 flex justify-center py-2">
        <svg width="280" height="60" viewBox="0 0 280 60">
          <circle cx="140" cy="8" r="5" fill="var(--pixel-cyan)" opacity="0.8" />
          <circle cx="140" cy="8" r="3" fill="var(--dungeon-text-bright)" />
          {startingRelicChoices.map((_, i) => {
            const endX = 50 + i * 90;
            return (
              <motion.path
                key={i}
                d={`M 140 13 Q ${140 + (endX - 140) * 0.3} 30 ${endX} 52`}
                stroke="var(--pixel-purple)"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
              />
            );
          })}
          {startingRelicChoices.map((_, i) => {
            const cx = 50 + i * 90;
            return (
              <motion.g key={`node-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.15 }}>
                <circle cx={cx} cy="52" r="6" fill="var(--dungeon-panel-bg)" stroke="var(--pixel-purple)" strokeWidth="2" />
                <circle cx={cx} cy="52" r="3" fill="var(--pixel-purple)" opacity="0.6" />
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* 3个遗物卡片 */}
      <div className="relative z-10 flex-1 px-3 overflow-y-auto pb-3">
        <div className="grid grid-cols-3 gap-2">
          {startingRelicChoices.map((relic, i) => (
            <motion.button
              key={relic.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectStartingRelic(relic)}
              className="flex flex-col items-center p-2.5 bg-[var(--dungeon-panel-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-purple)] transition-colors relative group"
              style={{ borderRadius: '4px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--pixel-purple)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" style={{ borderRadius: '4px' }} />
              <div className="text-2xl mb-1.5">{({
                blade: '⚔️', flag: '🚩', weight: '🏋️', pendulum: '📍',
                grail: '🏆', gauge: '📊', prism: '💎', resonator: '✨',
                diamond: '💎', hourglass: '⌛', fangs: '🧛', contract: '📜',
                recycle: '♻️', eye: '👁️', infinity: '♾️', bag: '👜',
              } as Record<string, string>)[relic.icon] || '✨'}</div>
              <div className="text-[12px] font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow mb-1 text-center leading-tight">
                {relic.name}
              </div>
              <div className="text-[10px] text-[var(--dungeon-text-dim)] leading-tight text-center mb-2 min-h-[3em]">
                {relic.description}
              </div>
              <div className="w-full h-[1px] bg-[var(--dungeon-panel-border)] mb-1" />
              <div className="text-[9px] text-[var(--pixel-red)] font-bold mb-1">
                代价: -{relic.rarity === 'common' ? 5 : relic.rarity === 'uncommon' ? 10 : 15} HP
              </div>
              <div className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: RARITY_COLORS[relic.rarity] || 'white' }}>
                {RARITY_LABELS[relic.rarity] || relic.rarity}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 跳过按钮 */}
      <div className="relative z-10 px-4 pb-4 pt-2">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkipStartingRelic}
          className="w-full py-2.5 pixel-btn pixel-btn-ghost text-[12px] font-bold opacity-70 hover:opacity-100 transition-opacity"
        >
          跳过，直接战斗
        </motion.button>
      </div>
    </motion.div>
  );
};
