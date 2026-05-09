$f="src/logic/damageApplication.ts"
$c=Get-Content $f -Raw -Encoding UTF8
$oldAoe=@"
    }).map(e => {
      // [WARRIOR_TRAIT 2026-05-09] AOE 受伤后累 bloodFury（先收 hp 完成，再统一遍历所有受伤的 warrior）
      // 注：上一个 .map 闭包里 e 是新值，所以用 hp < maxHp 简化判断（AOE 必然被打了一下）
      if (e.combatType === 'warrior' && e.hp > 0 && e.hp < e.maxHp) {
        const after = applyBloodFuryOnHurt(e);
        if (after.bloodFury && (after.bloodFury > (e.bloodFury || 0))) {
          addFloatingText(``血怒: ×`${after.bloodFury}``, 'text-red-400', undefined, 'enemy');
        }
        return after;
      }
      return e;
    }));
"@
if(-not $c.Contains($oldAoe)){ Write-Host "MISS_AOE"; exit 1 }
Write-Host "FOUND_AOE"
