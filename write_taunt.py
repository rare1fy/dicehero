code = open('F:/UGit/dicehero2/taunt_code.txt', encoding='utf-8').read()
open('F:/UGit/dicehero2/src/components/BossTauntEntrance.tsx','w',encoding='utf-8').write(code)
print('OK len=', len(code))
