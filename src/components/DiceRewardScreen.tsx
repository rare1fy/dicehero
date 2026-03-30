import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { OwnedDie } from '../types/game';
import { getDiceDef, pickRandomDice, getDiceRewardPool, DICE_MAX_LEVEL, getUpgradedFaces } from '../data/dice';
import { ElementBadge, getOnPlayDescription, RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { PixelDice, PixelStar, PixelArrowUp, PixelClose } from './PixelIcons';
import { ELEMENT_NAMES, ELEMENT_COLORS, getDiceElementClass } from '../utils/uiHelpers';
import { playSound } from '../utils/sound';

type RewardTab = 'newDice' | 'upgrade' | 'remove';

export const DiceRewardScreen: React.FC = () => {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [activeTab, setActiveTab] = useState<RewardTab>('newDice');
  const [selectedNewDice, setSelectedNewDice] = useState<string | null>(null);
  const [selectedUpgradeDice, setSelectedUpgradeDice] = useState<number | null>(null);
  const [selectedRemoveDice, setSelectedRemoveDice] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // 根据战斗类型决定奖励池
  const battleType = useMemo(() => {
    const node = game.map.find(n => n.id === game.currentNodeId);
    return (node?.type as 'enemy' | 'elite' | 'boss') || 'enemy';
  }, [game.currentNodeId, game.map]);

  // 3选1新骰子
  const diceOptions = useMemo(() => {
    const pool = getDiceRewardPool(battleType);
    return pickRandomDice(pool, 3);
  }, [battleType]);

  // 可升级的骰子（等级 < MAX）
  const upgradableDice = useMemo(() => {
    return game.ownedDice
      .map((d, i) => ({ ...d, index: i }))
      .filter(d => d.level < DICE_MAX_LEVEL);
  }, [game.ownedDice]);

  // 可移除的骰子（至少保留4颗）
  const removableDice = useMemo(() => {
    if (game.ownedDice.length <= 4) return [];
    return game.ownedDice.map((d, i) => ({ ...d, index: i }));
  }, [game.ownedDice]);

  const handleConfirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    playSound('select');

    if (activeTab === 'newDice' && selectedNewDice) {
      const def = getDiceDef(selectedNewDice);
      setGame(prev => ({
        ...prev,
        ownedDice: [...prev.ownedDice, { defId: selectedNewDice, level: 1 }],
      }));
      addLog(`获得新骰子: ${def.name}`);
      addToast(`🎲 获得 ${def.name}!`, 'buff');
    } else if (activeTab === 'upgrade' && selectedUpgradeDice !== null) {
      const target = game.ownedDice[selectedUpgradeDice];
      const def = getDiceDef(target.defId);
      const newLevel = target.level + 1;
      setGame(prev => {
        const newOwned = [...prev.ownedDice];
        newOwned[selectedUpgradeDice] = { ...newOwned[selectedUpgradeDice], level: newLevel };
        return { ...prev, ownedDice: newOwned };
      });
      addLog(`升级骰子: ${def.name} → Lv.${newLevel}`);
      addToast(`⬆️ ${def.name} 升级到 Lv.${newLevel}!`, 'buff');
    } else if (activeTab === 'remove' && selectedRemoveDice !== null) {
      const target = game.ownedDice[selectedRemoveDice];
      const def = getDiceDef(target.defId);
      setGame(prev => ({
        ...prev,
        ownedDice: prev.ownedDice.filter((_, i) => i !== selectedRemoveDice),
      }));
      addLog(`移除骰子: ${def.name}`);
      addToast(`🗑️ 移除了 ${def.name}`, 'info');
    }

    // 延迟后跳转到 loot 阶段
    setTimeout(() => {
      setGame(prev => ({ ...prev, phase: 'loot' }));
    }, 600);
  };

  const handleSkip = () => {
    playSound('select');
    setGame(prev => ({ ...prev, phase: 'loot' }));
  };

  const renderDiceCard = (defId: string, level: number, isSelected: boolean, onClick: () => void, showLevel = true) => {
    const def = getDiceDef(defId);
    const faces = getUpgradedFaces(def, level);
    const avgVal = (faces.reduce((a, b) => a + b, 0) / faces.length).toFixed(1);
    const elemColor = ELEMENT_COLORS[def.element] || '#888';
    const rarityColor = RARITY_COLORS[def.rarity] || '#666';
    const onPlayDesc = getOnPlayDescription(def.onPlay);

    return (
      <motion.button
        key={defId + '-' + level}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative flex flex-col items-center p-3 rounded border-2 transition-all min-w-[100px] ${
          isSelected
            ? 'border-[var(--pixel-gold)] bg-[rgba(212,160,48,0.15)] shadow-[0_0_12px_rgba(212,160,48,0.4)]'
            : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.25)]'
        }`}
        style={{ borderRadius: '4px' }}
      >
        {/* 稀有度标签 */}
        <div className="text-[8px] font-bold tracking-wider mb-1" style={{ color: RARITY_TEXT_COLORS[def.rarity] || '#888' }}>
          {RARITY_LABELS[def.rarity] || def.rarity}
        </div>

        {/* 骰子 - 用真实游戏内样式渲染 */}
        <div className="relative mb-1.5">
          <div
            className={`${getDiceElementClass(def.element, isSelected, false, false, defId)} relative flex items-center justify-center`}
            style={{ width: '40px', height: '40px', fontSize: '18px', lineHeight: '40px' }}
          >
            {faces[0]}
          </div>
          {def.element !== 'normal' && (
            <div className="absolute -top-1 -right-1 z-10">
              <ElementBadge element={def.element} size={14} />
            </div>
          )}
        </div>

        {/* 名称 */}
        <div className="text-[10px] font-bold text-[var(--dungeon-text-bright)] mb-0.5 text-center leading-tight">
          {def.name}
        </div>

        {/* 等级 */}
        {showLevel && level > 0 && (
          <div className={`text-[7px] font-bold mb-0.5 ${
            level >= 3 ? 'text-[var(--pixel-gold)]' : level >= 2 ? 'text-[var(--pixel-cyan)]' : 'text-[var(--dungeon-text-dim)]'
          }`}>
            Lv.{level}
          </div>
        )}

        {/* 面值 */}
        <div className="text-[8px] text-[var(--dungeon-text-dim)] mb-0.5">
          [{faces.join(',')}] 均值{avgVal}
        </div>

        {/* onPlay效果 */}
        {onPlayDesc && (
          <div className="text-[7px] text-[var(--pixel-cyan)] leading-tight text-center">
            {onPlayDesc}
          </div>
        )}

        {/* 选中标记 */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--pixel-gold)] rounded-full flex items-center justify-center"
          >
            <span className="text-[8px] text-black font-black">✓</span>
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />

      {/* 标题 */}
      <div className="text-center mb-3 mt-3 relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block px-3 py-1 bg-[var(--pixel-cyan-dark)] border-2 border-[var(--pixel-cyan)] text-[var(--pixel-cyan-light)] text-[9px] font-bold tracking-[0.15em] mb-3"
          style={{ borderRadius: '2px' }}
        >
          ◆ DICE BUILD ◆
        </motion.div>
        <h2 className="text-xl font-black text-[var(--dungeon-text-bright)] pixel-text-shadow leading-none tracking-wide">
          骰子构筑
        </h2>
        <p className="text-[var(--dungeon-text-dim)] text-[8px] tracking-[0.15em] mt-2 font-bold">
          强化你的骰子库
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex justify-center gap-1.5 mb-3 px-4 relative z-10">
        {([
          { id: 'newDice' as RewardTab, label: '获取新骰子', icon: '🆕' },
          { id: 'upgrade' as RewardTab, label: '升级骰子', icon: '⬆️', disabled: upgradableDice.length === 0 },
          { id: 'remove' as RewardTab, label: '移除骰子', icon: '🗑️', disabled: removableDice.length === 0 },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => { if (!('disabled' in tab && tab.disabled)) { setActiveTab(tab.id); setSelectedNewDice(null); setSelectedUpgradeDice(null); setSelectedRemoveDice(null); } }}
            disabled={'disabled' in tab && tab.disabled}
            className={`px-3 py-1.5 text-[9px] font-bold rounded transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold)]'
                : 'disabled' in tab && tab.disabled
                  ? 'bg-[rgba(255,255,255,0.02)] text-[var(--dungeon-text-dim)] border border-[rgba(255,255,255,0.05)] opacity-40 cursor-not-allowed'
                  : 'bg-[rgba(255,255,255,0.05)] text-[var(--dungeon-text)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]'
            }`}
            style={{ borderRadius: '3px' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="px-4 relative z-10 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* 获取新骰子 */}
          {activeTab === 'newDice' && (
            <motion.div
              key="newDice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center gap-3 flex-wrap"
            >
              {diceOptions.map(def => renderDiceCard(
                def.id, 1, selectedNewDice === def.id,
                () => setSelectedNewDice(selectedNewDice === def.id ? null : def.id),
                false
              ))}
            </motion.div>
          )}

          {/* 升级骰子 */}
          {activeTab === 'upgrade' && (
            <motion.div
              key="upgrade"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-center text-[8px] text-[var(--dungeon-text-dim)] mb-2">
                升级后每面点数+1，效果增强50%
              </div>
              <div className="flex justify-center gap-2.5 flex-wrap">
                {upgradableDice.map(d => {
                  const def = getDiceDef(d.defId);
                  const nextFaces = getUpgradedFaces(def, d.level + 1);
                  return (
                    <div key={d.index} className="relative">
                      {renderDiceCard(
                        d.defId, d.level, selectedUpgradeDice === d.index,
                        () => setSelectedUpgradeDice(selectedUpgradeDice === d.index ? null : d.index)
                      )}
                      {/* 升级预览 */}
                      {selectedUpgradeDice === d.index && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -bottom-5 left-0 right-0 text-center text-[7px] text-[var(--pixel-green)]"
                        >
                          → Lv.{d.level + 1} [{nextFaces.join(',')}]
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* 移除骰子 */}
          {activeTab === 'remove' && (
            <motion.div
              key="remove"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-center text-[8px] text-[var(--dungeon-text-dim)] mb-2">
                瘦身构筑，移除不需要的骰子（至少保留4颗）
              </div>
              <div className="flex justify-center gap-2.5 flex-wrap">
                {removableDice.map(d => renderDiceCard(
                  d.defId, d.level, selectedRemoveDice === d.index,
                  () => setSelectedRemoveDice(selectedRemoveDice === d.index ? null : d.index)
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作栏 */}
      <div className="flex justify-center gap-3 p-3 mt-6 relative z-10">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-[9px] font-bold text-[var(--dungeon-text-dim)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] transition-all"
          style={{ borderRadius: '3px' }}
        >
          跳过
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirmed || (activeTab === 'newDice' && !selectedNewDice) || (activeTab === 'upgrade' && selectedUpgradeDice === null) || (activeTab === 'remove' && selectedRemoveDice === null)}
          className={`px-6 py-2 text-[9px] font-bold transition-all ${
            confirmed || (activeTab === 'newDice' && !selectedNewDice) || (activeTab === 'upgrade' && selectedUpgradeDice === null) || (activeTab === 'remove' && selectedRemoveDice === null)
              ? 'bg-[rgba(255,255,255,0.05)] text-[var(--dungeon-text-dim)] border border-[rgba(255,255,255,0.05)] cursor-not-allowed'
              : 'bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold)] hover:bg-[var(--pixel-gold)] hover:text-black'
          }`}
          style={{ borderRadius: '3px' }}
        >
          {confirmed ? '确认中...' : '确认选择'}
        </button>
      </div>

      {/* 当前骰子库概览 */}
      <div className="px-4 pb-3 relative z-10">
        <div className="text-[7px] text-[var(--dungeon-text-dim)] text-center mb-1">
          当前骰子库 ({game.ownedDice.length}颗)
        </div>
        <div className="flex justify-center gap-1 flex-wrap">
          {game.ownedDice.map((d, i) => {
            const def = getDiceDef(d.defId);
            const elemColor = ELEMENT_COLORS[def.element] || '#888';
            return (
              <div
                key={i}
                className="w-5 h-5 flex items-center justify-center rounded border border-[rgba(255,255,255,0.1)]"
                style={{ backgroundColor: `${elemColor}22`, borderRadius: '2px' }}
                title={`${def.name} Lv.${d.level}`}
              >
                <span className="text-[6px] font-bold" style={{ color: elemColor }}>
                  {d.level > 1 ? d.level : '·'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
