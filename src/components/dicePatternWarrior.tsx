import React from 'react';

/**
 * dicePatternWarrior - 嗜血狂战骰子像素图案
 * viewBox 统一 0 0 24 24，渲染尺寸由父容器控制
 *
 * 从 dicePatternData.tsx 拆分而来 (ARCH-13)
 */

const S = 'crispEdges'; // shapeRendering

// ============================================================
// 战士骰子图案 (18) + 新增(2) = 20
// ============================================================

export const W_bloodthirst = () => ( // 嗜血 → 大血滴
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 3 L15 11 Q16 16 12 18 Q8 16 9 11 Z" fill="currentColor"/>
  </svg>
);
export const W_warcry = () => ( // 战吼 → 声波圆环
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="4" fill="currentColor"/>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5"/>
  </svg>
);
export const W_ironwall = () => ( // 铁壁 → 盾牌
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M5 5H19V14L12 20L5 14Z" fill="currentColor"/>
    <path d="M8 8H16V13L12 17L8 13Z" fill="currentColor" opacity=".4"/>
  </svg>
);
export const W_fury = () => ( // 怒火 → 火焰
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 3C14 7 18 10 18 15C18 19 15 21 12 21C9 21 6 19 6 15C6 10 10 7 12 3Z" fill="currentColor"/>
    <path d="M12 10C13 12 15 14 15 16C15 18 12 19 12 19C12 19 9 18 9 16C9 14 11 12 12 10Z" fill="currentColor" opacity=".4"/>
  </svg>
);
export const W_armorbreak = () => ( // 破甲 → 碎裂盾牌
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M5 5H19V14L12 20L5 14Z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="7" x2="16" y2="17" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="7" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
export const W_revenge = () => ( // 复仇 → 回旋箭
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M6 12A6 6 0 0118 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <polygon points="18,8 22,12 18,16" fill="currentColor"/>
  </svg>
);
export const W_roar = () => ( // 咆哮 → 双波浪线
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M3 9Q8 5 12 9T21 9" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M3 15Q8 11 12 15T21 15" fill="none" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
);
export const W_lifefurnace = () => ( // 生命熔炉 → 心脏
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 20L4 13C1 10 1 5 5 4C8 3 10 5 12 7C14 5 16 3 19 4C23 5 23 10 20 13Z" fill="currentColor"/>
  </svg>
);
export const W_execute = () => ( // 处刑 → 双刃斧
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="4" width="2" height="16" fill="currentColor"/>
    <path d="M4 6H11V14H4Z" fill="currentColor" opacity=".8"/>
    <path d="M13 6H20V14H13Z" fill="currentColor" opacity=".8"/>
  </svg>
);
export const W_leech = () => ( // 吸血 → 同心圆靶心
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".3"/>
    <circle cx="12" cy="12" r="6" fill="currentColor" opacity=".5"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);
export const W_titanfist = () => ( // 泰坦之拳 → 拳头
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="6" y="10" width="12" height="10" rx="2" fill="currentColor"/>
    <rect x="8" y="5" width="3" height="7" fill="currentColor"/>
    <rect x="12" y="4" width="3" height="8" fill="currentColor"/>
    <rect x="16" y="6" width="2" height="6" fill="currentColor"/>
  </svg>
);
export const W_unyielding = () => ( // 不屈意志 → 山峰
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,3 22,20 2,20" fill="currentColor"/>
    <polygon points="12,9 17,20 7,20" fill="currentColor" opacity=".4"/>
  </svg>
);
export const W_warhammer = () => ( // 战神之锤 → 锤子
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="10" width="2" height="12" fill="currentColor"/>
    <rect x="5" y="3" width="14" height="8" rx="1" fill="currentColor"/>
  </svg>
);
export const W_bloodblade = () => ( // 浴血之刃 → 剑
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="2" width="2" height="14" fill="currentColor"/>
    <rect x="7" y="16" width="10" height="2" fill="currentColor"/>
    <rect x="10" y="18" width="4" height="3" fill="currentColor"/>
  </svg>
);
export const W_giantshield = () => ( // 巨人护盾 → 大盾
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M4 3H20V15L12 22L4 15Z" fill="currentColor"/>
    <rect x="11" y="7" width="2" height="10" fill="currentColor" opacity=".4"/>
    <rect x="8" y="11" width="8" height="2" fill="currentColor" opacity=".4"/>
  </svg>
);
export const W_berserk = () => ( // 狂暴之心 → 碎裂心
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 20L4 13C1 10 1 5 5 4C8 3 10 5 12 7C14 5 16 3 19 4C23 5 23 10 20 13Z" fill="currentColor"/>
    <line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" strokeWidth="2" opacity=".4"/>
  </svg>
);
export const W_bloodgod = () => ( // 血神之眼 → 竖眼
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <ellipse cx="12" cy="12" rx="10" ry="6" fill="currentColor" opacity=".6"/>
    <ellipse cx="12" cy="12" rx="3" ry="8" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" opacity=".4"/>
  </svg>
);
export const W_overlord = () => ( // 霸体铠甲 → 胸甲
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M4 4H20V8L18 20H6L4 8Z" fill="currentColor"/>
    <rect x="9" y="10" width="6" height="3" fill="currentColor" opacity=".4"/>
  </svg>
);

// ============================================================
// 战士新增图案 (2)
// ============================================================

export const W_whirlwind = () => ( // 旋风斩 → 旋风
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 4 C16 4 20 7 19 12 C18 15 15 16 12 16 C9 16 7 14 8 11 C9 9 11 9 13 10 C14 11 13 13 12 13" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 20 C8 20 4 17 5 12 C6 9 9 8 12 8 C15 8 17 10 16 13" stroke="currentColor" strokeWidth="2" fill="none" opacity=".5"/>
  </svg>
);
export const W_splinter = () => ( // 破甲劈斩 → 斧刃+破盾
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    {/* 盾牌轮廓（被劈碎） */}
    <rect x="4" y="4" width="7" height="10" fill="currentColor" opacity=".5" rx="1"/>
    <rect x="4" y="14" width="7" height="4" fill="currentColor" opacity=".3" rx="1"/>
    {/* 裂缝 */}
    <rect x="8" y="4" width="2" height="14" fill="currentColor" opacity=".0"/>
    <rect x="7" y="8" width="4" height="2" fill="currentColor" opacity=".9"/>
    {/* 斧刃 */}
    <rect x="13" y="2" width="2" height="20" fill="currentColor"/>
    <rect x="15" y="5" width="5" height="4" fill="currentColor" opacity=".8"/>
    <rect x="15" y="14" width="5" height="4" fill="currentColor" opacity=".8"/>
    <rect x="17" y="9" width="3" height="5" fill="currentColor" opacity=".5"/>
  </svg>
);
