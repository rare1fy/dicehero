import React from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { getDiceDef } from '../data/dice';
import { PixelSword, PixelHeart, PixelShield, PixelSkull, PixelCoin, PixelDice, PixelRefresh, PixelTrophy, PixelClose } from './PixelIcons';

interface StatsModalProps {
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
  const { game } = useGameContext();
  const s = game.stats;

  const avgDamage = s.battlesWon > 0 ? Math.round(s.totalDamageDealt / s.battlesWon) : 0;

  const topHand = Object.entries(s.handTypeCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))[0] as [string, number] | undefined;

  const handRank: Record<string, number> = {
    '普通攻击': 0, '对子': 1, '连对': 2, '三条': 3, '顺子': 4,
    '同元素': 5, '葫芦': 6, '四条': 7, '元素顺': 8, '元素葫芦': 9,
    '五条': 10, '六条': 11, '皇家元素顺': 12,
  };
  const bestHand = Object.keys(s.handTypeCounts)
    .sort((a, b) => (handRank[b] ?? 0) - (handRank[a] ?? 0))[0] || '-';

  const topDice = Object.entries(s.diceUsageCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([defId, count]) => {
      const def = getDiceDef(defId);
      return { name: def?.name || defId, count };
    });

  const currentDepth = game.map.find(n => n.id === game.currentNodeId)?.depth ?? 0;

  const StatRow = ({ label, value, color = 'var(--dungeon-text-bright)', icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-1 border-b border-[rgba(255,255,255,0.05)]">
      <span className="text-[9px] text-[var(--dungeon-text-dim)] flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-[10px] font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="text-[8px] font-bold text-[var(--dungeon-text-dim)] uppercase tracking-widest mt-3 mb-1 border-b border-[rgba(255,255,255,0.1)] pb-0.5">
      {title}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.85)]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative w-[85vw] max-w-[360px] max-h-[80vh] overflow-y-auto bg-[var(--dungeon-panel)] border-3 border-[var(--dungeon-panel-border)] p-4"
        style={{ borderRadius: '6px' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text-bright)] transition-colors"
        >
          <PixelClose size={2} />
        </button>

        <div className="text-center mb-3">
          <div className="text-base font-black text-[var(--pixel-gold)] pixel-text-shadow tracking-wide">
            ◆ 战斗统计 ◆
          </div>
          <div className="text-[8px] text-[var(--dungeon-text-dim)] mt-0.5">
            第 {currentDepth + 1} 层
          </div>
        </div>

        <div className="text-center mb-2 py-2 bg-[rgba(224,60,60,0.1)] border-2 border-[rgba(224,60,60,0.3)]" style={{ borderRadius: '4px' }}>
          <div className="text-[8px] text-[var(--pixel-red)] uppercase tracking-wider font-bold">Total Damage</div>
          <div className="text-2xl font-black text-[var(--pixel-red)] font-mono pixel-text-shadow">
            {s.totalDamageDealt.toLocaleString()}
          </div>
        </div>

        <SectionTitle title="⚔ 伤害总览" />
        <StatRow label="单次最高伤害" value={s.maxSingleHit} color="var(--pixel-red)" icon={<PixelSword size={1.5} />} />
        <StatRow label="场均伤害" value={avgDamage} color="var(--pixel-orange)" icon={<PixelSword size={1.5} />} />

        <SectionTitle title="🎲 出牌统计" />
        <StatRow label="总出牌次数" value={s.totalPlays} color="var(--pixel-blue)" icon={<PixelDice size={1.5} />} />
        <StatRow label="最常用牌型" value={topHand ? topHand[0] + ' (' + topHand[1] + '次)' : '-'} color="var(--pixel-cyan)" />
        <StatRow label="最强牌型" value={bestHand} color="var(--pixel-gold)" icon={<PixelTrophy size={1.5} />} />
        <StatRow label="总重掷次数" value={s.totalRerolls} color="var(--pixel-green)" icon={<PixelRefresh size={1.5} />} />

        {topDice.length > 0 && (
          <>
            <SectionTitle title="🎯 骰子使用 TOP3" />
            {topDice.map((d, i) => (
              <StatRow
                label={(i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') + ' ' + d.name}
                value={d.count + '次'}
                color={i === 0 ? 'var(--pixel-gold)' : i === 1 ? 'var(--pixel-cyan)' : 'var(--dungeon-text-bright)'}
              />
            ))}
          </>
        )}

        <SectionTitle title="💀 战斗统计" />
        <StatRow label="已完成战斗" value={s.battlesWon} color="var(--pixel-orange)" icon={<PixelSkull size={1.5} />} />
        <StatRow label="击杀敌人" value={s.enemiesKilled} color="var(--pixel-red)" />
        <StatRow label="精英战胜利" value={s.elitesWon} color="var(--pixel-purple)" />
        <StatRow label="Boss战胜利" value={s.bossesWon} color="var(--pixel-gold)" />

        <SectionTitle title="❤ 生存统计" />
        <StatRow label="累计受到伤害" value={s.totalDamageTaken} color="var(--pixel-red)" icon={<PixelHeart size={1.5} />} />
        <StatRow label="累计回复量" value={s.totalHealing} color="var(--pixel-green)" icon={<PixelHeart size={1.5} />} />
        <StatRow label="累计获得护甲" value={s.totalArmorGained} color="var(--pixel-blue)" icon={<PixelShield size={1.5} />} />

        <SectionTitle title="💰 经济统计" />
        <StatRow label="累计获得金币" value={s.goldEarned} color="var(--pixel-gold)" icon={<PixelCoin size={1.5} />} />
        <StatRow label="累计花费金币" value={s.goldSpent} color="var(--pixel-gold)" icon={<PixelCoin size={1.5} />} />

        <button
          onClick={onClose}
          className="w-full py-2 mt-4 pixel-btn pixel-btn-ghost text-xs font-bold"
        >
          关闭
        </button>
      </motion.div>
    </motion.div>
  );
};