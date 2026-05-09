/**
 * settlement/phase1_handDisplay.ts — Phase 1 牌型展示
 *
 * ARCH-17 从 settlementAnimation.ts L89-L112 拆出
 * 原行为：setShowRelicPanel(true) → setSettlementPhase('hand') → 铺数据 → 0.6s 展示
 */

import type { SettlementContext } from './types';

export async function runPhase1HandDisplay(ctx: SettlementContext): Promise<void> {
  const {
    currentHands, selected, outcome,
    setSettlementData, setSettlementPhase, setShowRelicPanel,
    playSound, addLog,
  } = ctx;

  // [BATTLE-LOG 2026-05-09] 在结算开始时输出详细日志：
  //   打出 [牌型]，选中骰子 [3,5,5]，基础X×倍率Y → 预计 Z 伤害（Q 护甲，R 治疗）
  const diceList = selected.map(d => d.value).join(',');
  const parts = [`打出【${outcome.bestHand}】，选中 [${diceList}]`];
  parts.push(`基础${outcome.baseHandValue} × 倍率${outcome.handMultiplier.toFixed(2)}`);
  if (outcome.damage > 0) parts.push(`预计造成 ${outcome.damage} 伤害`);
  if (outcome.armor > 0) parts.push(`+${outcome.armor} 护甲`);
  if (outcome.heal && outcome.heal > 0) parts.push(`+${outcome.heal} 治疗`);
  if (outcome.statusEffects && outcome.statusEffects.length > 0) {
    const sts = outcome.statusEffects.map((s: { type: string; value: number }) => `${s.type}+${s.value}`).join('、');
    parts.push(`施加 ${sts}`);
  }
  addLog(parts.join('，'));

  // Phase 1: 牌型展示 (0.6s)
  // ========================================
  setShowRelicPanel(true); // 结算时展开遗物面板
  setSettlementPhase('hand');
  setSettlementData({
    bestHand: outcome.bestHand,
    selectedDice: selected,
    diceScores: selected.map(d => d.value),
    baseValue: outcome.baseHandValue,
    mult: outcome.handMultiplier,
    currentBase: outcome.baseHandValue,
    currentMult: outcome.handMultiplier,
    triggeredEffects: [],
    currentEffectIdx: -1,
    finalDamage: outcome.damage,
    finalArmor: outcome.armor,
    finalHeal: outcome.heal,
    statusEffects: outcome.statusEffects,
    isSameElement: currentHands.activeHands.some(h => ['同元素', '元素顺', '元素葫芦', '皇家元素顺'].includes(h)),
  });
  playSound('relic_activate');
  await new Promise(r => setTimeout(r, 600));
}