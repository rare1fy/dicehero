/**
 * DiceSelectCard.tsx — 篝火界面骰子选择卡片（升级/净化共用）
 *
 * 从 CampfireScreen.tsx 提取（ARCH-G）。
 * 消除 upgrade/purify 两视图中的重复骰子卡片代码。
 */

import React from 'react';
import { motion } from 'motion/react';
import { getDiceDef, getUpgradedFaces, DICE_MAX_LEVEL } from '../data/dice';
import { RARITY_LABELS, RARITY_TEXT_COLORS, ElementBadge } from './PixelDiceShapes';
import { getDiceElementClass } from '../utils/uiHelpers';

interface DiceSelectCardProps {
  defId: string;
  level: number;
  index: number;
  isSelected: boolean;
  selectColor: 'gold' | 'red';
  onSelect: () => void;
}

export function DiceSelectCard({ defId, level, index, isSelected, selectColor, onSelect }: DiceSelectCardProps) {
  const def = getDiceDef(defId);
  const currentFaces = getUpgradedFaces(def, level);

  const borderClass = isSelected
    ? selectColor === 'gold'
      ? 'border-[var(--pixel-gold)] bg-[rgba(212,160,48,0.15)] shadow-[0_0_12px_rgba(212,160,48,0.4)]'
      : 'border-[var(--pixel-red)] bg-[rgba(224,60,49,0.15)] shadow-[0_0_12px_rgba(224,60,49,0.4)]'
    : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.25)]';

  const badgeIcon = selectColor === 'gold'
    ? <span className="text-[8px] text-black font-black">●</span>
    : <span className="text-[8px] text-white font-black">✖</span>;

  const badgeBg = selectColor === 'gold' ? 'bg-[var(--pixel-gold)]' : 'bg-[var(--pixel-red)]';

  return (
    <motion.button
      key={index}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`relative flex flex-col items-center p-3 border-2 transition-all min-w-[90px] ${borderClass}`}
      style={{ borderRadius: '2px' }}
    >
      <div className="text-[8px] font-bold tracking-wider mb-1" style={{ color: RARITY_TEXT_COLORS[def.rarity] || '#888' }}>
        {RARITY_LABELS[def.rarity] || def.rarity}
      </div>
      <div className="relative mb-1.5">
        <div
          className={`${getDiceElementClass(def.element, isSelected, false, false, def.id)} relative flex items-center justify-center`}
          style={{ width: '36px', height: '36px', fontSize: '16px', lineHeight: '36px' }}
        >
          {'?'}
        </div>
        {def.element !== 'normal' && (
          <div className="absolute -top-1 -right-1 z-10">
            <ElementBadge element={def.element} size={12} />
          </div>
        )}
      </div>
      <div className="text-[10px] font-bold text-[var(--dungeon-text-bright)] mb-0.5 text-center leading-tight">
        {def.name}
      </div>
      <div className={`text-[7px] font-bold mb-0.5 ${
        level >= 3 ? 'text-[var(--pixel-gold)]' : level >= 2 ? 'text-[var(--pixel-cyan)]' : 'text-[var(--dungeon-text-dim)]'
      }`}>
        Lv.{level}
      </div>
      <div className="text-[8px] text-[var(--dungeon-text-dim)] mb-0.5">
        [{currentFaces.join(',')}]
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1.5 -right-1.5 w-4 h-4 ${badgeBg} flex items-center justify-center`}
          style={{ borderRadius: '2px' }}
        >
          {badgeIcon}
        </motion.div>
      )}
    </motion.button>
  );
}
