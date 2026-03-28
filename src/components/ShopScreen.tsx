import React from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { playSound } from '../utils/sound';
import { AugmentCard } from './AugmentCard';
import { getAugmentIcon } from '../utils/helpers';
import { formatDescription } from '../utils/richText';
import { PixelCoin, PixelShopBag, PixelStar, PixelRefresh, PixelDice } from './PixelIcons';

export const ShopScreen: React.FC = () => {
  const { game, setGame, pickReward } = useGameContext();

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
        const isDiceLimit = item.type === 'dice' && game.diceCount >= 6;
        const isDisabled = !canAfford || isDiceLimit;

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
                setGame(prev => ({ ...prev, souls: prev.souls - item.price, globalRerolls: prev.globalRerolls + 1, shopItems: prev.shopItems.filter(si => si.id !== item.id) }));
              } else if (item.type === 'dice') {
                setGame(prev => ({ ...prev, souls: prev.souls - item.price, diceCount: Math.min(6, prev.diceCount + 1), shopItems: prev.shopItems.filter(si => si.id !== item.id) }));
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
              {item.type === 'augment' && item.augment && getAugmentIcon(item.augment.condition, 24)}
            </div>
            <div className="flex-1">
              <div className={`text-[8px] font-bold ${isDisabled ? 'text-[var(--dungeon-text-dim)]' : 'text-[var(--pixel-purple)]'} tracking-[0.1em] mb-0.5 opacity-70`}>
                {item.type === 'reroll' ? '基础服务' : item.type === 'dice' ? '基础服务' : '稀有模块'}
              </div>
              <div className="text-sm font-bold text-[var(--dungeon-text-bright)] leading-none mb-0.5 pixel-text-shadow">
                {item.label}
              </div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)] leading-tight">
                {isDiceLimit ? <span className="text-[var(--pixel-red)]">已达携带上限 (6)</span> : formatDescription(item.desc)}
              </div>
            </div>
            <div className={`flex items-center gap-1 font-mono font-bold ${isDisabled ? 'text-[var(--dungeon-text-dim)]' : 'text-[var(--pixel-gold)]'} text-xs`}>
              {isDiceLimit ? '--' : item.price} <PixelCoin size={2} />
            </div>
          </motion.button>
        );
      })}

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
