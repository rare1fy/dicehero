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
  <svg width="150" height="210" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* 骷髅骰子 */}
    <rect x="12" y="6" width="26" height="26" fill="rgba(0,0,0,0.3)" />
    <rect x="14" y="2" width="20" height="2" fill="#4a2020" />
    <rect x="14" y="28" width="20" height="2" fill="#4a2020" />
    <rect x="10" y="6" width="2" height="20" fill="#4a2020" />
    <rect x="36" y="6" width="2" height="20" fill="#4a2020" />
    <rect x="12" y="4" width="2" height="2" fill="#4a2020" />
    <rect x="34" y="4" width="2" height="2" fill="#4a2020" />
    <rect x="12" y="26" width="2" height="2" fill="#4a2020" />
    <rect x="34" y="26" width="2" height="2" fill="#4a2020" />
    <rect x="12" y="6" width="24" height="20" fill="#d0c0b0" />
    <rect x="14" y="4" width="20" height="2" fill="#d0c0b0" />
    <rect x="14" y="26" width="20" height="2" fill="#b0a090" />
    <rect x="14" y="8" width="20" height="16" fill="#c0b0a0" />
    {/* 骷髅图案 */}
    <rect x="18" y="10" width="12" height="10" fill="#a08870" />
    <rect x="20" y="12" width="3" height="3" fill="#301010" />
    <rect x="25" y="12" width="3" height="3" fill="#301010" />
    <rect x="22" y="17" width="4" height="2" fill="#301010" />
    <rect x="21" y="19" width="1" height="1" fill="#301010" />
    <rect x="23" y="19" width="1" height="1" fill="#301010" />
    <rect x="26" y="19" width="1" height="1" fill="#301010" />
    {/* 顶部高光 */}
    <rect x="14" y="6" width="8" height="2" fill="#d8c8b8" />
    <rect x="34" y="10" width="2" height="16" fill="#8a7a6a" />
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
// 战士右手 — 铁甲手套 + 双刃战斧
// ============================================================
const WarriorRightHand: React.FC<{ attacking?: boolean }> = ({ attacking }) => (
  <svg width="155" height="215" viewBox="0 0 50 96" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* === 左斧刃 — 弧形斧头 === */}
    <rect x="6" y="6" width="2" height="2" fill="#48546a" />
    <rect x="4" y="8" width="4" height="2" fill="#48546a" />
    <rect x="2" y="10" width="6" height="2" fill="#505c72" />
    <rect x="2" y="12" width="8" height="2" fill="#586478" />
    <rect x="2" y="14" width="10" height="2" fill="#606c80" />
    <rect x="2" y="16" width="12" height="2" fill="#687488" />
    <rect x="4" y="18" width="12" height="2" fill="#606c80" />
    <rect x="6" y="20" width="12" height="2" fill="#586478" />
    <rect x="8" y="22" width="12" height="2" fill="#505c72" />
    <rect x="12" y="24" width="10" height="2" fill="#48546a" />
    {/* 左刃高光 */}
    <rect x="4" y="12" width="2" height="6" fill="#7a8698" />
    <rect x="6" y="14" width="2" height="4" fill="#8a96a8" />
    {/* 左刃锋利边缘 */}
    <rect x="2" y="12" width="2" height="8" fill="#8898b0" />
    {/* 血痕 */}
    <rect x="6" y="16" width="4" height="2" fill="#8a2020" opacity="0.45" />
    <rect x="4" y="12" width="3" height="1" fill="#8a2020" opacity="0.35" />

    {/* === 右斧刃 — 镜像弧形 === */}
    <rect x="40" y="6" width="2" height="2" fill="#48546a" />
    <rect x="40" y="8" width="4" height="2" fill="#48546a" />
    <rect x="40" y="10" width="6" height="2" fill="#505c72" />
    <rect x="38" y="12" width="8" height="2" fill="#586478" />
    <rect x="36" y="14" width="10" height="2" fill="#606c80" />
    <rect x="34" y="16" width="12" height="2" fill="#687488" />
    <rect x="32" y="18" width="12" height="2" fill="#606c80" />
    <rect x="30" y="20" width="12" height="2" fill="#586478" />
    <rect x="28" y="22" width="12" height="2" fill="#505c72" />
    <rect x="26" y="24" width="10" height="2" fill="#48546a" />
    {/* 右刃高光 */}
    <rect x="42" y="12" width="2" height="6" fill="#7a8698" />
    <rect x="40" y="14" width="2" height="4" fill="#8a96a8" />
    {/* 右刃锋利边缘 */}
    <rect x="44" y="12" width="2" height="8" fill="#8898b0" />

    {/* === 斧柄中心连接 === */}
    <rect x="20" y="4" width="8" height="24" fill="#3e3028" />
    <rect x="22" y="4" width="4" height="24" fill="#4e4038" />
    {/* 斧眼装饰 — 铆钉 */}
    <rect x="22" y="8" width="4" height="2" fill="#6a6a72" />
    <rect x="23" y="9" width="2" height="1" fill="#8a8a92" />
    {/* 柄上暗纹 */}
    <rect x="20" y="14" width="8" height="1" fill="#2a1810" opacity="0.6" />
    <rect x="20" y="20" width="8" height="1" fill="#2a1810" opacity="0.6" />

    {/* === 斧柄（下半段到手部） === */}
    <rect x="20" y="28" width="8" height="26" fill="#3a2820" />
    <rect x="22" y="28" width="4" height="26" fill="#4a3828" />
    {/* 皮革缠绕 */}
    <rect x="20" y="32" width="8" height="2" fill="#524030" />
    <rect x="20" y="38" width="8" height="2" fill="#524030" />
    <rect x="20" y="44" width="8" height="2" fill="#524030" />
    {/* 柄底铁箍 */}
    <rect x="18" y="50" width="12" height="2" fill="#4a4a52" />
    <rect x="18" y="52" width="12" height="2" fill="#5a5a62" />

    {/* === 铁甲手 === */}
    <rect x="12" y="54" width="24" height="10" fill="#5a5a62" />
    <rect x="12" y="54" width="24" height="2" fill="#6a6a72" />
    <rect x="12" y="62" width="24" height="2" fill="#4a4a52" />
    <rect x="14" y="56" width="4" height="6" fill="#626268" />
    <rect x="20" y="56" width="4" height="6" fill="#626268" />
    <rect x="26" y="56" width="4" height="6" fill="#5e5e66" />
    <rect x="32" y="56" width="4" height="6" fill="#585860" />

    {/* === 臂甲 === */}
    <rect x="12" y="64" width="24" height="32" fill="#5a5a62" />
    {[66,70,74,78,82,86,90].map(y => (
      <rect key={y} x="12" y={y} width="24" height="2" fill={y % 8 === 2 ? '#6a6a72' : '#4a4a52'} />
    ))}
    <rect x="14" y="64" width="2" height="32" fill="#6e6e78" />
    {/* 铆钉 */}
    <rect x="16" y="68" width="2" height="2" fill="#7a7a82" />
    <rect x="30" y="76" width="2" height="2" fill="#7a7a82" />
    <rect x="16" y="84" width="2" height="2" fill="#7a7a82" />

    {/* 攻击时发光 */}
    {attacking && (
      <>
        <rect x="2" y="10" width="44" height="16" fill="rgba(200,60,40,0.2)" />
        <rect x="2" y="14" width="44" height="6" fill="rgba(200,60,40,0.35)" />
        <rect x="20" y="4" width="8" height="6" fill="rgba(255,100,60,0.3)" />
      </>
    )}
  </svg>
);

// ============================================================
// 法师左手 — 紫色法袍袖 + 星界骰子
// ============================================================
const MageLeftHand: React.FC = () => (
  <svg width="150" height="210" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
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
  <svg width="150" height="210" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
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
// 盗贼右手 — 皮革手套 + 匕首
// ============================================================
const RogueRightHand: React.FC<{ attacking?: boolean }> = ({ attacking }) => (
  <svg width="155" height="215" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* 匕首刃 */}
    <rect x="22" y="0" width="4" height="2" fill="#90a0b0" />
    <rect x="21" y="2" width="6" height="28" fill="#708090" />
    <rect x="23" y="2" width="2" height="28" fill="#90a8b8" />
    <rect x="21" y="2" width="1" height="28" fill="#506070" />
    {/* 毒液涂层 */}
    <rect x="22" y="6" width="4" height="2" fill="#40c060" opacity="0.4" />
    <rect x="22" y="14" width="4" height="2" fill="#40c060" opacity="0.3" />
    <rect x="22" y="22" width="4" height="2" fill="#40c060" opacity="0.35" />
    {/* 护手 */}
    <rect x="16" y="30" width="16" height="4" fill="#3a2818" />
    <rect x="16" y="30" width="16" height="2" fill="#4a3828" />
    {/* 柄 */}
    <rect x="20" y="34" width="8" height="16" fill="#2a1808" />
    <rect x="22" y="36" width="4" height="12" fill="#3a2818" />
    <rect x="20" y="38" width="8" height="1" fill="#1a0800" />
    <rect x="20" y="42" width="8" height="1" fill="#1a0800" />
    <rect x="20" y="46" width="8" height="1" fill="#1a0800" />
    {/* 手 */}
    <rect x="14" y="46" width="20" height="10" fill="#4a3828" />
    <rect x="14" y="46" width="20" height="2" fill="#5a4838" />
    {/* 皮革臂 */}
    <rect x="12" y="56" width="24" height="38" fill="#3a2818" />
    <rect x="12" y="56" width="24" height="2" fill="#4a3828" />
    {[60,64,68,72,76,80,84,88].map(y => (
      <rect key={y} x="12" y={y} width="24" height="2" fill={y % 8 === 0 ? '#4a3828' : '#2a1808'} />
    ))}
    {attacking && (
      <>
        <rect x="21" y="2" width="6" height="28" fill="rgba(60,200,80,0.25)" />
        <rect x="22" y="0" width="4" height="4" fill="rgba(60,200,80,0.5)" />
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
