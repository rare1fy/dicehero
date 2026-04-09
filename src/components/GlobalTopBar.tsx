import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelCoin, PixelSword, PixelSoulCrystal } from './PixelIcons';
import { StatsModal } from './StatsModal';
import { SettingsPanel } from './SettingsPanel';
import { RelicGuideModal } from './RelicGuideModal';

export const GlobalTopBar: React.FC = () => {
  const { game, setShowTutorial, setShowHandGuide, setShowDiceGuide } = useGameContext();
  const [showStats, setShowStats] = useState(false);
  const [showRelicGuide, setShowRelicGuide] = useState(false);

  return (
    <div className="flex justify-between items-center px-3 py-1.5 bg-[var(--dungeon-bg-light)] border-b-3 border-[var(--dungeon-panel-border)] z-30 shrink-0">
      <div className="flex items-center gap-1.5">
        {/* 魂晶数量 + 倍率（图标底部绝对定位） */}
        <div className="flex items-center gap-1 text-purple-400 font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative group cursor-help" style={{borderRadius:'2px'}}>
          <span className="relative">
            <PixelSoulCrystal size={2} />
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 text-[8px] text-purple-200 whitespace-nowrap leading-none font-bold" style={{textShadow:'0 0 2px #000, 0 0 2px #000'}}>×{(game.soulCrystalMultiplier || 1).toFixed(1)}</span>
          </span>
          <span className="font-bold">{game.blackMarketQuota || 0}</span>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[var(--dungeon-panel)] border-2 border-purple-500 px-2 py-1 text-[8px] text-purple-300 z-[200] pixel-text-shadow min-w-[180px]" style={{borderRadius:'2px', whiteSpace:'normal'}}>
            魂晶 — 首次出牌秒杀时获得（溢出伤害×倍率）。撤离转移后倍率归1，不撤离可贪更高倍率，死亡全丢。
          </div>
        </div>
        <div className="w-[2px] h-4 bg-[var(--dungeon-panel-border)]" />
        {/* 金币 */}
        <div className="flex items-center gap-1 text-[var(--pixel-gold)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative group cursor-help" style={{borderRadius:'2px'}}>
          <PixelCoin size={2} /> <span className="font-bold">{game.souls}</span>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-gold)] px-2 py-1 text-[8px] text-[var(--pixel-gold-light)] whitespace-nowrap z-[200] pixel-text-shadow" style={{borderRadius:'2px'}}>
            {'\u91D1\u5E01'} {'\u2014'} {'\u7528\u4E8E\u5546\u5E97\u8D2D\u4E70\u9AB0\u5B50\u548C\u589E\u5E45'}
          </div>
        </div>
        <div className="w-[2px] h-4 bg-[var(--dungeon-panel-border)]" />
        {/* 总伤害 */}
        <button
          onClick={() => setShowStats(true)}
          className="flex items-center gap-1 text-[var(--pixel-red)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative group cursor-pointer hover:border-[var(--pixel-red)] transition-colors"
          style={{borderRadius:'2px'}}
        >
          <PixelSword size={2} /> <span className="font-bold">{game.stats.totalDamageDealt}</span>
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-red)] px-2 py-1 text-[8px] text-[var(--pixel-red-light)] whitespace-nowrap z-[200] pixel-text-shadow" style={{borderRadius:'2px'}}>
            {'\u603B\u4F24\u5BB3'} {'\u2014'} {'\u70B9\u51FB\u67E5\u770B\u8BE6\u7EC6\u7EDF\u8BA1'}
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <SettingsPanel onResetTutorial={() => setShowTutorial(true)} onOpenHandGuide={() => setShowHandGuide(true)} onOpenDiceGuide={() => setShowDiceGuide(true)} onOpenRelicGuide={() => setShowRelicGuide(true)} />
      </div>
      <AnimatePresence>
        {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      </AnimatePresence>
      {showRelicGuide && (
        <RelicGuideModal isOpen={showRelicGuide} onClose={() => setShowRelicGuide(false)} ownedRelicIds={game.relics.map(r => r.id)} />
      )}
    </div>
  );
};