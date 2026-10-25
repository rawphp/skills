import os, subprocess, sys, glob
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def test_every_shipped_preset_validates():
    for d in sorted(glob.glob(os.path.join(P, '*', 'preset.md'))):
        r = subprocess.run([sys.executable, os.path.join(P, 'validate.py'), d], capture_output=True, text=True); assert r.returncode == 0, (d, r.stdout)
def test_preset_missing_key_fails(tmp_path):
    p = tmp_path / 'preset.md'; p.write_text('---\nsource: a spec\nfootage: cards\nshape:\n  - title\ntone: 2 dry plain\n---\nbody\n')
    r = subprocess.run([sys.executable, os.path.join(P, 'validate.py'), str(p)], capture_output=True, text=True)
    assert r.returncode == 1 and 'claim' in r.stdout and 'deliverables' in r.stdout
