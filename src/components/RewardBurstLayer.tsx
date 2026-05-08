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
const FLIGHT_DUR_MS = 560;

const KIND_ICON: Record<RewardKind, React.FC<{ size?: number }>> = {
  dice: PixelDice,
  card: PixelCards,
  reroll: PixelRefresh,
  heart: PixelHeart,
  armor: PixelShield,
  shield: PixelArcaneShield,
  gold: PixelCoin,
  fury: PixelBloodDrop,
};

const KIND_GLOW: Record<RewardKind, string> = {
  dice:   'rgba(104,160,232,0.9)',
  card:   'rgba(104,232,160,0.9)',
  reroll: 'rgba(88,220,232,0.9)',
  heart:  'rgba(232,104,104,0.9)',
  armor:  'rgba(104,160,232,0.9)',
  shield: 'rgba(125,211,252,0.95)',
  gold:   'rgba(232,184,48,0.95)',
  fury:   'rgba(220,60,60,0.9)',
};

function readCenter(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function resolveTarget(kind: RewardKind): { x: number; y: number } | null {
  const el = document.querySelector(`[data-reward-target="${kind}"]`);
  return readCenter(el);
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
        window.setTimeout(() => { flashRewardTarget(ev.kind); }, BURST_DUR_MS + LINGER_MS + FLIGHT_DUR_MS - 60);

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

          const IconComp = KIND_ICON[it.kind];
          const glow = KIND_GLOW[it.kind];

          return (
            <motion.div
              key={it.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
              animate={{
                x: [0, sx, sx, ex],
                y: [0, sy, sy, ey],
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.3, 1.05, 0.55],
              }}
              transition={{
                duration: total / 1000,
                ease: 'easeInOut',
                times: [0, t1, t2, 1],
              }}
              style={{
                position: 'absolute',
                left: it.startX - 14,
                top: it.startY - 14,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                imageRendering: 'pixelated',
                filter: `drop-shadow(0 0 6px ${glow}) drop-shadow(0 0 2px rgba(255,255,255,0.7))`,
              }}
            >
              <motion.div
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [1.1, 1.55, 1.1] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: -6,
                  background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <IconComp size={2} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
