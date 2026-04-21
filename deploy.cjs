/**
 * Dice Hero 部署脚本 v5.1
 *
 * 用法: node deploy.cjs
 *
 * 流程:
 *   [E1] TSC 编译检查   -> npx tsc --noEmit
 *   [E2] 行数硬闸       -> 扫描 src 下 ts/tsx, 单文件 <= 600 行
 *   [1]  Vite 构建      -> 单文件 bundle
 *   [2]  资源内联       -> 字体/音频/移动端优化
 *   [3]  推送到 master  -> GitHub Pages 从 master 根目录读取
 *
 * 规则来源: C:\\Users\\slimboiliu\\.agent\\context\\RULES.md 铁律 E
 * 禁用 emoji, 统一使用 [PASS]/[WARN]/[ERROR]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, 'src');
const MAX_LINES = 600;
const EXEMPT_TAG = '[RULES-B2-EXEMPT]';

// ---------- 门禁 E1: TSC 编译检查 ----------
function gateTsc() {
  console.log('[E1] npx tsc --noEmit ...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: __dirname });
    console.log('[E1] [PASS] TSC 零错误');
  } catch (err) {
    console.error('[E1] [ERROR] TSC 失败，中止部署');
    process.exit(1);
  }
}

// ---------- 门禁 E2: 行数硬闸 ----------
function gateLineLimit() {
  console.log(`[E2] 扫描 src 下 ts/tsx 行数 (上限 ${MAX_LINES}) ...`);
  const violations = [];

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(name)) continue;
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(EXEMPT_TAG)) continue;
      const lines = content.split('\n').length;
      if (lines > MAX_LINES) {
        violations.push({ file: path.relative(__dirname, full), lines });
      }
    }
  }

  if (!fs.existsSync(SRC_DIR)) {
    console.error('[E2] [ERROR] 未找到 src 目录');
    process.exit(1);
  }
  walk(SRC_DIR);

  if (violations.length > 0) {
    console.error('[E2] [ERROR] 以下文件超过 600 行硬上限，中止部署：');
    violations.forEach(v => console.error(`       ${v.file}  (${v.lines} 行)`));
    console.error(`       若为纯数据/SVG/配置，顶部添加 // ${EXEMPT_TAG} 理由`);
    process.exit(1);
  }
  console.log('[E2] [PASS] 行数全部达标');
}

// ---------- 构建与推送 ----------
function buildVite() {
  console.log('[1/3] 构建项目 ...');
  try {
    execSync('npx vite build --mode singlefile', { stdio: 'inherit', cwd: __dirname });
  } catch (e) {
    console.error('[ERROR] Vite 构建失败');
    process.exit(1);
  }
  console.log('[1/3] [PASS] Vite 构建完成');
}

function inlineAssets() {
  console.log('[2/3] 内联资源 (字体 + 音频 + 移动端优化) ...');
  try {
    execSync('node build-mobile.cjs', { stdio: 'inherit', cwd: __dirname });
  } catch (e) {
    console.error('[ERROR] 资源内联失败');
    process.exit(1);
  }
  console.log('[2/3] [PASS] 资源内联完成');
}

function pushToPages() {
  console.log('[3/3] 推送到 GitHub Pages ...');
  try {
    const originUrl = execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
      cwd: __dirname,
    }).trim();
    if (!originUrl) throw new Error('未找到 remote.origin');

    fs.copyFileSync(
      path.join(__dirname, 'dicehero-mobile.html'),
      path.join(__dirname, 'index.html')
    );

    execSync('git add index.html -f', { cwd: __dirname });
    try {
      execSync('git commit -m "部署: 自动更新 [skip ci]"', { cwd: __dirname });
    } catch (_) {
      // 无改动时 commit 会报错，忽略
    }
    execSync(`git push ${originUrl} master`, { stdio: 'inherit', cwd: __dirname });

    console.log('[3/3] [PASS] 推送完成');
  } catch (e) {
    console.error('[ERROR] 推送失败：检查网络或 remote 配置');
    console.error(e.message);
    process.exit(1);
  }
}

function printSummary() {
  const sizeMB = (
    fs.statSync(path.join(__dirname, 'dicehero-mobile.html')).size /
    1024 /
    1024
  ).toFixed(2);
  console.log('\n----------------------------------------');
  console.log('[PASS] 部署完成');
  console.log(`  文件大小: ${sizeMB} MB`);
  console.log(`  在线地址: https://rare1fy.github.io/dicehero/`);
  console.log(`  生效时间: 30 秒 ~ 2 分钟`);
  console.log('----------------------------------------');
}

// ---------- 主流程 ----------
(function main() {
  console.log('====== Dice Hero 部署 v5.1 ======\n');
  gateTsc();
  gateLineLimit();
  buildVite();
  inlineAssets();
  pushToPages();
  printSummary();
})();
