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
import { CHAPTER_CONFIG } from '../config';

const COMBAT_LABELS: Record<string, { label: string; color: string; full: string }> = {
  warrior:  { label: '战', color: 'var(--pixel-red)',    full: '战士（直接攻击 + 受伤累怒）' },
  guardian: { label: '盾', color: 'var(--pixel-blue)',   full: '守护者（攻防交替 + 防御积怒）' },
  ranger:   { label: '弓', color: 'var(--pixel-green)',  full: '弓手（远程 + 多段命中）' },
  caster:   { label: '术', color: 'var(--pixel-purple)', full: '法师（DOT 输出 + 持续放大）' },
  priest:   { label: '牧', color: 'var(--pixel-gold)',   full: '牧师（治疗 / 强化盟友 / 减益玩家）' },
};

const CAT_COLORS: Record<string, string> = {
  normal: 'var(--dungeon-text-dim)',
  elite:  'var(--pixel-orange)',
  boss:   'var(--pixel-purple)',
};

// archetype → 一行说明
const ARCHETYPE_DESC: Record<string, string> = {
  berserker:    '【狂战】受到伤害后攻击力倍增（最高 ×2.0），越打越凶',
  striker:      '【突袭】HP < 70% 时进入爆发，普攻 ×1.5',
  paladin:      '【圣骑】偶数回合自动防御 + 攻击 ×1.2，不积血怒',
  marksman:     '【神射】每次攻击命中 +2，主攻 ×1.3',
  trapper:      '【陷阱】每次攻击附带 1 层剧毒',
  hunter:       '【猎手】基础弓手，无特殊修正',
  bulwark:      '【铁壁】防御获双倍护甲，不积怒（纯肉盾）',
  enforcer:     '【执法】防御后下次攻击 +60% 伤害（最高 +180%）',
  pyromancer:   '【焚化】80% 概率灼烧；DOT 放大 ×1.5/层',
  toxicologist: '【毒师】80% 概率毒雾；DOT 放大 ×1.4/层',
  cursemaster:  '【咒师】100% 释放诅咒（毒+虚弱），不放纯 DOT',
  healer:       '【治疗】优先治疗友军 → 自疗 → 护甲祝福 → 减益玩家',
  inquisitor:   '【审判】不治疗，50% 概率对玩家施加 虚弱+易伤 双 debuff',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

/* ===== 行为描述生成 ===== */

/**
 * 列出 phases.actions 配置（路线 B 后真实生效，每回合按 battleTurn 轮播）。
 * 多阶段（hpThreshold）的怪会显示"阶段 1 / 阶段 2"分组。
 */
function describePhases(e: EnemyConfig): string[] {
  const lines: string[] = [];
  e.phases.forEach((p, idx) => {
    const tag = p.hpThreshold != null
      ? `阶段 ${idx + 1}（HP ≤ ${Math.round(p.hpThreshold * 100)}%）`
      : e.phases.length > 1 ? `阶段 ${idx + 1}（其余）` : '行为序列（按回合轮播）';
    lines.push(tag);
    for (const a of p.actions) {
      const desc = a.description ? `·${a.description}` : '';
      if (a.type === '攻击') lines.push(`  · 攻击 ${a.baseValue}${desc}`);
      else if (a.type === '防御') lines.push(`  · 防御 ${a.baseValue}${desc}`);
      else lines.push(`  · 技能 ${a.baseValue}${desc}`);
    }
  });
  return lines;
}

/**
 * 列出实战机制（trait + archetype 等"phases.actions 之外的修正"）
 */
function describeTraits(e: EnemyConfig): string[] {
  const lines: string[] = [];
  const a = e.archetype;

  if (e.combatType === 'warrior') {
    if (a === 'paladin') {
      lines.push('· paladin：偶数回合自动改为防御');
      lines.push('· 攻击伤害 ×1.2（不积血怒）');
    } else if (a === 'striker') {
      lines.push('· striker：HP < 70% 后攻击 ×1.5');
    } else if (a === 'berserker') {
      lines.push('· berserker：受到伤害后【血怒】+1 层（每层 +40% 攻击，最高 ×2.0）');
    } else {
      lines.push('· 受到伤害后【血怒】+1 层（每层 +25% 攻击，最高 ×2.0）');
    }
  } else if (e.combatType === 'guardian') {
    if (a === 'bulwark') {
      lines.push('· bulwark：防御获得双倍护甲，但不积怒气');
    } else {
      lines.push('· 防御后【守护怒气】+1 层（每层让下次攻击 +60%，最高 ×2.8 单击）');
      lines.push('· 攻击后怒气清零');
    }
  } else if (e.combatType === 'ranger') {
    lines.push('· 每回合主攻 + 一次追击；每攻击 attackCount +2 让后续伤害递增');
    if (a === 'marksman') lines.push('· marksman：attackCount 翻倍 + 单发 ×1.3');
    if (a === 'trapper') lines.push('· trapper：每次攻击附带 1 层剧毒');
  } else if (e.combatType === 'caster') {
    lines.push('· 不直接造成攻击伤害');
    if (a === 'pyromancer') lines.push('· pyromancer：DOT 放大 ×1.5/层（封顶 ×2.5）');
    else if (a === 'toxicologist') lines.push('· toxicologist：DOT 放大 ×1.4/层（封顶 ×2.5）');
    else if (a === 'cursemaster') lines.push('· cursemaster：始终释放诅咒（毒+虚弱）');
    else lines.push('· DOT 放大 ×1.4/层（封顶 ×2.5）');
  } else if (e.combatType === 'priest') {
    lines.push('· 不直接造成攻击伤害');
    if (a === 'inquisitor') lines.push('· inquisitor：跳过治疗/祝福，50% 概率双 debuff（虚弱 + 易伤）');
    else lines.push('· 优先级：治疗友军 → 自疗 → 护甲祝福 → debuff');
    lines.push('· 每 2 回合【圣怒】+1 层（提升 debuff 持续 / 护甲祝福 / 治疗量）');
  }

  return lines;
}

function describeEnemy(e: EnemyConfig): { sections: { title: string; lines: string[] }[] } {
  const sections: { title: string; lines: string[] }[] = [];

  // 基础信息
  const ct = COMBAT_LABELS[e.combatType];
  sections.push({
    title: '基础信息',
    lines: [
      `职业：${ct?.full || e.combatType}`,
      `等级：${e.category === 'boss' ? (e.bossRank === 'final' ? '终极 BOSS' : '中层 BOSS') : e.category === 'elite' ? '精英' : '普通'}`,
      `HP：${e.baseHp}　基础攻击：${e.baseDmg}`,
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
                  <div className="space-y-0.5 text-[10px] text-[var(--dungeon-text)] leading-relaxed">
                    {sec.lines.map((ln, li) => <div key={li}>{ln}</div>)}
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
