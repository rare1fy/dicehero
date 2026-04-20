const fs = require('fs');
const p = 'C:/Users/slimboiliu/CodeBuddy/Claw/.codebuddy/context/agent-work/verify-arch-d-final.md';
const r = fs.readFileSync('tmp-report.md', 'utf8');
fs.writeFileSync(p, r, 'utf8');
console.log('Done');