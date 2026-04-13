/**
 * ClassIcons.tsx — 职业专属像素icon
 * 用于骰子标签、UI标识等
 */
import React from 'react';

/** 战士icon — 双刃战斧 (7×7像素) */
export const WarriorClassIcon: React.FC<{ size?: number }> = ({ size = 2 }) => (
  <svg width={7*size} height={7*size} viewBox="0 0 7 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
    {/* 左刃 */}
    <rect x="0" y="1" width="1" height="1" fill="#8898b0" />
    <rect x="0" y="2" width="2" height="1" fill="#98a8c0" />
    <rect x="0" y="3" width="2" height="1" fill="#a0b0c8" />
    <rect x="0" y="4" width="2" height="1" fill="#98a8c0" />
    <rect x="0" y="5" width="1" height="1" fill="#8898b0" />
    {/* 右刃 */}
    <rect x="6" y="1" width="1" height="1" fill="#8898b0" />
    <rect x="5" y="2" width="2" height="1" fill="#98a8c0" />
    <rect x="5" y="3" width="2" height="1" fill="#a0b0c8" />
    <rect x="5" y="4" width="2" height="1" fill="#98a8c0" />
    <rect x="6" y="5" width="1" height="1" fill="#8898b0" />
    {/* 柄 */}
    <rect x="3" y="0" width="1" height="7" fill="#5a4838" />
    {/* 铁箍 */}
    <rect x="2" y="2" width="3" height="1" fill="#4a4a56" />
    <rect x="2" y="4" width="3" height="1" fill="#4a4a56" />
    {/* 血痕 */}
    <rect x="1" y="3" width="1" height="1" fill="#c04040" opacity="0.6" />
  </svg>
);

/** 法师icon — 星芒/魔法星 (7×7像素) */
export const MageClassIcon: React.FC<{ size?: number }> = ({ size = 2 }) => (
  <svg width={7*size} height={7*size} viewBox="0 0 7 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
    {/* 中心 */}
    <rect x="3" y="3" width="1" height="1" fill="#d0c0ff" />
    {/* 四方光芒 */}
    <rect x="3" y="0" width="1" height="1" fill="#7050c0" />
    <rect x="3" y="1" width="1" height="1" fill="#9070e0" />
    <rect x="3" y="2" width="1" height="1" fill="#b090ff" />
    <rect x="3" y="4" width="1" height="1" fill="#b090ff" />
    <rect x="3" y="5" width="1" height="1" fill="#9070e0" />
    <rect x="3" y="6" width="1" height="1" fill="#7050c0" />
    <rect x="0" y="3" width="1" height="1" fill="#7050c0" />
    <rect x="1" y="3" width="1" height="1" fill="#9070e0" />
    <rect x="2" y="3" width="1" height="1" fill="#b090ff" />
    <rect x="4" y="3" width="1" height="1" fill="#b090ff" />
    <rect x="5" y="3" width="1" height="1" fill="#9070e0" />
    <rect x="6" y="3" width="1" height="1" fill="#7050c0" />
    {/* 对角光点 */}
    <rect x="1" y="1" width="1" height="1" fill="#6040a0" opacity="0.7" />
    <rect x="5" y="1" width="1" height="1" fill="#6040a0" opacity="0.7" />
    <rect x="1" y="5" width="1" height="1" fill="#6040a0" opacity="0.7" />
    <rect x="5" y="5" width="1" height="1" fill="#6040a0" opacity="0.7" />
    {/* 次对角 */}
    <rect x="2" y="2" width="1" height="1" fill="#8060c0" opacity="0.5" />
    <rect x="4" y="2" width="1" height="1" fill="#8060c0" opacity="0.5" />
    <rect x="2" y="4" width="1" height="1" fill="#8060c0" opacity="0.5" />
    <rect x="4" y="4" width="1" height="1" fill="#8060c0" opacity="0.5" />
  </svg>
);

/** 盗贼icon — 苦无/手里剑 (7×7像素) */
export const RogueClassIcon: React.FC<{ size?: number }> = ({ size = 2 }) => (
  <svg width={7*size} height={7*size} viewBox="0 0 7 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
    {/* 苦无刃身 — 左上到右下对角线 */}
    <rect x="0" y="0" width="1" height="1" fill="#90a8b8" />
    <rect x="1" y="1" width="1" height="1" fill="#a0b8c8" />
    <rect x="2" y="2" width="1" height="1" fill="#b0c8d8" />
    <rect x="3" y="3" width="1" height="1" fill="#c0d0e0" />
    {/* 刃身宽度 — 两侧各1px */}
    <rect x="1" y="0" width="1" height="1" fill="#708090" />
    <rect x="0" y="1" width="1" height="1" fill="#708090" />
    <rect x="2" y="1" width="1" height="1" fill="#8098a8" />
    <rect x="1" y="2" width="1" height="1" fill="#8098a8" />
    <rect x="3" y="2" width="1" height="1" fill="#90a8b8" />
    <rect x="2" y="3" width="1" height="1" fill="#90a8b8" />
    {/* 柄+缠带 */}
    <rect x="4" y="4" width="1" height="1" fill="#4a3828" />
    <rect x="5" y="5" width="1" height="1" fill="#3a2818" />
    <rect x="6" y="6" width="1" height="1" fill="#2a1808" />
    {/* 缠带绿线 */}
    <rect x="4" y="5" width="1" height="1" fill="#40a060" opacity="0.6" />
    <rect x="5" y="4" width="1" height="1" fill="#40a060" opacity="0.6" />
    {/* 毒液光点 */}
    <rect x="1" y="0" width="1" height="1" fill="#40c060" opacity="0.4" />
    <rect x="0" y="0" width="1" height="1" fill="#40c060" opacity="0.3" />
  </svg>
);

/** 根据职业ID返回对应icon */
export const ClassIcon: React.FC<{ classId?: string; size?: number }> = ({ classId, size = 2 }) => {
  if (classId === 'warrior') return <WarriorClassIcon size={size} />;
  if (classId === 'mage') return <MageClassIcon size={size} />;
  if (classId === 'rogue') return <RogueClassIcon size={size} />;
  return null;
};
