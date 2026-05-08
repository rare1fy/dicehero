/**
 * rewardEvents.ts — 奖励爆出事件总线（直通版）
 *
 * 设计：
 *   - 纯 event bus，业务侧 emitReward 立即派发
 *   - RewardBurstLayer 订阅后执行飞行动画
 *   - 飘字是业务侧直接 addFloatingText 完成，不经此文件
 *
 * [2026-05-08 回滚]
 *   撤销闸门/队列机制：
 *     - 闸门方案无法处理"非出牌结算的奖励"（事件、商店、回合开始等）
 *     - 飘字走老路子（和结算演出节奏同步），此文件只负责飞行动画
 */

export type RewardKind =
  | 'dice'
  | 'card'
  | 'reroll'
  | 'heart'
  | 'armor'
  | 'shield'
  | 'gold'
  | 'fury';

export interface RewardEvent {
  kind: RewardKind;
  amount: number;
  at: number;
  sourceSelector?: string;
}

type Listener = (ev: RewardEvent) => void;

const listeners = new Set<Listener>();

export function onReward(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * 立即派发一次奖励爆出事件。
 * 业务侧在"确定拿到奖励"的那一刻调一下即可，视觉由 RewardBurstLayer 负责。
 */
export function emitReward(kind: RewardKind, amount: number, sourceSelector?: string): void {
  const ev: RewardEvent = { kind, amount, at: Date.now(), sourceSelector };
  listeners.forEach(fn => {
    try { fn(ev); } catch { /* 吞掉，单个订阅者不影响其他 */ }
  });
}

/**
 * 目标 UI 接收奖励时闪一下（由 RewardBurstLayer 在飞行结束时调用）。
 * 对应 CSS：`.reward-recv-flash` 450ms 动画。
 */
export function flashRewardTarget(kind: RewardKind): void {
  const el = document.querySelector<HTMLElement>(`[data-reward-target="${kind}"]`);
  if (!el) return;
  el.classList.remove('reward-recv-flash');
  void el.offsetWidth;
  el.classList.add('reward-recv-flash');
  window.setTimeout(() => { el.classList.remove('reward-recv-flash'); }, 450);
}
