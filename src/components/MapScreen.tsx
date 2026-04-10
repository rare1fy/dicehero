import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { MapNode } from '../types/game';
import { PixelSword, PixelSkull, PixelCrown, PixelShopBag, PixelQuestion, PixelCampfire, PixelHeart, PixelRefresh, PixelTreasure, PixelMerchant } from './PixelIcons';
import { CHAPTER_CONFIG } from '../config';

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

  // 稳定的伪随机函数（基于种子字符串）
  const seededRand = (seed: string, index: number = 0) => {
    let hash = 0;
    const s = seed + ':' + index;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return ((hash & 0x7fffffff) % 10000) / 10000; // 0~1
  };

  // 为每个节点生成最终位置（保证同层节点间最小距离）
  const MIN_SAME_LAYER_DIST = 85; // 同层节点最小X间距
  const MIN_CROSS_LAYER_DIST = 70; // 跨层节点最小欧氏距离

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    // 按层处理
    const depths = [...new Set(game.map.map(n => n.depth))].sort((a, b) => a - b);
    
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

  // 生成粒子
  const particles = useMemo(() => {
    const count = 20;
    return Array.from({ length: count }, (_, i) => ({
      left: `${seededRand('particle', i * 3) * 100}%`,
      top: `${seededRand('particle', i * 3 + 1) * 100}%`,
      size: 2 + seededRand('particle', i * 3 + 2) * 5,
      duration: 3 + seededRand('particle', i * 5) * 5,
      delay: seededRand('particle', i * 7) * 6,
    }));
  }, []);

  return (
    <div className={`flex flex-col h-full ${mapBgClass} text-[var(--dungeon-text)] relative overflow-hidden`}>
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
            }}
          />
        ))}
      </div>
      
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
          {/* 章节主题像素装饰 — 散布在地图各处 */}
          {useMemo(() => {
            const decos: React.ReactNode[] = [];
            // 每章的装饰模板
            const chapterDecos: Record<number, { viewBox: string; w: number; h: number; rects: string; opacity: number }[]> = {
              0: [ // 森林：枯树、灌木、蘑菇、藤蔓、落叶
                { viewBox: '0 0 6 10', w: 20, h: 34, opacity: 0.13, rects: '<rect x="2" y="0" width="2" height="2" fill="#3a5a2a"/><rect x="1" y="2" width="4" height="2" fill="#4a7a2a"/><rect x="0" y="3" width="2" height="2" fill="#2a5a1a"/><rect x="2" y="4" width="2" height="6" fill="#3a2a1a"/>' },
                { viewBox: '0 0 5 4', w: 16, h: 14, opacity: 0.1, rects: '<rect x="1" y="0" width="3" height="2" fill="#3a6a2a"/><rect x="0" y="2" width="5" height="2" fill="#2a4a1a"/>' },
                { viewBox: '0 0 3 4', w: 10, h: 14, opacity: 0.12, rects: '<rect x="1" y="0" width="1" height="1" fill="#c04040"/><rect x="0" y="1" width="3" height="2" fill="#b83838"/><rect x="1" y="3" width="1" height="1" fill="#8a8060"/>' },
                { viewBox: '0 0 2 6', w: 6, h: 20, opacity: 0.08, rects: '<rect x="0" y="0" width="1" height="6" fill="#3a6a2a"/><rect x="1" y="1" width="1" height="4" fill="#2a5a1a"/>' },
                { viewBox: '0 0 3 2', w: 8, h: 6, opacity: 0.1, rects: '<rect x="0" y="0" width="2" height="1" fill="#6a8a2a"/><rect x="1" y="1" width="2" height="1" fill="#5a7a1a"/>' },
              ],
              1: [ // 冰封：雪花、冰晶、冰柱、雪堆
                { viewBox: '0 0 5 5', w: 14, h: 14, opacity: 0.12, rects: '<rect x="2" y="0" width="1" height="5" fill="#90c8e0"/><rect x="0" y="2" width="5" height="1" fill="#90c8e0"/><rect x="1" y="1" width="1" height="1" fill="#70a8c0"/><rect x="3" y="3" width="1" height="1" fill="#70a8c0"/>' },
                { viewBox: '0 0 3 7', w: 10, h: 24, opacity: 0.1, rects: '<rect x="1" y="0" width="1" height="1" fill="#b0e0f0"/><rect x="0" y="1" width="3" height="2" fill="#90c8e0"/><rect x="0" y="3" width="3" height="4" fill="#70a8c0"/>' },
                { viewBox: '0 0 5 3', w: 16, h: 10, opacity: 0.09, rects: '<rect x="0" y="1" width="5" height="2" fill="#c0e0f0"/><rect x="1" y="0" width="3" height="1" fill="#d0ecf8"/>' },
                { viewBox: '0 0 3 3', w: 8, h: 8, opacity: 0.14, rects: '<rect x="1" y="0" width="1" height="1" fill="#d0ecff"/><rect x="0" y="1" width="1" height="1" fill="#d0ecff"/><rect x="2" y="2" width="1" height="1" fill="#d0ecff"/>' },
              ],
              2: [ // 熔岩：火山岩、岩石、熔岩裂缝、骷髅
                { viewBox: '0 0 5 4', w: 16, h: 14, opacity: 0.12, rects: '<rect x="1" y="0" width="3" height="1" fill="#5a3a2a"/><rect x="0" y="1" width="5" height="3" fill="#3a2a1a"/>' },
                { viewBox: '0 0 4 2', w: 14, h: 8, opacity: 0.1, rects: '<rect x="0" y="0" width="4" height="1" fill="#e06020"/><rect x="0" y="1" width="4" height="1" fill="#c04010"/>' },
                { viewBox: '0 0 6 8', w: 20, h: 28, opacity: 0.11, rects: '<rect x="2" y="0" width="2" height="2" fill="#e08030"/><rect x="1" y="2" width="4" height="2" fill="#c04020"/><rect x="0" y="4" width="6" height="4" fill="#3a2010"/>' },
                { viewBox: '0 0 4 4', w: 12, h: 12, opacity: 0.08, rects: '<rect x="1" y="0" width="2" height="1" fill="#a0a090"/><rect x="0" y="1" width="4" height="1" fill="#808070"/><rect x="0" y="2" width="1" height="1" fill="#606050"/><rect x="3" y="2" width="1" height="1" fill="#606050"/>' },
              ],
              3: [ // 暗影：魔法符文、紫焰、暗能裂缝、邪眼
                { viewBox: '0 0 5 5', w: 14, h: 14, opacity: 0.1, rects: '<rect x="1" y="0" width="3" height="1" fill="#6a3a8a"/><rect x="0" y="1" width="1" height="3" fill="#6a3a8a"/><rect x="4" y="1" width="1" height="3" fill="#6a3a8a"/><rect x="1" y="4" width="3" height="1" fill="#6a3a8a"/><rect x="2" y="2" width="1" height="1" fill="#a060d0"/>' },
                { viewBox: '0 0 3 6', w: 10, h: 20, opacity: 0.09, rects: '<rect x="1" y="0" width="1" height="2" fill="#a060d0"/><rect x="0" y="2" width="3" height="2" fill="#8040b0"/><rect x="1" y="4" width="1" height="2" fill="#6030a0"/>' },
                { viewBox: '0 0 5 2', w: 16, h: 6, opacity: 0.08, rects: '<rect x="0" y="0" width="5" height="1" fill="#4a2a6a"/><rect x="1" y="1" width="3" height="1" fill="#6a3a8a"/>' },
                { viewBox: '0 0 3 3', w: 10, h: 10, opacity: 0.12, rects: '<rect x="0" y="1" width="3" height="1" fill="#40c060"/><rect x="1" y="0" width="1" height="3" fill="#40c060"/>' },
              ],
              4: [ // 永恒：光柱、星辰、云朵、圣光碎片
                { viewBox: '0 0 2 10', w: 6, h: 34, opacity: 0.1, rects: '<rect x="0" y="0" width="2" height="10" fill="#e8d068"/><rect x="0" y="3" width="2" height="2" fill="rgba(255,240,140,0.6)"/>' },
                { viewBox: '0 0 3 3', w: 10, h: 10, opacity: 0.14, rects: '<rect x="1" y="0" width="1" height="1" fill="#ffe080"/><rect x="0" y="1" width="1" height="1" fill="#ffe080"/><rect x="2" y="1" width="1" height="1" fill="#ffe080"/><rect x="1" y="2" width="1" height="1" fill="#ffe080"/><rect x="1" y="1" width="1" height="1" fill="#fff8c0"/>' },
                { viewBox: '0 0 7 3', w: 22, h: 10, opacity: 0.07, rects: '<rect x="1" y="0" width="5" height="1" fill="#c0b080"/><rect x="0" y="1" width="7" height="1" fill="#a09070"/><rect x="2" y="2" width="3" height="1" fill="#c0b080"/>' },
                { viewBox: '0 0 2 2', w: 6, h: 6, opacity: 0.16, rects: '<rect x="0" y="0" width="2" height="2" fill="#ffe080"/>' },
              ],
            };
            const templates = chapterDecos[chapterIdx] || chapterDecos[0];
            // 在地图区域内散布装饰
            const decoCount = 18 + maxDepth * 3;
            for (let i = 0; i < decoCount; i++) {
              const t = templates[i % templates.length];
              const px = seededRand(`deco-${chapterIdx}`, i * 3) * (svgWidth - 40) + 20;
              const py = seededRand(`deco-${chapterIdx}`, i * 3 + 1) * (svgHeight - 60) + 30;
              const scale = 0.7 + seededRand(`deco-${chapterIdx}`, i * 3 + 2) * 0.8;
              decos.push(
                <svg key={`deco-${i}`} className="absolute pointer-events-none" style={{
                  left: px, top: py, opacity: t.opacity * (0.6 + seededRand(`deco-${chapterIdx}`, i * 5) * 0.5),
                  imageRendering: 'pixelated' as any,
                  transform: `scale(${scale})`,
                }} width={t.w} height={t.h} viewBox={t.viewBox} dangerouslySetInnerHTML={{ __html: t.rects }} />
              );
            }
            return <>{decos}</>;
          }, [chapterIdx, svgHeight, maxDepth])}

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
                    opacity={isReachablePath ? 1.0 : isCompletedPath ? 0.6 : 0.45}
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
                  ${isCurrent ? 'text-[var(--pixel-gold)]' : isReachable ? 'opacity-80' : 'text-[var(--dungeon-text-dim)] opacity-65'}
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
