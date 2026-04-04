/**
 * 战斗辅助纯函数
 */
import type { Enemy } from '../types/game';

/**
 * 检查敌人是否全部死亡
 */
export const areAllEnemiesDead = (enemies: Enemy[]): boolean => {
  return enemies.every(e => e.hp <= 0);
};

/**
 * 获取存活的敌人
 */
export const getAliveEnemies = (enemies: Enemy[]): Enemy[] => {
  return enemies.filter(e => e.hp > 0);
};

/**
 * 计算毒伤后的存活敌人（预计算，避免 stale state）
 */
export const getPoisonSurvivors = (enemies: Enemy[]): Enemy[] => {
  return enemies.filter(e => {
    if (e.hp <= 0) return false;
    const poison = e.statuses.find(s => s.type === 'poison');
    if (poison && poison.value > 0) return e.hp - poison.value > 0;
    return true;
  });
};

/**
 * 计算敌人的有效攻击力（含buff/debuff）
 */
export const getEffectiveEnemyDamage = (enemy: Enemy, baseDmg: number): number => {
  let dmg = baseDmg;
  const str = enemy.statuses.find(s => s.type === 'strength');
  if (str) dmg += str.value;
  const weak = enemy.statuses.find(s => s.type === 'weak');
  if (weak) dmg = Math.floor(dmg * 0.75);
  return Math.max(1, dmg);
};

/**
 * 计算玩家受到的实际伤害（含护盾）
 */
export const calculateDamageAfterShield = (
  rawDmg: number,
  shield: number
): { actualDmg: number; remainingShield: number } => {
  if (shield >= rawDmg) {
    return { actualDmg: 0, remainingShield: shield - rawDmg };
  }
  return { actualDmg: rawDmg - shield, remainingShield: 0 };
};
