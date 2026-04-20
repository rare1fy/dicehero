import React from 'react';
import * as D from '../data/pixelIconData';

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
const generateShadow = (pixels: readonly (readonly string[])[], ps: number): string => {
  const shadows: string[] = [];
  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      const color = pixels[r][c];
      if (color) shadows.push(`${(c + 1) * ps}px ${(r + 1) * ps}px 0 ${color}`);
    }
  }
  return shadows.join(',');
};

const IconBase: React.FC<{ pixels: readonly (readonly string[])[]; ps: number; className?: string; style?: React.CSSProperties }> = ({ pixels, ps, className = '', style }) => {
  const w = pixels[0]?.length || 0;
  const h = pixels.length;
  return (
    <div className={`inline-block relative ${className}`} style={{ width: w * ps, height: h * ps, ...style }}>
      <div style={{ position: 'absolute', top: -ps, left: -ps, width: ps, height: ps, boxShadow: generateShadow(pixels, ps), imageRendering: 'pixelated' }} />
    </div>
  );
};

// ===== 地图节点图标 =====

/** 剑 — 战斗节点 */
export const PixelSword: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.SWORD} ps={size} className={className} style={style} />;

/** 骷髅 — 精英节点 */
export const PixelSkull: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.SKULL} ps={size} className={className} style={style} />;

/** 王冠 — Boss节点 */
export const PixelCrown: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.CROWN} ps={size} className={className} style={style} />;

/** 商店袋 — 商店节点 */
export const PixelShopBag: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.SHOP_BAG} ps={size} className={className} style={style} />;

/** 问号 — 事件节点 */
export const PixelQuestion: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.QUESTION} ps={size} className={className} style={style} />;

/** 篝火 — 休息节点 */
export const PixelCampfire: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.CAMPFIRE} ps={size} className={className} style={style} />;

// ===== 状态效果图标 =====

/** 毒液滴 */
export const PixelPoison: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.POISON} ps={size} className={className} style={style} />;

/** 火焰 */
export const PixelFlame: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.FLAME} ps={size} className={className} style={style} />;

/** 闪避/风 */
export const PixelWind: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.WIND} ps={size} className={className} style={style} />;

/** 上升箭头 — 力量/易伤 */
export const PixelArrowUp: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.ARROW_UP} ps={size} className={className} style={style} />;

/** 下降箭头 — 虚弱 */
export const PixelArrowDown: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.ARROW_DOWN} ps={size} className={className} style={style} />;

/** 盾牌 */
export const PixelShield: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.SHIELD} ps={size} className={className} style={style} />;

/** 红心 — 生命 */
export const PixelHeart: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.HEART} ps={size} className={className} style={style} />;

/** 金币 */
export const PixelCoin: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.COIN} ps={size} className={className} style={style} />;

// ===== 牌型图标 =====

/** 闪电 — 普通攻击 */
export const PixelZap: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.ZAP} ps={size} className={className} style={style} />;

/** 对对 — 两个骰子点 */
export const PixelPair: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.PAIR} ps={size} className={className} style={style} />;

/** 层叠 — 连对 */
export const PixelLayers: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.LAYERS} ps={size} className={className} style={style} />;

/** 三角 — 三条 */
export const PixelTriangle: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.TRIANGLE} ps={size} className={className} style={style} />;

/** 箭头 — 顺子 */
export const PixelArrowRight: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.ARROW_RIGHT} ps={size} className={className} style={style} />;

/** 水滴 — 同元素 */
export const PixelDroplet: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.DROPLET} ps={size} className={className} style={style} />;

/** 血滴 — 战士血怒 */
export const PixelBloodDrop: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.BLOOD_DROP} ps={size} className={className} style={style} />;

/** 房子 — 葫芦 */
export const PixelHouse: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.HOUSE} ps={size} className={className} style={style} />;

/** 方块 — 四条 */
export const PixelSquare: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.SQUARE} ps={size} className={className} style={style} />;

/** 星星 — 五条 */
export const PixelStar: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.STAR} ps={size} className={className} style={style} />;

/** 奖杯 — 六条 */
export const PixelTrophy: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.TROPHY} ps={size} className={className} style={style} />;

/** 波浪 — 元素葫芦 */
export const PixelWaves: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.WAVES} ps={size} className={className} style={style} />;

// ===== 骰子 & 功能图标 =====

/** 骰子 */
export const PixelDice: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.DICE} ps={size} className={className} style={style} />;

/** 重骰/刷新 */
export const PixelRefresh: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.REFRESH} ps={size} className={className} style={style} />;

/** 出牌/播放 */
export const PixelPlay: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.PLAY} ps={size} className={className} style={style} />;

/** 攻击警告 — 红色交叉剑 */
export const PixelAttackIntent: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.ATTACK_INTENT} ps={size} className={className} style={style} />;

/** 技能/魔法 — 星芒 */
export const PixelMagic: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.MAGIC} ps={size} className={className} style={style} />;

/** 书/帮助 */
export const PixelBook: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.BOOK} ps={size} className={className} style={style} />;

/** 扑克牌图标 — 牌型图鉴用 */
export const PixelCards: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.CARDS} ps={size} className={className} style={style} />;

/** 骰子图标 — 骰子图鉴用 */
export const PixelDiceIcon: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.DICE_ICON} ps={size} className={className} style={style} />;

/** 宝石/遗物图标 — 遗物图鉴用 */
export const PixelGem: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.GEM} ps={size} className={className} style={style} />;

/** 怪物爪痕图标 — 敌人图鉴用 */
export const PixelClaw: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.CLAW} ps={size} className={className} style={style} />;

/** X/关闭 */
export const PixelClose: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.CLOSE} ps={size} className={className} style={style} />;

/** 信息图标 — i 符号 */
export const PixelInfo: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.INFO} ps={size} className={className} style={style} />;

/** 设置/齿轮 */
export const PixelGear: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.GEAR} ps={size} className={className} style={style} />;

/** 力量拳头 */
export const PixelFist: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.FIST} ps={size} className={className} style={style} />;

/** 标准骰子配置图标 */
export const PixelDiceStandard: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  return <PixelDice size={size} className={className} style={style} />;
};

/** 混沌骰子 */
export const PixelDiceChaos: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.DICE_CHAOS} ps={size} className={className} style={style} />;

/** 血怒骰子 */
export const PixelDiceBlood: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.DICE_BLOOD} ps={size} className={className} style={style} />;

/** 配重骰子 */
export const PixelDiceWeighted: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.DICE_WEIGHTED} ps={size} className={className} style={style} />;

/** 音量 */
export const PixelVolume: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.VOLUME} ps={size} className={className} style={style} />;

/** 静音 */
export const PixelMute: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.MUTE} ps={size} className={className} style={style} />;

/** 音乐 */
export const PixelMusic: React.FC<PixelIconProps> = ({ size = 2, className, style }) =>
  <IconBase pixels={D.MUSIC} ps={size} className={className} style={style} />;

// ===== 图标映射表 =====
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

// ===== SVG 像素图标（box-shadow 不便表达的复杂图形） =====

/** 像素宝箱图标 */
export const PixelTreasure: React.FC<{ size?: number; className?: string }> = ({ size = 2, className }) => {
  const s = size;
  return (
    <svg width={8 * s} height={8 * s} viewBox="0 0 8 8" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="3" width="6" height="4" fill="#8B6914" />
      <rect x="1" y="3" width="6" height="1" fill="#A07818" />
      <rect x="0" y="2" width="8" height="2" fill="#C8961E" rx="1" />
      <rect x="3" y="3" width="2" height="2" fill="#FFD700" />
      <rect x="3.5" y="4" width="1" height="1" fill="#8B6914" />
      <rect x="2" y="2" width="1" height="1" fill="#FFE066" opacity="0.6" />
    </svg>
  );
};

/** 像素游荡商人图标 */
export const PixelMerchant: React.FC<{ size?: number; className?: string }> = ({ size = 2, className }) => {
  const s = size;
  return (
    <svg width={8 * s} height={8 * s} viewBox="0 0 8 8" className={className} style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="0" width="4" height="1" fill="#6B4226" />
      <rect x="1" y="1" width="6" height="1" fill="#8B5A2B" />
      <rect x="3" y="2" width="2" height="2" fill="#FFDAB9" />
      <rect x="2" y="4" width="4" height="3" fill="#4A6741" />
      <rect x="1" y="5" width="1" height="2" fill="#3A5731" />
      <rect x="6" y="5" width="1" height="2" fill="#3A5731" />
      <rect x="6" y="3" width="2" height="3" fill="#8B6914" />
      <rect x="6" y="3" width="2" height="1" fill="#A07818" />
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
      <rect x="3" y="1" width="2" height="1" fill="#9b59b6" />
      <rect x="2" y="2" width="4" height="1" fill="#8e44ad" />
      <rect x="2" y="3" width="4" height="1" fill="#7d3c98" />
      <rect x="2" y="4" width="4" height="1" fill="#6c3483" />
      <rect x="3" y="5" width="2" height="1" fill="#5b2c6f" />
      <rect x="3" y="2" width="1" height="1" fill="#d2b4de" />
      <rect x="3" y="3" width="1" height="1" fill="#bb8fce" />
      <rect x="4" y="2" width="1" height="1" fill="#c39bd3" />
      <rect x="4" y="5" width="1" height="1" fill="#7d3c98" />
    </svg>
  );
};
