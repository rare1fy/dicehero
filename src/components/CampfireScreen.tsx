import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { getDiceDef, getUpgradedFaces, DICE_MAX_LEVEL } from '../data/dice';
import { playSound } from '../utils/sound';
import { PixelCampfire, PixelHeart, PixelCoin, PixelDice } from './PixelIcons';
import { ElementBadge, getOnPlayDescription, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { ELEMENT_COLORS, getDiceElementClass } from '../utils/uiHelpers';
import { CAMPFIRE_CONFIG } from '../config';

export const CampfireScreen: React.FC = () => {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [campfireView, setCampfireView] = useState<'main' | 'upgrade'>('main');
  const [selectedDiceIdx, setSelectedDiceIdx] = useState<number | null>(null);

  const upgradableDice = useMemo(() => {
    return game.ownedDice
      .map((d, i) => ({ ...d, index: i }))
      .filter(d => d.level < DICE_MAX_LEVEL);
  }, [game.ownedDice]);

  if (campfireView === 'upgrade') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
        <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
        <div className="flex items-center gap-2 mb-1 mt-4 relative z-10">
          <PixelDice size={3} />
          <h2 className="text-lg font-black pixel-text-shadow tracking-wide">◆ 强化骰子 ◆</h2>
        </div>
        <p className="text-[var(--dungeon-text-dim)] mb-5 text-[9px] text-center relative z-10">
          消耗金币强化骰子，每面点数+1，效果增强50%。最高 Lv.{DICE_MAX_LEVEL}。
        </p>
        
        <div className="space-y-3 w-full max-w-sm pb-6 relative z-10">
          {upgradableDice.length === 0 ? (
            <div className="text-center py-10 text-[var(--dungeon-text-dim)] text-xs">所有骰子已满级！</div>
          ) : (
            <div className="flex justify-center gap-2.5 flex-wrap">
              {upgradableDice.map((d) => {
                const def = getDiceDef(d.defId);
                const currentFaces = getUpgradedFaces(def, d.level);
                const upgradeCost = d.level * CAMPFIRE_CONFIG.upgradeCostPerLevel;
                const isSelected = selectedDiceIdx === d.index;

                return (
                  <motion.button
                    key={d.index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDiceIdx(isSelected ? null : d.index)}
                    className={`relative flex flex-col items-center p-3 border-2 transition-all min-w-[90px] ${
                      isSelected
                        ? 'border-[var(--pixel-gold)] bg-[rgba(212,160,48,0.15)] shadow-[0_0_12px_rgba(212,160,48,0.4)]'
                        : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.25)]'
                    }`}
                    style={{ borderRadius: '4px' }}
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
                      d.level >= 3 ? 'text-[var(--pixel-gold)]' : d.level >= 2 ? 'text-[var(--pixel-cyan)]' : 'text-[var(--dungeon-text-dim)]'
                    }`}>
                      Lv.{d.level}
                    </div>
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] mb-0.5">
                      [{currentFaces.join(',')}]
                    </div>
                    <div className="flex items-center gap-0.5 text-[var(--pixel-gold)] font-mono text-[8px] mt-0.5">
                      {upgradeCost} <PixelCoin size={1.5} />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--pixel-gold)] rounded-full flex items-center justify-center"
                      >
                        <span className="text-[8px] text-black font-black">●</span>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {selectedDiceIdx !== null && (() => {
            const target = game.ownedDice[selectedDiceIdx];
            if (!target) return null;
            const def = getDiceDef(target.defId);
            const currentFaces = getUpgradedFaces(def, target.level);
            const nextFaces = getUpgradedFaces(def, target.level + 1);
            const upgradeCost = target.level * CAMPFIRE_CONFIG.upgradeCostPerLevel;
            const canUpgrade = game.souls >= upgradeCost;
            const onPlayDesc = getOnPlayDescription(def.onPlay);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pixel-panel p-3 mt-3"
              >
                <div className="text-center text-xs font-bold text-[var(--dungeon-text-bright)] mb-2 pixel-text-shadow">
                  {def.name} 强化预览
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-[var(--dungeon-text-dim)]">Lv.{target.level} [{currentFaces.join(',')}]</span>
                  <span className="text-[var(--pixel-gold)]">→</span>
                  <span className="text-[var(--pixel-cyan)]">Lv.{target.level + 1} [{nextFaces.join(',')}]</span>
                </div>
                {onPlayDesc && (
                  <div className="text-[8px] text-[var(--pixel-cyan)] text-center mt-1">
                    出牌效果: {onPlayDesc} {target.level < DICE_MAX_LEVEL - 1 ? '(效果+50%)' : ''}
                  </div>
                )}
                <button
                  disabled={!canUpgrade}
                  onClick={() => {
                    playSound('armor');
                    const newLevel = target.level + 1;
                    setGame(prev => {
                      const newOwned = [...prev.ownedDice];
                      newOwned[selectedDiceIdx] = { ...newOwned[selectedDiceIdx], level: newLevel };
                      return {
                        ...prev,
                        souls: prev.souls - upgradeCost,
                        ownedDice: newOwned,
                        phase: 'map',
                      };
                    });
                    addLog(`${def.name} 已强化至 Lv.${target.level + 1}！`);
                    addToast(`▲ ${def.name} 升级到 Lv.${target.level + 1}!`, 'buff');
                  }}
                  className="w-full py-2 mt-2 pixel-btn pixel-btn-primary text-[10px] disabled:opacity-30"
                >
                  {canUpgrade ? `强化 (${upgradeCost} 金币)` : `金币不足 (需要 ${upgradeCost})`}
                </button>
              </motion.div>
            );
          })()}
          
          <button 
            onClick={() => { setCampfireView('main'); setSelectedDiceIdx(null); }}
            className="w-full py-2.5 mt-3 pixel-btn pixel-btn-ghost text-xs font-bold"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] relative">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center">
        <PixelCampfire size={4} />
        <h2 className="text-lg font-black mb-2 pixel-text-shadow tracking-wide mt-1">◆ 篑火营地 ◆</h2>
        <p className="text-[var(--dungeon-text-dim)] mb-8 text-[9px]">在永夜中短暂的温暖。</p>
        
        <div className="space-y-3 w-full max-w-xs">
          <button 
            onClick={() => {
              addToast('篑火休整 +' + CAMPFIRE_CONFIG.restHeal + ' HP', 'heal');
              playSound('heal');
              setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + CAMPFIRE_CONFIG.restHeal), phase: 'map' }));
            }}
            className="w-full p-4 pixel-panel flex items-center justify-between transition-all group"
            style={{ borderColor: 'var(--pixel-orange)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-orange)] pixel-text-shadow">休整</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">回复 {CAMPFIRE_CONFIG.restHeal} 点生命值。</div>
            </div>
            <PixelHeart size={4} />
          </button>

          <button 
            onClick={() => setCampfireView('upgrade')}
            className="w-full p-4 pixel-panel flex items-center justify-between transition-all group"
            style={{ borderColor: 'var(--pixel-cyan)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-cyan)] pixel-text-shadow">强化骰子</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">消耗金币升级骰子，提升点数和效果</div>
            </div>
            <PixelDice size={4} />
          </button>
        </div>
      </div>
    </div>
  );
};
