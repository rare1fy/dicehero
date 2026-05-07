const fs = require('fs');
const path = require('path');

console.log('🎲 开始构建《6面勇士》移动端完整包...\n');

const distDir = path.join(__dirname, 'dist');
const outputFile = path.join(__dirname, 'dicehero-mobile.html');

let htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// [2026-05-07] 字体/音频都由 Vite 构建时通过 import/url() 打包内联到单文件 html，
// 本脚本不再做任何二次资源内联（之前会造成重复 + 浪费包体）。
console.log('📦 字体与音频：交由 Vite 单文件构建处理（vite-plugin-singlefile）');

// 添加移动端优化
console.log('📱 添加移动端优化...');
const mobileMeta = `<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#1a1a2e">
<style>
html, body { touch-action: manipulation; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
* { -webkit-overflow-scrolling: touch; }
</style>`;

htmlContent = htmlContent.replace('</head>', mobileMeta + '</head>');

// 写入最终文件
fs.writeFileSync(outputFile, htmlContent);

const stats = fs.statSync(outputFile);
console.log('\n✅ 构建完成！');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📄 输出文件: dicehero-mobile.html`);
console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`📍 文件路径: ${outputFile}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
