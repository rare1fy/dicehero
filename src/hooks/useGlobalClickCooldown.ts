/**
 * useGlobalClickCooldown.ts — 全局按钮点击冷却
 *
 * 在 document 上添加 capture-phase click 监听器，
 * 同一按钮在 COOLDOWN_MS 内的重复点击将被拦截（stopPropagation）。
 *
 * 优点：
 * - 不需要修改任何子组件的 onClick
 * - 覆盖所有 <button> 和 <motion.button>（渲染为 <button>）
 * - 与 React 18 事件委托兼容（capture-phase 在 React root listener 之前触发）
 */
import { useEffect } from 'react';

const COOLDOWN_MS = 500;
const DATA_ATTR = 'data-last-click';

export function useGlobalClickCooldown() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 只拦截按钮元素的点击
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (!button) return;

      // 已禁用的按钮不需要拦截（disabled 按钮本身不触发 click）
      if (button.disabled) return;

      const now = Date.now();
      const lastClick = parseInt(button.getAttribute(DATA_ATTR) || '0', 10);

      if (now - lastClick < COOLDOWN_MS) {
        // 冷却期内：阻止事件传播到 React 事件委托
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // 首次点击：记录时间戳，放行
      button.setAttribute(DATA_ATTR, now.toString());
    };

    // capture-phase: 在 React root listener 之前触发
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
}
