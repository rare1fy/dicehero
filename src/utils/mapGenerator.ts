import { MapNode, NodeType } from '../types/game';
import { MAP_CONFIG } from '../config';

/**
 * 杀戮尖塔风格地图生成器
 * - 15层，每层2-4个节点（随机）
 * - 节点间有分支路径连接
 * - 固定层：第0层=战斗，第6层=休息，第7层=中层Boss，第13层=休息，第14层=最终Boss
 * - 路径保证每个节点可达且有分支选择
 * - 每个节点有x坐标用于地图绘制
 */

export interface MapNodeExt extends MapNode {
  x: number; // 0-100 的水平百分比位置
}

export const generateMap = (): MapNode[] => {
  const nodes: MapNodeExt[] = [];
  const layers = MAP_CONFIG.totalLayers;
  
  // 每层节点数量配置（更有变化）
  const getLayerNodeCount = (depth: number): number => {
    const fixed = MAP_CONFIG.fixedLayers[depth];
    if (fixed) return fixed.count;
    const [min, max] = MAP_CONFIG.randomLayerNodeRange;
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // 生成所有节点
  for (let l = 0; l < layers; l++) {
    const count = getLayerNodeCount(l);
    
    // 计算x坐标 — 均匀分布 + 随机偏移
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      const baseX = (i + 1) / (count + 1) * 100;
      const jitter = count > 1 ? (Math.random() - 0.5) * (60 / count) : 0;
      positions.push(Math.max(10, Math.min(90, baseX + jitter)));
    }
    positions.sort((a, b) => a - b);

    for (let i = 0; i < count; i++) {
      const id = `node-${l}-${i}`;
      let type: NodeType = 'enemy';
      
      const fixed = MAP_CONFIG.fixedLayers[l];
      if (fixed && fixed.type) {
        type = fixed.type as NodeType;
      } else if (l === 0) {
        type = 'enemy';
      } else if (!fixed) {
        type = getRandomNodeType();
      }

      nodes.push({ 
        id, type, depth: l, 
        connectedTo: [], completed: false,
        x: positions[i]
      });
    }
  }

  // 生成连接关系 — 基于位置的自然连接
  for (let l = 0; l < layers - 1; l++) {
    const currentLayer = nodes.filter(n => n.depth === l);
    const nextLayer = nodes.filter(n => n.depth === l + 1);

    if (nextLayer.length === 1) {
      // 下一层只有1个节点（Boss），所有当前层节点都连向它
      currentLayer.forEach(node => {
        node.connectedTo.push(nextLayer[0].id);
      });
    } else if (currentLayer.length === 1) {
      // 当前层只有1个节点，连向下一层所有节点
      nextLayer.forEach(next => {
        currentLayer[0].connectedTo.push(next.id);
      });
    } else {
      // 基于位置距离的连接
      currentLayer.forEach((node) => {
        // 找到最近的下一层节点
        const distances = nextLayer.map((next, idx) => ({
          idx,
          dist: Math.abs(node.x - next.x),
          id: next.id
        })).sort((a, b) => a.dist - b.dist);

        // 至少连接最近的1个
        const connectCount = Math.random() < 0.4 ? 2 : 1;
        const targets = new Set<string>();
        
        for (let c = 0; c < Math.min(connectCount, distances.length); c++) {
          targets.add(distances[c].id);
        }
        
        // 30%概率额外连接一个
        if (distances.length > 1 && Math.random() < 0.3) {
          const extra = distances[Math.min(1, distances.length - 1)];
          targets.add(extra.id);
        }

        targets.forEach(targetId => {
          if (!node.connectedTo.includes(targetId)) {
            node.connectedTo.push(targetId);
          }
        });
      });
    }

    // 确保每个下一层节点至少有一个父节点
    nextLayer.forEach((next) => {
      const hasParent = currentLayer.some(p => p.connectedTo.includes(next.id));
      if (!hasParent) {
        // 找最近的父节点
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

  // 路径感知修正 — 防止连续相同类型非战斗节点
  for (let l = 2; l < layers; l++) {
    const currentLayer = nodes.filter(n => n.depth === l);
    
    currentLayer.forEach(node => {
      const fixedLayerIds = Object.keys(MAP_CONFIG.fixedLayers).map(Number);
      if (fixedLayerIds.includes(l)) return;
      
      const parentNodes = nodes.filter(n => n.depth === l - 1 && n.connectedTo.includes(node.id));
      
      for (const parent of parentNodes) {
        if (parent.type === node.type && node.type !== 'enemy') {
          node.type = getRandomNodeTypeExcluding(node.type);
          break;
        }
      }
    });
  }

  // 确保路径多样性 — 避免连续2个篝火
  for (let l = 1; l < layers; l++) {
    const fixedIds = Object.keys(MAP_CONFIG.fixedLayers).map(Number);
    if (fixedIds.includes(l)) continue;
    
    const currentLayer = nodes.filter(n => n.depth === l);
    currentLayer.forEach(node => {
      if (node.type !== 'campfire') return;
      
      const parentNodes = nodes.filter(n => n.depth === l - 1 && n.connectedTo.includes(node.id));
      const allParentsCampfire = parentNodes.length > 0 && parentNodes.every(p => p.type === 'campfire');
      
      if (allParentsCampfire) {
        node.type = getRandomNodeTypeExcluding('campfire');
      }
    });
  }

  // 去重连接
  nodes.forEach(n => {
    n.connectedTo = [...new Set(n.connectedTo)];
  });

  return nodes;
};

// 获取节点的x坐标（从id解析）
export const getNodeX = (node: MapNode, allNodes: MapNode[]): number => {
  const layerNodes = allNodes.filter(n => n.depth === node.depth);
  const idx = layerNodes.findIndex(n => n.id === node.id);
  const count = layerNodes.length;
  
  // 如果节点有存储的x值，使用它
  if ('x' in node) return (node as MapNodeExt).x;
  
  // 否则均匀分布
  return (idx + 1) / (count + 1) * 100;
};

function getRandomNodeType(): NodeType {
  const rand = Math.random();
  for (const { type, cumWeight } of MAP_CONFIG.nodeTypeWeights) {
    if (rand < cumWeight) return type;
  }
  return 'enemy';
}

function getRandomNodeTypeExcluding(exclude: NodeType): NodeType {
  const types: NodeType[] = ['enemy', 'elite', 'campfire', 'shop', 'event'];
  const filtered = types.filter(t => t !== exclude);
  return filtered[Math.floor(Math.random() * filtered.length)];
}
