import json, math, statistics

SKOG = {1:(5,15),2:(4,3),3:(4,5),4:(3,13),5:(5,7),6:(4,1),7:(3,17),8:(4,11),9:(4,9),10:(4,10),11:(4,4),12:(5,12),13:(3,14),14:(4,18),15:(4,8),16:(3,16),17:(4,2),18:(5,6)}
PARK = {1:(4,9),2:(4,15),3:(3,18),4:(5,1),5:(4,5),6:(3,13),7:(3,17),8:(4,7),9:(4,11),10:(5,3),11:(4,12),12:(4,8),13:(3,14),14:(4,4),15:(5,16),16:(4,6),17:(5,2),18:(4,10)}
SLOPE = {'Skogsbanan':128,'Parkbanan':130}
COURSE = {'Skogsbanan':SKOG,'Parkbanan':PARK}
HCP = {'filip':8.6,'matthis':16.8,'marcus':13.8,'fredrik':22.5,'magnus':22.9,'martin':40.0}
NICK = {'filip':'Mr Vain','matthis':'The Grinder','marcus':'Dr Erektor','fredrik':'The Fossil','magnus':'The Hybrid','martin':'Plus One'}
TEAM = {'filip':'Gaylords','matthis':'Gaylords','martin':'Gaylords','marcus':'Stjärtmesarna','fredrik':'Stjärtmesarna','magnus':'Stjärtmesarna'}

def playing_hcp(h, slope): return round(h * slope / 113)
def strokes_given(ph, hidx):
    base = ph // 18; rem = ph % 18
    return base + (1 if hidx <= rem else 0)
def stab(strokes, par, extra): return max(0, (par + extra) - strokes + 2)

with open('scoredata.json') as f:
    rows = json.load(f)

# Strukturera: data[key][round] = {hole: strokes}
data = {}
for r in rows:
    data.setdefault(r['key'], {}).setdefault(r['round_number'], {})[r['hole']] = r['strokes']

ROUND_COURSE = {1:'Skogsbanan', 2:'Skogsbanan', 3:'Parkbanan'}

# Beräkna allt
results = {}  # key -> {round: {stab, gross, birdies, pars, bogeys, doubles, zeros, blowups}}
for key, rounds in data.items():
    results[key] = {}
    ph_cache = {}
    for rn, holes in rounds.items():
        course = ROUND_COURSE[rn]
        cdata = COURSE[course]
        ph = playing_hcp(HCP[key], SLOPE[course])
        ph_cache[rn] = ph
        tot_stab = tot_gross = 0
        birdies = pars = bogeys = doubles = zeros = albatross_eagle = 0
        hole_stabs = []
        for hole in range(1, 19):
            if hole not in holes: continue
            strokes = holes[hole]
            par, hidx = cdata[hole]
            extra = strokes_given(ph, hidx)
            s = stab(strokes, par, extra)
            tot_stab += s; tot_gross += strokes
            hole_stabs.append((hole, s, strokes, par))
            diff = strokes - par
            if diff <= -2: albatross_eagle += 1
            elif diff == -1: birdies += 1
            elif diff == 0: pars += 1
            elif diff == 1: bogeys += 1
            elif diff >= 2: doubles += 1
            if s == 0: zeros += 1
        results[key][rn] = dict(stab=tot_stab, gross=tot_gross, birdies=birdies, pars=pars,
                                bogeys=bogeys, doubles=doubles, zeros=zeros, eagles=albatross_eagle,
                                ph=ph, hole_stabs=hole_stabs)

print("=== TOTAL STABLEFORD (netto, 3 rundor) ===")
totals = {}
for key in results:
    t = sum(results[key][rn]['stab'] for rn in results[key])
    totals[key] = t
for key, t in sorted(totals.items(), key=lambda x:-x[1]):
    rounds_str = " / ".join(f"R{rn}:{results[key][rn]['stab']}" for rn in sorted(results[key]))
    print(f"{NICK[key]:12} ({TEAM[key][:4]}) TOT {t:3}  [{rounds_str}]")

print("\n=== GROSS (slag) per runda ===")
for key in sorted(results, key=lambda k:-totals[k]):
    g = " / ".join(f"R{rn}:{results[key][rn]['gross']}" for rn in sorted(results[key]))
    tg = sum(results[key][rn]['gross'] for rn in results[key])
    print(f"{NICK[key]:12} TOT {tg}  [{g}]")

print("\n=== BIRDIES/EAGLES, PARS, NOLLOR (totalt) ===")
for key in sorted(results, key=lambda k:-totals[k]):
    b = sum(results[key][rn]['birdies'] for rn in results[key])
    e = sum(results[key][rn]['eagles'] for rn in results[key])
    p = sum(results[key][rn]['pars'] for rn in results[key])
    z = sum(results[key][rn]['zeros'] for rn in results[key])
    d = sum(results[key][rn]['doubles'] for rn in results[key])
    print(f"{NICK[key]:12} 🦅{e} 🐦{b} | par {p} | nollor {z} | dubbel+ {d}")

print("\n=== KONSISTENS (std av rundpoäng) ===")
for key in sorted(results, key=lambda k:-totals[k]):
    vals = [results[key][rn]['stab'] for rn in sorted(results[key])]
    sd = statistics.pstdev(vals) if len(vals)>1 else 0
    print(f"{NICK[key]:12} std={sd:.1f}  rundor={vals}")

print("\n=== LAGSTRID (2 bästa per runda, hål 16-18 dubbelt EJ inräknat här) ===")
for rn in [1,2,3]:
    for team in ['Gaylords','Stjärtmesarna']:
        members = [k for k in results if TEAM[k]==team and rn in results[k]]
        scores = sorted([results[k][rn]['stab'] for k in members], reverse=True)
        best2 = sum(scores[:2])
        print(f"R{rn} {team:14} bästa2={best2} ({scores})")
    print()

print("\n=== BÄSTA ENSKILDA RUNDA ===")
best = []
for key in results:
    for rn in results[key]:
        best.append((results[key][rn]['stab'], NICK[key], rn))
best.sort(reverse=True)
for s,n,rn in best[:5]:
    print(f"{s}p — {n} (R{rn})")

print("\n=== SÄMSTA ENSKILDA RUNDA (Daily Loser-kandidater) ===")
for s,n,rn in sorted(best)[:5]:
    print(f"{s}p — {n} (R{rn})")
