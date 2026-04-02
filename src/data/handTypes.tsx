import React from 'react';
import {
  PixelZap, PixelPair, PixelLayers, PixelTriangle, PixelArrowRight,
  PixelDroplet, PixelHouse, PixelSquare, PixelStar, PixelTrophy,
  PixelCrown, PixelWaves
} from '../components/PixelIcons';
import { HandTypeDef } from '../types/game';

/**
 * 牌型定义表 - 纯倍率体系
 * 
 * 伤害公式: 骰子点数和 x 牌型倍率 x 增幅倍率
 * base字段保留为0（兼容旧代码），实际不参与计算
 * 
 * 设计原则:
 * - 对子系(对子/连对/三条/四条/五条/六条): 单体爆发，倍率递增
 * - 顺子系(3顺/4顺/5顺/6顺): AOE扫场，倍率从低到高
 * - 三条系: 附加易伤效果
 * - 葫芦系: 纯防御(护甲)
 * - 元素系: 骰子onPlay效果翻倍
 */
export const HAND_TYPES: HandTypeDef[] = [
  { id: 'high_card', name: '普通攻击', icon: <PixelZap size={2} />, base: 0, mult: 1.0, description: '任意单颗骰子。伤害 = 骰子点数和 x 1.0' },
  { id: 'pair', name: '对子', icon: <PixelPair size={2} />, base: 0, mult: 2.0, description: '2颗点数相同。伤害 = 点数和 x 2.0' },
  { id: 'straight_3', name: '顺子', icon: <PixelArrowRight size={2} />, base: 0, mult: 1.5, description: '3颗及以上点数连续。伤害 = 点数和 x 1.5，AOE全体' },
  { id: 'two_pair', name: '连对', icon: <PixelLayers size={2} />, base: 0, mult: 2.5, description: '2组对子。伤害 = 点数和 x 2.5，获得5护甲' },
  { id: 'three_pair', name: '三连对', icon: <PixelLayers size={2} />, base: 0, mult: 3.5, description: '3组对子。伤害 = 点数和 x 3.5，获得8护甲' },
  { id: 'three_of_a_kind', name: '三条', icon: <PixelTriangle size={2} />, base: 0, mult: 3.0, description: '3颗点数相同。伤害 = 点数和 x 3.0，施加1层易伤(2回合)' },
  { id: 'straight_4', name: '4顺', icon: <PixelArrowRight size={2} />, base: 0, mult: 2.5, description: '4颗点数连续。伤害 = 点数和 x 2.5，AOE全体，施加1层虚弱' },
  { id: 'same_element', name: '同元素', icon: <PixelDroplet size={2} />, base: 0, mult: 3.0, description: '至少4颗同元素(非普通)。伤害 = 点数和 x 3.0，骰子效果x2' },
  { id: 'full_house', name: '葫芦', icon: <PixelHouse size={2} />, base: 0, mult: 4.0, description: '1组三条+1组对子。伤害 = 点数和 x 4.0，获得15护甲' },
  { id: 'straight_5', name: '5顺', icon: <PixelArrowRight size={2} />, base: 0, mult: 3.5, description: '5颗点数连续。伤害 = 点数和 x 3.5，AOE全体，施加2层虚弱' },
  { id: 'four_of_a_kind', name: '四条', icon: <PixelSquare size={2} />, base: 0, mult: 5.0, description: '4颗点数相同。伤害 = 点数和 x 5.0，施加2层易伤(2回合)' },
  { id: 'straight_6', name: '6顺', icon: <PixelArrowRight size={2} />, base: 0, mult: 5.0, description: '6颗点数连续(1-6)。伤害 = 点数和 x 5.0，AOE全体，施加3层虚弱+10护甲' },
  { id: 'element_straight', name: '元素顺', icon: <PixelZap size={2} />, base: 0, mult: 5.5, description: '同元素+顺子。伤害 = 点数和 x 5.5，AOE全体，骰子效果x2' },
  { id: 'element_house', name: '元素葫芦', icon: <PixelWaves size={2} />, base: 0, mult: 6.0, description: '同元素+葫芦。伤害 = 点数和 x 6.0，骰子效果x2+25护甲' },
  { id: 'five_of_a_kind', name: '五条', icon: <PixelStar size={2} />, base: 0, mult: 7.0, description: '5颗点数相同。伤害 = 点数和 x 7.0，施加3层易伤(2回合)' },
  { id: 'six_of_a_kind', name: '六条', icon: <PixelTrophy size={2} />, base: 0, mult: 10.0, description: '6颗点数相同。伤害 = 点数和 x 10.0，施加5层易伤(3回合)' },
  { id: 'royal_element', name: '皇家元素顺', icon: <PixelCrown size={2} />, base: 0, mult: 12.0, description: '同元素+顺子(1-6)。伤害 = 点数和 x 12.0，AOE全体，骰子效果x3+50护甲' },
];
