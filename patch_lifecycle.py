content = open('src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

# 1. 加 import CHAPTER_BOSSES（从 MapNodeRenderer）和 BOSS_ENEMIES（从 config/enemies）
old_import = "import { CHAPTER_CONFIG, ANIMATION_TIMING } from '../config';"
new_import = "import { CHAPTER_CONFIG, ANIMATION_TIMING } from '../config';\nimport { CHAPTER_BOSSES } from '../components/MapNodeRenderer';\nimport { BOSS_ENEMIES } from '../config/enemies';\nimport { MAP_CONFIG } from '../config';"

if old_import in content:
    content = content.replace(old_import, new_import)
    print('import patch OK')
else:
    print('import NOT FOUND')

# 2. 在非Boss节点fadeOut之前插入Boss路过嘲讽逻辑
old_fade = """    // 非 Boss 节点在这里 fadeOut（Boss 节点在演出前已经 fadeOut 过了）
    if (node.type !== 'boss') {
      setBattleTransition('fadeOut');
      setTimeout(() => setBattleTransition('none'), 300);
    }"""

new_fade = """    // 非 Boss 节点在这里 fadeOut（Boss 节点在演出前已经 fadeOut 过了）
    if (node.type !== 'boss') {
      // [BOSS-ROAM 2026-05-08] Boss路过嘲讽演出：Boss前一层战斗开始时插入
      // 触发层：中Boss(depth 7)前一层=depth 6，终Boss(depth 14)前一层=depth 13
      const bossFrontDepths: number[] = [];
      Object.entries(MAP_CONFIG.fixedLayers).forEach(([k, v]) => {
        if ((v as { type?: string }).type === 'boss') bossFrontDepths.push(Number(k) - 1);
      });
      const isPreBossLayer = bossFrontDepths.includes(node.depth);
      const roamKey = `${game.chapter}-${node.depth}`;
      const alreadyRoamed = (game.bossRoamSeen || []).includes(roamKey);
      if (isPreBossLayer && !alreadyRoamed) {
        // 标记已触发，防重复
        setGame(prev => ({ ...prev, bossRoamSeen: [...(prev.bossRoamSeen || []), roamKey] }));
        // 找当前章节对应的Boss（中Boss/终Boss）
        // depth 6 => 中Boss [0]，depth 13 => 终Boss [1]
        const chIdx = Math.max(0, (game.chapter || 1) - 1);
        const bossPair = CHAPTER_BOSSES[chIdx] || CHAPTER_BOSSES[0];
        // 判断是中Boss层还是终Boss层
        const bossDepths = Object.entries(MAP_CONFIG.fixedLayers)
          .filter(([, v]) => (v as { type?: string }).type === 'boss')
          .map(([k]) => Number(k))
          .sort((a, b) => a - b);
        const isMidBoss = bossDepths.length > 0 && node.depth === bossDepths[0] - 1;
        const bossName = isMidBoss ? bossPair[0] : bossPair[1];
        // 拿台词：从 BOSS_ENEMIES 取该Boss的enter台词
        const bossCfg = BOSS_ENEMIES.find(b => b.name === bossName && b.chapter === (game.chapter || 1));
        const enterLines = bossCfg?.quotes?.enter || ['……', '好好享受你最后的战斗吧。'];
        // 随机取2句（前2句 or 洗牌取2）
        const tauntLines = enterLines.length >= 2
          ? [enterLines[0], enterLines[enterLines.length - 1]]
          : [enterLines[0], enterLines[0]];
        // fadeOut先收起黑屏，让战斗场景可见，再播演出
        setBattleTransition('fadeOut');
        await new Promise(r => setTimeout(r, 320));
        setBattleTransition('none');
        // 播Boss路过嘲讽
        setBossTaunt({ visible: true, name: bossName, chapter: game.chapter || 1, lines: tauntLines });
        playSound('boss_laugh');
        await new Promise(r => setTimeout(r, 2600));
        setBossTaunt(prev => ({ ...prev, visible: false }));
        await new Promise(r => setTimeout(r, 200));
      } else {
        setBattleTransition('fadeOut');
        setTimeout(() => setBattleTransition('none'), 300);
      }
    }"""

if old_fade in content:
    content = content.replace(old_fade, new_fade)
    print('logic patch OK')
else:
    print('logic NOT FOUND')
    idx = content.find('非 Boss 节点在这里 fadeOut')
    print(repr(content[idx:idx+200]))

open('src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
