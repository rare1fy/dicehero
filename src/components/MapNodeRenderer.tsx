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
        {isFinalBoss ? (
          <div style={{ transform: 'scale(0.85)' }}><PixelSprite name={bossName} size={3} /></div>
        ) : (
          <PixelSkull size={3} />
        )}

        {isReachable && !isCurrent && !isCompleted && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-[-3px] pointer-events-none"
            style={{
              borderRadius: '6px',
              border: isFinalBoss ? '2px solid rgba(224,60,60,0.5)' : '2px solid rgba(160,80,224,0.4)',
              boxShadow: isFinalBoss ? '0 0 20px rgba(224,60,60,0.4)' : '0 0 16px rgba(160,80,224,0.3)',
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
        {isReachable && !isCurrent && !isCompleted && (
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: '2px', boxShadow: `inset 0 0 14px ${config.color}40` }}
          />
        )}
        <span className="relative z-10">{config.icon}</span>
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
