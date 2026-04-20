/**
 * ClassDiceList — 职业信息弹窗的专属骰子列表
 * ARCH-H: 从 ClassInfoModal.tsx 提取
 */
import React from 'react';
import type { ClassId, DiceDef } from '../types/game';
import { CLASS_DEFS, CLASS_DICE } from '../data/classes';
import { DiceFacePattern } from './DiceFacePattern';
import { PixelDiceRenderer, hasPixelRenderer } from './PixelDiceRenderer';
import { PixelClose } from './PixelIcons';
import { getDiceElementClass } from '../utils/uiHelpers';
import { formatDescription } from '../utils/richText';

/** 稀有度样式 */
const RARITY_STYLE: Record<string, { color: string; label: string; border: string }> = {
  common: { color: 'text-gray-300', label: '普通', border: 'border-gray-500' },
  uncommon: { color: 'text-[var(--pixel-green)]', label: '精良', border: 'border-[var(--pixel-green)]' },  // 铁律: 精良非稀有
  rare: { color: 'text-[var(--pixel-purple-light)]', label: '史诗', border: 'border-[var(--pixel-purple)]' },
  legendary: { color: 'text-[var(--pixel-gold)]', label: '传说', border: 'border-[var(--pixel-gold)]' },
};

/** 关键字高亮 */
function highlightKeywords(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(【[^】]+】)|((?:卖血重投|蓄力|连击|弹回|血怒|狂暴|普攻可多选|保留|出牌|补牌|护甲|净化|嘲讽|毒|灼烧|冻结|引爆|万能|弹回|复制|交换|吞噬|偷取|暗杀|斩杀|净化|回血))|(×[\d.]+|[\d.]+%|\+\d+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) parts.push(<span key={match.index} className="text-[var(--pixel-gold)] font-bold">{match[1]}</span>);
    else if (match[2]) parts.push(<span key={match.index} className="text-[var(--pixel-cyan)] font-bold">{match[2]}</span>);
    else if (match[3]) parts.push(<span key={match.index} className="text-[var(--pixel-red-light)] font-bold">{match[3]}</span>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/** 单个骰子卡片 */
const ClassDiceCard: React.FC<{ dice: DiceDef; rs: typeof RARITY_STYLE[string] }> = ({ dice, rs }) => (
  <div
    className={`p-1.5 border bg-[rgba(0,0,0,0.25)] flex gap-2 items-start ${rs.border}`}
    style={{ borderRadius: '2px', borderWidth: '1px' }}
  >
    {/* 预览 */}
    {hasPixelRenderer(dice.id) ? (
      <div className="w-8 h-8 shrink-0">
        <PixelDiceRenderer diceDefId={dice.id} value={dice.faces[0] === dice.faces[5] ? dice.faces[0] : '?'} size={32} />
      </div>
    ) : (
      <div className={`w-8 h-8 shrink-0 flex items-center justify-center text-[10px] font-bold relative ${getDiceElementClass(dice.element || 'normal', false, false, false, dice.id)}`}
        style={{ fontSize: '10px', width: '32px', height: '32px' }}
      >
        <DiceFacePattern diceDefId={dice.id} />
        <span className="relative z-[2]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          {dice.faces ? (dice.faces[0] === dice.faces[5] ? dice.faces[0] : '?') : '?'}
        </span>
      </div>
    )}
    {/* 信息 */}
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold text-[var(--dungeon-text-bright)] leading-tight">{dice.name}</div>
      <div className="text-[9px] text-[var(--dungeon-text)] leading-snug mt-0.5">{formatDescription(dice.description || '')}</div>
      {dice.faces && (
        <div className="text-[7px] text-[var(--dungeon-text-dim)] font-mono mt-0.5">面值: [{dice.faces.join(',')}]</div>
      )}
    </div>
  </div>
);

interface ClassDiceListProps {
  classId: string;
}

/** 按稀有度分组的职业骰子列表 */
export const ClassDiceList: React.FC<ClassDiceListProps> = ({ classId }) => {
  if (!classId || !CLASS_DEFS[classId as ClassId]) return null;

  const classDef = CLASS_DEFS[classId as ClassId];
  const classDice = CLASS_DICE[classId as ClassId] || [];

  const grouped = {
    common: classDice.filter(d => d.rarity === 'common'),
    uncommon: classDice.filter(d => d.rarity === 'uncommon'),
    rare: classDice.filter(d => d.rarity === 'rare'),
    legendary: classDice.filter(d => d.rarity === 'legendary'),
  };

  return (
    <>
      {/* 分隔线 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-[1px] bg-[var(--dungeon-panel-border)]" />
        <span className="text-[9px] text-[var(--dungeon-text-dim)] font-bold tracking-wider">专属骰子 ({classDice.length})</span>
        <div className="flex-1 h-[1px] bg-[var(--dungeon-panel-border)]" />
      </div>

      {/* 分组列表 */}
      {((['common', 'uncommon', 'rare', 'legendary'] as const)).map(rarity => {
        const diceGroup = grouped[rarity];
        if (diceGroup.length === 0) return null;
        const rs = RARITY_STYLE[rarity];
        return (
          <div key={rarity}>
            <div className={`text-[8px] font-bold tracking-wider mb-1 ${rs.color}`}>▸ {rs.label} ({diceGroup.length})</div>
            <div className="space-y-1">
              {diceGroup.map(dice => <ClassDiceCard key={dice.id} dice={dice} rs={rs} />)}
            </div>
          </div>
        );
      })}
    </>
  );
};

/** 职业技能列表 */
export const ClassSkillList: React.FC<{ classId: string }> = ({ classId }) => {
  if (!classId || !CLASS_DEFS[classId as ClassId]) return null;
  const classDef = CLASS_DEFS[classId as ClassId];

  return (
    <div className="p-2 border border-[var(--dungeon-panel-border)] bg-[rgba(0,0,0,0.3)]" style={{ borderRadius: '2px' }}>
      <div className="text-[9px] font-bold tracking-wider mb-2" style={{ color: classDef.colorLight }}>◆ 职业技能</div>
      <div className="flex flex-col gap-1.5">
        {classDef.skills.map((skill, i) => (
          <div key={i} className="flex gap-1.5 items-start">
            <span
              className="shrink-0 text-[8px] font-black px-1 py-0.5 leading-tight"
              style={{
                color: classDef.colorLight,
                background: classDef.color + '20',
                border: `1px solid ${classDef.color}40`,
                borderRadius: '2px',
              }}
            >
              {skill.name}
            </span>
            <span className="text-[9px] text-[var(--dungeon-text)] leading-relaxed">{formatDescription(skill.desc)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { highlightKeywords, RARITY_STYLE };
