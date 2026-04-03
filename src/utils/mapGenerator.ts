import { MapNode, NodeType } from '../types/game';
import { MAP_CONFIG } from '../config';

/**
 * \u6740\u622e\u5c16\u5854\u98ce\u683c\u5730\u56fe\u751f\u6210\u5668 v2
 * 
 * \u6838\u5fc3\u6539\u8fdb\uff1a
 * - \u5c42\u6a21\u677f\u5206\u914d\uff1a\u540c\u5c42\u8282\u70b9\u7c7b\u578b\u4e0d\u96f7\u540c\uff0c\u81f3\u5c11\u5305\u542b2\u4e2a\u5927\u7c7b
 * - Boss\u552f\u4e00\u6c47\u805a\uff1a\u53ea\u6709Boss\u5c42\u5141\u8bb8\u5168\u56fe\u6536\u675f\uff0c\u7cbe\u82f1\u4e0d\u518d\u505a\u6c47\u805a\u7ec8\u70b9
 * - \u53d1\u6563\u5f0f\u8fde\u63a5\uff1a\u975eBoss\u5355\u70b9\u4e0d\u5141\u8bb8\u5165\u8fb9>2\uff0c\u907f\u514dDNA\u7ed3\u6784
 * - \u8def\u7ebf\u7b56\u7565\u6027\uff1a\u6bcf\u6b21\u5206\u53c9\u540e2-3\u5c42\u6709\u8def\u7ebf\u503e\u5411\uff08\u98ce\u9669/\u5e73\u8861/\u7ecf\u6d4e\uff09
 */

export interface MapNodeExt extends MapNode {
  x: number; // 0-100 \u7684\u6c34\u5e73\u767e\u5206\u6bd4\u4f4d\u7f6e
}

// ============================================================
// \u5c42\u6a21\u677f\u7cfb\u7edf
// ============================================================

type LayerTemplate = NodeType[];

/** \u524d\u534a\u7a0b3\u8282\u70b9\u6a21\u677f\uff08\u5c421~5\uff09 */
const EARLY_3_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'event', 'enemy'],
  ['enemy', 'enemy', 'event'],
  ['enemy', 'event', 'shop'],
  ['enemy', 'treasure', 'event'],
  ['enemy', 'event', 'enemy'],
  ['enemy', 'enemy', 'event'],
];

/** \u524d\u534a\u7a0b\u542b\u7cbe\u82f1\u76843\u8282\u70b9\u6a21\u677f\uff08\u98ce\u9669\u5c42\uff09 */
const EARLY_3_ELITE_TEMPLATES: LayerTemplate[] = [
  ['elite', 'event', 'shop'],
  ['elite', 'treasure', 'enemy'],
  ['elite', 'merchant', 'event'],
  ['elite', 'enemy', 'shop'],
];

/** \u524d\u534a\u7a0b4\u8282\u70b9\u6a21\u677f */
const EARLY_4_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'event', 'enemy', 'enemy'],
  ['enemy', 'enemy', 'event', 'shop'],
  ['enemy', 'enemy', 'event', 'enemy'],
  ['enemy', 'event', 'enemy', 'treasure'],
  ['enemy', 'enemy', 'shop', 'event'],
];

/** 前半程5节点模板 */
const EARLY_5_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'event', 'enemy', 'enemy', 'shop'],
  ['enemy', 'enemy', 'event', 'treasure', 'enemy'],
  ['enemy', 'event', 'enemy', 'enemy', 'event'],
  ['enemy', 'enemy', 'event', 'enemy', 'merchant'],
];

/** \u540e\u534a\u7a0b3\u8282\u70b9\u6a21\u677f\uff08\u5c428~12\uff09 */
const LATE_3_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'event'],
  ['enemy', 'treasure', 'shop'],
  ['enemy', 'shop', 'merchant'],
  ['enemy', 'event', 'treasure'],
  ['enemy', 'merchant', 'event'],
];

/** \u540e\u534a\u7a0b\u542b\u7cbe\u82f1\u76843\u8282\u70b9\u6a21\u677f */
const LATE_3_ELITE_TEMPLATES: LayerTemplate[] = [
  ['elite', 'enemy', 'event'],
  ['elite', 'merchant', 'treasure'],
  ['elite', 'shop', 'event'],
  ['elite', 'enemy', 'treasure'],
];

/** \u540e\u534a\u7a0b4\u8282\u70b9\u6a21\u677f */
const LATE_4_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'shop', 'event'],
  ['enemy', 'elite', 'treasure', 'event'],
  ['enemy', 'enemy', 'merchant', 'treasure'],
  ['enemy', 'elite', 'shop', 'merchant'],
  ['enemy', 'event', 'treasure', 'merchant'],
];

/** 后半程5节点模板 */
const LATE_5_TEMPLATES: LayerTemplate[] = [
  ['enemy', 'enemy', 'shop', 'event', 'treasure'],
  ['enemy', 'elite', 'treasure', 'event', 'merchant'],
  ['enemy', 'enemy', 'merchant', 'treasure', 'event'],
  ['enemy', 'elite', 'shop', 'event', 'enemy'],
  ['enemy', 'enemy', 'event', 'treasure', 'shop'],
];



/** 2\u8282\u70b9\u8425\u706b\u5c42\u6a21\u677f */
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

/**
 * \u6839\u636e\u5c42\u6df1\u5ea6\u548c\u8282\u70b9\u6570\u9009\u62e9\u6a21\u677f
 */
function getLayerTemplate(depth: number, count: number, fixedType: string | null): NodeType[] {
  // \u56fa\u5b9a\u7c7b\u578b\u5c42\uff08boss/campfire/enemy\u8d77\u70b9\uff09
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
    // \u98ce\u9669\u5c42\u6709\u6982\u7387\u51fa\u7cbe\u82f1\u6a21\u677f
    if (isRiskLayer && Math.random() < 0.6) {
      const elitePool = isEarly ? EARLY_3_ELITE_TEMPLATES : LATE_3_ELITE_TEMPLATES;
      return shuffle(pickRandom(elitePool));
    }
    // \u975e\u98ce\u9669\u5c42\u4e5f\u6709\u5c0f\u6982\u7387\u51fa\u7cbe\u82f1
    if (!isRiskLayer && Math.random() < 0.15) {
      const elitePool = isEarly ? EARLY_3_ELITE_TEMPLATES : LATE_3_ELITE_TEMPLATES;
      return shuffle(pickRandom(elitePool));
    }
    const pool = isEarly ? EARLY_3_TEMPLATES : LATE_3_TEMPLATES;
    return shuffle(pickRandom(pool));
  }

  if (count === 2) {
    // 2\u8282\u70b9\u5c42\uff1a\u4fdd\u8bc1\u4e0d\u540c\u7c7b\u578b
    const pairs: LayerTemplate[] = [
      ['enemy', 'event'],
      ['enemy', 'shop'],
      ['enemy', 'treasure'],
      ['enemy', 'merchant'],
      ['shop', 'event'],
      ['treasure', 'event'],
    ];
    return shuffle(pickRandom(pairs));
  }

  // count === 1 fallback
  return ['enemy'];
}

// ============================================================
// \u5730\u56fe\u751f\u6210\u4e3b\u51fd\u6570
// ============================================================

export const generateMap = (): MapNode[] => {
  const nodes: MapNodeExt[] = [];
  const layers = MAP_CONFIG.totalLayers;

  // === \u7b2c\u4e00\u6b65\uff1a\u751f\u6210\u6240\u6709\u8282\u70b9 + \u57fa\u4e8e\u6a21\u677f\u5206\u914d\u7c7b\u578b ===
  for (let l = 0; l < layers; l++) {
    const fixed = MAP_CONFIG.fixedLayers[l];
    const count = fixed ? fixed.count : 3;
    const fixedType = fixed?.type ?? null;

    // \u83b7\u53d6\u5c42\u6a21\u677f
    const template = getLayerTemplate(l, count, fixedType);

    // \u8ba1\u7b97x\u5750\u6807 \u2014 \u53d1\u6563\u5f0f\u5206\u5e03
    const isPreBossLayer = MAP_CONFIG.fixedLayers[l + 1]?.type === 'boss';
    const isPostBossLayer = l > 0 && MAP_CONFIG.fixedLayers[l - 1]?.type === 'boss';

    const positions: number[] = [];

    if (count === 1) {
      positions.push(50);
    } else if (isPreBossLayer) {
      // Boss\u524d\u4e00\u5c42\uff1a\u5411\u4e2d\u95f4\u6536\u62e2\uff0825-75\u8303\u56f4\uff09
      for (let i = 0; i < count; i++) {
        const baseX = 25 + (i + 1) / (count + 1) * 50;
        const jitter = (Math.random() - 0.5) * 8;
        positions.push(Math.max(20, Math.min(80, baseX + jitter)));
      }
    } else if (isPostBossLayer) {
      // Boss\u540e\u4e00\u5c42\uff1a\u91cd\u65b0\u53d1\u6563\uff0810-90\u8303\u56f4\uff09
      for (let i = 0; i < count; i++) {
        const baseX = 10 + (i + 1) / (count + 1) * 80;
        const jitter = (Math.random() - 0.5) * 15;
        positions.push(Math.max(8, Math.min(92, baseX + jitter)));
      }
    } else {
      // \u666e\u901a\u5c42\uff1a\u6700\u5927\u5316\u53d1\u6563\uff085-95\u8303\u56f4\uff09
      const minSpacing = 80 / (count + 1);
      for (let i = 0; i < count; i++) {
        const baseX = 5 + (i + 1) / (count + 1) * 90;
        const jitter = (Math.random() - 0.5) * Math.min(20, minSpacing * 0.5);
        positions.push(Math.max(5, Math.min(95, baseX + jitter)));
      }
    }
    positions.sort((a, b) => a - b);

    // \u786e\u4fdd\u76f8\u90bb\u8282\u70b9\u95f4\u8ddd\u4e0d\u5c0f\u4e8e12\uff08\u907f\u514d\u91cd\u53e0\uff09
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

  // === \u7b2c\u4e8c\u6b65\uff1a\u751f\u6210\u8fde\u63a5\u5173\u7cfb \u2014 \u53d1\u6563\u5f0f\uff0c\u975eBoss\u4e0d\u6c47\u805a ===
  for (let l = 0; l < layers - 1; l++) {
    const currentLayer = nodes.filter(n => n.depth === l);
    const nextLayer = nodes.filter(n => n.depth === l + 1);

    if (nextLayer.length === 1) {
      // \u4e0b\u4e00\u5c42\u53ea\u67091\u4e2a\u8282\u70b9\uff08Boss\uff09\uff0c\u6240\u6709\u5f53\u524d\u5c42\u8282\u70b9\u90fd\u8fde\u5411\u5b83
      currentLayer.forEach(node => {
        node.connectedTo.push(nextLayer[0].id);
      });
    } else if (currentLayer.length === 1) {
      // \u5f53\u524d\u5c42\u53ea\u67091\u4e2a\u8282\u70b9\uff08Boss\u540e\uff09\uff0c\u8fde\u5411\u4e0b\u4e00\u5c42\u6240\u6709\u8282\u70b9\uff08\u53d1\u6563\uff09
      nextLayer.forEach(next => {
        currentLayer[0].connectedTo.push(next.id);
      });
    } else {
      // \u57fa\u4e8e\u4f4d\u7f6e\u8ddd\u79bb\u7684\u8fde\u63a5 \u2014 \u9650\u5236\u5165\u8fb9\u6570\uff0c\u907f\u514d\u6c47\u805a
      const inDegree: Record<string, number> = {};
      nextLayer.forEach(n => { inDegree[n.id] = 0; });

      // \u5148\u4e3a\u6bcf\u4e2a\u5f53\u524d\u5c42\u8282\u70b9\u8fde\u6700\u8fd1\u76841\u4e2a
      currentLayer.forEach((node) => {
        const distances = nextLayer.map((next) => ({
          dist: Math.abs(node.x - next.x),
          id: next.id,
        })).sort((a, b) => a.dist - b.dist);

        // \u5fc5\u8fde\u6700\u8fd1\u76841\u4e2a
        node.connectedTo.push(distances[0].id);
        inDegree[distances[0].id]++;

        // 40%\u6982\u7387\u8fde\u7b2c\u4e8c\u8fd1\u7684\uff08\u4f46\u9650\u5236\u5165\u8fb9\u22642\uff09
        if (distances.length > 1 && Math.random() < 0.4) {
          if (inDegree[distances[1].id] < 2) {
            node.connectedTo.push(distances[1].id);
            inDegree[distances[1].id]++;
          }
        }
      });

      // \u786e\u4fdd\u6bcf\u4e2a\u4e0b\u4e00\u5c42\u8282\u70b9\u81f3\u5c11\u6709\u4e00\u4e2a\u7236\u8282\u70b9
      nextLayer.forEach((next) => {
        if (inDegree[next.id] === 0) {
          // \u627e\u6700\u8fd1\u7684\u7236\u8282\u70b9\u8fde\u8fc7\u6765
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

  // === \u7b2c\u4e09\u6b65\uff1a\u8def\u5f84\u611f\u77e5\u4fee\u6b63 \u2014 \u907f\u514d\u8fde\u7eed\u540c\u7c7b\u578b\u975e\u6218\u6597\u8282\u70b9 ===
  const nonCombatTypes: NodeType[] = ['campfire', 'shop', 'event', 'treasure', 'merchant'];
  const fixedLayerIds = new Set(Object.keys(MAP_CONFIG.fixedLayers).map(Number));

  for (let l = 1; l < layers; l++) {
    if (fixedLayerIds.has(l)) continue;

    const currentLayer = nodes.filter(n => n.depth === l);
    currentLayer.forEach(node => {
      const parentNodes = nodes.filter(n => n.depth === l - 1 && n.connectedTo.includes(node.id));
      if (parentNodes.length === 0) return;

      // \u89c4\u5219\uff1a\u540c\u7c7b\u578b\u975e\u6218\u6597\u8282\u70b9\u4e0d\u80fd\u8fde\u7eed
      if (nonCombatTypes.includes(node.type)) {
        const hasSameTypeParent = parentNodes.some(p => p.type === node.type);
        if (hasSameTypeParent) {
          node.type = getRandomNodeTypeExcluding(node.type, parentNodes.map(p => p.type));
        }
      }

      // \u89c4\u5219\uff1a\u6240\u6709\u7236\u8282\u70b9\u90fd\u662f\u975e\u6218\u6597\u65f6\uff0c\u5f53\u524d\u8282\u70b9\u5fc5\u987b\u662f\u6218\u6597

      // 规则：经济类节点不能连续（shop→merchant、merchant→treasure等）
      const economicTypes: NodeType[] = ['shop', 'merchant', 'treasure'];
      if (economicTypes.includes(node.type)) {
        const hasEconomicParent = parentNodes.some(p => economicTypes.includes(p.type));
        if (hasEconomicParent) {
          node.type = getRandomNodeTypeExcluding(node.type, [...economicTypes]);
        }
      }

      if (nonCombatTypes.includes(node.type)) {
        const allParentsNonCombat = parentNodes.every(p => nonCombatTypes.includes(p.type));
        if (allParentsNonCombat) {
          node.type = 'enemy';
        }
      }
    });
  }

  // \u53bb\u91cd\u8fde\u63a5

  // === Step 4: Economic node distribution fix ===
  // Early layers (depth 0-2): no economic nodes
  // Any layer: max 1 economic node
  const economicNodeTypes: NodeType[] = ['shop', 'merchant', 'treasure'];
  for (let l = 0; l < layers; l++) {
    if (fixedLayerIds.has(l)) continue;
    const layerNodes = nodes.filter(n => n.depth === l);

    // First 3 layers: no economic nodes
    if (l <= 2) {
      layerNodes.forEach(node => {
        if (economicNodeTypes.includes(node.type)) {
          node.type = Math.random() < 0.5 ? 'enemy' : 'event';
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
          node.type = Math.random() < 0.5 ? 'enemy' : 'event';
        }
      }
    });
  }

  nodes.forEach(n => {
    n.connectedTo = [...new Set(n.connectedTo)];
  });

  return nodes;
};

// \u83b7\u53d6\u8282\u70b9\u7684x\u5750\u6807\uff08\u4eceid\u89e3\u6790\uff09
export const getNodeX = (node: MapNode, allNodes: MapNode[]): number => {
  if ('x' in node) return (node as MapNodeExt).x;

  const layerNodes = allNodes.filter(n => n.depth === node.depth);
  const idx = layerNodes.findIndex(n => n.id === node.id);
  const count = layerNodes.length;
  return (idx + 1) / (count + 1) * 100;
};

function getRandomNodeTypeExcluding(exclude: NodeType, alsoExclude: NodeType[] = []): NodeType {
  const types: NodeType[] = ['enemy', 'elite', 'shop', 'event', 'treasure', 'merchant'];
  const excludeSet = new Set([exclude, ...alsoExclude]);
  const filtered = types.filter(t => !excludeSet.has(t));
  if (filtered.length === 0) return 'enemy';
  return filtered[Math.floor(Math.random() * filtered.length)];
}
