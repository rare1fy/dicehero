with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'rb') as f:
    raw = f.read()
lines = raw.split(b'\n')
fixed = 0
BACKTICK = bytes([96])  # `
for i, line in enumerate(lines):
    if b'const roamKey' in line and b'-intro' in line and BACKTICK not in line:
        correct = b'    const roamKey = ' + BACKTICK + b'${game.chapter}-intro' + BACKTICK + b';'
        lines[i] = correct
        print('line', i+1, 'fixed')
        fixed += 1
raw = b'\n'.join(lines)
with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'wb') as f:
    f.write(raw)
print('done, fixed', fixed)
