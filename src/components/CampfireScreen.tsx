import React, { useState, useMemo } from 'react';
import { MiniDice } from './DiceBagPanel';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { getDiceDef, getUpgradedFaces, getUpgradedOnPlay, DICE_MAX_LEVEL } from '../data/dice';
import { playSound } from '../utils/sound';
import { PixelCampfire, PixelHeart, PixelDice, PixelFlame, PixelSoulCrystal } from './PixelIcons';
import { ElementBadge, getOnPlayDescription, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { getDiceElementClass } from '../utils/uiHelpers';
import { CAMPFIRE_CONFIG } from '../config';

export const CampfireScreen: React.FC = () => {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [campfireView, setCampfireView] = useState<'main' | 'upgrade' | 'purify'>('main');
  const [selectedDiceIdx, setSelectedDiceIdx] = useState<number | null>(null);
  const [campfireUsed, setCampfireUsed] = useState(false);
  
  const upgradableDice = useMemo(() => {
    return game.ownedDice
      .map((d, i) => ({ ...d, index: i }))
      .filter(d => {
        const def = getDiceDef(d.defId);
        return d.level < DICE_MAX_LEVEL; // 仅特殊骰子，最多升级一次到Lv2
      });
  }, [game.ownedDice]);

  


  const purifiableDice = useMemo(() => {
    return game.ownedDice
      .map((d, i) => ({ ...d, index: i }))
      ; // all dice can be purified
  }, [game.ownedDice]);

  if (campfireView === 'purify') {
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
              {purifiableDice.map((d) => {
                const def = getDiceDef(d.defId);
                const currentFaces = getUpgradedFaces(def, d.level);
                const isSelected = selectedDiceIdx === d.index;

                return (
                  <motion.button
                    key={d.index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDiceIdx(isSelected ? null : d.index)}
                    className={`relative flex flex-col items-center p-3 border-2 transition-all min-w-[90px] ${
                      isSelected
                        ? 'border-[var(--pixel-red)] bg-[rgba(224,60,49,0.15)] shadow-[0_0_12px_rgba(224,60,49,0.4)]'
                        : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.25)]'
                    }`}
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
                      d.level >= 3 ? 'text-[var(--pixel-gold)]' : d.level >= 2 ? 'text-[var(--pixel-cyan)]' : 'text-[var(--dungeon-text-dim)]'
                    }`}>
                      Lv.{d.level}
                    </div>
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] mb-0.5">
                      [{currentFaces.join(',')}]
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--pixel-red)] flex items-center justify-center" style={{ borderRadius: '2px' }}
                      >
                        <span className="text-[8px] text-white font-black">{'✖'}</span>
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
            const onPlayDesc = getOnPlayDescription(def.onPlay);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pixel-panel p-3 mt-3"
              >
                <div className="text-center text-xs font-bold text-[var(--pixel-red)] mb-2 pixel-text-shadow">
                  确认移除
                </div>
                <div className="text-center text-[10px] text-[var(--dungeon-text-bright)]">
                  {def.name} Lv.{target.level} [{currentFaces.join(',')}]
                </div>
                {onPlayDesc && (
                  <div className="text-[8px] text-[var(--pixel-cyan)] text-center mt-1">
                    出牌效果: {onPlayDesc}
                  </div>
                )}
                <div className="text-[9px] text-[var(--pixel-orange)] text-center mt-1 font-bold">
                  {game.ownedDice.length <= 6 ? '骰子库已达最少数量（6颗），无法移除' : '免费移除（不可撤回）'}
                </div>
                <button
                  disabled={game.ownedDice.length <= 6}
                  onClick={() => {
                    if (game.ownedDice.length <= 6) return;
                    playSound('enemy_skill');
                    setGame(prev => {
                      const newOwned = prev.ownedDice.filter((_: any, i: number) => i !== selectedDiceIdx);
                      return { ...prev, ownedDice: newOwned };
                    });
                    addLog(`${def.name} 已被净化移除。`);
                    addToast(`✖ ${def.name} 已永久移除`, 'damage');
                    setCampfireUsed(true);
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

  if (campfireView === 'upgrade') {
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
              {upgradableDice.map((d) => {
                const def = getDiceDef(d.defId);
                const currentFaces = getUpgradedFaces(def, d.level);
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
                      d.level >= 3 ? 'text-[var(--pixel-gold)]' : d.level >= 2 ? 'text-[var(--pixel-cyan)]' : 'text-[var(--dungeon-text-dim)]'
                    }`}>
                      Lv.{d.level}
                    </div>
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] mb-0.5">
                      [{currentFaces.join(',')}]
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--pixel-gold)] flex items-center justify-center" style={{ borderRadius: '2px' }}
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
            const upgradeCost = CAMPFIRE_CONFIG.upgradeCostPerLevel * target.level;
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
                  if (currentOp.bonusMult !== nextOp.bonusMult) changes.push(`倍率: ${currentOp.bonusMult} → ${nextOp.bonusMult}`);
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
                      newOwned[selectedDiceIdx] = { ...newOwned[selectedDiceIdx], level: newLevel };
                      return {
                        ...prev,
                        souls: prev.souls - upgradeCost,
                        stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + upgradeCost },
                                                ownedDice: newOwned,
                      };
                    });
                    addLog(`${def.name} 已强化至 Lv.${target.level + 1}！`);
                    addToast(`▲ ${def.name} 升级到 Lv.${target.level + 1}!`, 'buff');
                    setCampfireUsed(true);
                    setTimeout(() => setGame(prev => ({ ...prev, phase: 'map' })), 800);
                  }}
                  className="w-full py-2 mt-2 pixel-btn pixel-btn-primary text-[10px] disabled:opacity-30"
                >
                  {`升级 (${selectedDiceIdx !== null ? CAMPFIRE_CONFIG.upgradeCostPerLevel * (game.ownedDice[selectedDiceIdx]?.level || 1) : 0} 金币)`}
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
        <h2 className="text-lg font-black mb-1 pixel-text-shadow tracking-wide mt-1">◆ 篝火营地 ◆</h2>
        <p className="text-[var(--dungeon-text-dim)] mb-2 text-[9px]">在永夜中短暂的温暖。</p>
        <p className="text-[8px] mb-6 px-4 text-center leading-relaxed">
          <span className="text-[var(--pixel-orange)] font-bold">※ 营地只能选择一项行动 ※</span>
          <br />
          <span className="text-[var(--dungeon-text-dim)]">休整、强化、净化、撤离</span>
          <span className="text-[var(--pixel-red)] font-bold"> 只能执行其中一项</span>
          <span className="text-[var(--dungeon-text-dim)]">，选择后立即离开营地。</span>
        </p>
        
        <div className="space-y-3 w-full max-w-xs">
          <button 
            disabled={campfireUsed}
            onClick={() => {
              addToast('篝火休整 +' + CAMPFIRE_CONFIG.restHeal + ' HP', 'heal');
              playSound('heal');
              setCampfireUsed(true);
              setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + CAMPFIRE_CONFIG.restHeal), phase: 'map' }));
            }}
            className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ borderColor: 'var(--pixel-orange)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-orange)] pixel-text-shadow">休整</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">回复 {CAMPFIRE_CONFIG.restHeal} 点生命值</div>
            </div>
            <PixelHeart size={4} />
          </button>

          <button 
            disabled={campfireUsed}
            onClick={() => setCampfireView('upgrade')}
            className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ borderColor: 'var(--pixel-cyan)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-cyan)] pixel-text-shadow">强化骰子</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">消耗金币升级骰子，提升点数和效果</div>
            </div>
            {selectedDiceIdx !== null ? <MiniDice defId={game.ownedDice[selectedDiceIdx]?.defId || "standard"} size={32} /> : <PixelDice size={4} />}
          </button>

          <button 
            disabled={campfireUsed}
            onClick={() => setCampfireView('purify')}
            className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ borderColor: 'var(--pixel-red)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-red)] pixel-text-shadow">净化骰子</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">免费移除一颗骰子，精简骰子库</div>
            </div>
            <PixelFlame size={4} />
          </button>

          {/* 魂晶撤离 */}
          {(game.blackMarketQuota || 0) > 0 && (
            <button 
              disabled={campfireUsed}
              onClick={() => {
                const quota = game.blackMarketQuota || 0;
                if (quota <= 0) return;
                playSound('coin');
                setCampfireUsed(true);
                setGame(prev => ({
                  ...prev,
                  blackMarketQuota: 0,
                  evacuatedQuota: (prev.evacuatedQuota || 0) + quota,
                  soulCrystalMultiplier: 1.0, // 撤离后倍率重置为1
                  phase: 'map',
                }));
                addToast('+' + quota + ' 魂晶已安全撤离！倍率重置为1.0', 'gold');
                addLog('营火撤离: ' + quota + ' 魂晶已转移至安全区，倍率重置');
              }}
              className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={{ borderColor: '#a855f7' }}
            >
              <div className="text-left">
                <div className="text-base font-bold text-purple-400 pixel-text-shadow">魂晶撤离</div>
                <div className="text-[9px] text-[var(--dungeon-text-dim)]">
                  将 <span className="text-purple-300 font-bold">{game.blackMarketQuota || 0}</span> 魂晶转入安全区（死亡不丢失）
                </div>
                <div className="text-[8px] text-[var(--pixel-orange)] mt-0.5">
                  ⚠ 撤离后<span className="font-bold">倍率重置为×1.0</span>，不撤离可继续贪倍率
                </div>
              </div>
              <PixelSoulCrystal size={4} />
            </button>
          )}

          {/* 已使用提示 + 离开 */}
          {campfireUsed && (
            <div className="text-center text-[9px] text-[var(--dungeon-text-dim)] mt-2">已执行营地行动</div>
          )}
          {!campfireUsed && (
            <button
              onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
              className="w-full py-2.5 mt-2 pixel-btn pixel-btn-ghost text-xs font-bold opacity-60"
            >
              跳过，直接离开
            </button>
          )}

        </div>
      </div>
    </div>
  );
};