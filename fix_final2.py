with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'rb') as f:
    raw = f.read()
lines = raw.split(b'\n')
for i, line in enumerate(lines):
    if b'willShowRoamTaunt' in line and b'includes' in line:
        print(f'line {i+1}: {line}')
        # build correct line
        correct = b'      && !(game.bossRoamSeen || []).includes(' + ''.encode() + b'-intro);'
        lines[i] = correct
        print(f'fixed to: {lines[i]}')
        break
raw = b'\n'.join(lines)
with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'wb') as f:
    f.write(raw)
print('saved')
