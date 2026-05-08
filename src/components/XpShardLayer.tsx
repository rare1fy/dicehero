/**
 * XpShardLayer.tsx — 经验碎片全屏飞行层
 *
 * 动画时序（2026-05-08 刘叔修订）：
 *  1. 敌人死亡后 ~220ms，碎片从敌人位置爆出
 *  2. 散落阶段（0.5s）：碎片向四周弹开约 25px，带重力感下坠，停留在原地
 *  3. 飞行阶段（0.65s）：碎片从散落点加速飞向 LV 徽章
 *  4. 散落开始时播放轻音效
 *
 * 像素风：蓝色方块 + 蓝色 box-shadow，配色由刘叔确定。
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onXpKill, type XpKillEvent } from '../logic/xpEvents';
import { getCtx, createMasterGain, isSfxEnabled } from '../utils/sound';
import { PixelXpSpark } from './PixelIcons';

interface FlyingShard {
  id: string;
  startX: number;
  startY: number;
  scatterX: number;   // 散落停留点
  scatterY: number;
  endX: number;
  endY: number;
  delay: number;      // 相对于爆发基准的错峰延迟
}

const DEATH_DELAY_MS   = 220;   // 等死亡动画前段
const SCATTER_DUR_MS   = 380;   // 散落飞出动画时长
const LINGER_MS        = 500;   // 停留时长
const FLIGHT_DUR_MS    = 600;   // 飞向目标时长
const STAGGER_MS       = 45;    // 每颗碎片错峰

function countShardsForXp(xp: number): number {
  if (xp >= 80) return 5;   // boss
  if (xp >= 30) return 4;   // elite
  return 3;                  // 小怪
}

function readCenter(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** 轻促高频 tick —— 碎片弹出音效 */
function playXpShardSound(): void {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const master = createMasterGain(ctx);
  const now = ctx.currentTime;
  // 3 个轻 tick 快速连发
  [0, 0.04, 0.08].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const freq = 1200 + i * 180;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + offset);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + offset + 0.07);
    g.gain.setValueAtTime(0, now + offset);
    g.gain.linearRampToValueAtTime(0.12, now + offset + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
    osc.connect(g);
    g.connect(master);
    osc.start(now + offset);
    osc.stop(now + offset + 0.1);
  });
}

export const XpShardLayer: React.FC = () => {
  const [shards, setShards] = useState<FlyingShard[]>([]);
  const seqRef = useRef(0);

  useEffect(() => {
    const off = onXpKill((ev: XpKillEvent) => {
      requestAnimationFrame(() => {
        const enemyEl = document.querySelector('[data-enemy-uid="' + ev.enemyUid + '"]');
        const badgeEl = document.querySelector('[data-xp-badge]');
        const start = readCenter(enemyEl);
        const end = readCenter(badgeEl);
        if (!start || !end) return;

        const n = countShardsForXp(ev.xp);
          const batch: FlyingShard[] = [];
          for (let i = 0; i < n; i++) {
            seqRef.current += 1;
            // [SCATTER-FIX 2026-05-08] 水平扇形铺开，半径大幅拉开，避免堆一起
            const baseAng = Math.PI + (Math.PI * (i + 0.5)) / n; // 上半圆扇形
            const ang = baseAng + (Math.random() - 0.5) * 0.5;
            const r = 45 + Math.random() * 30; // 半径 45-75px
            const dx = Math.cos(ang) * r * 1.8; // 水平再拉宽
            const dy = Math.sin(ang) * r * 0.6 + 10;
            batch.push({
              id: 'shard-' + ev.at + '-' + seqRef.current,
              startX: start.x,
              startY: start.y,
              scatterX: start.x + dx,
              scatterY: start.y + dy,
              endX: end.x,
              endY: end.y,
              delay: i * STAGGER_MS,
            });
          }
        setShards(prev => [...prev, ...batch]);

        // 散落开始时播放音效（整批一次，不用每颗都响）
        window.setTimeout(() => { playXpShardSound(); }, DEATH_DELAY_MS + 30);

        // 清理
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
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {shards.map(s => {
          // 坐标转换：framer-motion 的 x/y 是相对于 left/top 的偏移
          const sx = s.scatterX - s.startX;
          const sy = s.scatterY - s.startY;
          const ex = s.endX - s.startX;
          const ey = s.endY - s.startY;

          // 总时长 = scatter + linger + flight
          const totalSec = (SCATTER_DUR_MS + LINGER_MS + FLIGHT_DUR_MS) / 1000;
          const t1 = SCATTER_DUR_MS / (SCATTER_DUR_MS + LINGER_MS + FLIGHT_DUR_MS);
          const t2 = (SCATTER_DUR_MS + LINGER_MS) / (SCATTER_DUR_MS + LINGER_MS + FLIGHT_DUR_MS);

          return (
            <motion.div
              key={s.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
              animate={{
                x:       [0, sx, sx, ex],
                y:       [0, sy, sy, ey],
                opacity: [0, 1,  1,  0],
                scale:   [0.2, 1.4, 1.15, 0.5],
                rotate:  [0, 160, 200, 360],
              }}
              transition={{
                duration: totalSec,
                delay: (DEATH_DELAY_MS + s.delay) / 1000,
                ease: 'easeInOut',
                times: [0, t1, t2, 1],
              }}
              style={{
                position: 'absolute',
                left: s.startX - 8,
                top:  s.startY - 8,
                width: 16,
                height: 16,
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 0 4px rgba(104,160,232,0.95)) drop-shadow(0 0 2px rgba(216,236,255,0.8))',
              }}
            >
              {/* 柔光底 halo —— 比本体大 1.6 倍，呼吸脉冲，强化"发光"观感 */}
              <motion.div
                animate={{ opacity: [0.35, 0.85, 0.35], scale: [1.2, 1.6, 1.2] }}
                transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: -4,
                  background: 'radial-gradient(circle, rgba(168,208,255,0.85) 0%, rgba(104,160,232,0.35) 50%, transparent 80%)',
                  pointerEvents: 'none',
                  borderRadius: '50%',
                }}
              />
              {/* 像素本体 */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <PixelXpSpark size={2} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
