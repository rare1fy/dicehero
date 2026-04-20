/**
 * DiceGuideList — 骰子图鉴列表子组件
 * ARCH-H: 从 DiceGuideModal.tsx 提取
 */
import React from 'react';
import type { DiceDef } from '../types/game';
import { ELEMENT_EFFECT_DESC } from '../data/dice';
import { DiceFacePattern } from './DiceFacePattern';
import { PixelDiceRenderer, hasPixelRenderer } from './PixelDiceRenderer';
import { getDiceElementClass } from '../utils/uiHelpers';
import { formatDescription } from '../utils/richText';

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  legendary: 'text-yellow-400',
  curse: 'text-purple-400',
};

export const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '精良',
  rare: '稀有',
  legendary: '传说',
  curse: '诅咒',
};

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary', 'curse'] as const;

type CategoryId = 'all' | 'universal' | 'warrior' | 'mage' | 'rogue';

export interface GuideSection {
  category: CategoryId;
  label: string;
  color: string;
  groups: Record<string, DiceDef[]>;
}

/** 已移交给职业的旧通用骰子ID，图鉴中不再展示 */
const LEGACY_DICE_IDS = new Set(['heavy', 'elemental']);

export const getCategoryForDice = (def: DiceDef): CategoryId | null => {
  if (LEGACY_DICE_IDS.has(def.id)) return null;
  if (def.id.startsWith('w_')) return 'warrior';
  if (def.id.startsWith('mage_')) return 'mage';
  if (def.id.startsWith('r_')) return 'rogue';
  return 'universal';
};

export const CATEGORIES: { id: CategoryId; label: string; color: string }[] = [
  { id: 'all', label: '全部', color: 'var(--dungeon-text-bright)' },
  { id: 'universal', label: '通用', color: '#a0a8b8' },
  { id: 'warrior', label: '嗜血狂战', color: '#c04040' },
  { id: 'mage', label: '星界魔导', color: '#a070ff' },
  { id: 'rogue', label: '影锋刺客', color: '#60d080' },
];

interface DiceGuideListProps {
  sections: GuideSection[];
  activeCategory: CategoryId;
  ownedIds: Set<string>;
  game: { ownedDice?: (string | { defId: string })[] };
}

/** 单个骰子条目 */
const DiceGuideItem: React.FC<{
  def: DiceDef;
  owned: boolean;
  ownedCount: number;
}> = ({ def, owned, ownedCount }) => (
  <div className={`flex items-start gap-2 py-2 px-2 border-b border-[rgba(255,255,255,0.05)] ${!owned ? 'opacity-50' : ''}`}>
    {/* 骰子预览 */}
    {hasPixelRenderer(def.id) ? (
      <div className="flex-shrink-0 w-9 h-9">
        <PixelDiceRenderer diceDefId={def.id} value="?" size={36} />
      </div>
    ) : (
      <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center text-sm font-bold relative ${getDiceElementClass(def.element, false, false, false, def.id)}`}>
        <DiceFacePattern diceDefId={def.id} />
        <span className="relative z-[2]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>?</span>
      </div>
    )}
    {/* 信息 */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold ${RARITY_COLORS[def.rarity]}`}>{def.name}</span>
        {owned && <span className="text-[10px] text-[var(--pixel-green)] opacity-70">×{ownedCount}</span>}
      </div>
      <div className="text-[10px] text-[var(--dungeon-text-dim)] mt-0.5 leading-tight">{formatDescription(def.description)}</div>
      <div className="text-[10px] text-[var(--dungeon-text-dim)] mt-0.5 opacity-60">面: [{def.faces.join(', ')}]</div>
      {def.isElemental && (
        <div className="text-[10px] text-[var(--pixel-cyan)] mt-0.5">⚡ 元素效果：抽到时随机坍缩</div>
      )}
      {def.id === 'split' && (
        <div className="text-[10px] text-[var(--pixel-cyan)] mt-0.5">✦ 结算时分裂出一颗随机点数骰子</div>
      )}
    </div>
  </div>
);

/** 元素效果说明区 */
const ElementEffectsSection: React.FC = () => (
  <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)]">
    <div className="text-xs font-bold text-[var(--pixel-cyan)] mb-1.5 pixel-text-shadow">── 元素效果 ──</div>
    {Object.entries(ELEMENT_EFFECT_DESC).map(([elem, desc]) => (
      <div key={elem} className="flex items-start gap-1.5 py-1 text-[10px]">
        <span className={`font-bold ${
          elem === 'fire' ? 'text-red-400' :
          elem === 'ice' ? 'text-blue-300' :
          elem === 'thunder' ? 'text-yellow-300' :
          elem === 'poison' ? 'text-purple-400' :
          'text-yellow-200'
        }`}>
          {elem === 'fire' ? '火' : elem === 'ice' ? '冰' : elem === 'thunder' ? '雷' : elem === 'poison' ? '毒' : '圣'}
        </span>
        <span className="text-[var(--dungeon-text-dim)]">{formatDescription(desc)}</span>
      </div>
    ))}
  </div>
);

/** 骰子图鉴完整列表 */
export const DiceGuideList: React.FC<DiceGuideListProps> = ({ sections, activeCategory, ownedIds, game }) => (
  <>
    {sections.map(section => {
      const hasAny = Object.values(section.groups).some(g => g.length > 0);
      if (!hasAny) return null;
      return (
        <div key={section.category} className="mb-4">
          {activeCategory === 'all' && (
            <div className="text-xs font-black mb-2 px-1 py-1 border-b-2 border-[rgba(255,255,255,0.08)]" style={{ color: section.color }}>
              ◆ {section.label}骰子
            </div>
          )}
          {RARITY_ORDER.map(rarity => {
            const diceList = section.groups[rarity];
            if (!diceList || diceList.length === 0) return null;
            return (
              <div key={rarity} className="mb-2">
                <div className={`text-[10px] font-bold mb-1 ${RARITY_COLORS[rarity]} pixel-text-shadow opacity-70`}>
                  {RARITY_LABELS[rarity]}
                </div>
                {diceList.map(def => {
                  const owned = ownedIds.has(def.id);
                  const ownedCount = (game.ownedDice || []).filter(d => (typeof d === 'string' ? d : d.defId) === def.id).length;
                  return <DiceGuideItem key={def.id} def={def} owned={owned} ownedCount={ownedCount} />;
                })}
              </div>
            );
          })}
        </div>
      );
    })}
    <ElementEffectsSection />
  </>
);
