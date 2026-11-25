"""Derive cleaned prop PNGs for The First 90 Days.
Originals in the asset pack are never modified. Each derivation is recorded in
src/data/asset-manifest.json (derivedFrom / derivation).
- dehalo: removes residual light background (white/grey fringe) that is connected
  to the transparent exterior, so CSS shadows that follow the lighting overlay are
  the only shadows (baked halos read as a second, conflicting light source).
- calendar base: crops off the broken ring cut-out and speckle noise above the
  board, and removes the hard black baked shadow; rings are redrawn in SVG.
"""
import sys, json
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

def dehalo(src, dst, lo=160, hi=226, spread=20, maxa=256):
    im = Image.open(src).convert('RGBA'); a = np.array(im).astype(int)
    R,G,B,A = a[...,0],a[...,1],a[...,2],a[...,3]
    mn = np.minimum(np.minimum(R,G),B); mx = np.maximum(np.maximum(R,G),B)
    bgish = (A>0) & (mx>=lo) & (mx<=hi) & ((mx-mn)<=spread) & (A<maxa)
    h,w = A.shape; seen = np.zeros_like(A,bool); q = deque()
    ext = A==0
    # seeds: bgish pixels adjacent to exterior
    for y,x in zip(*np.where(bgish)):
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            yy,xx=y+dy,x+dx
            if 0<=yy<h and 0<=xx<w and ext[yy,xx]: q.append((y,x)); seen[y,x]=True; break
    while q:
        y,x=q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            yy,xx=y+dy,x+dx
            if 0<=yy<h and 0<=xx<w and not seen[yy,xx] and bgish[yy,xx]:
                seen[yy,xx]=True; q.append((yy,xx))
    A2 = A.copy(); A2[seen]=0
    # soften the new edge by one pixel
    m = Image.fromarray((A2>0).astype(np.uint8)*255).filter(ImageFilter.MinFilter(3))
    edge = (A2>0) & (np.array(m)==0)
    A2[edge] = (A2[edge]*0.55).astype(int)
    a[...,3]=A2
    Image.fromarray(a.astype(np.uint8)).save(dst, optimize=True)
    return int(seen.sum())

def calendar_base(src, dst):
    im = Image.open(src).convert('RGBA'); a = np.array(im).astype(int)
    R,G,B,A = a[...,0],a[...,1],a[...,2],a[...,3]
    mx = np.maximum(np.maximum(R,G),B)
    dark = (mx<70)
    h,w=A.shape
    yy,xx=np.mgrid[0:h,0:w]
    shadow = dark & ((xx>=483)|(yy>=531))
    A[shadow]=0
    a[...,3]=A
    out = Image.fromarray(a.astype(np.uint8)).crop((14,66,500,546))
    out.save(dst, optimize=True)
    return out.size

if __name__=='__main__':
    print('ok')

def badge_fix(path):
    """Remove the white background blob to the right of the badge clip (above the card)."""
    im = Image.open(path).convert('RGBA'); a = np.array(im)
    a[:108, 153:, 3] = 0
    Image.fromarray(a).save(path, optimize=True)

def build(pack, out_public):
    import os, shutil, glob
    base = os.path.join(pack, '04_The_First_90_Days')
    dst_base = os.path.join(out_public, 'assets', '04_The_First_90_Days')
    man = {}
    for sub in ['01_Environments', '03_Cropped_Transparent_PNGs']:
        os.makedirs(os.path.join(dst_base, sub), exist_ok=True)
        for f in sorted(glob.glob(os.path.join(base, sub, '*.png'))):
            shutil.copy2(f, os.path.join(dst_base, sub))
            im = Image.open(f); k = os.path.basename(f)[:-4]
            man[k] = {'path': f'assets/04_The_First_90_Days/{sub}/{os.path.basename(f)}', 'w': im.width, 'h': im.height, 'alpha': im.mode == 'RGBA'}
    ddir = os.path.join(out_public, 'assets', 'derived'); os.makedirs(ddir, exist_ok=True)
    src = os.path.join(base, '03_Cropped_Transparent_PNGs')
    def rec(k, fn, how):
        im = Image.open(os.path.join(ddir, fn))
        man[k + '__clean'] = {'path': f'assets/derived/{fn}', 'w': im.width, 'h': im.height, 'alpha': True, 'derivedFrom': k, 'derivation': how}
    halo = 'Residual light background fringe connected to the transparent edge removed (grey/white, low saturation); shadows are drawn live in CSS to follow the chosen lighting overlay.'
    for k in ['FD_PROP_02_CeramicMug_v01','FD_PROP_03_PencilCup_v01','FD_PROP_04_PenAndPencil_v01','FD_PROP_05_StickyNoteStack_v01','FD_PROP_06_AccessCard_v01','FD_PROP_07_BinderAndPaperClips_v01','FD_PROP_08_Envelope_v01','FD_PROP_09_SketchbookClosed_v01','FD_PROP_10_SketchbookOpen_v01']:
        fn = k + '__clean.png'
        dehalo(os.path.join(src, k + '.png'), os.path.join(ddir, fn))
        how = halo
        if 'AccessCard' in k:
            badge_fix(os.path.join(ddir, fn)); how += ' White blob beside the clip strap removed.'
        rec(k, fn, how)
    k = 'FD_PROP_01_RingBoundCalendarBase_v01'; fn = k + '__board.png'
    calendar_base(os.path.join(src, k + '.png'), os.path.join(ddir, fn))
    im = Image.open(os.path.join(ddir, fn))
    man[k + '__board'] = {'path': f'assets/derived/{fn}', 'w': im.width, 'h': im.height, 'alpha': True, 'derivedFrom': k, 'derivation': 'Cropped to the board and page block (box 14,66,500,546). The cut-out rings above the board were broken and carried speckle noise, so the wire binding is redrawn in SVG; the hard black baked shadow was removed and replaced with a live CSS shadow.'}
    json.dump(man, open('src/data/asset-manifest.json', 'w'), indent=1)
    print(len(man), 'manifest entries')

if __name__ == '__main__' and len(sys.argv) > 2:
    build(sys.argv[1], sys.argv[2])
