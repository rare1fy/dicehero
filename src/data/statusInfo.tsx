import React from 'react';
import { PixelPoison, PixelFlame, PixelWind, PixelArrowUp, PixelArrowDown, PixelShield, PixelCrackedHeart } from '../components/PixelIcons';
import { StatusType } from '../types/game';

/**
 * STATUS_INFO — 所有状态的视觉定义
 * [2026-05-08] 新增 bgColor / borderColor / colorRgb，和 BuffTooltip 视觉统一，
 * StatusIcon 渲染时用这 3 个字段走彩色小徽章 + Portal tooltip。
 * [2026-05-09] 新增 kind ('buff' | 'debuff')：StatusIcon 据此把外框/背景统一成绿/红色，
 *   让玩家在同一区域里一眼区分 buff vs debuff。原来的 bgColor/borderColor 在 kind 模式下会被覆盖，
 *   仅在没有 kind（理论上不会出现）时作为 fallback。
 */
export const STATUS_INFO: Record<StatusType, {
  icon: React.ReactNode;
  color: string;          // Tailwind 文本色（label 用）
  colorRgb: string;       // 徽章数值文字的 inline rgb 颜色
  bgColor: string;        // 徽章背景（rgba），kind 模式下被覆盖
  borderColor: string;    // 徽章边框（rgba），kind 模式下被覆盖
  label: string;
  description: string;
  kind: 'buff' | 'debuff'; // 视觉变体归类
}> = {
  poison:     { icon: <PixelPoison size={2} />, color: 'text-purple-400', colorRgb: 'rgb(192,132,252)', bgColor: 'rgba(160,80,255,0.15)', borderColor: 'rgba(160,80,255,0.5)', label: '中毒',   description: '每回合结束时受到 X 点伤害，随后层数减 1。', kind: 'debuff' },
  burn:       { icon: <PixelFlame size={2} />,  color: 'text-orange-500', colorRgb: 'rgb(251,146,60)',  bgColor: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.5)',  label: '灼烧',   description: '回合结束时受到 X 点火焰伤害，随后灼烧消失。', kind: 'debuff' },
  dodge:      { icon: <PixelWind size={2} />,   color: 'text-blue-300',   colorRgb: 'rgb(147,197,253)', bgColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.5)',  label: '闪避',   description: '下次受到攻击时，有概率完全回避。', kind: 'buff' },
  vulnerable: { icon: <PixelCrackedHeart size={2} />, color: 'text-orange-400', colorRgb: 'rgb(251,146,60)', bgColor: 'rgba(251,146,60,0.18)', borderColor: 'rgba(251,146,60,0.55)', label: '易伤', description: '受到的伤害翻倍（×2）。每回合结束 -1 层，层数归零时消失。可被净化。', kind: 'debuff' },
  strength:   { icon: <PixelArrowUp size={2} />,  color: 'text-orange-400', colorRgb: 'rgb(251,146,60)', bgColor: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.5)',  label: '力量',   description: '造成的伤害增加 X 点。', kind: 'buff' },
  weak:       { icon: <PixelArrowDown size={2} />,color: 'text-zinc-400',   colorRgb: 'rgb(161,161,170)', bgColor: 'rgba(161,161,170,0.15)', borderColor: 'rgba(161,161,170,0.5)', label: '虚弱', description: '造成的伤害减少 25%。', kind: 'debuff' },
  armor:      { icon: <PixelShield size={2} />, color: 'text-blue-400',   colorRgb: 'rgb(96,165,250)',  bgColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.5)',  label: '护甲',   description: '抵挡即将到来的伤害。', kind: 'buff' },
  slow:       { icon: <PixelWind size={2} />,   color: 'text-cyan-400',   colorRgb: 'rgb(34,211,238)',  bgColor: 'rgba(34,211,238,0.15)', borderColor: 'rgba(34,211,238,0.5)',  label: '减速',   description: '移动速度减半，远程伤害降低。', kind: 'debuff' },
  freeze:     { icon: <PixelWind size={2} />,   color: 'text-blue-300',   colorRgb: 'rgb(147,197,253)', bgColor: 'rgba(147,197,253,0.15)', borderColor: 'rgba(147,197,253,0.5)', label: '冻结', description: '完全无法行动。', kind: 'debuff' },
};