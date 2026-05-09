/**
 * EnemySelectionFx.tsx — 敌人选中态像素风三层特效
 *
 * 设计要点（2026-05-10 刘叔指定方案 Q2=B 像素风版本）：
 *  - 顶层：像素方块倒三角箭头（5×3 阵列，box-shadow 单 div 实现）
 *  - 中层：6 颗硬边方块粒子飘升（错相延迟）
 *  - 底层：8 颗 2×2 方块沿椭圆排布的脚下光环（步进闪烁）
 *  - 全部使用 image-rendering: pixelated + steps() 时间函数，禁用 blur / radial-gradient
 *
 * 依赖：index.css 中的 .enemy-target-arrow / .enemy-target-particles / .enemy-target-spark / .enemy-target-ring
 */
import React from 'react';

const SPARK_POSITIONS: ReadonlyArray<{ left: string; delay: string }> = [
  { left: '18%', delay: '0s' },
  { left: '38%', delay: '0.25s' },
  { left: '58%', delay: '0.50s' },
  { left: '78%', delay: '0.75s' },
  { left: '28%', delay: '1.00s' },
  { left: '68%', delay: '1.20s' },
];

export const EnemySelectionFx: React.FC = () => {
  return (
    <>
      <div className="enemy-target-arrow" />
      <div className="enemy-target-particles">
        {SPARK_POSITIONS.map((s, i) => (
          <div
            key={i}
            className="enemy-target-spark"
            style={{ left: s.left, animationDelay: s.delay }}
          />
        ))}
      </div>
      <div className="enemy-target-ring" />
    </>
  );
};