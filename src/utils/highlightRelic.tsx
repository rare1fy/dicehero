/**
 * highlightRelic.ts — 遗物描述富文本高亮
 *
 * 只高亮触发条件关键词（普通攻击、对子、三条等），用 var(--pixel-gold) 颜色突出显示。
 */
import React from 'react';

/** 遗物描述中需要高亮的触发条件关键词 */
const RELIC_TRIGGER_PATTERN = /普通攻击|对子|连对|三条|四条|五条|六条|葫芦|顺子|同元素|元素顺|元素葫芦|皇家元素顺|击杀|重Roll|重投|致命伤害|受到伤害/g;

/** 将遗物描述中的关键词包裹为金色高亮 <span> */
export function highlightRelicDesc(desc: string): React.ReactNode {
  if (!desc) return desc;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(RELIC_TRIGGER_PATTERN.source, 'g');
  while ((match = regex.exec(desc)) !== null) {
    if (match.index > lastIndex) {
      parts.push(desc.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} style={{ color: 'var(--pixel-gold)', fontWeight: 700 }}>
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < desc.length) {
    parts.push(desc.slice(lastIndex));
  }
  return parts.length > 1 ? <>{parts}</> : desc;
}

export { RELIC_TRIGGER_PATTERN };
