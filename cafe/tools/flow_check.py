#!/usr/bin/env python3
"""게임 흐름 검증: 서빙 카드가 떠 있을 때 영업 종료 → 결과 화면 → 재시작까지 막힘 없는지."""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = sys.argv[1] if len(sys.argv) > 1 else (ROOT / "index.html").as_uri() + "?debug"

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(300)
    pg.click("#startBtn")
    pg.wait_for_timeout(400)
    # 한 잔 서빙 후 카드가 떠 있는 상태에서 영업 시간을 0으로
    for k in pg.evaluate("() => window.__cafe.S.order.drink.recipe.slice()"):
        pg.click(f'#tray .ing[data-k="{k}"]')
    pg.click("#serveBtn")
    pg.wait_for_selector("#serveFlash.on", timeout=1000)
    pg.evaluate("() => { window.__cafe.S.time = 0.2; }")
    pg.wait_for_function("() => document.querySelector('#s-end').classList.contains('on')", timeout=4000)
    pg.wait_for_timeout(300)
    st = pg.evaluate("""() => ({ card: document.getElementById('serveFlash').classList.contains('on'),
                                 end: document.querySelector('#s-end').classList.contains('on'),
                                 revenue: document.getElementById('rRevenue').textContent,
                                 served: document.getElementById('rServed').textContent })""")
    print("[end]", st)
    pg.click("#againBtn")
    pg.wait_for_timeout(600)
    st2 = pg.evaluate("""() => ({ play: document.querySelector('#s-play').classList.contains('on'),
                                  card: document.getElementById('serveFlash').classList.contains('on'),
                                  btns: document.querySelectorAll('#tray .ing').length,
                                  money: document.getElementById('money').textContent })""")
    print("[restart]", st2)
    ok = (not st["card"]) and st["end"] and st2["play"] and (not st2["card"]) and st2["btns"] == 9
    print("RESULT:", "OK" if ok else "PROBLEM")
    b.close()
    sys.exit(0 if ok else 1)
