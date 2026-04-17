/**
 * 部署脚本：构建 → 生成单文件HTML → commit到master并push
 * 
 * 用法：node deploy.cjs
 * 
 * 原理：直接在 master 分支上提交 index.html（构建产物），
 *       GitHub Pages 从 master 根目录读取，无需 gh-pages 分支。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎲 开始部署《六面决界》...\n');

// Step 1: 构建 Vite 单文件
console.log('📦 [1/3] 构建项目...');
try {
  execSync('npx vite build --mode singlefile', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('❌ 构建失败！'); process.exit(1);
}
console.log('✓ Vite 构建完成\n');

// Step 2: 后处理 → 内联字体+音频+移动端优化
console.log('🎵 [2/3] 内联资源...');
try {
  execSync('node build-mobile.cjs', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('❌ 后处理失败！'); process.exit(1);
}
console.log('✓ 资源内联完成\n');

// Step 3: 提交 index.html 到 master 并推送
console.log('🚀 [3/3] 推送到 GitHub Pages...');
try {
  const originUrl = execSync('git config --get remote.origin.url', {
    encoding: 'utf8', cwd: __dirname
  }).trim();
  if (!originUrl) throw new Error('未找到 remote.origin');

  // 将构建产物复制为 index.html（Pages 入口）
  fs.copyFileSync(path.join(__dirname, 'dicehero-mobile.html'), path.join(__dirname, 'index.html'));

  // 提交 + 推送 master
  execSync('git add index.html -f', { cwd: __dirname });
  try { execSync('git commit -m "deploy: auto-update [skip ci]"', { cwd: __dirname }); } catch (_) {}
  execSync(`git push ${originUrl} master`, { stdio: 'inherit', cwd: __dirname });

  console.log('✓ 推送完成\n');
} catch (e) {
  console.error('❌ 推送失败！检查网络或 remote 配置');
  process.exit(1);
}

const sizeMB = (fs.statSync(path.join(__dirname, 'dicehero-mobile.html')).size / 1024 / 1024).toFixed(2);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 部署完成！');
console.log(`📄 文件大小: ${sizeMB} MB`);
console.log(`🔗 线上地址: https://rare1fy.github.io/dicehero/`);
console.log(`⏱  预计等待: 30秒~2分钟生效`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
