import React, { useEffect, useMemo } from 'react';
import { useGameContext } from '../contexts/GameContext';
import type { MapNode } from '../types/game';
import { PixelHeart, PixelRefresh } from './PixelIcons';
import { CHAPTER_CONFIG } from '../config';
import { MapNodeRenderer, NODE_TYPE_CONFIG, CHAPTER_BOSSES } from './MapNodeRenderer';
import { MapEffects } from './MapEffects';
import { useMapLayout } from './useMapLayout';

export { CHAPTER_BOSSES, NODE_TYPE_CONFIG } from './MapNodeRenderer';

const MAP_BG_CLASSES = ['map-bg-forest', 'map-bg-ice', 'map-bg-lava', 'map-bg-shadow', 'map-bg-eternal'];
const MAP_HEADER_GRADIENTS = [
  'linear-gradient(to bottom, #080c06 40%, transparent)',
  'linear-gradient(to bottom, #080c12 40%, transparent)',
  'linear-gradient(to bottom, #0e0806 40%, transparent)',
  'linear-gradient(to bottom, #08060e 40%, transparent)',
  'linear-gradient(to bottom, #0c0a08 40%, transparent)',
];

const PARTICLE_CLASSES = ['map-particle-forest', 'map-particle-ice', 'map-particle-lava', 'map-particle-shadow', 'map-particle-eternal'];

const FOG_COLORS = [
  'rgba(20,60,10,0.4)',
  'rgba(40,80,160,0.35)',
  'rgba(180,50,10,0.35)',
  'rgba(60,20,120,0.35)',
  'rgba(160,130,40,0.3)',
];

export const MapScreen: React.FC = () => {
  const { game, startNode } = useGameContext();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const currentNode = game.map.find(n => n.id === game.currentNodeId);
  const reachableNodes = !game.currentNodeId
    ? game.map.filter(n => n.depth === 0)
    : currentNode?.connectedTo.map(id => game.map.find(n => n.id === id)!) || [];

  const isInitialMount = React.useRef(true);

  // 使用提取的布局 hook
  const {
    nodePositions, getNodePos, maxDepth,
    svgWidth, svgHeight, chapterIdx,
    mapBgClass, headerGradient, particleClass, fogColor, particlesFixed,
  } = useMapLayout(game.map, game.chapter || 1);

  useEffect(() => {
    const scroll = () => {
      if (scrollRef.current) {
        if (currentNode) {
          const nodeElement = document.getElementById(currentNode.id);
          if (nodeElement) {
            nodeElement.scrollIntoView({
              behavior: isInitialMount.current ? 'auto' : 'smooth',
              block: 'center', inline: 'center',
            });
          }
        } else {
          const firstNodes = document.querySelectorAll('[id^="node-0-"]');
          if (firstNodes.length > 0) {
            const midNode = firstNodes[Math.floor(firstNodes.length / 2)];
            midNode?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
          } else {
            scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
          }
        }
        isInitialMount.current = false;
      }
    };
    requestAnimationFrame(() => { requestAnimationFrame(scroll); });
  }, [currentNode, game.currentNodeId]);

  const [fadeIn, setFadeIn] = React.useState(true);
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(false), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex flex-col h-full ${mapBgClass} text-[var(--dungeon-text)] relative overflow-hidden`}>
      {/* 淡入遮罩 */}
      <div className="absolute inset-0 z-[99] bg-black pointer-events-none transition-opacity duration-1000 ease-out" style={{ opacity: fadeIn ? 1 : 0 }} />
      <div className="absolute inset-0 pixel-dither-overlay" />

      {/* 视觉效果 */}
      <MapEffects particles={particlesFixed} particleClass={particleClass} fogColor={fogColor} />

      {/* 顶部标题 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pb-10 pt-3" style={{ background: headerGradient }}>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black tracking-wider text-[var(--dungeon-text-bright)] pixel-text-shadow leading-none">◆ {CHAPTER_CONFIG.chapterNames[chapterIdx]} ◆</h2>
            <p className="text-[var(--dungeon-text-dim)] text-[10px] tracking-[0.1em] mt-1.5 font-bold">深度 {currentNode?.depth ?? 0} / {maxDepth}</p>
          </div>
        </div>
      </div>

      {/* 地图内容 */}
      <MapContent
        scrollRef={scrollRef}
        svgWidth={svgWidth} svgHeight={svgHeight}
        game={game} reachableNodes={reachableNodes}
        getNodePos={getNodePos} nodePositions={nodePositions}
        maxDepth={maxDepth} chapterIdx={chapterIdx}
        onStartNode={startNode}
      />

      {/* 底部状态 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5" style={{ background: headerGradient.replace('to bottom', 'to top') }}>
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

/* ── 地图滚动区 + SVG连线 + 节点渲染 ── */
interface MapContentProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  svgWidth: number;
  svgHeight: number;
  game: ReturnType<typeof useGameContext>['game'];
  reachableNodes: (MapNode | undefined)[];
  getNodePos: (node: MapNode) => { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number }>;
  maxDepth: number;
  chapterIdx: number;
  onStartNode: (node: MapNode) => void;
}

const MapContent: React.FC<MapContentProps> = ({
  scrollRef, svgWidth, svgHeight, game, reachableNodes, getNodePos, maxDepth, chapterIdx, onStartNode,
}) => (
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

      {/* SVG 路径连线 */}
      <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: svgHeight }} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <filter id="pathGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
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

      {/* 节点渲染 */}
      {game.map.map(node => {
        const pos = getNodePos(node);
        const isReachable = reachableNodes.some(rn => rn?.id === node.id);
        const isCurrent = node.id === game.currentNodeId;
        const isCompleted = node.completed;

        return (
          <MapNodeRenderer
            key={node.id}
            node={node} pos={pos}
            isReachable={isReachable} isCurrent={isCurrent} isCompleted={isCompleted}
            maxDepth={maxDepth} chapterIdx={chapterIdx}
            onStartNode={onStartNode}
          />
        );
      })}
    </div>
  </div>
);
