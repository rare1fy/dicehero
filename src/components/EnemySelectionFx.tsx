/**
 * EnemySelectionFx.tsx — 敌人选中态：脚下金色流光椭圆环
 *
 * [2026-05-10 v5 用户反馈：v2~v4 的 CSS transform 方案都会翻转]
 *  - v5 用 SVG <ellipse> + stroke-dasharray + dashoffset 动画
 *  - 椭圆形态由 SVG 几何固定，全程不 rotate → 绝不翻转
 *  - 流光：金色虚线沿椭圆周长偏移，"光在地面跑"
 *  - 双层叠加：粗金线 + 细高光线（反向流动），密度更高
 *  - shape-rendering: crispEdges 保持像素硬切风格
 *
 * 依赖：index.css 中的 .enemy-target-ring / __ellipse / __ellipse--inner
 */
import React from 'react';

/** 椭圆几何参数：与 .enemy-target-ring 容器尺寸 64×18 对齐 */
const VIEW_W = 64;
const VIEW_H = 18;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const RX = 30;
const RY = 7;

export const EnemySelectionFx: React.FC = () => {
  return (
    <svg
      className="enemy-target-ring"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* 主金色虚线环：粗、慢、正向流动 */}
      <ellipse
        className="enemy-target-ring__ellipse"
        cx={CX}
        cy={CY}
        rx={RX}
        ry={RY}
      />
      {/* 内层亮金高光：细、快、反向流动，制造"光点追逐"密度感 */}
      <ellipse
        className="enemy-target-ring__ellipse enemy-target-ring__ellipse--inner"
        cx={CX}
        cy={CY}
        rx={RX - 1}
        ry={RY - 1}
      />
    </svg>
  );
};