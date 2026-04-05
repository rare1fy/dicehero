
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnemyQuoteBubbleProps {
  text: string | null;
  category?: 'normal' | 'elite' | 'boss';
}

/**
 * 敌人聊天气泡组件
 * 像素风格，出现在敌人头顶，自动淡出
 */
export const EnemyQuoteBubble: React.FC<EnemyQuoteBubbleProps> = ({ text, category = 'normal' }) => {
  const borderColor =
    category === 'boss'
      ? 'var(--pixel-gold)'
      : category === 'elite'
      ? 'var(--pixel-purple)'
      : 'var(--dungeon-border)';

  const bgColor =
    category === 'boss'
      ? 'rgba(40,28,0,0.95)'
      : category === 'elite'
      ? 'rgba(30,10,40,0.95)'
      : 'rgba(8,11,14,0.92)';

  const textColor =
    category === 'boss'
      ? 'var(--pixel-gold-light)'
      : category === 'elite'
      ? 'var(--pixel-purple-light)'
      : 'var(--dungeon-text-bright)';

  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 6, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '6px',
            zIndex: 50,
            minWidth: '60px',
            maxWidth: '140px',
          }}
        >
          <div
            style={{
              background: bgColor,
              border: `2px solid ${borderColor}`,
              borderRadius: '3px',
              padding: '4px 6px',
              fontFamily: 'fusion-pixel, monospace',
              fontSize: '10px',
              lineHeight: '1.4',
              color: textColor,
              textAlign: 'center',
              wordBreak: 'break-all',
              boxShadow: `0 2px 8px rgba(0,0,0,0.6), 0 0 6px ${borderColor}40`,
              position: 'relative',
            }}
          >
            {text}
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                imageRendering: 'pixelated',
                display: 'block',
              }}
            >
              <polygon points="0,0 8,0 4,5" fill={bgColor} />
              <line x1="0" y1="0" x2="4" y2="5" stroke={borderColor} strokeWidth="2" />
              <line x1="8" y1="0" x2="4" y2="5" stroke={borderColor} strokeWidth="2" />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnemyQuoteBubble;
