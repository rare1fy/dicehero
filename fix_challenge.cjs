const fs = require('fs');
let c = fs.readFileSync('src/DiceHeroGame.tsx', 'utf8');
const old = "generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter)";
const rep = "generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount)";
const count = c.split(old).length - 1;
c = c.split(old).join(rep);
fs.writeFileSync('src/DiceHeroGame.tsx', c);
console.log('Replaced ' + count + ' occurrences');
