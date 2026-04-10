import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { MapNode } from '../types/game';
import { getNodeX } from '../utils/mapGenerator';
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
  const svgHeight = (maxDepth + 1) * layerHeight + 120;
  const svgWidth = 680;

  // 为每个节点生成稳定的随机偏移（基于node.id的hash）
  const nodeOffsets = useMemo(() => {
    const offsets: Record<string, { dx: number; dy: number }> = {};
    game.map.forEach(node => {
      let hash = 0;
      for (let i = 0; i < node.id.length; i++) hash = ((hash << 5) - hash + node.id.charCodeAt(i)) | 0;
      const dx = ((hash & 0xff) / 255 - 0.5) * 40;
      const dy = (((hash >> 8) & 0xff) / 255 - 0.5) * 24;
      offsets[node.id] = { dx, dy };
    });
    return offsets;
  }, [game.map]);

  const getNodePos = (node: MapNode) => {
    const x = getNodeX(node, game.map) / 100 * (svgWidth - 120) + 60 + (nodeOffsets[node.id]?.dx || 0);
    const y = (maxDepth - node.depth) * layerHeight + 75 + (nodeOffsets[node.id]?.dy || 0);
    return { x, y };
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

  return (
    <div className={`flex flex-col h-full ${mapBgClass} text-[var(--dungeon-text)] relative overflow-hidden`}>
      <div className="absolute inset-0 pixel-dither-overlay" />
      
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
          {/* 章节主题像素装饰 */}
          {chapterIdx === 0 && /* 森林：枯树+蘑菇 */ <>
            <svg className="absolute pointer-events-none" style={{ left: 20, top: 80, opacity: 0.15, imageRendering: 'pixelated' as any }} width="24" height="40" viewBox="0 0 6 10"><rect x="2" y="0" width="2" height="2" fill="#3a5a2a"/><rect x="1" y="2" width="4" height="2" fill="#4a7a2a"/><rect x="2" y="4" width="2" height="6" fill="#3a2a1a"/></svg>
            <svg className="absolute pointer-events-none" style={{ right: 30, top: 200, opacity: 0.12, imageRendering: 'pixelated' as any }} width="20" height="36" viewBox="0 0 5 9"><rect x="1" y="0" width="3" height="2" fill="#2a5a1a"/><rect x="0" y="2" width="5" height="2" fill="#3a7a2a"/><rect x="2" y="4" width="1" height="5" fill="#4a3a1a"/></svg>
            <svg className="absolute pointer-events-none" style={{ left: 60, bottom: 180, opacity: 0.1, imageRendering: 'pixelated' as any }} width="16" height="16" viewBox="0 0 4 4"><rect x="1" y="0" width="2" height="1" fill="#c04040"/><rect x="0" y="1" width="4" height="2" fill="#c04040"/><rect x="1" y="3" width="2" height="1" fill="#8a8060"/></svg>
          </>}
          {chapterIdx === 1 && /* 冰封：雪花+冰晶 */ <>
            <svg className="absolute pointer-events-none" style={{ left: 30, top: 100, opacity: 0.12, imageRendering: 'pixelated' as any }} width="24" height="24" viewBox="0 0 6 6"><rect x="2" y="0" width="2" height="6" fill="#80c0e0"/><rect x="0" y="2" width="6" height="2" fill="#80c0e0"/><rect x="0" y="0" width="2" height="2" fill="#60a0c0"/><rect x="4" y="4" width="2" height="2" fill="#60a0c0"/></svg>
            <svg className="absolute pointer-events-none" style={{ right: 40, top: 250, opacity: 0.1, imageRendering: 'pixelated' as any }} width="20" height="20" viewBox="0 0 5 5"><rect x="2" y="0" width="1" height="5" fill="#a0d0e8"/><rect x="0" y="2" width="5" height="1" fill="#a0d0e8"/><rect x="1" y="1" width="1" height="1" fill="#80b0d0"/><rect x="3" y="3" width="1" height="1" fill="#80b0d0"/></svg>
            <svg className="absolute pointer-events-none" style={{ left: 50, bottom: 200, opacity: 0.08, imageRendering: 'pixelated' as any }} width="28" height="36" viewBox="0 0 7 9"><rect x="2" y="0" width="3" height="2" fill="#a0d8f0"/><rect x="1" y="2" width="5" height="3" fill="#80c0e0"/><rect x="0" y="5" width="7" height="2" fill="#60a0c0"/><rect x="1" y="7" width="5" height="2" fill="#4080a0"/></svg>
          </>}
          {chapterIdx === 2 && /* 熔岩：火山+岩石 */ <>
            <svg className="absolute pointer-events-none" style={{ right: 25, top: 120, opacity: 0.12, imageRendering: 'pixelated' as any }} width="32" height="40" viewBox="0 0 8 10"><rect x="3" y="0" width="2" height="2" fill="#e08030"/><rect x="2" y="2" width="4" height="2" fill="#c04020"/><rect x="1" y="4" width="6" height="3" fill="#8a2010"/><rect x="0" y="7" width="8" height="3" fill="#3a2010"/></svg>
            <svg className="absolute pointer-events-none" style={{ left: 40, top: 280, opacity: 0.1, imageRendering: 'pixelated' as any }} width="20" height="16" viewBox="0 0 5 4"><rect x="0" y="2" width="5" height="2" fill="#4a3a2a"/><rect x="1" y="1" width="3" height="1" fill="#5a4a3a"/><rect x="2" y="0" width="1" height="1" fill="#6a5a4a"/></svg>
          </>}
          {chapterIdx === 3 && /* 暗影：魔法阵+紫色火焰 */ <>
            <svg className="absolute pointer-events-none" style={{ left: 25, top: 140, opacity: 0.1, imageRendering: 'pixelated' as any }} width="28" height="28" viewBox="0 0 7 7"><rect x="2" y="0" width="3" height="1" fill="#6a3a8a"/><rect x="0" y="2" width="1" height="3" fill="#6a3a8a"/><rect x="6" y="2" width="1" height="3" fill="#6a3a8a"/><rect x="2" y="6" width="3" height="1" fill="#6a3a8a"/><rect x="3" y="3" width="1" height="1" fill="#8a4aaa"/></svg>
            <svg className="absolute pointer-events-none" style={{ right: 35, top: 300, opacity: 0.08, imageRendering: 'pixelated' as any }} width="16" height="28" viewBox="0 0 4 7"><rect x="1" y="0" width="2" height="2" fill="#8a4aaa"/><rect x="0" y="2" width="4" height="2" fill="#6a3a8a"/><rect x="1" y="4" width="2" height="3" fill="#4a2a6a"/></svg>
          </>}
          {chapterIdx === 4 && /* 永恒：光柱+星辰 */ <>
            <svg className="absolute pointer-events-none" style={{ left: 35, top: 100, opacity: 0.1, imageRendering: 'pixelated' as any }} width="12" height="48" viewBox="0 0 3 12"><rect x="1" y="0" width="1" height="12" fill="#e8d068"/><rect x="0" y="2" width="3" height="2" fill="rgba(232,208,104,0.5)"/><rect x="0" y="8" width="3" height="2" fill="rgba(232,208,104,0.3)"/></svg>
            <svg className="absolute pointer-events-none" style={{ right: 30, top: 180, opacity: 0.12, imageRendering: 'pixelated' as any }} width="16" height="16" viewBox="0 0 4 4"><rect x="1" y="0" width="2" height="1" fill="#e8d068"/><rect x="0" y="1" width="1" height="2" fill="#e8d068"/><rect x="3" y="1" width="1" height="2" fill="#e8d068"/><rect x="1" y="3" width="2" height="1" fill="#e8d068"/><rect x="1" y="1" width="2" height="2" fill="#fff0a0"/></svg>
            <svg className="absolute pointer-events-none" style={{ left: 80, bottom: 220, opacity: 0.08, imageRendering: 'pixelated' as any }} width="12" height="48" viewBox="0 0 3 12"><rect x="1" y="0" width="1" height="12" fill="#c8a83c"/><rect x="0" y="4" width="3" height="2" fill="rgba(200,168,60,0.4)"/></svg>
          </>}

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
