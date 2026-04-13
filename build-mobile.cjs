const fs = require('fs');
const path = require('path');

console.log('🎲 开始构建《6面勇士》移动端完整包...\n');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const outputFile = path.join(__dirname, 'dicehero-mobile.html');

let htmlContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// 1. 内联字体文件
console.log('📦 内联字体文件...');
const fontFiles = [
  { name: 'fusion-pixel-12px-monospaced-zh_hans.woff2', mime: 'font/woff2' },
  { name: 'fusion-pixel-12px-monospaced-latin.woff2', mime: 'font/woff2' },
  { name: 'AaWeiWeiDianZhenTi-2.ttf', mime: 'font/truetype' }
];

for (const font of fontFiles) {
  const fontPath = path.join(publicDir, 'fonts', font.name);
  if (fs.existsSync(fontPath)) {
    const fontData = fs.readFileSync(fontPath);
    const base64 = fontData.toString('base64');
    const dataUri = `data:${font.mime};base64,${base64}`;
    const originalPath = `/fonts/${font.name}`;
    htmlContent = htmlContent.split(originalPath).join(dataUri);
    console.log(`  ✓ ${font.name} (${(fontData.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`  ⚠ 字体文件不存在: ${font.name}`);
  }
}

// 2. 内联MP3音频文件
console.log('\n🎵 内联音频文件...');
const audioFiles = [
  { name: 'DiceBattle-Start.mp3', id: 'bgm-start' },
  { name: 'DiceBattle-Normal.mp3', id: 'bgm-battle' },
  { name: 'DiceBattle-Outside.mp3', id: 'bgm-explore' }
];

const audioDataUris = {};
for (const audio of audioFiles) {
  const audioPath = path.join(publicDir, audio.name);
  if (fs.existsSync(audioPath)) {
    const audioData = fs.readFileSync(audioPath);
    const base64 = audioData.toString('base64');
    const dataUri = `data:audio/mp3;base64,${base64}`;
    audioDataUris[audio.id] = dataUri;
    console.log(`  ✓ ${audio.name} (${(audioData.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`  ⚠ 音频文件不存在: ${audio.name}`);
  }
}

// 3. 注入音频脚本
console.log('\n🔧 修改音频引用...');

const audioInjectionScript = `<script>
window.__INLINE_AUDIO__ = {
  'DiceBattle-Start.mp3': '${audioDataUris['bgm-start'] || ''}',
  'DiceBattle-Normal.mp3': '${audioDataUris['bgm-battle'] || ''}',
  'DiceBattle-Outside.mp3': '${audioDataUris['bgm-explore'] || ''}'
};
(function() {
  const OriginalAudio = window.Audio;
  window.Audio = function(src) {
    if (src && window.__INLINE_AUDIO__[src]) {
      return new OriginalAudio(window.__INLINE_AUDIO__[src]);
    }
    return new OriginalAudio(src);
  };
  window.Audio.prototype = OriginalAudio.prototype;
})();
</script>`;

htmlContent = htmlContent.replace('</head>', audioInjectionScript + '</head>');

// 4. 添加移动端优化
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

// 5. 写入最终文件
fs.writeFileSync(outputFile, htmlContent);

const stats = fs.statSync(outputFile);
console.log('\n✅ 构建完成！');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📄 输出文件: dicehero-mobile.html`);
console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`📍 文件路径: ${outputFile}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
