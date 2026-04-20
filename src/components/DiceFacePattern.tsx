import React from 'react';
import { PATTERN_MAP } from './dicePatternData';

/**
 * DiceFacePattern - 每颗职业骰子的独特像素图案
 * 作为半透明底层铺在骰子上，提供形状辨识度
 * viewBox 统一 0 0 24 24，渲染尺寸由父容器控制
 *
 * 图案数据已拆分至 dicePatternData.tsx (ARCH-13)
 */

/**
 * 骰子底层图案组件
 * 半透明显示在骰子内部底层，数字叠在最上方
 */
export const DiceFacePattern: React.FC<{ diceDefId: string }> = React.memo(({ diceDefId }) => {
  const Pattern = PATTERN_MAP[diceDefId];
  if (!Pattern) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ opacity: 0.30, padding: '4px' }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <Pattern />
      </div>
    </div>
  );
});

DiceFacePattern.displayName = 'DiceFacePattern';

export default DiceFacePattern;
