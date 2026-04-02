import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { playSound } from '../utils/sound';
import { PixelCoin, PixelStar, PixelHeart, PixelDice, PixelShield } from './PixelIcons';
import { getDiceDef, DICE_BY_RARITY } from '../data/dice';
import { AUGMENTS_POOL } from '../data/augments';
import { ELEMENT_COLORS } from '../utils/uiHelpers';
import { ChestReward, ChestTier, Augment } from '../types/game';

// ============================================================
// Chest Configuration
// ============================================================
const CHEST_TIERS: Record<ChestTier, { cost: number; label: string; color: string; glow: string; emoji: string }> = {
  bronze: { cost: 15, label: '\u9752\u94DC\u5B9D\u7BB1', color: '#cd7f32', glow: 'rgba(205,127,50,0.4)', emoji: '\u{1F4E6}' },
  silver: { cost: 35, label: '\u767D\u94F6\u5B9D\u7BB1', color: '#c0c0c0', glow: 'rgba(192,192,192,0.5)', emoji: '\u{1F381}' },
  gold:   { cost: 60, label: '\u9EC4\u91D1\u5B9D\u7BB1', color: '#ffd700', glow: 'rgba(255,215,0,0.6)', emoji: '\u{1F451}' },
};

const UPGRADE_COSTS = [0, 80, 150]; // cost to reach level 2, 3

// Reward generation based on chest tier and shop level
function generateReward(tier: ChestTier, shopLevel: number): ChestReward {
  const roll = Math.random();
  const tierBonus = tier === 'gold' ? 0.15 : tier === 'silver' ? 0.07 : 0;
  const levelBonus = (shopLevel - 1) * 0.05;
  const luckBoost = tierBonus + levelBonus;
  
  // Adjusted probabilities with luck boost
  const legendaryChance = 0.03 + luckBoost * 0.5;
  const rareChance = 0.12 + luckBoost;
  const uncommonChance = 0.35 + luckBoost * 0.5;
  
  if (roll < legendaryChance) {
    // LEGENDARY rewards
    const legendaryOptions: ChestReward[] = [
      { type: 'maxPlays', value: 1, label: '+1 \u51FA\u724C\u6B21\u6570', desc: '\u6C38\u4E45\u589E\u52A0\u6BCF\u56DE\u5408\u51FA\u724C\u6B21\u6570', rarity: 'legendary' },
      { type: 'maxHp', value: 15, label: '+15 \u6700\u5927HP', desc: '\u6C38\u4E45\u589E\u52A0\u6700\u5927\u751F\u547D\u503C', rarity: 'legendary' },
    ];
    return legendaryOptions[Math.floor(Math.random() * legendaryOptions.length)];
  }
  
  if (roll < legendaryChance + rareChance) {
    // RARE rewards
    const rarePool = DICE_BY_RARITY.rare || [];
    const uncommonPool = DICE_BY_RARITY.uncommon || [];
    const dicePool = [...rarePool, ...uncommonPool];
    const augPool = AUGMENTS_POOL.filter(a => a.category === 'endgame' || a.category === 'normal_attack' || a.category === 'self_harm');
    
    const rareOptions: ChestReward[] = [];
    
    if (dicePool.length > 0) {
      const pick = dicePool[Math.floor(Math.random() * dicePool.length)];
      rareOptions.push({ type: 'dice', diceDefId: pick.id, label: pick.name, desc: pick.description, rarity: 'rare' });
    }
    if (augPool.length > 0) {
      const pick = augPool[Math.floor(Math.random() * augPool.length)];
      rareOptions.push({ type: 'augment', augment: { ...pick }, label: pick.name, desc: pick.description, rarity: 'rare' });
    }
    rareOptions.push({ type: 'maxHp', value: 8, label: '+8 \u6700\u5927HP', desc: '\u6C38\u4E45\u589E\u52A0\u6700\u5927\u751F\u547D\u503C', rarity: 'rare' });
    
    return rareOptions[Math.floor(Math.random() * rareOptions.length)];
  }
  
  if (roll < legendaryChance + rareChance + uncommonChance) {
    // UNCOMMON rewards
    const commonDice = DICE_BY_RARITY.common || [];
    const uncommonOptions: ChestReward[] = [
      { type: 'heal', value: 20 + Math.floor(Math.random() * 15), label: '\u6CBB\u7597\u836F\u6C34', desc: '\u7ACB\u5373\u56DE\u590D\u751F\u547D\u503C', rarity: 'uncommon' },
      { type: 'reroll', value: 1, label: '+1 \u91CD\u63B7', desc: '\u6C38\u4E45\u589E\u52A0\u6BCF\u56DE\u5408\u91CD\u63B7\u6B21\u6570', rarity: 'uncommon' },
      { type: 'removeDice', label: '\u9AB0\u5B50\u51C0\u5316', desc: '\u79FB\u9664\u4E00\u9897\u9AB0\u5B50\uFF0C\u7626\u8EAB\u6784\u7B51', rarity: 'uncommon' },
    ];
    if (commonDice.length > 0) {
      const pick = commonDice[Math.floor(Math.random() * commonDice.length)];
      uncommonOptions.push({ type: 'dice', diceDefId: pick.id, label: pick.name, desc: pick.description, rarity: 'uncommon' });
    }
    // Transition augments
    const transAugs = AUGMENTS_POOL.filter(a => a.category === 'transition' || a.category === 'economy');
    if (transAugs.length > 0) {
      const pick = transAugs[Math.floor(Math.random() * transAugs.length)];
      uncommonOptions.push({ type: 'augment', augment: { ...pick }, label: pick.name, desc: pick.description, rarity: 'uncommon' });
    }
    return uncommonOptions[Math.floor(Math.random() * uncommonOptions.length)];
  }
  
  // COMMON rewards
  const goldAmount = tier === 'gold' ? 30 + Math.floor(Math.random() * 20) : tier === 'silver' ? 15 + Math.floor(Math.random() * 15) : 8 + Math.floor(Math.random() * 10);
  const commonOptions: ChestReward[] = [
    { type: 'gold', value: goldAmount, label: `+${goldAmount} \u91D1\u5E01`, desc: '\u83B7\u5F97\u91D1\u5E01', rarity: 'common' },
    { type: 'heal', value: 10 + Math.floor(Math.random() * 10), label: '\u5C0F\u578B\u6CBB\u7597', desc: '\u56DE\u590D\u5C11\u91CF\u751F\u547D\u503C', rarity: 'common' },
  ];
  return commonOptions[Math.floor(Math.random() * commonOptions.length)];
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#34d399',
  rare: '#60a5fa',
  legendary: '#f59e0b',
};

const RARITY_LABELS: Record<string, string> = {
  common: '\u666E\u901A',
  uncommon: '\u7A00\u6709',
  rare: '\u53F2\u8BD7',
  legendary: '\u4F20\u8BF4',
};

// ============================================================
// Treasure Chest Pixel Art SVG
// ============================================================
const PixelChest: React.FC<{ tier: ChestTier; size?: number; isOpen?: boolean }> = ({ tier, size = 4, isOpen = false }) => {
  const px = size;
  const colors = {
    bronze: { body: '#8B5E3C', lid: '#cd7f32', lock: '#ffd700', highlight: '#e8a860' },
    silver: { body: '#708090', lid: '#c0c0c0', lock: '#e8e8e8', highlight: '#dde4ec' },
    gold: { body: '#b8860b', lid: '#ffd700', lock: '#fff8dc', highlight: '#fff3a0' },
  }[tier];
  
  return (
    <svg width={px * 10} height={px * 8} viewBox="0 0 10 8" shapeRendering="crispEdges">
      {/* Body */}
      <rect x="1" y={isOpen ? "4" : "3"} width="8" height="4" fill={colors.body} />
      <rect x="2" y={isOpen ? "4" : "3"} width="6" height="1" fill={colors.highlight} opacity="0.3" />
      {/* Lid */}
      <rect x="0" y={isOpen ? "0" : "1"} width="10" height={isOpen ? "3" : "2"} fill={colors.lid} />
      <rect x="1" y={isOpen ? "0" : "1"} width="8" height="1" fill={colors.highlight} opacity="0.4" />
      {/* Lock */}
      <rect x="4" y={isOpen ? "5" : "3"} width="2" height="2" fill={colors.lock} />
      <rect x="4" y={isOpen ? "5" : "3"} width="2" height="1" fill={colors.highlight} opacity="0.5" />
      {/* Glow when open */}
      {isOpen && (
        <>
          <rect x="2" y="3" width="6" height="1" fill={colors.highlight} opacity="0.8" />
          <rect x="3" y="2" width="4" height="1" fill="#fff" opacity="0.6" />
        </>
      )}
    </svg>
  );
};

// ============================================================
// Main Shop Screen Component
// ============================================================
export const ShopScreen: React.FC = () => {
  const { game, setGame, pickReward, addToast, addLog } = useGameContext();
  const [openingChest, setOpeningChest] = useState<ChestTier | null>(null);
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);
  const [removeDiceMode, setRemoveDiceMode] = useState(false);
  
  const shopLevel = game.shopLevel || 1;
  
  const openChest = useCallback(async (tier: ChestTier) => {
    const cost = Math.floor(CHEST_TIERS[tier].cost * (shopLevel >= 2 ? 0.9 : 1));
    if (game.souls < cost) {
      addToast('\u91D1\u5E01\u4E0D\u8DB3\uFF01');
      return;
    }
    
    // Deduct gold
    setGame(prev => ({ ...prev, souls: prev.souls - cost, stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + cost } }));
    playSound('shop_buy');
    
    // Start opening animation
    setOpeningChest(tier);
    setShowReward(false);
    
    // Generate particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 40 + (Math.random() - 0.5) * 40,
      color: CHEST_TIERS[tier].color,
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
    
    // Wait for animation
    await new Promise(r => setTimeout(r, 1200));
    
    // Generate reward
    const newReward = generateReward(tier, shopLevel);
    setReward(newReward);
    setShowReward(true);
    playSound(newReward.rarity === 'legendary' ? 'levelup' : newReward.rarity === 'rare' ? 'augment_activate' : 'coin');
    
  }, [game.souls, shopLevel, setGame, addToast]);
  
  const collectReward = useCallback(() => {
    if (!reward) return;
    
    switch (reward.type) {
      case 'gold':
        setGame(prev => ({ ...prev, souls: prev.souls + (reward.value || 0), stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + (reward.value || 0) } }));
        addLog(`\u5F00\u7BB1\u83B7\u5F97 ${reward.value} \u91D1\u5E01`);
        break;
      case 'heal':
        setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + (reward.value || 0)) }));
        addLog(`\u5F00\u7BB1\u83B7\u5F97\u6CBB\u7597 ${reward.value} HP`);
        break;
      case 'dice':
        if (reward.diceDefId) {
          setGame(prev => ({ ...prev, ownedDice: [...prev.ownedDice, { defId: reward.diceDefId!, level: 1 }] }));
          addLog(`\u5F00\u7BB1\u83B7\u5F97\u9AB0\u5B50: ${reward.label}`);
        }
        break;
      case 'augment':
        if (reward.augment) {
          pickReward(reward.augment);
          addLog(`\u5F00\u7BB1\u83B7\u5F97\u6A21\u5757: ${reward.label}`);
        }
        break;
      case 'maxHp':
        setGame(prev => ({ ...prev, maxHp: prev.maxHp + (reward.value || 0), hp: prev.hp + (reward.value || 0) }));
        addLog(`\u5F00\u7BB1\u83B7\u5F97 +${reward.value} \u6700\u5927HP`);
        break;
      case 'maxPlays':
        setGame(prev => ({ ...prev, maxPlays: prev.maxPlays + 1 }));
        addLog('\u5F00\u7BB1\u83B7\u5F97 +1 \u51FA\u724C\u6B21\u6570');
        break;
      case 'reroll':
        setGame(prev => ({ ...prev, freeRerollsPerTurn: prev.freeRerollsPerTurn + 1 }));
        addLog('\u5F00\u7BB1\u83B7\u5F97 +1 \u91CD\u63B7');
        break;
      case 'removeDice':
        setRemoveDiceMode(true);
        setOpeningChest(null);
        setShowReward(false);
        setReward(null);
        return;
    }
    
    playSound('coin');
    setOpeningChest(null);
    setShowReward(false);
    setReward(null);
  }, [reward, setGame, pickReward, addLog]);
  
  const upgradeShop = () => {
    if (shopLevel >= 3) return;
    const cost = UPGRADE_COSTS[shopLevel];
    if (game.souls < cost) {
      addToast('\u91D1\u5E01\u4E0D\u8DB3\uFF01');
      return;
    }
    setGame(prev => ({ ...prev, souls: prev.souls - cost, shopLevel: (prev.shopLevel || 1) + 1, stats: { ...prev.stats, goldSpent: prev.stats.goldSpent + cost } }));
    playSound('levelup');
    addToast(`\u5546\u5E97\u5347\u7EA7\u5230 Lv.${shopLevel + 1}\uFF01`);
    addLog(`\u5546\u5E97\u5347\u7EA7\u5230 Lv.${shopLevel + 1}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 mt-4 relative z-10">
        <PixelChest tier="gold" size={3} />
        <h2 className="text-lg font-black pixel-text-shadow tracking-wide">\u2726 \u795E\u79D8\u5B9D\u7BB1\u5C4B \u2726</h2>
      </div>
      <p className="text-[var(--dungeon-text-dim)] mb-2 text-[9px] tracking-[0.1em] font-bold relative z-10">
        "\u82B1\u8D39\u91D1\u5E01\uFF0C\u5F00\u542F\u5B9D\u7BB1\uFF0C\u83B7\u5F97\u968F\u673A\u5956\u52B1"
      </p>
      
      {/* Shop Level & Gold */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-1 text-[var(--pixel-gold)] font-mono font-bold text-sm">
          <PixelCoin size={2} /> {game.souls}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-[var(--dungeon-text-dim)]">\u5546\u5E97\u7B49\u7EA7:</span>
          {[1,2,3].map(lv => (
            <span key={lv} className={`w-3 h-3 border ${lv <= shopLevel ? 'bg-[var(--pixel-gold)] border-[var(--pixel-gold)]' : 'bg-transparent border-[var(--dungeon-panel-border)]'}`} style={{borderRadius:'1px'}} />
          ))}
          {shopLevel < 3 && (
            <button
              onClick={upgradeShop}
              disabled={game.souls < UPGRADE_COSTS[shopLevel]}
              className={`text-[8px] font-bold px-2 py-0.5 border transition-all ${game.souls >= UPGRADE_COSTS[shopLevel] ? 'border-[var(--pixel-gold)] text-[var(--pixel-gold)] hover:bg-[var(--pixel-gold)] hover:text-black' : 'border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)] opacity-40'}`}
              style={{borderRadius:'2px'}}
            >
              \u5347\u7EA7 {UPGRADE_COSTS[shopLevel]}g
            </button>
          )}
        </div>
      </div>

      {/* Chest Selection */}
      {!openingChest && !removeDiceMode && (
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-4 relative z-10">
          {(['bronze', 'silver', 'gold'] as ChestTier[]).map((tier) => {
            const config = CHEST_TIERS[tier];
            const cost = Math.floor(config.cost * (shopLevel >= 2 ? 0.9 : 1));
            const canAfford = game.souls >= cost;
            return (
              <motion.button
                key={tier}
                disabled={!canAfford}
                onClick={() => openChest(tier)}
                whileHover={canAfford ? { scale: 1.05, y: -2 } : {}}
                whileTap={canAfford ? { scale: 0.95 } : {}}
                className={`flex flex-col items-center p-3 pixel-panel transition-all ${canAfford ? 'hover:border-opacity-100' : 'opacity-40 grayscale'}`}
                style={{ borderColor: config.color, boxShadow: canAfford ? `0 0 12px ${config.glow}` : 'none' }}
              >
                <motion.div
                  animate={canAfford ? { y: [0, -3, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 2, delay: Math.random() }}
                >
                  <PixelChest tier={tier} size={5} />
                </motion.div>
                <div className="text-[10px] font-bold mt-2 pixel-text-shadow" style={{ color: config.color }}>
                  {config.label}
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold mt-1 ${canAfford ? 'text-[var(--pixel-gold)]' : 'text-[var(--dungeon-text-dim)]'}`}>
                  {cost} <PixelCoin size={1.5} />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Opening Animation */}
      <AnimatePresence>
        {openingChest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            {/* Particles */}
            {particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: `${p.x}%`,
                  y: `${p.y}%`,
                }}
                transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }}
              />
            ))}
            
            {/* Chest */}
            <motion.div
              className="flex flex-col items-center"
              animate={showReward ? {} : { scale: [1, 1.1, 1], rotate: [0, -2, 2, -2, 0] }}
              transition={{ repeat: showReward ? 0 : Infinity, duration: 0.5 }}
            >
              <motion.div
                animate={showReward ? { y: -20 } : {}}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <PixelChest tier={openingChest} size={10} isOpen={showReward} />
              </motion.div>
              
              {/* Reward reveal */}
              <AnimatePresence>
                {showReward && reward && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="mt-4 flex flex-col items-center"
                  >
                    {/* Rarity glow ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                      className="absolute w-32 h-32 rounded-full opacity-20"
                      style={{ border: `2px solid ${RARITY_COLORS[reward.rarity]}`, boxShadow: `0 0 20px ${RARITY_COLORS[reward.rarity]}` }}
                    />
                    
                    <div
                      className="px-6 py-4 pixel-panel flex flex-col items-center gap-2 min-w-[200px]"
                      style={{ borderColor: RARITY_COLORS[reward.rarity], boxShadow: `0 0 20px ${RARITY_COLORS[reward.rarity]}40` }}
                    >
                      <div className="text-[8px] font-bold tracking-widest" style={{ color: RARITY_COLORS[reward.rarity] }}>
                        {RARITY_LABELS[reward.rarity]}
                      </div>
                      
                      <div className="w-12 h-12 flex items-center justify-center">
                        {reward.type === 'gold' && <PixelCoin size={5} />}
                        {reward.type === 'heal' && <PixelHeart size={5} />}
                        {reward.type === 'dice' && <PixelDice size={5} />}
                        {reward.type === 'augment' && <PixelStar size={5} />}
                        {reward.type === 'maxHp' && <PixelHeart size={5} />}
                        {reward.type === 'maxPlays' && <PixelStar size={5} />}
                        {reward.type === 'reroll' && <PixelDice size={5} />}
                        {reward.type === 'removeDice' && <PixelDice size={5} />}
                      </div>
                      
                      <div className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">
                        {reward.label}
                      </div>
                      <div className="text-[9px] text-[var(--dungeon-text-dim)]">
                        {reward.desc}
                      </div>
                      
                      <motion.button
                        onClick={collectReward}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-2 px-6 py-2 pixel-btn text-xs font-bold"
                        style={{ borderColor: RARITY_COLORS[reward.rarity] }}
                      >
                        \u6536\u4E0B\u5956\u52B1
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Dice Mode */}
      {removeDiceMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm p-4 pixel-panel mb-3 relative z-10"
          style={{ borderColor: 'var(--pixel-red)' }}
        >
          <div className="text-center text-[9px] font-bold text-[var(--pixel-red)] mb-2">\u9009\u62E9\u8981\u79FB\u9664\u7684\u9AB0\u5B50</div>
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
                      ownedDice: prev.ownedDice.filter((_, i) => i !== idx),
                    }));
                    addLog('\u79FB\u9664\u4E86\u9AB0\u5B50: ' + def.name);
                    addToast('\u79FB\u9664\u4E86 ' + def.name, 'info');
                    setRemoveDiceMode(false);
                  }}
                  className="flex flex-col items-center p-1.5 border border-[rgba(255,255,255,0.1)] hover:border-[var(--pixel-red)] rounded transition-all"
                  style={{ borderRadius: '3px' }}
                >
                  <div className="w-8 h-8 flex items-center justify-center mb-0.5" style={{ color: elemColor }}>
                    <PixelDice size={3} />
                  </div>
                  <div className="text-[7px] text-[var(--dungeon-text-bright)]">{def.name}</div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setRemoveDiceMode(false)}
            className="w-full py-1 text-[8px] text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)]"
          >
            \u53D6\u6D88
          </button>
        </motion.div>
      )}

      {/* Leave button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
        className="w-full max-w-sm py-3 mt-3 pixel-btn pixel-btn-ghost text-xs font-bold relative z-10"
      >
        \u79BB\u5F00\u5B9D\u7BB1\u5C4B
      </motion.button>
    </div>
  );
};
