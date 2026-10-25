# validate.py <preset.md>: the six keys every preset must carry, with allowed values where there are some.
import re, sys
KEYS = ['source', 'footage', 'shape', 'tone', 'claim', 'deliverables']
ALLOWED = {'footage': {'cards', 'tape', 'live'}, 'claim': {'proposed', 'built', 'live', 'review'}}
text = open(sys.argv[1]).read(); m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
if not m: print('no front matter'); sys.exit(1)
fm = m.group(1); bad = []
for k in KEYS:
    mm = re.search(rf'^{k}:\s*(.*)$', fm, re.M)
    if not mm: bad.append(f'missing {k}'); continue
    v = mm.group(1).strip()
    if k in ALLOWED and v not in ALLOWED[k]: bad.append(f'{k} must be one of {sorted(ALLOWED[k])}, got "{v}"')
for b in bad: print(b)
sys.exit(1 if bad else 0)
