import React from 'react';

/**
 * 富文本描述格式化工具
 * 将说明文本中的关键信息用彩色高亮显示
 */

// 匹配规则定义
interface HighlightRule {
  pattern: RegExp;
  className: string;
}

const HIGHLIGHT_RULES: HighlightRule[] = [
  // 数字+单位（如 "5 点护甲"、"20 HP"、"-15 HP"、"+3"、"x1.5"、"* 2.2"）
  { pattern: /([+\-×x*]\s*\d+(?:\.\d+)?(?:\s*%)?)/g, className: 'text-[var(--pixel-gold)] font-bold' },
  // 纯数字+单位词组合（如 "3 层灼烧"、"10 点伤害"、"50 金币"）
  { pattern: /(\d+(?:\.\d+)?)\s*(点|层|颗|次|回合|格|个|枚)/g, className: '__NUM_UNIT__' },
  // HP相关
  { pattern: /(\d+)\s*(HP|hp|生命值?|生命力?)/g, className: '__NUM_UNIT_HP__' },
  // 金币
  { pattern: /(\d+)\s*(金币|魂魄)/g, className: '__NUM_UNIT_GOLD__' },
  // 牌型名称
  { pattern: /(普通攻击|对子|连对|三条|顺子|同花|葫芦|四条|五条|六条|同花顺|同花葫芦|皇家同花顺)/g, className: 'text-[var(--pixel-cyan)] font-bold' },
  // 状态效果
  { pattern: /(灼烧|中毒|虚弱|易伤|护甲|闪避|力量)/g, className: 'text-[var(--pixel-orange)] font-bold' },
  // 骰子颜色
  { pattern: /(红色|蓝色|紫色|金色)骰子/g, className: '__DICE_COLOR__' },
  // 关键动作词
  { pattern: /(伤害|穿透|回复|获得|附加|升级|强化)/g, className: 'text-[var(--pixel-green-light)] font-semibold' },
];

/**
 * 将描述文本转换为带高亮的React元素
 */
export const formatDescription = (text: string): React.ReactNode => {
  if (!text) return null;

  // 使用一个简化的方法：逐步替换为标记，最后渲染
  const segments: { text: string; className?: string }[] = [];
  
  // 先用正则把所有需要高亮的部分标记出来
  interface Marker {
    start: number;
    end: number;
    className: string;
  }
  
  const markers: Marker[] = [];
  
  // 规则1：数字+单位（"3 层"、"10 点"）
  const numUnitRegex = /(\d+(?:\.\d+)?)\s*(点|层|颗|次|回合|格|个|枚)/g;
  let match: RegExpExecArray | null;
  while ((match = numUnitRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-num' });
  }
  
  // 规则2：HP相关
  const hpRegex = /(\d+)\s*(HP|hp|生命值?|生命力?)/g;
  while ((match = hpRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-hp' });
  }
  
  // 规则3：金币
  const goldRegex = /(\d+)\s*(金币|魂魄)/g;
  while ((match = goldRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-gold' });
  }

  // 规则4：运算符+数字（"+5"、"x1.5"、"* 2.0"、"-15"）
  const opNumRegex = /([+\-]\s*\d+(?:\.\d+)?(?:\s*%)?|[×x*]\s*\d+(?:\.\d+)?)/g;
  while ((match = opNumRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-op' });
  }
  
  // 规则5：牌型名称
  const handRegex = /(普通攻击|对子|连对|三条|顺子|同花顺|同花葫芦|皇家同花顺|同花|葫芦|四条|五条|六条)/g;
  while ((match = handRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-hand' });
  }
  
  // 规则6：状态效果
  const statusRegex = /(灼烧|中毒|虚弱|易伤|护甲|闪避|力量)/g;
  while ((match = statusRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-status' });
  }

  // 规则7：骰子颜色
  const colorRegex = /(红色|蓝色|紫色|金色)/g;
  while ((match = colorRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-color' });
  }

  // 规则8：括号内的公式
  const formulaRegex = /\([^)]*[+×x*][^)]*\)/g;
  while ((match = formulaRegex.exec(text)) !== null) {
    markers.push({ start: match.index, end: match.index + match[0].length, className: 'hl-formula' });
  }

  // 去重：如果多个marker重叠，优先级高的（先出现的规则）覆盖
  markers.sort((a, b) => a.start - b.start || b.end - a.end);
  const finalMarkers: Marker[] = [];
  let lastEnd = 0;
  for (const m of markers) {
    if (m.start >= lastEnd) {
      finalMarkers.push(m);
      lastEnd = m.end;
    }
  }

  // 构建segments
  let pos = 0;
  const result: React.ReactNode[] = [];
  
  for (let i = 0; i < finalMarkers.length; i++) {
    const m = finalMarkers[i];
    
    // 未高亮的文本
    if (pos < m.start) {
      result.push(<span key={`t${i}`}>{text.slice(pos, m.start)}</span>);
    }
    
    // 高亮文本
    const hlText = text.slice(m.start, m.end);
    const cls = getClassName(m.className);
    result.push(<span key={`h${i}`} className={cls}>{hlText}</span>);
    
    pos = m.end;
  }
  
  // 剩余文本
  if (pos < text.length) {
    result.push(<span key="tail">{text.slice(pos)}</span>);
  }
  
  return <>{result}</>;
};

function getClassName(type: string): string {
  switch (type) {
    case 'hl-num': return 'text-[var(--pixel-gold)] font-bold';
    case 'hl-hp': return 'text-[var(--pixel-red)] font-bold';
    case 'hl-gold': return 'text-[var(--pixel-gold)] font-bold';
    case 'hl-op': return 'text-[var(--pixel-gold)] font-bold';
    case 'hl-hand': return 'text-[var(--pixel-cyan)] font-bold';
    case 'hl-status': return 'text-[var(--pixel-orange)] font-bold';
    case 'hl-color': return 'font-bold';
    case 'hl-formula': return 'text-[var(--dungeon-text-bright)] font-mono text-[0.9em]';
    default: return '';
  }
}
