import React from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelTrophy, PixelHeart, PixelSword, PixelCoin, PixelDice, PixelSkull, PixelShield, PixelCrown } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';
import { getDiceDef } from '../data/dice';

const StatRow: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: string; delay: number }> = ({ icon, label, value, color = 'var(--dungeon-text-bright)', delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center justify-between py-2 px-3 border-b border-[var(--dungeon-panel-border)]"
  >
    <div className="flex items-center gap-2 text-[11px] text-[var(--dungeon-text)]">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-[13px] font-black font-mono pixel-text-shadow" style={{ color }}>{value}</span>
  </motion.div>
);

export const VictoryScreen: React.FC = () => {
  const { game } = useGameContext();
  const stats = game.stats;

  // 计算高光数据
  const totalDamage = stats.totalDamageDealt || 0;
  const highestSingleHit = stats.highestDamage || 0;
  const enemiesKilled = stats.enemiesKilled || 0;
  const bossesKilled = stats.bossesKilled || 0;
  const totalGold = stats.goldEarned || 0;
  const goldSpent = stats.goldSpent || 0;
  const totalHealing = stats.totalHealing || 0;
  const totalArmor = stats.totalArmorGained || 0;
  const turnsPlayed = stats.turnsPlayed || 0;
  const diceRolled = stats.diceRolled || 0;
  const rerolls = stats.rerollCount || 0;
  const relicCount = game.relics.length;
  const diceCount = game.ownedDice.length;
  const chapter = game.chapter || 5;
  const finalHp = game.hp;
  const maxHp = game.maxHp;

  // 评级
  const rating = highestSingleHit >= 200 ? 'SSS' : highestSingleHit >= 150 ? 'SS' : highestSingleHit >= 100 ? 'S' : highestSingleHit >= 60 ? 'A' : 'B';
  const ratingColor = rating === 'SSS' ? '#ff4040' : rating === 'SS' ? '#ff8040' : rating === 'S' ? '#ffc040' : rating === 'A' ? '#40c0ff' : '#a0a0a0';

  // 特殊骰子统计
  const specialDice = game.ownedDice
    .filter(d => d.defId !== 'standard')
    .map(d => ({ name: getDiceDef(d.defId).name, level: d.level }));

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] relative overflow-hidden sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
      <div className="absolute inset-0 pixel-grid-bg opacity-20" />
      {/* 暗角 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 30%, transparent 20%, rgba(3,2,4,0.6) 100%)',
      }} />
      <CSSParticles type="sparkle" count={15} />

      {/* 可滚动内容 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10 px-5 pb-8">
        {/* 顶部标题 */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center pt-10 pb-4"
        >
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex justify-center mb-4"
          >
            <div style={{ filter: 'drop-shadow(0 0 16px rgba(212,160,48,0.5))' }}>
              <PixelTrophy size={7} />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black text-[var(--pixel-gold)] pixel-text-shadow tracking-wider mb-1"
            style={{ textShadow: '0 0 20px rgba(212,160,48,0.5), 3px 3px 0 rgba(0,0,0,0.8)' }}>
            ◆ 通关 ◆
          </h1>
          <p className="text-[10px] text-[var(--dungeon-text-dim)] tracking-[0.2em]">你已征服了所有{chapter}个大关</p>
        </motion.div>

        {/* 评级 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-5"
        >
          <div className="px-6 py-2 border-3 text-center" style={{
            borderColor: ratingColor,
            background: `linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)`,
            boxShadow: `0 0 20px ${ratingColor}40, inset 0 0 10px ${ratingColor}15`,
            borderRadius: '2px',
          }}>
            <div className="text-[8px] font-bold tracking-widest text-[var(--dungeon-text-dim)] mb-1">RATING</div>
            <div className="text-4xl font-black font-mono" style={{ color: ratingColor, textShadow: `0 0 12px ${ratingColor}80` }}>
              {rating}
            </div>
          </div>
        </motion.div>

        {/* 统计数据卡片 */}
        <div className="pixel-panel p-1 mb-4">
          <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-widest text-center py-1.5">
            ◆ 战斗数据 ◆
          </div>
          <StatRow icon={<PixelSword size={2} />} label="总伤害" value={totalDamage.toLocaleString()} color="var(--pixel-red-light)" delay={0.5} />
          <StatRow icon={<PixelCrown size={2} />} label="最高单次伤害" value={highestSingleHit} color="var(--pixel-orange)" delay={0.6} />
          <StatRow icon={<PixelSkull size={2} />} label="击杀敌人" value={enemiesKilled} color="var(--pixel-red)" delay={0.7} />
          <StatRow icon={<PixelSkull size={2} />} label="击杀Boss" value={bossesKilled} color="var(--pixel-purple)" delay={0.8} />
          <StatRow icon={<PixelShield size={2} />} label="总护甲获取" value={totalArmor} color="var(--pixel-blue-light)" delay={0.9} />
          <StatRow icon={<PixelHeart size={2} />} label="总治疗量" value={totalHealing} color="#6ae86a" delay={1.0} />
        </div>

        <div className="pixel-panel p-1 mb-4">
          <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-widest text-center py-1.5">
            ◆ 经济数据 ◆
          </div>
          <StatRow icon={<PixelCoin size={2} />} label="总金币获取" value={totalGold} color="var(--pixel-gold)" delay={1.1} />
          <StatRow icon={<PixelCoin size={2} />} label="金币消费" value={goldSpent} color="var(--pixel-gold-dim)" delay={1.2} />
          <StatRow icon={<PixelCoin size={2} />} label="最终金币" value={game.souls} color="var(--pixel-gold-light)" delay={1.3} />
        </div>

        <div className="pixel-panel p-1 mb-4">
          <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-widest text-center py-1.5">
            ◆ 构筑数据 ◆
          </div>
          <StatRow icon={<PixelDice size={2} />} label="骰子总数" value={diceCount} delay={1.4} />
          <StatRow icon={<PixelDice size={2} />} label="骰子投掷次数" value={diceRolled} delay={1.5} />
          <StatRow icon={<PixelDice size={2} />} label="重Roll次数" value={rerolls} color="var(--pixel-cyan)" delay={1.6} />
          <StatRow icon={<PixelTrophy size={2} />} label="遗物收集" value={relicCount} color="var(--pixel-purple)" delay={1.7} />
          <StatRow icon={<PixelSword size={2} />} label="出牌回合数" value={turnsPlayed} delay={1.8} />
        </div>

        {/* 特殊骰子展示 */}
        {specialDice.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0 }}
            className="pixel-panel p-2 mb-4"
          >
            <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-widest text-center py-1">
              ◆ 最终骰子库 ◆
            </div>
            <div className="flex flex-wrap gap-1 justify-center mt-1">
              {specialDice.map((d, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] border border-[var(--dungeon-panel-border)] text-[var(--dungeon-text)] font-bold"
                  style={{ borderRadius: '2px' }}>
                  {d.name}{d.level > 1 ? ` Lv.${d.level}` : ''}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 遗物列表 */}
        {game.relics.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="pixel-panel p-2 mb-4"
          >
            <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-widest text-center py-1">
              ◆ 收集遗物 ({game.relics.length}) ◆
            </div>
            <div className="flex flex-wrap gap-1 justify-center mt-1">
              {game.relics.map((r, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] border border-[var(--dungeon-panel-border)] text-[var(--dungeon-text)] font-bold"
                  style={{ borderRadius: '2px' }}>
                  {r.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 最终状态 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
          className="text-center mb-6"
        >
          <div className="text-[9px] text-[var(--dungeon-text-dim)] mb-1">通关时剩余生命</div>
          <div className="flex items-center justify-center gap-1">
            <PixelHeart size={2} />
            <span className="text-lg font-black font-mono pixel-text-shadow" style={{ color: finalHp > maxHp * 0.5 ? '#6ae86a' : finalHp > maxHp * 0.25 ? 'var(--pixel-gold)' : 'var(--pixel-red)' }}>
              {finalHp}
            </span>
            <span className="text-[10px] text-[var(--dungeon-text-dim)]">/ {maxHp}</span>
          </div>
        </motion.div>

        {/* 再来一次按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 }}
          className="flex justify-center pb-4"
        >
          <button
            onClick={() => window.location.reload()}
            className="w-full max-w-[220px] py-3 pixel-btn pixel-btn-primary text-sm font-bold"
          >
            ▶ 再续传奇
          </button>
        </motion.div>
      </div>
    </div>
  );
};
