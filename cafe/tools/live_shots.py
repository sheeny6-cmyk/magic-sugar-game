#!/usr/bin/env python3
"""배포본에서 서빙 카드 전체 화면 스크린샷 저장."""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1]
OUT = pathlib.Path("/workspace/downloads")

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(300)
    pg.click("#startBtn")
    pg.wait_for_timeout(700)
    for did, name in [("battement", "ballet-cafe-serve-photo.png"), ("pirouette", "ballet-cafe-serve-css.png")]:
        pg.evaluate("""(id) => {
          const c = window.__cafe, d = c.DRINKS.find(x => x.id === id);
          c.S.order = { drink: d, customer: {emoji:'🩰', role:'발레 3년차', name:'지수'}, line: d.lines[0], patience: 14, max: 14 };
          c.fillOrder();
        }""", did)
        pg.wait_for_timeout(120)
        for k in pg.evaluate("() => window.__cafe.S.order.drink.recipe.slice()"):
            pg.click(f'#tray .ing[data-k="{k}"]')
        pg.click("#serveBtn")
        pg.wait_for_timeout(420)
        pg.screenshot(path=str(OUT / name))
        print("saved", OUT / name)
        pg.wait_for_selector("#serveFlash:not(.on)", timeout=2500)
        pg.wait_for_timeout(600)
    b.close()
