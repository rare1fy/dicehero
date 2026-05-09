/**
 * BossAura.tsx — BOSS sprite 独特光效与粒子（中BOSS / 终BOSS）
 *
 * [2026-05-09] 从 EnemyStageView.tsx 抽出（避免文件超 600 行）。
 *
 *   按章节配色，按 rank 区分强度：
 *   - mid   : 单层呼吸光晕 + 5 粒子
 *   - final : 双层光晕（外圈 + 内核） + 旋转光环 + 10 粒子
 *
 *   颜色映射（按 game.chapter）：
 *     1 森林  -> 紫
 *     2 冰原  -> 青
 *     3 熔岩  -> 赤橙
 *     4 暗影  -> 紫红
 *     5 永恒  -> 金
 */
import React from 'react';

interface BossAuraProps {
  rank: 'mid' | 'final';
  chapter: number;
}

const palette = (chapter: number): { aura: string; halo: string } => {
  if (chapter <= 1) return { aura: 'rgba(168, 96, 220, 0.55)', halo: 'rgba(192, 128, 255, 0.85)' };
  if (chapter <= 2) return { aura: 'rgba(80, 200, 240, 0.55)', halo: 'rgba(120, 230, 255, 0.85)' };
  if (chapter <= 3) return { aura: 'rgba(255, 110, 60, 0.65)', halo: 'rgba(255, 180, 80, 0.95)' };
  if (chapter <= 4) return { aura: 'rgba(220, 80, 200, 0.55)', halo: 'rgba(255, 140, 240, 0.85)' };
  return { aura: 'rgba(255, 220, 130, 0.65)', halo: 'rgba(255, 245, 180, 0.95)' };
};

export const BossAura: React.FC<BossAuraProps> = ({ rank, chapter }) => {
  const { aura, halo } = palette(chapter);
  const particleCount = rank === 'final' ? 10 : 5;
  const auraInset = rank === 'final' ? '-22px' : '-14px';
  const particleInset = rank === 'final' ? '-26px' : '-18px';

  return (
    <>
      {/* 外层呼吸光晕（mid + final） */}
      <div
        className="absolute pointer-events-none boss-aura-breath"
        style={{
          inset: auraInset,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${aura} 0%, ${aura.replace(/[\d.]+\)$/, '0.18)')} 50%, transparent 75%)`,
          zIndex: -1,
        }}
      />
      {rank === 'final' && (
        <>
          <div
            className="absolute pointer-events-none boss-aura-core"
            style={{
              inset: '-10px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${halo} 0%, transparent 65%)`,
              zIndex: -1,
            }}
          />
          <div
            className="absolute pointer-events-none boss-aura-ring"
            style={{
              inset: '-18px',
              borderRadius: '50%',
              border: `2px solid ${halo}`,
              boxShadow: `0 0 14px ${halo}, inset 0 0 10px ${aura}`,
              zIndex: -1,
            }}
          />
        </>
      )}
      <div
        className="absolute pointer-events-none"
        style={{ inset: particleInset, zIndex: -1 }}
      >
        {Array.from({ length: particleCount }).map((_, pi) => (
          <div
            key={pi}
            className="boss-aura-particle"
            style={{
              left: `${10 + (pi * 80) / particleCount + (Math.random() * 6 - 3)}%`,
              background: halo,
              boxShadow: `0 0 6px ${halo}`,
              animationDelay: `${(pi * 0.3 + Math.random() * 0.4).toFixed(2)}s`,
              animationDuration: `${(rank === 'final' ? 2.2 : 2.8) + Math.random() * 0.6}s`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default BossAura;
