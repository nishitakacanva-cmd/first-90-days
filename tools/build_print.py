"""Print masters for THE FIRST 90 DAYS — real vector typesetting from src/data/content.json.

Outputs (into public/print/):
  TheFirst90Days_A3_PrintReady.pdf   14 pages, 297 × 420 mm trim
  TheFirst90Days_A2_PrintReady.pdf   14 pages, 420 × 594 mm trim (same layout scaled by 1.414; bleed stays 3 mm)
  TheFirst90Days_ProductionNotes.pdf 1 page A4: binding, stock, colour, QA

Every page: CMYK colour, embedded OFL fonts (Archivo, Archivo Narrow, DM Mono, Kalam), no raster images,
3 mm bleed, crop marks in a 9 mm slug, TrimBox/BleedBox set, a 15 mm (A3) / 21 mm (A2) binding zone at the
top edge kept clear of anything but the background tint.
"""
import json, os, sys
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import CMYKColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
C = json.load(open(os.path.join(ROOT, 'src/data/content.json'), encoding='utf-8'))

for name in ['Archivo-Regular', 'Archivo-SemiBold', 'Archivo-Italic', 'ArchivoNarrow-Bold', 'DMMono-Regular', 'DMMono-Medium', 'Kalam-Regular']:
    pdfmetrics.registerFont(TTFont(name, os.path.join(HERE, 'fonts', name + '.ttf')))

# CMYK palette (approximations of the screen colours; proof before production)
PAPER = CMYKColor(0, 0.03, 0.08, 0.02)
PAPER2 = CMYKColor(0, 0.04, 0.12, 0.07)
INK = CMYKColor(0, 0.05, 0.1, 0.92)
GRAPHITE = CMYKColor(0, 0.04, 0.1, 0.66)
RULE = CMYKColor(0, 0.04, 0.12, 0.22)
WHITE = CMYKColor(0, 0, 0, 0)
REG = CMYKColor(1, 1, 1, 1)
STICKY = [CMYKColor(0, 0.3, 0.3, 0.06), CMYKColor(0, 0.16, 0.6, 0.12), CMYKColor(0.15, 0, 0.22, 0.24)]
TH = {k: CMYKColor(*v['cmyk']) for k, v in C['threads'].items()}
HIGHLIGHT = CMYKColor(0, 0.12, 0.6, 0)

BLEED = 3 * mm
SLUG = 9 * mm


class Page:
    """Draws on one page. Layout is designed in mm for A3 and multiplied by k for other sizes."""
    def __init__(self, c, W, H, k):
        self.c, self.W, self.H, self.k = c, W, H, k
        self.F = 1.36  # type scale: sizes below are written small and enlarged so A3 reads at wall distance
        self.ox = SLUG + BLEED
        self.oy = SLUG + BLEED

    def X(self, x): return self.ox + x * self.k * mm
    def Y(self, y): return self.oy + self.H - y * self.k * mm  # y measured down from the trim top
    def s(self, v): return v * self.k  # scale a dimension in points (line widths)
    def fs(self, v): return v * self.k * self.F  # scale a type size

    def rect(self, x, y, w, h, fill=None, stroke=None, lw=0.6, r=0):
        c = self.c
        if fill is not None: c.setFillColor(fill)
        if stroke is not None: c.setStrokeColor(stroke); c.setLineWidth(self.s(lw))
        args = (self.X(x), self.Y(y + h), w * self.k * mm, h * self.k * mm)
        if r: c.roundRect(*args, r * self.k * mm, stroke=1 if stroke is not None else 0, fill=1 if fill is not None else 0)
        else: c.rect(*args, stroke=1 if stroke is not None else 0, fill=1 if fill is not None else 0)

    def line(self, x1, y1, x2, y2, col=RULE, lw=0.6, dash=None):
        c = self.c; c.setStrokeColor(col); c.setLineWidth(self.s(lw))
        c.setDash(*(dash if dash else ([], 0)))
        c.line(self.X(x1), self.Y(y1), self.X(x2), self.Y(y2)); c.setDash([], 0)

    def text(self, x, y, t, font='Archivo-Regular', size=10, col=INK, track=0, align='left'):
        c = self.c; c.setFillColor(col); sz = self.fs(size)
        if track:
            to = c.beginText(); to.setFont(font, sz); to.setCharSpace(track * sz)
            w = pdfmetrics.stringWidth(t, font, sz) + track * sz * (len(t) - 1)
            xx = self.X(x) - (w if align == 'right' else w / 2 if align == 'center' else 0)
            to.setTextOrigin(xx, self.Y(y)); to.textOut(t); to.setCharSpace(0); c.drawText(to)  # reset Tc: PDF text state persists
        else:
            c.setFont(font, sz)
            if align == 'right': c.drawRightString(self.X(x), self.Y(y), t)
            elif align == 'center': c.drawCentredString(self.X(x), self.Y(y), t)
            else: c.drawString(self.X(x), self.Y(y), t)

    def para(self, x, y, w, html, font='Archivo-Regular', size=10, lead=1.35, col=INK, align=TA_LEFT):
        st = ParagraphStyle('p', fontName=font, fontSize=self.fs(size), leading=self.fs(size * lead), textColor=col, alignment=align)
        p = Paragraph(html, st); _, h = p.wrap(w * self.k * mm, 10000)
        p.drawOn(self.c, self.X(x), self.Y(y) - h)
        return h / (self.k * mm)  # height in layout mm

    def wlines(self, x, y, w, n, gap=11):
        for i in range(n): self.line(x, y + i * gap, x + w, y + i * gap, RULE, 0.5)
        return n * gap

    def box(self, x, y, size=4.2):
        self.rect(x, y - size + 0.6, size, size, fill=WHITE, stroke=GRAPHITE, lw=0.6)


def esc(t): return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def crop_marks(c, W, H, label):
    c.setStrokeColor(REG); c.setLineWidth(0.25)
    x0, y0 = SLUG + BLEED, SLUG + BLEED; x1, y1 = x0 + W, y0 + H
    L = 6 * mm; g = BLEED + 1 * mm
    for (x, y, dx, dy) in [(x0, y0, -1, -1), (x1, y0, 1, -1), (x0, y1, -1, 1), (x1, y1, 1, 1)]:
        c.line(x + dx * g, y, x + dx * (g + L), y)
        c.line(x, y + dy * g, x, y + dy * (g + L))
    c.setFillColor(REG); c.setFont('DMMono-Regular', 6)
    c.drawString(x0 + 10 * mm, y1 + BLEED + 2.5 * mm, label)


def background(pg):
    c = pg.c
    c.setFillColor(PAPER)
    c.rect(SLUG, SLUG, pg.W + 2 * BLEED, pg.H + 2 * BLEED, stroke=0, fill=1)
    # bottom thread bar, printed to the bleed on three sides
    keys = ['role', 'team', 'self']; w = (pg.W + 2 * BLEED) / 3
    for i, k in enumerate(keys):
        c.setFillColor(TH[k]); c.rect(SLUG + i * w, SLUG, w + (0.3 if i < 2 else 0), BLEED + 3.2 * pg.k * mm, stroke=0, fill=1)


def strip91(pg, x, y, cw, ch, gap, hit=None, all_turns=True, big=False):
    turns = {d['n']: d for d in C['days']}
    for n in range(91):
        col, row = n // 7, n % 7
        xx = x + col * (cw + gap); yy = y + row * (ch + gap)
        d = turns.get(n)
        if d and (all_turns or n == hit):
            pg.rect(xx, yy, cw, ch, fill=INK if n == hit else WHITE, stroke=INK, lw=0.5)
            if big:
                pg.text(xx + 1.4, yy + 3.6, str(n), 'DMMono-Medium', 7.5, WHITE if n == hit else INK)
                for j, t in enumerate(d['threads']):
                    pg.c.setFillColor(TH[t]); pg.c.circle(pg.X(xx + cw - 2 - j * 2.6), pg.Y(yy + ch - 2), pg.s(1.0) * mm / 2.6 * 2.2, stroke=0, fill=1)
        else:
            pg.rect(xx, yy, cw, ch, fill=PAPER2)
            if big: pg.text(xx + 1.4, yy + 3.6, str(n), 'DMMono-Regular', 7, GRAPHITE)


def header(pg, right):
    pg.text(18, 26, 'THE FIRST 90 DAYS', 'Archivo-SemiBold', 9, GRAPHITE, track=0.16)
    pg.text(279, 26, right, 'DMMono-Medium', 10, INK, track=0.06, align='right')
    pg.line(18, 29, 279, 29, RULE, 0.6)


def footer(pg, day, page_no, total):
    y = 396
    pg.line(18, y, 279, y, RULE, 0.6)
    x = 18
    if day:
        for t in day['threads']:
            label = C['threads'][t]['short']; w = pdfmetrics.stringWidth(label, 'Archivo-SemiBold', pg.fs(7)) / (pg.k * mm) + 4
            pg.rect(x, y + 3, w, 5, fill=TH[t]); pg.text(x + 2, y + 6.9, label, 'Archivo-SemiBold', 7, WHITE, track=0.1); x += w + 1.5
    pg.text(x + 3, y + 7, C['meta']['researchNote'], 'Archivo-Regular', 7.5, GRAPHITE)
    pg.text(279, y + 7, f"{C['meta']['attribution']}  ·  {page_no:02d}/{total:02d}", 'Archivo-Regular', 7.5, GRAPHITE, align='right')
    if day:
        pg.para(18, y + 9.5, 261, f"<b>Basis.</b> {esc(day['basis'])}", 'Archivo-Regular', 6.3, 1.25, GRAPHITE)


# ---------- activity blocks (static, fill-in versions of the screen interactions) ----------
def act_letter(pg, d, y):
    ix = d['interaction']
    pg.rect(18, y, 150, 74, fill=WHITE, stroke=RULE, lw=0.5)
    pg.text(26, y + 9, 'THE STUDIO · OFFER OF EMPLOYMENT', 'Archivo-SemiBold', 7.5, GRAPHITE, track=0.14)
    h = pg.para(26, y + 14, 134, esc(ix['letter']['salutation']), size=11)
    h2 = pg.para(26, y + 18 + h, 134, esc(ix['letter']['body']), size=11, lead=1.45)
    pg.para(26, y + 22 + h + h2, 134, f"<i>{esc(ix['letter']['signoff'])}</i>", 'Archivo-Italic', 11)
    for i, m in enumerate(ix['margin']):
        pg.para(178, y + 6 + i * 22, 100, esc(m), 'Kalam-Regular', 15, 1.15, GRAPHITE)
    return 80


def act_orgchart(pg, d, y):
    nodes = d['interaction']['nodes']; cw, chh = 80, 30; gx = (261 - 3 * cw) / 2
    pos = {n['id']: (18 + n['col'] * (cw + gx), y + n['row'] * (chh + 14)) for n in nodes}
    hx = pos['head'][0] + cw / 2
    pg.line(hx, y + chh, hx, y + chh + 7, GRAPHITE, 0.6)
    pg.line(18 + cw / 2, y + chh + 7, 18 + 2 * (cw + gx) + cw / 2, y + chh + 7, GRAPHITE, 0.6)
    for cx in (18 + cw / 2, 18 + 2 * (cw + gx) + cw / 2): pg.line(cx, y + chh + 7, cx, y + chh + 14, GRAPHITE, 0.6)
    ly = y + 2 * chh + 14
    pg.line(18 + cw / 2, ly, 18 + cw / 2, ly + 7, GRAPHITE, 0.6); pg.line(18 + cw / 2, ly + 7, 18 + cw + gx + cw / 2, ly + 7, GRAPHITE, 0.6)
    pg.line(18 + cw + gx + cw / 2, ly + 7, 18 + cw + gx + cw / 2, ly + 14, GRAPHITE, 0.6)
    rx = 18 + 2 * (cw + gx) + cw / 2; pg.line(rx, ly, rx, ly + 14, GRAPHITE, 0.6)
    for n in nodes:
        x, yy = pos[n['id']]
        pg.rect(x, yy, cw, chh, fill=HIGHLIGHT if n['id'] == 'you' else WHITE, stroke=INK, lw=0.8)
        pg.text(x + 3, yy + 6.5, n['name'], 'Archivo-SemiBold', 9.5)
        pg.para(x + 3, yy + 9, cw - 6, esc(n['unwritten']), 'Kalam-Regular', 10.5, 1.12, GRAPHITE)
    pg.text(18, y + 3 * chh + 2 * 14 + 7, 'Printed: the formal chart. Pencilled in: the unwritten one.', 'Archivo-Italic', 8.5, GRAPHITE)
    return 3 * chh + 2 * 14 + 12


def act_slips(pg, d, y):
    ix = d['interaction']
    pg.rect(18, y, 261, 20, fill=CMYKColor(0, 0.15, 0.36, 0.2))
    pg.text(23, y + 6, 'JOB DESCRIPTION', 'Archivo-SemiBold', 7.5, INK, track=0.16)
    pg.para(23, y + 8.5, 250, esc(ix['jd']), size=9.5)
    yy = y + 28
    for j, cat in enumerate(ix['categories']): pg.text(196 + j * 30, yy, cat, 'Archivo-SemiBold', 7.5, GRAPHITE, align='center')
    for i, t in enumerate(ix['tasks']):
        r = yy + 4 + i * 10
        pg.rect(18, r, 261, 8.5, fill=WHITE, stroke=RULE, lw=0.4)
        pg.text(22, r + 5.8, t, size=10)
        for j in range(3): pg.box(194 + j * 30, r + 6.6, 3.8)
    return 28 + 6 * 10 + 6


def act_prioritise(pg, d, y):
    for i, cm in enumerate(d['interaction']['comments']):
        x = 18 + i * 89
        pg.rect(x, y, 81, 56, fill=STICKY[i])
        pg.text(x + 5, y + 8, cm['who'].upper(), 'Archivo-SemiBold', 7.5, INK, track=0.12)
        pg.para(x + 5, y + 12, 71, esc(cm['text']), 'Kalam-Regular', 15, 1.15)
        pg.text(x + 5, y + 51, 'Looking after ' + cm['looksAfter'], 'Archivo-Italic', 8, GRAPHITE)
        pg.c.setStrokeColor(GRAPHITE); pg.c.setLineWidth(pg.s(0.8)); pg.c.setFillColor(WHITE)
        pg.c.circle(pg.X(x + 74), pg.Y(y + 2), pg.s(5) * mm, stroke=1, fill=1)
    pg.text(18, y + 64, 'Number them 1–3, the order you’d answer.', 'Archivo-Italic', 9, GRAPHITE)
    return 68


def act_draft(pg, d, y):
    ix = d['interaction']
    pg.rect(18, y, 190, 44, fill=WHITE, stroke=RULE, lw=0.5, r=2)
    pg.rect(18, y, 190, 8, fill=PAPER2)
    pg.text(22, y + 5.5, 'TO: ' + ix['to'].upper(), 'Archivo-SemiBold', 7.5, GRAPHITE, track=0.08)
    pg.text(204, y + 5.5, 'DRAFT · 10:40', 'Archivo-SemiBold', 7.5, GRAPHITE, track=0.08, align='right')
    pg.text(23, y + 17, ix['draft'] + '…', size=11, col=GRAPHITE)
    w = pdfmetrics.stringWidth(ix['draft'] + '…', 'Archivo-Regular', pg.fs(11)) / (pg.k * mm)
    pg.line(23, y + 15.6, 23 + w, y + 15.6, INK, 0.8)
    pg.text(23, y + 28, ix['rewrite'], size=12)
    pg.text(23, y + 38, 'Shorter. No apology.', 'Kalam-Regular', 12, GRAPHITE)
    return 50


def act_brief(pg, d, y):
    ix = d['interaction']
    for col, (title, key) in enumerate([('BRIEF · v1', 'a'), ('BRIEF · v2 (REVISED)', 'b')]):
        x = 18 + col * 133
        pg.rect(x, y, 128, 50, fill=WHITE if col == 0 else CMYKColor(0.06, 0, 0.02, 0.04), stroke=RULE, lw=0.5)
        pg.text(x + 4, y + 6, title, 'Archivo-SemiBold', 7.5, GRAPHITE, track=0.14)
        for i, r in enumerate(ix['rows']):
            ry = y + 14 + i * 9
            pg.text(x + 4, ry, r['k'].upper(), 'Archivo-SemiBold', 6.4, GRAPHITE, track=0.06)
            if key == 'b' and r['changed']:
                w = pdfmetrics.stringWidth(r[key], 'Archivo-Regular', pg.fs(9.2)) / (pg.k * mm)
                pg.rect(x + 37, ry - 3.4, min(w + 1, 89), 4.6, fill=HIGHLIGHT)
            pg.text(x + 38, ry, r[key], size=9.2)
    yy = y + 58
    for i, r in enumerate(ix['ripple']): pg.text(18 + (i % 2) * 133, yy + (i // 2) * 7, '— ' + r, size=9.5)
    return 74


def act_checklist(pg, d, y):
    ix = d['interaction']
    for j, st in enumerate(ix['states']): pg.text(196 + j * 30, y, st, 'Archivo-SemiBold', 7.5, GRAPHITE, align='center')
    for i, t in enumerate(ix['items']):
        r = y + 4 + i * 10
        pg.rect(18, r, 261, 8.5, fill=WHITE, stroke=RULE, lw=0.4)
        pg.text(22, r + 5.8, t, size=10)
        for j in range(3): pg.box(194 + j * 30, r + 6.6, 3.8)
    return 6 * 10 + 8


def act_agenda(pg, d, y):
    ix = d['interaction']
    pg.rect(18, y, 200, 86, fill=WHITE, stroke=RULE, lw=0.5)
    pg.line(18, y + 29, 218, y + 29, RULE, 0.5, ([2, 2], 0)); pg.line(18, y + 58, 218, y + 58, RULE, 0.5, ([2, 2], 0))
    pg.text(24, y + 7, ix['title'], 'DMMono-Regular', 8.5, GRAPHITE)
    for i, it in enumerate(ix['items']):
        r = y + 13 + i * 15.5
        pg.text(24, r, f"{i + 1}. {it['h']}", 'Archivo-SemiBold', 10)
        pg.text(29, r + 5, it['d'] if it['d'] else '(from Day 30)', 'Archivo-Regular', 8.5, GRAPHITE)
    return 92


def act_file(pg, d, y):
    ix = d['interaction']
    for k, tr in enumerate(ix['trays']):
        x = 18 + k * 133
        pg.rect(x, y + 4, 128, 64, fill=CMYKColor(0, 0.08, 0.28, 0.1) if k == 0 else CMYKColor(0.12, 0, 0.16, 0.14))
        pg.rect(x, y, 50, 5, fill=CMYKColor(0, 0.08, 0.28, 0.1) if k == 0 else CMYKColor(0.12, 0, 0.16, 0.14))
        pg.text(x + 3, y + 4, tr.upper(), 'Archivo-SemiBold', 7.5, INK, track=0.12)
        for i, t in enumerate(ix['items']):
            r = y + 13 + i * 9
            pg.box(x + 4, r + 1, 3.6); pg.text(x + 10, r, t, size=9.2)
    pg.text(18, y + 76, 'Tick each slip in the tray it belongs to. Some might belong in both.', 'Archivo-Italic', 9, GRAPHITE)
    return 80


def act_tabs(pg, d, y):
    tabs = d['interaction']['tabs']
    for k, t in enumerate(tabs):
        x = 18 + k * 89
        pg.rect(x, y, 40, 6, fill=PAPER2, stroke=RULE, lw=0.4)
        pg.text(x + 3, y + 4.3, t['label'].upper(), 'Archivo-SemiBold', 6.8, INK, track=0.08)
        pg.rect(x, y + 6, 84, 52, fill=WHITE, stroke=RULE, lw=0.4)
        items = t['items'] or []
        for i, it in enumerate(items):
            pg.box(x + 4, y + 15 + i * 9, 3.6); pg.text(x + 10, y + 14 + i * 9, it, size=9.5)
        if not items: pg.wlines(x + 5, y + 16, 74, 4, 9)
    return 64


def act_sheets(pg, d, y):
    ix = d['interaction']
    for k, sh in enumerate([ix['a'], ix['b']]):
        x = 18 + k * 112
        pg.rect(x, y, 149, 56, fill=WHITE if k == 0 else CMYKColor(0.08, 0, 0.1, 0.06), stroke=RULE, lw=0.5)
        tx = x + (4 if k == 0 else 44)
        pg.text(tx, y + 7, sh['title'].upper(), 'Archivo-SemiBold', 7.2, GRAPHITE, track=0.1)
        for i, it in enumerate(sh['items']): pg.text(tx, y + 16 + i * 9, '· ' + it, size=9.4)
    pg.rect(130, y, 38, 56, fill=CMYKColor(0, 0.1, 0.4, 0.04))
    pg.para(132, y + 22, 34, esc(ix['overlap']), 'Kalam-Regular', 12, 1.1, CMYKColor(0, 0.35, 0.85, 0.5), TA_CENTER)
    return 62


def act_map(pg, d, y):
    strip91(pg, 18, y, 18.4, 9.6, 1.65, hit=None, all_turns=True, big=True)
    yy = y + 7 * 11.25 + 4
    x = 18
    for k in ['role', 'team', 'self']:
        pg.c.setFillColor(TH[k]); pg.c.circle(pg.X(x + 1.5), pg.Y(yy - 1.3), pg.s(1.5) * mm, stroke=0, fill=1)
        pg.text(x + 4.5, yy, C['threads'][k]['label'], size=9, col=GRAPHITE); x += 55
    return 7 * 11.25 + 10


ACTS = {'letter': act_letter, 'orgchart': act_orgchart, 'slips': act_slips, 'prioritise': act_prioritise, 'draft': act_draft,
        'brief': act_brief, 'checklist': act_checklist, 'agenda': act_agenda, 'file': act_file, 'tabs': act_tabs,
        'sheets': act_sheets, 'map': act_map}


def day_page(pg, d, page_no, total):
    header(pg, 'DAY ' + d['label'])
    pg.text(16, 88, d['label'], 'ArchivoNarrow-Bold', 150, INK)
    thc = TH[d['threads'][0]]
    pg.text(104, 44, d['theme'].upper(), 'Archivo-SemiBold', 9, thc, track=0.16)
    h = pg.para(104, 48, 175, esc(d['headline']), 'ArchivoNarrow-Bold', 40, 0.98)
    y = max(96, 48 + h + 8)
    h = pg.para(18, y, 236, esc(d['student']), 'Archivo-Regular', 14, 1.38)
    y += h + 4
    h = pg.para(18, y, 236, f"<font name='Archivo-SemiBold' size='{pg.fs(8)}' color='#5b5650'>THE TEAM&#160;&#160;</font>{esc(d['team'])}", 'Archivo-Regular', 11, 1.38, GRAPHITE)
    y += h + 9
    y += ACTS[d['interaction']['type']](pg, d, y) + 6
    # your turn
    pr = d['print']
    pg.line(18, y, 279, y, RULE, 0.6)
    pg.text(18, y + 7, 'YOUR TURN', 'Archivo-SemiBold', 8, thc, track=0.16)
    h = pg.para(18, y + 9, 261, esc(pr['prompt']), 'Archivo-Regular', 11, 1.3)
    yy = y + 11 + h + 7
    n = pr['lines'] if pr['lines'] else 0
    room = 388 - yy
    if n == 0 and room > 20:  # a drawing space
        pg.rect(18, yy - 4, 261, room - 2, stroke=RULE, lw=0.5)
    else:
        pg.wlines(18, yy, 261, max(1, int(room // 12)), 12)
    footer(pg, d, page_no, total)


def cover_page(pg, total):
    header(pg, 'DAY 00 — 90')
    pg.text(16, 112, 'THE FIRST', 'ArchivoNarrow-Bold', 118, INK)
    pg.text(16, 152, '90 DAYS', 'ArchivoNarrow-Bold', 118, INK)
    pg.text(18, 170, C['meta']['subtitle'], 'ArchivoNarrow-Bold', 26, INK)
    strip91(pg, 18, 188, 15.5, 8, 2.2, hit=None, all_turns=True, big=False)
    y = 188 + 7 * 10.2 + 10
    pg.rect(18, y, 1.4, 16, fill=TH['self'])
    pg.para(23, y, 200, f"<font name='Archivo-SemiBold'>Research note.</font> {esc(C['meta']['researchNote'])}", 'Archivo-Regular', 12.5, 1.35, GRAPHITE)
    y += 26
    pg.text(18, y, 'HOW TO USE THE PRINTED CALENDAR', 'Archivo-SemiBold', 8.5, GRAPHITE, track=0.16)
    tips = ['Hang it where you work, or stand it on a desk. Turn a page when you reach that day.',
            'Every day has the new designer’s side and the team’s side, plus a fill-in prompt.',
            'The twelve days are turning points, not a schedule. Skip, reorder and write on them.']
    for i, t in enumerate(tips): pg.para(18, y + 4 + i * 9, 240, '·&#160;&#160;' + esc(t), 'Archivo-Regular', 11, 1.3)
    y += 36
    for i, t in enumerate(C['disclaimers'][:4]): pg.para(18, y + 4 + i * 6.5, 255, esc(t), 'Archivo-Regular', 8.5, 1.3, GRAPHITE)
    footer(pg, None, 1, total)


def closing_page(pg, total):
    header(pg, 'AFTER DAY 90')
    h = pg.para(18, 38, 250, esc(C['finding']['headline']), 'ArchivoNarrow-Bold', 46, 0.96)
    y = 38 + h + 6
    h = pg.para(18, y, 250, esc(C['finding']['intro']), 'Archivo-Regular', 12, 1.35, GRAPHITE)
    y += h + 8
    colw = 84
    ymax = y
    for i, k in enumerate(['role', 'team', 'self']):
        x = 18 + i * (colw + 4.5)
        pg.rect(x, y, colw, 1.8, fill=TH[k])
        pg.text(x, y + 9, C['threads'][k]['label'].upper(), 'ArchivoNarrow-Bold', 15, TH[k])
        yy = y + 14
        for d in C['days']:
            if k in d['threads'] and d['interaction']['type'] != 'map':
                hh = pg.para(x, yy, colw, f"<font name='DMMono-Regular' size='{pg.fs(7.5)}'>D{d['label']}&#160;</font>{esc(d['slip'])}", 'Archivo-Regular', 9.5, 1.3)
                yy += hh + 3
        ymax = max(ymax, yy)
    y = ymax + 4
    pg.para(18, y, 260, esc(C['finding']['close']).upper(), 'ArchivoNarrow-Bold', 20, 1)
    y += 14
    pg.line(18, y, 279, y, RULE, 0.6)
    pg.text(18, y + 7, 'SOURCES', 'Archivo-SemiBold', 8, GRAPHITE, track=0.16)
    y += 10
    for k, s in C['sources'].items():
        t = f"<font name='Archivo-SemiBold'>{esc(s['title'])}</font> — {esc(s['publisher'])}. {esc(s['note'])}" + (f" {esc(s['url'])}" if s.get('url') else '')
        y += pg.para(18, y, 261, t, 'Archivo-Regular', 8, 1.32, GRAPHITE) + 2.5
    y += 2
    pg.text(18, y + 4, 'READ THIS BEFORE QUOTING THE CALENDAR', 'Archivo-SemiBold', 8, GRAPHITE, track=0.16)
    y += 7
    for t in C['disclaimers'][:4]:
        y += pg.para(18, y, 261, '·&#160;' + esc(t), 'Archivo-Regular', 8, 1.3, GRAPHITE) + 1
    pg.para(18, y + 4, 261, 'Typeset in Archivo, Archivo Narrow, DM Mono and Kalam (SIL Open Font License). Vector artwork only; no photographs are reproduced in this print edition.', 'Archivo-Italic', 7.5, 1.3, GRAPHITE)
    footer(pg, None, total, total)


def build(size_name, trim_w_mm, trim_h_mm, k, out):
    W, H = trim_w_mm * mm, trim_h_mm * mm
    MW, MH = W + 2 * (BLEED + SLUG), H + 2 * (BLEED + SLUG)
    c = canvas.Canvas(out, pagesize=(MW, MH), initialFontName='Archivo-Regular')
    c.setTitle(f"The First 90 Days — {size_name} print master")
    c.setAuthor('Studio Bridge'); c.setSubject(C['meta']['researchNote'])
    c.setCreator('first-90-days/tools/build_print.py (reportlab)')
    total = len(C['days']) + 2
    pages = [('cover', None)] + [('day', d) for d in C['days']] + [('close', None)]
    for i, (kind, d) in enumerate(pages, 1):
        c.setTrimBox((SLUG + BLEED, SLUG + BLEED, SLUG + BLEED + W, SLUG + BLEED + H))
        c.setBleedBox((SLUG, SLUG, SLUG + 2 * BLEED + W, SLUG + 2 * BLEED + H))
        pg = Page(c, W, H, k)
        background(pg)
        if kind == 'cover': cover_page(pg, total)
        elif kind == 'close': closing_page(pg, total)
        else: day_page(pg, d, i, total)
        crop_marks(c, W, H, f"The First 90 Days · {size_name} {trim_w_mm:g}×{trim_h_mm:g} mm trim · 3 mm bleed · page {i}/{total} · top-edge Wire-O, keep {15 * k:.0f} mm binding zone clear")
        c.showPage()
    c.save()


def production_notes(out):
    W, H = 210 * mm, 297 * mm
    c = canvas.Canvas(out, pagesize=(W, H), initialFontName='Archivo-Regular'); c.setTitle('The First 90 Days — production and binding notes')
    c.setFillColor(INK); c.setFont('ArchivoNarrow-Bold', 26); c.drawString(18 * mm, H - 26 * mm, 'THE FIRST 90 DAYS · PRODUCTION NOTES')
    st = ParagraphStyle('n', fontName='Archivo-Regular', fontSize=9.5, leading=13.2, textColor=INK)
    sh = ParagraphStyle('h', fontName='Archivo-SemiBold', fontSize=8, leading=11, textColor=GRAPHITE)
    rows = [
        ('FILES', 'TheFirst90Days_A3_PrintReady.pdf — 14 pages, trim 297 × 420 mm portrait.<br/>TheFirst90Days_A2_PrintReady.pdf — 14 pages, trim 420 × 594 mm portrait (the A3 layout scaled by 1.414; bleed and marks are not scaled).'),
        ('PAGE ORDER', '1 cover · 2–13 Day 00, 01, 03, 07, 14, 21, 30, 45, 60, 75, 85, 90 · 14 closing page with the three threads, sources and disclaimers.'),
        ('BLEED & MARKS', '3 mm bleed on all sides; crop marks in a 9 mm slug, offset 4 mm from trim. TrimBox and BleedBox are set on every page. The background tint and the bottom thread bar run into the bleed.'),
        ('BINDING', 'Top-edge Wire-O (twin loop) with a calendar hanger. Suggested pitch 3:1 for A3 and 2:1 for A2, 12–14 mm loop diameter. Holes centred about 6 mm (A3) / 8 mm (A2) below the trim edge. The top 15 mm (A3) / 21 mm (A2) holds nothing but background tint, so punching never touches type. Confirm hole size and pitch with your binder.'),
        ('STOCK', 'Pages: 250–300 gsm uncoated, printed single-sided (backs blank). Back board: 2 mm greyboard, same size as trim. Optional front cover: 300 gsm with clear acetate.'),
        ('COLOUR', 'All artwork is CMYK vector. Total ink stays under 260%. No ICC output intent is embedded and the files are not certified PDF/X: request a hard proof and let the printer apply their profile.'),
        ('FONTS', 'Archivo, Archivo Narrow, DM Mono and Kalam (SIL Open Font License), embedded as subsets. All text is live vector type, not raster.'),
        ('IMAGES', 'None. The exhibit’s desk photographs and props are screen-resolution PNGs (about 1376 × 768) and are deliberately not used in print.'),
        ('QA DONE', 'Checked with pdfinfo (page sizes and boxes), pdffonts (all fonts embedded), pdfimages (no images) and by rendering every page to PNG and inspecting it for overflow and binding-zone clearance.'),
        ('NOT DONE', 'No physical proof, no preflight in Acrobat or PitStop, and no check against a specific printer’s profile.'),
        ('CONTENT', esc(C['meta']['researchNote']) + ' ' + esc(C['meta']['composite'])),
    ]
    y = H - 38 * mm
    for h, t in rows:
        p = Paragraph(h, sh); p.wrap(32 * mm, 100); p.drawOn(c, 18 * mm, y - p.height)
        q = Paragraph(t, st); _, qh = q.wrap(140 * mm, 1000); q.drawOn(c, 52 * mm, y - qh)
        y -= max(qh, 11) + 6
    c.setFont('Archivo-Regular', 7.5); c.setFillColor(GRAPHITE); c.drawString(18 * mm, 14 * mm, C['meta']['attribution'] + ' · generated from src/data/content.json')
    c.showPage(); c.save()


if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'public', 'print')
    os.makedirs(outdir, exist_ok=True)
    build('A3', 297, 420, 1.0, os.path.join(outdir, 'TheFirst90Days_A3_PrintReady.pdf'))
    build('A2', 420, 594, 420 / 297, os.path.join(outdir, 'TheFirst90Days_A2_PrintReady.pdf'))
    production_notes(os.path.join(outdir, 'TheFirst90Days_ProductionNotes.pdf'))
    print('ok', outdir)
