/**
 * EnemySelectionFx.tsx — 敌人选中态：仅脚下金色流动光环
 *
 * [2026-05-10 v2 用户反馈调整]
 *  - 删除：中层飘升方块粒子（敌人身上循环火花遮脸，用户投诉）
 *  - 删除：此处的倒三角箭头（迁移到 HUD 层吸附职业标签上方）
 *  - 保留并重做：脚下圆环 → 金色、流动旋转、更密（12 颗方块沿椭圆）
 *
 * 依赖：index.css 中的 .enemy-target-ring（v2 金色流动版）
 */
import React from 'react';

export const EnemySelectionFx: React.FC = () => {
  return <div className="enemy-target-ring" />;
};