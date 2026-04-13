/**
 * ClassHands.tsx — 职业专属第一人称双手像素SVG
 * 战士：铁甲手套+骨骷髅骰子+战斧
 * 法师：紫色法袍袖+星界骰子+法杖
 * 盗贼：皮革手套+淬毒骰子+匕首
 */
import React from 'react';

// ============================================================
// 战士左手 — 铁甲手套 + 骷髅骰子
// ============================================================
const WarriorLeftHand: React.FC = () => (
  <svg width="150" height="210" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))' }}>
    {/* 血色骰子 — 暗红能量核心 */}
    <rect x="12" y="6" width="26" height="26" fill="rgba(0,0,0,0.3)" />
    <rect x="12" y="4" width="2" height="2" fill="#4a1818" />
    <rect x="34" y="4" width="2" height="2" fill="#4a1818" />
    <rect x="12" y="26" width="2" height="2" fill="#4a1818" />
    <rect x="34" y="26" width="2" height="2" fill="#4a1818" />
    <rect x="14" y="2" width="20" height="2" fill="#4a1818" />
    <rect x="14" y="28" width="20" height="2" fill="#4a1818" />
    <rect x="10" y="6" width="2" height="20" fill="#4a1818" />
    <rect x="36" y="6" width="2" height="20" fill="#4a1818" />
    {/* 骰子主体 — 深红渐变 */}
    <rect x="12" y="6" width="24" height="20" fill="#601818" />
    <rect x="14" y="4" width="20" height="2" fill="#702020" />
    <rect x="14" y="26" width="20" height="2" fill="#501010" />
    <rect x="14" y="8" width="20" height="16" fill="#802828" />
    {/* 能量核心 — 3层 */}
    <rect x="18" y="10" width="12" height="12" fill="#a03030" />
    <rect x="20" y="12" width="8" height="8" fill="#c04040" />
    <rect x="22" y="14" width="4" height="4" fill="#ff6060" />
    {/* 核心高光 */}
    <rect x="24" y="16" width="2" height="2" fill="#ffa0a0" />
    {/* 顶部高光 */}
    <rect x="14" y="6" width="8" height="2" fill="#903030" />
    {/* 底部暗边 */}
    <rect x="14" y="24" width="20" height="2" fill="#400c0c" />
    <rect x="34" y="10" width="2" height="16" fill="#400c0c" />
    {/* 血色纹路 */}
    <rect x="16" y="15" width="2" height="2" fill="#c05050" opacity="0.5" />
    <rect x="30" y="15" width="2" height="2" fill="#c05050" opacity="0.5" />
    {/* 铁甲手 */}
    <rect x="8" y="28" width="30" height="14" fill="#6a6a70" />
    <rect x="8" y="28" width="30" height="2" fill="#7a7a82" />
    <rect x="8" y="40" width="30" height="2" fill="#4a4a52" />
    <rect x="10" y="30" width="5" height="8" fill="#727278" />
    <rect x="17" y="30" width="5" height="8" fill="#727278" />
    <rect x="24" y="30" width="5" height="8" fill="#727278" />
    <rect x="31" y="30" width="5" height="8" fill="#6a6a72" />
    <rect x="4" y="26" width="6" height="12" fill="#626268" />
    <rect x="4" y="26" width="6" height="2" fill="#6e6e76" />
    {/* 铁甲臂 */}
    <rect x="10" y="42" width="28" height="54" fill="#5a5a62" />
    <rect x="10" y="42" width="28" height="2" fill="#6a6a72" />
    {[46,50,54,58,62,66,70,74,78,82,86].map(y => (
      <rect key={y} x="10" y={y} width="28" height="2" fill={y % 8 === 2 ? '#6a6a72' : '#4a4a52'} />
    ))}
    <rect x="12" y="44" width="2" height="52" fill="#6e6e78" />
  </svg>
);

// ============================================================
// 战士右手 — 铁甲手套 + 双刃战斧（斧刃紧贴柄身）
// ============================================================
const WarriorRightHand: React.FC<{ attacking?: boolean }> = ({ attacking }) => (
  <svg width="155" height="215" viewBox="0 0 52 96" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* === 斧柄（竖直贯穿） === */}
    <rect x="24" y="0" width="4" height="2" fill="#6a5848" />
    <rect x="23" y="2" width="6" height="36" fill="#3e3028" />
    <rect x="25" y="2" width="2" height="36" fill="#5a4838" />
    <rect x="26" y="2" width="1" height="36" fill="#6a5848" />

    {/* === 斧刃 — 蝴蝶结形：每片刃内窄外宽 === */}
    {/* 左刃：靠柄窄(~10px高)，外侧宽(~24px高) */}
    {/* 外侧（左边缘）— 最宽 */}
    <rect x="0" y="4" width="4" height="24" fill="#98a8c0" />
    <rect x="0" y="2" width="4" height="2" fill="#90a0b8" />
    <rect x="0" y="28" width="4" height="2" fill="#8898b0" />
    {/* 中段过渡 — 逐步收窄 */}
    <rect x="4" y="5" width="4" height="22" fill="#90a0b8" />
    <rect x="8" y="7" width="4" height="18" fill="#8898b0" />
    <rect x="12" y="9" width="4" height="14" fill="#8090a8" />
    <rect x="16" y="10" width="4" height="12" fill="#7888a0" />
    <rect x="20" y="11" width="3" height="10" fill="#708098" />
    {/* 外锋亮边 */}
    <rect x="0" y="4" width="2" height="24" fill="#b0c0d8" />
    <rect x="0" y="2" width="2" height="2" fill="#a8b8d0" />
    <rect x="0" y="28" width="2" height="2" fill="#a0b0c8" />
    {/* 高光 */}
    <rect x="2" y="6" width="6" height="2" fill="#a8b8d0" opacity="0.4" />
    {/* 血痕 */}
    <rect x="4" y="16" width="6" height="1" fill="#8a2020" opacity="0.3" />

    {/* 右刃：镜像 */}
    <rect x="48" y="4" width="4" height="24" fill="#98a8c0" />
    <rect x="48" y="2" width="4" height="2" fill="#90a0b8" />
    <rect x="48" y="28" width="4" height="2" fill="#8898b0" />
    <rect x="44" y="5" width="4" height="22" fill="#90a0b8" />
    <rect x="40" y="7" width="4" height="18" fill="#8898b0" />
    <rect x="36" y="9" width="4" height="14" fill="#8090a8" />
    <rect x="32" y="10" width="4" height="12" fill="#7888a0" />
    <rect x="29" y="11" width="3" height="10" fill="#708098" />
    {/* 右外锋 */}
    <rect x="50" y="4" width="2" height="24" fill="#b0c0d8" />
    <rect x="50" y="2" width="2" height="2" fill="#a8b8d0" />
    <rect x="50" y="28" width="2" height="2" fill="#a0b0c8" />
    {/* 高光 */}
    <rect x="44" y="6" width="6" height="2" fill="#a8b8d0" opacity="0.4" />

    {/* === 中心铁箍 === */}
    <rect x="20" y="10" width="12" height="2" fill="#3a3a44" />
    <rect x="20" y="20" width="12" height="2" fill="#3a3a44" />
    <rect x="22" y="12" width="8" height="8" fill="#4a4a56" />
    {/* 铆钉 */}
    <rect x="24" y="14" width="4" height="4" fill="#6a6a78" />
    <rect x="25" y="15" width="2" height="2" fill="#8a8a98" />

    {/* === 斧柄下半段 === */}
    <rect x="22" y="38" width="8" height="16" fill="#3a2820" />
    <rect x="24" y="38" width="4" height="16" fill="#4a3828" />
    {/* 皮革缠绕 */}
    <rect x="22" y="40" width="8" height="2" fill="#524030" />
    <rect x="22" y="46" width="8" height="2" fill="#524030" />
    {/* 柄底铁箍 */}
    <rect x="20" y="52" width="12" height="2" fill="#4a4a52" />

    {/* === 铁甲手 === */}
    <rect x="14" y="54" width="24" height="10" fill="#5a5a62" />
    <rect x="14" y="54" width="24" height="2" fill="#6a6a72" />
    <rect x="14" y="62" width="24" height="2" fill="#4a4a52" />
    <rect x="16" y="56" width="4" height="6" fill="#626268" />
    <rect x="22" y="56" width="4" height="6" fill="#626268" />
    <rect x="28" y="56" width="4" height="6" fill="#5e5e66" />
    <rect x="34" y="56" width="4" height="6" fill="#585860" />

    {/* === 臂甲 === */}
    <rect x="14" y="64" width="24" height="32" fill="#5a5a62" />
    {[66,70,74,78,82,86,90].map(y => (
      <rect key={y} x="14" y={y} width="24" height="2" fill={y % 8 === 2 ? '#6a6a72' : '#4a4a52'} />
    ))}
    <rect x="16" y="64" width="2" height="32" fill="#6e6e78" />
    <rect x="18" y="68" width="2" height="2" fill="#7a7a82" />
    <rect x="32" y="76" width="2" height="2" fill="#7a7a82" />
    <rect x="18" y="84" width="2" height="2" fill="#7a7a82" />

    {/* 攻击时发光 */}
    {attacking && (
      <>
        <rect x="0" y="10" width="52" height="12" fill="rgba(200,60,40,0.2)" />
        <rect x="0" y="14" width="52" height="6" fill="rgba(200,60,40,0.35)" />
        <rect x="22" y="0" width="8" height="8" fill="rgba(255,100,60,0.25)" />
      </>
    )}
  </svg>
);

// ============================================================
// 法师左手 — 紫色法袍袖 + 星界骰子
// ============================================================
const MageLeftHand: React.FC = () => (
  <svg width="150" height="210" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))' }}>
    {/* 星界骰子 */}
    <rect x="12" y="6" width="26" height="26" fill="rgba(0,0,0,0.3)" />
    <rect x="12" y="4" width="2" height="2" fill="#1a1430" />
    <rect x="34" y="4" width="2" height="2" fill="#1a1430" />
    <rect x="12" y="26" width="2" height="2" fill="#1a1430" />
    <rect x="34" y="26" width="2" height="2" fill="#1a1430" />
    <rect x="14" y="2" width="20" height="2" fill="#1a1430" />
    <rect x="14" y="28" width="20" height="2" fill="#1a1430" />
    <rect x="10" y="6" width="2" height="20" fill="#1a1430" />
    <rect x="36" y="6" width="2" height="20" fill="#1a1430" />
    <rect x="12" y="6" width="24" height="20" fill="#2c2050" />
    <rect x="14" y="4" width="20" height="2" fill="#2c2050" />
    <rect x="14" y="26" width="20" height="2" fill="#2c2050" />
    <rect x="14" y="8" width="20" height="16" fill="#342868" />
    <rect x="18" y="10" width="12" height="12" fill="#4838a0" />
    <rect x="20" y="12" width="8" height="8" fill="#6050c0" />
    <rect x="22" y="14" width="4" height="4" fill="#9080ff" />
    <rect x="24" y="16" width="2" height="2" fill="#c0b0ff" />
    <rect x="14" y="6" width="8" height="2" fill="#4a3c80" />
    <rect x="14" y="24" width="20" height="2" fill="#1e1840" />
    <rect x="16" y="15" width="2" height="2" fill="#7060d0" opacity="0.5" />
    <rect x="30" y="15" width="2" height="2" fill="#7060d0" opacity="0.5" />
    {/* 法袍手 — 紫色布料 */}
    <rect x="8" y="28" width="30" height="14" fill="#3a2860" />
    <rect x="8" y="28" width="30" height="2" fill="#4a3878" />
    <rect x="8" y="40" width="30" height="2" fill="#2a1848" />
    <rect x="10" y="30" width="5" height="8" fill="#c0a890" />
    <rect x="17" y="30" width="5" height="8" fill="#c0a890" />
    <rect x="24" y="30" width="5" height="8" fill="#b89e80" />
    <rect x="4" y="26" width="6" height="12" fill="#b09878" />
    {/* 法袍臂 */}
    <rect x="10" y="42" width="28" height="54" fill="#2c2050" />
    <rect x="10" y="42" width="28" height="2" fill="#3c3068" />
    {[46,50,54,58,62,66,70,74,78,82,86].map(y => (
      <rect key={y} x="10" y={y} width="28" height="2" fill={y % 8 === 2 ? '#3c3068' : '#201840'} />
    ))}
    {/* 魔法纹路 */}
    <rect x="16" y="52" width="16" height="1" fill="#6050a0" opacity="0.3" />
    <rect x="16" y="64" width="16" height="1" fill="#6050a0" opacity="0.3" />
    <rect x="16" y="76" width="16" height="1" fill="#6050a0" opacity="0.3" />
  </svg>
);

// ============================================================
// 法师右手 — 法袍袖 + 粗壮水晶法杖
// ============================================================
const MageRightHand: React.FC<{ attacking?: boolean }> = ({ attacking }) => (
  <svg width="155" height="215" viewBox="0 0 50 96" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* === 杖顶 — 水晶座架 === */}
    {/* 外层金属座 */}
    <rect x="16" y="6" width="2" height="6" fill="#4a3c80" />
    <rect x="30" y="6" width="2" height="6" fill="#4a3c80" />
    <rect x="18" y="4" width="12" height="2" fill="#5a4c90" />
    <rect x="16" y="12" width="16" height="2" fill="#3a2c68" />
    {/* 大水晶宝石 */}
    <rect x="18" y="0" width="12" height="2" fill="#6040c0" />
    <rect x="16" y="2" width="16" height="2" fill="#7050d0" />
    <rect x="16" y="4" width="16" height="4" fill="#8060e0" />
    <rect x="18" y="8" width="12" height="4" fill="#7050d0" />
    <rect x="20" y="12" width="8" height="2" fill="#6040c0" />
    {/* 宝石高光 */}
    <rect x="20" y="2" width="4" height="2" fill="#a090ff" />
    <rect x="18" y="4" width="2" height="4" fill="#9080f0" />
    <rect x="22" y="6" width="4" height="2" fill="#c0b0ff" />
    {/* 宝石核心亮点 */}
    <rect x="24" y="4" width="2" height="2" fill="#d0c0ff" />
    {/* 能量光芒 */}
    <rect x="14" y="5" width="2" height="2" fill="#8070d0" opacity="0.5" />
    <rect x="32" y="5" width="2" height="2" fill="#8070d0" opacity="0.5" />
    <rect x="22" y="0" width="4" height="1" fill="#a090ff" opacity="0.4" />

    {/* === 杖身 — 粗壮雕花木杖 === */}
    <rect x="19" y="14" width="10" height="44" fill="#3a2828" />
    <rect x="21" y="14" width="6" height="44" fill="#4a3838" />
    <rect x="23" y="14" width="2" height="44" fill="#5a4848" />
    {/* 杖身左暗边 */}
    <rect x="19" y="14" width="2" height="44" fill="#2a1818" />
    {/* 金属环箍 */}
    <rect x="17" y="14" width="14" height="2" fill="#5a4c90" />
    <rect x="17" y="26" width="14" height="2" fill="#4a3c78" />
    <rect x="17" y="38" width="14" height="2" fill="#4a3c78" />
    {/* 魔法符文纹路 */}
    <rect x="21" y="18" width="6" height="1" fill="#6050a0" opacity="0.4" />
    <rect x="21" y="22" width="6" height="1" fill="#6050a0" opacity="0.3" />
    <rect x="21" y="30" width="6" height="1" fill="#6050a0" opacity="0.4" />
    <rect x="21" y="34" width="6" height="1" fill="#6050a0" opacity="0.3" />
    <rect x="21" y="42" width="6" height="1" fill="#6050a0" opacity="0.4" />
    {/* 侧面符文亮点 */}
    <rect x="19" y="20" width="2" height="2" fill="#7060c0" opacity="0.35" />
    <rect x="27" y="32" width="2" height="2" fill="#7060c0" opacity="0.35" />
    <rect x="19" y="44" width="2" height="2" fill="#7060c0" opacity="0.35" />
    {/* 杖底铁箍 */}
    <rect x="17" y="54" width="14" height="2" fill="#5a4c90" />
    <rect x="17" y="56" width="14" height="2" fill="#4a3c78" />

    {/* === 肉手（法师露出的皮肤） === */}
    <rect x="14" y="56" width="20" height="10" fill="#c0a890" />
    <rect x="14" y="56" width="20" height="2" fill="#d0b8a0" />
    <rect x="14" y="64" width="20" height="2" fill="#a89078" />
    {/* 手指 */}
    <rect x="16" y="58" width="4" height="6" fill="#c8b098" />
    <rect x="22" y="58" width="4" height="6" fill="#c8b098" />
    <rect x="28" y="58" width="4" height="6" fill="#baa888" />

    {/* === 法袍臂 === */}
    <rect x="12" y="66" width="24" height="30" fill="#2c2050" />
    <rect x="12" y="66" width="24" height="2" fill="#3c3068" />
    {[70,74,78,82,86,90].map(y => (
      <rect key={y} x="12" y={y} width="24" height="2" fill={y % 8 === 2 ? '#3c3068' : '#201840'} />
    ))}
    {/* 法袍魔法纹路 */}
    <rect x="16" y="72" width="16" height="1" fill="#6050a0" opacity="0.25" />
    <rect x="16" y="80" width="16" height="1" fill="#6050a0" opacity="0.25" />
    <rect x="16" y="88" width="16" height="1" fill="#6050a0" opacity="0.25" />

    {/* 攻击时宝石发光 */}
    {attacking && (
      <>
        <rect x="14" y="0" width="20" height="14" fill="rgba(140,80,255,0.35)" />
        <rect x="18" y="2" width="12" height="8" fill="rgba(180,120,255,0.45)" />
        <rect x="22" y="4" width="4" height="4" fill="rgba(220,180,255,0.6)" />
        {/* 光芒射线 */}
        <rect x="10" y="6" width="4" height="2" fill="rgba(140,80,255,0.3)" />
        <rect x="34" y="6" width="4" height="2" fill="rgba(140,80,255,0.3)" />
        <rect x="22" y="0" width="4" height="2" fill="rgba(180,120,255,0.4)" />
      </>
    )}
  </svg>
);

// ============================================================
// 盗贼左手 — 皮革手套 + 淬毒骰子
// ============================================================
const RogueLeftHand: React.FC = () => (
  <svg width="150" height="210" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))' }}>
    {/* 淬毒骰子 */}
    <rect x="12" y="6" width="26" height="26" fill="rgba(0,0,0,0.3)" />
    <rect x="12" y="4" width="2" height="2" fill="#103020" />
    <rect x="34" y="4" width="2" height="2" fill="#103020" />
    <rect x="12" y="26" width="2" height="2" fill="#103020" />
    <rect x="34" y="26" width="2" height="2" fill="#103020" />
    <rect x="14" y="2" width="20" height="2" fill="#103020" />
    <rect x="14" y="28" width="20" height="2" fill="#103020" />
    <rect x="10" y="6" width="2" height="20" fill="#103020" />
    <rect x="36" y="6" width="2" height="20" fill="#103020" />
    <rect x="12" y="6" width="24" height="20" fill="#1a4028" />
    <rect x="14" y="4" width="20" height="2" fill="#1a4028" />
    <rect x="14" y="26" width="20" height="2" fill="#1a4028" />
    <rect x="14" y="8" width="20" height="16" fill="#205030" />
    {/* 毒液纹路 */}
    <rect x="18" y="10" width="12" height="12" fill="#286838" />
    <rect x="20" y="12" width="8" height="8" fill="#30a050" />
    <rect x="22" y="14" width="4" height="4" fill="#60ff80" />
    <rect x="24" y="16" width="2" height="2" fill="#a0ffc0" />
    {/* 毒滴 */}
    <rect x="16" y="20" width="2" height="3" fill="#40c060" opacity="0.6" />
    <rect x="30" y="12" width="2" height="3" fill="#40c060" opacity="0.6" />
    <rect x="14" y="6" width="8" height="2" fill="#286838" />
    <rect x="14" y="24" width="20" height="2" fill="#0e2818" />
    {/* 皮革手 */}
    <rect x="8" y="28" width="30" height="14" fill="#4a3828" />
    <rect x="8" y="28" width="30" height="2" fill="#5a4838" />
    <rect x="8" y="40" width="30" height="2" fill="#3a2818" />
    <rect x="10" y="30" width="5" height="8" fill="#524030" />
    <rect x="17" y="30" width="5" height="8" fill="#524030" />
    <rect x="24" y="30" width="5" height="8" fill="#524030" />
    <rect x="4" y="26" width="6" height="12" fill="#4a3828" />
    {/* 皮革臂 */}
    <rect x="10" y="42" width="28" height="54" fill="#3a2818" />
    <rect x="10" y="42" width="28" height="2" fill="#4a3828" />
    {[46,50,54,58,62,66,70,74,78,82,86].map(y => (
      <rect key={y} x="10" y={y} width="28" height="2" fill={y % 8 === 2 ? '#4a3828' : '#2a1808'} />
    ))}
    {/* 缠带 */}
    <rect x="14" y="48" width="20" height="2" fill="#5a4838" opacity="0.6" />
    <rect x="14" y="60" width="20" height="2" fill="#5a4838" opacity="0.6" />
    <rect x="14" y="72" width="20" height="2" fill="#5a4838" opacity="0.6" />
  </svg>
);

// ============================================================
// 盗贼右手 — 皮革手套 + 大号淬毒匕首
// ============================================================
const RogueRightHand: React.FC<{ attacking?: boolean }> = ({ attacking }) => (
  <svg width="155" height="215" viewBox="0 0 48 96" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* === 匕首刃 — 加长加宽的毒刃 === */}
    {/* 刃尖 */}
    <rect x="21" y="0" width="2" height="2" fill="#a0b0c0" />
    <rect x="19" y="2" width="6" height="2" fill="#90a0b0" />
    {/* 刃身主体 — 宽刃 */}
    <rect x="17" y="4" width="10" height="2" fill="#708090" />
    <rect x="16" y="6" width="12" height="30" fill="#607080" />
    {/* 刃中线高光 */}
    <rect x="20" y="4" width="4" height="32" fill="#8898a8" />
    <rect x="22" y="2" width="2" height="34" fill="#98a8b8" />
    {/* 刃左暗面 */}
    <rect x="16" y="6" width="2" height="30" fill="#506068" />
    {/* 刃右暗面 */}
    <rect x="26" y="6" width="2" height="30" fill="#586878" />
    {/* 毒液涂层 — 绿色条纹 */}
    <rect x="18" y="8" width="8" height="2" fill="#40c060" opacity="0.35" />
    <rect x="18" y="14" width="8" height="2" fill="#40c060" opacity="0.4" />
    <rect x="18" y="20" width="8" height="2" fill="#40c060" opacity="0.35" />
    <rect x="18" y="26" width="8" height="2" fill="#40c060" opacity="0.3" />
    <rect x="18" y="32" width="8" height="2" fill="#40c060" opacity="0.25" />
    {/* 毒液滴落 */}
    <rect x="17" y="12" width="2" height="3" fill="#50d070" opacity="0.5" />
    <rect x="25" y="22" width="2" height="3" fill="#50d070" opacity="0.45" />
    {/* 刃底斜收 */}
    <rect x="18" y="36" width="8" height="2" fill="#586878" />

    {/* === 护手 — 弯曲十字护手 === */}
    <rect x="10" y="38" width="24" height="2" fill="#3a3a44" />
    <rect x="8" y="40" width="28" height="2" fill="#4a4a56" />
    <rect x="10" y="42" width="24" height="2" fill="#3a3a44" />
    {/* 护手两端装饰 */}
    <rect x="8" y="38" width="2" height="4" fill="#4a4a56" />
    <rect x="34" y="38" width="2" height="4" fill="#4a4a56" />
    {/* 护手中心宝石 */}
    <rect x="20" y="39" width="4" height="3" fill="#30a050" />
    <rect x="21" y="40" width="2" height="1" fill="#60ff80" />

    {/* === 柄 === */}
    <rect x="18" y="44" width="8" height="14" fill="#2a1808" />
    <rect x="20" y="44" width="4" height="14" fill="#3a2818" />
    {/* 缠皮纹路 */}
    <rect x="18" y="46" width="8" height="1" fill="#1a0800" />
    <rect x="18" y="50" width="8" height="1" fill="#1a0800" />
    <rect x="18" y="54" width="8" height="1" fill="#1a0800" />
    {/* 柄底 */}
    <rect x="20" y="58" width="4" height="2" fill="#4a4a56" />

    {/* === 皮革手 === */}
    <rect x="12" y="56" width="20" height="10" fill="#4a3828" />
    <rect x="12" y="56" width="20" height="2" fill="#5a4838" />
    <rect x="14" y="58" width="4" height="6" fill="#524030" />
    <rect x="20" y="58" width="4" height="6" fill="#524030" />
    <rect x="26" y="58" width="4" height="6" fill="#4a3828" />

    {/* === 皮革臂 === */}
    <rect x="12" y="66" width="24" height="30" fill="#3a2818" />
    <rect x="12" y="66" width="24" height="2" fill="#4a3828" />
    {[70,74,78,82,86,90].map(y => (
      <rect key={y} x="12" y={y} width="24" height="2" fill={y % 8 === 2 ? '#4a3828' : '#2a1808'} />
    ))}
    {/* 缠带 */}
    <rect x="14" y="72" width="20" height="2" fill="#5a4838" opacity="0.5" />
    <rect x="14" y="82" width="20" height="2" fill="#5a4838" opacity="0.5" />

    {/* 攻击时绿色毒光 */}
    {attacking && (
      <>
        <rect x="16" y="4" width="12" height="34" fill="rgba(60,200,80,0.2)" />
        <rect x="20" y="0" width="4" height="38" fill="rgba(60,200,80,0.4)" />
        <rect x="19" y="0" width="6" height="4" fill="rgba(80,255,100,0.5)" />
      </>
    )}
  </svg>
);

// ============================================================
// 导出：根据职业返回对应双手
// ============================================================
export const ClassLeftHand: React.FC<{ playerClass?: string }> = ({ playerClass }) => {
  if (playerClass === 'warrior') return <WarriorLeftHand />;
  if (playerClass === 'rogue') return <RogueLeftHand />;
  return <MageLeftHand />; // 默认法师（也兼容无职业的旧存档）
};

export const ClassRightHand: React.FC<{ playerClass?: string; attacking?: boolean }> = ({ playerClass, attacking }) => {
  if (playerClass === 'warrior') return <WarriorRightHand attacking={attacking} />;
  if (playerClass === 'rogue') return <RogueRightHand attacking={attacking} />;
  return <MageRightHand attacking={attacking} />;
};
