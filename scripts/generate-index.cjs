const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IGNORE_DIRS = ['node_modules', 'dist', '.git', '__tests__', '__mocks__'];
const INDEX_EXTENSIONS = ['.ts', '.tsx'];

function getAllFiles(dir, baseDir) {
  baseDir = baseDir || '';
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, relativePath));
    } else if (INDEX_EXTENSIONS.some(function(ext) { return entry.name.endsWith(ext); })) {
      results.push({ fullPath: fullPath, relativePath: relativePath.replace(/\\/g, '/') });
    }
  }
  return results;
}

function extractExports(content, filePath) {
  const result = { named: [], default: null, types: [], interfaces: [], components: [], functions: [] };
  const defaultMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  if (defaultMatch) result.default = defaultMatch[1];
  var m;
  const namedRe = /export\s+(?:const|let|var|function|class|enum)\s+(\w+)/g;
  while ((m = namedRe.exec(content)) !== null) result.named.push(m[1]);
  const ifaceRe = /export\s+interface\s+(\w+)/g;
  while ((m = ifaceRe.exec(content)) !== null) result.interfaces.push(m[1]);
  const typeRe = /export\s+type\s+(\w+)/g;
  while ((m = typeRe.exec(content)) !== null) result.types.push(m[1]);
  if (filePath.endsWith('.tsx')) {
    const compRe = /(?:function|const)\s+([A-Z]\w+)(?:\s*[:=]|\s*\()/g;
    while ((m = compRe.exec(content)) !== null) {
      if (!result.components.includes(m[1])) result.components.push(m[1]);
    }
  } else {
    const funcRe = /(?:export\s+)?(?:function|const)\s+([a-z]\w+)\s*[=(]/g;
    while ((m = funcRe.exec(content)) !== null) result.functions.push(m[1]);
  }
  return result;
}

function main() {
  console.log('Scanning project...');
  const index = {
    generatedAt: new Date().toISOString(),
    files: {},
    summary: { totalFiles: 0, totalComponents: 0, totalTypes: 0 }
  };
  const allFiles = getAllFiles(path.join(PROJECT_ROOT, 'src'), 'src');
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file.fullPath, 'utf-8');
      const exp = extractExports(content, file.relativePath);
      const lines = content.split('\n').length;
      const size = Buffer.byteLength(content, 'utf-8');
      index.files[file.relativePath] = {
        lines: lines,
        sizeKB: Math.round(size / 1024),
        isLarge: lines > 500,
        isHuge: lines > 2000,
        exports: exp.named.length ? exp.named : undefined,
        defaultExport: exp.default,
        types: exp.types.length ? exp.types : undefined,
        interfaces: exp.interfaces.length ? exp.interfaces : undefined,
        components: exp.components.length ? exp.components : undefined,
        functions: exp.functions.length ? exp.functions.slice(0, 30) : undefined,
      };
      index.summary.totalFiles++;
      index.summary.totalComponents += exp.components.length;
      index.summary.totalTypes += exp.types.length + exp.interfaces.length;
    } catch (err) { /* skip */ }
  }
  fs.writeFileSync(path.join(PROJECT_ROOT, 'code-index.json'), JSON.stringify(index, null, 2), 'utf-8');
  console.log('Done: ' + index.summary.totalFiles + ' files, ' + index.summary.totalComponents + ' components, ' + index.summary.totalTypes + ' types');
}
main();