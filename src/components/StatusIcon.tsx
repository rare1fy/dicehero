/**
 * StatusIcon — 状态徽章
 *
 * [2026-05-08 重构]
 *   - 视觉与 BuffTooltip 完全统一（彩色小徽章，不再深灰底框）
 *   - tooltip 通过 Portal 渲染到 body，避免被 PlayerHudView 的 overflow-y-hidden 裁切
 *   - 点击/悬停/触摸均可显示；点击外部或 3.5s 后自动关
 *
 * [2026-05-09]
 *   - buff（armor / strength / dodge）→ 绿色外框/背景
 *   - debuff（poison / burn / vulnerable / weak / slow / freeze）→ 红色外框/背景
 *   - icon 与 label/value 文字色保持 STATUS_INFO 原色，保证辨识度
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatDescription } from '../utils/richText';
import { StatusEffect } from '../types/game';
import { STATUS_INFO } from '../data/statusInfo';

interface StatusIconProps {
  status: StatusEffect;
  /** 保留参数以兼容旧调用点；当前 tooltip 位置由 Portal 根据 trigger bounds 自适应 */
  align?: 'left' | 'right' | 'center';
}

const VARIANT_BG: Record<'buff' | 'debuff', string> = {
  buff: 'rgba(74,222,128,0.15)',
  debuff: 'rgba(248,113,113,0.18)',
};
const VARIANT_BORDER: Record<'buff' | 'debuff', string> = {
  buff: 'rgba(74,222,128,0.55)',
  debuff: 'rgba(248,113,113,0.6)',
};

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const info = STATUS_INFO[status.type];
  const finalBg = VARIANT_BG[info.kind];
  const finalBorder = VARIANT_BORDER[info.kind];
  const [hover, setHover] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const visible = hover || pinned;

  React.useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 4, left: rect.left });
    }
  }, [visible]);

  React.useEffect(() => {
    if (!pinned) return;
    const onDocClick = (ev: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(ev.target as Node)) {
        setPinned(false);
      }
    };
    const autoClose = setTimeout(() => setPinned(false), 3500);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
      clearTimeout(autoClose);
    };
  }, [pinned]);

  const toggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setPinned(p => !p);
  };

  return (
    <div
      ref={triggerRef}
      className="relative flex items-center gap-0.5 cursor-help"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={toggle}
      onTouchEnd={(e) => { e.preventDefault(); toggle(e); }}
    >
      {/* 彩色小徽章 —— 外框/背景按 buff/debuff 分色，icon 与文字保留原色 */}
      <div
        className="flex items-center gap-0.5 px-1 py-0.5"
        style={{ background: finalBg, border: `1px solid ${finalBorder}`, borderRadius: '2px' }}
      >
        {info.icon}
        <span
          className="text-[9px] font-bold font-mono pixel-text-shadow"
          style={{ color: info.colorRgb }}
        >
          {status.value}
        </span>
      </div>

      {visible && pos && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed w-44 p-2 pixel-panel z-[9999]"
            style={{
              top: pos.top,
              left: Math.max(4, Math.min(pos.left, window.innerWidth - 180)),
              transform: 'translateY(-100%)',
            }}
            onClick={() => setPinned(false)}
          >
            <div
              className="text-[10px] font-bold mb-1 flex items-center gap-1 pixel-text-shadow"
              style={{ color: info.colorRgb }}
            >
              {info.icon} {info.label} {status.value}
            </div>
            <div className="text-[9px] text-[var(--dungeon-text-dim)] leading-relaxed">
              {formatDescription(info.description)}
            </div>
            <div className="absolute top-full left-4 border-[5px] border-transparent border-t-[var(--dungeon-panel-border)]" />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};