/**
 * XpShardLayer.tsx — 经验碎片全屏飞行层
 *
 * 设计要点（2026-05-08 刘叔指令）：
 *  - 敌人击杀 → postPlayEffects 派发 XpKillEvent（带 enemyUid + xp）
 *  - 本组件是一个全屏 fixed 容器，监听事件，立即通过 DOM 查询拿到两个坐标：
 *      起点 = [data-enemy-uid] 中心
 *      终点 = [data-xp-badge] 中心
 *  - 碎片爆发时序：事件 → 延迟 ~250ms（避开敌人死亡动画前段 flash） → 爆发 → 0.65s 飞入徽章
 *  - 碎片数量：2-5 颗（按 xp 量级）
 *
 * 像素风：紫色方块 + 发光 box-shadow，与徽章配色一致。
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onXpKill, type XpKillEvent } from '../logic/xpEvents';

interface FlyingShard {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  // 爆发方向随机偏移（让碎片有爆炸散开感）
  burstX: number;
  burstY: number;
  delay: number;
}

const DEATH_FLASH_DELAY_MS = 220;  // 对齐敌人死亡动画的 1→1.1→1.4 前段
const SHARD_FLIGHT_MS = 650;

function countShardsForXp(xp: number): number {
  if (xp >= 80) return 5;       // boss
  if (xp >= 30) return 4;       // elite
  return 3;                      // 小怪
}

function readCenter(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export const XpShardLayer: React.FC = () => {
  const [shards, setShards] = useState<FlyingShard[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    const off = onXpKill((ev: XpKillEvent) => {
      // 延迟一帧读 DOM（事件派发和 React 渲染可能交错）
      requestAnimationFrame(() => {
        const enemyEl = document.querySelector('[data-enemy-uid="' + ev.enemyUid + '"]');
        const badgeEl = document.querySelector('[data-xp-badge]');
        const start = readCenter(enemyEl);
        const end = readCenter(badgeEl);
        if (!start || !end) return; // 任何一个没找到就静默失败（敌人 DOM 已移除时会发生）

        const n = countShardsForXp(ev.xp);
        const batch: FlyingShard[] = [];
        for (let i = 0; i < n; i++) {
          seqRef.current += 1;
          // 爆发点：围绕 start 随机偏移 6-18px
          const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
          const r = 10 + Math.random() * 12;
          batch.push({
            id: 'shard-' + ev.at + '-' + seqRef.current,
            startX: start.x,
            startY: start.y,
            endX: end.x,
            endY: end.y,
            burstX: start.x + Math.cos(ang) * r,
            burstY: start.y + Math.sin(ang) * r - 6,
            delay: DEATH_FLASH_DELAY_MS + i * 40,
          });
        }
        setShards(prev => [...prev, ...batch]);

        // 清理：每个碎片在 delay + 飞行时间 + 100ms 缓冲后从数组移除
        const cleanupAt = DEATH_FLASH_DELAY_MS + n * 40 + SHARD_FLIGHT_MS + 150;
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
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {shards.map(s => {
          // 相对距离用于 framer-motion x/y
          const bx = s.burstX - s.startX;
          const by = s.burstY - s.startY;
          const ex = s.endX - s.startX;
          const ey = s.endY - s.startY;
          return (
            <motion.div
              key={s.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
              animate={{
                x: [0, bx, ex],
                y: [0, by, ey],
                opacity: [0, 1, 1, 0.9],
                scale: [0.3, 1.2, 0.85, 0.5],
                rotate: [0, 140, 300],
              }}
              transition={{
                duration: SHARD_FLIGHT_MS / 1000,
                delay: s.delay / 1000,
                ease: [0.25, 0.6, 0.3, 1.0],
                times: [0, 0.25, 1],
              }}
              style={{
                position: 'absolute',
                left: s.startX - 4,
                top: s.startY - 4,
                width: 8,
                height: 8,
                background: 'linear-gradient(135deg, #a0ff80 0%, #40c040 50%, #208020 100%)', // [COLOR 2026-05-08] 经验碎片改为绿色
                boxShadow: '0 0 6px rgba(100,220,60,0.95), 0 0 12px rgba(60,180,40,0.65)',
                imageRendering: 'pixelated',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};