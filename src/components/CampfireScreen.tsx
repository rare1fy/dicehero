import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { Augment } from '../types';
import { playSound } from '../utils/sound';
import { CSSParticles } from './ParticleEffects';
import { PixelCampfire, PixelHeart, PixelCoin, PixelZap } from './PixelIcons';
import { getAugmentIcon } from '../utils/helpers';
import { formatDescription } from '../utils/richText';

export const CampfireScreen: React.FC = () => {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [campfireView, setCampfireView] = useState<'main' | 'upgrade'>('main');

  const equipped = game.augments.filter((a): a is Augment => a !== null);

  if (campfireView === 'upgrade') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] overflow-y-auto relative">
        <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
        <div className="flex items-center gap-2 mb-1 mt-4 relative z-10">
          <PixelZap size={3} />
          <h2 className="text-lg font-black pixel-text-shadow tracking-wide">◆ 模块强化 ◆</h2>
        </div>
        <p className="text-[var(--dungeon-text-dim)] mb-5 text-[9px] text-center relative z-10">消耗金币提升模块性能，每个模块最高 Lv.5。</p>
        
        <div className="space-y-3 w-full max-w-sm pb-6 relative z-10">
          {equipped.length === 0 ? (
            <div className="text-center py-10 text-[var(--dungeon-text-dim)] text-xs">暂无已装备模块</div>
          ) : (
            equipped.map((aug) => {
              const level = aug.level || 1;
              const upgradeCost = level * 40;
              const canUpgrade = game.souls >= upgradeCost && level < 5;

              return (
                <div key={aug.id} className="pixel-panel p-3 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-xs flex items-center gap-2 text-[var(--dungeon-text-bright)]">
                      <div className="text-[var(--pixel-green)]">
                        {getAugmentIcon(aug.condition, 14)}
                      </div>
                      <span className="pixel-text-shadow">{aug.name}</span>
                      <span className="text-[9px] bg-[var(--dungeon-bg)] px-1.5 py-0.5 text-[var(--dungeon-text-dim)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>Lv.{level}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--pixel-gold)] font-mono text-[10px]">
                      {upgradeCost} <PixelCoin size={2} />
                    </div>
                  </div>
                  <button
                    disabled={!canUpgrade}
                    onClick={() => {
                      playSound('armor');
                      setGame(prev => {
                        const newAugments = prev.augments.map(a => 
                          a?.id === aug.id ? { ...a, level: (a.level || 1) + 1 } : a
                        );
                        return {
                          ...prev,
                          souls: prev.souls - upgradeCost,
                          augments: newAugments,
                          phase: 'map'
                        };
                      });
                      addLog(`${aug.name} 已强化至 Lv.${level + 1}！`);
                    }}
                    className="w-full py-2 pixel-btn pixel-btn-primary text-[10px] disabled:opacity-30"
                  >
                    {level >= 5 ? "已达上限" : "强化模块"}
                  </button>
                </div>
              );
            })
          )}
          
          <button 
            onClick={() => setCampfireView('main')}
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
        <h2 className="text-lg font-black mb-2 pixel-text-shadow tracking-wide mt-1">◆ 篝火营地 ◆</h2>
        <p className="text-[var(--dungeon-text-dim)] mb-8 text-[9px]">在永夜中短暂的温暖。</p>
        
        <div className="space-y-3 w-full max-w-xs">
          <button 
            onClick={() => { addToast('篝火休整 +18 HP', 'heal'); setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 18), phase: 'map' })); }}
            className="w-full p-4 pixel-panel flex items-center justify-between transition-all group"
            style={{ borderColor: 'var(--pixel-orange)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-orange)] pixel-text-shadow">休整</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">回复 18 点生命值</div>
            </div>
            <PixelHeart size={4} />
          </button>

          <button 
            onClick={() => setCampfireView('upgrade')}
            className="w-full p-4 pixel-panel flex items-center justify-between transition-all group"
            style={{ borderColor: 'var(--pixel-blue)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-blue)] pixel-text-shadow">强化</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">消耗金币升级已装备模块</div>
            </div>
            <PixelZap size={4} />
          </button>
        </div>
      </div>
    </div>
  );
};
