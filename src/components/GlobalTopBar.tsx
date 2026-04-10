import React, { useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelCoin, PixelSword, PixelSoulCrystal } from './PixelIcons';
import { StatsModal } from './StatsModal';
import { SettingsPanel } from './SettingsPanel';
import { RelicGuideModal } from './RelicGuideModal';

/** 长按/hover tooltip hook */
const useLongPressTooltip = (delay = 300) => {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTouchStart = useCallback(() => {
    timerRef.current = setTimeout(() => setShow(true), delay);
  }, [delay]);
  const onTouchEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  }, []);
  const onMouseEnter = useCallback(() => setShow(true), []);
  const onMouseLeave = useCallback(() => setShow(false), []);
  return { show, handlers: { onTouchStart, onTouchEnd, onMouseEnter, onMouseLeave } };
};

export const GlobalTopBar: React.FC = () => {
  const { game, setShowTutorial, setShowHandGuide, setShowDiceGuide } = useGameContext();
  const [showStats, setShowStats] = useState(false);
  const [showRelicGuide, setShowRelicGuide] = useState(false);

  const currentNode = game.map.find(n => n.id === game.currentNodeId);
  const currentDepth = currentNode?.depth || 0;
  const actualMult = (game.soulCrystalMultiplier || 1) + currentDepth * 0.1;

  const soulTip = useLongPressTooltip();
  const coinTip = useLongPressTooltip();
  const dmgTip = useLongPressTooltip();

  return (
    <div className="flex justify-between items-center px-3 py-1.5 bg-[var(--dungeon-bg-light)] border-b-3 border-[var(--dungeon-panel-border)] z-30 shrink-0">
      <div className="flex items-center gap-1.5">
        {/* 魂晶 */}
        <div className="flex items-center gap-1 text-purple-400 font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative" style={{borderRadius:'2px'}} {...soulTip.handlers}>
          <span className="relative">
            <PixelSoulCrystal size={2} />
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 text-[8px] text-purple-200 whitespace-nowrap leading-none font-bold" style={{textShadow:'0 0 2px #000, 0 0 2px #000'}}>×{actualMult.toFixed(1)}</span>
          </span>
          <span className="font-bold">{game.blackMarketQuota || 0}</span>
          {soulTip.show && (
            <div className="absolute left-0 top-full mt-1 bg-[var(--dungeon-panel)] border-2 border-purple-500 px-2 py-1 text-[8px] text-purple-300 z-[200] pixel-text-shadow min-w-[180px]" style={{borderRadius:'2px', whiteSpace:'normal'}}>
              魂晶 — 首次出牌秒杀时获得（溢出伤害×倍率）。撤离转移后倍率归1，不撤离可贪更高倍率，死亡全丢。
            </div>
          )}
        </div>
        <div className="w-[2px] h-4 bg-[var(--dungeon-panel-border)]" />
        {/* 金币 */}
        <div className="flex items-center gap-1 text-[var(--pixel-gold)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative" style={{borderRadius:'2px'}} {...coinTip.handlers}>
          <PixelCoin size={2} /> <span className="font-bold">{game.souls}</span>
          {coinTip.show && (
            <div className="absolute left-0 top-full mt-1 bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-gold)] px-2 py-1 text-[8px] text-[var(--pixel-gold-light)] whitespace-nowrap z-[200] pixel-text-shadow" style={{borderRadius:'2px'}}>
              金币 — 用于商店购买骰子和增幅
            </div>
          )}
        </div>
        <div className="w-[2px] h-4 bg-[var(--dungeon-panel-border)]" />
        {/* 总伤害 */}
        <button
          onClick={() => setShowStats(true)}
          className="flex items-center gap-1 text-[var(--pixel-red)] font-mono text-[10px] bg-[var(--dungeon-bg)] px-2 py-1 border-2 border-[var(--dungeon-panel-border)] relative hover:border-[var(--pixel-red)] transition-colors"
          style={{borderRadius:'2px'}}
          {...dmgTip.handlers}
        >
          <PixelSword size={2} /> <span className="font-bold">{game.stats.totalDamageDealt}</span>
          {dmgTip.show && (
            <div className="absolute left-0 top-full mt-1 bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-red)] px-2 py-1 text-[8px] text-[var(--pixel-red-light)] whitespace-nowrap z-[200] pixel-text-shadow" style={{borderRadius:'2px'}}>
              总伤害 — 点击查看详细统计
            </div>
          )}
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