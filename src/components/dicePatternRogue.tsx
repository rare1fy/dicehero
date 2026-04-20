import React from 'react';

/**
 * dicePatternRogue - 影锋刺客骰子像素图案
 * viewBox 统一 0 0 24 24，渲染尺寸由父容器控制
 *
 * 从 dicePatternData.tsx 拆分而来 (ARCH-13)
 */

const S = 'crispEdges'; // shapeRendering

// ============================================================
// 盗贼骰子图案 (20) — 纯像素色块风格，每颗独立配色
// ============================================================

export const R_envenom = () => ( // 淬毒 → 毒液滴 — 翠绿色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="4" width="4" height="2" fill="#30a050"/>
    <rect x="8" y="6" width="8" height="2" fill="#28883c"/>
    <rect x="6" y="8" width="12" height="2" fill="#208030"/>
    <rect x="6" y="10" width="12" height="2" fill="#30a050"/>
    <rect x="6" y="12" width="12" height="2" fill="#40c060"/>
    <rect x="6" y="14" width="12" height="2" fill="#60e080"/>
    <rect x="8" y="16" width="8" height="2" fill="#40c060"/>
    <rect x="10" y="18" width="4" height="2" fill="#208030"/>
    <rect x="10" y="10" width="4" height="4" fill="#80ffa0"/>
  </svg>
);
export const R_throwing = () => ( // 飞刀 → 十字飞镖 — 冰蓝色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="2" width="4" height="20" fill="#508898"/>
    <rect x="2" y="10" width="20" height="4" fill="#508898"/>
    <rect x="10" y="10" width="4" height="4" fill="#80c0d0"/>
    <rect x="11" y="4" width="2" height="16" fill="#60a0b0"/>
    <rect x="4" y="11" width="16" height="2" fill="#60a0b0"/>
  </svg>
);
export const R_pursuit = () => ( // 追击 → 双箭头 — 亮青色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="8" y="6" width="8" height="2" fill="#606870"/>
    <rect x="6" y="8" width="12" height="2" fill="#586068"/>
    <rect x="4" y="10" width="16" height="4" fill="#505860"/>
    <rect x="4" y="14" width="16" height="2" fill="#484850"/>
    <rect x="6" y="16" width="12" height="2" fill="#404048"/>
    <rect x="8" y="18" width="8" height="2" fill="#383838"/>
    <rect x="8" y="8" width="4" height="4" fill="#707880"/>
  </svg>
);
export const R_sleeve = () => ( // 袖箭 → 斜箭头 — 草绿色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="14" y="4" width="4" height="2" fill="#50a850"/>
    <rect x="16" y="6" width="2" height="4" fill="#50a850"/>
    <rect x="14" y="8" width="2" height="2" fill="#40a040"/>
    <rect x="12" y="10" width="2" height="2" fill="#40a040"/>
    <rect x="10" y="12" width="2" height="2" fill="#389038"/>
    <rect x="8" y="14" width="2" height="2" fill="#308030"/>
    <rect x="6" y="16" width="2" height="2" fill="#287028"/>
    <rect x="4" y="18" width="2" height="2" fill="#206020"/>
  </svg>
);
export const R_quickdraw = () => ( // 接应 → 右三角+点 — 青色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="10" width="4" height="4" fill="#30a0a0"/>
    <rect x="8" y="10" width="8" height="4" fill="#40b8b0"/>
    <rect x="16" y="8" width="2" height="2" fill="#60d8d0"/>
    <rect x="16" y="14" width="2" height="2" fill="#60d8d0"/>
    <rect x="18" y="10" width="2" height="4" fill="#80f0e0"/>
    <rect x="20" y="11" width="2" height="2" fill="#a0fff0"/>
  </svg>
);
export const R_combomastery = () => ( // 连击心得 → 双上箭头 — 金黄色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="2" width="4" height="2" fill="#c0a030"/>
    <rect x="8" y="4" width="2" height="2" fill="#a08828"/><rect x="14" y="4" width="2" height="2" fill="#a08828"/>
    <rect x="6" y="6" width="2" height="2" fill="#887020"/><rect x="16" y="6" width="2" height="2" fill="#887020"/>
    <rect x="10" y="8" width="4" height="2" fill="#d0b040"/>
    <rect x="10" y="12" width="4" height="2" fill="#a09030"/>
    <rect x="8" y="14" width="2" height="2" fill="#908028"/><rect x="14" y="14" width="2" height="2" fill="#908028"/>
    <rect x="6" y="16" width="2" height="2" fill="#807020"/><rect x="16" y="16" width="2" height="2" fill="#807020"/>
    <rect x="10" y="18" width="4" height="2" fill="#706020"/>
  </svg>
);
export const R_toxblade = () => ( // 剧毒匕首 → 绿刃+毒滴 — 翡翠绿
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="14" y="2" width="2" height="2" fill="#50d870"/>
    <rect x="13" y="4" width="2" height="2" fill="#48c868"/>
    <rect x="12" y="6" width="2" height="2" fill="#40b860"/>
    <rect x="11" y="8" width="2" height="2" fill="#38a858"/>
    <rect x="10" y="10" width="2" height="2" fill="#309848"/>
    <rect x="9" y="12" width="2" height="2" fill="#288838"/>
    <rect x="8" y="14" width="2" height="2" fill="#207830"/>
    <rect x="7" y="16" width="2" height="4" fill="#186828"/>
    {/* 毒滴 */}
    <rect x="14" y="16" width="2" height="2" fill="#60ff80"/>
    <rect x="14" y="18" width="2" height="2" fill="#40c060"/>
  </svg>
);
export const R_chain_strike = () => ( // 连锁打击 → 链条
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="6" y="11" width="4" height="2" fill="currentColor"/>
    <rect x="10" y="9" width="2" height="6" fill="currentColor" opacity=".7" rx="1"/>
    <rect x="12" y="11" width="4" height="2" fill="currentColor"/>
    <rect x="4" y="9" width="2" height="6" fill="currentColor" opacity=".7" rx="1"/>
    <rect x="16" y="9" width="2" height="6" fill="currentColor" opacity=".7" rx="1"/>
  </svg>
);
export const R_shadowstrike = () => ( // 剔骨 → 骨刺匕首
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="3" width="4" height="16" rx="1" fill="currentColor" transform="rotate(20,12,11)"/>
    <polygon points="12,3 8,10 16,10" fill="currentColor" opacity=".7"/>
    <line x1="8" y1="17" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="19" r="1.5" fill="currentColor" opacity=".6"/>
  </svg>
);
export const R_shadow_clone = () => ( // 影分身 → 双影 — 深灰绿
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="6" width="6" height="12" fill="#305838"/>
    <rect x="5" y="7" width="4" height="2" fill="#408848"/>
    <rect x="14" y="6" width="6" height="12" fill="#203028"/>
    <rect x="15" y="7" width="4" height="2" fill="#305838"/>
  </svg>
);
export const R_boomerang = () => ( // 回旋 → 弧形 — 棕绿色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="16" width="2" height="2" fill="#487048"/>
    <rect x="4" y="14" width="2" height="2" fill="#508058"/>
    <rect x="4" y="12" width="2" height="2" fill="#589060"/>
    <rect x="6" y="10" width="2" height="2" fill="#60a068"/>
    <rect x="8" y="8" width="2" height="2" fill="#68a870"/>
    <rect x="10" y="6" width="2" height="2" fill="#70b878"/>
    <rect x="12" y="4" width="2" height="2" fill="#78c080"/>
    <rect x="14" y="6" width="2" height="2" fill="#70b878"/>
    <rect x="16" y="8" width="2" height="2" fill="#68a870"/>
    <rect x="18" y="10" width="2" height="2" fill="#60a068"/>
    <rect x="18" y="12" width="2" height="2" fill="#589060"/>
  </svg>
);
export const R_corrosion = () => ( // 蚀骨毒液 → 紫色液滴 — 毒紫色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="6" y="6" width="4" height="4" fill="#7040a8"/>
    <rect x="7" y="7" width="2" height="2" fill="#9060d0"/>
    <rect x="14" y="12" width="4" height="4" fill="#6030a0"/>
    <rect x="15" y="13" width="2" height="2" fill="#8050c0"/>
    <rect x="8" y="14" width="4" height="4" fill="#5028a0"/>
    <rect x="9" y="15" width="2" height="2" fill="#7040c0"/>
  </svg>
);
export const R_venomfang = () => ( // 毒王之牙 → 双毒牙 — 鲜绿色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="6" y="4" width="4" height="2" fill="#60ff80"/>
    <rect x="7" y="6" width="3" height="2" fill="#50e070"/>
    <rect x="7" y="8" width="3" height="2" fill="#40c860"/>
    <rect x="8" y="10" width="2" height="4" fill="#30a050"/>
    <rect x="8" y="14" width="2" height="4" fill="#208838"/>
    <rect x="14" y="4" width="4" height="2" fill="#50e070"/>
    <rect x="14" y="6" width="3" height="2" fill="#40c860"/>
    <rect x="15" y="8" width="2" height="2" fill="#30a850"/>
    <rect x="15" y="10" width="2" height="4" fill="#289040"/>
    <rect x="16" y="14" width="2" height="4" fill="#207830"/>
  </svg>
);
export const R_tripleflash = () => ( // 三连闪 → 三竖条 — 亮绿色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="6" width="4" height="12" fill="#408838"/>
    <rect x="5" y="7" width="2" height="10" fill="#60c050"/>
    <rect x="10" y="4" width="4" height="16" fill="#50b040"/>
    <rect x="11" y="5" width="2" height="14" fill="#80e070"/>
    <rect x="16" y="6" width="4" height="12" fill="#408838"/>
    <rect x="17" y="7" width="2" height="10" fill="#60c050"/>
  </svg>
);
export const R_shadowdance = () => ( // 影舞 → S型 — 深绿渐变
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="6" y="2" width="4" height="2" fill="#60d888"/>
    <rect x="10" y="4" width="4" height="2" fill="#50c878"/>
    <rect x="14" y="6" width="4" height="2" fill="#40b868"/>
    <rect x="14" y="8" width="4" height="2" fill="#38a858"/>
    <rect x="10" y="10" width="4" height="2" fill="#309848"/>
    <rect x="6" y="12" width="4" height="2" fill="#288838"/>
    <rect x="6" y="14" width="4" height="2" fill="#207830"/>
    <rect x="10" y="16" width="4" height="2" fill="#186828"/>
    <rect x="14" y="18" width="4" height="2" fill="#106020"/>
  </svg>
);
export const R_plaguedet = () => ( // 瘟疫引爆 → 爆炸 — 紫红色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="8" y="8" width="8" height="8" fill="#8040a0"/>
    <rect x="10" y="10" width="4" height="4" fill="#c060e0"/>
    <rect x="10" y="2" width="4" height="6" fill="#7038a0"/>
    <rect x="10" y="16" width="4" height="6" fill="#7038a0"/>
    <rect x="2" y="10" width="6" height="4" fill="#7038a0"/>
    <rect x="16" y="10" width="6" height="4" fill="#7038a0"/>
  </svg>
);
export const R_phantom = () => ( // 幻影 → 问号 — 白幽灵色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="8" y="4" width="8" height="2" fill="#b0c8c0"/>
    <rect x="14" y="6" width="4" height="2" fill="#a0b8b0"/>
    <rect x="14" y="8" width="4" height="2" fill="#90a8a0"/>
    <rect x="10" y="10" width="6" height="2" fill="#80a090"/>
    <rect x="10" y="12" width="2" height="2" fill="#709888"/>
    <rect x="10" y="16" width="4" height="4" fill="#c0d8d0"/>
  </svg>
);
export const R_purifyblade = () => ( // 净化之刃 → 阴阳 — 黑白对比
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="4" width="8" height="16" fill="#d0e0d8"/>
    <rect x="12" y="4" width="8" height="16" fill="#283830"/>
    <rect x="8" y="8" width="4" height="4" fill="#283830"/>
    <rect x="12" y="12" width="4" height="4" fill="#d0e0d8"/>
  </svg>
);
export const R_deathtouch = () => ( // 死神之触 → 镰刀 — 暗黑红
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="4" width="2" height="14" fill="#504840"/>
    <rect x="12" y="4" width="6" height="2" fill="#808080"/>
    <rect x="16" y="6" width="4" height="2" fill="#909898"/>
    <rect x="18" y="8" width="2" height="2" fill="#a0a8a8"/>
    <rect x="16" y="10" width="2" height="2" fill="#808888"/>
    <rect x="14" y="12" width="2" height="2" fill="#607068"/>
    <rect x="8" y="16" width="6" height="2" fill="#403830"/>
    <rect x="6" y="18" width="4" height="2" fill="#603020"/>
  </svg>
);
export const R_bladestorm = () => ( // 影刃风暴 → 四刃旋风 — 翠绿辐射
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="2" width="4" height="6" fill="#40c060"/>
    <rect x="16" y="10" width="6" height="4" fill="#38b058"/>
    <rect x="10" y="16" width="4" height="6" fill="#309848"/>
    <rect x="2" y="10" width="6" height="4" fill="#288838"/>
    <rect x="10" y="10" width="4" height="4" fill="#80ffa0"/>
    <rect x="11" y="3" width="2" height="4" fill="#60e080"/>
    <rect x="17" y="11" width="4" height="2" fill="#50d070"/>
    <rect x="11" y="17" width="2" height="4" fill="#40b858"/>
    <rect x="3" y="11" width="4" height="2" fill="#30a048"/>
  </svg>
);
