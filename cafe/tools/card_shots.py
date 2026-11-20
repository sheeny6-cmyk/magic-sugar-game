#!/usr/bin/env python3
"""음료별 서빙 카드 스크린샷 저장."""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri() + "?debug"
OUT = pathlib.Path("/workspace/downloads")
DRINKS = ["americano", "arabesque", "battement", "turnout", "pirouette", "pointe"]

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(URL)
    pg.wait_for_timeout(250)
    pg.click("#startBtn")
    pg.wait_for_timeout(320)
    for did in DRINKS:
        pg.evaluate("""(id) => {
          const c = window.__cafe, d = c.DRINKS.find(x => x.id === id);
          c.S.order = { drink: d, customer: {emoji:'🩰', role:'발레 3년차', name:'지수'}, line: d.lines[0], patience: 14, max: 14 };
          c.fillOrder();
        }""", did)
        pg.wait_for_timeout(80)
        for k in pg.evaluate("() => window.__cafe.S.order.drink.recipe.slice()"):
            pg.click(f'#tray .ing[data-k="{k}"]')
        pg.click("#serveBtn")
        pg.wait_for_timeout(380)
        pg.locator("#serveCard").screenshot(path=str(OUT / f"_card-{did}.png"))
        print("saved", did)
        pg.wait_for_selector("#serveFlash:not(.on)", timeout=2000)
        pg.wait_for_timeout(500)
    b.close()
