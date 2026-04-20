/**
 * useMapLayout — 地图节点布局算法 + 粒子生成 hook
 * ARCH-H: 从 MapScreen.tsx 提取，纯计算逻辑与渲染分离
 */
import { useMemo } from 'react';
import type { MapNode } from '../types/game';

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
  'rgba(20,60,10,0.4)', 'rgba(40,80,160,0.35)', 'rgba(180,50,10,0.35)',
  'rgba(60,20,120,0.35)', 'rgba(160,130,40,0.3)',
];

export { MAP_BG_CLASSES, PARTICLE_CLASSES, FOG_COLORS };

interface ParticleDef {
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  dx: number;
  dy: number;
  dx2: number;
  dy2: number;
}

interface UseMapLayoutResult {
  /** 节点位置映射 */
  nodePositions: Record<string, { x: number; y: number }>;
  /** 根据节点获取位置（含 fallback） */
  getNodePos: (node: MapNode) => { x: number; y: number };
  /** 最大深度 */
  maxDepth: number;
  /** SVG 尺寸 */
  svgWidth: number;
  svgHeight: number;
  /** 章节索引 (0-based) */
  chapterIdx: number;
  /** 视觉主题 */
  mapBgClass: string;
  headerGradient: string;
  particleClass: string;
  fogColor: string;
  /** 修正后的粒子数据 */
  particlesFixed: ParticleDef[];
}

export function useMapLayout(map: MapNode[], chapter: number): UseMapLayoutResult {
  const svgWidth = 720;
  const layerHeight = 170;

  // ── 稳定伪随机种子 ──
  const mapSalt = useMemo(() => {
    let h = 0;
    for (const n of map) {
      const s = n.id + n.type + n.connectedTo.join(',');
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return String(h);
  }, [map]);

  const seededRand = (seed: string, index: number = 0) => {
    let hash = 0;
    const s = mapSalt + ':' + seed + ':' + index;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return ((hash & 0x7fffffff) % 10000) / 10000;
  };

  const MIN_SAME_LAYER_DIST = 85;
  const MIN_CROSS_LAYER_DIST = 70;
  const maxDepth = Math.max(...map.map(n => n.depth), 0);
  const svgHeight = (maxDepth + 1) * layerHeight + 140;

  // ── 节点位置计算 ──
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const depths = [...new Set<number>(map.map(n => n.depth))].sort((a, b) => a - b);

    for (const depth of depths) {
      const layerNodes = map.filter(n => n.depth === depth);
      const count = layerNodes.length;
      const baseY = (maxDepth - depth) * layerHeight + 85;

      const layerPositions: { id: string; x: number; y: number }[] = layerNodes.map((node, idx) => {
        const baseX = (idx + 0.5 + (seededRand(node.id, 2) - 0.5) * 0.35) / count * 100;
        const dx = (seededRand(node.id, 0) - 0.5) * 90;
        const dy = (seededRand(node.id, 1) - 0.5) * 44;
        const x = Math.max(50, Math.min(svgWidth - 50, baseX / 100 * (svgWidth - 140) + 70 + dx));
        const y = baseY + dy;
        return { id: node.id, x, y };
      });

      // 同层防重叠
      layerPositions.sort((a, b) => a.x - b.x);
      for (let i = 1; i < layerPositions.length; i++) {
        const gap = layerPositions[i].x - layerPositions[i - 1].x;
        if (gap < MIN_SAME_LAYER_DIST) {
          const push = (MIN_SAME_LAYER_DIST - gap) / 2 + 1;
          layerPositions[i - 1].x -= push;
          layerPositions[i].x += push;
          layerPositions[i - 1].x = Math.max(40, layerPositions[i - 1].x);
          layerPositions[i].x = Math.min(svgWidth - 40, layerPositions[i].x);
        }
      }

      // 跨层防碰撞
      for (const lp of layerPositions) {
        for (const existingId in positions) {
          const ep = positions[existingId];
          const dist = Math.sqrt((lp.x - ep.x) ** 2 + (lp.y - ep.y) ** 2);
          if (dist < MIN_CROSS_LAYER_DIST) {
            const angle = Math.atan2(lp.y - ep.y, lp.x - ep.x);
            const pushX = Math.cos(angle) * (MIN_CROSS_LAYER_DIST - dist + 5);
            lp.x = Math.max(40, Math.min(svgWidth - 40, lp.x + pushX));
          }
        }
        positions[lp.id] = { x: lp.x, y: lp.y };
      }
    }
    return positions;
  }, [map, maxDepth]);

  const getNodePos = (node: MapNode) => nodePositions[node.id] || { x: svgWidth / 2, y: 85 };
  const chapterIdx = Math.min((chapter || 1) - 1, MAP_BG_CLASSES.length - 1);

  // ── 粒子生成 ──
  const particles = useMemo(() => {
    const count = 40;
    return Array.from({ length: count }, (_, i) => {
      const r = seededRand('p', i * 31 + 7);
      const size = 2 + r * r * 10;
      const isBig = size > 8;
      return {
        left: `${seededRand('x', i * 13 + 1) * 94 + 3}%`,
        top: `${seededRand('y', i * 17 + 3) * 94 + 3}%`,
        size,
        duration: isBig ? 8 + seededRand('d', i * 19 + 5) * 10 : 3 + seededRand('d', i * 19 + 5) * 5,
        delay: seededRand('dl', i * 23 + 9) * 10,
        opacity: isBig ? 0.03 + seededRand('o', i * 29 + 11) * 0.08 : 0.2 + seededRand('o', i * 29 + 11) * 0.6,
        dx: Math.round((seededRand('dx', i * 37 + 13) - 0.5) * 160),
        dy: Math.round((seededRand('dy', i * 41 + 17) - 0.5) * 240),
        dx2: Math.round((seededRand('dx2', i * 43 + 19) - 0.5) * 120),
        dy2: Math.round(0 * (0.6 + seededRand('dy2', i * 47 + 23) * 0.8)),
      };
    });
  }, []);

  const particlesFixed = useMemo(
    () => particles.map((p, i) => ({ ...p, dy2: Math.round(p.dy * (0.6 + seededRand('dy2', i * 47 + 23) * 0.8)) })),
    [particles],
  );

  return {
    nodePositions, getNodePos, maxDepth, svgWidth, svgHeight, chapterIdx,
    mapBgClass: MAP_BG_CLASSES[chapterIdx],
    headerGradient: MAP_HEADER_GRADIENTS[chapterIdx],
    particleClass: PARTICLE_CLASSES[chapterIdx],
    fogColor: FOG_COLORS[chapterIdx],
    particlesFixed,
  };
}
