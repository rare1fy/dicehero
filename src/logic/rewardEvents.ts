/**
 * rewardEvents.ts — 奖励爆出事件总线（队列版）
 *
 * 核心机制：
 *   1) emitReward 只入队，不立即执行
 *   2) 外部通过 setRewardBusy(true/false) 标记"当前是否在战斗演出中"
 *      busy = true  → 队列堆积
 *      busy = false → 顺序 flush（80ms 错峰，避免同帧挤堆）
 *   3) 闸门驱动源：settlementPhase !== null || showDamageOverlay !== null
 *      ——由 BattleContext 监听状态变化调用 setRewardBusy
 *
 * [2026-05-08 架构迭代]
 *   去掉 400ms 硬延迟魔法数字，改为状态机驱动。
 *   解决"伤害演出时长变化 / 暴击 / AOE 多段"导致魔法数字失效的问题。
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

// 订阅 / 通知 —— 飞行动画
const listeners = new Set<Listener>();
// 订阅 / 通知 —— 奖励飘字（只影响金色+icon奖励类飘字，伤害飘字不走这条）
type FloatListener = (text: string, color: string, icon: unknown, target: 'player' | 'enemy') => void;
const floatListeners = new Set<FloatListener>();

// 闸门队列
interface QueuedReward { kind: RewardKind; amount: number; sourceSelector?: string; }
interface QueuedFloat { text: string; color: string; icon: unknown; target: 'player' | 'enemy'; }
const rewardQueue: QueuedReward[] = [];
const floatQueue: QueuedFloat[] = [];
let busy = false;

const FLUSH_STEP_MS = 80;  // 同批次错峰间隔，防同帧堆叠

export function onReward(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function onRewardFloat(fn: FloatListener): () => void {
  floatListeners.add(fn);
  return () => { floatListeners.delete(fn); };
}

function dispatchReward(r: QueuedReward): void {
  const ev: RewardEvent = { kind: r.kind, amount: r.amount, at: Date.now(), sourceSelector: r.sourceSelector };
  listeners.forEach(fn => { try { fn(ev); } catch { /* 吞掉 */ } });
}

function dispatchFloat(f: QueuedFloat): void {
  floatListeners.forEach(fn => { try { fn(f.text, f.color, f.icon, f.target); } catch { /* 吞掉 */ } });
}

function flushAll(): void {
  // 飘字先爆（视觉引导"获得"），再接飞行动画，错峰展开
  const combined: Array<() => void> = [];
  for (const f of floatQueue) combined.push(() => dispatchFloat(f));
  for (const r of rewardQueue) combined.push(() => dispatchReward(r));
  floatQueue.length = 0;
  rewardQueue.length = 0;

  combined.forEach((fn, i) => {
    window.setTimeout(fn, i * FLUSH_STEP_MS);
  });
}

/**
 * 闸门开关。由 BattleContext 监听 settlementPhase / showDamageOverlay 变化调用。
 * true  = 正在演出，奖励入队
 * false = 演出完毕，flush 所有堆积的奖励
 */
export function setRewardBusy(next: boolean): void {
  if (busy === next) return;
  busy = next;
  if (!busy && (rewardQueue.length > 0 || floatQueue.length > 0)) {
    flushAll();
  }
}

export function emitReward(kind: RewardKind, amount: number, sourceSelector?: string): void {
  if (busy) {
    rewardQueue.push({ kind, amount, sourceSelector });
    return;
  }
  // 非演出期，直接派发
  dispatchReward({ kind, amount, sourceSelector });
}

/**
 * 奖励类飘字专用入口。与 emitReward 共享闸门，保证"先演出→后爆飘字→后飞动画"的顺序。
 * 业务调用点原先用 addFloatingText 的奖励场景，都改走这里。
 */
export function emitRewardFloat(
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
