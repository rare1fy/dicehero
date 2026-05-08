/**
 * rewardEvents.ts — 奖励爆出事件总线（闸门版 v2）
 *
 * 设计（2026-05-08 v2）：
 *   1) emitReward / emitDeferredFloat 都走同一个 busy 闸门
 *   2) 闸门判据由 DiceHeroGame 监听 showDamageOverlay 的变化设定
 *      - busy=true  → 入队堆积（结算弹窗显示中）
 *      - busy=false → flush（弹窗关闭瞬间整批放出）
 *   3) 非出牌场景（事件/商店/回合开始）不触发 showDamageOverlay，
 *      busy 永远是 false，直通行为。
 *
 * 上次（v1）错在把判据挂在"金色飘字颜色"上，误伤 phase3 演出本体旁白。
 * 这次（v2）挂在 showDamageOverlay 状态上，演出本体照常走，只堆"出牌后副作用"。
 * 业务侧要走闸门的飘字必须主动调 emitDeferredFloat，不再自动拦截。
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

type RewardListener = (ev: RewardEvent) => void;
type FloatListener = (text: string, color: string, icon: unknown, target: 'player' | 'enemy') => void;

const rewardListeners = new Set<RewardListener>();
const floatListeners = new Set<FloatListener>();

interface QueuedReward { kind: RewardKind; amount: number; sourceSelector?: string; }
interface QueuedFloat { text: string; color: string; icon: unknown; target: 'player' | 'enemy'; }

const rewardQueue: QueuedReward[] = [];
const floatQueue: QueuedFloat[] = [];
let busy = false;

export function onReward(fn: RewardListener): () => void {
  rewardListeners.add(fn);
  return () => { rewardListeners.delete(fn); };
}

export function onDeferredFloat(fn: FloatListener): () => void {
  floatListeners.add(fn);
  return () => { floatListeners.delete(fn); };
}

function dispatchReward(r: QueuedReward): void {
  const ev: RewardEvent = { kind: r.kind, amount: r.amount, at: Date.now(), sourceSelector: r.sourceSelector };
  rewardListeners.forEach(fn => { try { fn(ev); } catch { /* 吞掉 */ } });
}

function dispatchFloat(f: QueuedFloat): void {
  floatListeners.forEach(fn => { try { fn(f.text, f.color, f.icon, f.target); } catch { /* 吞掉 */ } });
}

function flushAll(): void {
  // 飘字错峰派发：同帧连发会视觉贴死（lane 18px 上下偏移不够拉开），
  // 每条间隔 220ms 依次冒出，和骰子点数的弹出节奏一致。
  // 飞行奖励（emitReward）保持同帧：不同 target 终点不同，RewardBurstLayer 内部已有错峰。
  const floatsSnapshot = floatQueue.splice(0, floatQueue.length);
  const rewardsSnapshot = rewardQueue.splice(0, rewardQueue.length);
  floatsSnapshot.forEach((f, i) => {
    if (i === 0) dispatchFloat(f);
    else setTimeout(() => dispatchFloat(f), i * 220);
  });
  rewardsSnapshot.forEach(r => dispatchReward(r));
}

/**
 * 闸门开关。由 DiceHeroGame 监听 showDamageOverlay 变化调用。
 * 上次 v1 挂在 settlementPhase，会误伤 phase3 演出本体飘字。v2 只挂在 overlay。
 */
export function setRewardBusy(next: boolean): void {
  if (busy === next) return;
  busy = next;
  if (!busy && (rewardQueue.length > 0 || floatQueue.length > 0)) {
    flushAll();
  }
}

/** 查询闸门当前是否堆积中（useBattleState 的 addFloatingText 自动分流用）。 */
export function isRewardBusy(): boolean {
  return busy;
}

export function emitReward(kind: RewardKind, amount: number, sourceSelector?: string): void {
  if (busy) {
    rewardQueue.push({ kind, amount, sourceSelector });
    return;
  }
  dispatchReward({ kind, amount, sourceSelector });
}

/**
 * 延迟派发的奖励飘字专用入口。
 * 业务侧（postPlayEffects / rogueComboEffects / turnEndProcessing 等"出牌后"副作用）
 * 调此方法代替 addFloatingText，即可在结算弹窗期间自动堆积。
 */
export function emitDeferredFloat(
  text: string,
  color: string,
  icon: unknown,
  target: 'player' | 'enemy' = 'player'
): void {
  if (busy) {
    floatQueue.push({ text, color, icon, target });
    return;
  }
  dispatchFloat({ text, color, icon, target });
}

export function flashRewardTarget(kind: RewardKind): void {
  const el = document.querySelector<HTMLElement>(`[data-reward-target="${kind}"]`);
  if (!el) return;
  el.classList.remove('reward-recv-flash');
  void el.offsetWidth;
  el.classList.add('reward-recv-flash');
  window.setTimeout(() => { el.classList.remove('reward-recv-flash'); }, 450);
}
