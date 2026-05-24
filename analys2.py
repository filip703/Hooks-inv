import json
raw = json.load(open('/tmp/pts.json'))
# Filtrera bort spectator + ej dio (rami)
VALID = {'filip','matthis','martin','marcus','fredrik','magnus'}
NICK = {'filip':'Mr Vain','matthis':'The Grinder','marcus':'Dr Erektor','fredrik':'The Fossil','magnus':'The Hybrid','martin':'Plus One'}
TEAM = {'filip':'Gaylords','matthis':'Gaylords','martin':'Gaylords','marcus':'Stjärtmesarna','fredrik':'Stjärtmesarna','magnus':'Stjärtmesarna'}

# Strukturera: data[key][rn] = {hole: pts}
data = {}
for r in raw:
    k = r['inv_players']['key']
    if k not in VALID: continue
    rn = r['inv_rounds']['round_number']
    data.setdefault(k, {}).setdefault(rn, {})[r['hole']] = r['stableford_points']

def streaks(holes_pts):
    # holes_pts: list of (hole, pts) sorted by hole — EXAKT som checkStreaks
    hot = cold = 0
    bs = zs = 0
    for hole, pts in sorted(holes_pts):
        if pts >= 3: bs += 1; zs = 0
        elif pts == 0: zs += 1; bs = 0
        else: bs = 0; zs = 0
        if bs >= 2: hot += 1
        if zs >= 2: cold += 1
    return hot, cold

print("=== APPENS EXAKTA INDIVIDUELLA LEADERBOARD (lagrad stableford + streak-bonus) ===\n")
rows = []
for k in VALID:
    raw_total = 0; bonus_total = 0; rounds_detail = []
    for rn in sorted(data.get(k, {})):
        rpts = sum(data[k][rn].values())
        hp = [(h, p) for h, p in data[k][rn].items()]
        hot, cold = streaks(hp)
        rbonus = hot*2 - cold
        raw_total += rpts; bonus_total += rbonus
        rounds_detail.append(f"R{rn}:{rpts}{'+' if rbonus>=0 else ''}{rbonus}b")
    rows.append((raw_total+bonus_total, raw_total, bonus_total, k, rounds_detail))

rows.sort(reverse=True)
for i,(tot, raw_t, bon, k, det) in enumerate(rows):
    print(f"{i+1}. {NICK[k]:12} ({TEAM[k][:4]}) = {tot}p  [raw {raw_t} {'+' if bon>=0 else ''}{bon} streak]  {' '.join(det)}")

print("\n=== ENDAST RAW (utan streak) för jämförelse ===")
for tot, raw_t, bon, k, det in sorted(rows, key=lambda x:-x[1]):
    print(f"{NICK[k]:12} raw {raw_t}")
