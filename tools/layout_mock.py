import json
from PIL import Image
man=json.load(open('src/data/asset-manifest.json'))
def P(k): return 'public/'+man[k]['path']
env=Image.open(P('FD_ENV_01_OverheadDesk_v01')).convert('RGBA')
L=[ # key, x, y, scale, rot
 ('FD_PROP_12_LoosePaperSheets_v01',24,346,.40,-5),
 ('FD_PAGE_01_CalendarPageTemplate_v01',150,540,.34,4),
 ('FD_PROP_08_Envelope_v01__clean',36,560,.42,-8),
 ('FD_PROP_05_StickyNoteStack_v01__clean',196,372,.42,6),
 ('FD_PROP_01_RingBoundCalendarBase_v01__board',372,66,1.30,0),
 ('FD_PROP_03_PencilCup_v01__clean',1200,14,.48,0),
 ('FD_PROP_06_AccessCard_v01__clean',1038,40,.52,-6),
 ('FD_PROP_07_BinderAndPaperClips_v01__clean',1210,196,.46,0),
 ('FD_PROP_09_SketchbookClosed_v01__clean',1040,214,.58,4),
 ('FD_PROP_04_PenAndPencil_v01__clean',1250,330,.5,12),
 ('FD_PROP_11_TransparentRuler_v01',1020,462,.5,-3),
 ('FD_PROP_02_CeramicMug_v01__clean',1112,533,.58,0),
]
for k,x,y,s,r in L:
  im=Image.open(P(k)).convert('RGBA');im=im.resize((int(im.width*s),int(im.height*s)),Image.LANCZOS)
  if r: im=im.rotate(-r,expand=True,resample=Image.BICUBIC)
  env.alpha_composite(im,(x,y))
env.convert('RGB').save('/tmp/layout.png')
