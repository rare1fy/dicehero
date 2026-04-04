import React from 'react';
import { PixelPoison, PixelFlame, PixelWind, PixelArrowUp, PixelArrowDown, PixelShield } from '../components/PixelIcons';
import { StatusType } from '../types/game';

export const STATUS_INFO: Record<StatusType, { icon: React.ReactNode; color: string; label: string; description: string }> = {
  poison: { icon: <PixelPoison size={2} />, color: 'text-purple-400', label: '中毒', description: '每回合结束时受到 X 点伤害，随后层数减 1。' },
  burn: { icon: <PixelFlame size={2} />, color: 'text-orange-500', label: '灼烧', description: '回合结束时受到 X 点火焰伤害，随后灼烧消失。' },
  dodge: { icon: <PixelWind size={2} />, color: 'text-blue-300', label: '闪避', description: '下次受到攻击时，有概率完全回避。' },
  vulnerable: { icon: <PixelArrowUp size={2} />, color: 'text-red-400', label: '易伤', description: '受到的伤害增加 50%。' },
  strength: { icon: <PixelArrowUp size={2} />, color: 'text-orange-400', label: '力量', description: '造成的伤害增加 X 点。' },
  weak: { icon: <PixelArrowDown size={2} />, color: 'text-zinc-400', label: '虚弱', description: '造成的伤害减少 25%。' },
  armor: { icon: <PixelShield size={2} />, color: 'text-blue-400', label: '护甲', description: '抵挡即将到来的伤害。' },
  slow: { icon: <PixelWind size={2} />, color: 'text-cyan-400', label: '减速', description: '移动速度减半，远程伤害降低。' },
  freeze: { icon: <PixelWind size={2} />, color: 'text-blue-300', label: '冻结', description: '完全无法行动。' },
};
