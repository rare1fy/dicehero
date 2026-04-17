/**
 * BuffTooltip — 自定义buff状态图标，支持点击显示tooltip说明（Portal渲染避免overflow裁切）
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'motion/react';

const BuffTooltip: React.FC<{
  label: string; icon: React.ReactNode; color: string;
  bgColor: string; borderColor: string; title: string; desc: string;
}> = ({ label, icon, color, bgColor, borderColor, title, desc }) => {
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
      <div className="flex items-center gap-0.5 px-1 py-0.5 cursor-help" style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '2px' }}>
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
