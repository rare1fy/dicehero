import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { MapNode } from '../types/game';
import { PixelSword, PixelSkull, PixelCrown, PixelShopBag, PixelQuestion, PixelCampfire, PixelHeart, PixelRefresh, PixelTreasure, PixelMerchant } from './PixelIcons';
import { PixelSprite } from './PixelSprite';
import { CHAPTER_CONFIG } from '../config';

// 每章Boss名（[中Boss, 终Boss]）
const CHAPTER_BOSSES: [string, string][] = [
  ['枯骨巫妖', '远古树王'],
  ['霜寒女王', '霜之巫妖王'],
  ['炎魔之王', '熔火死翼'],
  ['深渊领主', '暗影之王'],
  ['泰坦看守者', '永恒主宰'],
];

const MAP_BG_CLASSES = ['map-bg-forest', 'map-bg-ice', 'map-bg-lava', 'map-bg-shadow', 'map-bg-eternal'];
const MAP_HEADER_GRADIENTS = [
  'linear-gradient(to bottom, #080c06 40%, transparent)',
  'linear-gradient(to bottom, #080c12 40%, transparent)',
  'linear-gradient(to bottom, #0e0806 40%, transparent)',
  'linear-gradient(to bottom, #08060e 40%, transparent)',
  'linear-gradient(to bottom, #0c0a08 40%, transparent)',
];

export const MapScreen: React.FC = () => {
  const { game, startNode } = useGameContext();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const currentNode = game.map.find(n => n.id === game.currentNodeId);
  const reachableNodes = !game.currentNodeId 
    ? game.map.filter(n => n.depth === 0)
    : currentNode?.connectedTo.map(id => game.map.find(n => n.id === id)!) || [];

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    const scroll = () => {
      if (scrollRef.current) {
        if (currentNode) {
          const nodeElement = document.getElementById(currentNode.id);
          if (nodeElement) {
            nodeElement.scrollIntoView({ 
              behavior: isInitialMount.current ? 'auto' : 'smooth', 
              block: 'center',
              inline: 'center'
            });
          }
        } else {
          // 开局居中到第一层节点
          const firstNodes = document.querySelectorAll('[id^="node-0-"]');
          if (firstNodes.length > 0) {
            const midNode = firstNodes[Math.floor(firstNodes.length / 2)];
            midNode?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
          } else {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }
        isInitialMount.current = false;
      }
    };
    requestAnimationFrame(() => { requestAnimationFrame(scroll); });
  }, [currentNode, game.currentNodeId]);

  const maxDepth = Math.max(...game.map.map(n => n.depth));
  const layerHeight = 170;
  const svgHeight = (maxDepth + 1) * layerHeight + 140;
  const svgWidth = 720;

  // 基于当前地图数据生成唯一盐值，使每局视觉布局不同
  const mapSalt = useMemo(() => {
    let h = 0;
    for (const n of game.map) {
      const s = n.id + n.type + n.connectedTo.join(',');
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return String(h);
  }, [game.map]);

  // 稳定的伪随机函数（基于种子字符串 + 地图盐值）
  const seededRand = (seed: string, index: number = 0) => {
    let hash = 0;
    const s = mapSalt + ':' + seed + ':' + index;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return ((hash & 0x7fffffff) % 10000) / 10000; // 0~1
  };

  // 为每个节点生成最终位置（保证同层节点间最小距离）
  const MIN_SAME_LAYER_DIST = 85; // 同层节点最小X间距
  const MIN_CROSS_LAYER_DIST = 70; // 跨层节点最小欧氏距离

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    // 按层处理
    const depths = [...new Set<number>(game.map.map(n => n.depth))].sort((a, b) => a - b);
    
    for (const depth of depths) {
      const layerNodes = game.map.filter(n => n.depth === depth);
      const count = layerNodes.length;
      const baseY = (maxDepth - depth) * layerHeight + 85;
      
      // 为每个节点生成初始位置
      const layerPositions: { id: string; x: number; y: number }[] = layerNodes.map((node, idx) => {
        const baseX = (idx + 0.5 + (seededRand(node.id, 2) - 0.5) * 0.35) / count * 100;
        const dx = (seededRand(node.id, 0) - 0.5) * 90;
        const dy = (seededRand(node.id, 1) - 0.5) * 44;
        const x = Math.max(50, Math.min(svgWidth - 50, baseX / 100 * (svgWidth - 140) + 70 + dx));
        const y = baseY + dy;
        return { id: node.id, x, y };
      });
      
      // 按X排序后强制最小间距（推开重叠节点）
      layerPositions.sort((a, b) => a.x - b.x);
      for (let i = 1; i < layerPositions.length; i++) {
        const gap = layerPositions[i].x - layerPositions[i - 1].x;
        if (gap < MIN_SAME_LAYER_DIST) {
          const push = (MIN_SAME_LAYER_DIST - gap) / 2 + 1;
          layerPositions[i - 1].x -= push;
          layerPositions[i].x += push;
          // 再次限制边界
          layerPositions[i - 1].x = Math.max(40, layerPositions[i - 1].x);
          layerPositions[i].x = Math.min(svgWidth - 40, layerPositions[i].x);
        }
      }
      
      // 跨层检查：与已确定的上一层节点保证最小距离
      for (const lp of layerPositions) {
        for (const existingId in positions) {
          const ep = positions[existingId];
          const dist = Math.sqrt((lp.x - ep.x) ** 2 + (lp.y - ep.y) ** 2);
          if (dist < MIN_CROSS_LAYER_DIST) {
            // 水平推开
            const angle = Math.atan2(lp.y - ep.y, lp.x - ep.x);
            const pushX = Math.cos(angle) * (MIN_CROSS_LAYER_DIST - dist + 5);
            lp.x = Math.max(40, Math.min(svgWidth - 40, lp.x + pushX));
          }
        }
        positions[lp.id] = { x: lp.x, y: lp.y };
      }
    }
    return positions;
  }, [game.map, maxDepth]);

  const getNodePos = (node: MapNode) => {
    return nodePositions[node.id] || { x: svgWidth / 2, y: 85 };
  };

  const nodeTypeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bgClass: string }> = {
    enemy: { icon: <PixelSword size={2} />, label: '战斗', color: 'var(--pixel-gold)', bgClass: 'map-node-enemy' },
    elite: { icon: <PixelSkull size={2} />, label: '精英', color: 'var(--pixel-red)', bgClass: 'map-node-elite' },
    boss: { icon: <PixelCrown size={2} />, label: 'Boss', color: 'var(--pixel-purple)', bgClass: 'map-node-boss' },
    shop: { icon: <PixelShopBag size={2} />, label: '商店', color: 'var(--pixel-green)', bgClass: 'map-node-shop' },
    event: { icon: <PixelQuestion size={2} />, label: '事件', color: 'var(--pixel-blue)', bgClass: 'map-node-event' },
    campfire: { icon: <PixelCampfire size={2} />, label: '篝火', color: 'var(--pixel-orange)', bgClass: 'map-node-campfire' },
    treasure: { icon: <PixelTreasure size={2} />, label: '宝箱', color: 'var(--pixel-gold)', bgClass: 'map-node-treasure' },
    merchant: { icon: <PixelMerchant size={2} />, label: '商人', color: 'var(--pixel-green)', bgClass: 'map-node-merchant' },
  };

  const chapterIdx = Math.min((game.chapter || 1) - 1, MAP_BG_CLASSES.length - 1);
  const mapBgClass = MAP_BG_CLASSES[chapterIdx];
  const headerGradient = MAP_HEADER_GRADIENTS[chapterIdx];
  const chapterName = CHAPTER_CONFIG.chapterNames[chapterIdx];

  const PARTICLE_CLASSES = ['map-particle-forest', 'map-particle-ice', 'map-particle-lava', 'map-particle-shadow', 'map-particle-eternal'];
  const particleClass = PARTICLE_CLASSES[chapterIdx];

  // 边缘雾气颜色
  const FOG_COLORS = [
    'rgba(20,60,10,0.4)',  // 森林绿雾
    'rgba(40,80,160,0.35)', // 冰蓝寒雾
    'rgba(180,50,10,0.35)', // 熔岩红烟
    'rgba(60,20,120,0.35)', // 暗影紫雾
    'rgba(160,130,40,0.3)', // 永恒金雾
  ];
  const fogColor = FOG_COLORS[chapterIdx];

  // 生成全屏粒子 — 单池，大小连续随机分布
  const particles = useMemo(() => {
    const count = 40;
    return Array.from({ length: count }, (_, i) => {
      const r = seededRand('p', i * 31 + 7);
      const size = 2 + r * r * 10;
      const isBig = size > 8;
      // 随机方向：每个粒子有独立的dx/dy — 大幅发散
      const dx = Math.round((seededRand('dx', i * 37 + 13) - 0.5) * 160);
      const dy = Math.round((seededRand('dy', i * 41 + 17) - 0.5) * 240);
      const dx2 = Math.round((seededRand('dx2', i * 43 + 19) - 0.5) * 120);
      const dy2 = Math.round(dy * (0.6 + seededRand('dy2', i * 47 + 23) * 0.8));
      return {
        left: `${seededRand('x', i * 13 + 1) * 94 + 3}%`,
        top: `${seededRand('y', i * 17 + 3) * 94 + 3}%`,
        size,
        duration: isBig ? 8 + seededRand('d', i * 19 + 5) * 10 : 3 + seededRand('d', i * 19 + 5) * 5,
        delay: seededRand('dl', i * 23 + 9) * 10,
        opacity: isBig ? 0.03 + seededRand('o', i * 29 + 11) * 0.08 : 0.2 + seededRand('o', i * 29 + 11) * 0.6,
        dx, dy, dx2, dy2,
      };
    });
  }, []);

  const [fadeIn, setFadeIn] = React.useState(true);
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(false), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex flex-col h-full ${mapBgClass} text-[var(--dungeon-text)] relative overflow-hidden`}>
      {/* 淡入遮罩 */}
      <div
        className="absolute inset-0 z-[99] bg-black pointer-events-none transition-opacity duration-1000 ease-out"
        style={{ opacity: fadeIn ? 1 : 0 }}
      />
      <div className="absolute inset-0 pixel-dither-overlay" />

      {/* 章节主题粒子效果 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        {particles.map((p, i) => (
          <div
            key={`mp-${i}`}
            className={`map-particle ${particleClass}`}
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--dx2': `${p.dx2}px`,
              '--dy2': `${p.dy2}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* 顶部淡雾 */}
      <div className="absolute top-0 left-0 right-0 h-[10%] pointer-events-none z-[2]" style={{
        background: `linear-gradient(to bottom, ${fogColor.replace(/[\d.]+\)$/, '0.25)')} 0%, transparent 100%)`,
      }} />
      {/* 底部淡雾 */}
      <div className="absolute bottom-0 left-0 right-0 h-[12%] pointer-events-none z-[2]" style={{
        background: `linear-gradient(to top, ${fogColor.replace(/[\d.]+\)$/, '0.3)')} 0%, transparent 100%)`,
      }} />

      <div className="absolute top-0 left-0 right-0 z-20 p-4 pb-10 pt-3" style={{background: headerGradient}}>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black tracking-wider text-[var(--dungeon-text-bright)] pixel-text-shadow leading-none">◆ {chapterName} ◆</h2>
            <p className="text-[var(--dungeon-text-dim)] text-[10px] tracking-[0.1em] mt-1.5 font-bold">深度 {currentNode?.depth ?? 0} / {maxDepth}</p>
          </div>
        </div>
      </div>

      {/* Map Content — 可拖动查看 */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-auto scrollbar-hide relative z-10 pt-24 pb-40"
        style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch', overflowX: 'auto', overflowY: 'auto' }}
        onMouseDown={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          const startX = e.pageX - el.offsetLeft;
          const startY = e.pageY - el.offsetTop;
          const scrollLeft = el.scrollLeft;
          const scrollTop = el.scrollTop;
          el.style.cursor = 'grabbing';
          const onMove = (ev: MouseEvent) => {
            ev.preventDefault();
            el.scrollLeft = scrollLeft - (ev.pageX - el.offsetLeft - startX);
            el.scrollTop = scrollTop - (ev.pageY - el.offsetTop - startY);
          };
          const onUp = () => {
            el.style.cursor = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      >
        <div className="relative" style={{ width: svgWidth, minHeight: svgHeight, margin: '0 auto', minWidth: 'fit-content' }}>

          <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: svgHeight }} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              <filter id="pathGlow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {game.map.map(node => (
              node.connectedTo.map(targetId => {
                const target = game.map.find(n => n.id === targetId);
                if (!target) return null;
                const start = getNodePos(node);
                const end = getNodePos(target);
                const isReachablePath = reachableNodes.some(rn => rn?.id === target.id) && 
                  (node.id === game.currentNodeId || node.completed);
                const isCompletedPath = node.completed && target.completed;
                const midY = (start.y + end.y) / 2;
                return (
                  <path 
                    key={`${node.id}-${targetId}`}
                    d={`M ${start.x} ${start.y} C ${start.x} ${midY} ${end.x} ${midY} ${end.x} ${end.y}`}
                    stroke={isReachablePath ? 'var(--pixel-gold)' : isCompletedPath ? 'var(--pixel-gold)' : 'rgba(140,160,180,0.7)'}
                    strokeWidth={isReachablePath ? '3' : '2'}
                    strokeDasharray={isReachablePath ? 'none' : isCompletedPath ? 'none' : '6 4'}
                    fill="none"
                    opacity={isReachablePath ? 1.0 : isCompletedPath ? 0.7 : 0.55}
                    filter={isReachablePath ? 'url(#pathGlow)' : 'none'}
                  />
                );
              })
            ))}
          </svg>

          {game.map.map(node => {
            const pos = getNodePos(node);
            const isReachable = reachableNodes.some(rn => rn?.id === node.id);
            const isCurrent = node.id === game.currentNodeId;
            const isCompleted = node.completed;
            const config = nodeTypeConfig[node.type] || nodeTypeConfig.enemy;

            // Boss节点特殊处理
            if (node.type === 'boss') {
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
                  onClick={() => isReachable && startNode(node)}
                  className={`absolute flex flex-col items-center ${isReachable ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ left: pos.x - halfSize, top: pos.y - halfSize - 6, width: nodeSize }}
                >
                  {/* Boss节点容器 */}
                  <div
                    className={`relative flex items-center justify-center
                      ${isCurrent ? 'map-node-current' : ''}
                      ${isCompleted ? 'map-node-completed' : ''}
                      ${!isReachable && !isCurrent && !isCompleted ? 'opacity-50' : ''}
                    `}
                    style={{
                      width: nodeSize,
                      height: nodeSize,
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
                    {/* 终Boss：直接展示像素精灵 */}
                    {isFinalBoss ? (
                      <div style={{ transform: 'scale(0.85)' }}>
                        <PixelSprite name={bossName} size={3} />
                      </div>
                    ) : (
                      <PixelSkull size={3} />
                    )}

                    {/* 脉冲光环 */}
                    {isReachable && !isCurrent && !isCompleted && (
                      <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-[-3px] pointer-events-none"
                        style={{
                          borderRadius: '6px',
                          border: isFinalBoss ? '2px solid rgba(224,60,60,0.5)' : '2px solid rgba(160,80,224,0.4)',
                          boxShadow: isFinalBoss
                            ? '0 0 20px rgba(224,60,60,0.4)'
                            : '0 0 16px rgba(160,80,224,0.3)',
                        }}
                      />
                    )}
                  </div>

                  {/* Boss名字 */}
                  <span className={`text-[8px] font-black tracking-wider leading-none pixel-text-shadow whitespace-nowrap mt-1
                    ${isCurrent ? 'text-[var(--pixel-gold)]' : isReachable ? '' : 'opacity-60'}
                  `}
                  style={{ color: isReachable && !isCurrent ? (isFinalBoss ? '#e06060' : '#c080ff') : undefined }}
                  >
                    {isFinalBoss ? '★ BOSS' : 'Boss'}
                  </span>
                </motion.button>
              );
            }

            // 普通节点渲染
            return (
              <motion.button
                key={node.id}
                id={node.id}
                whileHover={isReachable ? { scale: 1.2 } : {}}
                whileTap={isReachable ? { scale: 0.9 } : {}}
                onClick={() => isReachable && startNode(node)}
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
          })}
        </div>
      </div>

      {/* Footer Status */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5" style={{background: headerGradient.replace('to bottom', 'to top')}}>
        <div className="max-w-sm mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-[var(--dungeon-text-dim)] tracking-widest font-bold">生命值</span>
              <div className="flex items-center gap-1.5">
                <PixelHeart size={2} />
                <span className="font-mono font-bold text-base text-[var(--dungeon-text-bright)] pixel-text-shadow">{game.hp}</span>
              </div>
            </div>
            <div className="h-6 w-[2px] bg-[var(--dungeon-panel-border)]" />
            <div className="flex flex-col">
              <span className="text-[8px] text-[var(--dungeon-text-dim)] tracking-widest font-bold">重骰</span>
              <div className="flex items-center gap-1.5 text-[var(--pixel-orange)]">
                <PixelRefresh size={2} />
                <span className="font-mono font-bold text-base pixel-text-shadow">{game.globalRerolls}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
