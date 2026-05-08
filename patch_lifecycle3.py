content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

# 找startBattle里的setEnemies(firstWave)，改为按是否有路过嘲讽条件延后
# 原来在startBattle顶部就setEnemies(firstWave)了
old = """    const firstWave = waves[0]?.enemies || [];
    setEnemies(firstWave);
    setEnemyEffects({}); setDyingEnemies(new Set());
    setEnemyQuotes({});
    setEnemyQuotedLowHp(new Set());
    // [BOSS-TAUNT 2026-05-08] Boss 战不走普通 enter 气泡（会被下面的 bossTaunt 短剧取代），避免重复
    const isBossNode = node.type === 'boss';
    setTimeout(() => {
      firstWave.forEach((e, idx) => {
        if (isBossNode && e.configId.startsWith('boss_')) return;
        const q = getEnemyQuotes(e.configId);
        const line = pickQuote(q?.enter);
        if (line) {
          setTimeout(() => {
            showEnemyQuote(e.uid, line, 3000);
            playSound('enemy_speak');
            setEnemyEffectForUid(e.uid, 'speaking');
            setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
          }, idx * 400);
        }
      });
    }, 300);
    setPlayerEffect(null);"""

new = """    const firstWave = waves[0]?.enemies || [];
    // [BOSS-ROAM 2026-05-08] 路过嘲讽场景：演出期间不刷小怪（空场景），演出结束后才 setEnemies
    // 非路过嘲讽场景（boss节点或非第一场）正常立刻 setEnemies
    const willShowRoamTaunt = node.type !== 'boss'
      && node.depth === 0
      && !(game.bossRoamSeen || []).includes(${game.chapter}-intro);
    if (!willShowRoamTaunt) {
      setEnemies(firstWave);
    }
    setEnemyEffects({}); setDyingEnemies(new Set());
    setEnemyQuotes({});
    setEnemyQuotedLowHp(new Set());
    // [BOSS-TAUNT 2026-05-08] Boss 战不走普通 enter 气泡（会被下面的 bossTaunt 短剧取代），避免重复
    const isBossNode = node.type === 'boss';
    if (!willShowRoamTaunt) {
      setTimeout(() => {
        firstWave.forEach((e, idx) => {
          if (isBossNode && e.configId.startsWith('boss_')) return;
          const q = getEnemyQuotes(e.configId);
          const line = pickQuote(q?.enter);
          if (line) {
            setTimeout(() => {
              showEnemyQuote(e.uid, line, 3000);
              playSound('enemy_speak');
              setEnemyEffectForUid(e.uid, 'speaking');
              setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
            }, idx * 400);
          }
        });
      }, 300);
    }
    setPlayerEffect(null);"""

if old in content:
    content = content.replace(old, new)
    open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK - setEnemies timing fixed')
else:
    print('NOT FOUND')
    idx = content.find('setEnemies(firstWave)')
    print(repr(content[max(0,idx-100):idx+200]))
