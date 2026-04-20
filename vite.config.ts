import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isSingleFile = mode === 'singlefile';
  return {
    plugins: [
      react(), 
      tailwindcss(),
      ...(isSingleFile ? [viteSingleFile({ removeViteModuleLoader: true })] : [])
    ],
    base: './',  // 相对路径，确保离线打开HTML也能正常工作
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      ...(isSingleFile ? {
        // 单文件模式：小资源内联（阈值 400KB，排除 600KB+ 字体文件由 build-mobile.cjs 后处理）
        assetsInlineLimit: 409600,
        cssCodeSplit: false,
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          },
          // 排除字体文件：vite-plugin-singlefile 内联 base64 字体时
          // 文件名超过 Windows MAX_PATH(260) 导致 ENAMETOOLONG
          // 字体由 build-mobile.cjs 统一内联
          external: (id) => /\.(woff2|woff|ttf|otf|eot)$/i.test(id),
        }
      } : {})
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
