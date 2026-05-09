/**
 * enemyLineRenderer.tsx — 敌人详情面板的关键词富文本渲染
 *
 * 输入 describeEnemy().sections.lines 中的纯文本 line，
 * 切块高亮：行动类型标签 [攻/守/技/法]、数字、百分比、×N、层数、【技能名】。
 *
 * 用于 EnemyBestiary 弹窗 与 PlayerHudView 战斗中敌人详情弹窗。
 */
import React from 'react';

// 动作类型 tag 对应的色板（与敌人职业色呼应）
const TAG_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  '[攻]': { bg: 'rgba(180,40,40,0.22)',  border: 'var(--pixel-red)',    color: 'var(--pixel-red-light)' },
  '[守]': { bg: 'rgba(40,80,160,0.22)',  border: 'var(--pixel-blue)',   color: 'var(--pixel-blue-light)' },
  '[技]': { bg: 'rgba(140,60,180,0.22)', border: 'var(--pixel-purple)', color: '#d4a8ff' },
  '[法]': { bg: 'rgba(140,60,180,0.22)', border: 'var(--pixel-purple)', color: '#d4a8ff' },
};

// 行首特殊前缀
const PREFIX_ICON: Record<string, string> = {
  '◆': '◆',
  '·': '·',
  '└': '└',
  '  └': '└',
};

function ActionTag({ tag }: { tag: string }) {
  const st = TAG_STYLE[tag];
  if (!st) return <span>{tag}</span>;
  return (
    <span
      className="inline-block font-bold text-[8px] px-1 py-0 mr-1 align-middle"
      style={{
        borderRadius: '2px',
        backgroundColor: st.bg,
        border: `1px solid ${st.border}`,
        color: st.color,
        lineHeight: '1.2',
      }}
    >
      {tag.slice(1, -1)}
    </span>
  );
}

/**
 * 把文本段按 regex 切块并逐段高亮：
 *   【xxx】       → 紫色强调
 *   +N / -N      → 红/绿
 *   N% / ×N      → 金色粗体
 *   HP           → 红色
 *   护甲         → 蓝色
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [''];
  // 综合正则：一次切出所有候选 token
  const regex = /(【[^】]+】|×\d+(?:\.\d+)?|\+\d+(?:\.\d+)?%?|-\d+(?:\.\d+)?%?|\d+(?:\.\d+)?%|HP|护甲|冻结|虚弱|易伤|灼烧|毒素|中毒|普攻|追击|复仇|血怒|圣怒)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const t = match[0];
    if (t.startsWith('【')) {
      parts.push(<span key={`k${key++}`} className="font-bold" style={{ color: '#d4a8ff' }}>{t}</span>);
    } else if (t.startsWith('×')) {
      parts.push(<span key={`k${key++}`} className="font-bold text-[var(--pixel-gold-light)]">{t}</span>);
    } else if (t.startsWith('+')) {
      const color = t.endsWith('%') ? 'text-[var(--pixel-green-light)]' : 'text-[var(--pixel-gold-light)]';
      parts.push(<span key={`k${key++}`} className={`font-bold ${color}`}>{t}</span>);
    } else if (t.startsWith('-')) {
      parts.push(<span key={`k${key++}`} className="font-bold text-[var(--pixel-red-light)]">{t}</span>);
    } else if (t.endsWith('%')) {
      parts.push(<span key={`k${key++}`} className="font-bold text-[var(--pixel-gold-light)]">{t}</span>);
    } else if (t === 'HP') {
      parts.push(<span key={`k${key++}`} className="font-bold text-[var(--pixel-red-light)]">{t}</span>);
    } else if (t === '护甲') {
      parts.push(<span key={`k${key++}`} className="font-bold text-[var(--pixel-blue-light)]">{t}</span>);
    } else if (t === '冻结' || t === '虚弱' || t === '易伤') {
      parts.push(<span key={`k${key++}`} className="font-bold" style={{ color: '#a0d8ff' }}>{t}</span>);
    } else if (t === '灼烧') {
      parts.push(<span key={`k${key++}`} className="font-bold" style={{ color: '#ffa060' }}>{t}</span>);
    } else if (t === '毒素' || t === '中毒') {
      parts.push(<span key={`k${key++}`} className="font-bold" style={{ color: '#b0e860' }}>{t}</span>);
    } else if (t === '复仇' || t === '血怒') {
      parts.push(<span key={`k${key++}`} className="font-bold text-[var(--pixel-red-light)]">{t}</span>);
    } else if (t === '圣怒') {
      parts.push(<span key={`k${key++}`} className="font-bold text-[var(--pixel-gold-light)]">{t}</span>);
    } else {
      parts.push(<span key={`k${key++}`} className="font-bold">{t}</span>);
    }
    lastIdx = match.index + t.length;
  }
  if (lastIdx < text.length) parts.push(text.substring(lastIdx));
  return parts;
}

/**
 * 渲染一行：识别开头的动作 tag 或 bullet 前缀，再高亮数字/关键词。
 */
export function renderEnemyLine(line: string, key?: React.Key): React.ReactNode {
  // 阶段标题 ◆ 开头
  if (line.startsWith('◆')) {
    return (
      <div key={key} className="text-[10px] font-bold text-[var(--pixel-gold-light)] mt-1 mb-0.5 tracking-wider">
        {line}
      </div>
    );
  }
  // 循环尾巴 └
  const trimmed = line.trimStart();
  if (trimmed.startsWith('└')) {
    return (
      <div key={key} className="text-[9px] text-[var(--dungeon-text-dim)] italic pl-3">
        {trimmed}
      </div>
    );
  }
  // 识别一到多个动作 tag（可能多步循环：[攻] ... → [守] ...）
  const tagRegex = /\[(?:攻|守|技|法)\]/g;
  if (tagRegex.test(line)) {
    // 重置 regex lastIndex
    tagRegex.lastIndex = 0;
    const chunks: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let i = 0;
    while ((match = tagRegex.exec(line)) !== null) {
      // 先把 tag 之前的文本块输出（带高亮）
      if (match.index > lastIdx) {
        chunks.push(<React.Fragment key={`t${i++}`}>{renderInline(line.substring(lastIdx, match.index))}</React.Fragment>);
      }
      chunks.push(<ActionTag key={`a${i++}`} tag={match[0]} />);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < line.length) {
      chunks.push(<React.Fragment key={`t${i++}`}>{renderInline(line.substring(lastIdx))}</React.Fragment>);
    }
    return (
      <div key={key} className="text-[10px] text-[var(--dungeon-text)] leading-relaxed">
        {chunks}
      </div>
    );
  }
  // bullet 特性行
  if (trimmed.startsWith('·')) {
    return (
      <div key={key} className="text-[10px] text-[var(--dungeon-text)] leading-relaxed pl-1">
        <span className="text-[var(--pixel-gold)] mr-0.5">·</span>
        {renderInline(trimmed.slice(1).trim())}
      </div>
    );
  }
  // 默认：仅关键词高亮
  return (
    <div key={key} className="text-[10px] text-[var(--dungeon-text)] leading-relaxed">
      {renderInline(line)}
    </div>
  );
}
