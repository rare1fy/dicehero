/**
 * SoulShardLayer.tsx — 魂晶碎片全屏飞行层
 *
 * 设计对齐 XpShardLayer（刘叔 2026-05-08）：
 *  - 击杀溢出转化 → postPlayEffects 派发 SoulGainEvent
 *  - 起点 = [data-enemy-uid] 中心，终点 = [data-soul-badge] 中心（顶栏魂晶）
 *  - 碎片爆发 → 飞向顶栏魂晶 badge，让玩家清晰感知"魂晶 +N"
 *  - 彻底解决"玩家头上经验紫色碎片 + 玩家头上魂晶飘字"导致的混淆
 *
 * 像素风：紫色渐变方块（比 XP 稍大 + 菱形），和顶栏魂晶图标配色一致。
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSoulGain, type SoulGainEvent } from '../logic/soulEvents';

interface FlyingSoulShard {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  burstX: number;
  burstY: number;
  delay: number;
}

const DEATH_FLASH_DELAY_MS = 260; // 略晚于 XP 碎片（220ms），两者错峰避免同框混乱
const SHARD_FLIGHT_MS = 720;

function countShardsForAmount(amount: number): number {
  if (amount >= 30) return 6;
  if (amount >= 15) return 5;
  if (amount >= 6) return 4;
  return 3;
}

function readCenter(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export const SoulShardLayer: React.FC = () => {
  const [shards, setShards] = useState<FlyingSoulShard[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    const off = onSoulGain((ev: SoulGainEvent) => {
      requestAnimationFrame(() => {
        const enemyEl = document.querySelector('[data-enemy-uid="' + ev.enemyUid + '"]');
        const badgeEl = document.querySelector('[data-soul-badge]');
        const start = readCenter(enemyEl);
        const end = readCenter(badgeEl);
        if (!start || !end) return;

        const n = countShardsForAmount(ev.amount);
        const batch: FlyingSoulShard[] = [];
        for (let i = 0; i < n; i++) {
          seqRef.current += 1;
          const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
          const r = 12 + Math.random() * 14;
          batch.push({
            id: 'soul-' + ev.at + '-' + seqRef.current,
            startX: start.x,
            startY: start.y,
            endX: end.x,
            endY: end.y,
            burstX: start.x + Math.cos(ang) * r,
            burstY: start.y + Math.sin(ang) * r - 8,
            delay: DEATH_FLASH_DELAY_MS + i * 55,
          });
        }
        setShards(prev => [...prev, ...batch]);

        const cleanupAt = DEATH_FLASH_DELAY_MS + n * 55 + SHARD_FLIGHT_MS + 150;
        window.setTimeout(() => {
          setShards(prev => prev.filter(s => !batch.find(b => b.id === s.id)));
        }, cleanupAt);
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
        zIndex: 201,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {shards.map(s => {
          const bx = s.burstX - s.startX;
          const by = s.burstY - s.startY;
          const ex = s.endX - s.startX;
          const ey = s.endY - s.startY;
          return (
            <motion.div
              key={s.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 45 }}
              animate={{
                x: [0, bx, ex],
                y: [0, by, ey],
                opacity: [0, 1, 1, 0.9],
                scale: [0.3, 1.3, 0.9, 0.6],
                rotate: [45, 180, 360],
              }}
              transition={{
                duration: SHARD_FLIGHT_MS / 1000,
                delay: s.delay / 1000,
                ease: [0.25, 0.6, 0.3, 1.0],
                times: [0, 0.25, 1],
              }}
              style={{
                position: 'absolute',
                left: s.startX - 5,
                top: s.startY - 5,
                width: 10,
                height: 10,
                background: 'linear-gradient(135deg, #e0b0ff 0%, #9050e0 50%, #5020a0 100%)',
                boxShadow: '0 0 8px rgba(200,140,255,0.95), 0 0 14px rgba(160,80,224,0.75)',
                imageRendering: 'pixelated',
                transform: 'rotate(45deg)',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};
