/**
 * 部署脚本：构建 → 生成单文件HTML → push到GitHub Pages
 * 
 * 用法：node deploy.cjs
 * 
 * 前置条件：
 *   - npm install 已执行
 *   - git remote github 指向 GitHub 仓库（已配置）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎲 开始部署《六面决界》...\n');

// Step 1: 构建 Vite 单文件
console.log('📦 [1/4] 构建项目...');
try {
  execSync('npx vite build --mode singlefile', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('❌ 构建失败！'); process.exit(1);
}
console.log('✓ Vite 构建完成\n');

// Step 2: 后处理 → 内联字体+音频+移动端优化
console.log('🎵 [2/4] 内联资源...');
try {
  execSync('node build-mobile.cjs', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('❌ 后处理失败！'); process.exit(1);
}
console.log('✓ 资源内联完成\n');

// Step 3: 准备部署目录
console.log('📁 [3/4] 准备部署...');
const deployDir = path.join(__dirname, '.deploy');
if (fs.existsSync(deployDir)) fs.rmSync(deployDir, { recursive: true });
fs.mkdirSync(deployDir);
fs.copyFileSync(
  path.join(__dirname, 'dicehero-mobile.html'),
  path.join(deployDir, 'index.html')
);

// 初始化临时 git 仓库
execSync('git init', { cwd: deployDir });
execSync('git checkout -b gh-pages', { cwd: deployDir, stdio: 'pipe' });
execSync('git add index.html', { cwd: deployDir });
execSync('git commit -m "deploy: auto-update"', { cwd: deployDir, stdio: 'pipe' });
console.log('✓ 部署包准备完成\n');

// Step 4: Push 到 GitHub Pages（使用已配置的 remote）
console.log('🚀 [4/4] 推送到 GitHub Pages...');
const { execSync } = require('child_process');
try {
  // 从 origin 获取 push URL
  const originUrl = execSync('git config --get remote.origin.url', {
    encoding: 'utf8', cwd: __dirname
  }).trim();
  if (!originUrl) throw new Error('未找到 remote.origin，请先设置 git remote add origin <url>');
  execSync(
    `git push --force ${originUrl} gh-pages`,
    { stdio: 'inherit', cwd: deployDir }
  );
} catch (e) {
  console.error('❌ 推送失败！检查网络或 remote 配置');
  process.exit(1);
}

// 清理
fs.rmSync(deployDir, { recursive: true });

const sizeMB = (fs.statSync(path.join(__dirname, 'dicehero-mobile.html')).size / 1024 / 1024).toFixed(2);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 部署完成！');
console.log(`📄 文件大小: ${sizeMB} MB`);
console.log(`🔗 线上地址: https://rare1fy.github.io/dicehero/`);
console.log(`⏱  预计等待: 30秒~2分钟生效`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
