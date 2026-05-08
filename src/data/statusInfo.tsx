import React from 'react';
import { PixelPoison, PixelFlame, PixelWind, PixelArrowUp, PixelArrowDown, PixelShield, PixelCrackedHeart } from '../components/PixelIcons';
import { StatusType } from '../types/game';

/**
 * STATUS_INFO — 所有状态的视觉定义
 * [2026-05-08] 新增 bgColor / borderColor / colorRgb，和 BuffTooltip 视觉统一，
 * StatusIcon 渲染时用这 3 个字段走彩色小徽章 + Portal tooltip。
 */
export const STATUS_INFO: Record<StatusType, {
  icon: React.ReactNode;
  color: string;          // Tailwind 文本色（label 用）
  colorRgb: string;       // 徽章数值文字的 inline rgb 颜色
  bgColor: string;        // 徽章背景（rgba）
  borderColor: string;    // 徽章边框（rgba）
  label: string;
  description: string;
}> = {
  poison:     { icon: <PixelPoison size={2} />, color: 'text-purple-400', colorRgb: 'rgb(192,132,252)', bgColor: 'rgba(160,80,255,0.15)', borderColor: 'rgba(160,80,255,0.5)', label: '中毒',   description: '每回合结束时受到 X 点伤害，随后层数减 1。' },
  burn:       { icon: <PixelFlame size={2} />,  color: 'text-orange-500', colorRgb: 'rgb(251,146,60)',  bgColor: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.5)',  label: '灼烧',   description: '回合结束时受到 X 点火焰伤害，随后灼烧消失。' },
  dodge:      { icon: <PixelWind size={2} />,   color: 'text-blue-300',   colorRgb: 'rgb(147,197,253)', bgColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.5)',  label: '闪避',   description: '下次受到攻击时，有概率完全回避。' },
  vulnerable: { icon: <PixelCrackedHeart size={2} />, color: 'text-orange-400', colorRgb: 'rgb(251,146,60)', bgColor: 'rgba(251,146,60,0.18)', borderColor: 'rgba(251,146,60,0.55)', label: '易伤', description: '受到伤害增加 25%×层数 +25%（1层+50% / 2层+75% / 3层+100%... 无上限）。每回合结束 -1 层。' },
  strength:   { icon: <PixelArrowUp size={2} />,  color: 'text-orange-400', colorRgb: 'rgb(251,146,60)', bgColor: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.5)',  label: '力量',   description: '造成的伤害增加 X 点。' },
  weak:       { icon: <PixelArrowDown size={2} />,color: 'text-zinc-400',   colorRgb: 'rgb(161,161,170)', bgColor: 'rgba(161,161,170,0.15)', borderColor: 'rgba(161,161,170,0.5)', label: '虚弱', description: '造成的伤害减少 25%。' },
  armor:      { icon: <PixelShield size={2} />, color: 'text-blue-400',   colorRgb: 'rgb(96,165,250)',  bgColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.5)',  label: '护甲',   description: '抵挡即将到来的伤害。' },
  slow:       { icon: <PixelWind size={2} />,   color: 'text-cyan-400',   colorRgb: 'rgb(34,211,238)',  bgColor: 'rgba(34,211,238,0.15)', borderColor: 'rgba(34,211,238,0.5)',  label: '减速',   description: '移动速度减半，远程伤害降低。' },
  freeze:     { icon: <PixelWind size={2} />,   color: 'text-blue-300',   colorRgb: 'rgb(147,197,253)', bgColor: 'rgba(147,197,253,0.15)', borderColor: 'rgba(147,197,253,0.5)', label: '冻结', description: '完全无法行动。' },
};
