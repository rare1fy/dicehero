const fs = require('fs');
let html = fs.readFileSync('六面决界v1.0.html', 'utf8');

// 添加移动端优化meta
const mobileMeta = [
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="theme-color" content="#1a1a2e">',
].join('\n');

const mobileCss = `<style>
html, body { touch-action: manipulation; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
* { -webkit-overflow-scrolling: touch; }
</style>`;

// 在</head>之前插入
html = html.replace('</head>', mobileMeta + '\n' + mobileCss + '\n</head>');

fs.writeFileSync('六面决界v1.0.html', html);
const sizeMB = (fs.statSync('六面决界v1.0.html').size / 1024 / 1024).toFixed(2);
console.log('Mobile optimization added. Size: ' + sizeMB + ' MB');
