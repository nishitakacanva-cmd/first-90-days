"""Viewport + touch QA for THE FIRST 90 DAYS. Serve dist/ on :8767 first."""
import asyncio
from playwright.async_api import async_playwright
URL='http://localhost:8767/'
async def act(pg, sel, touch):
    el=pg.locator(sel).first; await el.scroll_into_view_if_needed()
    try:
        if touch: await el.tap(timeout=8000)
        else: await el.click(timeout=8000)
    except Exception as e:
        print('ACT FAILED', sel, str(e).split('\n')[-3:]); raise
async def run(b,w,h,tag,touch=False):
    ctx=await b.new_context(viewport={'width':w,'height':h}, has_touch=touch, is_mobile=touch and w<800)
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    await pg.goto(URL); await pg.wait_for_timeout(900)
    mode=(await pg.evaluate("document.querySelector('.app').className")).split()[1]
    await pg.screenshot(path=f'/tmp/fd/v-{tag}-0.png')
    live='.pageslot:not(.pageslot--turn) '
    await act(pg,live+'.cover__cta',touch); await pg.wait_for_timeout(1000)
    await act(pg,live+'.ix-letter .ix-btn',touch); await pg.wait_for_timeout(1500)
    ok_letter=await pg.locator(live+'.ix-letter.is-open').count()==1
    for _ in range(5): await act(pg,live+'.pnav__next',touch); await pg.wait_for_timeout(950)
    day=await pg.inner_text('.topbar__where .mono')
    await act(pg,live+'.ruler-range ~ .ix-row .ix-btn',touch); await pg.wait_for_timeout(500)
    ripple=await pg.locator(live+'.ripple.is-on').count()==1
    await act(pg,'.p-mug',touch); await act(pg,'.p-badge',touch); await pg.wait_for_timeout(900)
    mug=await pg.locator('.mugnote').count()==1
    await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(200)
    await pg.screenshot(path=f'/tmp/fd/v-{tag}-1.png', full_page=(mode=='mode-stack'))
    # tap target sizes on the live page (stack/touch only)
    small=await pg.evaluate("""[...document.querySelectorAll('.pageslot:not(.pageslot--turn) button, .topbar button, .obj')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect()).filter(r=>r.height<30||r.width<30).map(r=>Math.round(r.width)+"x"+Math.round(r.height))""")
    await pg.keyboard.press('End'); await pg.wait_for_timeout(1000)
    if await pg.inner_text('.topbar__where .mono')!='DAY 90':
        for _ in range(6): await act(pg,live+'.pnav__next',touch); await pg.wait_for_timeout(950)
    await act(pg,live+'.ix-map .ix-btn--go',touch); await pg.wait_for_timeout(900)
    fin=await pg.is_visible('.finding'); await pg.screenshot(path=f'/tmp/fd/v-{tag}-2.png')
    ov=await pg.evaluate("document.documentElement.scrollWidth-innerWidth")
    print(f'{tag:6} {mode:11} letter={ok_letter} at={day} ripple={ripple} mug={mug} finding={fin} hOverflow={ov} smallTargets={small if touch else 'n/a (mouse)'} errs={errs}')
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        await run(b,1920,1080,'1920'); await run(b,1440,900,'1440'); await run(b,1366,768,'1366')
        await run(b,1024,768,'tabL',True); await run(b,768,1024,'tabP',True); await run(b,390,844,'phone',True)
        await b.close()
asyncio.run(main())
