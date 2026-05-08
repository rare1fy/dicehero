/**
 * SoulShardLayer.tsx — 魂晶碎片全屏飞行层
 *
 * 动画时序（2026-05-08 刘叔修订）：
 *  1. 敌人死亡后 ~260ms，碎片从敌人位置爆出
 *  2. 散落阶段（0.5s）：碎片向四周弹开约 28px，停留
 *  3. 飞行阶段（0.72s）：加速飞向顶栏魂晶 badge
 *  4. 散落开始时播放轻音效
 *
 * 像素风：紫色菱形方块 + 紫色 box-shadow。
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSoulGain, type SoulGainEvent } from '../logic/soulEvents';
import { getCtx, createMasterGain, isSfxEnabled } from '../utils/sound';

interface FlyingSoulShard {
  id: string;
  startX: number;
  startY: number;
  scatterX: number;
  scatterY: number;
  endX: number;
  endY: number;
  delay: number;
}

const DEATH_DELAY_MS  = 260;   // 略晚于 XP 碎片，两者错峰
const SCATTER_DUR_MS  = 380;
const LINGER_MS       = 500;
const FLIGHT_DUR_MS   = 680;
const STAGGER_MS      = 55;

function countShardsForAmount(amount: number): number {
  if (amount >= 30) return 6;
  if (amount >= 15) return 5;
  if (amount >= 6)  return 4;
  return 3;
}

function readCenter(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** 轻促中频 tick —— 魂晶弹出音效（比 XP 稍低、稍浑） */
function playSoulShardSound(): void {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const master = createMasterGain(ctx);
  const now = ctx.currentTime;
  [0, 0.05, 0.10].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const freq = 800 + i * 120;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + offset);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + offset + 0.09);
    g.gain.setValueAtTime(0, now + offset);
    g.gain.linearRampToValueAtTime(0.14, now + offset + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.10);
    osc.connect(g);
    g.connect(master);
    osc.start(now + offset);
    osc.stop(now + offset + 0.12);
  });
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
          const ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
          const r = 20 + Math.random() * 18;
          batch.push({
            id: 'soul-' + ev.at + '-' + seqRef.current,
            startX: start.x,
            startY: start.y,
            scatterX: start.x + Math.cos(ang) * r,
            scatterY: start.y + Math.sin(ang) * r + 8,  // 下坠感
            endX: end.x,
            endY: end.y,
            delay: i * STAGGER_MS,
          });
        }
        setShards(prev => [...prev, ...batch]);

        window.setTimeout(() => { playSoulShardSound(); }, DEATH_DELAY_MS + 30);

        const totalDur = DEATH_DELAY_MS + n * STAGGER_MS + SCATTER_DUR_MS + LINGER_MS + FLIGHT_DUR_MS + 200;
        window.setTimeout(() => {
          setShards(prev => prev.filter(s => !batch.find(b => b.id === s.id)));
        }, totalDur);
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
          const sx = s.scatterX - s.startX;
          const sy = s.scatterY - s.startY;
          const ex = s.endX - s.startX;
          const ey = s.endY - s.startY;

          const totalSec = (SCATTER_DUR_MS + LINGER_MS + FLIGHT_DUR_MS) / 1000;
          const t1 = SCATTER_DUR_MS / (SCATTER_DUR_MS + LINGER_MS + FLIGHT_DUR_MS);
          const t2 = (SCATTER_DUR_MS + LINGER_MS) / (SCATTER_DUR_MS + LINGER_MS + FLIGHT_DUR_MS);

          return (
            <motion.div
              key={s.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 45 }}
              animate={{
                x:       [0, sx, sx, ex],
                y:       [0, sy, sy, ey],
                opacity: [0, 1,  1,  0],
                scale:   [0.2, 1.4, 1.0, 0.5],
                rotate:  [45, 200, 260, 405],
              }}
              transition={{
                duration: totalSec,
                delay: (DEATH_DELAY_MS + s.delay) / 1000,
                ease: 'easeInOut',
                times: [0, t1, t2, 1],
              }}
              style={{
                position: 'absolute',
                left: s.startX - 5,
                top:  s.startY - 5,
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
