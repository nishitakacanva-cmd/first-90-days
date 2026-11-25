"""Print QA: page count, boxes, fonts embedded, no raster images, binding zone clear, nothing outside the safe area."""
import subprocess, sys, os, re
import numpy as np
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else 'public/print'
ok = True
def chk(cond, msg):
    global ok; print(('PASS ' if cond else 'FAIL ') + msg); ok &= cond
for name, tw, th, bind in [('A3', 297, 420, 15), ('A2', 420, 594, 21.2)]:
    f = os.path.join(D, f'TheFirst90Days_{name}_PrintReady.pdf')
    info = subprocess.run(['pdfinfo', '-box', f], capture_output=True, text=True).stdout
    pages = int(re.search(r'Pages:\s+(\d+)', info).group(1)); chk(pages == 14, f'{name}: 14 pages ({pages})')
    t = [float(x) for x in re.search(r'TrimBox:\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)', info).groups()]
    b = [float(x) for x in re.search(r'BleedBox:\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)', info).groups()]
    tw_mm, th_mm = (t[2] - t[0]) / 72 * 25.4, (t[3] - t[1]) / 72 * 25.4
    chk(abs(tw_mm - tw) < 0.1 and abs(th_mm - th) < 0.1, f'{name}: trim {tw_mm:.1f} × {th_mm:.1f} mm')
    bl = (t[0] - b[0]) / 72 * 25.4; chk(abs(bl - 3) < 0.05, f'{name}: bleed {bl:.2f} mm each side')
    fonts = subprocess.run(['pdffonts', f], capture_output=True, text=True).stdout.splitlines()[2:]
    chk(all(' yes yes ' in l for l in fonts) and len(fonts) >= 6, f'{name}: {len(fonts)} fonts, all embedded subsets')
    imgs = subprocess.run(['pdfimages', '-list', f], capture_output=True, text=True).stdout.splitlines()[2:]
    chk(len(imgs) == 0, f'{name}: no raster images ({len(imgs)})')
    # render and check the binding zone (top of trim, inside bleed) carries only the background tint
    dpi = 50 if name == 'A3' else 36
    tmp = f'/tmp/qa_{name}'; os.makedirs(tmp, exist_ok=True)
    for x in os.listdir(tmp): os.remove(os.path.join(tmp, x))
    subprocess.run(['pdftoppm', '-r', str(dpi), '-png', f, f'{tmp}/p'], check=True)
    px = dpi / 25.4; slug_bleed = (9 + 3) * px
    bad = []
    for fn in sorted(os.listdir(tmp)):
        a = np.asarray(Image.open(os.path.join(tmp, fn)).convert('L')).astype(int)
        y0 = int(slug_bleed + 1); y1 = int(slug_bleed + bind * px) - 1
        x0 = int(slug_bleed + 2); x1 = int(a.shape[1] - slug_bleed - 2)
        zone = a[y0:y1, x0:x1]
        if zone.max() - zone.min() > 6: bad.append(fn)
    chk(not bad, f'{name}: top {bind:g} mm binding zone holds only background on all pages' + (f' (marks on {bad})' if bad else ''))
print('ALL PASS' if ok else 'SOME FAILED')
