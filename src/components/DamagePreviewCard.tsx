/**
 * DamagePreviewCard.tsx — 出牌预期结算卡片
 *
 * 玩家回合手牌选中后，底部显示的预期结果卡片：
 *   - 牌型名称 + 等级
 *   - 预期伤害 / 护甲 / 治疗 / 状态效果
 *   - 本次将触发的遗物图标列（击中后弹出遗物详情）
 *   - 整卡点击 → 打开 CalcModal 详细计算过程
 *
 * 从 EnemyStageView.tsx 拆分（2026-04-21，铁律 B.1 强制拆分）。
 * 修复：原 IIFE 改为提前计算 + 非空断言改为 type guard filter。
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PixelHeart,
  PixelShield,
  PixelZap,
} from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import { useBattleContext } from '../contexts/BattleContext';
import { STATUS_INFO } from '../data/statusInfo';

export function DamagePreviewCard() {
  const {
    game,
    expectedOutcome,
    settlementPhase,
    flashingRelicIds,
    setSelectedRelic,
    setShowCalcModal,
  } = useBattleContext();

  const shouldRender = expectedOutcome && !game.isEnemyTurn && !settlementPhase;

  // 预计算本次将触发的遗物集合（修复非空断言警告：用 type guard 替代 !）
  const outcomeTriggeredRelicIds = new Set(
    (expectedOutcome?.triggeredAugments || [])
      .map(ta => ta.relicId)
      .filter((id): id is string => typeof id === 'string')
  );
  const sceneTriggeredRelics = shouldRender
    ? game.relics.filter(relic => flashingRelicIds.includes(relic.id) || outcomeTriggeredRelicIds.has(relic.id))
    : [];

  return (
    <AnimatePresence>
      {shouldRender && expectedOutcome && (
        <div className="absolute z-[80] bottom-2 left-2 right-2 flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="max-w-[340px]"
          >
            <div
              className="relative flex flex-col pointer-events-auto"
              style={{
                background: 'linear-gradient(180deg, rgba(20,16,10,0.92) 0%, rgba(14,10,6,0.96) 100%)',
                border: '2px solid var(--pixel-gold)',
                borderRadius: '3px',
                boxShadow: '0 0 12px rgba(212,160,48,0.2), 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,160,48,0.1)',
                padding: '5px 10px 4px',
              }}
            >
              {/* 上部：牌型 / 数值 */}
              <div
                className="flex items-center justify-between gap-2 pointer-events-auto cursor-pointer"
                onClick={() => setShowCalcModal(true)}
              >
                {/* 左侧：牌型名 */}
                <div
                  className="text-[12px] font-black tracking-wider text-[var(--pixel-gold-light)] pixel-text-shadow leading-tight shrink-0"
                  style={{ textShadow: '0 0 8px rgba(212,160,48,0.5)' }}
                >
                  {expectedOutcome.bestHand}
                  {game.handLevels[expectedOutcome.bestHand] > 1 && (
                    <span className="ml-1 text-[8px] opacity-60 font-mono">Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                  )}
                </div>
                {/* 右侧：数值组 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {expectedOutcome.damage > 0 && (
                    <motion.span
                      animate={{ textShadow: ['0 0 4px rgba(200,64,60,0.4)', '0 0 10px rgba(200,64,60,0.7)', '0 0 4px rgba(200,64,60,0.4)'] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="flex items-center gap-0.5 text-[var(--pixel-red-light)] text-[13px] font-black font-mono pixel-text-shadow"
                    >
                      <PixelZap size={1.5} />{expectedOutcome.damage}
                    </motion.span>
                  )}
                  {expectedOutcome.armor > 0 && (
                    <span className="flex items-center gap-0.5 text-[var(--pixel-blue-light)] text-[10px] font-bold font-mono pixel-text-shadow">
                      <PixelShield size={1.5} />+{expectedOutcome.armor}
                    </span>
                  )}
                  {expectedOutcome.heal > 0 && (
                    <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold font-mono pixel-text-shadow">
                      <PixelHeart size={1.5} />+{expectedOutcome.heal}
                    </span>
                  )}
                  {expectedOutcome.statusEffects && expectedOutcome.statusEffects.length > 0 && (
                    expectedOutcome.statusEffects.map((s, i) => {
                      const info = STATUS_INFO[s.type];
                      return (
                        <span key={i} className={`flex items-center gap-0.5 text-[9px] font-bold ${info.color}`}>
                          {info.icon}{s.value}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 下部：激活遗物行 */}
              {sceneTriggeredRelics.length > 0 && (
                <>
                  <div
                    className="w-full h-[1px] my-[3px]"
                    style={{ background: 'linear-gradient(90deg, transparent, var(--pixel-gold), transparent)', opacity: 0.25 }}
                  />
                  <div className="flex items-center gap-1 flex-wrap pointer-events-auto">
                    {sceneTriggeredRelics.map((relic, i) => (
                      <motion.div
                        key={relic.id + '-sr-' + i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 flex items-center justify-center cursor-pointer border border-[var(--pixel-gold)] shrink-0"
                        style={{ borderRadius: '2px', background: 'rgba(212,160,48,0.12)', boxShadow: '0 0 6px rgba(212,160,48,0.3)' }}
                        onClick={() => setSelectedRelic(relic)}
                      >
                        <RelicPixelIcon relicId={relic.id} size={1.5} />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
