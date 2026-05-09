/**
 * EnemyRangeBadge.tsx — 敌人 HUD 上的范围/距离标签（像素风差异化）
 *
 * 2026-05-10 刘叔指定方案 Q1=C 像素风版本：
 *  - 类别 tag（近/远）：纯填色像素徽标 —— 实心背景 + 1px 顶/底硬高光阴影 + 黑底文字
 *  - 距离 tag（距 N）：透明底 + 1px dashed 像素描边 + 弱化色（只对近战显示）
 *  - 两种样式视觉层级清晰区分，不再"撞脸"
 */
import React from 'react';
import type { Enemy } from '../types/entities';

interface EnemyRangeBadgeProps {
  enemy: Enemy;
}

export const EnemyRangeBadge: React.FC<EnemyRangeBadgeProps> = ({ enemy }) => {
  const isMelee = enemy.combatType === 'warrior' || enemy.combatType === 'guardian';
  return (
    <>
      <span
        className="ml-1 text-[9px] font-bold px-1 py-0 inline-block align-middle"
        style={{
          borderRadius: 0,
          background: isMelee ? 'var(--pixel-orange)' : 'var(--pixel-cyan)',
          color: '#0a0e14',
          boxShadow:
            'inset 0 1px 0 ' +
            (isMelee ? 'var(--pixel-orange-light)' : 'var(--pixel-cyan-light)') +
            ', inset 0 -1px 0 rgba(0,0,0,0.45), 0 1px 0 rgba(0,0,0,0.85)',
          letterSpacing: '0.5px',
          lineHeight: '11px',
          fontFamily: '"fusion-pixel", monospace',
          imageRendering: 'pixelated',
        }}
      >
        {isMelee ? '近' : '远'}
      </span>
      {isMelee && (enemy.distance || 0) > 0 && (
        <span
          className="ml-1 text-[9px] font-mono px-1 py-0 inline-block align-middle"
          style={{
            borderRadius: 0,
            border: '1px dashed var(--pixel-orange-dark)',
            color: 'var(--pixel-orange-light)',
            background: 'transparent',
            lineHeight: '11px',
            imageRendering: 'pixelated',
          }}
        >
          距 {enemy.distance}
        </span>
      )}
    </>
  );
};