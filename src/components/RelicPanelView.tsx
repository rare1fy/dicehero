/**
 * RelicPanelView.tsx — 遗物库面板视图
 *
 * 从 DiceHeroGame.tsx 提取（ARCH-F Round2）。
 * 包含：遗物库收起按钮、遗物详情弹窗、遗物库半窗口浮层、外层遗物详情弹窗
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelClose } from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import { useBattleContext } from '../contexts/BattleContext';
import { formatDescription } from '../utils/richText';

export function RelicPanelView() {
  const {
    game,
    expectedOutcome,
    flashingRelicIds,
    selectedRelic,
    setSelectedRelic,
    showRelicPanel,
    setShowRelicPanel,
  } = useBattleContext();

  return (
    <>
      {/* 遗物库面板（收起状态） */}
      <div className="px-2 pb-2 pt-0"
        style={{
          borderTop: '2px solid rgba(80,70,55,0.6)',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.5), 0 -1px 0 rgba(120,100,70,0.25)',
          background: 'linear-gradient(to bottom, rgba(40,34,26,0.6) 0%, rgba(20,18,14,0.3) 60%, transparent 100%)',
        }}
      >
        <button
          onClick={() => setShowRelicPanel(prev => !prev)}
          className="w-full flex flex-col items-center justify-center py-1.5 transition-colors"
          style={{ textShadow: '0 0 4px rgba(212,160,48,0.3)' }}
        >
          <span className="text-[11px] text-[var(--pixel-gold)] font-bold leading-none">▲</span>
          <span className="text-[12px] text-[var(--pixel-gold)] hover:text-[var(--pixel-gold-light)] font-black tracking-[0.2em] leading-tight mt-0.5">遗物库</span>
          <span className="text-[9px] text-[var(--dungeon-text-dim)] font-mono leading-none mt-0.5">- {game.relics.length}件 -</span>
        </button>
      </div>

      {/* 遗物详情弹窗 */}
      {selectedRelic && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70" onClick={() => setSelectedRelic(null)}>
          <div className="pixel-panel p-4 max-w-[280px] w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-2">
              <div className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">{selectedRelic.name}</div>
              <div className="text-[8px] text-[var(--pixel-gold)] mt-0.5">{selectedRelic.rarity === 'common' ? '普通' : selectedRelic.rarity === 'uncommon' ? '精良' : selectedRelic.rarity === 'rare' ? '稀有' : '传说'}</div>
            </div>
            <div className="text-[10px] text-[var(--dungeon-text)] leading-relaxed text-center">{formatDescription(selectedRelic.description)}</div>
            <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">触发: {selectedRelic.trigger === 'on_play' ? '每次出牌' : selectedRelic.trigger === 'on_kill' ? '击杀时' : selectedRelic.trigger === 'on_reroll' ? '重 Roll时' : selectedRelic.trigger === 'on_battle_end' ? '战斗结束' : selectedRelic.trigger === 'on_fatal' ? '致命伤害时' : selectedRelic.trigger === 'on_turn_end' ? '回合结束' : '被动'}</div>
            <button onClick={() => setSelectedRelic(null)} className="w-full mt-3 py-1.5 pixel-btn pixel-btn-ghost text-[10px]">关闭</button>
          </div>
        </div>
      )}

      {/* 遗物库半窗口浮层 */}
      <AnimatePresence>
        {showRelicPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-black/50"
            onClick={() => setShowRelicPanel(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[55vh]"
              style={{
                background: 'linear-gradient(180deg, rgba(16,14,20,0.98) 0%, rgba(10,8,14,0.99) 100%)',
                borderTop: '3px solid var(--pixel-gold)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.6), 0 -1px 0 rgba(212,160,48,0.15)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* 顶部栏 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--dungeon-panel-border)]">
                <span className="text-[11px] font-black text-[var(--pixel-gold)] tracking-wider pixel-text-shadow"
                  style={{ textShadow: '0 0 6px rgba(212,160,48,0.4)' }}>
                  遗物库 ({game.relics.length})
                </span>
                <button
                  onClick={() => setShowRelicPanel(false)}
                  className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] px-1 py-0.5 transition-colors"
                >
                  <PixelClose size={2} />
                </button>
              </div>
              {/* 遗物网格 */}
              <div className="overflow-y-auto p-3" style={{ maxHeight: 'calc(55vh - 40px)' }}>
                {game.relics.length === 0 && (
                  <div className="flex items-center justify-center py-6 opacity-30">
                    <span className="text-[10px] text-[var(--dungeon-text-dim)]">暂无遗物</span>
                  </div>
                )}
                {/* 遗物区 */}
                {game.relics.length > 0 && (
                  <>
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] font-bold tracking-wider mb-1.5">遗物</div>
                    <div className="grid grid-cols-6 gap-1.5 mb-3">
                      {game.relics.map((relic, i) => {
                        const isActive = expectedOutcome?.triggeredAugments?.some(ta => ta.relicId === relic.id) || false;
                        const isFlashing = flashingRelicIds.includes(relic.id);
                        return (
                          <div
                            key={relic.id + "-rp-" + i}
                            className={`flex flex-col items-center justify-center cursor-pointer border-2 transition-all duration-200 ${
                              isActive
                                ? "border-[var(--pixel-gold)] bg-gradient-to-b from-[rgba(212,160,48,0.2)] to-[rgba(180,120,30,0.08)]"
                                : "bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] hover:border-[var(--dungeon-text-dim)]"
                            }`}
                            style={{
                              borderRadius: '3px',
                              padding: '4px 2px 3px',
                              ...(isActive ? { boxShadow: '0 0 8px rgba(212,160,48,0.3)' } : {}),
                              ...(isFlashing ? { boxShadow: '0 0 16px rgba(255,255,255,0.9), 0 0 30px rgba(212,160,48,0.8)', animation: 'relic-flash 0.6s ease-out' } : {}),
                            }}
                            onClick={() => setSelectedRelic(relic)}
                          >
                            <RelicPixelIcon relicId={relic.id} size={2.5} />
                            <span className="text-[6px] font-bold text-[var(--dungeon-text-dim)] mt-0.5 truncate max-w-full px-0.5 leading-none text-center">
                              {relic.name.length > 4 ? relic.name.slice(0, 4) : relic.name}
                            </span>
                            {relic.counter !== undefined && (
                              <span className="text-[6px] font-mono font-bold text-[var(--pixel-orange-light)] leading-none">
                                {relic.counter}{relic.counterLabel || ''}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {/* [ARCH-4] 增强模块区已移除 — 统一到遗物 */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** 外层遗物详情弹窗（位于motion.div内层，不同于player-hud-panel内的弹窗） */
export function RelicDetailModal() {
  const { selectedRelic, setSelectedRelic } = useBattleContext();

  return (
    <AnimatePresence>
      {selectedRelic && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedRelic(null)}
          className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="pixel-panel p-5 w-full max-w-xs relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-5 right-5 text-[var(--pixel-gold)] opacity-15">
              <RelicPixelIcon relicId={selectedRelic.id} size={2.5} />
            </div>
            <div className="text-[var(--pixel-gold)] font-bold text-lg mb-2 relative z-10 pixel-text-shadow">{selectedRelic.name}</div>
            <div className="text-[var(--dungeon-text-dim)] text-[12px] tracking-[0.1em] mb-3 relative z-10">
              {selectedRelic.rarity === 'legendary' ? '传说' : selectedRelic.rarity === 'rare' ? '稀有' : selectedRelic.rarity === 'uncommon' ? '精良' : '普通'}
            </div>
            <div className="text-[var(--dungeon-text)] text-[13px] mb-3 relative z-10">{formatDescription(selectedRelic.description)}</div>
            <button 
              onClick={() => setSelectedRelic(null)}
              className="w-full py-2.5 pixel-btn pixel-btn-ghost text-xs font-bold relative z-10"
            >
              关闭
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
