"""Interaction QA for THE FIRST 90 DAYS (headless Chrome). Serve dist/ on :8767 first:
   cd dist && python3 -m http.server 8767
"""
import json, re, sys
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8767/'
C = json.load(open('src/data/content.json', encoding='utf-8'))
DAYS = C['days']
results = []
def check(cond, name):
    results.append((bool(cond), name)); print(('PASS ' if cond else 'FAIL ') + name)

def norm(t): return re.sub(r'\s+', ' ', t.replace('’', "'").replace('“', '"').replace('”', '"')).strip().lower()

def page_text(pg, sel='.pageslot:not(.pageslot--turn) .cpage'): return pg.inner_text(sel)
def turn(pg, key='ArrowRight'):
    pg.keyboard.press(key); pg.wait_for_timeout(900)
def go(pg, n):
    pg.evaluate("document.activeElement && document.activeElement.blur()")
    cur = int(pg.inner_text('.topbar__where span:last-child').split('/')[0].strip()) - 1
    while cur < n: turn(pg); cur += 1
    while cur > n: turn(pg, 'ArrowLeft'); cur -= 1

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=URL[:-1])
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.on('response', lambda r: errors.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    pg.goto(URL); pg.wait_for_timeout(900)

    # --- cover ---
    t = norm(page_text(pg))
    check('the first 90 days' in t and norm(C['meta']['subtitle']) in t, 'cover: title and subtitle')
    check(norm(C['meta']['researchNote']) in t, 'cover: research note verbatim')
    check(pg.locator('.mode-stage').count() == 1, 'stage mode at 1440×900')
    check(pg.locator('.p-sticky').is_disabled() and pg.locator('.p-pencil').is_disabled() and pg.locator('.p-clips').is_disabled(), 'day-only props disabled on the cover')
    check(pg.locator('.ring').count() == 18 and pg.locator('.pageslot:not(.pageslot--turn) .holes i').count() == 18, '18 SVG rings aligned to 18 punched holes')
    # ring/hole alignment in screen space
    al = pg.evaluate("""() => { const r=[...document.querySelectorAll('.ring')].map(e=>{const b=e.getBoundingClientRect();return b.left+b.width/2});
      const h=[...document.querySelectorAll('.pageslot:not(.pageslot--turn) .holes i')].map(e=>{const b=e.getBoundingClientRect();return b.left+b.width/2});
      return Math.max(...r.map((x,i)=>Math.abs(x-h[i]))) }""")
    check(al < 1.0, f'rings centred on holes (max offset {al:.2f}px)')

    # --- turning: race guard, then every headline ---
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(120)
    check(pg.locator('.pageslot--turn.turn-out').count() == 1, 'forward turn renders the outgoing page rotating about the ring line')
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(900)
    check(pg.inner_text('.topbar__where .mono') == 'DAY 00', 'second key press mid-turn is ignored (no skipped page)')
    for i, d in enumerate(DAYS):
        if i > 0: turn(pg)
        t = norm(page_text(pg))
        ok = norm(d['headline']) in t and norm(d['student']) in t and norm(d['theme']) in t
        check(ok, f"Day {d['label']}: headline, theme and student text exact")
    check(pg.locator('.pnav__next').count() == 0, 'last page has no next tab')
    turn(pg, 'ArrowRight'); check(pg.inner_text('.topbar__where .mono') == 'DAY 90', 'cannot turn past Day 90')
    pg.keyboard.press('Home'); pg.wait_for_timeout(950); check('COVER' in pg.inner_text('.topbar__where'), 'Home returns to cover')
    pg.keyboard.press('End'); pg.wait_for_timeout(950); check('DAY 90' in pg.inner_text('.topbar__where'), 'End jumps to Day 90')
    pg.keyboard.press('Home'); pg.wait_for_timeout(950)
    pg.click('.pnav__next'); pg.wait_for_timeout(950); check('DAY 00' in pg.inner_text('.topbar__where'), 'corner tab turns forward')
    pg.click('.pnav__next'); pg.wait_for_timeout(950); pg.click('.pnav__prev'); pg.wait_for_timeout(950)
    check('DAY 00' in pg.inner_text('.topbar__where'), 'back tab turns back (page flips down from above)')
    # swipe up on the page (pointer)
    box = pg.locator('.calendar__pages').bounding_box()
    x, y = box['x'] + box['width'] * 0.8, box['y'] + box['height'] * 0.9
    pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x, y - 140, steps=6); pg.mouse.up(); pg.wait_for_timeout(950)
    check('DAY 01' in pg.inner_text('.topbar__where'), 'pointer swipe up turns the page')
    pg.mouse.move(x, y - 200); pg.mouse.down(); pg.mouse.move(x, y - 40, steps=6); pg.mouse.up(); pg.wait_for_timeout(950)
    check('DAY 00' in pg.inner_text('.topbar__where'), 'pointer swipe down turns back')

    # --- perspective ---
    pg.click('.persp button:has-text("The team")'); pg.wait_for_timeout(200)
    check(norm(DAYS[0]['team']) in norm(page_text(pg)), 'team perspective swaps the text')
    turn(pg); check(norm(DAYS[1]['team']) in norm(page_text(pg)), 'perspective persists across pages')
    pg.click('.persp button:has-text("New designer")'); turn(pg, 'ArrowLeft')

    # --- Day 00 letter ---
    pg.click('button:has-text("Unfold the letter")'); pg.wait_for_timeout(1900)
    t = norm(pg.inner_text('.letter'))
    check(norm(DAYS[0]['interaction']['letter']['body']) in t and all(norm(m) in t for m in DAYS[0]['interaction']['margin']), 'D00: letter unfolds with body and 3 margin notes')
    pg.click('button:has-text("Fold it back up")'); pg.wait_for_timeout(600)
    check(pg.locator('.ix-letter.is-open').count() == 0, 'D00: letter folds back')
    # envelope prop on Day 00 toggles the letter
    pg.click('.p-envelope'); pg.wait_for_timeout(400); check(pg.locator('.ix-letter.is-open').count() == 1, 'envelope prop opens the letter on Day 00')

    # --- Day 01 flap ---
    go(pg, 2)
    check(pg.get_attribute('.org__under', 'aria-hidden') == 'true', 'D01: unwritten chart hidden under the flap')
    pg.click('button:has-text("Lift the flap")'); pg.wait_for_timeout(800)
    t = norm(pg.inner_text('.org__under'))
    check(pg.get_attribute('.org__under', 'aria-hidden') == 'false' and all(norm(n['unwritten']) in t for n in DAYS[1]['interaction']['nodes']), 'D01: lifting the flap reveals all 6 unwritten notes')

    # --- Day 03 slips ---
    go(pg, 3)
    for _ in range(6): pg.click('.pocket .ix-btn'); pg.wait_for_timeout(120)
    check(pg.locator('.slips .slip').count() == 6 and pg.locator('.pocket .ix-btn').is_disabled(), 'D03: six slips pulled, pocket then empty')
    check(pg.locator('.ix-slips .ix-after').count() == 0, 'D03: no conclusion before sorting')
    for i in range(6): pg.click(f'.slips .slip >> nth={i} >> button >> nth={i % 3}')
    check(pg.locator('.ix-slips .ix-after').count() == 1, 'D03: sorting every slip reveals the note (no answer key)')

    # --- Day 07 prioritise ---
    go(pg, 4)
    check(pg.locator('button:has-text("Put the replies in order")').is_disabled(), 'D07: reply locked until all three are ordered')
    for i in (2, 0, 1): pg.click(f'.sticky >> nth={i}'); pg.wait_for_timeout(100)
    nums = pg.eval_on_selector_all('.sticky__num', 'els => els.map(e => e.textContent)')
    check(nums == ['2', '3', '1'], f'D07: numbers follow tap order ({nums})')
    pg.click('button:has-text("Write the reply")'); pg.wait_for_timeout(300)
    check(norm(DAYS[3]['interaction']['after']) in norm(pg.inner_text('.ix-prio')) and pg.locator('.sticky__after').count() == 3, 'D07: reply note and “looking after” labels shown')
    pg.click('button:has-text("Start over")'); check(pg.locator('.sticky__num').count() == 0, 'D07: start over clears the order')

    # --- Day 14 draft ---
    go(pg, 5)
    pg.click('button:has-text("Open the unsent draft")'); pg.click('button:has-text("Rewrite it")'); pg.wait_for_timeout(200)
    check(norm(DAYS[4]['interaction']['rewrite']) in norm(pg.inner_text('.chat')), 'D14: rewrite replaces the apology')
    pg.click('.ix-draft button:has-text("Send it")'); pg.wait_for_timeout(200)
    check(norm(DAYS[4]['interaction']['options']['send']) in norm(pg.inner_text('.chat')) and pg.locator('.ix-draft .ix-btn').count() == 0, 'D14: send shows the reply and closes the choices')

    # --- Day 21 brief ---
    go(pg, 6)
    check(pg.get_attribute('.ripple', 'aria-hidden') == 'true', 'D21: ripple hidden on the original')
    pg.focus('.ruler-range input')
    for _ in range(60): pg.keyboard.press('ArrowRight')
    pg.wait_for_timeout(500)
    check(pg.get_attribute('.ripple', 'aria-hidden') == 'false' and pg.evaluate("getComputedStyle(document.querySelector('.ripple')).opacity") == '1', 'D21: keyboard slides the revised brief over and shows the ripple')
    clip = pg.evaluate("document.querySelector('.brief__sheet--b').style.clipPath")
    check('40%' in clip, f'D21: acetate wipe follows the ruler ({clip})')
    pg.click('button:has-text("Show original")'); check(pg.input_value('.ruler-range input') == '0', 'D21: show original resets')
    pg.click('.p-ruler'); pg.wait_for_timeout(200); check(pg.input_value('.ruler-range input') == '100', 'ruler prop lays the revised brief over on Day 21')

    # --- Day 30 checklist -> Day 45 agenda ---
    go(pg, 7)
    pg.click('.turncard >> nth=0'); pg.click('.turncard >> nth=2'); pg.click('.turncard >> nth=3'); pg.click('.turncard >> nth=3')
    st = pg.eval_on_selector_all('.turncard', 'els => els.map(e => e.dataset.state)')
    check(st[:4] == ['Learned something', '', 'Learned something', 'Just did it'], f'D30: cards turn through states ({st[:4]})')
    pg.focus('.turncard >> nth=5'); pg.keyboard.press('Enter'); pg.wait_for_timeout(100)
    check(pg.evaluate("document.activeElement.classList.contains('turncard')") and pg.get_attribute('.turncard >> nth=5', 'data-state') == 'Learned something', 'D30: keyboard turns a card and keeps focus')
    go(pg, 8)
    pg.click('button:has-text("Unfold the agenda")'); pg.wait_for_timeout(300); pg.click('button:has-text("Unfold the last fold")'); pg.wait_for_timeout(700)
    t = norm(pg.inner_text('.agenda-paper'))
    check('resized banners' in t and 'asked about colour profiles' in t and 'fixed the shared type styles' in t, 'D45: Day 30 learning carried onto agenda item 4')

    # --- Day 60 filing ---
    go(pg, 9)
    for i in range(6): pg.click('.loose .slip >> nth=0 >> button >> nth=' + str(1 if i else 0)); pg.wait_for_timeout(80)
    check(pg.locator('.tray--0 li').count() == 1 and pg.locator('.tray--1 li').count() == 5, 'D60: six slips filed into two trays')
    check(norm(DAYS[8]['interaction']['after']) in norm(pg.inner_text('.ix-file')), 'D60: note appears when the pile is empty')
    pg.click('.tray--1 li button >> nth=0'); check(pg.locator('.tray--0 li').count() == 2, 'D60: a filed slip can move trays')

    # --- Day 75 tabs ---
    go(pg, 10)
    pg.click('.acetate.is-front .chip >> nth=0')
    pg.focus('[role=tab][aria-selected=true]'); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(150)
    check(pg.get_attribute('#tab-work', 'aria-selected') == 'true', 'D75: arrow keys move between tabs')
    pg.click('.acetate.is-front .chip >> nth=0'); pg.click('#tab-keep'); pg.wait_for_timeout(150)
    t = norm(pg.inner_text('#sheet-keep'))
    check('big launches' in t and 'building systems' in t and '(2)' in pg.inner_text('#tab-keep'), 'D75: kept items collect on the third overlay')

    # --- Day 85 sheets ---
    go(pg, 11)
    check(pg.locator('.ix-sheets.is-overlap').count() == 0, 'D85: sheets start apart')
    pg.click('button:has-text("Slide the sheets together")'); pg.wait_for_timeout(700)
    check(pg.locator('.ix-sheets.is-overlap').count() == 1 and pg.evaluate("getComputedStyle(document.querySelector('.two__overlap')).opacity") == '1', 'D85: overlap text appears when the sheets meet')

    # --- desk props ---
    pg.click('.p-mug'); pg.wait_for_timeout(300)
    check(norm(DAYS[10]['mug']) in norm(pg.inner_text('.mugnote')), 'mug moves aside to reveal this day’s question')
    pg.click('.p-mug'); check(pg.locator('.mugnote').count() == 0, 'mug goes back')
    pg.click('.p-badge'); pg.wait_for_timeout(800)
    rot = pg.evaluate("getComputedStyle(document.querySelector('.badge3d')).transform")
    check(pg.get_attribute('.p-badge', 'aria-pressed') == 'true' and rot != 'none' and 'The planning meeting' in pg.inner_text('.badge__back'), 'badge flips (3D) and shows the Day 85 back')
    pg.click('.p-pencil'); pg.wait_for_timeout(200); check(pg.locator('.pageslot:not(.pageslot--turn) .pring').count() == 1, 'pencil circles the day number')
    pg.click('.p-clips'); pg.wait_for_timeout(200); check(pg.locator('.pageslot:not(.pageslot--turn) .pclip').count() == 1, 'binder clip grips the page')
    pg.click('.p-sticky'); pg.fill('.notepad textarea', 'Ask for the why sooner'); pg.click('button:has-text("Stick it on the page")'); pg.wait_for_timeout(300)
    check('Ask for the why sooner' in pg.inner_text('.pnotes'), 'sticky note added to the page')
    pg.click('.p-sticky'); pg.fill('.notepad textarea', 'x' * 200); check(len(pg.input_value('.notepad textarea')) == 140, 'note limited to 140 characters'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.click('.p-pile'); pg.wait_for_timeout(300)
    row = norm(pg.inner_text('.dindex li:has-text("DAY 85")'))
    check('✓' in row and '◯' in row and '▮' in row and '✎1' in row, 'index shows opened, pencil, clip and note marks')
    pg.click('.dindex button:has-text("HELLO, EVERYONE.")'); pg.wait_for_timeout(950)
    check('DAY 01' in pg.inner_text('.topbar__where') and pg.locator('dialog[open]').count() == 0, 'index entry turns to that day and closes')
    pg.click('.p-sheets'); pg.wait_for_timeout(200)
    t = pg.inner_text('.drawer')
    check('Bauer' in t and DAYS[1]['basis'][:30] in t and 'Studio Bridge primary research' in t, 'research notes open the evidence drawer with this day’s basis and sources')
    pg.click('.drawer .xbtn')
    pg.click('.p-sketch'); pg.wait_for_timeout(300)
    t = pg.inner_text('.sketchbook')
    check(DAYS[0]['slip'] in t and DAYS[10]['slip'] in t and 'Ask for the why sooner' in t, 'sketchbook lists notes to self from visited days and your notes')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200); check(pg.locator('dialog[open]').count() == 0, 'Escape closes the sketchbook')
    pg.click('.p-envelope'); pg.wait_for_timeout(950); check('DAY 00' in pg.inner_text('.topbar__where'), 'envelope prop turns to Day 00')

    # --- lighting ---
    for l in ['afternoon', 'evening', 'lamp', 'morning']:
        pg.select_option('.tlight select', l); pg.wait_for_timeout(100)
        on = pg.eval_on_selector_all('.light.is-on', 'els => els.length')
        check(on == 1 and pg.locator(f'.stage.light-{l}').count() == 1, f'lighting: {l} overlay on alone')
    pg.select_option('.tlight select', 'lamp')
    sx = pg.evaluate("[document.querySelector('.p-mug').style.getPropertyValue('--sx'), document.querySelector('.p-sheets').style.getPropertyValue('--sx')]")
    check(sx[0].startswith('') and not sx[0].startswith('-') and sx[1].startswith('-'), f'desk lamp: shadows point away from the lamp ({sx})')
    pg.evaluate("document.activeElement.blur()"); pg.keyboard.press('l'); check(pg.locator('.stage.light-morning').count() == 1, 'L key cycles the light')

    # --- PDFs ---
    for f in ['TheFirst90Days_A3_PrintReady.pdf', 'TheFirst90Days_A2_PrintReady.pdf', 'TheFirst90Days_ProductionNotes.pdf']:
        r = pg.request.get(URL + 'print/' + f)
        check(r.status == 200 and r.body()[:5] == b'%PDF-', f'print panel PDF served: {f}')
    pg.click('.tbtn:has-text("Print")'); pg.wait_for_timeout(200)
    with pg.expect_download() as dl: pg.click('.pdfs a >> nth=0')
    check(dl.value.suggested_filename == 'TheFirst90Days_A3_PrintReady.pdf', 'A3 PDF downloads from the print panel')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    pg.emulate_media(media='print'); pg.wait_for_timeout(200)
    vis = pg.evaluate("[getComputedStyle(document.querySelector('.topbar')).display, getComputedStyle(document.querySelector('.p-mug')).display, getComputedStyle(document.querySelector('.cpage')).display]")
    check(vis == ['none', 'none', 'block'], f'print stylesheet prints only the calendar page ({vis})')
    pg.screenshot(path='screens/print-page.png'); pg.emulate_media(media='screen')

    # --- map and finding ---
    pg.keyboard.press('End'); pg.wait_for_timeout(950)
    check(pg.locator('.xmap__c').count() == 91 and pg.locator('.xmap__c.is-turn').count() == 12, 'D90: 91 day cells, 12 turning points')
    check(pg.locator('.xmap__c.is-marked').count() == 1 and pg.locator('.xmap__c.is-clipped').count() == 1, 'D90: pencil mark and clip carried onto the map')
    pg.click('.xmap__c.is-turn >> nth=5'); pg.wait_for_timeout(950); check('DAY 21' in pg.inner_text('.topbar__where'), 'D90: map cell turns to that day')
    pg.keyboard.press('End'); pg.wait_for_timeout(950)
    pg.click('button:has-text("See what came later")'); pg.wait_for_timeout(600)
    t = norm(pg.inner_text('.finding'))
    check(norm(C['finding']['headline']) in t, 'finding headline exact')
    check(all(norm(C['threads'][k]['label']) in t for k in ['role', 'team', 'self']), 'finding shows the three threads')
    check('not opened yet' not in t and 'big launches' in t and 'resized banners' in t, 'finding uses visited days, Day 30 learning and Day 75 keeps')
    check('%' not in t and 'score' not in t.replace('nothing here is measured or scored', '').replace('nothing is scored', ''), 'no scores or percentages in the finding')
    pg.click('button:has-text("Copy summary")'); pg.wait_for_timeout(300)
    clip = pg.evaluate('navigator.clipboard.readText()')
    check(C['finding']['headline'] in clip and 'Ask for the why sooner' in clip, 'copy summary puts the summary on the clipboard')
    with pg.expect_download() as dl: pg.click('button:has-text("Save .txt")')
    check(dl.value.suggested_filename == 'the-first-90-days.txt', 'save .txt downloads the summary')
    pg.emulate_media(media='print'); pg.wait_for_timeout(150)
    check(pg.evaluate("getComputedStyle(document.querySelector('.print-summary')).display") == 'block' and pg.evaluate("getComputedStyle(document.querySelector('.desk')).display") == 'none', 'print summary sheet used when printing the finding')
    pg.emulate_media(media='screen')
    pg.click('button:has-text("Back to the calendar")'); check(pg.locator('.finding').count() == 0 and 'DAY 90' in pg.inner_text('.topbar__where'), 'back to the calendar keeps the state')
    pg.click('.tbtn:has-text("Reset")'); pg.wait_for_timeout(300)
    check('COVER' in pg.inner_text('.topbar__where') and pg.locator('.light.is-on').count() == 1 and pg.locator('.stage.light-morning').count() == 1, 'reset returns to the cover and morning light')
    pg.keyboard.press('End'); pg.wait_for_timeout(950)
    check(pg.locator('.xmap__c.is-seen').count() == 1 and pg.locator('.xmap__c.is-marked').count() == 0, 'reset clears visits, marks and notes')
    check(pg.evaluate('localStorage.length') == 0 and pg.evaluate('sessionStorage.length') == 0, 'nothing persisted to storage')
    check(not errors, f'no console errors or failed requests ({errors[:3]})')
    ctx.close()

    # --- reduced motion ---
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(700)
    check(pg.locator('.app.rm').count() == 1, 'reduced motion detected')
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(60)
    check(pg.locator('.pageslot--turn.rm-fade').count() == 1, 'reduced motion: page crossfades instead of flipping')
    pg.wait_for_timeout(320); check('DAY 00' in pg.inner_text('.topbar__where') and pg.locator('.pageslot--turn').count() == 0, 'reduced motion: turn completes in ~200 ms')
    ctx.close()

    # --- v1.1: pal tips, why-notes, illustrations, sound, confetti, beacons ---
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); errs2 = []
    pg.on('pageerror', lambda e: errs2.append(str(e)))
    pg.add_init_script("""(() => { window.__nodes = 0; const P = (window.AudioContext||window.webkitAudioContext).prototype;
      for (const m of ['createOscillator','createBufferSource']) { const o = P[m]; P[m] = function(...a){ window.__nodes++; return o.apply(this, a); }; } })();""")
    pg.goto(URL); pg.wait_for_timeout(900)
    check(pg.locator('.deskhint').count() == 1, 'cover: the blue pal invites you to tap the desk')
    check(pg.locator('.cpage--cover .part__ch').count() == 1 and pg.locator('.cover__sb').count() == 1, 'cover: Studio Bridge character and badge')
    nb = pg.locator('.beacon').count()
    check(nb == 7, f'every desk object usable on the cover carries a beacon ({nb})')
    tips = {'p-mug': 'mug', 'p-badge': 'badge', 'p-sketch': 'sketch', 'p-pile': 'pile', 'p-sheets': 'sheets', 'p-ruler': 'ruler', 'p-envelope': 'envelope'}
    ok_tips = []
    for cls, key in tips.items():
        if pg.locator('dialog[open]').count(): pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        if pg.locator('.drawer').count(): pg.click('.drawer .xbtn')
        if 'DAY' in pg.inner_text('.topbar__where') and key not in ('envelope', 'ruler'): pass
        pg.click('.' + cls, force=True); pg.wait_for_timeout(250)
        t = norm(pg.inner_text('.paltip')) if pg.locator('.paltip').count() else ''
        ok_tips.append(norm(C['props'][key]['what']) in t and norm(C['props'][key]['why']) in t)
        if pg.locator('dialog[open]').count(): pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        if pg.locator('.drawer').count(): pg.click('.drawer .xbtn')
    check(all(ok_tips), f'every desk object explains what it is and why it matters ({sum(ok_tips)}/{len(ok_tips)})')
    check(pg.locator('.deskhint').count() == 0 and pg.locator('.beacon').count() < nb, 'trying objects clears the invitation and their beacons')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    check(pg.locator('.paltip').count() == 0, 'Esc closes the pal tip')
    pg.click('.p-pencil', force=True) if pg.locator('.p-pencil:not([disabled])').count() else None
    pg.click('.tbtn:has-text("Reset")'); pg.wait_for_timeout(300)
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(950)
    check(all(pg.locator(f'.cpage--day .part__ch').count() == 1 for _ in [0]) and pg.locator('.cpage--day .part__st').count() == 1, 'Day 00 carries a character and a sticker')
    n0 = pg.evaluate('window.__nodes')
    pg.click('text=Unfold the letter'); pg.wait_for_timeout(300)
    check(pg.locator('.confetti i').count() >= 50, 'unfolding the offer letter fires confetti')
    check(norm(C['days'][0]['why']) in norm(pg.inner_text('.whyslot')), 'Day 00: the pink pal explains why it matters after you use the page')
    n1 = pg.evaluate('window.__nodes')
    check(n1 > n0, f'sound plays on interaction ({n1 - n0} audio nodes)')
    pg.click('.whynote__x'); check(pg.locator('.whybtn').count() == 1, 'the why-note tucks away into a “Why it matters” button')
    pg.click('.whybtn'); check(pg.locator('.whynote').count() == 1, 'and opens again')
    pg.click('.tbtn--icon'); check(pg.get_attribute('.tbtn--icon', 'aria-pressed') == 'false', 'sound toggle turns sound off')
    n2 = pg.evaluate('window.__nodes'); pg.click('text=Fold it back up'); pg.click('.p-mug'); pg.wait_for_timeout(200)
    check(pg.evaluate('window.__nodes') == n2, 'with sound off, nothing plays')
    pg.click('.tbtn--icon')
    arts = []
    for i in range(12):
        arts.append(pg.locator('.pageslot:not(.pageslot--turn) .part__ch').count() == 1)
        pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(900)
    check(all(arts), f'all twelve days carry a Studio Bridge illustration ({sum(arts)}/12)')
    check(pg.locator('.steam').count() == 1 and pg.locator('.motes i').count() > 0, 'desk life: mug steam and drifting dust in daylight')
    pg.click('text=See what came later'); pg.wait_for_timeout(400)
    check(pg.locator('.finding__pal').count() == 1 and pg.locator('.confetti i').count() >= 50, 'the finding celebrates (pal + confetti)')
    check(not errs2, f'no errors with tips, sound and motion ({errs2[:2]})')
    ctx.close()
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(500)
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(400); pg.click('text=Unfold the letter'); pg.wait_for_timeout(200)
    check(pg.locator('.confetti').count() == 0 and pg.locator('.motes').count() == 0 and not pg.locator('.steam').is_visible() and pg.locator('.whynote').count() == 1, 'reduced motion: no confetti, dust or steam; tips and notes still appear')
    ctx.close()

    # --- missing assets fall back cleanly ---
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page()
    pg.route(re.compile(r'.*(FD_PROP_02_CeramicMug|FD_ENV_01_OverheadDesk|FD_PROP_01_RingBound).*'), lambda r: r.abort())
    pg.goto(URL); pg.wait_for_timeout(900)
    miss = pg.eval_on_selector_all('[data-missing]', 'els => els.map(e => e.dataset.missing)')
    broken = pg.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0).length")
    check(any('CeramicMug' in m for m in miss) and any('OverheadDesk' in m for m in miss) and broken == 0, f'missing images show labelled fallbacks, no broken icons ({len(miss)} fallbacks)')
    pg.click('.p-mug'); check(pg.locator('.mugnote').count() == 1, 'mug still works with its image missing')
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(950); check('DAY 00' in pg.inner_text('.topbar__where'), 'calendar still turns with the board image missing')
    ctx.close(); b.close()

passed = sum(1 for r in results if r[0])
print(f'\n{passed}/{len(results)} checks passed')
sys.exit(0 if passed == len(results) else 1)
