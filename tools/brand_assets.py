"""Copy the Studio Bridge brand illustrations used by The First 90 Days into public/assets/sb/,
resized for the calendar pages, and register them in src/data/asset-manifest.json (source: brand package).
Usage: python3 tools/brand_assets.py <path-to>/studiobridge/packages/brand/public/assets"""
import json, os, sys
from PIL import Image
SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'sb'); os.makedirs(OUT, exist_ok=True)
USE = {  # key: (source path, max height px)
  'aanya-cast': ('characters/aanya/aanya-cast.png', 360), 'aanya-celebrate': ('characters/aanya/aanya-celebrate.png', 360),
  'aanya-wave': ('characters/aanya/aanya-wave.png', 360), 'aanya-neutral': ('characters/aanya/aanya-neutral.png', 360),
  'aanya-thinking': ('characters/aanya/aanya-thinking.png', 360), 'aanya-pointing': ('characters/aanya/aanya-pointing.png', 360),
  'aanya-walking': ('characters/aanya/aanya-walking.png', 360), 'arjun-explaining': ('characters/arjun/arjun-explaining.png', 360),
  'arjun-relaxed': ('characters/arjun/arjun-relaxed.png', 360), 'kabir-tablet': ('characters/kabir/kabir-tablet.png', 360),
  'rhea-presenting-group': ('characters/rhea/rhea-presenting-group.png', 360), 'rhea-sketching': ('characters/rhea/rhea-sketching.png', 360),
  'pals-working-together': ('helpers/scenes/pals-working-together.png', 300),
  'blue-pal-pointing': ('helpers/blue-pal/blue-pal-pointing.png', 200), 'pink-pal-thinking': ('helpers/pink-pal/pink-pal-thinking.png', 200),
  'pink-pal-celebrate': ('helpers/pink-pal/pink-pal-celebrate.png', 240), 'blue-pal-sending': ('helpers/blue-pal/blue-pal-sending.png', 200),
  'st-sparkle': ('graphics/stickers/sparkle.png', 140), 'st-chat': ('graphics/stickers/chat-bubble.png', 160), 'st-arrow': ('graphics/stickers/arrow.png', 140),
  'st-calendar': ('graphics/stickers/calendar.png', 160), 'st-portfolio': ('graphics/stickers/portfolio-card.png', 120), 'st-heart': ('graphics/stickers/heart.png', 140),
  'st-portal': ('graphics/stickers/portal-door.png', 200), 'st-rainbow': ('graphics/stickers/rainbow.png', 150), 'st-sticky': ('graphics/stickers/sticky-note.png', 150),
  'st-binoculars': ('graphics/stickers/binoculars.png', 150), 'st-mentor': ('graphics/stickers/mentor-badge.png', 110),
  'task-production': ('tasks/production-exporting.png', 220), 'task-feedback': ('tasks/feedback-revisions.png', 220), 'task-ideation': ('tasks/creative-ideation.png', 220),
  'task-journey': ('tasks/journey-mapping.png', 200), 'task-digital': ('tasks/digital-illustration.png', 220),
  'sb-badge': ('brand/studiobridge-badge-yellow.png', 220), 'sb-mark': ('brand/studiobridge-mark.png', 96),
  'deco-sparkle-pink': ('graphics/decor/sparkle-pink.png', 80), 'deco-sparkle-yellow': ('graphics/decor/sparkle-yellow.png', 80), 'deco-cloud-teal': ('graphics/decor/cloud-teal.png', 90),
}
man_p = os.path.join(ROOT, 'src', 'data', 'asset-manifest.json'); man = json.load(open(man_p))
for k, (rel, mh) in USE.items():
    im = Image.open(os.path.join(SRC, rel)).convert('RGBA')
    bb = im.getbbox(); im = im.crop(bb)
    if im.height > mh: im = im.resize((round(im.width * mh / im.height), mh), Image.LANCZOS)
    fn = f'{k}.png'; im.save(os.path.join(OUT, fn), optimize=True)
    man['SB_' + k] = {'path': f'assets/sb/{fn}', 'w': im.width, 'h': im.height, 'alpha': True, 'derivedFrom': 'studiobridge/packages/brand/public/assets/' + rel,
                      'derivation': f'Studio Bridge brand package illustration, trimmed to its bounding box and resized to ≤{mh}px tall for the calendar pages.'}
json.dump(man, open(man_p, 'w'), indent=1)
print(len(USE), 'brand assets', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')
