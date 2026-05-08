content = open('src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

old = """        // 找当前章节对应的Boss（中Boss/终Boss）
        // depth 6 => 中Boss [0]，depth 13 => 终Boss [1]
        const chIdx = Math.max(0, (game.chapter || 1) - 1);
        const bossPair = CHAPTER_BOSSES[chIdx] || CHAPTER_BOSSES[0];
        // 判断是中Boss层还是终Boss层
        const bossDepths = Object.entries(MAP_CONFIG.fixedLayers)
          .filter(([, v]) => (v as { type?: string }).type === 'boss')
          .map(([k]) => Number(k))
          .sort((a, b) => a - b);
        const isMidBoss = bossDepths.length > 0 && node.depth === bossDepths[0] - 1;
        const bossName = isMidBoss ? bossPair[0] : bossPair[1];"""

new = """        // 章节开场亮相：取当前章节终Boss（最终大Boss更有压迫感）
        const chIdx = Math.max(0, (game.chapter || 1) - 1);
        const bossPair = CHAPTER_BOSSES[chIdx] || CHAPTER_BOSSES[0];
        const bossName = bossPair[1] || bossPair[0];"""

if old in content:
    content = content.replace(old, new)
    open('src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND')
