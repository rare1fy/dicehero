/**
 * 全局类型补丁 — 消除 `imageRendering: 'pixelated' as any` 的需要
 * 
 * React.CSSProperties 默认不包含 imageRendering（非标准属性），
 * 通过此声明扩展，所有组件可直接使用字符串赋值而无需 as any。
 */

declare module 'react' {
  interface CSSProperties {
    imageRendering?: string;
    WebkitOverflowScrolling?: string;
  }
}
