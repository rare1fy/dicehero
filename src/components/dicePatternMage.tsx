import React from 'react';

/**
 * dicePatternMage - 星界魔导骰子像素图案
 * viewBox 统一 0 0 24 24，渲染尺寸由父容器控制
 *
 * 从 dicePatternData.tsx 拆分而来 (ARCH-13)
 */

const S = 'crispEdges'; // shapeRendering

// ============================================================
// 法师骰子图案 (20活跃 + 2预留 = 22)
// 预留: weave/permafrost（index.css/PixelDiceRenderer 已有资源，classes.ts 待补 DiceDef）
// ============================================================

export const M_elemental = () => ( // 元素 → 四元素方块
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="3" y="3" width="8" height="8" fill="currentColor"/>
    <rect x="13" y="3" width="8" height="8" fill="currentColor" opacity=".6"/>
    <rect x="3" y="13" width="8" height="8" fill="currentColor" opacity=".6"/>
    <rect x="13" y="13" width="8" height="8" fill="currentColor" opacity=".3"/>
  </svg>
);
export const M_reverse = () => ( // 反转 → 旋转箭头
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 4A8 8 0 0120 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M12 20A8 8 0 014 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <polygon points="20,8 22,13 17,12" fill="currentColor"/>
    <polygon points="4,16 2,11 7,12" fill="currentColor"/>
  </svg>
);
export const M_missile = () => ( // 奥术飞弹 → 三星
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="7" cy="8" r="3.5" fill="currentColor"/>
    <circle cx="17" cy="7" r="2.5" fill="currentColor" opacity=".7"/>
    <circle cx="12" cy="17" r="4" fill="currentColor" opacity=".5"/>
  </svg>
);
export const M_barrier = () => ( // 魔力屏障 → 六边形
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <polygon points="12,7 17,10 17,15 12,18 7,15 7,10" fill="currentColor" opacity=".3"/>
  </svg>
);
export const M_meditate = () => ( // 冥想 → 莲花
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <ellipse cx="12" cy="14" rx="3" ry="5" fill="currentColor"/>
    <ellipse cx="7" cy="13" rx="3" ry="4" fill="currentColor" opacity=".5" transform="rotate(-20,7,13)"/>
    <ellipse cx="17" cy="13" rx="3" ry="4" fill="currentColor" opacity=".5" transform="rotate(20,17,13)"/>
    <circle cx="12" cy="7" r="2" fill="currentColor" opacity=".4"/>
  </svg>
);
export const M_amplify = () => ( // 奥术增幅 → 上箭头+闪光
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 18,12 14,12 14,22 10,22 10,12 6,12" fill="currentColor"/>
  </svg>
);
export const M_mirror = () => ( // 镜像 → 对称分割
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="3" width="2" height="18" fill="currentColor"/>
    <rect x="4" y="8" width="6" height="8" rx="1" fill="currentColor" opacity=".5"/>
    <rect x="14" y="8" width="6" height="8" rx="1" fill="currentColor" opacity=".5"/>
  </svg>
);
export const M_crystal = () => ( // 水晶 → 菱形
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/>
    <polygon points="12,6 18,12 12,18 6,12" fill="currentColor" opacity=".4"/>
  </svg>
);
export const M_temporal = () => ( // 时光 → 沙漏
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="5,3 19,3 12,12 19,21 5,21 12,12" fill="currentColor"/>
  </svg>
);
export const M_prism = () => ( // 棱镜 → 三棱镜
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,3 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="12" y1="3" x2="18" y2="20" stroke="currentColor" strokeWidth="1" opacity=".5"/>
    <line x1="12" y1="3" x2="6" y2="20" stroke="currentColor" strokeWidth="1" opacity=".5"/>
  </svg>
);
export const M_resonance = () => ( // 共鸣 → 同心涟漪
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5"/>
  </svg>
);
export const M_devour = () => ( // 吞噬 → 黑洞
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".3"/>
    <circle cx="12" cy="12" r="6" fill="currentColor" opacity=".5"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);
export const M_purify = () => ( // 净化之光 → 十字光
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="2" width="4" height="20" fill="currentColor"/>
    <rect x="2" y="10" width="20" height="4" fill="currentColor"/>
    <rect x="10" y="10" width="4" height="4" fill="currentColor" opacity=".4"/>
  </svg>
);
export const M_surge = () => ( // 法力涌动 → 向上尖刺
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 16,22 12,16 8,22" fill="currentColor"/>
  </svg>
);
export const M_elemstorm = () => ( // 元素风暴 → 螺旋
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 4A8 8 0 0120 12A6 6 0 0114 18A4 4 0 018 14A2 2 0 0110 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);
export const M_burnecho = () => ( // 灼烧共鸣 → 火焰波纹
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 3C14 7 18 10 18 15C18 19 15 21 12 21C9 21 6 19 6 15C6 10 10 7 12 3Z" fill="currentColor"/>
    <path d="M12 8C13 11 14 13 14 16C14 18 12 19 12 19C12 19 10 18 10 16C10 13 11 11 12 8Z" fill="currentColor" opacity=".5"/>
    <rect x="11" y="6" width="2" height="12" fill="#fff" opacity=".3"/>
  </svg>
);
export const M_star = () => ( // 星辰 → 六角星
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 14,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 10,9" fill="currentColor"/>
  </svg>
);
export const M_meteor = () => ( // 禁咒·陨星 → 流星
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="14" cy="14" r="6" fill="currentColor"/>
    <path d="M10 10L3 3" stroke="currentColor" strokeWidth="3"/>
    <path d="M8 12L2 8" stroke="currentColor" strokeWidth="2" opacity=".5"/>
    <path d="M12 8L8 2" stroke="currentColor" strokeWidth="2" opacity=".5"/>
  </svg>
);
export const M_frostecho = () => ( // 冰封余韵 → 冰晶雪花
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".25"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" opacity=".6"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" opacity=".6"/>
    <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="currentColor" strokeWidth="1" opacity=".4"/>
    <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="currentColor" strokeWidth="1" opacity=".4"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity=".5"/>
  </svg>
);
export const M_elemheart = () => ( // 元素之心 → 辐射心
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="5" fill="currentColor"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
    <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// 预留图案（index.css/PixelDiceRenderer 已有配色资源，classes.ts 待补 DiceDef）
// TODO: 在 classes.ts 补充 mage_weave / mage_permafrost 的 DiceDef 后，取消下面的注释并加入 PATTERN_MAP
// export const M_weave = () => ( // 奥术编织 → 交织网格
//   <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
//     <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2"/>
//     <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="2"/>
//     <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
//     <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
//     <circle cx="12" cy="12" r="3" fill="currentColor" opacity=".6"/>
//   </svg>
// );
// export const M_permafrost = () => ( // 永冻 → 冰晶六芒星（预留，待 classes.ts 补 DiceDef 后启用）
//   <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
//     <polygon points="12,1 15,9 23,9 17,14 19,22 12,18 5,22 7,14 1,9 9,9" fill="none" stroke="currentColor" strokeWidth="1.8"/>
//     <circle cx="12" cy="11" r="4" fill="currentColor" opacity=".6"/>
//     <circle cx="12" cy="11" r="2" fill="currentColor" opacity=".3"/>
//   </svg>
// );
