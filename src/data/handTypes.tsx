import React from 'react';
import {
  PixelZap, PixelPair, PixelLayers, PixelTriangle, PixelArrowRight,
  PixelDroplet, PixelHouse, PixelSquare, PixelStar, PixelTrophy,
  PixelCrown, PixelWaves
} from '../components/PixelIcons';
import { HandTypeDef } from '../types/game';

export const HAND_TYPES: HandTypeDef[] = [
  { id: 'high_card', name: '普通攻击', icon: <PixelZap size={2} />, base: 0, mult: 1, description: '任意单颗骰子。伤害 = 骰子点数。' },
  { id: 'pair', name: '对子', icon: <PixelPair size={2} />, base: 3, mult: 1.3, description: '2颗点数相同的骰子。伤害 = (5 + 点数) × 1.6。' },
  { id: 'two_pair', name: '连对', icon: <PixelLayers size={2} />, base: 5, mult: 1.5, description: '2组对子。伤害 = (8 + 总点数) × 2.0。' },
  { id: 'three_of_a_kind', name: '三条', icon: <PixelTriangle size={2} />, base: 6, mult: 1.7, description: '3颗点数相同的骰子。伤害 = (10 + 总点数) × 2.2，附加2层灼烧。' },
  { id: 'straight', name: '顺子', icon: <PixelArrowRight size={2} />, base: 8, mult: 1.8, description: '3颗及以上点数连续的骰子。伤害 = (12 + 总点数) × 2.2，★AOE全体攻击★，附加2层虚弱。' },
  { id: 'same_element', name: '同元素', icon: <PixelDroplet size={2} />, base: 15, mult: 2.5, description: '至少4颗元素相同的骰子。伤害 = (25 + 总点数) × 3.5，附加2层中毒。' },
  { id: 'full_house', name: '葡芦', icon: <PixelHouse size={2} />, base: 10, mult: 2.0, description: '1组三条 + 1组对子。伤害 = (16 + 总点数) × 2.8，获得15点护甲，附加2层易伤。' },
  { id: 'four_of_a_kind', name: '四条', icon: <PixelSquare size={2} />, base: 14, mult: 2.5, description: '4颗点数相同的骰子。伤害 = (20 + 总点数) × 3.5，附加3层灼烧。' },
  { id: 'five_of_a_kind', name: '五条', icon: <PixelStar size={2} />, base: 18, mult: 3.0, description: '5颗点数相同的骰子。伤害 = (25 + 总点数) × 4.0，附加4层灼烧。' },
  { id: 'six_of_a_kind', name: '六条', icon: <PixelTrophy size={2} />, base: 22, mult: 3.5, description: '6颗点数相同的骰子。伤害 = (30 + 总点数) × 5.0，附加5层灼烧。' },
  { id: 'element_straight', name: '元素顺', icon: <PixelZap size={2} />, base: 30, mult: 4.0, description: '同元素 + 顺子。伤害 = (50 + 总点数) × 6.0，★AOE全体攻击★，获得20点护甲，附加5层中毒。' },
  { id: 'element_house', name: '元素葡芦', icon: <PixelWaves size={2} />, base: 35, mult: 4.5, description: '同元素 + 葡芦。伤害 = (55 + 总点数) × 6.5，获得30点护甲，附加8层中毒。' },
  { id: 'royal_element', name: '皇家元素顺', icon: <PixelCrown size={2} />, base: 50, mult: 6.0, description: '同元素 + 顺子(1-6)。伤害 = (80 + 总点数) × 10.0，★AOE全体攻击★，获得50点护甲，附加15层中毒。' },
];
