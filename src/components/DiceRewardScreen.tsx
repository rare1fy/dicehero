import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { getDiceDef, getDiceRewardPool, getUpgradedFaces } from '../data/dice';
import { ElementBadge, getOnPlayDescription, RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';

import { MiniDice } from './DiceBagPanel';
import { ELEMENT_COLORS, getDiceElementClass } from '../utils/uiHelpers';
import { playSound } from '../utils/sound';

type RewardTab = 'newDice';

export const DiceRewardScreen: React.FC = () => {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [activeTab, setActiveTab] = useState<RewardTab>('newDice');
  const [selectedNewDice, setSelectedNewDice] = useState<string | null>(null);
  
    const [confirmed, setConfirmed] = useState(false);

  // 根据战斗类型决定奖励池
  const battleType = useMemo(() => {
    const node = game.map.find(n => n.id === game.currentNodeId);
    const t = node?.type; return (t === 'elite' || t === 'boss') ? t : 'enemy';
  }, [game.currentNodeId, game.map]);

  // 3选1新骰子 - 已有骰子权重提高但不保证必出
  const diceOptions = useMemo(() => {
    const pool = getDiceRewardPool(battleType);
    const result: typeof pool = [];
    
    // 已有骰子权重提高（不保证必出，但概率更高）
    const ownedSpecialIds = new Set(
      game.ownedDice
        .map(d => d.defId)
        .filter(id => !['standard', 'heavy', 'blade', 'cursed', 'cracked'].includes(id))
    );
    
    // 加权随机：已有骰子权重x3，其余权重x1
    const weighted: typeof pool = [];
    pool.forEach(d => {
      const weight = ownedSpecialIds.has(d.id) ? 3 : 1;
      for (let w = 0; w < weight; w++) weighted.push(d);
    });
    
    // 从加权池中抽取3个不重复的
    const shuffled = [...weighted].sort(() => Math.random() - 0.5);
    const seen = new Set();
    for (const d of shuffled) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        result.push(d);
        if (result.length >= 3) break;
      }
    }
    
    return result;
  }, [battleType, game.ownedDice]);


  // 可移除的骰子（至少保留4颗）

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
      addToast(`◆ 获得 ${def.name}!`, 'buff');
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
    const _elemColor = ELEMENT_COLORS[def.element] || '#888';
    const _rarityColor = RARITY_COLORS[def.rarity] || '#666';
    const onPlayDesc = getOnPlayDescription(def.onPlay);

    return (
      <motion.button
        key={defId + '-' + level}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative flex flex-col items-center p-2 rounded border-2 transition-all min-w-[80px] max-w-[100px] flex-1 ${
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
            {'?'}
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
            <span className="text-[8px] text-black font-black">●</span>
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
          { id: 'newDice' as RewardTab, label: '获取新骰子', icon: '' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => { if (!('disabled' in tab && tab.disabled)) { setActiveTab(tab.id); setSelectedNewDice(null); } }}
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
              className="flex justify-center gap-2 px-1"
            >
              {diceOptions.map(def => renderDiceCard(
                def.id, 1, selectedNewDice === def.id,
                () => setSelectedNewDice(selectedNewDice === def.id ? null : def.id),
                false
              ))}
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
          disabled={confirmed || !selectedNewDice}
          className={`px-6 py-2 text-[9px] font-bold transition-all ${
            confirmed || !selectedNewDice
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
          {game.ownedDice.map((d, i) => (
            <div key={i} title={`${getDiceDef(d.defId).name} Lv.${d.level}`}>
              <MiniDice defId={d.defId} size={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
