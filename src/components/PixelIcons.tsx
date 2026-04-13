import React from 'react';

/**
 * 像素图标系统 — 用纯CSS box-shadow绘制8-bit风格图标
 * 所有图标统一为 8x8 或 7x7 网格，确保大小一致
 */

interface PixelIconProps {
  size?: number; // 像素块大小，默认2
  className?: string;
  style?: React.CSSProperties;
}

// 通用box-shadow生成器
const generateShadow = (pixels: string[][], ps: number): string => {
  const shadows: string[] = [];
  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      const color = pixels[r][c];
      if (color) shadows.push(`${(c + 1) * ps}px ${(r + 1) * ps}px 0 ${color}`);
    }
  }
  return shadows.join(',');
};

const IconBase: React.FC<{ pixels: string[][]; ps: number; className?: string; style?: React.CSSProperties }> = ({ pixels, ps, className = '', style }) => {
  const w = pixels[0]?.length || 0;
  const h = pixels.length;
  return (
    <div className={`inline-block relative ${className}`} style={{ width: w * ps, height: h * ps, ...style }}>
      <div style={{ position: 'absolute', top: -ps, left: -ps, width: ps, height: ps, boxShadow: generateShadow(pixels, ps), imageRendering: 'pixelated' }} />
    </div>
  );
};

// ===== 地图节点图标 =====

//  剑 — 战斗节点（8x8）
export const PixelSword: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '', '', '', '', '#e8e8f0', '#c8c8d0'],
    ['', '', '', '', '', '#e8e8f0', '#a0a0c0', ''],
    ['', '', '', '', '#c8c8d0', '#e8e8f0', '', ''],
    ['', '', '', '#c8c8d0', '#a0a0c0', '', '', ''],
    ['', '#8b5014', '#c8a83c', '#e8e8f0', '', '', '', ''],
    ['#8b5014', '#c8a83c', '#8b5014', '', '', '', '', ''],
    ['', '#8b5014', '#c8a83c', '', '', '', '', ''],
    ['#8b5014', '', '', '', '', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  骷髅 — 精英节点（7x7）
export const PixelSkull: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', ''],
    ['#c8c8d0', '#e8e8f0', '#e8e8f0', '#e8e8f0', '#e8e8f0', '#e8e8f0', '#c8c8d0'],
    ['#c8c8d0', '#1a1a2e', '#e8e8f0', '#e8e8f0', '#e8e8f0', '#1a1a2e', '#c8c8d0'],
    ['#c8c8d0', '#e8e8f0', '#e8e8f0', '#c8c8d0', '#e8e8f0', '#e8e8f0', '#c8c8d0'],
    ['', '#c8c8d0', '#1a1a2e', '#c8c8d0', '#1a1a2e', '#c8c8d0', ''],
    ['', '#c8c8d0', '#c8c8d0', '#1a1a2e', '#c8c8d0', '#c8c8d0', ''],
    ['', '', '#6a6a7e', '#6a6a7e', '#6a6a7e', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  王冠 — Boss节点（7x6）
export const PixelCrown: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#e8d068', '', '#e8d068', '', '#e8d068', ''],
    ['', '#e8d068', '#c8a83c', '#e8d068', '#c8a83c', '#e8d068', ''],
    ['#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#e8d068', '#e8d068', '#c8a83c'],
    ['#c8a83c', '#e8d068', '#c8403c', '#e8d068', '#c8403c', '#e8d068', '#c8a83c'],
    ['#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#e8d068', '#e8d068', '#c8a83c'],
    ['#8b7414', '#c8a83c', '#c8a83c', '#c8a83c', '#c8a83c', '#c8a83c', '#8b7414'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  商店袋 — 商店节点（7x7）
export const PixelShopBag: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#3cc864', '#3cc864', '#3cc864', '', ''],
    ['', '#3cc864', '', '', '', '#3cc864', ''],
    ['#3cc864', '#68e888', '#68e888', '#68e888', '#68e888', '#68e888', '#3cc864'],
    ['#3cc864', '#68e888', '#e8d068', '#e8d068', '#e8d068', '#68e888', '#3cc864'],
    ['#3cc864', '#68e888', '#e8d068', '#c8a83c', '#e8d068', '#68e888', '#3cc864'],
    ['#3cc864', '#68e888', '#68e888', '#68e888', '#68e888', '#68e888', '#3cc864'],
    ['', '#1a6b34', '#3cc864', '#3cc864', '#3cc864', '#1a6b34', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  问号 — 事件节点（7x7）
export const PixelQuestion: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', ''],
    ['#3c6cc8', '#68a0e8', '', '', '', '#68a0e8', '#3c6cc8'],
    ['', '', '', '', '#68a0e8', '#3c6cc8', ''],
    ['', '', '#3c6cc8', '#68a0e8', '#3c6cc8', '', ''],
    ['', '', '#68a0e8', '#3c6cc8', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '#68a0e8', '#3c6cc8', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  篝火 — 休息节点（7x7）
export const PixelCampfire: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '', '#e8d068', '', '', ''],
    ['', '', '#e8d068', '#c8a83c', '#e8d068', '', ''],
    ['', '#c87c3c', '#e8d068', '#c8403c', '#e8d068', '#c87c3c', ''],
    ['', '#c87c3c', '#c8403c', '#c8403c', '#c8403c', '#c87c3c', ''],
    ['#8b5014', '#c87c3c', '#c8403c', '#8b1a14', '#c8403c', '#c87c3c', '#8b5014'],
    ['', '', '#6a6a7e', '', '#6a6a7e', '', ''],
    ['', '#6a6a7e', '', '#3a3a4e', '', '#6a6a7e', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// ===== 状态效果图标 =====

// 毒液滴（6x7）
export const PixelPoison: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#8b3cc8', '', '', ''],
    ['', '#8b3cc8', '#b068e8', '#8b3cc8', '', ''],
    ['#8b3cc8', '#b068e8', '#d090ff', '#b068e8', '#8b3cc8', ''],
    ['#8b3cc8', '#b068e8', '#b068e8', '#b068e8', '#b068e8', '#8b3cc8'],
    ['#8b3cc8', '#b068e8', '#8b3cc8', '#b068e8', '#b068e8', '#8b3cc8'],
    ['', '#8b3cc8', '#b068e8', '#b068e8', '#8b3cc8', ''],
    ['', '', '#5a1a8b', '#5a1a8b', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 火焰（6x7）
export const PixelFlame: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#e8d068', '', '', ''],
    ['', '#e8d068', '#e8d068', '', '', ''],
    ['', '#e8d068', '#c87c3c', '#e8d068', '', ''],
    ['#c87c3c', '#c8403c', '#e8d068', '#c8403c', '#c87c3c', ''],
    ['#c87c3c', '#c8403c', '#c8403c', '#c8403c', '#c87c3c', ''],
    ['', '#c8403c', '#8b1a14', '#c8403c', '', ''],
    ['', '', '#8b1a14', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 闪避/风（7x5）
export const PixelWind: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#68a0e8', '#68a0e8', '#68a0e8', '#68a0e8', '', ''],
    ['', '', '', '', '', '#68a0e8', ''],
    ['#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', ''],
    ['', '', '', '', '', '', '#3c6cc8'],
    ['#68a0e8', '#68a0e8', '#68a0e8', '#68a0e8', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 上升箭头 — 力量/易伤（5x7）
export const PixelArrowUp: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#c8403c', '', ''],
    ['', '#c8403c', '#e86860', '#c8403c', ''],
    ['#c8403c', '#e86860', '#e86860', '#e86860', '#c8403c'],
    ['', '', '#e86860', '', ''],
    ['', '', '#e86860', '', ''],
    ['', '', '#e86860', '', ''],
    ['', '', '#c8403c', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 下降箭头 — 虚弱（5x7）
export const PixelArrowDown: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#6a6a7e', '', ''],
    ['', '', '#8a8a9e', '', ''],
    ['', '', '#8a8a9e', '', ''],
    ['', '', '#8a8a9e', '', ''],
    ['#6a6a7e', '#8a8a9e', '#8a8a9e', '#8a8a9e', '#6a6a7e'],
    ['', '#6a6a7e', '#8a8a9e', '#6a6a7e', ''],
    ['', '', '#6a6a7e', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 盾牌（7x7）
export const PixelShield: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', ''],
    ['#3c6cc8', '#68a0e8', '#68a0e8', '#68a0e8', '#68a0e8', '#68a0e8', '#3c6cc8'],
    ['#3c6cc8', '#68a0e8', '#3c6cc8', '#e8e8f0', '#3c6cc8', '#68a0e8', '#3c6cc8'],
    ['#3c6cc8', '#68a0e8', '#68a0e8', '#3c6cc8', '#68a0e8', '#68a0e8', '#3c6cc8'],
    ['', '#1a3c8b', '#68a0e8', '#68a0e8', '#68a0e8', '#1a3c8b', ''],
    ['', '', '#1a3c8b', '#3c6cc8', '#1a3c8b', '', ''],
    ['', '', '', '#1a3c8b', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 红心 — 生命（7x7）
export const PixelHeart: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#c8403c', '#c8403c', '', '#c8403c', '#c8403c', ''],
    ['#c8403c', '#e86860', '#e86860', '#c8403c', '#e86860', '#e86860', '#c8403c'],
    ['#c8403c', '#e86860', '#ff9090', '#e86860', '#e86860', '#e86860', '#c8403c'],
    ['#c8403c', '#e86860', '#e86860', '#e86860', '#e86860', '#e86860', '#c8403c'],
    ['', '#c8403c', '#e86860', '#e86860', '#e86860', '#c8403c', ''],
    ['', '', '#c8403c', '#e86860', '#c8403c', '', ''],
    ['', '', '', '#c8403c', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 金币（6x6）
export const PixelCoin: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#c8a83c', '#c8a83c', '#c8a83c', '#c8a83c', ''],
    ['#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#e8d068', '#c8a83c'],
    ['#c8a83c', '#e8d068', '#c8a83c', '#c8a83c', '#e8d068', '#c8a83c'],
    ['#c8a83c', '#e8d068', '#c8a83c', '#c8a83c', '#e8d068', '#c8a83c'],
    ['#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#e8d068', '#c8a83c'],
    ['', '#8b7414', '#8b7414', '#8b7414', '#8b7414', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// ===== 牌型图标 =====

// 闪电 — 普通攻击（5x7）
export const PixelZap: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '', '#e8d068', '#e8d068'],
    ['', '', '#e8d068', '#e8d068', ''],
    ['', '#e8d068', '#e8d068', '', ''],
    ['#e8d068', '#e8d068', '#e8d068', '#e8d068', '#e8d068'],
    ['', '', '#e8d068', '#e8d068', ''],
    ['', '#e8d068', '#e8d068', '', ''],
    ['#e8d068', '#c8a83c', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 对子图标 — 两个骰子点（5x5）
export const PixelPair: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#3cc864', '#68e888', '', '', ''],
    ['#68e888', '#3cc864', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '#3cc864', '#68e888'],
    ['', '', '', '#68e888', '#3cc864'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 层叠 — 连对（5x5）
export const PixelLayers: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#3c6cc8', '#3c6cc8', '#3c6cc8', ''],
    ['#3c6cc8', '#68a0e8', '#68a0e8', '#68a0e8', '#3c6cc8'],
    ['', '', '', '', ''],
    ['', '#c8a83c', '#c8a83c', '#c8a83c', ''],
    ['#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#c8a83c'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 三角 — 三条（5x5）
export const PixelTriangle: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#e8a860', '', ''],
    ['', '#c87c3c', '#e8a860', '#c87c3c', ''],
    ['', '#c87c3c', '#e8a860', '#c87c3c', ''],
    ['#c87c3c', '#e8a860', '#e8a860', '#e8a860', '#c87c3c'],
    ['#8b5014', '#c87c3c', '#c87c3c', '#c87c3c', '#8b5014'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 箭头 — 顺子（6x5）
export const PixelArrowRight: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '', '#3cc864', '', ''],
    ['', '', '', '', '#68e888', ''],
    ['#3cc864', '#3cc864', '#3cc864', '#68e888', '#68e888', '#3cc864'],
    ['', '', '', '', '#68e888', ''],
    ['', '', '', '#3cc864', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 水滴 — 同元素（5x6）
export const PixelDroplet: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#3c6cc8', '', ''],
    ['', '#3c6cc8', '#68a0e8', '#3c6cc8', ''],
    ['#3c6cc8', '#68a0e8', '#a0d0ff', '#68a0e8', '#3c6cc8'],
    ['#3c6cc8', '#68a0e8', '#68a0e8', '#68a0e8', '#3c6cc8'],
    ['', '#1a3c8b', '#3c6cc8', '#1a3c8b', ''],
    ['', '', '#1a3c8b', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 血滴 — 战士血怒（5x6）
export const PixelBloodDrop: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#c8403c', '', ''],
    ['', '#c8403c', '#e86060', '#c8403c', ''],
    ['#c8403c', '#e86060', '#ff8080', '#e86060', '#c8403c'],
    ['#c8403c', '#e86060', '#e86060', '#e86060', '#c8403c'],
    ['', '#8b1a14', '#c8403c', '#8b1a14', ''],
    ['', '', '#8b1a14', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 房子 — 葫芦（5x6）
export const PixelHouse: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#c87c3c', '', ''],
    ['', '#c87c3c', '#e8a860', '#c87c3c', ''],
    ['#c87c3c', '#e8a860', '#e8a860', '#e8a860', '#c87c3c'],
    ['#8b5014', '#e8a860', '#c87c3c', '#e8a860', '#8b5014'],
    ['#8b5014', '#e8a860', '#8b5014', '#e8a860', '#8b5014'],
    ['#8b5014', '#8b5014', '#8b5014', '#8b5014', '#8b5014'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 方块 — 四条（5x5）
export const PixelSquare: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#5a1a8b', '#8b3cc8', '#8b3cc8', '#8b3cc8', '#5a1a8b'],
    ['#8b3cc8', '#b068e8', '#d090ff', '#b068e8', '#8b3cc8'],
    ['#8b3cc8', '#d090ff', '#b068e8', '#b068e8', '#8b3cc8'],
    ['#8b3cc8', '#b068e8', '#b068e8', '#b068e8', '#8b3cc8'],
    ['#5a1a8b', '#8b3cc8', '#8b3cc8', '#8b3cc8', '#5a1a8b'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 星星 — 五条（7x7）
export const PixelStar: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '', '#e8d068', '', '', ''],
    ['', '', '#e8d068', '#e8d068', '#e8d068', '', ''],
    ['#e8d068', '#e8d068', '#e8d068', '#c8a83c', '#e8d068', '#e8d068', '#e8d068'],
    ['', '#e8d068', '#c8a83c', '#e8d068', '#c8a83c', '#e8d068', ''],
    ['', '#e8d068', '#e8d068', '#c8a83c', '#e8d068', '#e8d068', ''],
    ['#e8d068', '#c8a83c', '', '', '', '#c8a83c', '#e8d068'],
    ['#8b7414', '', '', '', '', '', '#8b7414'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 奖杯 — 六条（7x7）
export const PixelTrophy: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#c8a83c', ''],
    ['#c8a83c', '#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#c8a83c', '#c8a83c'],
    ['', '#c8a83c', '#e8d068', '#e8d068', '#e8d068', '#c8a83c', ''],
    ['', '', '#c8a83c', '#e8d068', '#c8a83c', '', ''],
    ['', '', '', '#c8a83c', '', '', ''],
    ['', '', '#8b7414', '#8b7414', '#8b7414', '', ''],
    ['', '#8b7414', '#c8a83c', '#c8a83c', '#c8a83c', '#8b7414', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 波浪 — 元素葫芦（5x4）
export const PixelWaves: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#3c6cc8', '', '', '#3c6cc8', ''],
    ['', '#68a0e8', '#3c6cc8', '', '#3c6cc8'],
    ['#3c6cc8', '', '', '#3c6cc8', ''],
    ['', '#68a0e8', '#3c6cc8', '', '#3c6cc8'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// ===== 骰子图标 =====
export const PixelDice: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#3a3a4e', '#6a6a7e', '#6a6a7e', '#6a6a7e', '#6a6a7e', '#6a6a7e', '#3a3a4e'],
    ['#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#3a3a4e'],
    ['#6a6a7e', '#c8c8d0', '#1a1a2e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#3a3a4e'],
    ['#6a6a7e', '#c8c8d0', '#c8c8d0', '#1a1a2e', '#c8c8d0', '#c8c8d0', '#3a3a4e'],
    ['#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#1a1a2e', '#c8c8d0', '#3a3a4e'],
    ['#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#3a3a4e'],
    ['#3a3a4e', '#3a3a4e', '#3a3a4e', '#3a3a4e', '#3a3a4e', '#3a3a4e', '#3a3a4e'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 重骰/刷新 — 清晰的循环箭头（7x7）
export const PixelRefresh: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#3cc864', '#68e888', '#3cc864', '', ''],
    ['', '#3cc864', '', '', '', '#3cc864', '#68e888'],
    ['#3cc864', '', '', '', '', '', ''],
    ['#3cc864', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '#3cc864'],
    ['#68e888', '#3cc864', '', '', '', '#3cc864', ''],
    ['', '', '#3cc864', '#68e888', '#3cc864', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 出牌/播放 — 更清晰的三角形（5x7）
export const PixelPlay: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#3cc864', '', '', '', ''],
    ['#3cc864', '#68e888', '', '', ''],
    ['#3cc864', '#68e888', '#3cc864', '', ''],
    ['#3cc864', '#68e888', '#68e888', '#3cc864', ''],
    ['#3cc864', '#68e888', '#3cc864', '', ''],
    ['#3cc864', '#68e888', '', '', ''],
    ['#3cc864', '', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 攻击警告 — 红色交叉剑（7x7）
export const PixelAttackIntent: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#c8403c', '', '', '', '', '', '#c8403c'],
    ['#e86860', '#c8403c', '', '', '', '#c8403c', '#e86860'],
    ['', '#e86860', '#c8403c', '', '#c8403c', '#e86860', ''],
    ['', '', '#e86860', '#c8403c', '#e86860', '', ''],
    ['', '#e86860', '#c8403c', '', '#c8403c', '#e86860', ''],
    ['#e86860', '#c8403c', '', '', '', '#c8403c', '#e86860'],
    ['#c8403c', '', '', '', '', '', '#c8403c'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 技能/魔法 — 更清晰的星芒（7x7）
export const PixelMagic: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '', '#b068e8', '', '', ''],
    ['', '#8b3cc8', '', '#b068e8', '', '#8b3cc8', ''],
    ['', '', '#b068e8', '#d090ff', '#b068e8', '', ''],
    ['#b068e8', '#b068e8', '#d090ff', '#d090ff', '#d090ff', '#b068e8', '#b068e8'],
    ['', '', '#b068e8', '#d090ff', '#b068e8', '', ''],
    ['', '#8b3cc8', '', '#b068e8', '', '#8b3cc8', ''],
    ['', '', '', '#b068e8', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 书/帮助（6x7）
export const PixelBook: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#3a3a4e', '#6a6a7e', '#6a6a7e', '#6a6a7e', '#3a3a4e'],
    ['#3a3a4e', '#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#3a3a4e'],
    ['#3a3a4e', '#6a6a7e', '#c8c8d0', '#3a3a4e', '#c8c8d0', '#3a3a4e'],
    ['#3a3a4e', '#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#3a3a4e'],
    ['#3a3a4e', '#6a6a7e', '#c8c8d0', '#3a3a4e', '#c8c8d0', '#3a3a4e'],
    ['#3a3a4e', '#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#3a3a4e'],
    ['', '#3a3a4e', '#6a6a7e', '#6a6a7e', '#6a6a7e', '#3a3a4e'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 扑克牌图标 — 牌型图鉴用（蓝色牌面）
export const PixelCards: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#1a3c8b', '#3c6cc8', '#3c6cc8', '#1a3c8b'],
    ['', '#1a3c8b', '#3c6cc8', '#68a0e8', '#3c6cc8', '#1a3c8b'],
    ['#1a3c8b', '#3c6cc8', '#68a0e8', '#fff', '#3c6cc8', '#1a3c8b'],
    ['#1a3c8b', '#3c6cc8', '#68a0e8', '#3c6cc8', '#3c6cc8', '#1a3c8b'],
    ['#1a3c8b', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#3c6cc8', '#1a3c8b'],
    ['#1a3c8b', '#1a3c8b', '#1a3c8b', '#1a3c8b', '#1a3c8b', '#1a3c8b'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 骰子图标 — 骰子图鉴用（绿色骰面+点数）
export const PixelDiceIcon: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#1a6a2a', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#1a6a2a'],
    ['#2a8a3a', '#fff', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#2a8a3a'],
    ['#2a8a3a', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#2a8a3a'],
    ['#2a8a3a', '#2a8a3a', '#2a8a3a', '#fff', '#2a8a3a', '#2a8a3a'],
    ['#2a8a3a', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#fff', '#2a8a3a'],
    ['#1a6a2a', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#2a8a3a', '#1a6a2a'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 宝石/遗物图标 — 遗物图鉴用（紫色宝石）
export const PixelGem: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#6a3a8a', '#6a3a8a', '', ''],
    ['', '#6a3a8a', '#8a4aaa', '#8a4aaa', '#6a3a8a', ''],
    ['#6a3a8a', '#8a4aaa', '#b068e8', '#b068e8', '#8a4aaa', '#6a3a8a'],
    ['#6a3a8a', '#b068e8', '#d0a0ff', '#b068e8', '#8a4aaa', '#6a3a8a'],
    ['', '#6a3a8a', '#8a4aaa', '#8a4aaa', '#6a3a8a', ''],
    ['', '', '#6a3a8a', '#6a3a8a', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 怪物爪痕图标 — 敌人图鉴用（红色爪印）
export const PixelClaw: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#c8403c', '', '#c8403c', '', '#c8403c', ''],
    ['#c8403c', '', '#c8403c', '', '#c8403c', ''],
    ['', '#e86860', '', '#e86860', '', '#e86860'],
    ['', '#e86860', '', '#e86860', '', '#e86860'],
    ['', '', '#c8403c', '', '#c8403c', ''],
    ['', '', '', '#c8403c', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// X/关闭（5x5）
export const PixelClose: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#c8403c', '', '', '', '#c8403c'],
    ['', '#e86860', '', '#e86860', ''],
    ['', '', '#e86860', '', ''],
    ['', '#e86860', '', '#e86860', ''],
    ['#c8403c', '', '', '', '#c8403c'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 信息图标 — 更清晰的 i 符号（5x7）
export const PixelInfo: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#3c6cc8', '#3c6cc8', '#3c6cc8', ''],
    ['#3c6cc8', '', '#68a0e8', '', '#3c6cc8'],
    ['#3c6cc8', '', '', '', '#3c6cc8'],
    ['#3c6cc8', '', '#68a0e8', '', '#3c6cc8'],
    ['#3c6cc8', '', '#68a0e8', '', '#3c6cc8'],
    ['#3c6cc8', '', '#68a0e8', '', '#3c6cc8'],
    ['', '#3c6cc8', '#3c6cc8', '#3c6cc8', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 设置/齿轮 — 更清晰的齿轮形状（7x7）
export const PixelGear: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#6a6a7e', '', '#6a6a7e', '', '#6a6a7e', ''],
    ['#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#6a6a7e'],
    ['', '#c8c8d0', '#6a6a7e', '#6a6a7e', '#6a6a7e', '#c8c8d0', ''],
    ['#6a6a7e', '#c8c8d0', '#6a6a7e', '', '#6a6a7e', '#c8c8d0', '#6a6a7e'],
    ['', '#c8c8d0', '#6a6a7e', '#6a6a7e', '#6a6a7e', '#c8c8d0', ''],
    ['#6a6a7e', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#c8c8d0', '#6a6a7e'],
    ['', '#6a6a7e', '', '#6a6a7e', '', '#6a6a7e', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 力量拳头（6x7）
export const PixelFist: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '#c87c3c', '#c87c3c', '#c87c3c', '#c87c3c', ''],
    ['#c87c3c', '#e8a860', '#e8a860', '#e8a860', '#e8a860', '#c87c3c'],
    ['#c87c3c', '#e8a860', '#e8a860', '#e8a860', '#e8a860', '#c87c3c'],
    ['#c87c3c', '#e8a860', '#c87c3c', '#c87c3c', '#e8a860', '#c87c3c'],
    ['', '#c87c3c', '#e8a860', '#e8a860', '#c87c3c', ''],
    ['', '', '#c87c3c', '#c87c3c', '', ''],
    ['', '', '#8b5014', '#8b5014', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 骰子配置图标
export const PixelDiceStandard: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  return <PixelDice size={size} className={className} style={style} />;
};

export const PixelDiceChaos: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#5a1a8b', '#5a1a8b', '#5a1a8b', '#5a1a8b', '#5a1a8b'],
    ['#5a1a8b', '#8b3cc8', '#5a1a8b', '#b068e8', '#5a1a8b'],
    ['#5a1a8b', '#b068e8', '#8b3cc8', '#5a1a8b', '#5a1a8b'],
    ['#5a1a8b', '#5a1a8b', '#b068e8', '#8b3cc8', '#5a1a8b'],
    ['#5a1a8b', '#5a1a8b', '#5a1a8b', '#5a1a8b', '#5a1a8b'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

export const PixelDiceBlood: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#8b1a14', '#8b1a14', '#8b1a14', '#8b1a14', '#8b1a14'],
    ['#8b1a14', '#c8403c', '#8b1a14', '#c8403c', '#8b1a14'],
    ['#8b1a14', '#8b1a14', '#c8403c', '#8b1a14', '#8b1a14'],
    ['#8b1a14', '#c8403c', '#8b1a14', '#c8403c', '#8b1a14'],
    ['#8b1a14', '#8b1a14', '#8b1a14', '#8b1a14', '#8b1a14'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

export const PixelDiceWeighted: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['#8b7414', '#8b7414', '#8b7414', '#8b7414', '#8b7414'],
    ['#8b7414', '#c8a83c', '#8b7414', '#c8a83c', '#8b7414'],
    ['#8b7414', '#c8a83c', '#e8d068', '#c8a83c', '#8b7414'],
    ['#8b7414', '#c8a83c', '#8b7414', '#c8a83c', '#8b7414'],
    ['#8b7414', '#8b7414', '#8b7414', '#8b7414', '#8b7414'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  音量（6x6）
export const PixelVolume: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#5a9e5a', '', '', ''],
    ['', '#5a9e5a', '#8ed88e', '#5a9e5a', '', '#5a9e5a'],
    ['#5a9e5a', '#8ed88e', '#8ed88e', '', '#5a9e5a', ''],
    ['#5a9e5a', '#8ed88e', '#8ed88e', '', '#5a9e5a', ''],
    ['', '#5a9e5a', '#8ed88e', '#5a9e5a', '', '#5a9e5a'],
    ['', '', '#5a9e5a', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  静音（6x6）
export const PixelMute: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#c74040', '', '', ''],
    ['', '#c74040', '#e86060', '#c74040', '', ''],
    ['#c74040', '#e86060', '#e86060', '', '#c74040', ''],
    ['#c74040', '#e86060', '#e86060', '', '#c74040', ''],
    ['', '#c74040', '#e86060', '#c74040', '', ''],
    ['', '', '#c74040', '', '', ''],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

//  音乐（5x6）
export const PixelMusic: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const p = [
    ['', '', '#4a8ec7', '#6ac0ff', '#6ac0ff'],
    ['', '', '#4a8ec7', '', '#4a8ec7'],
    ['', '', '#4a8ec7', '', '#4a8ec7'],
    ['', '', '#4a8ec7', '', '#4a8ec7'],
    ['#6ac0ff', '#6ac0ff', '#4a8ec7', '#6ac0ff', '#6ac0ff'],
    ['#6ac0ff', '#6ac0ff', '', '#6ac0ff', '#6ac0ff'],
  ];
  return <IconBase pixels={p} ps={size} className={className} style={style} />;
};

// 导出所有图标的映射
export const PIXEL_ICON_MAP = {
  sword: PixelSword,
  skull: PixelSkull,
  crown: PixelCrown,
  shopBag: PixelShopBag,
  question: PixelQuestion,
  campfire: PixelCampfire,
  poison: PixelPoison,
  flame: PixelFlame,
  wind: PixelWind,
  arrowUp: PixelArrowUp,
  arrowDown: PixelArrowDown,
  shield: PixelShield,
  heart: PixelHeart,
  coin: PixelCoin,
  zap: PixelZap,
  pair: PixelPair,
  layers: PixelLayers,
  triangle: PixelTriangle,
  arrowRight: PixelArrowRight,
  droplet: PixelDroplet,
  house: PixelHouse,
  square: PixelSquare,
  star: PixelStar,
  trophy: PixelTrophy,
  waves: PixelWaves,
  dice: PixelDice,
  refresh: PixelRefresh,
  play: PixelPlay,
  attackIntent: PixelAttackIntent,
  magic: PixelMagic,
  book: PixelBook,
  close: PixelClose,
  info: PixelInfo,
  gear: PixelGear,
  fist: PixelFist,
  volume: PixelVolume,
  mute: PixelMute,
  music: PixelMusic,
};

/** 像素宝箱图标 */
export const PixelTreasure: React.FC<{ size?: number; className?: string }> = ({ size = 2, className }) => {
  const s = size;
  return (
    <svg width={8 * s} height={8 * s} viewBox="0 0 8 8" className={className} style={{ imageRendering: 'pixelated' }}>
      {/* 箱体 */}
      <rect x="1" y="3" width="6" height="4" fill="#8B6914" />
      <rect x="1" y="3" width="6" height="1" fill="#A07818" />
      {/* 箱盖 */}
      <rect x="0" y="2" width="8" height="2" fill="#C8961E" rx="1" />
      {/* 锁扣 */}
      <rect x="3" y="3" width="2" height="2" fill="#FFD700" />
      <rect x="3.5" y="4" width="1" height="1" fill="#8B6914" />
      {/* 高光 */}
      <rect x="2" y="2" width="1" height="1" fill="#FFE066" opacity="0.6" />
    </svg>
  );
};

/** 像素游荡商人图标 */
export const PixelMerchant: React.FC<{ size?: number; className?: string }> = ({ size = 2, className }) => {
  const s = size;
  return (
    <svg width={8 * s} height={8 * s} viewBox="0 0 8 8" className={className} style={{ imageRendering: 'pixelated' }}>
      {/* 帽子 */}
      <rect x="2" y="0" width="4" height="1" fill="#6B4226" />
      <rect x="1" y="1" width="6" height="1" fill="#8B5A2B" />
      {/* 头 */}
      <rect x="3" y="2" width="2" height="2" fill="#FFDAB9" />
      {/* 身体/斗篷 */}
      <rect x="2" y="4" width="4" height="3" fill="#4A6741" />
      <rect x="1" y="5" width="1" height="2" fill="#3A5731" />
      <rect x="6" y="5" width="1" height="2" fill="#3A5731" />
      {/* 背包 */}
      <rect x="6" y="3" width="2" height="3" fill="#8B6914" />
      <rect x="6" y="3" width="2" height="1" fill="#A07818" />
      {/* 脚 */}
      <rect x="2" y="7" width="2" height="1" fill="#5C3317" />
      <rect x="4" y="7" width="2" height="1" fill="#5C3317" />
    </svg>
  );
};

/** 魂晶 - 紫色水晶形状的像素icon */
export const PixelSoulCrystal: React.FC<{ size?: number; className?: string }> = ({ size = 2, className }) => {
  const s = size;
  return (
    <svg width={8 * s} height={8 * s} viewBox="0 0 8 8" className={className} style={{ imageRendering: 'pixelated' }}>
      {/* 外框 - 深紫色 */}
      <rect x="3" y="0" width="2" height="1" fill="#4a1a6b" />
      <rect x="2" y="1" width="1" height="1" fill="#4a1a6b" />
      <rect x="5" y="1" width="1" height="1" fill="#4a1a6b" />
      <rect x="1" y="2" width="1" height="1" fill="#4a1a6b" />
      <rect x="6" y="2" width="1" height="1" fill="#4a1a6b" />
      <rect x="1" y="3" width="1" height="1" fill="#4a1a6b" />
      <rect x="6" y="3" width="1" height="1" fill="#4a1a6b" />
      <rect x="1" y="4" width="1" height="1" fill="#4a1a6b" />
      <rect x="6" y="4" width="1" height="1" fill="#4a1a6b" />
      <rect x="2" y="5" width="1" height="1" fill="#4a1a6b" />
      <rect x="5" y="5" width="1" height="1" fill="#4a1a6b" />
      <rect x="3" y="6" width="1" height="1" fill="#4a1a6b" />
      <rect x="4" y="6" width="1" height="1" fill="#4a1a6b" />
      <rect x="3" y="7" width="2" height="1" fill="#3a1055" />
      {/* 主体 - 紫色渐变 */}
      <rect x="3" y="1" width="2" height="1" fill="#9b59b6" />
      <rect x="2" y="2" width="4" height="1" fill="#8e44ad" />
      <rect x="2" y="3" width="4" height="1" fill="#7d3c98" />
      <rect x="2" y="4" width="4" height="1" fill="#6c3483" />
      <rect x="3" y="5" width="2" height="1" fill="#5b2c6f" />
      {/* 高光 */}
      <rect x="3" y="2" width="1" height="1" fill="#d2b4de" />
      <rect x="3" y="3" width="1" height="1" fill="#bb8fce" />
      <rect x="4" y="2" width="1" height="1" fill="#c39bd3" />
      {/* 底部反光 */}
      <rect x="4" y="5" width="1" height="1" fill="#7d3c98" />
    </svg>
  );
};