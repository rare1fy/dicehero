import React from 'react';
import { 
  PixelZap, PixelPair, PixelLayers, PixelTriangle, PixelArrowRight, 
  PixelDroplet, PixelHouse, PixelSquare, PixelStar, PixelTrophy, 
  PixelCrown, PixelWaves 
} from '../components/PixelIcons';
import { HandTypeDef } from '../types';

export const HAND_TYPES: HandTypeDef[] = [
  { id: 'high_card', name: '普通攻击', icon: <PixelZap size={2} />, base: 0, mult: 1, description: '任意单颗骰子。伤害 = 骰子点数。' },
  { id: 'pair', name: '对子', icon: <PixelPair size={2} />, base: 5, mult: 1.6, description: '2 颗点数相同的骰子。伤害 = (5 + 点数) * 1.6，获得 5 点护甲。' },
  { id: 'two_pair', name: '连对', icon: <PixelLayers size={2} />, base: 8, mult: 2.0, description: '2 组对子。伤害 = (8 + 总点数) * 2.0，获得 10 点护甲。' },
  { id: 'three_of_a_kind', name: '三条', icon: <PixelTriangle size={2} />, base: 10, mult: 2.2, description: '3 颗点数相同的骰子。伤害 = (10 + 总点数) * 2.2，附加 2 层灼烧。' },
  { id: 'straight', name: '顺子', icon: <PixelArrowRight size={2} />, base: 12, mult: 2.2, description: '3 颗及以上点数连续的骰子。伤害 = (12 + 总点数) * 2.2，附加 2 层虚弱。' },
  { id: 'flush', name: '同花', icon: <PixelDroplet size={2} />, base: 14, mult: 2.5, description: '至少 4 颗颜色相同的骰子。伤害 = (14 + 总点数) * 2.5，附加 2 层中毒。' },
  { id: 'full_house', name: '葫芦', icon: <PixelHouse size={2} />, base: 16, mult: 2.8, description: '1 组三条 + 1 组对子。伤害 = (16 + 总点数) * 2.8，获得 15 点护甲，附加 2 层易伤。' },
  { id: 'four_of_a_kind', name: '四条', icon: <PixelSquare size={2} />, base: 20, mult: 3.5, description: '4 颗点数相同的骰子。伤害 = (20 + 总点数) * 3.5，附加 3 层灼烧。' },
  { id: 'five_of_a_kind', name: '五条', icon: <PixelStar size={2} />, base: 25, mult: 4.0, description: '5 颗点数相同的骰子。伤害 = (25 + 总点数) * 4.0，附加 4 层灼烧。' },
  { id: 'six_of_a_kind', name: '六条', icon: <PixelTrophy size={2} />, base: 30, mult: 5.0, description: '6 颗点数相同的骰子。伤害 = (30 + 总点数) * 5.0，附加 5 层灼烧。' },
  { id: 'straight_flush', name: '同花顺', icon: <PixelZap size={2} />, base: 35, mult: 4.5, description: '同花 + 顺子。伤害 = (35 + 总点数) * 4.5，获得 20 点护甲，附加 5 层中毒。' },
  { id: 'flush_house', name: '同花葫芦', icon: <PixelWaves size={2} />, base: 40, mult: 5.0, description: '同花 + 葫芦。伤害 = (40 + 总点数) * 5.0，获得 30 点护甲，附加 8 层中毒。' },
  { id: 'royal_flush', name: '皇家同花顺', icon: <PixelCrown size={2} />, base: 60, mult: 7.0, description: '同花 + 顺子(1-6)。伤害 = (60 + 总点数) * 7.0，获得 50 点护甲，附加 15 层中毒。' },
];
