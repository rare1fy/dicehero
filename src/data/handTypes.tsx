import React from 'react';
import {
  PixelZap, PixelPair, PixelLayers, PixelTriangle, PixelArrowRight,
  PixelHouse, PixelSquare, PixelStar, PixelTrophy
} from '../components/PixelIcons';
import { HandTypeDef } from '../types/game';

/**
 * 牌型定义表 - 纯倍率体系（v2 收敛版）
 *
 * 伤害公式: 骰子点数和 x 牌型倍率 x 增幅倍率
 *
 * [2026-05-10] 重构原则：
 * - 同牌系（对子/连对/三连对/三条/葫芦/四条/五条/六条）：纯单体高倍率
 * - 顺牌系（3顺/4顺/5顺/6顺）：AOE扫场，倍率低于同颗数同牌系
 * - 葫芦系（3+2 / 大葫芦 3+3·4+2）：唯一带特殊机制 — 无视嘲讽 + 真伤
 * - 倍率梯度按"拼凑难度+伤害类型"双轴分配
 * - 已删除元素牌型（同元素/元素顺/元素葫芦/皇家元素顺）
 *
 * name 字段保持原始中文（与 handEvaluator 输出一致，逻辑层硬编码用此字段）
 * displayName 是 UI 显示名（西幻包装版），玩家看到的名字
 */
export const HAND_TYPES: HandTypeDef[] = [
  { id: 'high_card',        name: '普通攻击', displayName: '普通攻击',   icon: <PixelZap size={2} />,         base: 0, mult: 1.0,  description: '任意单颗骰子。伤害 = 点数和' },
  { id: 'pair',             name: '对子',     displayName: '对称打击',   icon: <PixelPair size={2} />,        base: 0, mult: 1.8,  description: '2颗点数相同。伤害 = 点数和 +80%' },
  { id: 'straight_3',       name: '顺子',     displayName: '三连刺击',   icon: <PixelArrowRight size={2} />,  base: 0, mult: 1.5,  description: '3颗点数连续。伤害 = 点数和 +50%，AOE全体' },
  { id: 'two_pair',         name: '连对',     displayName: '对称阵列',   icon: <PixelLayers size={2} />,      base: 0, mult: 2.4,  description: '2组对子。伤害 = 点数和 +140%' },
  { id: 'straight_4',       name: '4顺',      displayName: '四连裂空',   icon: <PixelArrowRight size={2} />,  base: 0, mult: 2.0,  description: '4颗点数连续。伤害 = 点数和 +100%，AOE全体' },
  { id: 'three_of_a_kind',  name: '三条',     displayName: '三星魔咒',   icon: <PixelTriangle size={2} />,    base: 0, mult: 2.8,  description: '3颗点数相同。伤害 = 点数和 +180%' },
  { id: 'straight_5',       name: '5顺',      displayName: '五连裂斩',   icon: <PixelArrowRight size={2} />,  base: 0, mult: 2.6,  description: '5颗点数连续。伤害 = 点数和 +160%，AOE全体' },
  { id: 'three_pair',       name: '三连对',   displayName: '三重阵列',   icon: <PixelLayers size={2} />,      base: 0, mult: 3.4,  description: '3组对子。伤害 = 点数和 +240%' },
  { id: 'straight_6',       name: '6顺',      displayName: '天启裂斩',   icon: <PixelArrowRight size={2} />,  base: 0, mult: 3.5,  description: '6颗点数连续(1-6)。伤害 = 点数和 +250%，AOE全体' },
  { id: 'full_house',       name: '葫芦',     displayName: '圣裁之印',   icon: <PixelHouse size={2} />,       base: 0, mult: 3.8,  description: '3+2组合(5颗)。伤害 = 点数和 +280%，无视嘲讽 + 真伤(无视护甲与减伤)' },
  { id: 'four_of_a_kind',   name: '四条',     displayName: '四星血祭',   icon: <PixelSquare size={2} />,      base: 0, mult: 4.5,  description: '4颗点数相同。伤害 = 点数和 +350%' },
  { id: 'full_house_big',   name: '大葫芦',   displayName: '王葬',       icon: <PixelHouse size={2} />,       base: 0, mult: 5.8,  description: '3+3 或 4+2 组合(6颗)。伤害 = 点数和 +480%，无视嘲讽 + 真伤(无视护甲与减伤)' },
  { id: 'five_of_a_kind',   name: '五条',     displayName: '五星裁决',   icon: <PixelStar size={2} />,        base: 0, mult: 6.5,  description: '5颗点数相同。伤害 = 点数和 +550%' },
  { id: 'six_of_a_kind',    name: '六条',     displayName: '六星灭世',   icon: <PixelTrophy size={2} />,      base: 0, mult: 10.0, description: '6颗点数相同。伤害 = 点数和 +900%' },
];

/**
 * 把内部 name（如"对子"）映射到 UI 显示名（如"对称打击"）。
 * 找不到时回退到 name 本身。
 */
export function getHandTypeDisplayName(name: string): string {
  const def = HAND_TYPES.find(h => h.name === name);
  return def?.displayName || name;
}