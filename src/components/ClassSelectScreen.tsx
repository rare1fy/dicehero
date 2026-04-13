/**
 * ClassSelectScreen.tsx — 职业选择界面
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/sound';
import { CLASS_DEFS, type ClassId } from '../data/classes';
import { PixelSword, PixelMagic, PixelPoison } from './PixelIcons';

// ============================================================
// 职业图标SVG — 像素风格
// ============================================================

/** 战士：白骨骷髅骰子 */
const WarriorDiceIcon: React.FC<{ size?: number }> = ({ size = 6 }) => {
  const s = size;
  const B = '#4a2020', H = '#d0c0b0', F = '#b0a090', D = '#806050', DOT = '#c04040';
  const p = [
    [B, H, H, H, H, H, B],
    [H, F, F, F, F, F, D],
    [H, F, DOT, F, F, F, D],
    [H, F, F, DOT, F, F, D],
    [H, F, F, F, DOT, F, D],
    [H, F, F, F, F, F, D],
    [B, D, D, D, D, D, B],
  ];
  return (
    <svg width={7*s} height={7*s} viewBox="0 0 7 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {p.map((row, y) => row.map((c, x) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />))}
    </svg>
  );
};

/** 法师：紫色星界骰子 */
const MageDiceIcon: React.FC<{ size?: number }> = ({ size = 6 }) => {
  const s = size;
  const B = '#2a1050', H = '#8050c0', F = '#6040a0', D = '#402080', DOT = '#d0a0ff';
  const p = [
    [B, H, H, H, H, H, B],
    [H, F, F, F, F, F, D],
    [H, F, DOT, F, F, F, D],
    [H, F, F, DOT, F, F, D],
    [H, F, F, F, DOT, F, D],
    [H, F, F, F, F, F, D],
    [B, D, D, D, D, D, B],
  ];
  return (
    <svg width={7*s} height={7*s} viewBox="0 0 7 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {p.map((row, y) => row.map((c, x) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />))}
    </svg>
  );
};

/** 盗贼：绿色淬毒骰子 */
const RogueDiceIcon: React.FC<{ size?: number }> = ({ size = 6 }) => {
  const s = size;
  const B = '#103020', H = '#30a050', F = '#208040', D = '#106030', DOT = '#80ff80';
  const p = [
    [B, H, H, H, H, H, B],
    [H, F, F, F, F, F, D],
    [H, F, DOT, F, F, F, D],
    [H, F, F, DOT, F, F, D],
    [H, F, F, F, DOT, F, D],
    [H, F, F, F, F, F, D],
    [B, D, D, D, D, D, B],
  ];
  return (
    <svg width={7*s} height={7*s} viewBox="0 0 7 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {p.map((row, y) => row.map((c, x) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />))}
    </svg>
  );
};

/** 职业武器图标 */
const ClassWeaponIcon: React.FC<{ classId: ClassId; size?: number }> = ({ classId, size = 3 }) => {
  if (classId === 'warrior') return <PixelSword size={size} />;
  if (classId === 'mage') return <PixelMagic size={size} />;
  return <PixelPoison size={size} />;
};

const ClassDiceIcon: React.FC<{ classId: ClassId; size?: number }> = ({ classId, size = 6 }) => {
  if (classId === 'warrior') return <WarriorDiceIcon size={size} />;
  if (classId === 'mage') return <MageDiceIcon size={size} />;
  return <RogueDiceIcon size={size} />;
};

// ============================================================
// 职业选择组件
// ============================================================

interface ClassSelectScreenProps {
  onSelect: (classId: ClassId) => void;
}

export const ClassSelectScreen: React.FC<ClassSelectScreenProps> = ({ onSelect }) => {
  const [selected, setSelected] = useState<ClassId | null>(null);
  const [confirming, setConfirming] = useState(false);
  const classes: ClassId[] = ['warrior', 'mage', 'rogue'];

  const handleConfirm = () => {
    if (!selected) return;
    playSound('gate_close');
    setConfirming(true);
    setTimeout(() => onSelect(selected), 800);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] relative overflow-hidden sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
      <div className="absolute inset-0 pixel-grid-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 dungeon-bg pointer-events-none" />

      {/* 淡出遮罩 */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 bg-black pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-[var(--dungeon-text-bright)] pixel-text-shadow tracking-wide mb-1">
            选择职业
          </h2>
          <p className="text-[9px] text-[var(--dungeon-text-dim)] tracking-[0.2em]">
            每个职业拥有独特的战斗风格和专属骰子
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {classes.map((cid, idx) => {
            const cls = CLASS_DEFS[cid];
            const isSelected = selected === cid;
            return (
              <motion.button
                key={cid}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.12 }}
                onClick={() => { playSound('select'); setSelected(cid); }}
                className={`w-full pixel-panel p-3 text-left flex items-center gap-3 transition-all ${isSelected ? 'ring-2' : 'hover:brightness-110'}`}
                style={{
                  borderColor: isSelected ? cls.color : 'var(--dungeon-panel-border)',
                  boxShadow: isSelected ? `0 0 12px ${cls.color}40, inset 0 0 8px ${cls.color}15` : undefined,
                  ringColor: cls.color,
                }}
              >
                <div className="shrink-0" style={{ filter: isSelected ? `drop-shadow(0 0 6px ${cls.color}80)` : undefined }}>
                  <ClassDiceIcon classId={cid} size={5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <ClassWeaponIcon classId={cid} size={2} />
                    <span className="text-sm font-black pixel-text-shadow" style={{ color: cls.colorLight }}>
                      {cls.name}
                    </span>
                    <span className="text-[8px] font-bold" style={{ color: cls.color }}>
                      {cls.title}
                    </span>
                  </div>
                  <p className="text-[9px] text-[var(--dungeon-text-dim)] leading-tight mb-1">
                    {cls.description}
                  </p>
                  <div className="flex gap-2 text-[8px] font-mono">
                    <span className="text-[var(--dungeon-text-dim)]">抽骰:{cls.drawCount}</span>
                    <span className="text-[var(--dungeon-text-dim)]">出牌:{cls.maxPlays}</span>
                    <span className="text-[var(--dungeon-text-dim)]">重投:{cls.freeRerolls}</span>
                    {cls.canBloodReroll && <span style={{ color: cls.colorLight }}>卖血</span>}
                    {cls.keepUnplayed && <span style={{ color: cls.colorLight }}>留牌</span>}
                    {cid === 'rogue' && <span style={{ color: cls.colorLight }}>连击</span>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 选中职业详情 */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pixel-panel p-3 mb-4"
              style={{ borderColor: CLASS_DEFS[selected].color + '60' }}
            >
              <div className="text-[8px] font-bold tracking-[0.15em] mb-1" style={{ color: CLASS_DEFS[selected].color }}>
                ◆ 职业特权 ◆
              </div>
              <p className="text-[9px] text-[var(--dungeon-text)] leading-relaxed">
                {CLASS_DEFS[selected].passiveDesc}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 确认按钮 */}
        <motion.button
          onClick={handleConfirm}
          disabled={!selected || confirming}
          animate={selected ? { filter: [`drop-shadow(0 0 6px ${CLASS_DEFS[selected!].color}40)`, `drop-shadow(0 0 16px ${CLASS_DEFS[selected!].color}80)`, `drop-shadow(0 0 6px ${CLASS_DEFS[selected!].color}40)`] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-full py-3 pixel-btn pixel-btn-primary text-sm font-bold disabled:opacity-30"
        >
          {selected ? `选择 ${CLASS_DEFS[selected].name} 开启冒险` : '请选择一个职业'}
        </motion.button>
      </motion.div>
    </div>
  );
};
