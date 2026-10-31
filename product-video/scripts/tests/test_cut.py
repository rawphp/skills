import json, subprocess, sys, os, shutil, tempfile
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PY = sys.executable
FX = os.path.join(SK, 'fixtures', 'tape')
SEG = {"src": [0.5, 1.0], "ring": [294, 194, 412, 212], "zoom": 1.5, "kind": "box"}
def run(segs):
    # fixture line "Box the box." (lead 0.35): a second segment cued on the second "box" cuts at 0.35 + 0.6 - 0.3 = 0.65 s
    d = tempfile.mkdtemp(); shutil.copytree(FX, d, dirs_exist_ok=True)
    c = json.load(open(os.path.join(d, 'cuts.json'))); c['w1']['segs'] = segs
    json.dump(c, open(os.path.join(d, 'cuts.json'), 'w'))
    p = subprocess.run([PY, os.path.join(SK, 'cut.py'), 'w1'], cwd=d, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr
def second(): return {**SEG, "src": [1.0, 2.5], "at": "box.", "n": 2}
def test_ring_clear_of_the_next_cut_passes():
    code, out = run([dict(SEG), second()]); assert code == 0, out
def test_ring_still_on_the_next_cut_fails():
    # ring cue "Box" at 0.35 s: its still at 0.65 s is the cut itself
    code, out = run([{**SEG, "ring_at": "Box"}, second()]); assert code != 0 and 'lands on the cut' in out, out
def test_sticker_across_the_cut_fails():
    # a sticker cued at 0.35 s keeps the 1.2 s floor and runs past the 0.65 s cut
    code, out = run([{**SEG, "sticker": {"text": "Here", "at": "Box"}}, second()]); assert code != 0 and 'rides across the cut' in out, out
