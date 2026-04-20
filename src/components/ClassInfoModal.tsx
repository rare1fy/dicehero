/**
 * ClassInfoModal.tsx — 职业信息弹窗
 * 显示职业机制说明 + 被动技能 + 全部专属骰子列表
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CLASS_DEFS, type ClassId } from '../data/classes';
import { PixelClose } from './PixelIcons';
import { ClassIcon } from './ClassIcons';
import { formatDescription } from '../utils/richText';
import { ClassDiceList, ClassSkillList } from './ClassDiceList';

interface ClassInfoModalProps {
  visible: boolean;
  onClose: () => void;
  classId?: string;
}

export const ClassInfoModal: React.FC<ClassInfoModalProps> = ({ visible, onClose, classId }) => {
  if (!classId || !CLASS_DEFS[classId as ClassId]) return null;

  const classDef = CLASS_DEFS[classId as ClassId];

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
              style={{ background: `linear-gradient(180deg, ${classDef.colorDark}40 0%, var(--dungeon-bg-light) 100%)` }}
            >
              <div className="flex items-center gap-2">
                <div className="shrink-0"><ClassIcon classId={classId} size={2} /></div>
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
              <div className="text-[10px] text-[var(--dungeon-text)] leading-relaxed">{classDef.description}</div>

              {/* 职业技能 */}
              <ClassSkillList classId={classId} />

              {/* 骰子列表 */}
              <ClassDiceList classId={classId} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
