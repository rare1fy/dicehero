/**
 * CampfireUpgradeView.tsx — 篝火升级骰子视图
 *
 * 从 CampfireScreen.tsx 提取（ARCH-G）。
 * 独立组件：升级骰子选择 + 强化预览 + 确认升级按钮
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { getDiceDef, getUpgradedFaces, getUpgradedOnPlay, DICE_MAX_LEVEL } from '../data/dice';
import { playSound } from '../utils/sound';
import { PixelDice } from './PixelIcons';
import { getOnPlayDescription } from './PixelDiceShapes';
import { DiceSelectCard } from './DiceSelectCard';
import { CAMPFIRE_CONFIG } from '../config';

interface Props {
  onBack: () => void;
  onUsed: () => void;
}

export function CampfireUpgradeView({ onBack, onUsed }: Props) {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const upgradableDice = useMemo(() => {
    return game.ownedDice
      .map((d, i) => ({ defId: d.defId, level: d.level, index: i }))
      .filter(d => {
        const def = getDiceDef(d.defId);
        return d.level < DICE_MAX_LEVEL;
      });
  }, [game.ownedDice]);

  const target = selectedIdx !== null ? game.ownedDice[selectedIdx] : null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
      <div className="flex items-center gap-2 mb-1 mt-4 relative z-10">
        <PixelDice size={3} />
        <h2 className="text-lg font-black pixel-text-shadow tracking-wide">◆ 升级骰子 ◆</h2>
      </div>
      <p className="text-[var(--dungeon-text-dim)] mb-5 text-[9px] text-center relative z-10">
        消耗金币强化骰子，提升特殊效果（伤害/倍率/元素等）。最高 Lv.{DICE_MAX_LEVEL}。
      </p>

      <div className="space-y-3 w-full max-w-sm pb-6 relative z-10">
        {upgradableDice.length === 0 ? (
          <div className="text-center py-10 text-[var(--dungeon-text-dim)] text-xs">所有骰子已满级！</div>
        ) : (
          <div className="flex justify-center gap-2.5 flex-wrap">
            {upgradableDice.map(d => (
              <DiceSelectCard
                key={d.index}
                defId={d.defId}
                level={d.level}
                index={d.index}
                isSelected={selectedIdx === d.index}
                selectColor="gold"
                onSelect={() => setSelectedIdx(selectedIdx === d.index ? null : d.index)}
              />
            ))}
          </div>
        )}

        {target && (() => {
          const def = getDiceDef(target.defId);
          const currentFaces = getUpgradedFaces(def, target.level);
          const nextFaces = getUpgradedFaces(def, target.level + 1);
          const upgradeCost = CAMPFIRE_CONFIG.upgradeCostPerLevel * target.level;
          const canUpgrade = game.souls >= upgradeCost;
          const onPlayDesc = getOnPlayDescription(def.onPlay);

          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pixel-panel p-3 mt-3">
              <div className="text-center text-xs font-bold text-[var(--dungeon-text-bright)] mb-2 pixel-text-shadow">
                {def.name} 强化预览
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px]">
                <span className="text-[var(--dungeon-text-dim)]">Lv.{target.level} [{currentFaces.join(',')}]</span>
                <span className="text-[var(--pixel-gold)]">→</span>
                <span className="text-[var(--pixel-cyan)]">Lv.{target.level + 1} [{nextFaces.join(',')}]</span>
              </div>
              <div className="text-[9px] text-[var(--pixel-gold)] text-center mt-1 font-bold">
                {canUpgrade ? `费用: ${upgradeCost} 金币` : <span className="text-[var(--pixel-red)]">{`金币不足 (需要 ${upgradeCost})`}</span>}
              </div>
              {onPlayDesc && (
                <div className="text-[8px] text-[var(--pixel-cyan)] text-center mt-1">
                  出牌效果: {onPlayDesc} {target.level < DICE_MAX_LEVEL - 1 ? '(效果+50%)' : ''}
                  {(() => {
                    const currentOp = getUpgradedOnPlay(def, target.level);
                    const nextOp = getUpgradedOnPlay(def, target.level + 1);
                    if (!currentOp || !nextOp) return null;
                    const changes = [];
                    if (currentOp.bonusDamage !== nextOp.bonusDamage) changes.push(`伤害: ${currentOp.bonusDamage} → ${nextOp.bonusDamage}`);
                    if (currentOp.bonusMult !== nextOp.bonusMult) changes.push(`倍率: +${Math.round((currentOp.bonusMult - 1) * 100)}% → +${Math.round((nextOp.bonusMult - 1) * 100)}%`);
                    if (currentOp.selfDamage !== nextOp.selfDamage) changes.push(`副作用: ${currentOp.selfDamage} → ${nextOp.selfDamage}`);
                    if (changes.length === 0) return null;
                    return <div className="text-[9px] text-[var(--pixel-cyan)] mt-0.5">特效升级: {changes.join(", ")}</div>;
                  })()}
                </div>
              )}
              <button
                disabled={!canUpgrade}
                onClick={() => {
                  if (!canUpgrade) { addToast('金币不足！'); return; }
                  playSound('armor');
                  const newLevel = target.level + 1;
                  setGame(prev => {
                    const newOwned = [...prev.ownedDice];
                    newOwned[selectedIdx!] = { ...newOwned[selectedIdx!], level: newLevel };
                    return { ...prev, souls: prev.souls - upgradeCost, stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + upgradeCost }, ownedDice: newOwned };
                  });
                  addLog(`${def.name} 已强化至 Lv.${target.level + 1}！`);
                  addToast(`▲ ${def.name} 升级到 Lv.${target.level + 1}!`, 'buff');
                  onUsed();
                  setTimeout(() => setGame(prev => ({ ...prev, phase: 'map' })), 800);
                }}
                className="w-full py-2 mt-2 pixel-btn pixel-btn-primary text-[10px] disabled:opacity-30"
              >
                {`升级 (${CAMPFIRE_CONFIG.upgradeCostPerLevel * target.level} 金币)`}
              </button>
            </motion.div>
          );
        })()}

        <button onClick={() => { onBack(); setSelectedIdx(null); }} className="w-full py-2.5 mt-3 pixel-btn pixel-btn-ghost text-xs font-bold">
          返回
        </button>
      </div>
    </div>
  );
}
