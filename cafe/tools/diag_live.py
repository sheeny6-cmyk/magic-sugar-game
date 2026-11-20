#!/usr/bin/env python3
"""배포본(수정 전) 상태 진단: 360px 폭에서 트레이 3열이 화면 밖으로 잘리는지 확인."""
import sys
from playwright.sync_api import sync_playwright

URL = "https://sheeny6-cmyk.github.io/magic-sugar-game/cafe/"

PROBE = """() => {
  const app = document.getElementById('app');
  const tray = document.getElementById('tray');
  const btns = [...tray.querySelectorAll('.ing')];
  const r = e => { const b = e.getBoundingClientRect(); return {l:+b.left.toFixed(1), r:+b.right.toFixed(1), b:+b.bottom.toFixed(1)}; };
  return {
    vw: innerWidth, appW: app.clientWidth,
    trayScrollW: tray.scrollWidth, trayClientW: tray.clientWidth,
    names: btns.map(b => b.querySelector('.nm').textContent.trim()),
    rights: btns.map(b => r(b).r),
    serveBottom: r(document.getElementById('serveBtn')).b,
    cssCols: getComputedStyle(tray).gridTemplateColumns,
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(320, 568), (360, 640), (390, 844)]:
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = ctx.new_page()
        pg.goto(URL, wait_until="networkidle")
        pg.click("#startBtn")
        pg.wait_for_timeout(600)
        d = pg.evaluate(PROBE)
        print(f"--- {w}x{h} appW={d['appW']} cols={d['cssCols']}")
        print("  tray scrollW/clientW:", d["trayScrollW"], "/", d["trayClientW"])
        print("  names:", d["names"])
        print("  btn rights:", d["rights"], " vw:", d["vw"])
        print("  serveBtn bottom:", d["serveBottom"], " vh:", h)
        if w == 360:
            pg.screenshot(path="/workspace/downloads/ballet-cafe-before-360x640.png", full_page=False)
        ctx.close()
    b.close()
