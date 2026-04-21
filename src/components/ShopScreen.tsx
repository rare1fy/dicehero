import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { playSound } from '../utils/sound';
import { PixelCoin, PixelStar, PixelDice, PixelFlame, PixelClose } from './PixelIcons';
import { getDiceDef, getUpgradedFaces } from '../data/dice';
import { ShopItem, GameState } from '../types/game';
import { MiniDice } from './MiniDice';
import { getDiceElementClass } from '../utils/uiHelpers';
import { PixelDiceRenderer, hasPixelRenderer } from './PixelDiceRenderer';
import { formatDescription } from '../utils/richText';
import { ElementBadge } from './PixelDiceShapes';
import { TreasureScreen } from './TreasureScreen';

// ============================================================
// 像素商人 SVG
// ============================================================
const PixelMerchant: React.FC<{ size?: number }> = ({ size = 4 }) => {
  const px = size;
  return (
    <svg width={px * 10} height={px * 12} viewBox="0 0 10 12" shapeRendering="crispEdges">
      <rect x="3" y="0" width="4" height="1" fill="#8B4513" />
      <rect x="2" y="1" width="6" height="1" fill="#A0522D" />
      <rect x="1" y="2" width="8" height="1" fill="#8B4513" />
      <rect x="3" y="3" width="4" height="3" fill="#FFDAB9" />
      <rect x="4" y="4" width="1" height="1" fill="#333" />
      <rect x="6" y="4" width="1" height="1" fill="#333" />
      <rect x="4" y="5" width="3" height="1" fill="#D2691E" opacity="0.6" />
      <rect x="2" y="6" width="6" height="4" fill="#4a2c6a" />
      <rect x="3" y="6" width="4" height="1" fill="#6a3c8a" />
      <rect x="4" y="7" width="2" height="1" fill="#d4a030" />
      <rect x="3" y="10" width="2" height="1" fill="#654321" />
      <rect x="6" y="10" width="2" height="1" fill="#654321" />
    </svg>
  );
};

// ============================================================
// 游荡商人界面（shop 节点）— 只卖3个商品，没有宝箱
// ============================================================
const MerchantScreen: React.FC = () => {
  const { game, setGame, pickReward, addToast, addLog } = useGameContext();
  const shopItems = game.shopItems || [];
  const [removeDiceMode, setRemoveDiceMode] = useState(false);
  const [removeDiceIdx, setRemoveDiceIdx] = useState<number | null>(null);

  useEffect(() => { playSound('event'); }, []);

  const buyItem = useCallback((item: ShopItem) => {
    if (game.souls < item.price) { addToast('金币不足'); return; }
    // removeDice: 扣金币后进入手动选择模式，不从商品列表移除
    if (item.type === 'removeDice') {
      playSound('shop_buy');
      setGame(prev => ({
        ...prev,
        souls: prev.souls - item.price,
        stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + item.price },
      }));
      addToast('✂ 选择要移除的骰子', 'gold');
      addLog('购买了骰子净化 (-' + item.price + 'g)');
      setRemoveDiceMode(true);
      return;
    }
    playSound('shop_buy');
    setGame(prev => {
      const newState: GameState = {
        ...prev,
        souls: prev.souls - item.price,
        stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + item.price },
        shopItems: prev.shopItems.filter(si => si.id !== item.id),
      };
      if (item.type === 'reroll') {
        newState.freeRerollsPerTurn = prev.freeRerollsPerTurn + 1;
      }
      if (item.type === 'dice' || item.type === 'specialDice') {
        newState.ownedDice = [...prev.ownedDice, { defId: item.diceDefId!, level: 1 }];
      }
      return newState;
    });
    if (item.type === 'relic' && item.relicData) {
      pickReward(item.relicData);
    }
    addToast('\u2705 购买成功: ' + item.label, 'gold');
    addLog('购买商品: ' + item.label + ' (-' + item.price + 'g)');
  }, [game.souls, setGame, pickReward, addToast, addLog]);

  // --- Remove Dice Selection Overlay ---
  if (removeDiceMode) {
    const removableDice = game.ownedDice
      .map((d, i) => ({ ...d, index: i }))
      ; // all dice can be removed
    
    return (
      <div className="flex flex-col items-center justify-start h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
        <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
        <div className="flex items-center gap-2 mb-1 mt-4 relative z-10">
          <PixelFlame size={3} />
          <h2 className="text-lg font-black pixel-text-shadow tracking-wide">选择要移除的骰子</h2>
        </div>
        <p className="text-[var(--dungeon-text-dim)] mb-4 text-[9px] text-center relative z-10">
          点击选择一颗骰子永久移除，最少保留6颗
        </p>
        <div className="flex justify-center gap-3 flex-wrap max-w-sm relative z-10">
          {removableDice.length === 0 ? (
            <div className="text-center py-10 text-[var(--dungeon-text-dim)] text-xs">没有可移除的骰子</div>
          ) : removableDice.map((d) => {
            const def = getDiceDef(d.defId);
            const faces = getUpgradedFaces(def, d.level);
            const isSelected = removeDiceIdx === d.index;
            const avgVal = (faces.reduce((a, b) => a + b, 0) / faces.length).toFixed(1);
            return (
              <motion.button
                key={d.index}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRemoveDiceIdx(isSelected ? null : d.index)}
                className={`relative flex flex-col items-center ${hasPixelRenderer(def.id) ? '' : getDiceElementClass(def.element, isSelected, false, false, def.id)}`}
                style={{
                  width: '64px', height: '72px', fontSize: hasPixelRenderer(def.id) ? '0' : '18px',
                  ...(hasPixelRenderer(def.id) ? { background: 'transparent', border: isSelected ? '2px solid var(--pixel-red)' : 'none', boxShadow: isSelected ? '0 0 14px rgba(224,60,49,0.5)' : 'none' } : {
                    borderColor: isSelected ? 'var(--pixel-red)' : undefined,
                    boxShadow: isSelected ? '0 0 14px rgba(224,60,49,0.5)' : undefined,
                  }),
                }}
              >
                {hasPixelRenderer(def.id) ? (
                  <PixelDiceRenderer diceDefId={def.id} value={avgVal} size={48} selected={isSelected} />
                ) : (
                  <span className="font-bold">{avgVal}</span>
                )}
                <span className="text-[7px] text-[var(--dungeon-text-dim)] mt-0.5">{def.name}</span>
                <span className="text-[6px] text-[var(--dungeon-text-dim)]">Lv.{d.level}</span>
                {def.element !== 'normal' && (
                  <div className="absolute top-0.5 right-0.5 pointer-events-none">
                    <ElementBadge element={def.element} size={7} />
                  </div>
                )}
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--pixel-red)] flex items-center justify-center" style={{ borderRadius: '2px' }}>
                    <PixelClose size={1.5} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        {/* 操作按钮区 */}
        <div className="flex gap-3 mt-5 relative z-10">
          <button
            onClick={() => { setRemoveDiceMode(false); setRemoveDiceIdx(null); }}
            className="pixel-btn pixel-btn-ghost text-[10px] px-5 py-2"
          >
            返回
          </button>
          {removeDiceIdx !== null && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              disabled={game.ownedDice.length <= 6}
              onClick={() => {
                if (game.ownedDice.length <= 6) return;
                const target = game.ownedDice[removeDiceIdx];
                const def = getDiceDef(target.defId);
                playSound('enemy_skill');
                setGame(prev => ({
                  ...prev,
                  ownedDice: prev.ownedDice.filter((_, i) => i !== removeDiceIdx),
                }));
                addToast(`${def.name} 已移除`, 'damage');
                addLog(`商人净化: ${def.name} 已被移除`);
                setRemoveDiceMode(false);
                setRemoveDiceIdx(null);
              }}
              className="pixel-btn text-[10px] px-5 py-2"
              style={{ background: 'var(--pixel-red)', color: 'white', borderColor: 'var(--pixel-red)' }}
            >
              确认移除
            </motion.button>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />

      <div className="flex items-center gap-3 mb-1 mt-4 relative z-10">
        <PixelMerchant size={3} />
        <h2 className="text-lg font-black pixel-text-shadow tracking-wide">{'\uD83C\uDFF7\uFE0F'} 游荡商人</h2>
      </div>
      <p className="text-[var(--dungeon-text-dim)] mb-4 text-[9px] tracking-[0.1em] font-bold relative z-10">
        "嘿，旅人…看看这些好货，价格公道…大概吧"
      </p>

      <div className="flex items-center gap-1 text-[var(--pixel-gold)] font-mono font-bold text-sm mb-4 relative z-10">
        <PixelCoin size={2} /> {game.souls}
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3 relative z-10">
        {shopItems.length === 0 && (
          <div className="text-center text-[var(--dungeon-text-dim)] text-[10px] py-8">
            商人的货物已经卖完了…
          </div>
        )}
        {shopItems.map((item, idx) => {
          const canBuy = game.souls >= item.price;
          const typeColor = item.type === 'relic' ? '#34d399'
            : (item.type === 'dice' || item.type === 'specialDice') ? '#60a5fa'
            : item.type === 'reroll' ? '#a78bfa'
            : '#9ca3af';
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`w-full pixel-panel p-3 flex items-center gap-3 transition-all ${canBuy ? 'cursor-pointer' : 'opacity-40 grayscale pointer-events-none'}`}
              style={{ borderColor: canBuy ? typeColor + '80' : 'var(--dungeon-panel-border)' }}
            >
              <div className="w-10 h-10 bg-[var(--dungeon-bg)] border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: typeColor + '60', borderRadius: '2px' }}>
                {(item.type === 'dice' || item.type === 'specialDice') && item.diceDefId ? <MiniDice defId={item.diceDefId} size={28} /> : (item.type === 'dice' || item.type === 'specialDice') && <PixelDice size={3} />}
                {item.type === 'relic' && <PixelStar size={3} />}
                {item.type === 'reroll' && <PixelDice size={3} />}
                {item.type === 'removeDice' && <span className="text-[10px]">{'\u2702'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow truncate">{item.label}</div>
                <div className="text-[8px] text-[var(--dungeon-text-dim)] leading-tight mt-0.5">{formatDescription(item.desc)}</div>
              </div>
              <motion.button
                disabled={!canBuy}
                whileHover={canBuy ? { scale: 1.05 } : {}}
                whileTap={canBuy ? { scale: 0.95 } : {}}
                onClick={() => canBuy && buyItem(item)}
                className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono font-bold border transition-all flex-shrink-0 ${
                  canBuy
                    ? 'border-[var(--pixel-gold)] text-[var(--pixel-gold)] hover:bg-[var(--pixel-gold)] hover:text-black'
                    : 'border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)]'
                }`}
                style={{ borderRadius: '2px' }}
              >
                {item.price} <PixelCoin size={1.2} />
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
        className="w-full max-w-xs py-3 mt-6 pixel-btn pixel-btn-ghost text-xs font-bold relative z-10">
        离开商人
      </motion.button>
    </div>
  );
};

// ============================================================
// 导出组件：根据 treasureMode 切换（shop / treasure 两个节点复用一个入口）
// ============================================================
export const ShopScreen: React.FC<{ treasureMode?: boolean }> = ({ treasureMode = false }) => {
  if (treasureMode) {
    return <TreasureScreen />;
  }
  return <MerchantScreen />;
};
