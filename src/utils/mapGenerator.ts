import { MapNode, NodeType } from '../types/game';
import { MAP_CONFIG } from '../config';

/**
 * 杀戮尖塔风格地图生成器 v4
 *
 * 参照 Slay the Spire 规则重写：
 * 1. 先生成节点网格 + 路径连接
 * 2. 再按概率权重随机分配节点类型
 * 3. 约束修正：特殊节点不连续、精英/营火不过早出现、Boss前不出精英
 * 4. Boss前保证≥2个营火且分布在不同路径上
 * 5. 路径战斗密度兜底
 */

export interface MapNodeExt extends MapNode {
  x: number;
}

// ============================================================
// 工具函数
// ============================================================

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

/** 特殊节点 — 不能与同类或彼此连续 */
const SPECIAL_TYPES: NodeType[] = ['elite', 'campfire', 'merchant'];

// ============================================================
// 概率权重配置 — 参照杀戮尖塔
// ============================================================

interface NodeWeight {
  type: NodeType;
  weight: number;
}

/** 标准概率权重（杀戮尖塔风格） */
const STANDARD_WEIGHTS: NodeWeight[] = [
  { type: 'enemy',    weight: 45 },
  { type: 'event',    weight: 20 },
  { type: 'elite',    weight: 12 },
  { type: 'campfire', weight: 12 },
  { type: 'merchant', weight: 6 },
  { type: 'treasure', weight: 5 },
];

/** 从权重池中按概率抽取一个类型，可排除某些类型 */
function weightedRandomType(weights: NodeWeight[], excluded?: Set<NodeType>): NodeType {
  const filtered = excluded
    ? weights.filter(w => !excluded.has(w.type))
    : weights;
  const totalWeight = filtered.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * totalWeight;
  for (const w of filtered) {
    r -= w.weight;
    if (r <= 0) return w.type;
  }
  return 'enemy';
}

// ============================================================
// 地图生成主函数
// ============================================================

export const generateMap = (): MapNode[] => {
  const layers = MAP_CONFIG.totalLayers;

  // --- 计算Boss前层 ---
  const bossDepths: number[] = [];
  const preBossLayers = new Set<number>();
  for (const [k, v] of Object.entries(MAP_CONFIG.fixedLayers)) {
    if (v.type === 'boss') {
      bossDepths.push(Number(k));
      preBossLayers.add(Number(k) - 1);
    }
  }
  // 只有 boss/enemy 固定层才跳过类型分配
  const trulyFixedLayers = new Set(
    Object.entries(MAP_CONFIG.fixedLayers)
      .filter(([, v]) => v.type !== null)
      .map(([k]) => Number(k))
  );

  // ================================================================
  // 第一步：生成所有节点（只分配位置，暂不分配类型）
  // ================================================================
  const nodes: MapNodeExt[] = [];

  for (let l = 0; l < layers; l++) {
    const fixed = MAP_CONFIG.fixedLayers[l];
    const count = fixed ? fixed.count : 3;

    const positions: number[] = [];
    const isPreBossLayer = preBossLayers.has(l);
    const isPostBossLayer = l > 0 && bossDepths.includes(l - 1);

    if (count === 1) {
      positions.push(50);
    } else if (isPreBossLayer) {
      // Boss前层稍收拢
      for (let i = 0; i < count; i++) {
        const baseX = 20 + (i + 1) / (count + 1) * 60;
        const jitter = (Math.random() - 0.5) * 8;
        positions.push(Math.max(15, Math.min(85, baseX + jitter)));
      }
    } else if (isPostBossLayer) {
      // Boss后层展开
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

    // 最小间距保障
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] - positions[i - 1] < 12) {
        positions[i] = positions[i - 1] + 12;
        if (positions[i] > 95) positions[i] = 95;
      }
    }

    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `node-${l}-${i}`,
        type: 'enemy', // 占位，后面再分配
        depth: l,
        connectedTo: [],
        completed: false,
        x: positions[i],
      });
    }
  }

  // ================================================================
  // 第二步：生成连接关系（同之前，基于最近距离+随机分叉）
  // ================================================================
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
        const distances = nextLayer.map(next => ({
          dist: Math.abs(node.x - next.x),
          id: next.id,
        })).sort((a, b) => a.dist - b.dist);

        node.connectedTo.push(distances[0].id);
        inDegree[distances[0].id]++;

        // 40%概率连第二近节点（增加分叉）
        if (distances.length > 1 && Math.random() < 0.4) {
          if (inDegree[distances[1].id] < 2) {
            node.connectedTo.push(distances[1].id);
            inDegree[distances[1].id]++;
          }
        }
      });

      // 孤立节点补连
      nextLayer.forEach(next => {
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
        }
      });
    }
  }

  // 去重连接
  nodes.forEach(n => {
    n.connectedTo = [...new Set(n.connectedTo)];
  });

  // ================================================================
  // 第三步：分配节点类型（杀戮尖塔式概率 + 约束）
  // ================================================================

  // 3a. 固定层先设置
  for (const node of nodes) {
    const fixed = MAP_CONFIG.fixedLayers[node.depth];
    if (fixed?.type === 'boss') {
      node.type = 'boss';
    } else if (fixed?.type === 'enemy' && trulyFixedLayers.has(node.depth)) {
      node.type = 'enemy';
    }
  }

  // 3b. 按层逐个分配非固定层的节点类型
  for (let l = 0; l < layers; l++) {
    if (trulyFixedLayers.has(l)) continue;

    const layerNodes = nodes.filter(n => n.depth === l);

    // 构建本层排除集合
    const layerExcluded = new Set<NodeType>();

    // 规则A：前3层不出精英和营火（杀戮尖塔前5层不出，我们缩短到前3层因为只有15层）
    if (l <= 2) {
      layerExcluded.add('elite');
      layerExcluded.add('campfire');
    }

    // 规则B：Boss前一层不出精英
    if (preBossLayers.has(l)) {
      layerExcluded.add('elite');
    }

    // 规则C：Boss后第一层不出精英/营火（给玩家缓冲）
    if (l > 0 && bossDepths.includes(l - 1)) {
      layerExcluded.add('elite');
    }

    // 同层已用类型跟踪（杀戮尖塔规则：分叉出去的节点类型尽量不同）
    const usedInLayer = new Set<NodeType>();

    for (const node of shuffle(layerNodes)) {
      if (trulyFixedLayers.has(l)) continue;

      // 本节点的排除集 = 层排除 + 父节点约束
      const nodeExcluded = new Set(layerExcluded);

      // 获取父节点
      const parents = nodes.filter(n => n.depth === l - 1 && n.connectedTo.includes(node.id));

      // 规则D：特殊节点不能与父节点同类型连续
      // 精英、商店、营火不能连续出现
      for (const p of parents) {
        if (SPECIAL_TYPES.includes(p.type)) {
          nodeExcluded.add(p.type);
        }
      }

      // 规则E：分叉多样性 — 同一个父节点指向的多个子节点类型尽量不同
      // 如果同层已经有了某个特殊类型，降低再次出现概率（通过排除）
      for (const used of usedInLayer) {
        if (SPECIAL_TYPES.includes(used)) {
          nodeExcluded.add(used);
        }
      }

      const assignedType = weightedRandomType(STANDARD_WEIGHTS, nodeExcluded);
      node.type = assignedType;
      usedInLayer.add(assignedType);
    }
  }

  // ================================================================
  // 第四步：约束修正 — 逐节点检查路径连续性
  // ================================================================
  const nonCombatTypes: NodeType[] = ['campfire', 'merchant', 'event', 'treasure'];

  for (let l = 1; l < layers; l++) {
    if (trulyFixedLayers.has(l)) continue;
    const layerNodes = nodes.filter(n => n.depth === l);

    for (const node of layerNodes) {
      const parents = nodes.filter(n => n.depth === l - 1 && n.connectedTo.includes(node.id));
      if (parents.length === 0) continue;

      // 修正1：特殊节点不能与同类父节点连续
      if (SPECIAL_TYPES.includes(node.type)) {
        if (parents.some(p => p.type === node.type)) {
          node.type = 'enemy';
        }
      }

      // 修正2：连续2层非战斗 → 强制战斗
      if (nonCombatTypes.includes(node.type) && l >= 2) {
        const hasNonCombatChain = parents.some(parent => {
          if (!nonCombatTypes.includes(parent.type)) return false;
          const grandparents = nodes.filter(n => n.depth === l - 2 && n.connectedTo.includes(parent.id));
          return grandparents.some(gp => nonCombatTypes.includes(gp.type));
        });
        if (hasNonCombatChain) {
          node.type = 'enemy';
        }
      }
    }
  }

  // ================================================================
  // 第五步：经济节点管控
  // ================================================================
  const economicTypes: NodeType[] = ['merchant', 'treasure'];
  for (let l = 0; l < layers; l++) {
    if (trulyFixedLayers.has(l)) continue;
    const layerNodes = nodes.filter(n => n.depth === l);

    // 前2层无经济节点
    if (l <= 1) {
      layerNodes.forEach(n => {
        if (economicTypes.includes(n.type)) {
          n.type = Math.random() < 0.6 ? 'enemy' : 'event';
        }
      });
      continue;
    }

    // 每层最多1个经济节点
    let econCount = 0;
    layerNodes.forEach(n => {
      if (economicTypes.includes(n.type)) {
        econCount++;
        if (econCount > 1) {
          n.type = Math.random() < 0.6 ? 'enemy' : 'event';
        }
      }
    });
  }

  // ================================================================
  // 第六步：路径战斗密度兜底
  // ================================================================
  validateCombatDensity(nodes, 0, bossDepths[0] ?? 7, 3, trulyFixedLayers);
  if (bossDepths.length > 1) {
    validateCombatDensity(nodes, bossDepths[0] + 1, bossDepths[1], 3, trulyFixedLayers);
  }

  // ================================================================
  // 第七步：Boss前营火保障 — 每个Boss前至少2个campfire，分布不同路径
  // ================================================================
  for (const bossDepth of bossDepths) {
    ensureCampfiresBeforeBoss(nodes, bossDepth, 2);
  }

  return nodes;
};

// ============================================================
// Boss前营火保障
// ============================================================

/**
 * 确保Boss前的节点中至少有 minCount 个 campfire，
 * 且尽量分布在不同的路径上（不相邻位置）。
 *
 * 搜索范围：Boss前2层（preBoss层和preBoss-1层）
 */
function ensureCampfiresBeforeBoss(
  nodes: MapNodeExt[],
  bossDepth: number,
  minCount: number
): void {
  const preBossDepth = bossDepth - 1;
  const preBoss2Depth = bossDepth - 2;

  // 收集Boss前2层所有节点
  const candidates = nodes.filter(n =>
    n.depth === preBossDepth || n.depth === preBoss2Depth
  );

  // 已有的营火
  const existingCampfires = candidates.filter(n => n.type === 'campfire');

  let needed = minCount - existingCampfires.length;
  if (needed <= 0) return;

  // 找Boss前一层（preBossDepth）的可替换节点
  const preBossNodes = nodes.filter(n => n.depth === preBossDepth);
  // 找Boss前两层（preBoss2Depth）的可替换节点
  const preBoss2Nodes = nodes.filter(n => n.depth === preBoss2Depth);

  // 已有营火的x坐标集合（用于保证分散）
  const campfireXPositions = existingCampfires.map(n => n.x);

  // 优先在preBossDepth层放置，其次preBoss2Depth层
  const allCandidates = [
    ...shuffle(preBossNodes.filter(n => n.type !== 'campfire' && n.type !== 'boss')),
    ...shuffle(preBoss2Nodes.filter(n => n.type !== 'campfire' && n.type !== 'boss')),
  ];

  // 按距离已有营火的最远优先排序（确保分散）
  allCandidates.sort((a, b) => {
    const aMinDist = campfireXPositions.length > 0
      ? Math.min(...campfireXPositions.map(cx => Math.abs(a.x - cx)))
      : Infinity;
    const bMinDist = campfireXPositions.length > 0
      ? Math.min(...campfireXPositions.map(cx => Math.abs(b.x - cx)))
      : Infinity;
    return bMinDist - aMinDist; // 距离远的优先
  });

  for (const candidate of allCandidates) {
    if (needed <= 0) break;

    // 检查是否与已有营火在不同路径上（x距离>15表示不同路径区域）
    const tooClose = campfireXPositions.some(cx => Math.abs(candidate.x - cx) < 15);
    if (tooClose && allCandidates.length > needed) continue; // 有更好选择时跳过

    candidate.type = 'campfire';
    campfireXPositions.push(candidate.x);
    needed--;
  }

  // 如果分散放置后仍不够，强制放置
  if (needed > 0) {
    for (const candidate of allCandidates) {
      if (needed <= 0) break;
      if (candidate.type === 'campfire') continue;
      candidate.type = 'campfire';
      needed--;
    }
  }
}

// ============================================================
// 路径战斗密度验证
// ============================================================

function validateCombatDensity(
  nodes: MapNodeExt[],
  startDepth: number,
  endDepth: number,
  minCombat: number,
  fixedLayerIds: Set<number>
): void {
  const nonCombatTypes: NodeType[] = ['campfire', 'merchant', 'event', 'treasure'];
  const startNodes = nodes.filter(n => n.depth === startDepth);

  function findMinCombatOnPaths(nodeId: string, targetDepth: number): number {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    const combatVal = isCombatType(node.type) ? 1 : 0;
    if (node.depth === targetDepth) return combatVal;

    const children = node.connectedTo
      .map(cid => nodes.find(n => n.id === cid))
      .filter((n): n is MapNodeExt => n !== undefined && n.depth <= targetDepth);

    if (children.length === 0) return combatVal;

    let minChildCombat = Infinity;
    for (const child of children) {
      const childMin = findMinCombatOnPaths(child.id, targetDepth);
      if (childMin < minChildCombat) minChildCombat = childMin;
    }
    return combatVal + (minChildCombat === Infinity ? 0 : minChildCombat);
  }

  for (const startNode of startNodes) {
    const minOnPath = findMinCombatOnPaths(startNode.id, endDepth);
    if (minOnPath < minCombat) {
      forceMoreCombat(nodes, startNode.id, endDepth, minCombat, fixedLayerIds, nonCombatTypes);
    }
  }
}

function forceMoreCombat(
  nodes: MapNodeExt[],
  startId: string,
  targetDepth: number,
  minCombat: number,
  fixedLayerIds: Set<number>,
  nonCombatTypes: NodeType[]
): void {
  const path = findWeakestPath(nodes, startId, targetDepth);
  if (!path) return;

  let combatCount = path.filter(n => isCombatType(n.type)).length;
  for (const node of path) {
    if (combatCount >= minCombat) break;
    if (fixedLayerIds.has(node.depth)) continue;
    // 不把营火改掉（保护Boss前的营火）
    if (node.type === 'campfire') continue;
    if (nonCombatTypes.includes(node.type)) {
      node.type = 'enemy';
      combatCount++;
    }
  }
}

function findWeakestPath(
  nodes: MapNodeExt[],
  startId: string,
  targetDepth: number
): MapNodeExt[] | null {
  const node = nodes.find(n => n.id === startId) as MapNodeExt | undefined;
  if (!node) return null;
  if (node.depth === targetDepth) return [node];

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

  return weakestSubPath ? [node, ...weakestSubPath] : [node];
}

// ============================================================
// 导出辅助
// ============================================================

export const getNodeX = (node: MapNode, allNodes: MapNode[]): number => {
  if ('x' in node) return (node as MapNodeExt).x;
  const layerNodes = allNodes.filter(n => n.depth === node.depth);
  const idx = layerNodes.findIndex(n => n.id === node.id);
  const count = layerNodes.length;
  return (idx + 1) / (count + 1) * 100;
};
