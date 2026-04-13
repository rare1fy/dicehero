import React from 'react';

/**
 * DiceFacePattern - 每颗职业骰子的独特像素图案
 * 作为半透明底层铺在骰子上，提供形状辨识度
 * viewBox 统一 0 0 24 24，渲染尺寸由父容器控制
 */

const S = 'crispEdges'; // shapeRendering

// ============================================================
// 战士骰子图案 (22)
// ============================================================

const W_bloodthirst = () => ( // 嗜血 → 大血滴
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 3 L15 11 Q16 16 12 18 Q8 16 9 11 Z" fill="currentColor"/>
  </svg>
);
const W_thorns = () => ( // 荆棘 → 带刺三角
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 4L18 18H6Z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="12" x2="5" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="12" x2="19" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const W_warcry = () => ( // 战吼 → 声波圆环
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="4" fill="currentColor"/>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5"/>
  </svg>
);
const W_ironwall = () => ( // 铁壁 → 盾牌
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M5 5H19V14L12 20L5 14Z" fill="currentColor"/>
    <path d="M8 8H16V13L12 17L8 13Z" fill="currentColor" opacity=".4"/>
  </svg>
);
const W_fury = () => ( // 怒火 → 火焰
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 3C14 7 18 10 18 15C18 19 15 21 12 21C9 21 6 19 6 15C6 10 10 7 12 3Z" fill="currentColor"/>
    <path d="M12 10C13 12 15 14 15 16C15 18 12 19 12 19C12 19 9 18 9 16C9 14 11 12 12 10Z" fill="currentColor" opacity=".4"/>
  </svg>
);
const W_charge = () => ( // 冲锋 → 右箭头
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="3" y="10" width="12" height="4" fill="currentColor"/>
    <polygon points="15,6 22,12 15,18" fill="currentColor"/>
  </svg>
);
const W_armorbreak = () => ( // 破甲 → 碎裂盾牌
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M5 5H19V14L12 20L5 14Z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="7" x2="16" y2="17" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="7" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const W_revenge = () => ( // 复仇 → 回旋箭
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M6 12A6 6 0 0118 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <polygon points="18,8 22,12 18,16" fill="currentColor"/>
  </svg>
);
const W_roar = () => ( // 咆哮 → 双波浪线
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M3 9Q8 5 12 9T21 9" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M3 15Q8 11 12 15T21 15" fill="none" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
);
const W_lifefurnace = () => ( // 生命熔炉 → 心脏
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 20L4 13C1 10 1 5 5 4C8 3 10 5 12 7C14 5 16 3 19 4C23 5 23 10 20 13Z" fill="currentColor"/>
  </svg>
);
const W_bloodpact = () => ( // 鲜血契约 → 五角星
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill="currentColor"/>
  </svg>
);
const W_execute = () => ( // 处刑 → 双刃斧
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="4" width="2" height="16" fill="currentColor"/>
    <path d="M4 6H11V14H4Z" fill="currentColor" opacity=".8"/>
    <path d="M13 6H20V14H13Z" fill="currentColor" opacity=".8"/>
  </svg>
);
const W_quake = () => ( // 震地 → 锯齿波
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polyline points="2,16 6,8 10,16 14,6 18,16 22,8" fill="none" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
);
const W_leech = () => ( // 吸血 → 同心圆靶心
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".3"/>
    <circle cx="12" cy="12" r="6" fill="currentColor" opacity=".5"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);
const W_titanfist = () => ( // 泰坦之拳 → 拳头
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="6" y="10" width="12" height="10" rx="2" fill="currentColor"/>
    <rect x="8" y="5" width="3" height="7" fill="currentColor"/>
    <rect x="12" y="4" width="3" height="8" fill="currentColor"/>
    <rect x="16" y="6" width="2" height="6" fill="currentColor"/>
  </svg>
);
const W_unyielding = () => ( // 不屈意志 → 山峰
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,3 22,20 2,20" fill="currentColor"/>
    <polygon points="12,9 17,20 7,20" fill="currentColor" opacity=".4"/>
  </svg>
);
const W_warhammer = () => ( // 战神之锤 → 锤子
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="10" width="2" height="12" fill="currentColor"/>
    <rect x="5" y="3" width="14" height="8" rx="1" fill="currentColor"/>
  </svg>
);
const W_bloodblade = () => ( // 浴血之刃 → 剑
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="2" width="2" height="14" fill="currentColor"/>
    <rect x="7" y="16" width="10" height="2" fill="currentColor"/>
    <rect x="10" y="18" width="4" height="3" fill="currentColor"/>
  </svg>
);
const W_giantshield = () => ( // 巨人护盾 → 大盾
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M4 3H20V15L12 22L4 15Z" fill="currentColor"/>
    <rect x="11" y="7" width="2" height="10" fill="currentColor" opacity=".4"/>
    <rect x="8" y="11" width="8" height="2" fill="currentColor" opacity=".4"/>
  </svg>
);
const W_berserk = () => ( // 狂暴之心 → 碎裂心
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 20L4 13C1 10 1 5 5 4C8 3 10 5 12 7C14 5 16 3 19 4C23 5 23 10 20 13Z" fill="currentColor"/>
    <line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" strokeWidth="2" opacity=".4"/>
  </svg>
);
const W_bloodgod = () => ( // 血神之眼 → 竖眼
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <ellipse cx="12" cy="12" rx="10" ry="6" fill="currentColor" opacity=".6"/>
    <ellipse cx="12" cy="12" rx="3" ry="8" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" opacity=".4"/>
  </svg>
);
const W_overlord = () => ( // 霸体铠甲 → 胸甲
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M4 4H20V8L18 20H6L4 8Z" fill="currentColor"/>
    <rect x="9" y="10" width="6" height="3" fill="currentColor" opacity=".4"/>
  </svg>
);

// ============================================================
// 法师骰子图案 (22)
// ============================================================

const M_elemental = () => ( // 元素 → 四元素方块
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="3" y="3" width="8" height="8" fill="currentColor"/>
    <rect x="13" y="3" width="8" height="8" fill="currentColor" opacity=".6"/>
    <rect x="3" y="13" width="8" height="8" fill="currentColor" opacity=".6"/>
    <rect x="13" y="13" width="8" height="8" fill="currentColor" opacity=".3"/>
  </svg>
);
const M_reverse = () => ( // 反转 → 旋转箭头
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 4A8 8 0 0120 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M12 20A8 8 0 014 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <polygon points="20,8 22,13 17,12" fill="currentColor"/>
    <polygon points="4,16 2,11 7,12" fill="currentColor"/>
  </svg>
);
const M_missile = () => ( // 奥术飞弹 → 三星
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="7" cy="8" r="3.5" fill="currentColor"/>
    <circle cx="17" cy="7" r="2.5" fill="currentColor" opacity=".7"/>
    <circle cx="12" cy="17" r="4" fill="currentColor" opacity=".5"/>
  </svg>
);
const M_barrier = () => ( // 魔力屏障 → 六边形
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <polygon points="12,7 17,10 17,15 12,18 7,15 7,10" fill="currentColor" opacity=".3"/>
  </svg>
);
const M_meditate = () => ( // 冥想 → 莲花
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <ellipse cx="12" cy="14" rx="3" ry="5" fill="currentColor"/>
    <ellipse cx="7" cy="13" rx="3" ry="4" fill="currentColor" opacity=".5" transform="rotate(-20,7,13)"/>
    <ellipse cx="17" cy="13" rx="3" ry="4" fill="currentColor" opacity=".5" transform="rotate(20,17,13)"/>
    <circle cx="12" cy="7" r="2" fill="currentColor" opacity=".4"/>
  </svg>
);
const M_amplify = () => ( // 奥术增幅 → 上箭头+闪光
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 18,12 14,12 14,22 10,22 10,12 6,12" fill="currentColor"/>
  </svg>
);
const M_mirror = () => ( // 镜像 → 对称分割
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="3" width="2" height="18" fill="currentColor"/>
    <rect x="4" y="8" width="6" height="8" rx="1" fill="currentColor" opacity=".5"/>
    <rect x="14" y="8" width="6" height="8" rx="1" fill="currentColor" opacity=".5"/>
  </svg>
);
const M_crystal = () => ( // 水晶 → 菱形
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/>
    <polygon points="12,6 18,12 12,18 6,12" fill="currentColor" opacity=".4"/>
  </svg>
);
const M_temporal = () => ( // 时光 → 沙漏
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="5,3 19,3 12,12 19,21 5,21 12,12" fill="currentColor"/>
  </svg>
);
const M_prism = () => ( // 棱镜 → 三棱镜
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,3 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="12" y1="3" x2="18" y2="20" stroke="currentColor" strokeWidth="1" opacity=".5"/>
    <line x1="12" y1="3" x2="6" y2="20" stroke="currentColor" strokeWidth="1" opacity=".5"/>
  </svg>
);
const M_resonance = () => ( // 共鸣 → 同心涟漪
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5"/>
  </svg>
);
const M_devour = () => ( // 吞噬 → 黑洞
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".3"/>
    <circle cx="12" cy="12" r="6" fill="currentColor" opacity=".5"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);
const M_purify = () => ( // 净化之光 → 十字光
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="2" width="4" height="20" fill="currentColor"/>
    <rect x="2" y="10" width="20" height="4" fill="currentColor"/>
    <rect x="10" y="10" width="4" height="4" fill="currentColor" opacity=".4"/>
  </svg>
);
const M_surge = () => ( // 法力涌动 → 向上尖刺
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 16,22 12,16 8,22" fill="currentColor"/>
  </svg>
);
const M_elemstorm = () => ( // 元素风暴 → 螺旋
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <path d="M12 4A8 8 0 0120 12A6 6 0 0114 18A4 4 0 018 14A2 2 0 0110 12" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);
const M_voideye = () => ( // 虚空之眼 → 大竖眼
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <ellipse cx="12" cy="12" rx="10" ry="6" fill="currentColor" opacity=".5"/>
    <ellipse cx="12" cy="12" rx="3" ry="9" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" opacity=".3"/>
  </svg>
);
const M_weave = () => ( // 命运编织 → 交叉线
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" opacity=".5"/>
  </svg>
);
const M_permafrost = () => ( // 永冻核心 → 雪花十字
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="11" y="2" width="2" height="20" fill="currentColor"/>
    <rect x="2" y="11" width="20" height="2" fill="currentColor"/>
    <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
    <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
  </svg>
);
const M_star = () => ( // 星辰 → 六角星
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 14,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 10,9" fill="currentColor"/>
  </svg>
);
const M_shield = () => ( // 法术护盾 → 带光盾
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="currentColor"/>
    <polygon points="12,6 17,9 17,15 12,18 7,15 7,9" fill="currentColor" opacity=".4"/>
  </svg>
);
const M_meteor = () => ( // 禁咒·陨星 → 流星
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="14" cy="14" r="6" fill="currentColor"/>
    <path d="M10 10L3 3" stroke="currentColor" strokeWidth="3"/>
    <path d="M8 12L2 8" stroke="currentColor" strokeWidth="2" opacity=".5"/>
    <path d="M12 8L8 2" stroke="currentColor" strokeWidth="2" opacity=".5"/>
  </svg>
);
const M_elemheart = () => ( // 元素之心 → 辐射心
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <circle cx="12" cy="12" r="5" fill="currentColor"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
    <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// ============================================================
// 盗贼骰子图案 (24) — 纯像素色块风格，每颗独立配色
// ============================================================

const R_dagger = () => ( // 匕首 → 交叉双刃 — 银白色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="16" width="2" height="2" fill="#607068"/>
    <rect x="6" y="14" width="2" height="2" fill="#809888"/>
    <rect x="8" y="12" width="2" height="2" fill="#a0c0b0"/>
    <rect x="10" y="10" width="2" height="2" fill="#c0e0d0"/>
    <rect x="12" y="8" width="2" height="2" fill="#d0f0e0"/>
    <rect x="14" y="6" width="2" height="2" fill="#e0fff0"/>
    <rect x="16" y="4" width="2" height="2" fill="#f0fff8"/>
    {/* 第二把刃（较暗） */}
    <rect x="16" y="16" width="2" height="2" fill="#506058"/>
    <rect x="14" y="14" width="2" height="2" fill="#607868"/>
    <rect x="12" y="12" width="2" height="2" fill="#80a890"/>
    <rect x="10" y="10" width="2" height="2" fill="#a0c8b0"/>
    <rect x="8" y="8" width="2" height="2" fill="#90b8a0"/>
    <rect x="6" y="6" width="2" height="2" fill="#80a890"/>
  </svg>
);
const R_envenom = () => ( // 淬毒 → 毒液滴 — 翠绿色
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
const R_throwing = () => ( // 飞刀 → 十字飞镖 — 冰蓝色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="2" width="4" height="20" fill="#508898"/>
    <rect x="2" y="10" width="20" height="4" fill="#508898"/>
    <rect x="10" y="10" width="4" height="4" fill="#80c0d0"/>
    <rect x="11" y="4" width="2" height="16" fill="#60a0b0"/>
    <rect x="4" y="11" width="16" height="2" fill="#60a0b0"/>
  </svg>
);
const R_pursuit = () => ( // 追击 → 双箭头 — 亮青色
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
const R_poison_vial = () => ( // 毒瓶 → 药瓶 — 紫毒色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="2" width="4" height="4" fill="#706088"/>
    <rect x="8" y="6" width="8" height="2" fill="#503870"/>
    <rect x="6" y="8" width="12" height="10" fill="#402860"/>
    <rect x="8" y="10" width="8" height="6" fill="#6040a0"/>
    <rect x="10" y="12" width="4" height="2" fill="#a070ff"/>
    <rect x="8" y="18" width="8" height="2" fill="#382050"/>
  </svg>
);
const R_sleeve = () => ( // 袖箭 → 斜箭头 — 草绿色
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
const R_quickdraw = () => ( // 接应 → 右三角+点 — 青色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="10" width="4" height="4" fill="#30a0a0"/>
    <rect x="8" y="10" width="8" height="4" fill="#40b8b0"/>
    <rect x="16" y="8" width="2" height="2" fill="#60d8d0"/>
    <rect x="16" y="14" width="2" height="2" fill="#60d8d0"/>
    <rect x="18" y="10" width="2" height="4" fill="#80f0e0"/>
    <rect x="20" y="11" width="2" height="2" fill="#a0fff0"/>
  </svg>
);
const R_combomastery = () => ( // 连击心得 → 双上箭头 — 金黄色
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
const R_lethal = () => ( // 致命 → 骷髅 — 骨白色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="8" y="4" width="8" height="2" fill="#c8c0b0"/>
    <rect x="6" y="6" width="12" height="8" fill="#d8d0c0"/>
    <rect x="8" y="7" width="3" height="3" fill="#484040"/>{/* 左眼 */}
    <rect x="13" y="7" width="3" height="3" fill="#484040"/>{/* 右眼 */}
    <rect x="10" y="14" width="4" height="6" fill="#c0b8a8"/>
    <rect x="11" y="16" width="2" height="2" fill="#a09888"/>
  </svg>
);
const R_toxblade = () => ( // 剧毒匕首 → 绿刃+毒滴 — 翡翠绿
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
const R_shadow_clone = () => ( // 影分身 → 双影 — 深灰绿
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="6" width="6" height="12" fill="#305838"/>
    <rect x="5" y="7" width="4" height="2" fill="#408848"/>
    <rect x="14" y="6" width="6" height="12" fill="#203028"/>
    <rect x="15" y="7" width="4" height="2" fill="#305838"/>
  </svg>
);
const R_miasma = () => ( // 毒雾 → 烟雾 — 黄绿色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="10" width="6" height="4" fill="#506028"/>
    <rect x="6" y="8" width="4" height="2" fill="#607030"/>
    <rect x="12" y="8" width="6" height="4" fill="#486020"/>
    <rect x="14" y="6" width="4" height="2" fill="#587028"/>
    <rect x="8" y="14" width="8" height="4" fill="#405018"/>
    <rect x="10" y="12" width="4" height="2" fill="#708838"/>
  </svg>
);
const R_boomerang = () => ( // 回旋 → 弧形 — 棕绿色
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
const R_corrosion = () => ( // 蚀骨毒液 → 紫色液滴 — 毒紫色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="6" y="6" width="4" height="4" fill="#7040a8"/>
    <rect x="7" y="7" width="2" height="2" fill="#9060d0"/>
    <rect x="14" y="12" width="4" height="4" fill="#6030a0"/>
    <rect x="15" y="13" width="2" height="2" fill="#8050c0"/>
    <rect x="8" y="14" width="4" height="4" fill="#5028a0"/>
    <rect x="9" y="15" width="2" height="2" fill="#7040c0"/>
  </svg>
);
const R_shadow = () => ( // 暗影 → 暗色方块 — 纯黑灰
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="4" width="16" height="16" fill="#181818"/>
    <rect x="6" y="6" width="12" height="12" fill="#282828"/>
    <rect x="8" y="8" width="8" height="8" fill="#383838"/>
    <rect x="10" y="10" width="4" height="4" fill="#484848"/>
  </svg>
);
const R_steal = () => ( // 偷窃 → 钱袋 — 金色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="10" y="4" width="4" height="2" fill="#a08828"/>
    <rect x="8" y="6" width="2" height="2" fill="#c0a030"/><rect x="14" y="6" width="2" height="2" fill="#c0a030"/>
    <rect x="6" y="8" width="12" height="8" fill="#b09828"/>
    <rect x="8" y="10" width="8" height="4" fill="#d0b840"/>
    <rect x="10" y="11" width="4" height="2" fill="#f0d860"/>
    <rect x="8" y="16" width="8" height="2" fill="#907818"/>
  </svg>
);
const R_venomfang = () => ( // 毒王之牙 → 双毒牙 — 鲜绿色
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
const R_tripleflash = () => ( // 三连闪 → 三竖条 — 亮绿色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="6" width="4" height="12" fill="#408838"/>
    <rect x="5" y="7" width="2" height="10" fill="#60c050"/>
    <rect x="10" y="4" width="4" height="16" fill="#50b040"/>
    <rect x="11" y="5" width="2" height="14" fill="#80e070"/>
    <rect x="16" y="6" width="4" height="12" fill="#408838"/>
    <rect x="17" y="7" width="2" height="10" fill="#60c050"/>
  </svg>
);
const R_shadowdance = () => ( // 影舞 → S型 — 深绿渐变
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
const R_plaguedet = () => ( // 瘟疫引爆 → 爆炸 — 紫红色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="8" y="8" width="8" height="8" fill="#8040a0"/>
    <rect x="10" y="10" width="4" height="4" fill="#c060e0"/>
    <rect x="10" y="2" width="4" height="6" fill="#7038a0"/>
    <rect x="10" y="16" width="4" height="6" fill="#7038a0"/>
    <rect x="2" y="10" width="6" height="4" fill="#7038a0"/>
    <rect x="16" y="10" width="6" height="4" fill="#7038a0"/>
  </svg>
);
const R_phantom = () => ( // 幻影 → 问号 — 白幽灵色
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="8" y="4" width="8" height="2" fill="#b0c8c0"/>
    <rect x="14" y="6" width="4" height="2" fill="#a0b8b0"/>
    <rect x="14" y="8" width="4" height="2" fill="#90a8a0"/>
    <rect x="10" y="10" width="6" height="2" fill="#80a090"/>
    <rect x="10" y="12" width="2" height="2" fill="#709888"/>
    <rect x="10" y="16" width="4" height="4" fill="#c0d8d0"/>
  </svg>
);
const R_purifyblade = () => ( // 净化之刃 → 阴阳 — 黑白对比
  <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
    <rect x="4" y="4" width="8" height="16" fill="#d0e0d8"/>
    <rect x="12" y="4" width="8" height="16" fill="#283830"/>
    <rect x="8" y="8" width="4" height="4" fill="#283830"/>
    <rect x="12" y="12" width="4" height="4" fill="#d0e0d8"/>
  </svg>
);
const R_deathtouch = () => ( // 死神之触 → 镰刀 — 暗黑红
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
const R_bladestorm = () => ( // 影刃风暴 → 四刃旋风 — 翠绿辐射
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

// ============================================================
// 主映射
// ============================================================

const PATTERN_MAP: Record<string, React.FC> = {
  // 战士
  w_bloodthirst: W_bloodthirst, w_thorns: W_thorns, w_warcry: W_warcry,
  w_ironwall: W_ironwall, w_fury: W_fury, w_charge: W_charge,
  w_armorbreak: W_armorbreak, w_revenge: W_revenge, w_roar: W_roar,
  w_lifefurnace: W_lifefurnace, w_bloodpact: W_bloodpact, w_execute: W_execute,
  w_quake: W_quake, w_leech: W_leech, w_titanfist: W_titanfist,
  w_unyielding: W_unyielding, w_warhammer: W_warhammer, w_bloodblade: W_bloodblade,
  w_giantshield: W_giantshield, w_berserk: W_berserk, w_bloodgod: W_bloodgod,
  w_overlord: W_overlord,
  // 法师
  mage_elemental: M_elemental, mage_reverse: M_reverse, mage_missile: M_missile,
  mage_barrier: M_barrier, mage_meditate: M_meditate, mage_amplify: M_amplify,
  mage_mirror: M_mirror, mage_crystal: M_crystal, mage_temporal: M_temporal,
  mage_prism: M_prism, mage_resonance: M_resonance, mage_devour: M_devour,
  mage_purify: M_purify, mage_surge: M_surge, mage_elemstorm: M_elemstorm,
  mage_voideye: M_voideye, mage_weave: M_weave, mage_permafrost: M_permafrost,
  mage_star: M_star, mage_shield: M_shield, mage_meteor: M_meteor,
  mage_elemheart: M_elemheart,
  // 盗贼
  r_dagger: R_dagger, r_envenom: R_envenom, r_throwing: R_throwing,
  r_pursuit: R_pursuit, r_poison_vial: R_poison_vial, r_sleeve: R_sleeve,
  r_quickdraw: R_quickdraw, r_combomastery: R_combomastery,
  r_lethal: R_lethal, r_toxblade: R_toxblade, r_shadow_clone: R_shadow_clone,
  r_miasma: R_miasma, r_boomerang: R_boomerang, r_corrosion: R_corrosion,
  r_shadow: R_shadow, r_steal: R_steal, r_venomfang: R_venomfang,
  r_tripleflash: R_tripleflash, r_shadowdance: R_shadowdance,
  r_plaguedet: R_plaguedet, r_phantom: R_phantom, r_purifyblade: R_purifyblade,
  r_deathtouch: R_deathtouch, r_bladestorm: R_bladestorm,
  // 临时骰子
  temp_rogue: () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" shapeRendering={S}>
      <rect x="6" y="6" width="12" height="12" fill="#205030" opacity=".5"/>
      <rect x="8" y="8" width="8" height="8" fill="#308040" opacity=".4"/>
      <rect x="10" y="10" width="4" height="4" fill="#50c060" opacity=".3"/>
      <rect x="6" y="6" width="2" height="2" fill="#40a050"/><rect x="16" y="6" width="2" height="2" fill="#40a050"/>
      <rect x="6" y="16" width="2" height="2" fill="#40a050"/><rect x="16" y="16" width="2" height="2" fill="#40a050"/>
    </svg>
  ),
};

/**
 * 骰子底层图案组件
 * 半透明显示在骰子内部底层，数字叠在最上方
 */
export const DiceFacePattern: React.FC<{ diceDefId: string }> = React.memo(({ diceDefId }) => {
  const Pattern = PATTERN_MAP[diceDefId];
  if (!Pattern) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ opacity: 0.30, padding: '4px' }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <Pattern />
      </div>
    </div>
  );
});

DiceFacePattern.displayName = 'DiceFacePattern';
