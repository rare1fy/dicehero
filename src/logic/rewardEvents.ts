/**
 * rewardEvents.ts — 奖励爆出事件总线
 *
 * 出牌后效 / 抽牌 / 重投 / 遗物触发等"玩家获得 X"的场景，统一 emitReward
 * RewardBurstLayer 订阅事件：
 *   1) 从 sourceSelector（默认手牌区）爆出对应 icon
 *   2) 飞向 targetSelector（由 kind 映射到 HUD 上的 data-reward-target）
 *   3) 目标 UI 元素接收到后自行刷一下光（通过 css class 触发）
 *
 * 独立于 React 状态，避免污染 GameState 或 addFloatingText 签名。
 *
 * [2026-05-08] 新增，配合统一金黄色飘字和空间隔离飘字，解决"五颜六色看不懂"问题。
 */

export type RewardKind =
  | 'dice'       // +骰子（飞向 骰子库）
  | 'card'       // +出牌机会（飞向 出牌按钮）
  | 'reroll'     // +免费重投（飞向 重投按钮）
  | 'heart'      // +生命（飞向 HP条）
  | 'armor'      // +护甲（飞向 护甲icon）
  | 'shield'     // +奥术屏障（飞向 屏障icon）
  | 'gold'       // +金币（飞向 金币）
  | 'fury';      // +血怒（飞向 狂暴icon）

export interface RewardEvent {
  kind: RewardKind;
  amount: number;
  at: number;
  /** 起源 DOM selector，未提供则用手牌锚点 */
  sourceSelector?: string;
}

type Listener = (ev: RewardEvent) => void;

const listeners = new Set<Listener>();

export function onReward(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emitReward(kind: RewardKind, amount: number, sourceSelector?: string): void {
  const ev: RewardEvent = { kind, amount, at: Date.now(), sourceSelector };
  listeners.forEach(fn => {
    try { fn(ev); } catch (_e) { /* 吞掉 */ }
  });
}

/**
 * 触发目标 UI 元素的"接收闪光"动画。
 * 通过 toggle class `reward-recv-flash` 实现，CSS 里定义 0.4s 闪光 keyframe。
 */
export function flashRewardTarget(kind: RewardKind): void {
  const el = document.querySelector<HTMLElement>(`[data-reward-target="${kind}"]`);
  if (!el) return;
  el.classList.remove('reward-recv-flash');
  // 强制回流，保证每次都能重新触发动画
  void el.offsetWidth;
  el.classList.add('reward-recv-flash');
  window.setTimeout(() => { el.classList.remove('reward-recv-flash'); }, 450);
}
