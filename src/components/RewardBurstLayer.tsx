/**
 * RewardBurstLayer.tsx — 通用奖励爆出 → 飞向UI → 接收闪光动画层
 *
 * 参考 XpShardLayer 的三段动画：爆发 → 停留 → 飞向目标
 * 订阅 rewardEvents，按 kind 分别选 icon / 颜色 / 目标 DOM
 *
 * [2026-05-08] 新增：统一奖励飘字的视觉语言，配合金黄奖励飘字 + 空间隔离
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onReward, flashRewardTarget, type RewardEvent, type RewardKind } from '../logic/rewardEvents';
import {
  PixelDice, PixelCards, PixelRefresh, PixelHeart,
  PixelShield, PixelArcaneShield, PixelCoin, PixelBloodDrop,
} from './PixelIcons';

interface FlyingReward {
  id: string;
  kind: RewardKind;
  amount: number;
  startX: number;
  startY: number;
  scatterX: number;
  scatterY: number;
  endX: number;
  endY: number;
}

const BURST_DUR_MS = 320;
const LINGER_MS = 260;
const FLIGHT_DUR_MS = 780;
// 飞行段中，前 FLY_HOLD_RATIO 比例保持满透明度，之后才快速淡出
const FLY_HOLD_RATIO = 0.78;

const KIND_ICON: Record<RewardKind, React.FC<{ size?: number }>> = {
  dice: PixelDice,
  card: PixelCards,
  reroll: PixelRefresh,
  heart: PixelHeart,
  armor: PixelShield,
  shield: PixelArcaneShield,
  gold: PixelCoin,
  fury: PixelBloodDrop,
  reapDice: PixelDice,  // 噬血：骰子 icon
};

/** reapDice 的 target 实际指向手牌区（data-reward-target="card"） */
const KIND_TARGET_ALIAS: Partial<Record<RewardKind, RewardKind>> = {
  reapDice: 'card',
};

function readCenter(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function resolveTarget(kind: RewardKind): { x: number; y: number } | null {
  const realKind = KIND_TARGET_ALIAS[kind] || kind;
  const el = document.querySelector(`[data-reward-target="${realKind}"]`);
  const c = readCenter(el);
  if (c) return c;
  // 兜底 1：目标 UI 还没渲染（如 armor=0 时无 armor 节点），
  // 用 player-hud-panel 顶部居中作为大致方向
  const hud = document.querySelector('.player-hud-panel');
  const hc = readCenter(hud);
  if (hc) return { x: hc.x, y: hc.y - 40 };
  // 兜底 2：屏幕下方 1/3
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
}

function resolveSource(ev: RewardEvent): { x: number; y: number } | null {
  if (ev.sourceSelector) {
    const el = document.querySelector(ev.sourceSelector);
    const c = readCenter(el);
    if (c) return c;
  }
  // 默认从手牌锚点爆出
  const hand = document.querySelector('[data-hand-anchor]');
  const hc = readCenter(hand);
  if (hc) return hc;
  // 兜底：屏幕中心
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.7 };
}

export const RewardBurstLayer: React.FC = () => {
  const [items, setItems] = useState<FlyingReward[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    const off = onReward((ev: RewardEvent) => {
      requestAnimationFrame(() => {
        const start = resolveSource(ev);
        const end = resolveTarget(ev.kind);
        if (!start || !end) return;

        seqRef.current += 1;
        // 上半圆小幅散开，避免堆在一起
        const ang = Math.PI + Math.random() * Math.PI;
        const r = 22 + Math.random() * 16;
        const dx = Math.cos(ang) * r * 1.4;
        const dy = Math.sin(ang) * r * 0.6;

        const item: FlyingReward = {
          id: `reward-${ev.at}-${seqRef.current}`,
          kind: ev.kind,
          amount: ev.amount,
          startX: start.x,
          startY: start.y,
          scatterX: start.x + dx,
          scatterY: start.y + dy - 24,
          endX: end.x,
          endY: end.y,
        };
        setItems(prev => [...prev, item]);

        // 飞行到目标时刷一下光
        const realKind = (KIND_TARGET_ALIAS[ev.kind] || ev.kind) as RewardKind;
        window.setTimeout(() => { flashRewardTarget(realKind); }, BURST_DUR_MS + LINGER_MS + FLIGHT_DUR_MS - 60);

        // 清理
        const total = BURST_DUR_MS + LINGER_MS + FLIGHT_DUR_MS + 120;
        window.setTimeout(() => {
          setItems(prev => prev.filter(it => it.id !== item.id));
        }, total);
      });
    });
    return () => { off(); };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 199,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {items.map(it => {
          const sx = it.scatterX - it.startX;
          const sy = it.scatterY - it.startY;
          const ex = it.endX - it.startX;
          const ey = it.endY - it.startY;

          const total = BURST_DUR_MS + LINGER_MS + FLIGHT_DUR_MS;
          const t1 = BURST_DUR_MS / total;
          const t2 = (BURST_DUR_MS + LINGER_MS) / total;
          // 飞行段内部的"保持满透明度"断点：从 t2 再往前推进一部分
          const t3 = t2 + (1 - t2) * FLY_HOLD_RATIO;
          // 飞行途中保持位置的中间关键点（与 t3 对齐，用于 x/y 曲线补一个锚点）
          const midX = sx + (ex - sx) * FLY_HOLD_RATIO;
          const midY = sy + (ey - sy) * FLY_HOLD_RATIO;

          const IconComp = KIND_ICON[it.kind];

          return (
            <motion.div
              key={it.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
              animate={{
                x: [0, sx, sx, midX, ex],
                y: [0, sy, sy, midY, ey],
                opacity: [0, 1, 1, 1, 0],
                scale: [0.4, 1.5, 1.2, 1.05, 0.85],
              }}
              transition={{
                duration: total / 1000,
                ease: 'easeInOut',
                times: [0, t1, t2, t3, 1],
              }}
              style={{
                position: 'absolute',
                left: it.startX - 22,
                top: it.startY - 22,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                imageRendering: 'pixelated',
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <IconComp size={3} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
