/**
 * MapNodeRenderer.tsx — 地图节点渲染子组件
 * ARCH-H: 从 MapScreen.tsx 拆分出的独立子组件
 *
 * 负责 Boss 节点和普通节点的 JSX 渲染，通过 props 接收位置/状态数据。
 */

import React from 'react';
import { motion } from 'motion/react';
import type { MapNode } from '../types/game';
import { PixelSword, PixelSkull, PixelCrown, PixelShopBag, PixelQuestion, PixelCampfire, PixelTreasure, PixelMerchant } from './PixelIcons';
import { PixelSprite } from './PixelSprite';

/** 节点类型 → 图标/标签/颜色映射 */
export const NODE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bgClass: string }> = {
  enemy: { icon: <PixelSword size={2} />, label: '战斗', color: 'var(--pixel-gold)', bgClass: 'map-node-enemy' },
  elite: { icon: <PixelSkull size={2} />, label: '精英', color: 'var(--pixel-red)', bgClass: 'map-node-elite' },
  boss: { icon: <PixelCrown size={2} />, label: 'Boss', color: 'var(--pixel-purple)', bgClass: 'map-node-boss' },
  shop: { icon: <PixelShopBag size={2} />, label: '商店', color: 'var(--pixel-green)', bgClass: 'map-node-shop' },
  event: { icon: <PixelQuestion size={2} />, label: '事件', color: 'var(--pixel-blue)', bgClass: 'map-node-event' },
  campfire: { icon: <PixelCampfire size={2} />, label: '篝火', color: 'var(--pixel-orange)', bgClass: 'map-node-campfire' },
  treasure: { icon: <PixelTreasure size={2} />, label: '宝箱', color: 'var(--pixel-gold)', bgClass: 'map-node-treasure' },
  merchant: { icon: <PixelMerchant size={2} />, label: '商人', color: 'var(--pixel-green)', bgClass: 'map-node-merchant' },
};

/** 每章Boss名（[中Boss, 终Boss]） */
export const CHAPTER_BOSSES: [string, string][] = [
  ['枯骨巫妖', '远古树王'],
  ['霜寒女王', '霜之巫妖王'],
  ['炎魔之王', '熔火死翼'],
  ['深渊领主', '暗影之王'],
  ['泰坦看守者', '永恒主宰'],
];

interface NodeRendererProps {
  node: MapNode;
  pos: { x: number; y: number };
  isReachable: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  maxDepth: number;
  chapterIdx: number;
  onStartNode: (node: MapNode) => void;
}

export const MapNodeRenderer: React.FC<NodeRendererProps> = ({
  node, pos, isReachable, isCurrent, isCompleted, maxDepth, chapterIdx, onStartNode,
}) => {
  if (node.type === 'boss') {
    return (
      <BossNode
        node={node} pos={pos} isReachable={isReachable} isCurrent={isCurrent}
        isCompleted={isCompleted} maxDepth={maxDepth} chapterIdx={chapterIdx} onStartNode={onStartNode}
      />
    );
  }
  return (
    <NormalNode
      node={node} pos={pos} isReachable={isReachable} isCurrent={isCurrent}
      isCompleted={isCompleted} onStartNode={onStartNode}
    />
  );
};

/* ── Boss 节点 ── */
const BossNode: React.FC<NodeRendererProps> = ({
  node, pos, isReachable, isCurrent, isCompleted, maxDepth, chapterIdx, onStartNode,
}) => {
  const isFinalBoss = node.depth === maxDepth;
  const bossPair = CHAPTER_BOSSES[chapterIdx] || CHAPTER_BOSSES[0];
  const bossName = isFinalBoss ? bossPair[1] : bossPair[0];
  const nodeSize = isFinalBoss ? 64 : 50;
  const halfSize = nodeSize / 2;

  return (
    <motion.button
      key={node.id}
      id={node.id}
      whileHover={isReachable ? { scale: 1.15 } : {}}
      whileTap={isReachable ? { scale: 0.9 } : {}}
      onClick={() => isReachable && onStartNode(node)}
      className={`absolute flex flex-col items-center ${isReachable ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ left: pos.x - halfSize, top: pos.y - halfSize - 6, width: nodeSize }}
    >
      <div
        className={`relative flex items-center justify-center
          ${isCurrent ? 'map-node-current' : ''}
          ${isCompleted ? 'map-node-completed' : ''}
          ${!isReachable && !isCurrent && !isCompleted ? 'opacity-50' : ''}
        `}
        style={{
          width: nodeSize, height: nodeSize,
          background: isFinalBoss
            ? 'linear-gradient(180deg, rgba(180,40,40,0.4) 0%, rgba(100,10,10,0.7) 100%)'
            : 'linear-gradient(180deg, rgba(139,60,200,0.35) 0%, rgba(80,20,140,0.6) 100%)',
          border: isFinalBoss ? '3px solid #e04040' : '3px solid #a050e0',
          borderRadius: '4px',
          boxShadow: isReachable
            ? isFinalBoss
              ? '0 0 16px rgba(224,60,60,0.6), 0 0 32px rgba(224,60,60,0.2), inset 0 0 8px rgba(224,60,60,0.2)'
              : '0 0 12px rgba(160,80,224,0.5), 0 0 24px rgba(160,80,224,0.15)'
            : isFinalBoss
              ? '0 0 8px rgba(224,60,60,0.3)'
              : '0 0 6px rgba(160,80,224,0.2)',
        }}
      >
        {/* [ICON-LOOP 2026-05-08 / RAGE-2026-05-09] Boss 图标循环动画：
         *   - 普通：上下浮动 + 轻微缩放脉动
         *   - 终BOSS reachable 时切换到\"狂暴\"模式：高频抖动 + 大幅缩放 + 红光闪烁 */}
        <motion.div
          animate={
            isFinalBoss && isReachable
              ? {
                  x: [0, -2, 2, -2, 2, -1, 1, 0, -2, 2, 0],
                  y: [0, -2, -1, -3, -1, -2, 0, -2, 1, -2, 0],
                  scale: [1, 1.12, 0.96, 1.14, 0.97, 1.10, 1.0, 1.14, 0.94, 1.10, 1],
                  rotate: [0, -2, 2, -1, 1, -2, 1, 0, -2, 1, 0],
                }
              : { y: [0, -3, 0, 2, 0], scale: [1, 1.05, 1, 0.98, 1] }
          }
          transition={{
            repeat: Infinity,
            duration: isFinalBoss && isReachable ? 1.1 : 2.4,
            ease: 'easeInOut',
          }}
          className="relative z-10"
          style={{
            filter: isFinalBoss && isReachable
              ? 'drop-shadow(0 0 10px rgba(255,40,40,0.95)) drop-shadow(0 0 20px rgba(255,80,80,0.55))'
              : isFinalBoss
                ? 'drop-shadow(0 0 6px rgba(255,80,80,0.7))'
                : 'drop-shadow(0 0 6px rgba(200,120,255,0.6))',
          }}
        >
          {isFinalBoss ? (
            <div style={{ transform: 'scale(0.85)' }}><PixelSprite name={bossName} size={3} /></div>
          ) : (
            <PixelSkull size={3} />
          )}
        </motion.div>

        {/* [RAGE-AURA 2026-05-09] 终 BOSS reachable 时的狂暴红光：径向波纹脉冲，模拟杀气外溢 */}
        {isFinalBoss && isReachable && (
          <motion.div
            className="absolute inset-[-12px] pointer-events-none"
            initial={{ opacity: 0.5, scale: 0.85 }}
            animate={{ opacity: [0.7, 0.2, 0.7], scale: [0.9, 1.45, 0.9] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
            style={{
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,40,40,0.5) 0%, rgba(255,40,40,0.2) 40%, transparent 75%)',
            }}
          />
        )}

        {/* [BOSS-NODE-EMPHASIS 2026-05-08] 常驻脉动边框：终BOSS reachable 时切红色高频闪烁 */}
        <motion.div
          animate={
            isFinalBoss && isReachable
              ? { opacity: [0.4, 1, 0.4], scale: [1.02, 1.18, 1.02] }
              : { opacity: [0.25, 0.7, 0.25], scale: [1.0, 1.05, 1.0] }
          }
          transition={{
            repeat: Infinity,
            duration: isFinalBoss && isReachable ? 0.7 : 1.8,
            ease: 'easeInOut',
          }}
          className="absolute inset-[-4px] pointer-events-none"
          style={{
            borderRadius: '6px',
            border: isFinalBoss && isReachable
              ? '2px solid rgba(255,60,60,0.95)'
              : isFinalBoss
                ? '2px solid rgba(224,60,60,0.55)'
                : '2px solid rgba(160,80,224,0.5)',
            boxShadow: isFinalBoss && isReachable
              ? '0 0 22px rgba(255,40,40,0.85), 0 0 44px rgba(255,40,40,0.4), inset 0 0 12px rgba(255,40,40,0.4)'
              : isFinalBoss
                ? '0 0 18px rgba(224,60,60,0.55), 0 0 32px rgba(224,60,60,0.2)'
                : '0 0 14px rgba(160,80,224,0.5), 0 0 26px rgba(160,80,224,0.18)',
          }}
        />

        {isReachable && !isCurrent && !isCompleted && !isFinalBoss && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-[-3px] pointer-events-none"
            style={{
              borderRadius: '6px',
              border: '2px solid rgba(160,80,224,0.4)',
              boxShadow: '0 0 16px rgba(160,80,224,0.3)',
            }}
          />
        )}
      </div>

      <span className={`text-[8px] font-black tracking-wider leading-none pixel-text-shadow whitespace-nowrap mt-1
        ${isCurrent ? 'text-[var(--pixel-gold)]' : isReachable ? '' : 'opacity-60'}
      `}
      style={{ color: isReachable && !isCurrent ? (isFinalBoss ? '#e06060' : '#c080ff') : undefined }}
      >
        {isFinalBoss ? '★ BOSS' : 'Boss'}
      </span>
    </motion.button>
  );
};

/* ── 普通节点 ── */
const NormalNode: React.FC<Omit<NodeRendererProps, 'maxDepth' | 'chapterIdx'>> = ({
  node, pos, isReachable, isCurrent, isCompleted, onStartNode,
}) => {
  const config = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.enemy;

  return (
    <motion.button
      key={node.id}
      id={node.id}
      whileHover={isReachable ? { scale: 1.2 } : {}}
      whileTap={isReachable ? { scale: 0.9 } : {}}
      onClick={() => isReachable && onStartNode(node)}
      className={`absolute flex flex-col items-center gap-0.5 ${isReachable ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ left: pos.x - 22, top: pos.y - 22, width: 44 }}
    >
      <div className={`
        map-node ${config.bgClass}
        ${isCurrent ? 'map-node-current' : ''}
        ${isCompleted ? 'map-node-completed' : ''}
        ${!isReachable && !isCurrent && !isCompleted ? 'map-node-locked' : ''}
        ${isReachable && !isCurrent ? 'map-node-reachable map-node-pulse' : ''}
      `}
      style={{ color: config.color, borderColor: isCurrent ? undefined : isReachable ? config.color : undefined }}
      >
        {/* [ELITE-NODE-EMPHASIS 2026-05-08] 精英节点常驻红色脉动边框，让玩家在地图上一眼辨识 */}
        {node.type === 'elite' && (
          <motion.div
            animate={{ opacity: [0.3, 0.75, 0.3], scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="absolute inset-[-3px] pointer-events-none"
            style={{
              borderRadius: '4px',
              border: '2px solid rgba(200,64,60,0.55)',
              boxShadow: '0 0 12px rgba(200,64,60,0.55), 0 0 22px rgba(200,64,60,0.2)',
            }}
          />
        )}

        {isReachable && !isCurrent && !isCompleted && (
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: '2px', boxShadow: `inset 0 0 14px ${config.color}40` }}
          />
        )}
        {/* [ICON-LOOP 2026-05-08] 精英节点图标摇晃动画；其他节点不变 */}
        {node.type === 'elite' ? (
          <motion.span
            className="relative z-10"
            animate={{ rotate: [-5, 5, -5, 3, -3, 0], scale: [1, 1.1, 1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{ display: 'inline-block', filter: 'drop-shadow(0 0 4px rgba(220,60,60,0.75))' }}
          >
            {config.icon}
          </motion.span>
        ) : (
          <span className="relative z-10">{config.icon}</span>
        )}
      </div>
      <span className={`text-[8px] font-bold tracking-wider leading-none pixel-text-shadow whitespace-nowrap
        ${isCurrent ? 'text-[var(--pixel-gold)]' : isReachable ? 'opacity-90' : 'text-[var(--dungeon-text-dim)] opacity-75'}
      `}
      style={{ color: isReachable && !isCurrent ? config.color : undefined }}
      >
        {config.label}
      </span>
    </motion.button>
  );
};
