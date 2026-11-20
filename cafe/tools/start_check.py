#!/usr/bin/env python3
"""시작 화면 제목 균형·타이틀 확인 (로컬)."""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
OUT = pathlib.Path("/workspace/downloads")

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(320, 568), (360, 640), (390, 844)]:
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = ctx.new_page()
        pg.goto(URL, wait_until="load")
        pg.wait_for_timeout(500)
        info = pg.evaluate("""() => {
          const h1 = document.querySelector('.start-top h1');
          const em = h1.querySelector('em');
          const r = e => { const b = e.getBoundingClientRect(); return {w:+b.width.toFixed(1), l:+b.left.toFixed(1), r:+b.right.toFixed(1)}; };
          return {title: document.title, h1: h1.innerText.replace(/\\n/g,' / '), h1w: r(h1).w, emw: r(em).w,
                  emFont: getComputedStyle(em).fontSize, scrollW: document.documentElement.scrollWidth, vw: innerWidth};
        }""")
        print(w, h, info)
        pg.screenshot(path=str(OUT / f"_startcheck-{w}x{h}.png"))
        ctx.close()
    b.close()
