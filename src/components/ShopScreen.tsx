import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { playSound } from '../utils/sound';
import { AugmentCard } from './AugmentCard';
import { getAugmentIcon } from '../utils/uiHelpers';
import { formatDescription } from '../utils/richText';
import { PixelCoin, PixelShopBag, PixelStar, PixelRefresh, PixelDice } from './PixelIcons';
import { getDiceDef } from '../data/dice';
import { ELEMENT_COLORS } from '../utils/uiHelpers';
import { ElementBadge, RARITY_COLORS, RARITY_LABELS } from './PixelDiceShapes';

export const ShopScreen: React.FC = () => {
  const { game, setGame, pickReward, addToast, addLog } = useGameContext();
  const [removeDiceMode, setRemoveDiceMode] = useState(false);
  const [removeDicePrice, setRemoveDicePrice] = useState(0);
  const [removeDiceItemId, setRemoveDiceItemId] = useState('');


  return (
  <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
    <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
    <div className="flex items-center gap-2 mb-2 mt-4 relative z-10">
      <PixelShopBag size={3} />
      <h2 className="text-lg font-black pixel-text-shadow tracking-wide">◆ 黑市商人 ◆</h2>
    </div>
    <p className="text-[var(--dungeon-text-dim)] mb-8 text-[9px] tracking-[0.1em] font-bold relative z-10">"只要有金币，一切皆有可能。"</p>
    
    <div className="grid grid-cols-1 gap-3 w-full max-w-sm pb-10 relative z-10">
      {game.shopItems.map((item, i) => {
        const canAfford = game.souls >= item.price;
        const isRemoveLimit = item.type === 'removeDice' && game.ownedDice.length <= 4;
        const isDisabled = !canAfford || isRemoveLimit;

        return (
          <motion.button 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            disabled={isDisabled}
            onClick={() => {
              playSound('shop_buy');
              if (item.type === 'reroll') {
                setGame(prev => ({ ...prev, souls: prev.souls - item.price, freeRerollsPerTurn: prev.freeRerollsPerTurn + 1, shopItems: prev.shopItems.filter(si => si.id !== item.id) }));
              } else if (item.type === 'dice') {
                setGame(prev => ({ ...prev, souls: prev.souls - item.price, diceCount: Math.min(6, prev.diceCount + 1), shopItems: prev.shopItems.filter(si => si.id !== item.id) }));
              } else if (item.type === 'specialDice' && item.diceDefId) {
                const ddef = getDiceDef(item.diceDefId);
                setGame(prev => ({
                  ...prev,
                  souls: prev.souls - item.price,
                  ownedDice: [...prev.ownedDice, { defId: item.diceDefId!, level: 1 }],
                  shopItems: prev.shopItems.filter(si => si.id !== item.id)
                }));
              } else if (item.type === 'removeDice') {
                if (game.ownedDice.length <= 4) return;
                setRemoveDiceMode(true);
                setRemoveDicePrice(item.price);
                setRemoveDiceItemId(item.id);
                return;
              } else if (item.type === 'augment' && item.augment) {
                setGame(prev => ({ 
                  ...prev, 
                  souls: prev.souls - item.price, 
                  shopItems: prev.shopItems.filter(si => si.id !== item.id) 
                }));
                pickReward(item.augment);
              }
            }}
            className={`relative w-full p-4 pixel-panel transition-all text-left flex items-center gap-4 group overflow-hidden ${isDisabled ? 'opacity-40 grayscale' : ''}`}
            style={{ borderColor: isDisabled ? 'var(--dungeon-panel-border)' : 'var(--pixel-purple)' }}
          >
            <div className={`w-12 h-12 bg-[var(--dungeon-bg)] border-3 border-[var(--dungeon-panel-border)] flex items-center justify-center ${isDisabled ? 'text-[var(--dungeon-text-dim)]' : 'text-[var(--pixel-purple-light)] group-hover:border-[var(--pixel-purple)]'} transition-colors`} style={{borderRadius:'2px'}}>
              {item.type === 'reroll' && <PixelRefresh size={3} />}
              {item.type === 'dice' && <PixelDice size={3} />}
              {item.type === 'specialDice' && item.diceDefId && (
                <ElementBadge element={getDiceDef(item.diceDefId).element} size={24} />
              )}
              {item.type === 'augment' && item.augment && getAugmentIcon(item.augment.condition, 24)}
              {item.type === 'removeDice' && <PixelStar size={3} />}
            </div>
            <div className="flex-1">
              <div className={`text-[8px] font-bold ${isDisabled ? 'text-[var(--dungeon-text-dim)]' : 'text-[var(--pixel-purple)]'} tracking-[0.1em] mb-0.5 opacity-70`}>
                {item.type === 'reroll' ? '基础服务' : item.type === 'specialDice' ? '特殊骰子' : '稀有模块'}
              </div>
              <div className="text-sm font-bold text-[var(--dungeon-text-bright)] leading-none mb-0.5 pixel-text-shadow">
                {item.label}
              </div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)] leading-tight">
                {formatDescription(item.desc)}
              </div>
            </div>
            <div className={`flex items-center gap-1 font-mono font-bold ${isDisabled ? 'text-[var(--dungeon-text-dim)]' : 'text-[var(--pixel-gold)]'} text-xs`}>
              {item.price} <PixelCoin size={2} />
            </div>
          </motion.button>
        );
      })}

      
      

      {removeDiceMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-4 pixel-panel mb-3"
          style={{ borderColor: 'var(--pixel-red)' }}
        >
          <div className="text-center text-[9px] font-bold text-[var(--pixel-red)] mb-2">选择要移除的骰子</div>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {game.ownedDice.map((d, idx) => {
              const def = getDiceDef(d.defId);
              const elemColor = ELEMENT_COLORS[def.element] || '#888';
              return (
                <button
                  key={idx}
                  onClick={() => {
                    playSound('shop_buy');
                    setGame(prev => ({
                      ...prev,
                      souls: prev.souls - removeDicePrice,
                      ownedDice: prev.ownedDice.filter((_, i) => i !== idx),
                      shopItems: prev.shopItems.filter(si => si.id !== removeDiceItemId)
                    }));
                    addLog('移除了骰子: ' + def.name);
                    addToast('移除了 ' + def.name, 'info');
                    setRemoveDiceMode(false);
                  }}
                  className="flex flex-col items-center p-1.5 border border-[rgba(255,255,255,0.1)] hover:border-[var(--pixel-red)] rounded transition-all"
                  style={{ borderRadius: '3px' }}
                >
                  <div className="w-8 h-8 flex items-center justify-center mb-0.5">
                    <PixelDice size={20} color={elemColor} />
                  </div>
                  <div className="text-[7px] text-[var(--dungeon-text-bright)]">{def.name}</div>
                  <div className="text-[6px] text-[var(--dungeon-text-dim)]">Lv.{d.level}</div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setRemoveDiceMode(false)}
            className="w-full py-1 text-[8px] text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)]"
          >
            取消
          </button>
        </motion.div>
      )}

<motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
        className="w-full py-3 mt-3 pixel-btn pixel-btn-ghost text-xs font-bold"
      >
        离开商店
      </motion.button>
    </div>
  </div>
  );
};
