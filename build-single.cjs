const fs = require('fs');
const path = require('path');

const distDir = 'dist';
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// 1. 内联字体文件（CSS中的url引用）
html = html.replace(/url\(["']?([^"')\s]+\.(woff2?|ttf|otf))["']?\)/gi, (match, filePath) => {
  // 处理相对路径
  const fp = path.join(distDir, filePath);
  if (fs.existsSync(fp)) {
    const base64 = fs.readFileSync(fp).toString('base64');
    const ext = path.extname(filePath).slice(1);
    const mimeMap = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };
    const mime = mimeMap[ext] || 'application/octet-stream';
    console.log(`  Inlined font: ${filePath} (${Math.round(fs.statSync(fp).size / 1024)}KB)`);
    return `url(data:${mime};base64,${base64})`;
  }
  return match;
});

// 2. 内联MP3文件（JS中的字符串引用）
// vite把MP3 import转成了路径字符串，在JS中是类似 "/DiceBattle-Normal.mp3" 或 "./DiceBattle-Normal.mp3"
const mp3Files = fs.readdirSync(distDir).filter(f => f.endsWith('.mp3'));
mp3Files.forEach(mp3 => {
  const fp = path.join(distDir, mp3);
  const base64 = fs.readFileSync(fp).toString('base64');
  const dataUrl = `data:audio/mpeg;base64,${base64}`;
  
  // 替换各种可能的引用形式
  const patterns = [
    `"/${mp3}"`,
    `"./${mp3}"`,
    `"${mp3}"`,
    `'/${mp3}'`,
    `'./${mp3}'`,
    `'${mp3}'`,
  ];
  
  let replaced = false;
  patterns.forEach(pat => {
    if (html.includes(pat)) {
      html = html.split(pat).join(`"${dataUrl}"`);
      replaced = true;
    }
  });
  
  // 也处理带hash的文件名
  if (!replaced) {
    const baseName = mp3.replace('.mp3', '');
    const regex = new RegExp(`["'][^"']*${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*\\.mp3["']`, 'g');
    html = html.replace(regex, `"${dataUrl}"`);
    replaced = true;
  }
  
  console.log(`  Inlined MP3: ${mp3} (${Math.round(fs.statSync(fp).size / 1024)}KB) - ${replaced ? 'OK' : 'NOT FOUND'}`);
});

// 输出
const outputName = '六面决界v1.0.html';
fs.writeFileSync(outputName, html, 'utf8');
const sizeMB = (fs.statSync(outputName).size / 1024 / 1024).toFixed(2);
console.log(`\nDone! ${outputName} (${sizeMB} MB)`);
