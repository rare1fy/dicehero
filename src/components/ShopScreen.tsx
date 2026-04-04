import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { playSound } from '../utils/sound';
import { PixelCoin, PixelStar, PixelDice } from './PixelIcons';
import { DICE_BY_RARITY } from '../data/dice';
import { AUGMENTS_POOL } from '../data/augments';
import { ChestReward, ShopItem } from '../types/game';

// ============================================================
// 宝箱配置（宝箱节点使用）
// ============================================================
const CHEST_COST = 35;
const UPGRADE_COSTS = [0, 120, 250];

const REWARD_TABLE = {
  dice:      { weight: 50, label: '骰子' },
  augment:   { weight: 25, label: '遗物' },
  reroll:    { weight: 22, label: '重投机会' },
  drawCount: { weight: 0.5, label: '手牌上限+1' },
};

function getAdjustedWeights(shopLevel: number) {
  const bonus = (shopLevel - 1) * 3;
  return {
    dice:      REWARD_TABLE.dice.weight,
    augment:   REWARD_TABLE.augment.weight + bonus,
    reroll:    REWARD_TABLE.reroll.weight - bonus * 0.5,
    drawCount: REWARD_TABLE.drawCount.weight,
  };
}

function generateReward(shopLevel: number): ChestReward {
  const weights = getAdjustedWeights(shopLevel);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let rewardType: keyof typeof REWARD_TABLE = 'dice';
  for (const [key, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) { rewardType = key as keyof typeof REWARD_TABLE; break; }
  }
  switch (rewardType) {
    case 'dice': {
      const pools = shopLevel >= 3
        ? [...(DICE_BY_RARITY.rare || []), ...(DICE_BY_RARITY.uncommon || []), ...(DICE_BY_RARITY.common || [])]
        : shopLevel >= 2
          ? [...(DICE_BY_RARITY.uncommon || []), ...(DICE_BY_RARITY.common || [])]
          : [...(DICE_BY_RARITY.common || []), ...(DICE_BY_RARITY.uncommon || []).slice(0, 2)];
      if (pools.length === 0) return { type: 'reroll', value: 1, label: '+1 重投', desc: '每回合重投次数+1', rarity: 'uncommon' };
      const pick = pools[Math.floor(Math.random() * pools.length)];
      const rarity = (DICE_BY_RARITY.rare || []).includes(pick) ? 'rare' as const
        : (DICE_BY_RARITY.uncommon || []).includes(pick) ? 'uncommon' as const : 'common' as const;
      return { type: 'dice', diceDefId: pick.id, label: pick.name, desc: pick.description, rarity };
    }
    case 'augment': {
      const pool = AUGMENTS_POOL.filter(a => a.category !== undefined && (shopLevel >= 2 || a.category === 'transition' || a.category === 'economy'));
      if (pool.length === 0) return { type: 'reroll', value: 1, label: '+1 重投', desc: '每回合重投次数+1', rarity: 'uncommon' };
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const rarity = (pick.category === 'endgame' || pick.category === 'self_harm') ? 'rare' as const : 'uncommon' as const;
      return { type: 'augment', augment: { ...pick }, label: pick.name, desc: pick.description, rarity };
    }
    case 'reroll':
      return { type: 'reroll', value: 1, label: '+1 重投', desc: '永久增加每回合免费重投次数', rarity: 'uncommon' };
    case 'drawCount':
      return { type: 'maxPlays', value: 1, label: '手牌+1', desc: '每回合多抽1颗骰子（敌人也会变强）', rarity: 'rare' };
  }
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af', uncommon: '#34d399', rare: '#60a5fa', legendary: '#f59e0b',
};
const RARITY_LABELS: Record<string, string> = {
  common: '普通', uncommon: '稀有', rare: '史诗', legendary: '传说',
};

// ============================================================
// 像素宝箱 SVG
// ============================================================
const PixelChest: React.FC<{ size?: number; isOpen?: boolean }> = ({ size = 4, isOpen = false }) => {
  const px = size;
  return (
    <svg width={px * 10} height={px * 8} viewBox="0 0 10 8" shapeRendering="crispEdges">
      <rect x="1" y={isOpen ? '4' : '3'} width="8" height="4" fill="#8B6914" />
      <rect x="2" y={isOpen ? '4' : '3'} width="6" height="1" fill="#ffe680" opacity="0.25" />
      <rect x="0" y={isOpen ? '0' : '1'} width="10" height={isOpen ? '3' : '2'} fill="#d4a030" />
      <rect x="1" y={isOpen ? '0' : '1'} width="8" height="1" fill="#ffe680" opacity="0.35" />
      <rect x="4" y={isOpen ? '5' : '3'} width="2" height="2" fill="#ffd700" />
      {isOpen && (<><rect x="2" y="3" width="6" height="1" fill="#ffe680" opacity="0.8" /><rect x="3" y="2" width="4" height="1" fill="#fff" opacity="0.5" /></>)}
    </svg>
  );
};

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

  const buyItem = useCallback((item: ShopItem) => {
    if (game.souls < item.price) { addToast('金币不足！'); return; }
    playSound('shop_buy');
    setGame(prev => {
      const newState: any = {
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
      if (item.type === 'removeDice') {
        const removeIdx = prev.ownedDice.findLastIndex(d => d.defId !== 'basic');
        if (removeIdx >= 0) {
          newState.ownedDice = prev.ownedDice.filter((_: any, i: number) => i !== removeIdx);
        }
      }
      return newState;
    });
    if (item.type === 'augment' && item.augment) {
      pickReward(item.augment);
    }
    addToast('\u2705 购买了 ' + item.label, 'gold');
    addLog('商人购买: ' + item.label + ' (-' + item.price + 'g)');
  }, [game.souls, setGame, pickReward, addToast, addLog]);

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
          const typeColor = item.type === 'augment' ? '#34d399'
            : (item.type === 'dice' || item.type === 'specialDice') ? '#60a5fa'
            : item.type === 'reroll' ? '#a78bfa'
            : '#9ca3af';
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`w-full pixel-panel p-3 flex items-center gap-3 transition-all ${canBuy ? 'cursor-pointer' : 'opacity-50'}`}
              style={{ borderColor: canBuy ? typeColor + '80' : 'var(--dungeon-panel-border)' }}
            >
              <div className="w-10 h-10 bg-[var(--dungeon-bg)] border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: typeColor + '60', borderRadius: '2px' }}>
                {(item.type === 'dice' || item.type === 'specialDice') && <PixelDice size={3} />}
                {item.type === 'augment' && <PixelStar size={3} />}
                {item.type === 'reroll' && <PixelDice size={3} />}
                {item.type === 'removeDice' && <span className="text-[10px]">{'\u2702'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow truncate">{item.label}</div>
                <div className="text-[8px] text-[var(--dungeon-text-dim)] leading-tight mt-0.5">{item.desc}</div>
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
// 宝箱界面（treasure 节点）
// ============================================================
const TreasureScreen: React.FC = () => {
  const { game, setGame, pickReward, addToast, addLog } = useGameContext();
  const [openingChest, setOpeningChest] = useState(false);
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  const shopLevel = game.shopLevel || 1;
  const cost = Math.floor(CHEST_COST * 0.5 * (shopLevel >= 3 ? 0.8 : shopLevel >= 2 ? 0.9 : 1));
  const canAfford = game.souls >= cost;

  const openChest = useCallback(async () => {
    if (!canAfford) { addToast('金币不足！'); return; }
    setGame(prev => ({ ...prev, souls: prev.souls - cost, stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + cost } }));
    playSound('shop_buy');
    setOpeningChest(true);
    setShowReward(false);
    setParticles(Array.from({ length: 16 }, (_, i) => ({
      id: i, x: 50 + (Math.random() - 0.5) * 50, y: 40 + (Math.random() - 0.5) * 30,
      color: '#d4a030', delay: Math.random() * 0.4,
    })));
    await new Promise(r => setTimeout(r, 1000));
    const newReward = generateReward(shopLevel);
    setReward(newReward);
    setShowReward(true);
    playSound(newReward.rarity === 'rare' ? 'augment_activate' : 'coin');
  }, [canAfford, cost, shopLevel, setGame, addToast]);

  const collectReward = useCallback(() => {
    if (!reward) return;
    switch (reward.type) {
      case 'dice':
        if (reward.diceDefId) {
          setGame(prev => ({ ...prev, ownedDice: [...prev.ownedDice, { defId: reward.diceDefId!, level: 1 }] }));
          addLog('开箱获得骰子: ' + reward.label);
        }
        break;
      case 'augment':
        if (reward.augment) { pickReward(reward.augment); addLog('开箱获得模块: ' + reward.label); }
        break;
      case 'reroll':
        setGame(prev => ({ ...prev, freeRerollsPerTurn: prev.freeRerollsPerTurn + 1 }));
        addLog('开箱获得 +1 重投');
        break;
      case 'maxPlays':
        setGame(prev => ({ ...prev, drawCount: Math.min(6, prev.drawCount + 1), enemyHpMultiplier: (prev.enemyHpMultiplier || 1) + 0.25 }));
        addLog('开箱获得 手牌上限+1');
        break;
    }
    playSound('coin');
    setOpeningChest(false);
    setShowReward(false);
    setReward(null);
  }, [reward, setGame, pickReward, addLog]);

  const upgradeShop = () => {
    if (shopLevel >= 3) return;
    const upgCost = UPGRADE_COSTS[shopLevel];
    if (game.souls < upgCost) { addToast('金币不足！'); return; }
    setGame(prev => ({ ...prev, souls: prev.souls - upgCost, shopLevel: (prev.shopLevel || 1) + 1, stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + upgCost } }));
    playSound('levelup');
    addToast('宝箱升级到 Lv.' + (shopLevel + 1) + '！');
    addLog('宝箱升级到 Lv.' + (shopLevel + 1));
  };

  const weights = getAdjustedWeights(shopLevel);
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />

      <div className="flex items-center gap-2 mb-1 mt-4 relative z-10">
        <PixelChest size={3} />
        <h2 className="text-lg font-black pixel-text-shadow tracking-wide">{'\u2726'} 神秘宝箱屋 {'\u2727'}</h2>
      </div>
      <p className="text-[var(--dungeon-text-dim)] mb-3 text-[9px] tracking-[0.1em] font-bold relative z-10">
        "花费金币，开启宝箱，获得随机奖励"
      </p>

      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-1 text-[var(--pixel-gold)] font-mono font-bold text-sm">
          <PixelCoin size={2} /> {game.souls}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-[var(--dungeon-text-dim)]">等级:</span>
          {[1, 2, 3].map(lv => (
            <span key={lv} className={`w-3 h-3 border ${lv <= shopLevel ? 'bg-[var(--pixel-gold)] border-[var(--pixel-gold)]' : 'bg-transparent border-[var(--dungeon-panel-border)]'}`} style={{ borderRadius: '1px' }} />
          ))}
          {shopLevel < 3 && (
            <button onClick={upgradeShop} disabled={game.souls < UPGRADE_COSTS[shopLevel]}
              className={`text-[8px] font-bold px-2 py-0.5 border transition-all ${game.souls >= UPGRADE_COSTS[shopLevel] ? 'border-[var(--pixel-gold)] text-[var(--pixel-gold)] hover:bg-[var(--pixel-gold)] hover:text-black' : 'border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)] opacity-40'}`}
              style={{ borderRadius: '2px' }}>升级 {UPGRADE_COSTS[shopLevel]}g</button>
          )}
        </div>
      </div>

      {!openingChest && (
        <div className="flex flex-col items-center gap-3 relative z-10 w-full max-w-xs">
          <motion.button disabled={!canAfford} onClick={openChest}
            whileHover={canAfford ? { scale: 1.05, y: -3 } : {}} whileTap={canAfford ? { scale: 0.95 } : {}}
            className={`flex flex-col items-center p-5 pixel-panel w-full transition-all ${canAfford ? '' : 'opacity-40 grayscale'}`}
            style={{ borderColor: '#d4a030', boxShadow: canAfford ? '0 0 16px rgba(212,160,48,0.3)' : 'none' }}>
            <motion.div animate={canAfford ? { y: [0, -4, 0] } : {}} transition={{ repeat: Infinity, duration: 2.5 }}>
              <PixelChest size={8} />
            </motion.div>
            <div className="text-sm font-bold mt-3 pixel-text-shadow text-[var(--pixel-gold)]">开启宝箱</div>
            <div className={`flex items-center gap-0.5 text-xs font-mono font-bold mt-1 ${canAfford ? 'text-[var(--pixel-gold)]' : 'text-[var(--dungeon-text-dim)]'}`}>
              {cost} <PixelCoin size={1.5} />
            </div>
          </motion.button>

          <button onClick={() => setShowOdds(!showOdds)} className="text-[8px] text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] transition-colors underline">
            {showOdds ? '隐藏概率' : '查看产出概率'}
          </button>

          <AnimatePresence>
            {showOdds && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="w-full pixel-panel p-3 overflow-hidden" style={{ borderColor: 'var(--dungeon-panel-border)' }}>
                <div className="text-[8px] font-bold text-[var(--dungeon-text-dim)] mb-2 text-center">产出概率 (Lv.{shopLevel})</div>
                {Object.entries(weights).map(([key, w]) => {
                  const pct = ((w / totalW) * 100).toFixed(1);
                  const info = REWARD_TABLE[key as keyof typeof REWARD_TABLE];
                  const barColor = key === 'drawCount' ? '#60a5fa' : key === 'augment' ? '#34d399' : key === 'reroll' ? '#a78bfa' : '#9ca3af';
                  return (
                    <div key={key} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[8px] w-16 text-right font-bold" style={{ color: barColor }}>{info.label}</span>
                      <div className="flex-1 h-2 bg-[rgba(255,255,255,0.05)] overflow-hidden" style={{ borderRadius: '1px' }}>
                        <div className="h-full transition-all" style={{ width: pct + '%', backgroundColor: barColor, borderRadius: '1px' }} />
                      </div>
                      <span className="text-[7px] text-[var(--dungeon-text-dim)] w-8 font-mono">{pct}%</span>
                    </div>
                  );
                })}
                {shopLevel < 3 && <div className="text-[7px] text-[var(--dungeon-text-dim)] mt-2 text-center">升级宝箱可提升稀有奖励概率</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {openingChest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            {particles.map(p => (
              <motion.div key={p.id}
                initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: p.x + '%', y: p.y + '%' }}
                transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color, boxShadow: '0 0 6px ' + p.color }} />
            ))}
            <motion.div className="flex flex-col items-center"
              animate={showReward ? {} : { scale: [1, 1.1, 1], rotate: [0, -2, 2, -2, 0] }}
              transition={{ repeat: showReward ? 0 : Infinity, duration: 0.4 }}>
              <motion.div animate={showReward ? { y: -20 } : {}} transition={{ type: 'spring', stiffness: 200 }}>
                <PixelChest size={10} isOpen={showReward} />
              </motion.div>
              <AnimatePresence>
                {showReward && reward && (
                  <motion.div initial={{ opacity: 0, y: 30, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="mt-4 flex flex-col items-center">
                    <div className="px-6 py-4 pixel-panel flex flex-col items-center gap-2 min-w-[200px]"
                      style={{ borderColor: RARITY_COLORS[reward.rarity], boxShadow: '0 0 20px ' + RARITY_COLORS[reward.rarity] + '40' }}>
                      <div className="text-[8px] font-bold tracking-widest" style={{ color: RARITY_COLORS[reward.rarity] }}>{RARITY_LABELS[reward.rarity]}</div>
                      <div className="w-12 h-12 flex items-center justify-center">
                        {reward.type === 'dice' && <PixelDice size={5} />}
                        {reward.type === 'augment' && <PixelStar size={5} />}
                        {reward.type === 'reroll' && <PixelDice size={5} />}
                        {reward.type === 'maxPlays' && <PixelStar size={5} />}
                      </div>
                      <div className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">{reward.label}</div>
                      <div className="text-[9px] text-[var(--dungeon-text-dim)]">{reward.desc}</div>
                      <motion.button onClick={collectReward} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="mt-2 px-6 py-2 pixel-btn text-xs font-bold"
                        style={{ borderColor: RARITY_COLORS[reward.rarity] }}>收下奖励</motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
        className="w-full max-w-xs py-3 mt-4 pixel-btn pixel-btn-ghost text-xs font-bold relative z-10">
        离开宝箱
      </motion.button>
    </div>
  );
};

// ============================================================
// 导出组件：根据 treasureMode 切换
// ============================================================
export const ShopScreen: React.FC<{ treasureMode?: boolean }> = ({ treasureMode = false }) => {
  if (treasureMode) {
    return <TreasureScreen />;
  }
  return <MerchantScreen />;
};
