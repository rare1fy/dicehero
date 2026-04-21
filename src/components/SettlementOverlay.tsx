/**
 * SettlementOverlay.tsx — 结算演出覆盖层
 *
 * 出牌结算时的中央全屏覆盖层 UI：
 *   - 牌型横幅（带元素共鸣 +100% 提示）
 *   - 骰子序列展示（按 currentEffectIdx 高亮）
 *   - 积分条（base × mult%，bounce 阶段有弹跳动画）
 *   - 触发效果列表（遗物/状态/技能）
 *
 * 从 EnemyStageView.tsx 拆分（2026-04-21，铁律 B.1 强制拆分）。
 * 仅消费 useBattleContext 的 settlementPhase / settlementData。
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PixelFlame,
  PixelZap,
  PixelBloodDrop,
} from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import { PixelDiceRenderer } from './PixelDiceRenderer';
import { useBattleContext } from '../contexts/BattleContext';

export function SettlementOverlay() {
  const { settlementPhase, settlementData } = useBattleContext();

  return (
    <AnimatePresence>
      {settlementPhase && settlementData && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div className="flex flex-col items-center animate-fade-in">
            {/* 牌型卡片 */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative px-6 py-3"
              style={{
                background: 'linear-gradient(180deg, rgba(20,16,30,0.95) 0%, rgba(12,10,20,0.98) 100%)',
                border: '3px solid var(--pixel-gold)',
                borderRadius: '2px',
                boxShadow: '0 0 20px rgba(212,160,48,0.3), 0 0 40px rgba(212,160,48,0.1), inset 0 1px 0 rgba(255,240,180,0.1), inset 0 -2px 0 rgba(0,0,0,0.4)',
              }}
            >
              {/* 像素角装饰 */}
              <div className="absolute -top-[3px] -left-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
              <div className="absolute -top-[3px] -right-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
              <div className="absolute -bottom-[3px] -left-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
              <div className="absolute -bottom-[3px] -right-[3px] w-2 h-2 bg-[var(--pixel-gold)]" />
              <div className="text-center">
                <div
                  className="text-2xl font-black tracking-wider text-[var(--pixel-gold)] pixel-text-shadow"
                  style={{ textShadow: '0 0 16px rgba(212,160,48,0.9), 0 2px 0 rgba(0,0,0,0.8)' }}
                >
                  {settlementData.bestHand}
                </div>
                {settlementData.isSameElement && (
                  <div
                    className="text-[10px] font-bold text-[var(--pixel-cyan)] mt-1 animate-pulse tracking-widest"
                    style={{ textShadow: '0 0 10px rgba(48,216,208,0.8)' }}
                  >
                    ◆ 元素共鸣 +100% ◆
                  </div>
                )}
              </div>
            </motion.div>

            {/* 骰子展示区 */}
            <div className="flex gap-2 mt-5">
              {settlementData.selectedDice.map((d, i) => {
                const isLit = settlementPhase === 'dice' && settlementData.currentEffectIdx >= i;
                return (
                  <motion.div
                    key={d.id}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: isLit ? 1.1 : 1, rotate: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3, type: 'spring', stiffness: 300 }}
                    className="relative"
                    style={{ filter: isLit ? 'drop-shadow(0 0 8px rgba(212,160,48,0.7))' : 'none' }}
                  >
                    <PixelDiceRenderer
                      diceDefId={d.diceDefId}
                      value={d.value}
                      size={48}
                      selected={isLit}
                      element={d.collapsedElement || (d.element !== 'normal' ? d.element : undefined)}
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* 计分条 — 像素风格卡片 */}
            <motion.div
              className="relative flex items-center justify-center gap-2 mt-3 px-5 py-2.5"
              style={{
                background: 'linear-gradient(180deg, rgba(16,20,28,0.95) 0%, rgba(8,12,18,0.98) 100%)',
                border: '2px solid var(--dungeon-panel-border)',
                borderRadius: '2px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.5)',
                minWidth: '140px',
              }}
              animate={settlementPhase === 'bounce' ? {
                scale: [1, 1.25, 0.9, 1.05, 1],
                borderColor: ['var(--dungeon-panel-border)', 'var(--pixel-gold)', 'var(--pixel-orange)', 'var(--pixel-gold)', 'var(--dungeon-panel-border)'],
              } : { scale: 1 }}
              transition={settlementPhase === 'bounce' ? {
                duration: 0.5,
                times: [0, 0.25, 0.5, 0.75, 1],
                ease: 'easeOut',
              } : { duration: 0 }}
            >
              <span
                key={`base-${settlementData.currentBase}-${settlementData.currentEffectIdx}`}
                className={`text-[var(--pixel-blue)] font-black text-2xl font-mono animate-value-pop ${settlementPhase === 'effects' ? 'settlement-value-glow-blue' : ''}`}
                style={{ textShadow: '0 0 8px rgba(60,120,220,0.5)' }}
              >
                {settlementData.currentBase}
              </span>
              <span className={`text-[var(--dungeon-text-dim)] text-lg font-black ${settlementPhase === 'mult' || settlementPhase === 'effects' || settlementPhase === 'damage' ? 'animate-percent-flash' : ''}`}>×</span>
              <span
                key={`mult-${Math.round(settlementData.currentMult * 100)}-${settlementData.currentEffectIdx}`}
                className={`text-[var(--pixel-red)] font-black text-2xl font-mono ${settlementPhase === 'mult' || settlementPhase === 'effects' || settlementPhase === 'damage' ? 'animate-value-pop settlement-value-glow-red' : 'opacity-40'}`}
                style={{ textShadow: settlementPhase === 'mult' || settlementPhase === 'effects' ? '0 0 8px rgba(220,60,60,0.5)' : 'none' }}
              >
                {Math.round(settlementData.currentMult * 100)}%
              </span>
            </motion.div>

            {/* 触发效果列表 */}
            {settlementPhase === 'effects' && settlementData.triggeredEffects.length > 0 && (
              <div className="flex flex-col items-center gap-1 mt-2">
                {settlementData.triggeredEffects.map((eff, i) => {
                  const bgClass = eff.type === 'mult'
                    ? 'bg-[rgba(224,60,60,0.15)] border-[var(--pixel-red)] text-[var(--pixel-red-light)]'
                    : eff.type === 'heal'
                      ? 'bg-[rgba(60,180,60,0.15)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]'
                      : 'bg-[rgba(60,120,224,0.15)] border-[var(--pixel-blue)] text-[var(--pixel-blue-light)]';
                  const prefix = eff.type === 'mult' ? '×' : '+';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`text-[10px] px-3 py-1 border font-bold flex items-center gap-1.5 ${bgClass}`}
                      style={{ borderRadius: '2px' }}
                    >
                      {eff.relicId && <RelicPixelIcon relicId={eff.relicId} size={2} />}
                      {!eff.relicId && eff.icon === 'blooddrop' && <PixelBloodDrop size={2} />}
                      {!eff.relicId && eff.icon === 'flame' && <PixelFlame size={2} />}
                      {!eff.relicId && eff.icon === 'zap' && <PixelZap size={2} />}
                      <span>{prefix} {eff.name}: {eff.detail}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
