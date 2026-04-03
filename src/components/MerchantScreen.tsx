import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { playSound } from '../utils/sound';
import { PixelCoin, PixelDice } from './PixelIcons';
import { getDiceDef, DICE_BY_RARITY } from '../data/dice';
import { AUGMENTS_POOL } from '../data/augments';
import { ELEMENT_COLORS } from '../utils/uiHelpers';
import type { Augment } from '../types/game';

interface MerchantItem {
  id: string;
  type: 'dice' | 'augment' | 'heal' | 'reroll';
  diceDefId?: string;
  augment?: Augment;
  healAmount?: number;
  label: string;
  desc: string;
  basePrice: number;
  finalPrice: number;
  priceTag: 'cheap' | 'normal' | 'expensive';
  sold: boolean;
}

function generateMerchantItems(chapter: number): MerchantItem[] {
  const items: MerchantItem[] = [];
  const itemTypes = ['dice', 'augment', 'heal', 'reroll'];
  const shuffled = [...itemTypes].sort(() => Math.random() - 0.5);
  const picks = [shuffled[0], shuffled[1], shuffled[2 % shuffled.length]];
  
  for (let i = 0; i < 3; i++) {
    const type = picks[i];
    const priceRoll = Math.random();
    const priceTag: 'cheap' | 'normal' | 'expensive' = 
      priceRoll < 0.3 ? 'cheap' : priceRoll < 0.7 ? 'normal' : 'expensive';
    const priceMult = priceTag === 'cheap' ? 0.6 : priceTag === 'normal' ? 1.0 : 1.5;
    
    switch (type) {
      case 'dice': {
        const pool = chapter >= 3
          ? [...(DICE_BY_RARITY.rare || []), ...(DICE_BY_RARITY.uncommon || [])]
          : chapter >= 2
            ? [...(DICE_BY_RARITY.uncommon || []), ...(DICE_BY_RARITY.common || [])]
            : [...(DICE_BY_RARITY.common || []), ...(DICE_BY_RARITY.uncommon || []).slice(0, 2)];
        if (pool.length === 0) continue;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const basePrice = pick.rarity === 'rare' ? 55 : pick.rarity === 'uncommon' ? 35 : 20;
        items.push({
          id: `merchant-dice-${pick.id}`, type: 'dice', diceDefId: pick.id,
          label: pick.name, desc: `${pick.description} [${pick.faces.join(',')}]`,
          basePrice, finalPrice: Math.floor(basePrice * priceMult), priceTag, sold: false,
        });
        break;
      }
      case 'augment': {
        const pool = AUGMENTS_POOL.filter(a => a.category !== undefined);
        if (pool.length === 0) continue;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const basePrice = 40;
        items.push({
          id: `merchant-aug-${pick.id}`, type: 'augment', augment: { ...pick },
          label: pick.name, desc: pick.description,
          basePrice, finalPrice: Math.floor(basePrice * priceMult), priceTag, sold: false,
        });
        break;
      }
      case 'heal': {
        const healAmount = 20 + Math.floor(Math.random() * 15);
        const basePrice = 25;
        items.push({
          id: `merchant-heal-${i}`, type: 'heal', healAmount,
          label: `\u751f\u547d\u836f\u6c34 +${healAmount}`, desc: `\u6062\u590d ${healAmount} \u70b9\u751f\u547d\u503c`,
          basePrice, finalPrice: Math.floor(basePrice * priceMult), priceTag, sold: false,
        });
        break;
      }
      case 'reroll': {
        const basePrice = 30;
        items.push({
          id: `merchant-reroll-${i}`, type: 'reroll',
          label: '\u91cd\u6295\u7b26\u6587 +1', desc: '\u6c38\u4e45\u589e\u52a0\u6bcf\u56de\u5408\u514d\u8d39\u91cd\u6295\u6b21\u6570',
          basePrice, finalPrice: Math.floor(basePrice * priceMult), priceTag, sold: false,
        });
        break;
      }
    }
  }
  return items;
}

const PRICE_TAG_COLORS = {
  cheap: { text: '#34d399', label: '\u4fbf\u5b9c', bg: '#34d39922' },
  normal: { text: '#9ca3af', label: '\u6b63\u5e38', bg: '#9ca3af22' },
  expensive: { text: '#f87171', label: '\u6602\u8d35', bg: '#f8717122' },
};

export const MerchantScreen: React.FC = () => {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [items, setItems] = useState<MerchantItem[]>(() => generateMerchantItems(game.chapter));
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const buyItem = useCallback((item: MerchantItem) => {
    if (item.sold) return;
    if (game.souls < item.finalPrice) {
      addToast('\u91d1\u5e01\u4e0d\u8db3\uff01');
      return;
    }
    playSound('shop_buy');
    setBuyingId(item.id);
    setGame(prev => {
      const next = { ...prev, souls: prev.souls - item.finalPrice, stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + item.finalPrice } };
      switch (item.type) {
        case 'dice':
          if (item.diceDefId) {
            next.ownedDice = [...prev.ownedDice, { defId: item.diceDefId, upgradeLevel: 0 }];
            addLog(`\u4ece\u5546\u4eba\u5904\u8d2d\u4e70\u4e86\u9ab0\u5b50: ${item.label}`);
          }
          break;
        case 'augment':
          if (item.augment) {
            const emptySlot = prev.augments.findIndex(a => a === null);
            if (emptySlot >= 0) {
              const newAugs = [...prev.augments];
              newAugs[emptySlot] = item.augment;
              next.augments = newAugs;
              addLog(`\u4ece\u5546\u4eba\u5904\u8d2d\u4e70\u4e86\u589e\u5e45: ${item.label}`);
            } else {
              next.pendingReplacementAugment = item.augment;
              addToast('\u589e\u5e45\u69fd\u5df2\u6ee1\uff0c\u9009\u62e9\u4e00\u4e2a\u66ff\u6362');
            }
          }
          break;
        case 'heal':
          if (item.healAmount) {
            next.hp = Math.min(prev.maxHp, prev.hp + item.healAmount);
            addLog(`\u4f7f\u7528\u751f\u547d\u836f\u6c34\u6062\u590d\u4e86 ${item.healAmount} HP`);
            addToast(`+${item.healAmount} HP`, 'heal');
          }
          break;
        case 'reroll':
          next.freeRerollsPerTurn = (prev.freeRerollsPerTurn || 1) + 1;
          addLog('\u83b7\u5f97\u91cd\u6295\u7b26\u6587\uff0c\u6bcf\u56de\u5408\u514d\u8d39\u91cd\u6295+1');
          addToast('+1 \u514d\u8d39\u91cd\u6295', 'buff');
          break;
      }
      return next;
    });
    setItems(prev => prev.map(it => it.id === item.id ? { ...it, sold: true } : it));
    setTimeout(() => setBuyingId(null), 300);
  }, [game.souls, setGame, addToast, addLog]);

  const leave = useCallback(() => {
    playSound('select');
    setGame(prev => ({ ...prev, phase: 'map' }));
  }, [setGame]);

  return (
    <div className="flex flex-col h-full dungeon-bg text-[var(--dungeon-text)] relative overflow-hidden">
      <div className="absolute inset-0 pixel-dither-overlay" />
      <div className="relative z-10 flex flex-col h-full p-4">
        <motion.div className="text-center mb-4" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="text-lg font-bold" style={{ color: 'var(--pixel-cyan)' }}>
            {'\u{1F3D5}\uFE0F'} {'\u6E38\u8361\u5546\u4EBA'}
          </div>
          <div className="text-xs opacity-60 mt-1">
            {'\u201C\u563F\uFF0C\u65C5\u4EBA...\u770B\u770B\u6211\u7684\u597D\u8D27\uFF1F\u4EF7\u683C\u561B...\u770B\u7F18\u5206\u3002\u201D'}
          </div>
        </motion.div>
        <div className="flex items-center justify-center gap-1 mb-3">
          <PixelCoin size={2} />
          <span className="text-sm font-bold" style={{ color: 'var(--pixel-gold)' }}>{game.souls}</span>
        </div>
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto px-1">
          <AnimatePresence>
            {items.map((item, idx) => {
              const priceInfo = PRICE_TAG_COLORS[item.priceTag];
              const canAfford = game.souls >= item.finalPrice && !item.sold;
              const elemColor = item.type === 'dice' && item.diceDefId 
                ? ELEMENT_COLORS[getDiceDef(item.diceDefId).element] || '#888' 
                : item.type === 'augment' ? '#a78bfa' 
                : item.type === 'heal' ? '#34d399' : '#60a5fa';
              return (
                <motion.button key={item.id}
                  initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: item.sold ? 0.4 : 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => buyItem(item)} disabled={!canAfford}
                  className={`relative flex items-center gap-3 p-3 border-2 text-left transition-all ${
                    item.sold ? 'border-gray-700 opacity-40 cursor-not-allowed'
                    : canAfford ? 'border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-gold)] active:scale-[0.98]'
                    : 'border-gray-700 opacity-60 cursor-not-allowed'
                  }`}
                  style={{ backgroundColor: item.sold ? '#111' : `${elemColor}11`, borderRadius: '2px' }}
                >
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 border"
                    style={{ borderColor: elemColor + '44', backgroundColor: elemColor + '22', borderRadius: '2px' }}>
                    {item.type === 'dice' && <PixelDice size={2} />}
                    {item.type === 'augment' && <span className="text-lg">{'\u26A1'}</span>}
                    {item.type === 'heal' && <span className="text-lg">{'\u{1F48A}'}</span>}
                    {item.type === 'reroll' && <span className="text-lg">{'\u{1F504}'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: elemColor }}>{item.label}</div>
                    <div className="text-xs opacity-60 truncate mt-0.5">{item.desc}</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <PixelCoin size={1.5} />
                      <span className="text-sm font-bold" style={{ color: canAfford ? priceInfo.text : '#666' }}>
                        {item.finalPrice}
                      </span>
                    </div>
                    {item.priceTag !== 'normal' && (
                      <span className="text-[10px] px-1 py-px" style={{ color: priceInfo.text, backgroundColor: priceInfo.bg, borderRadius: '1px' }}>
                        {priceInfo.label}
                      </span>
                    )}
                    {item.basePrice !== item.finalPrice && (
                      <span className="text-[10px] line-through opacity-40">{item.basePrice}</span>
                    )}
                  </div>
                  {item.sold && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold opacity-60" style={{ color: '#f87171' }}>{'\u5DF2\u552E\u51FA'}</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        <motion.button
          className="mt-4 py-2.5 px-6 text-sm font-bold border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-gold)] active:scale-[0.97] transition-all mx-auto"
          style={{ backgroundColor: '#1a1a2e', borderRadius: '2px' }}
          onClick={leave} whileTap={{ scale: 0.95 }}
        >
          {'\u79BB\u5F00\u5546\u4EBA'}
        </motion.button>
      </div>
    </div>
  );
};
