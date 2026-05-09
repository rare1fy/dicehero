/**
 * BuffTooltip — 自定义buff状态图标，支持点击显示tooltip说明（Portal渲染避免overflow裁切）
 *
 * [2026-05-09] 新增 variant：buff 强制绿色外框/背景，debuff 强制红色，与同位置的状态徽章视觉拉开。
 *   不传 variant 时沿用 call-site 自定义 bgColor/borderColor（向后兼容）。
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'motion/react';

const VARIANT_BG: Record<'buff' | 'debuff', string> = {
  buff: 'rgba(74,222,128,0.15)',
  debuff: 'rgba(248,113,113,0.18)',
};
const VARIANT_BORDER: Record<'buff' | 'debuff', string> = {
  buff: 'rgba(74,222,128,0.55)',
  debuff: 'rgba(248,113,113,0.6)',
};

const BuffTooltip: React.FC<{
  label: string; icon: React.ReactNode; color: string;
  bgColor: string; borderColor: string; title: string; desc: string;
  /** 视觉变体：buff 强制绿色边框/背景，debuff 强制红色。不传则沿用 bgColor/borderColor */
  variant?: 'buff' | 'debuff';
}> = ({ label, icon, color, bgColor, borderColor, title, desc, variant }) => {
  const finalBg = variant ? VARIANT_BG[variant] : bgColor;
  const finalBorder = variant ? VARIANT_BORDER[variant] : borderColor;
  const [show, setShow] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{top: number; left: number} | null>(null);

  React.useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 4, left: rect.left });
    }
  }, [show]);

  return (
    <div className="relative" ref={triggerRef} onClick={() => setShow(!show)} onMouseLeave={() => setShow(false)}>
      <div className="flex items-center gap-0.5 px-1 py-0.5 cursor-help" style={{ background: finalBg, border: `1px solid ${finalBorder}`, borderRadius: '2px' }}>
        {icon}
        <span className="text-[9px] font-bold font-mono pixel-text-shadow" style={{ color }}>{label}</span>
      </div>
      {show && pos && ReactDOM.createPortal(
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          className="fixed w-44 p-2 pixel-panel z-[9999]"
          style={{ top: pos.top, left: Math.max(4, Math.min(pos.left, window.innerWidth - 180)), transform: 'translateY(-100%)' }}
          onClick={() => setShow(false)}
        >
          <div className="text-[10px] font-bold mb-1 flex items-center gap-1 pixel-text-shadow" style={{ color }}>
            {icon} {title}
          </div>
          <div className="text-[9px] text-[var(--dungeon-text-dim)] leading-relaxed">{desc}</div>
          <div className="absolute top-full left-4 border-[5px] border-transparent border-t-[var(--dungeon-panel-border)]" />
        </motion.div>,
        document.body
      )}
    </div>
  );
};

export default BuffTooltip;