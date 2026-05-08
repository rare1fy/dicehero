content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

# 1) 在Boss节点 if分支闭合的 '}' 后，紧接追加 else-if 路过嘲讽分支
#    把末尾的 '非 Boss 节点在这里 fadeOut' 整段删除（逻辑搬前面）
old_block1 = '''    if (node.type === 'boss') {
      // Boss 节点：先把黑屏 fadeOut 收起，让玩家看到战斗场景，再播演出
      await new Promise(r => setTimeout(r, 80)); // 等 React 渲染一帧
      setBattleTransition('fadeOut');
      await new Promise(r => setTimeout(r, 320)); // fadeOut 动画时长
      setBattleTransition('none');

      playSound('boss_appear');
      const bossEnemy = firstWave[0];
      if (bossEnemy) {'''

new_block1 = '''    // [CRIT-FIX 2026-05-08] 进入战斗后必须先收起黑屏，否则骰子动画在黑屏下跑用户看起来像卡死
    const roamKey = \-intro;
    const alreadyRoamed = (game.bossRoamSeen || []).includes(roamKey);
    const needRoamTaunt = node.type !== 'boss' && node.depth === 0 && !alreadyRoamed;

    await new Promise(r => setTimeout(r, 80)); // 等 React 渲染一帧
    setBattleTransition('fadeOut');
    await new Promise(r => setTimeout(r, 320));
    setBattleTransition('none');

    if (needRoamTaunt) {
      // 路过嘲讽（场景空）：播完再 setEnemies 刷小怪
      setGame(prev => ({ ...prev, bossRoamSeen: [...(prev.bossRoamSeen || []), roamKey] }));
      const chIdx = Math.max(0, (game.chapter || 1) - 1);
      const bossPair = CHAPTER_BOSSES[chIdx] || CHAPTER_BOSSES[0];
      const bossName = bossPair[1] || bossPair[0];
      const bossCfg = BOSS_ENEMIES.find(b => b.name === bossName && b.chapter === (game.chapter || 1));
      const enterLines = bossCfg?.quotes?.enter || ['……', '好好享受你最后的战斗吧。'];
      const tauntLines = enterLines.length >= 2
        ? [enterLines[0], enterLines[enterLines.length - 1]]
        : [enterLines[0], enterLines[0]];
      await new Promise<void>(resolve => {
        setBossTaunt({
          visible: true, name: bossName, chapter: game.chapter || 1,
          lines: tauntLines, onDismiss: resolve,
        });
        playSound('boss_laugh');
      });
      setBossTaunt(prev => ({ ...prev, visible: false, onDismiss: undefined }));
      await new Promise(r => setTimeout(r, 200));
      // 演出结束后刷小怪 + enter 台词
      setEnemies(firstWave);
      setTimeout(() => {
        firstWave.forEach((e, ei) => {
          const q = getEnemyQuotes(e.configId);
          const line = pickQuote(q?.enter);
          if (line) {
            setTimeout(() => {
              showEnemyQuote(e.uid, line, 3000);
              playSound('enemy_speak');
              setEnemyEffectForUid(e.uid, 'speaking');
              setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
            }, ei * 400);
          }
        });
      }, 200);
    }

    if (node.type === 'boss') {
      playSound('boss_appear');
      const bossEnemy = firstWave[0];
      if (bossEnemy) {'''

if old_block1 in content:
    content = content.replace(old_block1, new_block1)
    print('block1 replaced')
else:
    print('block1 NOT FOUND')

# 2) 删除原来末尾那段路过嘲讽的 else/if
old_block2 = '''    // 非 Boss 节点在这里 fadeOut（Boss 节点在演出前已经 fadeOut 过了）
    if (node.type !== 'boss') {
      const roamKey = \-intro;
      const alreadyRoamed = (game.bossRoamSeen || []).includes(roamKey);
      if (node.depth === 0 && !alreadyRoamed) {
          setGame(prev => ({ ...prev, bossRoamSeen: [...(prev.bossRoamSeen || []), roamKey] }));
        const chIdx = Math.max(0, (game.chapter || 1) - 1);
        const bossPair = CHAPTER_BOSSES[chIdx] || CHAPTER_BOSSES[0];
        const bossName = bossPair[1] || bossPair[0];
        const bossCfg = BOSS_ENEMIES.find(b => b.name === bossName && b.chapter === (game.chapter || 1));
        const enterLines = bossCfg?.quotes?.enter || ['……', '好好享受你最后的战斗吧。'];
        const tauntLines = enterLines.length >= 2
          ? [enterLines[0], enterLines[enterLines.length - 1]]
          : [enterLines[0], enterLines[0]];
        setBattleTransition('fadeOut');
        await new Promise(r => setTimeout(r, 280));
        setBattleTransition('none');
        await new Promise(r => setTimeout(r, 60));
        await new Promise<void>(resolve => {
          setBossTaunt({
            visible: true,
            name: bossName,
            chapter: game.chapter || 1,
            lines: tauntLines,
            onDismiss: resolve,
          });
          playSound('boss_laugh');
        });
        setBossTaunt(prev => ({ ...prev, visible: false, onDismiss: undefined }));
        await new Promise(r => setTimeout(r, 200));
          setEnemies(firstWave);
        setTimeout(() => {
          firstWave.forEach((e, ei) => {
            const q = getEnemyQuotes(e.configId);
            const line = pickQuote(q?.enter);
            if (line) {
              setTimeout(() => {
                showEnemyQuote(e.uid, line, 3000);
                playSound('enemy_speak');
                setEnemyEffectForUid(e.uid, 'speaking');
                setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
              }, ei * 400);
            }
          });
        }, 200);
      } else {
        setBattleTransition('fadeOut');
        setTimeout(() => setBattleTransition('none'), 300);
      }
    }
  };'''

new_block2 = '''  };'''

if old_block2 in content:
    content = content.replace(old_block2, new_block2)
    print('block2 removed')
else:
    print('block2 NOT FOUND')

open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
lines = content.split('\n')
print('new total lines:', len(lines))
