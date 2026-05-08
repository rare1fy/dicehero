content = open('src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

old = """      // [BOSS-ROAM 2026-05-08] Boss路过嘲讽演出：Boss前一层战斗开始时插入
      // 触发层：中Boss(depth 7)前一层=depth 6，终Boss(depth 14)前一层=depth 13
      const bossFrontDepths: number[] = [];
      Object.entries(MAP_CONFIG.fixedLayers).forEach(([k, v]) => {
        if ((v as { type?: string }).type === 'boss') bossFrontDepths.push(Number(k) - 1);
      });
      const isPreBossLayer = bossFrontDepths.includes(node.depth);
      const roamKey = `${game.chapter}-${node.depth}`;
      const alreadyRoamed = (game.bossRoamSeen || []).includes(roamKey);
      if (isPreBossLayer && !alreadyRoamed) {"""

new = """      // [BOSS-ROAM 2026-05-08] Boss路过嘲讽演出：章节第一场战斗（depth 0）开始时插入
      // 触发时机：每章第一场战斗，Boss亮个相说句垃圾话就退场
      const roamKey = `${game.chapter}-intro`;
      const alreadyRoamed = (game.bossRoamSeen || []).includes(roamKey);
      if (node.depth === 0 && !alreadyRoamed) {"""

if old in content:
    content = content.replace(old, new)
    open('src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND')
