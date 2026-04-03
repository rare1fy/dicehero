import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Augment } from '../types/game';
import { PixelCoin } from './PixelIcons';
import { getAugmentIcon } from '../utils/uiHelpers';
import { formatDescription } from '../utils/richText';

/** \u89E6\u53D1\u6761\u4EF6\u540D\u79F0 + \u989C\u8272 */
const CONDITION_INFO: Record<string, { label: string; color: string; bgColor: string; borderColor: string; abbr: string }> = {
  high_card:     { label: '\u666E\u901A\u653B\u51FB', color: '#d4a030', bgColor: 'rgba(212,160,48,0.15)', borderColor: 'rgba(212,160,48,0.5)',  abbr: '\u4EFB\u610F' },
  pair:          { label: '\u5BF9\u5B50',     color: '#60c8ff', bgColor: 'rgba(96,200,255,0.15)',  borderColor: 'rgba(96,200,255,0.5)',   abbr: '2x' },
  two_pair:      { label: '\u8FDE\u5BF9',     color: '#a080ff', bgColor: 'rgba(160,128,255,0.15)', borderColor: 'rgba(160,128,255,0.5)',  abbr: '2x+2x' },
  n_of_a_kind:   { label: 'N\u6761',     color: '#ff8040', bgColor: 'rgba(255,128,64,0.15)',  borderColor: 'rgba(255,128,64,0.5)',   abbr: 'Nx' },
  full_house:    { label: '\u8461\u8461',     color: '#ff60a0', bgColor: 'rgba(255,96,160,0.15)',  borderColor: 'rgba(255,96,160,0.5)',   abbr: '3x+2x' },
  straight:      { label: '\u987A\u5B50',     color: '#40e080', bgColor: 'rgba(64,224,128,0.15)',  borderColor: 'rgba(64,224,128,0.5)',   abbr: 'Seq' },
  same_element:  { label: '\u540C\u5143\u7D20',   color: '#e060d0', bgColor: 'rgba(224,96,208,0.15)', borderColor: 'rgba(224,96,208,0.5)',  abbr: 'Elem' },
  element_count: { label: '\u5143\u7D20\u8BA1\u6570', color: '#e0c040', bgColor: 'rgba(224,192,64,0.15)', borderColor: 'rgba(224,192,64,0.5)',  abbr: 'Multi' },
  always:        { label: '\u59CB\u7EC8\u89E6\u53D1', color: '#80e0c0', bgColor: 'rgba(128,224,192,0.15)', borderColor: 'rgba(128,224,192,0.5)', abbr: '\u2605' },
  passive:       { label: '\u88AB\u52A8\u6548\u679C', color: '#c0c0c0', bgColor: 'rgba(192,192,192,0.12)', borderColor: 'rgba(192,192,192,0.4)', abbr: '\u25CB' },
  flush:         { label: '\u540C\u82B1',     color: '#e0a040', bgColor: 'rgba(224,160,64,0.15)', borderColor: 'rgba(224,160,64,0.5)',   abbr: 'Color' },
};

const getConditionInfo = (condition: string) => CONDITION_INFO[condition] || { label: condition, color: '#888', bgColor: 'rgba(136,136,136,0.1)', borderColor: 'rgba(136,136,136,0.3)', abbr: '?' };

interface AugmentCardProps {
  aug: Augment;
  onAction: () => void;
  actionLabel: string;
  price?: number;
}

export const AugmentCard: React.FC<AugmentCardProps> = ({ aug, onAction, actionLabel, price }) => {
  const cond = useMemo(() => getConditionInfo(aug.condition), [aug.condition]);

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="pixel-panel p-3.5 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-2.5">
        <div className="w-9 h-9 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] flex items-center justify-center text-[var(--pixel-gold)]" style={{borderRadius:'2px'}}>
          {getAugmentIcon(aug.condition, 18)}
        </div>
        {price !== undefined && (
          <div className="flex items-center gap-1 bg-[var(--pixel-gold-dark)] px-2 py-1 border-2 border-[var(--pixel-gold)]" style={{borderRadius:'2px'}}>
            <PixelCoin size={2} />
            <span className="text-[10px] font-mono font-bold text-[var(--pixel-gold)]">{price}</span>
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-bold text-[var(--dungeon-text-bright)] mb-1.5 pixel-text-shadow">{aug.name}</h3>
      
      {/* \u89E6\u53D1\u6761\u4EF6 - \u7528\u9192\u76EE\u7684\u989C\u8272\u548C\u6392\u7248\u7A81\u51FA */}
      <div
        className="flex items-center gap-2 mb-2.5 px-2 py-1.5 border-l-[3px]"
        style={{
          backgroundColor: cond.bgColor,
          borderLeftColor: cond.color,
          borderRadius: '0 3px 3px 0',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ color: cond.color }}>{getAugmentIcon(aug.condition, 14)}</span>
          <span className="text-[10px] font-black tracking-wide" style={{ color: cond.color }}>
            {cond.label}
          </span>
        </div>
        <div
          className="px-1.5 py-0.5 text-[8px] font-bold"
          style={{
            backgroundColor: cond.bgColor,
            border: `1px solid ${cond.borderColor}`,
            color: cond.color,
            borderRadius: '2px',
          }}
        >
          {cond.abbr}
        </div>
      </div>
      
      {/* \u6548\u679C\u63CF\u8FF0 */}
      <p className="text-[10px] text-[var(--dungeon-text-dim)] leading-relaxed mb-3 min-h-[3em]">
        {formatDescription(aug.description)}
      </p>
      
      <button
        onClick={onAction}
        className="w-full py-2 pixel-btn pixel-btn-gold text-[10px] font-bold"
      >
        {actionLabel}
      </button>
    </motion.div>
  );
};

/** \u6218\u6597\u754C\u9762\u589E\u5E45\u6A21\u5757\u7684\u89E6\u53D1\u6761\u4EF6\u4FE1\u606F\u5BFC\u51FA */
export { CONDITION_INFO, getConditionInfo };
