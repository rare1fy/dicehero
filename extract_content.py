import io, re

def read_file(fp):
    with io.open(fp, "r", encoding="utf-8") as f:
        return f.read()

augments_src = read_file("src/data/augments.ts")
relics_src = read_file("src/data/relics.ts")
dice_src = read_file("src/data/dice.ts")
hands_src = read_file("src/data/handTypes.tsx")
enemies_src = read_file("src/config/enemies.ts")
balance_src = read_file("src/config/gameBalance.ts")
events_src = read_file("src/config/events.ts")

print("=== 增幅模块 ===")
aug_blocks = re.findall(r"\{[^{}]*?name: '([^']+)'[^{}]*?category: '([^']+)'[^{}]*?description: '([^']+)'[^{}]*?\}", augments_src, re.DOTALL)
for b in aug_blocks:
    print(f"  [{b[1]}] {b[0]}: {b[2]}")

print()
print("=== 遗物 ===")
relic_names = re.findall(r"name: '([^']+)'", relics_src)
relic_descs = re.findall(r"description: '([^']+)'", relics_src)
relic_rarities = re.findall(r"rarity: '([^']+)'", relics_src)
for i in range(min(len(relic_names), len(relic_descs), len(relic_rarities))):
    print(f"  [{relic_rarities[i]}] {relic_names[i]}: {relic_descs[i]}")

print()
print("=== 骰子 ===")
dice_ids = re.findall(r"id: '([^']+)'", dice_src)
dice_names = re.findall(r"name: '([^']+)'", dice_src)
dice_rarities = re.findall(r"rarity: '([^']+)'", dice_src)
dice_descs = re.findall(r"description: '([^']+)'", dice_src)
for i in range(min(len(dice_names), len(dice_rarities), len(dice_descs))):
    print(f"  [{dice_rarities[i]}] {dice_names[i]} ({dice_ids[i]}): {dice_descs[i]}")

print()
print("=== 牌型 ===")
hand_names = re.findall(r"name: '([^']+)'", hands_src)
hand_descs = re.findall(r"description: '([^']+)'", hands_src)
hand_bases = re.findall(r"baseDamage: (\d+)", hands_src)
hand_mults = re.findall(r"multiplier: ([\d.]+)", hands_src)
for i in range(min(len(hand_names), len(hand_descs))):
    base = hand_bases[i] if i < len(hand_bases) else "?"
    mult = hand_mults[i] if i < len(hand_mults) else "?"
    print(f"  {hand_names[i]}: {hand_descs[i]} | 基础{base} x{mult}")

print()
print("=== 事件 ===")
event_titles = re.findall(r"title: '([^']+)'", events_src)
event_descs = re.findall(r"desc: '([^']+)'", events_src)
for i in range(min(len(event_titles), len(event_descs))):
    print(f"  {event_titles[i]}: {event_descs[i][:60]}...")

print()
print("=== 章节配置 ===")
chapter_names = re.findall(r"'([^']+)'", balance_src)
print(balance_src[:3000])
