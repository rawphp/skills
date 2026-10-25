import json, subprocess, sys, os, shutil, tempfile
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PY = sys.executable
FX = os.path.join(SK, 'tests', 'fixtures', 'gate')
def run(fixture):
    d = tempfile.mkdtemp(); shutil.copytree(os.path.join(FX, fixture), d, dirs_exist_ok=True)
    p = subprocess.run([PY, os.path.join(SK, 'gate.py')], cwd=d, capture_output=True, text=True); return p.returncode, p.stdout
def test_clean_project_passes():
    code, out = run('clean'); assert code == 0 and '0 failures' in out, out
def test_ring_at_frame_edge_fails():
    code, out = run('edge'); assert code == 1 and 'FAIL w1-0 edge' in out, out
def test_ring_under_caption_fails():
    code, out = run('caption'); assert code == 1 and 'FAIL w1-0 caption' in out, out
def test_sticker_on_ring_fails():
    code, out = run('sticker'); assert code == 1 and 'FAIL w1-0 sticker' in out, out
def test_ring_overruns_next_cue_fails():
    code, out = run('overrun'); assert code == 1 and 'FAIL w1-0 overrun' in out, out
def test_duplicate_cue_without_n_fails():
    code, out = run('cue'); assert code == 1 and 'FAIL w1-1 cue' in out and '"the" occurs 2' in out, out
def test_stroke_is_screen_px_not_zoomed():
    # The compositor draws the 5 px ring stroke in screen px after the camera zoom: a toast ring 12 src px above the
    # frame bottom at zoom 1.7 keeps 12 * 1.7 - 5 = 15 px. Scaling the stroke by the zoom would report 12 * 1.7 - 8.5 = 11.9 and fail it.
    code, out = run('edge-zoomed'); assert code == 0 and '0 failures' in out, out
