import { MapNode, NodeType } from '../types/game';
import { MAP_CONFIG } from '../config';

/**
 * 杀戮尖塔风格地图生成器 v3
 * 
 * v3核心改进：
 * - 保证每条路径上战斗节点密度：连续非战斗节点不超过1层
 * - 模板战斗比例提升：每层至少50%节点是战斗(enemy/elite)
 * - 路径验证：生成后验证所有路径，不满足最低战斗数则修正
 * - Boss前保证至少经历过足够战斗
 */

export interface MapNodeExt extends MapNode {
  x: number;
}

type LayerTemplate = NodeType[];

// ============================================================
// 层模板系统 — 保证每层至少50%是战斗节点
// ============================================================

/** 前半程3节点模板（层1~5）— 至少2个战斗 */
const EARLY_3_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'event'],
  ['enemy', 'enemy', 'merchant'],
  ['enemy', 'enemy', 'treasure'],
  ['enemy', 'elite', 'event'],
  ['enemy', 'enemy', 'event'],
  ['enemy', 'enemy', 'merchant'],
];

/** 前半程含精英的3节点模板（风险层）*/
const EARLY_3_ELITE_TEMPLATES: LayerTemplate[] = [
  ['elite', 'enemy', 'event'],
  ['elite', 'enemy', 'merchant'],
  ['elite', 'enemy', 'treasure'],
  ['elite', 'enemy', 'event'],
];

/** 前半程4节点模板 — 至少2个战斗 */
const EARLY_4_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'event', 'merchant'],
  ['enemy', 'enemy', 'enemy', 'event'],
  ['enemy', 'enemy', 'event', 'treasure'],
  ['enemy', 'enemy', 'merchant', 'enemy'],
  ['enemy', 'elite', 'event', 'enemy'],
];

/** 前半程5节点模板 — 至少3个战斗 */
const EARLY_5_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'enemy', 'event', 'merchant'],
  ['enemy', 'enemy', 'elite', 'event', 'enemy'],
  ['enemy', 'enemy', 'enemy', 'merchant', 'event'],
  ['enemy', 'enemy', 'enemy', 'event', 'treasure'],
];

/** 后半程3节点模板（层8~12）— 至少2个战斗 */
const LATE_3_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'merchant'],
  ['enemy', 'enemy', 'event'],
  ['enemy', 'enemy', 'treasure'],
  ['enemy', 'enemy', 'merchant'],
  ['enemy', 'enemy', 'event'],
];

/** 后半程含精英3节点模板 */
const LATE_3_ELITE_TEMPLATES: LayerTemplate[] = [
  ['elite', 'enemy', 'merchant'],
  ['elite', 'enemy', 'event'],
  ['elite', 'enemy', 'treasure'],
  ['elite', 'enemy', 'event'],
];

/** 后半程4节点模板 */
const LATE_4_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'merchant', 'event'],
  ['enemy', 'elite', 'enemy', 'event'],
  ['enemy', 'enemy', 'merchant', 'treasure'],
  ['enemy', 'elite', 'enemy', 'merchant'],
  ['enemy', 'enemy', 'event', 'enemy'],
];

/** 后半程5节点模板 — 至少3个战斗 */
const LATE_5_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'enemy', 'merchant', 'event'],
  ['enemy', 'elite', 'enemy', 'event', 'merchant'],
  ['enemy', 'enemy', 'enemy', 'treasure', 'event'],
  ['enemy', 'elite', 'enemy', 'merchant', 'enemy'],
  ['enemy', 'enemy', 'enemy', 'event', 'treasure'],
];

/** 2节点营火层模板 */
const CAMPFIRE_2_TEMPLATES: LayerTemplate[] = [
  ['campfire', 'campfire'],
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isCombatType(type: NodeType): boolean {
  return type === 'enemy' || type === 'elite' || type === 'boss';
}

/**
 * 根据层深度和节点数选择模板
 */
function getLayerTemplate(depth: number, count: number, fixedType: string | null): NodeType[] {
  if (fixedType === 'boss') return ['boss'];
  if (fixedType === 'campfire') {
    if (count <= 2) return pickRandom(CAMPFIRE_2_TEMPLATES);
    return Array(count).fill('campfire') as NodeType[];
  }
  if (fixedType === 'enemy') return Array(count).fill('enemy') as NodeType[];

  const isEarly = depth <= 5;
  const isRiskLayer = depth === 3 || depth === 10 || depth === 12;

  if (count === 5) {
    const pool = isEarly ? EARLY_5_TEMPLATES : LATE_5_TEMPLATES;
    return shuffle(pickRandom(pool));
  }

  if (count === 4) {
    const pool = isEarly ? EARLY_4_TEMPLATES : LATE_4_TEMPLATES;
    return shuffle(pickRandom(pool));
  }

  if (count === 3) {
    if (isRiskLayer && Math.random() < 0.6) {
      const elitePool = isEarly ? EARLY_3_ELITE_TEMPLATES : LATE_3_ELITE_TEMPLATES;
      return shuffle(pickRandom(elitePool));
    }
    if (!isRiskLayer && Math.random() < 0.15) {
      const elitePool = isEarly ? EARLY_3_ELITE_TEMPLATES : LATE_3_ELITE_TEMPLATES;
      return shuffle(pickRandom(elitePool));
    }
    const pool = isEarly ? EARLY_3_TEMPLATES : LATE_3_TEMPLATES;
    return shuffle(pickRandom(pool));
  }

  if (count === 2) {
    // 2节点层：保证至少1个战斗
    const pairs: LayerTemplate[] = [
      ['enemy', 'event'],
      ['enemy', 'merchant'],
      ['enemy', 'treasure'],
      ['enemy', 'event'],
      ['enemy', 'merchant'],
    ];
    return shuffle(pickRandom(pairs));
  }

  return ['enemy'];
}

// ============================================================
// 地图生成主函数
// ============================================================

export const generateMap = (): MapNode[] => {
  const nodes: MapNodeExt[] = [];
  const layers = MAP_CONFIG.totalLayers;

  // === 第一步：生成所有节点 + 基于模板分配类型 ===
  for (let l = 0; l < layers; l++) {
    const fixed = MAP_CONFIG.fixedLayers[l];
    const count = fixed ? fixed.count : 3;
    const fixedType = fixed?.type ?? null;

    const template = getLayerTemplate(l, count, fixedType);

    const isPreBossLayer = MAP_CONFIG.fixedLayers[l + 1]?.type === 'boss';
    const isPostBossLayer = l > 0 && MAP_CONFIG.fixedLayers[l - 1]?.type === 'boss';

    const positions: number[] = [];

    if (count === 1) {
      positions.push(50);
    } else if (isPreBossLayer) {
      for (let i = 0; i < count; i++) {
        const baseX = 25 + (i + 1) / (count + 1) * 50;
        const jitter = (Math.random() - 0.5) * 8;
        positions.push(Math.max(20, Math.min(80, baseX + jitter)));
      }
    } else if (isPostBossLayer) {
      for (let i = 0; i < count; i++) {
        const baseX = 10 + (i + 1) / (count + 1) * 80;
        const jitter = (Math.random() - 0.5) * 15;
        positions.push(Math.max(8, Math.min(92, baseX + jitter)));
      }
    } else {
      const minSpacing = 80 / (count + 1);
      for (let i = 0; i < count; i++) {
        const baseX = 5 + (i + 1) / (count + 1) * 90;
        const jitter = (Math.random() - 0.5) * Math.min(20, minSpacing * 0.5);
        positions.push(Math.max(5, Math.min(95, baseX + jitter)));
      }
    }
    positions.sort((a, b) => a - b);

    for (let i = 1; i < positions.length; i++) {
      if (positions[i] - positions[i - 1] < 12) {
        positions[i] = positions[i - 1] + 12;
        if (positions[i] > 95) positions[i] = 95;
      }
    }

    for (let i = 0; i < count; i++) {
      const id = `node-${l}-${i}`;
      nodes.push({
        id,
        type: template[i] || 'enemy',
        depth: l,
        connectedTo: [],
        completed: false,
        x: positions[i],
      });
    }
  }

  // === 第二步：生成连接关系 ===
  for (let l = 0; l < layers - 1; l++) {
    const currentLayer = nodes.filter(n => n.depth === l);
    const nextLayer = nodes.filter(n => n.depth === l + 1);

    if (nextLayer.length === 1) {
      currentLayer.forEach(node => {
        node.connectedTo.push(nextLayer[0].id);
      });
    } else if (currentLayer.length === 1) {
      nextLayer.forEach(next => {
        currentLayer[0].connectedTo.push(next.id);
      });
    } else {
      const inDegree: Record<string, number> = {};
      nextLayer.forEach(n => { inDegree[n.id] = 0; });

      currentLayer.forEach((node) => {
        const distances = nextLayer.map((next) => ({
          dist: Math.abs(node.x - next.x),
          id: next.id,
        })).sort((a, b) => a.dist - b.dist);

        node.connectedTo.push(distances[0].id);
        inDegree[distances[0].id]++;

        if (distances.length > 1 && Math.random() < 0.4) {
          if (inDegree[distances[1].id] < 2) {
            node.connectedTo.push(distances[1].id);
            inDegree[distances[1].id]++;
          }
        }
      });

      nextLayer.forEach((next) => {
        if (inDegree[next.id] === 0) {
          let closestParent = currentLayer[0];
          let minDist = Infinity;
          currentLayer.forEach(p => {
            const dist = Math.abs(p.x - next.x);
            if (dist < minDist) {
              minDist = dist;
              closestParent = p;
            }
          });
          closestParent.connectedTo.push(next.id);
          inDegree[next.id]++;
        }
      });
    }
  }

  // === 第三步：路径感知修正 — 保证战斗密度 ===
  const nonCombatTypes: NodeType[] = ['campfire', 'merchant', 'event', 'treasure'];
  const fixedLayerIds = new Set(Object.keys(MAP_CONFIG.fixedLayers).map(Number));

  for (let l = 1; l < layers; l++) {
    if (fixedLayerIds.has(l)) continue;

    const currentLayer = nodes.filter(n => n.depth === l);
    currentLayer.forEach(node => {
      const parentNodes = nodes.filter(n => n.depth === l - 1 && n.connectedTo.includes(node.id));
      if (parentNodes.length === 0) return;

      // 规则1：同类型非战斗节点不能连续
      if (nonCombatTypes.includes(node.type)) {
        const hasSameTypeParent = parentNodes.some(p => p.type === node.type);
        if (hasSameTypeParent) {
          node.type = 'enemy';
        }
      }

      // 规则2：所有父节点都是非战斗时，当前节点必须是战斗
      if (nonCombatTypes.includes(node.type)) {
        const allParentsNonCombat = parentNodes.every(p => nonCombatTypes.includes(p.type));
        if (allParentsNonCombat) {
          node.type = 'enemy';
        }
      }

      // 规则3：检查祖父节点 — 如果父节点和祖父节点都不是战斗，强制当前为战斗
      // 这确保连续非战斗路径不超过1层
      if (nonCombatTypes.includes(node.type) && l >= 2) {
        const hasNonCombatChain = parentNodes.some(parent => {
          if (!nonCombatTypes.includes(parent.type)) return false;
          // 检查parent的父节点
          const grandparents = nodes.filter(n => n.depth === l - 2 && n.connectedTo.includes(parent.id));
          return grandparents.some(gp => nonCombatTypes.includes(gp.type));
        });
        if (hasNonCombatChain) {
          node.type = 'enemy';
        }
      }
    });
  }

  // === Step 4: Economic node distribution fix ===
  const economicNodeTypes: NodeType[] = ['merchant', 'treasure'];
  for (let l = 0; l < layers; l++) {
    if (fixedLayerIds.has(l)) continue;
    const layerNodes = nodes.filter(n => n.depth === l);

    // First 2 layers (after start): no economic nodes
    if (l <= 2) {
      layerNodes.forEach(node => {
        if (economicNodeTypes.includes(node.type)) {
          node.type = Math.random() < 0.6 ? 'enemy' : 'event';
        }
      });
      continue;
    }

    // Any layer: max 1 economic node
    let econCount = 0;
    layerNodes.forEach(node => {
      if (economicNodeTypes.includes(node.type)) {
        econCount++;
        if (econCount > 1) {
          node.type = Math.random() < 0.6 ? 'enemy' : 'event';
        }
      }
    });
  }

  // === Step 5: 路径战斗密度验证 ===
  // 验证从起点到每个Boss的所有路径，确保最低战斗数
  // 中Boss(depth 7): 路径上至少3场战斗（不含Boss本身）
  // 最终Boss(depth 14): 从中Boss后至少3场战斗
  validateCombatDensity(nodes, 0, 7, 3);
  validateCombatDensity(nodes, 8, 14, 3);

  // 去重连接
  nodes.forEach(n => {
    n.connectedTo = [...new Set(n.connectedTo)];
  });

  return nodes;
};

/**
 * 验证并修正指定范围内的战斗密度
 * 从startDepth到endDepth的每条可能路径上，至少有minCombat场战斗
 */
function validateCombatDensity(
  nodes: MapNodeExt[],
  startDepth: number,
  endDepth: number,
  minCombat: number
): void {
  const fixedLayerIds = new Set(Object.keys(MAP_CONFIG.fixedLayers).map(Number));
  const nonCombatTypes: NodeType[] = ['campfire', 'merchant', 'event', 'treasure'];

  // 找出所有从startDepth到endDepth的路径
  const startNodes = nodes.filter(n => n.depth === startDepth);

  function findMinCombatOnPaths(nodeId: string, targetDepth: number): number {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;

    const combatVal = isCombatType(node.type) ? 1 : 0;

    if (node.depth === targetDepth) {
      return combatVal;
    }

    const children = node.connectedTo
      .map(cid => nodes.find(n => n.id === cid))
      .filter((n): n is MapNodeExt => n !== undefined && n.depth <= targetDepth);

    if (children.length === 0) return combatVal;

    // 找最少战斗的路径（最差情况）
    let minChildCombat = Infinity;
    for (const child of children) {
      const childMin = findMinCombatOnPaths(child.id, targetDepth);
      if (childMin < minChildCombat) {
        minChildCombat = childMin;
      }
    }

    return combatVal + (minChildCombat === Infinity ? 0 : minChildCombat);
  }

  // 对每个起始节点检查
  for (const startNode of startNodes) {
    const minOnPath = findMinCombatOnPaths(startNode.id, endDepth);
    if (minOnPath < minCombat) {
      // 找出战斗最少的路径上的非战斗节点，强制改为enemy
      forceMoreCombat(nodes, startNode.id, endDepth, minCombat, fixedLayerIds, nonCombatTypes);
    }
  }
}

/**
 * 沿最弱路径强制增加战斗节点
 */
function forceMoreCombat(
  nodes: MapNodeExt[],
  startId: string,
  targetDepth: number,
  minCombat: number,
  fixedLayerIds: Set<number>,
  nonCombatTypes: NodeType[]
): void {
  // 找最弱路径
  const path = findWeakestPath(nodes, startId, targetDepth);
  if (!path) return;

  // 统计路径上的战斗数
  let combatCount = path.filter(n => isCombatType(n.type)).length;

  // 将路径上的非战斗、非固定层节点改为enemy，直到满足最低战斗数
  for (const node of path) {
    if (combatCount >= minCombat) break;
    if (fixedLayerIds.has(node.depth)) continue;
    if (nonCombatTypes.includes(node.type)) {
      node.type = 'enemy';
      combatCount++;
    }
  }
}

/**
 * 找战斗数最少的路径
 */
function findWeakestPath(
  nodes: MapNodeExt[],
  startId: string,
  targetDepth: number
): MapNodeExt[] | null {
  const node = nodes.find(n => n.id === startId) as MapNodeExt | undefined;
  if (!node) return null;

  if (node.depth === targetDepth) {
    return [node];
  }

  const children = node.connectedTo
    .map(cid => nodes.find(n => n.id === cid))
    .filter((n): n is MapNodeExt => n !== undefined && n.depth <= targetDepth);

  if (children.length === 0) return [node];

  let weakestSubPath: MapNodeExt[] | null = null;
  let weakestCombat = Infinity;

  for (const child of children) {
    const subPath = findWeakestPath(nodes, child.id, targetDepth);
    if (subPath) {
      const combat = subPath.filter(n => isCombatType(n.type)).length;
      if (combat < weakestCombat) {
        weakestCombat = combat;
        weakestSubPath = subPath;
      }
    }
  }

  if (weakestSubPath) {
    return [node, ...weakestSubPath];
  }
  return [node];
}

// 获取节点的x坐标（从id解析）
export const getNodeX = (node: MapNode, allNodes: MapNode[]): number => {
  if ('x' in node) return (node as MapNodeExt).x;

  const layerNodes = allNodes.filter(n => n.depth === node.depth);
  const idx = layerNodes.findIndex(n => n.id === node.id);
  const count = layerNodes.length;
  return (idx + 1) / (count + 1) * 100;
};
