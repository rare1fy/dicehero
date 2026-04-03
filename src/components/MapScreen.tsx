import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { MapNode } from '../types/game';
import { getNodeX } from '../utils/mapGenerator';
import { playSound } from '../utils/sound';
import { PixelSword, PixelSkull, PixelCrown, PixelShopBag, PixelQuestion, PixelCampfire, PixelHeart, PixelRefresh, PixelInfo, PixelTreasure, PixelMerchant } from './PixelIcons';
import { PixelSprite, hasSpriteData } from './PixelSprite';

export const MapScreen: React.FC = () => {
  const { game, startNode, addLog } = useGameContext();
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
              block: 'center' 
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
  }, [currentNode]);

  const maxDepth = Math.max(...game.map.map(n => n.depth));
  const layerHeight = 140;
  const svgHeight = (maxDepth + 1) * layerHeight + 100;
  const svgWidth = 520;

  const getNodePos = (node: MapNode) => {
    const x = getNodeX(node, game.map) / 100 * (svgWidth - 100) + 50;
    const y = (maxDepth - node.depth) * layerHeight + 65;
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

  return (
    <div className="flex flex-col h-full map-bg-dungeon text-[var(--dungeon-text)] relative overflow-hidden">
      <div className="absolute inset-0 pixel-dither-overlay" />
      
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pb-10 pt-3" style={{background:'linear-gradient(to bottom, #0c1018 40%, transparent)'}}>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black tracking-wider text-[var(--dungeon-text-bright)] pixel-text-shadow leading-none">◆ THE VOID ◆</h2>
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
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5" style={{background:'linear-gradient(to top, #0c1018 50%, transparent)'}}>
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
          <button 
            onClick={() => addLog("查看当前状态...")}
            className="w-10 h-10 bg-[var(--dungeon-panel)] border-3 border-[var(--dungeon-panel-border)] flex items-center justify-center text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text-bright)] transition-colors"
            style={{borderRadius:'2px'}}
          >
            <PixelInfo size={2} />
          </button>
        </div>
      </div>
    </div>
  );
};
