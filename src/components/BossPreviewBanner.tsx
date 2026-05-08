/**
 * BossPreviewBanner.tsx
 * 触发时机：地图上，当前已完成节点 depth === maxDepth-1 且本章 Boss 未预告过。
 * 演出 1.7s 不可跳过：暗红遮罩淡入 -> 扫光条夹入 -> Boss剪影+字幕弹出 -> fade out -> onDone()
 * 美术约束：禁emoji/外部图片/新字体，Boss精灵用PixelSprite加深红filter做剪影区别于登场真身。
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PixelSprite } from './PixelSprite';

interface BossPreviewBannerProps {
  visible: boolean;
  bossName: string;
  chapter: number;
  onDone: () => void;
}

const CHAPTER_COLORS: Record<number, { primary: string; glow: string }> = {
  1: { primary: '#e04040', glow: 'rgba(224,60,60,0.7)' },
  2: { primary: '#5888d8', glow: 'rgba(88,136,216,0.7)' },
  3: { primary: '#e89030', glow: 'rgba(232,144,48,0.7)' },
  4: { primary: '#9848d8', glow: 'rgba(152,72,216,0.7)' },
  5: { primary: '#c8b840', glow: 'rgba(200,184,64,0.7)' },
};

export const BossPreviewBanner: React.FC<BossPreviewBannerProps> = ({
  visible, bossName, chapter, onDone,
}) => {
  const colors = CHAPTER_COLORS[chapter] || CHAPTER_COLORS[1];
  const [showContent, setShowContent] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMounted(false);
      setShowContent(false);
      setFadeOut(false);
      return;
    }
    setMounted(true);
    setShowContent(false);
    setFadeOut(false);
    const t1 = window.setTimeout(() => setShowContent(true), 300);
    const t2 = window.setTimeout(() => setFadeOut(true), 1200);
    const t3 = window.setTimeout(() => { setMounted(false); onDone(); }, 1750);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [visible]);

  if (!mounted) return null;

  const bgStyle = {
    background: 'radial-gradient(ellipse at center, rgba(60,4,4,0.93) 0%, rgba(2,0,0,0.98) 70%)',
  } as React.CSSProperties;

  const scanTop = {
    top: '37%',
    background: `linear-gradient(90deg,transparent 0%,${colors.primary}80 25%,${colors.primary} 50%,${colors.primary}80 75%,transparent 100%)`,
    boxShadow: `0 0 14px ${colors.glow}`,
    transformOrigin: 'center' as const,
  };
  const scanBot = { ...scanTop, top: '63%' };

  const silhouetteStyle = {
    filter: `brightness(0.12) sepia(1) saturate(10) hue-rotate(-10deg) drop-shadow(0 0 18px ${colors.primary})`,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[350] flex flex-col items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: fadeOut ? 0.55 : 0.2, ease: 'easeInOut' }}
      style={bgStyle}
    >
      <motion.div
        className="absolute left-0 right-0 h-[2px] pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={showContent ? { scaleX: 1, opacity: 0.9 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={scanTop}
      />
      <motion.div
        className="absolute left-0 right-0 h-[2px] pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={showContent ? { scaleX: 1, opacity: 0.9 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={scanBot}
      />

      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ y: 36, opacity: 0 }}
        animate={showContent ? { y: 0, opacity: 1 } : { y: 36, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'backOut' }}
      >
        <div style={silhouetteStyle}>
          <PixelSprite name={bossName} size={6} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="font-black tracking-[0.28em] text-[9px]"
            style={{ fontFamily: 'fusion-pixel, monospace', color: colors.primary, textShadow: `0 0 8px ${colors.glow}` }}
          >
            &#9650; 前方敌人 &#9650;
          </span>
          <span
            className="font-black text-[18px]"
            style={{ fontFamily: 'fusion-pixel, monospace', color: '#fff8f0', textShadow: `0 0 12px ${colors.glow}, 2px 2px 0 #000` }}
          >
            {bossName}
          </span>
          <span
            className="font-bold text-[9px] tracking-[0.3em] opacity-70"
            style={{ fontFamily: 'fusion-pixel, monospace', color: colors.primary }}
          >
            即将苏醒
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
