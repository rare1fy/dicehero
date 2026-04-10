import React from 'react';

/**
 * 富文本描述格式化工具
 * 规则：每句话最多高亮2个关键词，统一用金色加粗
 */

// 所有可高亮的关键词/模式，按优先级排列
const KEYWORD_PATTERNS: RegExp[] = [
  // 数值类（最高优先）
  /[+\-]\s*\d+(?:\.\d+)?(?:\s*%)?/g,
  /[×x*]\s*\d+(?:\.\d+)?/g,
  /\d+(?:\.\d+)?\s*(?:点|层|颗|次|回合|格|个|枚)/g,
  /\d+\s*(?:HP|hp|生命值?)/g,
  /\d+\s*(?:金币|魂魄)/g,
  /\d+%/g,
  // 牌型名称
  /皇家元素顺|元素葫芦|元素顺|三连对|同元素|普通攻击|葫芦|连对|三条|四条|五条|六条|顺子|对子|6顺|5顺|4顺|3顺|AOE/g,
  // 状态效果
  /灼烧|中毒|虚弱|易伤|护甲|冻结|减速|净化|免疫|毒素|闪避|力量/g,
  // 触发条件 & 机制关键词
  /出牌时|击杀时|受到伤害时|回合结束时|回合开始时|战斗开始时|战斗结束时|致命伤害时|移动时|卖血[Rr]oll|卖血重投|重[Rr]oll|重投|重掷|被动|首次出牌|溢出伤害|每回合|每次出牌|坍缩|分裂|反噬|自毁|自伤|破甲|穿透|真实伤害|净化|严格递减|完全相同|恰好为|恰好等于|全部手牌|全部≤\d+点|全部同为奇数|全部同为偶数|与上次相反|点数之和|点数和|同一种元素|不构成任何牌型|≥\d+颗骰子|≤\d+/g,
  // 骰子名称
  /普通骰子|灌铅骰子|元素骰子|锋刃骰子|倍增骰子|分裂骰子|磁吸骰子|小丑骰子|混沌骰子|诅咒骰子|碎裂骰子/g,
  // 元素
  /火元素|冰元素|雷元素|毒元素|圣光/g,
];

const HL_CLASS = 'text-[var(--pixel-gold)] font-bold';

interface Marker {
  start: number;
  end: number;
}

export const formatDescription = (text: string): React.ReactNode => {
  if (!text) return null;

  // 收集所有匹配
  const allMarkers: Marker[] = [];
  for (const pattern of KEYWORD_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      allMarkers.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  // 按位置排序，去重（重叠的取先出现的）
  allMarkers.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const deduped: Marker[] = [];
  let lastEnd = 0;
  for (const m of allMarkers) {
    if (m.start >= lastEnd) {
      deduped.push(m);
      lastEnd = m.end;
    }
  }

  // 限制最多2个高亮
  const finalMarkers = deduped.slice(0, 2);

  if (finalMarkers.length === 0) return text;

  // 构建React节点
  let pos = 0;
  const result: React.ReactNode[] = [];
  for (let i = 0; i < finalMarkers.length; i++) {
    const m = finalMarkers[i];
    if (pos < m.start) {
      result.push(<span key={`t${i}`}>{text.slice(pos, m.start)}</span>);
    }
    result.push(<span key={`h${i}`} className={HL_CLASS}>{text.slice(m.start, m.end)}</span>);
    pos = m.end;
  }
  if (pos < text.length) {
    result.push(<span key="tail">{text.slice(pos)}</span>);
  }
  return <>{result}</>;
};
