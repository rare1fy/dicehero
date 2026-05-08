import React from 'react';

/**
 * renderFloatText — 浮动飘字的统一渲染格式化
 *
 * 规则（2026-05-08）：**icon 始终在"数值"之前**
 *   1) 没 icon：直接返回 text
 *   2) text 里有 ": "（遗物/效果名）：渲染成 "名字: <icon><数值>"
 *      例：「连击心得: +1」 + 🃏 → 「连击心得: 🃏+1」
 *   3) text 是纯数字（+N / -N / N）：渲染成 "<icon><数字>"
 *      例：「-5」 + ❤ → 「❤-5」（icon 在前，先给视觉线索）
 *
 * 由 PlayerHudView / EnemyStageView 统一调用，集中格式化。
 */
export function renderFloatText(text: string, icon?: React.ReactNode): React.ReactNode {
  if (!icon) return text;

  // 匹配遗物/效果名格式："名字: +X" 或 "名字：+X"
  const colonMatch = text.match(/^(.+?)[:：]\s*(.+)$/);
  if (colonMatch) {
    const label = colonMatch[1];
    const rest = colonMatch[2];
    return (
      <>
        <span>{label}: </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 2 }}>{icon}</span>
        <span>{rest}</span>
      </>
    );
  }

  // 纯数字飘字 → icon 在前，数字在后
  return (
    <>
      <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 2 }}>{icon}</span>
      <span>{text}</span>
    </>
  );
}
