/**
 * ClassInfoModal.tsx — 职业信息弹窗
 * 显示职业机制说明 + 被动技能 + 全部专属骰子列表
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CLASS_DEFS, CLASS_DICE, type ClassId } from '../data/classes';
import { PixelClose } from './PixelIcons';
import { ClassIcon } from './ClassIcons';

// 稀有度颜色和标签
const RARITY_STYLE: Record<string, { color: string; label: string; border: string }> = {
  common: { color: 'text-gray-300', label: '普通', border: 'border-gray-500' },
  uncommon: { color: 'text-[var(--pixel-green)]', label: '稀有', border: 'border-[var(--pixel-green)]' },
  rare: { color: 'text-[var(--pixel-purple-light)]', label: '史诗', border: 'border-[var(--pixel-purple)]' },
  legendary: { color: 'text-[var(--pixel-gold)]', label: '传说', border: 'border-[var(--pixel-gold)]' },
};

// 富文本处理：关键字高亮
function highlightKeywords(text: string): React.ReactNode[] {
  // 高亮规则：【xxx】黄色，数字+%红色，+N蓝色，元素绿色
  const parts: React.ReactNode[] = [];
  const regex = /(【[^】]+】)|((?:卖血重投|蓄力|连击|弹回|血怒|狂暴|普攻可多选|保留|出牌|补牌|护甲|净化|嘲讽|毒|灼烧|冻结|引爆|万能|弹回|复制|交换|吞噬|偷取|暗杀|斩杀|净化|回血))|(×[\d.]+|[\d.]+%|\+\d+)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // 【xxx】— 金色
      parts.push(<span key={match.index} className="text-[var(--pixel-gold)] font-bold">{match[1]}</span>);
    } else if (match[2]) {
      // 关键字 — 青色
      parts.push(<span key={match.index} className="text-[var(--pixel-cyan)] font-bold">{match[2]}</span>);
    } else if (match[3]) {
      // 数值 — 红色
      parts.push(<span key={match.index} className="text-[var(--pixel-red-light)] font-bold">{match[3]}</span>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

interface ClassInfoModalProps {
  visible: boolean;
  onClose: () => void;
  classId?: string;
}

export const ClassInfoModal: React.FC<ClassInfoModalProps> = ({ visible, onClose, classId }) => {
  if (!classId || !CLASS_DEFS[classId as ClassId]) return null;
  
  const classDef = CLASS_DEFS[classId as ClassId];
  const classDice = CLASS_DICE[classId as ClassId] || [];
  
  // 按稀有度分组
  const grouped = {
    common: classDice.filter(d => d.rarity === 'common'),
    uncommon: classDice.filter(d => d.rarity === 'uncommon'),
    rare: classDice.filter(d => d.rarity === 'rare'),
    legendary: classDice.filter(d => d.rarity === 'legendary'),
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-black/85"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm pixel-panel overflow-hidden max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="p-3 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center shrink-0"
              style={{ background: `linear-gradient(180deg, ${classDef.colorDark}40 0%, var(--dungeon-bg-light) 100%)` }}>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <ClassIcon classId={classId} size={2} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold tracking-[0.1em] pixel-text-shadow"
                    style={{ color: classDef.colorLight }}>{classDef.name} · {classDef.title}</h3>
                </div>
              </div>
              <button onClick={onClose} className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text-bright)] shrink-0">
                <PixelClose size={2} />
              </button>
            </div>

            {/* 可滚动内容 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* 职业描述 */}
              <div className="text-[10px] text-[var(--dungeon-text)] leading-relaxed">
                {classDef.description}
              </div>

              {/* 职业被动 */}
              <div className="p-2 border border-[var(--dungeon-panel-border)] bg-[rgba(0,0,0,0.3)]" style={{ borderRadius: '2px' }}>
                <div className="text-[9px] font-bold tracking-wider mb-1"
                  style={{ color: classDef.colorLight }}>◆ 职业特权</div>
                <div className="text-[10px] text-[var(--dungeon-text-bright)] leading-relaxed">
                  {highlightKeywords(classDef.passiveDesc)}
                </div>
              </div>

              {/* 回合规则 */}
              <div className="p-2 border border-[var(--dungeon-panel-border)] bg-[rgba(0,0,0,0.2)]" style={{ borderRadius: '2px' }}>
                <div className="text-[9px] font-bold text-[var(--dungeon-text-dim)] tracking-wider mb-1">◆ 回合规则</div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--dungeon-text-dim)]">每回合抽骰</span>
                    <span className="text-[var(--dungeon-text-bright)] font-bold">{classDef.drawCount}颗</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--dungeon-text-dim)]">出牌次数</span>
                    <span className="text-[var(--dungeon-text-bright)] font-bold">{classDef.maxPlays}次</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--dungeon-text-dim)]">免费重投</span>
                    <span className="text-[var(--dungeon-text-bright)] font-bold">{classDef.freeRerolls}次</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--dungeon-text-dim)]">卖血重投</span>
                    <span className={classDef.canBloodReroll ? 'text-[var(--pixel-red-light)] font-bold' : 'text-[var(--dungeon-text-dim)]'}>
                      {classDef.canBloodReroll ? '✓ 可用' : '✗ 不可'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--dungeon-text-dim)]">回合结束</span>
                    <span className="text-[var(--dungeon-text-bright)] font-bold">
                      {classDef.keepUnplayed ? '保留未出牌' : '全部丢弃'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--dungeon-text-dim)]">普攻多选</span>
                    <span className={classDef.normalAttackMultiSelect ? 'text-[var(--pixel-gold)] font-bold' : 'text-[var(--dungeon-text-dim)]'}>
                      {classDef.normalAttackMultiSelect ? '✓ 可多选' : '仅单选'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 骰子分隔线 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[1px] bg-[var(--dungeon-panel-border)]" />
                <span className="text-[9px] text-[var(--dungeon-text-dim)] font-bold tracking-wider">专属骰子 ({classDice.length})</span>
                <div className="flex-1 h-[1px] bg-[var(--dungeon-panel-border)]" />
              </div>

              {/* 骰子列表按稀有度分组 */}
              {(['common', 'uncommon', 'rare', 'legendary'] as const).map(rarity => {
                const diceGroup = grouped[rarity];
                if (diceGroup.length === 0) return null;
                const rs = RARITY_STYLE[rarity];
                return (
                  <div key={rarity}>
                    <div className={`text-[8px] font-bold tracking-wider mb-1 ${rs.color}`}>
                      ▸ {rs.label} ({diceGroup.length})
                    </div>
                    <div className="space-y-1">
                      {diceGroup.map(dice => (
                        <div key={dice.id}
                          className={`p-1.5 border bg-[rgba(0,0,0,0.25)] flex gap-2 items-start ${rs.border}`}
                          style={{ borderRadius: '2px', borderWidth: '1px' }}>
                          {/* 骰子面值迷你预览 */}
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center text-[8px] font-mono font-bold border border-[var(--dungeon-panel-border)] bg-[rgba(0,0,0,0.3)]"
                            style={{
                              borderRadius: '2px',
                              color: classId === 'warrior' ? '#c04040' : classId === 'mage' ? '#a070ff' : '#60d080',
                            }}>
                            {dice.faces ? (
                              dice.faces[0] === dice.faces[5] ? `[${dice.faces[0]}]` : `${dice.faces[0]}-${dice.faces[5]}`
                            ) : '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-[var(--dungeon-text-bright)] leading-tight">
                              {dice.name}
                            </div>
                            <div className="text-[9px] text-[var(--dungeon-text)] leading-snug mt-0.5">
                              {highlightKeywords(dice.description || '')}
                            </div>
                            {dice.faces && (
                              <div className="text-[7px] text-[var(--dungeon-text-dim)] font-mono mt-0.5">
                                面值: [{dice.faces.join(',')}]
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
