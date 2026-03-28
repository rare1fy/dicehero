import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Augment } from '../types';
import { PixelCoin } from './PixelIcons';
import { getAugmentIcon } from '../utils/helpers';
import { formatDescription } from '../utils/richText';

interface AugmentCardProps {
  aug: Augment;
  onAction: () => void;
  actionLabel: string;
  price?: number;
}

export const AugmentCard: React.FC<AugmentCardProps> = ({ aug, onAction, actionLabel, price }) => {
  const conditionText = useMemo(() => {
    switch (aug.condition) {
      case 'high_card': return '普通攻击';
      case 'pair': return '对子';
      case 'two_pair': return '连对';
      case 'n_of_a_kind': return 'N条';
      case 'full_house': return '葫芦';
      case 'straight': return '顺子';
      default: return '未知';
    }
  }, [aug.condition]);

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
      
      <h3 className="text-sm font-bold text-[var(--dungeon-text-bright)] mb-1 pixel-text-shadow">{aug.name}</h3>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="inline-block px-1.5 py-0.5 bg-[var(--dungeon-bg)] border border-[var(--dungeon-panel-border)] text-[9px] font-bold text-[var(--dungeon-text-dim)]" style={{borderRadius:'2px'}}>
          触发: {conditionText}
        </div>
        <div className="inline-block px-1.5 py-0.5 bg-[var(--pixel-purple-dark)] border border-[var(--pixel-purple)] text-[9px] font-bold text-[var(--pixel-purple-light)]" style={{borderRadius:'2px'}}>
          {aug.condition === 'high_card' ? '任意' : 
           aug.condition === 'pair' ? '2x' :
           aug.condition === 'two_pair' ? '2x+2x' :
           aug.condition === 'n_of_a_kind' ? 'Nx' :
           aug.condition === 'full_house' ? '3x+2x' :
           aug.condition === 'straight' ? 'Seq' :
           aug.condition === 'flush' ? 'Color' : 'Special'}
        </div>
      </div>
      
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
