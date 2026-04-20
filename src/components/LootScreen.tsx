import React from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelCoin, PixelZap, PixelRefresh, PixelDice, PixelStar } from './PixelIcons';
import { MiniDice } from './MiniDice';
import { getDiceDef } from '../data/dice';
import { formatDescription } from '../utils/richText';

export const LootScreen: React.FC = () => {
  const { game, collectLoot, finishLoot } = useGameContext();

  return (
<div className="flex flex-col h-full bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] p-5 overflow-y-auto">
  <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
  <div className="text-center mb-8 mt-6 relative z-10">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block px-3 py-1 bg-[var(--pixel-green-dark)] border-2 border-[var(--pixel-green)] text-[var(--pixel-green-light)] text-[9px] font-bold tracking-[0.15em] mb-4"
      style={{borderRadius:'2px'}}
    >
      ◆ VICTORY LOOT ◆
    </motion.div>
    <h2 className="text-2xl font-black text-[var(--dungeon-text-bright)] pixel-text-shadow leading-none tracking-wide">战利品拾取</h2>
    <p className="text-[var(--dungeon-text-dim)] text-[8px] tracking-[0.15em] mt-4 font-bold">点击物品以拾取</p>
  </div>
  
  <div className="flex-1 flex flex-col gap-3 max-w-sm mx-auto w-full pb-10 relative z-10">
    {game.lootItems.map((item, i) => {
      const getLootInfo = (type: string) => {
        switch (type) {
          case 'relic': return { icon: <PixelStar size={3} />, color: 'text-[var(--pixel-purple-light)]', label: '✨ 遗物', borderColor: 'var(--pixel-purple)' };
          case 'gold': return { icon: <PixelCoin size={3} />, color: 'text-[var(--pixel-gold-light)]', label: '金币', borderColor: 'var(--pixel-gold)' };
          case 'reroll': return { icon: <PixelRefresh size={3} />, color: 'text-[var(--pixel-purple-light)]', label: '重掷强化', borderColor: 'var(--pixel-purple)' };
          case 'maxPlays': return { icon: <PixelZap size={3} />, color: 'text-[var(--pixel-red-light)]', label: '出牌次数', borderColor: 'var(--pixel-red)' };
          case 'diceCount': return { icon: <PixelDice size={3} />, color: 'text-[var(--pixel-orange-light)]', label: '骰子数量', borderColor: 'var(--pixel-orange)' };
          case 'specialDice': return { icon: null, color: 'text-[var(--pixel-green-light)]', label: '特殊骰子', borderColor: 'var(--pixel-green)' };
          case 'challengeChest': return { icon: <PixelStar size={3} />, color: 'text-[var(--pixel-gold-light)]', label: '🎁 挑战宝箱', borderColor: 'var(--pixel-gold)' };
          default: return { icon: <PixelStar size={3} />, color: 'text-[var(--dungeon-text-dim)]', label: '物品', borderColor: 'var(--dungeon-panel-border)' };
        }
      };
      const info = getLootInfo(item.type);

      return (
        <motion.button
          key={item.id}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: item.collected ? 0.3 : 1 }}
          transition={{ delay: i * 0.1 }}
          whileHover={!item.collected ? { scale: 1.02, x: 4 } : {}}
          whileTap={!item.collected ? { scale: 0.98 } : {}}
          onClick={() => collectLoot(item.id)}
          disabled={item.collected}
          className={`w-full pixel-panel p-4 transition-all text-left flex items-center gap-4 group relative overflow-hidden`}
          style={{ borderColor: item.collected ? 'var(--dungeon-panel-border)' : info.borderColor }}
        >
          {item.collected && (
            <div className="absolute inset-0 bg-[var(--dungeon-bg)]/60 flex items-center justify-center z-10">
              <div className="text-[9px] font-bold text-[var(--dungeon-text-dim)] border-2 border-[var(--dungeon-panel-border)] px-2 py-0.5" style={{borderRadius:'2px'}}>已拾取</div>
            </div>
          )}
          <div className={`w-12 h-12 bg-[var(--dungeon-bg)] border-3 border-[var(--dungeon-panel-border)] flex items-center justify-center ${info.color} group-hover:border-[var(--dungeon-panel-highlight)] transition-colors`} style={{borderRadius:'2px'}}>
            {item.diceDefId ? <MiniDice defId={item.diceDefId} size={24} /> : info.icon}
          </div>
          <div className="flex-1">
            <div className={`text-[8px] font-bold ${info.color} tracking-[0.1em] mb-0.5 opacity-70`}>{info.label}</div>
            <div className="text-sm font-bold text-[var(--dungeon-text-bright)] leading-none mb-0.5 pixel-text-shadow">
              {item.type === 'gold' ? `${item.value} 金币` : 
               item.type === 'maxPlays' ? `+${item.value} 出牌次数` :
               item.type === 'specialDice' && item.diceDefId ? getDiceDef(item.diceDefId).name :
               item.type === 'diceCount' ? `+${item.value} 骰子` :
               item.type === 'relic' && item.relicData ? `✨ ${item.relicData.name}` :
               item.type === 'challengeChest' ? '🎁 洞察弱点宝箱' :
               `+${item.value} 每回合重掷次数`}
            </div>
            <div className="text-[9px] text-[var(--dungeon-text-dim)] leading-tight">
              {item.type === 'relic' && item.relicData ? formatDescription(item.relicData.description) : item.type === 'challengeChest' ? '点击开启，随机获得金币/骰子/遗物' : `点击拾取该奖励`}
            </div>
          </div>
        </motion.button>
      );
    })}


    {game.lootItems.every(i => i.collected) && (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={finishLoot}
        className="mt-3 w-full py-3 pixel-btn pixel-btn-primary text-xs font-bold"
      >
        ▶ 继续旅程
      </motion.button>
    )}
  </div>
</div>
  );
};
