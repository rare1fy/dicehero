/**
 * CampfireScreen.tsx — 篝火营地主视图（ARCH-G 拆分后）
 *
 * 仅保留主视图 + 子视图路由，升级/净化逻辑已提取为独立组件。
 */

import React, { useState } from 'react';
import { MiniDice } from './DiceBagPanel';
import { useGameContext } from '../contexts/GameContext';
import { getDiceDef, DICE_MAX_LEVEL } from '../data/dice';
import { playSound } from '../utils/sound';
import { PixelCampfire, PixelHeart, PixelDice, PixelFlame, PixelSoulCrystal } from './PixelIcons';
import { CAMPFIRE_CONFIG } from '../config';
import { CampfireUpgradeView } from './CampfireUpgradeView';
import { CampfirePurifyView } from './CampfirePurifyView';

type ViewMode = 'main' | 'upgrade' | 'purify';

export const CampfireScreen: React.FC = () => {
  const { game, setGame, addToast, addLog } = useGameContext();
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [selectedDiceIdx, setSelectedDiceIdx] = useState<number | null>(null);
  const [campfireUsed, setCampfireUsed] = useState(false);

  if (viewMode === 'purify') {
    return <CampfirePurifyView onBack={() => setViewMode('main')} onUsed={() => setCampfireUsed(true)} />;
  }

  if (viewMode === 'upgrade') {
    return <CampfireUpgradeView onBack={() => setViewMode('main')} onUsed={() => setCampfireUsed(true)} />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] relative">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center">
        <PixelCampfire size={4} />
        <h2 className="text-lg font-black mb-1 pixel-text-shadow tracking-wide mt-1">◆ 篝火营地 ◆</h2>
        <p className="text-[var(--dungeon-text-dim)] mb-2 text-[9px]">在永夜中短暂的温暖。</p>
        <p className="text-[8px] mb-6 px-4 text-center leading-relaxed">
          <span className="text-[var(--pixel-orange)] font-bold">※ 营地只能选择一项行动 ※</span>
          <br />
          <span className="text-[var(--dungeon-text-dim)]">休整、强化、净化、撤离</span>
          <span className="text-[var(--pixel-red)] font-bold"> 只能执行其中一项</span>
          <span className="text-[var(--dungeon-text-dim)]">，选择后立即离开营地。</span>
        </p>

        <div className="space-y-3 w-full max-w-xs">
          {/* 休整 */}
          <button
            disabled={campfireUsed}
            onClick={() => {
              addToast('篝火休整 +' + CAMPFIRE_CONFIG.restHeal + ' HP', 'heal');
              playSound('heal');
              setCampfireUsed(true);
              setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + CAMPFIRE_CONFIG.restHeal), phase: 'map' }));
            }}
            className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ borderColor: 'var(--pixel-orange)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-orange)] pixel-text-shadow">休整</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">回复 {CAMPFIRE_CONFIG.restHeal} 点生命值</div>
            </div>
            <PixelHeart size={4} />
          </button>

          {/* 强化骰子 */}
          <button
            disabled={campfireUsed}
            onClick={() => setViewMode('upgrade')}
            className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ borderColor: 'var(--pixel-cyan)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-cyan)] pixel-text-shadow">强化骰子</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">消耗金币升级骰子，提升点数和效果</div>
            </div>
            {selectedDiceIdx !== null ? <MiniDice defId={game.ownedDice[selectedDiceIdx]?.defId || "standard"} size={32} /> : <PixelDice size={4} />}
          </button>

          {/* 净化骰子 */}
          <button
            disabled={campfireUsed}
            onClick={() => setViewMode('purify')}
            className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ borderColor: 'var(--pixel-red)' }}
          >
            <div className="text-left">
              <div className="text-base font-bold text-[var(--pixel-red)] pixel-text-shadow">净化骰子</div>
              <div className="text-[9px] text-[var(--dungeon-text-dim)]">免费移除一颗骰子，精简骰子库</div>
            </div>
            <PixelFlame size={4} />
          </button>

          {/* 魂晶撤离 */}
          {(game.blackMarketQuota || 0) > 0 && (
            <button
              disabled={campfireUsed}
              onClick={() => {
                const quota = game.blackMarketQuota || 0;
                if (quota <= 0) return;
                playSound('coin');
                setCampfireUsed(true);
                setGame(prev => ({
                  ...prev,
                  blackMarketQuota: 0,
                  evacuatedQuota: (prev.evacuatedQuota || 0) + quota,
                  soulCrystalMultiplier: 1.0,
                  phase: 'map',
                }));
                addToast('+' + quota + ' 魂晶已安全撤离！倍率重置为+0%', 'gold');
                addLog('营火撤离: ' + quota + ' 魂晶已转移至安全区，倍率重置');
              }}
              className={`w-full p-4 pixel-panel flex items-center justify-between transition-all group ${campfireUsed ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={{ borderColor: '#a855f7' }}
            >
              <div className="text-left">
                <div className="text-base font-bold text-purple-400 pixel-text-shadow">魂晶撤离</div>
                <div className="text-[9px] text-[var(--dungeon-text-dim)]">
                  将 <span className="text-purple-300 font-bold">{game.blackMarketQuota || 0}</span> 魂晶转入安全区（死亡不丢失）
                </div>
                <div className="text-[8px] text-[var(--pixel-orange)] mt-0.5">
                  ⚠ 撤离后<span className="font-bold">倍率重置为+0%</span>，不撤离可继续贪倍率
                </div>
              </div>
              <PixelSoulCrystal size={4} />
            </button>
          )}

          {/* 已使用提示 + 离开 */}
          {campfireUsed && (
            <div className="text-center text-[9px] text-[var(--dungeon-text-dim)] mt-2">已执行营地行动</div>
          )}
          {!campfireUsed && (
            <button
              onClick={() => setGame(prev => ({ ...prev, phase: 'map' }))}
              className="w-full py-2.5 mt-2 pixel-btn pixel-btn-ghost text-xs font-bold opacity-60"
            >
              跳过，直接离开
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
