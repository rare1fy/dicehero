/**
 * EnemyBestiary.tsx — 敌人图鉴（按章节分页）
 *
 * [2026-05-09 v2 调整]
 *   1. 修复 tab 高度：原 px-2 py-1 + 9px 字体在 5 个 4 字章节名时挤成"半行"。
 *      改成 min-h + flex-wrap，且两行布局自动撑高，整体改为 grid-cols-5。
 *   2. 点击敌人 → 弹详情面板，显示行为描述（职业 + archetype + phase actions + 召唤 + 复活）。
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelSprite, hasSpriteData } from './PixelSprite';
import { PixelClose } from './PixelIcons';
import { NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES, type EnemyConfig } from '../config/enemies';
import { renderEnemyLine } from './enemyLineRenderer';
import { CHAPTER_CONFIG } from '../config';

export const COMBAT_LABELS: Record<string, { label: string; color: string; full: string }> = {
  warrior:  { label: '战', color: 'var(--pixel-red)',    full: '近战战士 · 直接扑上来近身砍你；攻击可顺带挂少量负面效果' },
  guardian: { label: '盾', color: 'var(--pixel-blue)',   full: '守护者 · 攻防交替，堆护甲后放大招；攻击可顺带挂少量负面效果' },
  ranger:   { label: '弓', color: 'var(--pixel-green)',  full: '弓箭手 · 远程射击，每次攻击伤害叠加；可顺带挂少量负面效果' },
  caster:   { label: '术', color: 'var(--pixel-purple)', full: '法师 · 不直接打你，专精强力 DOT 与控制（毒/灼烧/易伤/虚弱/冻结）' },
  priest:   { label: '牧', color: 'var(--pixel-gold)',   full: '牧师 · 治疗友军 / 给你上强力虚弱、易伤；护甲祝福加固队友' },
};

const CAT_COLORS: Record<string, string> = {
  normal: 'var(--dungeon-text-dim)',
  elite:  'var(--pixel-orange)',
  boss:   'var(--pixel-purple)',
};

// archetype → 玩家语言说明（第一行是短标签，第二行是实际效果）
const ARCHETYPE_DESC: Record<string, string> = {
  berserker:    '【狂战】你每打他一次，他攻击力 +40%（最多累 4 次，变成原来的 2.6 倍）。队友死亡触发【复仇】，攻击力再 +50%/层',
  striker:      '【突袭】血量掉到 70% 以下时进入爆发，攻击伤害 +50%',
  paladin:      '【圣骑】每次攻击伤害 +20%，但不会被激怒（不叠血怒）',
  marksman:     '【神射】远程追击伤害随命中次数翻倍叠加，单发多 +30%',
  trapper:      '【陷阱】每次攻击附带 1 层剧毒',
  hunter:       '【猎手】标准弓手，无特殊修正',
  bulwark:      '【铁壁】每次防御获得双倍护甲，但防御不会激怒（不叠守护怒气）',
  enforcer:     '【执法】每防御 1 回合，下次攻击伤害 +60%（最多累 3 次，变成原来的 2.8 倍）',
  pyromancer:   '【焚化】80% 概率给你灼烧；每叠一层灼烧放大系数 +50%（最多 ×2.5）',
  toxicologist: '【毒师】80% 概率给你剧毒；每叠一层毒放大系数 +40%（最多 ×2.5）',
  cursemaster:  '【咒师】100% 给你"毒 + 虚弱"双诅咒，不单独放持续伤害',
  healer:       '【治疗】优先顺序：治疗友军 → 自疗 → 给友军套护甲 → 给你上减益',
  inquisitor:   '【审判】不治疗，50% 概率直接给你上"虚弱 + 易伤"双减益',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

/* ===== 行为描述生成 ===== */

/** description 文本 → DOT 状态（与 enemyActionDispatch 同步） */
const DOT_DESC_MAP: Record<string, string> = {
  '灼烧': '灼烧',
  '剧毒': '剧毒',
  '火球': '灼烧',
  '诅咒': '剧毒',
  '诅咒爆发': '剧毒',
};
const CONTROL_DESC_MAP: Record<string, string> = {
  '冻结': '冻结',
  '虚弱': '虚弱',
  '易伤': '易伤',
  '碎裂诅咒': '易伤',
  '诅咒注入': '虚弱',
  '诅咒锻造': '虚弱',
};

/**
 * 把单个 PatternAction 翻译成玩家可读的一行（按 combatType 解读真实效果）
 *
 * 关键映射（与 enemyAI / enemyActionDispatch 完全同步）：
 *   warrior / guardian / ranger 的"攻击"  → 真实直伤（带 description 风味词）
 *   caster / priest 的"攻击"               → 在 enemyAI 派发为技能，不直伤
 *   "防御"（任何敌人）                       → 自加护甲
 *   "技能"+description → 查 DOT/控制字典 / 护甲祝福 / 治疗 / 召唤
 */
function describeAction(e: EnemyConfig, a: { type: string; baseValue: number; description?: string }): string {
  const isPriestOrCaster = e.combatType === 'priest' || e.combatType === 'caster';
  const desc = a.description?.trim();

  // 防御
  if (a.type === '防御') {
    return `[守] 自身 +${a.baseValue} 护甲${desc ? `（${desc}）` : ''}`;
  }

  // 攻击：caster/priest 实际不直伤，按技能/风味词处理
  if (a.type === '攻击') {
    if (isPriestOrCaster) {
      if (desc) {
        if (DOT_DESC_MAP[desc]) return `[法] 【${desc}】→ ${DOT_DESC_MAP[desc]} ×${a.baseValue}`;
        if (CONTROL_DESC_MAP[desc]) return `[法] 【${desc}】→ ${CONTROL_DESC_MAP[desc]} ×${a.baseValue}`;
        return `[法] 【${desc}】（仅演出，无直伤）`;
      }
      return `[法] 蓄力（无直伤）`;
    }
    // 战士 / 守护 / 弓手：真实直伤
    if (e.combatType === 'ranger') return `[攻] 远程 ${a.baseValue} 伤害 + 追击${desc ? `（${desc}）` : ''}`;
    if (e.combatType === 'guardian') return `[攻] 挥击 ${a.baseValue} 伤害${desc ? `（${desc}）` : ''}`;
    return `[攻] 挥击 ${a.baseValue} 伤害${desc ? `（${desc}）` : ''}`;
  }

  // 技能：按 description 字典翻译
  if (a.type === '技能') {
    if (!desc) return `[技] 施放技能 ×${a.baseValue}`;
    const isMartial = e.combatType === 'warrior' || e.combatType === 'ranger' || e.combatType === 'guardian';
    if (isMartial) {
      const halfVal = Math.max(1, Math.floor(a.baseValue / 2));
      if (DOT_DESC_MAP[desc]) {
        const label = DOT_DESC_MAP[desc] === 'burn' ? '灼烧' : '毒素';
        return `[技] 普攻 + 附加【${desc}】→ ${label} +${halfVal} 层`;
      }
      if (CONTROL_DESC_MAP[desc]) {
        const label = CONTROL_DESC_MAP[desc] === 'freeze' ? '冻结' : CONTROL_DESC_MAP[desc] === 'weak' ? '虚弱' : '易伤';
        const turnHint = CONTROL_DESC_MAP[desc] === 'freeze' ? '（1 回合）' : '（2 回合）';
        return `[技] 普攻 + 附加【${desc}】→ ${label} 1 层${turnHint}`;
      }
    }
    if (DOT_DESC_MAP[desc]) return `[技] ${DOT_DESC_MAP[desc]} ×${a.baseValue}（持续）`;
    if (CONTROL_DESC_MAP[desc]) {
      const stacksStr = a.baseValue > 1 ? `${a.baseValue} 层` : `1 层`;
      const turnHint = desc === '冻结' ? '（当回合无法出牌）' : '';
      return `[技] ${CONTROL_DESC_MAP[desc]} ${stacksStr}${turnHint}`;
    }
    if (desc === '护甲祝福') return `[技] 给友军 +${a.baseValue} 护甲`;
    if (desc.includes('治疗')) return `[技] 治疗友军 ${a.baseValue} HP`;
    if (desc.includes('召唤')) return `[技] 召唤增援 ×${a.baseValue}`;
    if (desc.includes('诅咒') && (desc.includes('骰子') || desc.includes('cracked') || desc.includes('cursed'))) {
      return `[技] 塞 ${a.baseValue} 颗诅咒骰子进你的骰子库`;
    }
    return `[技] 【${desc}】×${a.baseValue}`;
  }

  return `${a.type} ${a.baseValue}${desc ? `·${desc}` : ''}`;
}

/**
 * 列出 phases.actions 配置（路线 B 后真实生效，每回合按 battleTurn 轮播）。
 * 多阶段（hpThreshold）的怪会显示"阶段 1 / 阶段 2"分组。
 */
function describePhases(e: EnemyConfig): string[] {
  const lines: string[] = [];
  const multiPhase = e.phases.length > 1;
  e.phases.forEach((p, idx) => {
    if (multiPhase) {
      const tag = p.hpThreshold != null
        ? `◆ 阶段 ${idx + 1}（HP ≥ ${Math.round(p.hpThreshold * 100)}%）`
        : `◆ 阶段 ${idx + 1}（HP 低于上述阈值）`;
      lines.push(tag);
    }
    // 把 actions 压成一行循环表达式，节省空间
    const actionStr = p.actions.map(a => describeAction(e, a)).join('  →  ');
    lines.push(actionStr);
    if (p.actions.length > 1) {
      lines.push(`  └ 以上 ${p.actions.length} 步循环`);
    }
  });
  return lines;
}

/**
 * 列出实战机制（玩家语言，避免 archetype 专业词）
 */
function describeTraits(e: EnemyConfig): string[] {
  const lines: string[] = [];
  const a = e.archetype;

  if (e.combatType === 'warrior') {
    if (a === 'paladin') {
      lines.push('· 攻击伤害稳定 +20%，但无法被激怒');
    } else if (a === 'striker') {
      lines.push('· 血量掉到 70% 以下后进入爆发，攻击伤害 +50%');
    } else if (a === 'berserker') {
      lines.push('· 你每打他一次，他攻击力 +40%（最多累 4 次，变成原 2.6 倍）');
      lines.push('· 【复仇】每死 1 个队友，他攻击力 +50%（无上限，越孤立越恐怖）');
    } else {
      lines.push('· 你每打他一次，他攻击力 +25%（最多累 4 次，变成原 2 倍）');
    }
  } else if (e.combatType === 'guardian') {
    if (a === 'bulwark') {
      lines.push('· 每次防御获得双倍护甲，但永远不激怒');
    } else {
      lines.push('· 他每防御 1 回合，下次攻击伤害 +60%（最多累 3 次，变成原 2.8 倍）');
      lines.push('· 攻击后该怒气清零，重新开始累积');
    }
  } else if (e.combatType === 'ranger') {
    lines.push('· 远程攻击，每回合一次主攻 + 一次追击');
    lines.push('· 攻击次数越多，后续伤害越高');
    if (a === 'marksman') lines.push('· 命中次数翻倍叠加 + 单发 +30%');
    if (a === 'trapper') lines.push('· 每次攻击附带 1 层剧毒');
  } else if (e.combatType === 'caster') {
    lines.push('· 不直接造成攻击伤害，但会给你上持续伤害（毒/灼烧）');
    if (a === 'pyromancer') lines.push('· 每叠 1 层灼烧，持续伤害放大 +50%（最多 2.5 倍）');
    else if (a === 'toxicologist') lines.push('· 每叠 1 层毒，持续伤害放大 +40%（最多 2.5 倍）');
    else if (a === 'cursemaster') lines.push('· 不放持续伤害，而是给你上"毒 + 虚弱"双诅咒');
    else lines.push('· 每叠 1 层持续伤害，整体放大 +40%（最多 2.5 倍）');
  } else if (e.combatType === 'priest') {
    lines.push('· 不直接造成伤害，只治疗友军/给你上减益');
    if (a === 'inquisitor') lines.push('· 不治疗，50% 概率直接给你上"虚弱 + 易伤"');
    else lines.push('· 优先治疗友军 → 自疗 → 给友军套护甲 → 给你上减益');
    lines.push('· 每 2 回合累 1 层圣怒，让减益持续更久 + 治疗/护甲更强');
  }

  return lines;
}

export function describeEnemy(e: EnemyConfig): { sections: { title: string; lines: string[] }[] } {
  const sections: { title: string; lines: string[] }[] = [];

  // 基础信息
  const ct = COMBAT_LABELS[e.combatType];
  sections.push({
    title: '基础信息',
    lines: [
      `种类：${ct?.full || e.combatType}`,
      `类别：${e.category === 'boss' ? (e.bossRank === 'final' ? '终极 BOSS' : '中层 BOSS') : e.category === 'elite' ? '精英' : '普通'}`,
      `生命：${e.baseHp}　基础攻击：${e.baseDmg}`,
    ],
  });

  // 子类型
  if (e.archetype && ARCHETYPE_DESC[e.archetype]) {
    sections.push({ title: '种族特性', lines: [ARCHETYPE_DESC[e.archetype]] });
  }

  // 行为序列（按 phases 配置真实轮播）
  const phaseLines = describePhases(e);
  if (phaseLines.length > 0) {
    sections.push({ title: '战斗行为', lines: phaseLines });
  }

  // 实战机制（trait/archetype 加成）
  const traitLines = describeTraits(e);
  if (traitLines.length > 0) {
    sections.push({ title: '实战机制', lines: traitLines });
  }

  // 召唤
  if (e.summons) {
    const s = e.summons;
    const minionName = NORMAL_ENEMIES.find(x => x.id === s.minionId)?.name || s.minionId;
    const lines: string[] = [];
    lines.push(`· 每 ${s.interval} 回合召唤 ${s.count || 1} 只【${minionName}】`);
    if (s.maxTotal) lines.push(`· 最多召唤 ${s.maxTotal} 次`);
    if (s.hpThreshold != null) lines.push(`· 仅在 HP < ${Math.round(s.hpThreshold * 100)}% 后开始召唤`);
    sections.push({ title: '召唤机制', lines });
  }

  // 复活/分裂
  if (e.revive) {
    const r = e.revive;
    const lines: string[] = [];
    if (r.splitInto && r.splitInto > 0) {
      const minionName = r.splitMinionId
        ? NORMAL_ENEMIES.find(x => x.id === r.splitMinionId)?.name || r.splitMinionId
        : '同种';
      lines.push(`· 死亡时分裂为 ${r.splitInto} 只【${minionName}】`);
      lines.push(`· 每只携带原 HP × ${Math.round(r.reviveHpRatio * 100)}% / ${r.splitInto}`);
    } else {
      lines.push(`· 死亡时原地复活，回血至 ${Math.round(r.reviveHpRatio * 100)}% HP`);
    }
    lines.push('· 仅触发一次');
    sections.push({ title: r.splitInto ? '分裂机制' : '复活机制', lines });
  }

  return { sections };
}

/* ===== 行渲染 ===== */
const renderRow = (e: EnemyConfig, onPick: (e: EnemyConfig) => void) => {
  const ct = COMBAT_LABELS[e.combatType] || { label: '?', color: '#888', full: '' };
  const catColor = CAT_COLORS[e.category] || '#888';
  return (
    <button
      key={e.id}
      onClick={() => onPick(e)}
      className="w-full flex items-center gap-2 p-1.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[var(--pixel-gold)] transition-colors text-left"
      style={{ borderRadius: '2px' }}
    >
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        {hasSpriteData(e.name) ? (
          <PixelSprite name={e.name} size={e.category === 'boss' ? 4 : e.category === 'elite' ? 3.5 : 3} />
        ) : (
          <div className="w-6 h-6 bg-[var(--dungeon-panel)] border border-[var(--dungeon-panel-border)] flex items-center justify-center text-[8px] text-[var(--dungeon-text-dim)]" style={{ borderRadius: '2px' }}>?</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-bold text-[11px] text-[var(--dungeon-text-bright)]">{e.name}</span>
          <span className="text-[8px] font-bold px-1 py-0 border" style={{ borderRadius: '2px', color: ct.color, borderColor: ct.color }}>{ct.label}</span>
          <span className="text-[8px] font-bold" style={{ color: catColor }}>
            {e.category === 'boss' ? (e.bossRank === 'final' ? '终BOSS' : '中BOSS') : e.category === 'elite' ? '精英' : '普通'}
          </span>
          {e.archetype && (
            <span className="text-[8px] font-bold px-1 py-0 border border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)]" style={{ borderRadius: '2px' }}>
              {(ARCHETYPE_DESC[e.archetype] || '').match(/【(.+?)】/)?.[1] || e.archetype}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[9px] text-[var(--dungeon-text-dim)]">
          <span>HP {e.baseHp}</span>
          <span>ATK {e.baseDmg}</span>
          <span className="text-[var(--pixel-gold-light)]">▶ 详情</span>
        </div>
      </div>
    </button>
  );
};

/* ===== 详情弹窗 ===== */
const EnemyDetailModal: React.FC<{ enemy: EnemyConfig | null; onClose: () => void }> = ({ enemy, onClose }) => {
  const desc = useMemo(() => enemy ? describeEnemy(enemy) : null, [enemy]);
  return (
    <AnimatePresence>
      {enemy && desc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ background: 'rgba(4,3,6,0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="pixel-panel w-full max-w-sm mx-4 overflow-hidden"
            style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between p-3 bg-[var(--dungeon-panel)] border-b-2 border-[var(--dungeon-panel-border)]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                  {hasSpriteData(enemy.name) ? <PixelSprite name={enemy.name} size={3} /> : null}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-[var(--dungeon-text-bright)] pixel-text-shadow truncate">{enemy.name}</h3>
                  <div className="text-[9px] text-[var(--dungeon-text-dim)]">{CHAPTER_CONFIG.chapterNames[(enemy.chapter || 1) - 1]}</div>
                </div>
              </div>
              <button onClick={onClose} className="p-1 hover:opacity-70 shrink-0"><PixelClose size={2} /></button>
            </div>
            {/* 内容 */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
              {desc.sections.map((sec, si) => (
                <div key={si}>
                  <div className="text-[10px] font-bold text-[var(--pixel-gold-light)] tracking-wider mb-1">— {sec.title} —</div>
                  <div className="space-y-1">
                    {sec.lines.map((ln, li) => renderEnemyLine(ln, li))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ===== 主面板 ===== */
export const EnemyBestiary: React.FC<Props> = ({ visible, onClose }) => {
  const [tab, setTab] = useState(1);
  const [picked, setPicked] = useState<EnemyConfig | null>(null);
  const allEnemies = [...NORMAL_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];
  const chapterEnemies = allEnemies.filter(e => e.chapter === tab);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'rgba(4,3,6,0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="pixel-panel w-full max-w-sm mx-4 overflow-hidden"
            style={{ maxHeight: '80dvh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-[var(--dungeon-panel)] border-b-2 border-[var(--dungeon-panel-border)]">
              <h3 className="text-sm font-black text-[var(--dungeon-text-bright)] pixel-text-shadow">敌人图鉴</h3>
              <button onClick={onClose} className="p-1 hover:opacity-70"><PixelClose size={2} /></button>
            </div>

            {/* Chapter tabs — [2026-05-09] 改 grid-cols-5 平均分配，按钮 min-h 撑满 */}
            <div className="grid grid-cols-5 gap-1 p-2 bg-[var(--dungeon-bg)] border-b border-[var(--dungeon-panel-border)]">
              {CHAPTER_CONFIG.chapterNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setTab(i + 1)}
                  className={`flex items-center justify-center text-[10px] font-bold border transition-colors leading-tight ${
                    tab === i + 1
                      ? 'bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border-[var(--pixel-gold)]'
                      : 'bg-[var(--dungeon-panel)] text-[var(--dungeon-text-dim)] border-[var(--dungeon-panel-border)] hover:text-[var(--dungeon-text)]'
                  }`}
                  style={{ borderRadius: '2px', minHeight: '28px', padding: '4px 2px' }}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Enemy list */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1.5" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
              {chapterEnemies.filter(e => e.category === 'normal').length > 0 && (
                <>
                  <div className="text-[8px] text-[var(--dungeon-text-dim)] font-bold tracking-wider mt-1 mb-0.5">— 普通敌人 —</div>
                  {chapterEnemies.filter(e => e.category === 'normal').map(e => renderRow(e, setPicked))}
                </>
              )}
              {chapterEnemies.filter(e => e.category === 'elite').length > 0 && (
                <>
                  <div className="text-[8px] text-[var(--pixel-orange)] font-bold tracking-wider mt-2 mb-0.5">— 精英敌人 —</div>
                  {chapterEnemies.filter(e => e.category === 'elite').map(e => renderRow(e, setPicked))}
                </>
              )}
              {chapterEnemies.filter(e => e.category === 'boss').length > 0 && (
                <>
                  <div className="text-[8px] text-[var(--pixel-purple)] font-bold tracking-wider mt-2 mb-0.5">— BOSS —</div>
                  {chapterEnemies.filter(e => e.category === 'boss').map(e => renderRow(e, setPicked))}
                </>
              )}
              {chapterEnemies.length === 0 && (
                <div className="text-center text-[var(--dungeon-text-dim)] text-[10px] py-8">该章节暂无敌人数据</div>
              )}
            </div>
          </motion.div>

          {/* 详情子弹窗 */}
          <EnemyDetailModal enemy={picked} onClose={() => setPicked(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
