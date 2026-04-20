/**
 * CampfirePurifyView.tsx — 篝火净化骰子视图
 *
 * 从 CampfireScreen.tsx 提取（ARCH-G）。
 * 独立组件：骰子选择 + 净化确认 + 移除按钮
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { getDiceDef, getUpgradedFaces } from '../data/dice';
import { playSound } from '../utils/sound';
import { PixelFlame } from './PixelIcons';
import { getOnPlayDescription } from './PixelDiceShapes';
import { DiceSelectCard } from './DiceSelectCard';

interface Props {
  onBack: () => void;
  onUsed: () => void;
}

export function CampfirePurifyView({ onBack, onUsed }: Props) {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const purifiableDice = useMemo(() => {
    return game.ownedDice
      .map((d, i) => ({ defId: d.defId, level: d.level, index: i }));
  }, [game.ownedDice]);

  const target = selectedIdx !== null ? game.ownedDice[selectedIdx] : null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
      <div className="flex items-center gap-2 mb-1 mt-4 relative z-10">
        <PixelFlame size={3} />
        <h2 className="text-lg font-black pixel-text-shadow tracking-wide">{'✦'} 净化骰子 {'✦'}</h2>
      </div>
      <p className="text-[var(--dungeon-text-dim)] mb-5 text-[9px] text-center relative z-10">
        将一颗骰子投入篝火中净化，永久移除。骰子库最少保留 6 颗。
      </p>

      <div className="space-y-3 w-full max-w-sm pb-6 relative z-10">
        {purifiableDice.length === 0 ? (
          <div className="text-center py-10 text-[var(--dungeon-text-dim)] text-xs">没有可移除的骰子</div>
        ) : (
          <div className="flex justify-center gap-2.5 flex-wrap">
            {purifiableDice.map(d => (
              <DiceSelectCard
                key={d.index}
                defId={d.defId}
                level={d.level}
                index={d.index}
                isSelected={selectedIdx === d.index}
                selectColor="red"
                onSelect={() => setSelectedIdx(selectedIdx === d.index ? null : d.index)}
              />
            ))}
          </div>
        )}

        {target && (() => {
          const def = getDiceDef(target.defId);
          const currentFaces = getUpgradedFaces(def, target.level);
          const onPlayDesc = getOnPlayDescription(def.onPlay);

          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pixel-panel p-3 mt-3">
              <div className="text-center text-xs font-bold text-[var(--pixel-red)] mb-2 pixel-text-shadow">确认移除</div>
              <div className="text-center text-[10px] text-[var(--dungeon-text-bright)]">{def.name} Lv.{target.level} [{currentFaces.join(',')}]</div>
              {onPlayDesc && <div className="text-[8px] text-[var(--pixel-cyan)] text-center mt-1">出牌效果: {onPlayDesc}</div>}
              <div className="text-[9px] text-[var(--pixel-orange)] text-center mt-1 font-bold">
                {game.ownedDice.length <= 6 ? '骰子库已达最少数量（6颗），无法移除' : '免费移除（不可撤回）'}
              </div>
              <button
                disabled={game.ownedDice.length <= 6}
                onClick={() => {
                  if (game.ownedDice.length <= 6) return;
                  playSound('enemy_skill');
                  setGame(prev => {
                    const newOwned = prev.ownedDice.filter((_, i) => i !== selectedIdx);
                    return { ...prev, ownedDice: newOwned };
                  });
                  addLog(`${def.name} 已被净化移除。`);
                  addToast(`✖ ${def.name} 已永久移除`, 'damage');
                  onUsed();
                  setTimeout(() => setGame(prev => ({ ...prev, phase: 'map' })), 800);
                }}
                className="w-full py-2 mt-2 pixel-btn text-[10px]"
                style={{ background: 'var(--pixel-red)', color: 'white' }}
              >
                确认净化
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
