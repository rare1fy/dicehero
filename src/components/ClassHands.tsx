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
// 战士右手 — 铁甲手套 + 战斧
// ============================================================
const WarriorRightHand: React.FC<{ attacking?: boolean }> = ({ attacking }) => (
  <svg width="155" height="215" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* 斧刃 */}
    <rect x="14" y="2" width="20" height="4" fill="#505868" />
    <rect x="10" y="6" width="28" height="8" fill="#404858" />
    <rect x="8" y="8" width="4" height="6" fill="#384050" />
    <rect x="36" y="8" width="4" height="6" fill="#384050" />
    <rect x="12" y="6" width="24" height="2" fill="#586070" />
    {/* 斧刃高光 */}
    <rect x="14" y="8" width="20" height="2" fill="#4a5668" />
    {/* 血痕 */}
    <rect x="16" y="10" width="6" height="2" fill="#8a2020" opacity="0.5" />
    <rect x="26" y="8" width="4" height="2" fill="#8a2020" opacity="0.4" />
    {/* 柄 */}
    <rect x="20" y="14" width="8" height="40" fill="#3a2820" />
    <rect x="22" y="14" width="4" height="40" fill="#4a3828" />
    <rect x="20" y="20" width="8" height="2" fill="#2a1810" />
    <rect x="20" y="30" width="8" height="2" fill="#2a1810" />
    <rect x="20" y="40" width="8" height="2" fill="#2a1810" />
    {/* 手 */}
    <rect x="12" y="50" width="24" height="10" fill="#5a5a62" />
    <rect x="12" y="50" width="24" height="2" fill="#6a6a72" />
    {/* 臂甲 */}
    <rect x="12" y="60" width="24" height="34" fill="#5a5a62" />
    {[62,66,70,74,78,82,86].map(y => (
      <rect key={y} x="12" y={y} width="24" height="2" fill={y % 8 === 2 ? '#6a6a72' : '#4a4a52'} />
    ))}
    {attacking && (
      <>
        <rect x="10" y="6" width="28" height="8" fill="rgba(200,60,40,0.25)" />
        <rect x="14" y="2" width="20" height="4" fill="rgba(200,60,40,0.4)" />
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
// 法师右手 — 法袍袖 + 法杖
// ============================================================
const MageRightHand: React.FC<{ attacking?: boolean }> = ({ attacking }) => (
  <svg width="155" height="215" viewBox="0 0 44 88" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', transform: 'scaleX(-1)' }}>
    {/* 法杖宝石 */}
    <rect x="20" y="0" width="8" height="8" fill="#5030a0" />
    <rect x="22" y="2" width="4" height="4" fill="#8060e0" />
    <rect x="23" y="3" width="2" height="2" fill="#c0a0ff" />
    {/* 杖身 */}
    <rect x="22" y="8" width="4" height="48" fill="#4a3028" />
    <rect x="23" y="8" width="2" height="48" fill="#5a4038" />
    {/* 杖身纹路 */}
    <rect x="22" y="16" width="4" height="1" fill="#6050a0" opacity="0.5" />
    <rect x="22" y="26" width="4" height="1" fill="#6050a0" opacity="0.5" />
    <rect x="22" y="36" width="4" height="1" fill="#6050a0" opacity="0.5" />
    {/* 手 */}
    <rect x="14" y="50" width="20" height="10" fill="#c0a890" />
    <rect x="14" y="50" width="20" height="2" fill="#d0b8a0" />
    {/* 法袍臂 */}
    <rect x="12" y="60" width="24" height="34" fill="#2c2050" />
    <rect x="12" y="60" width="24" height="2" fill="#3c3068" />
    {[64,68,72,76,80,84,88].map(y => (
      <rect key={y} x="12" y={y} width="24" height="2" fill={y % 8 === 0 ? '#3c3068' : '#201840'} />
    ))}
    {attacking && (
      <>
        <rect x="20" y="0" width="8" height="8" fill="rgba(140,80,255,0.5)" />
        <rect x="18" y="0" width="12" height="4" fill="rgba(180,120,255,0.3)" />
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
