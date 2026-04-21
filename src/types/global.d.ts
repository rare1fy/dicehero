/**
 * 全局类型补丁 — 消除 imageRendering: 'pixelated' as any 的需要
 *
 * React.CSSProperties 默认不包含 imageRendering（非标准属性），
 * 通过此声明扩展，所有组件可直接使用字符串赋值而无需 as any。
 *
 * [ARCH-22 修复] 顶部的 import 'react'; 使本文件成为模块而非脚本，
 * 从而让 declare module 'react' 走 module augmentation 路径（合并）而非
 * ambient declaration 路径（替换），避免覆盖 @types/react 的命名空间。
 */

import 'react';

declare module 'react' {
  interface CSSProperties {
    imageRendering?: string;
    WebkitOverflowScrolling?: string;
  }
}
