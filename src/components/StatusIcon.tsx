import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusEffect } from '../types/game';
import { STATUS_INFO } from '../data/statusInfo';

interface StatusIconProps {
  status: StatusEffect;
  align?: 'left' | 'right' | 'center';
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, align = 'center' }) => {
  const info = STATUS_INFO[status.type];
  const [showTooltip, setShowTooltip] = useState(false);

  const alignClasses = {
    left: 'left-0 translate-x-0',
    right: 'right-0 left-auto translate-x-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  const arrowClasses = {
    left: 'left-4 translate-x-0',
    right: 'right-4 left-auto translate-x-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  return (
    <div 
      className="relative group flex items-center gap-0.5 cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      {/* 像素风状态徽章 */}
      <div className={`p-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] ${info.color} flex items-center justify-center`}
        style={{ borderRadius: '2px' }}
      >
        {info.icon}
      </div>
      <span className={`text-[10px] font-bold font-mono ${info.color} pixel-text-shadow`}>{status.value}</span>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`absolute bottom-full mb-2 w-40 p-2.5 pixel-panel z-[100] pointer-events-none max-w-[80vw] ${alignClasses[align]}`}
          >
            <div className={`text-[10px] font-bold mb-1.5 ${info.color} flex items-center gap-1.5 pixel-text-shadow`}>
              {info.icon} {info.label} {status.value}
            </div>
            <div className="text-[10px] text-[var(--dungeon-text-dim)] leading-relaxed">
              {info.description}
            </div>
            <div className={`absolute top-full ${arrowClasses[align]} border-[5px] border-transparent border-t-[var(--dungeon-panel-border)]`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
