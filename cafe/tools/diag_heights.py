#!/usr/bin/env python3
"""배포본 진단 2: 화면 높이가 줄었을 때(안드로이드 크롬 주소창 등) 트레이/액션 버튼이 잘리는지."""
import sys, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://sheeny6-cmyk.github.io/magic-sugar-game/cafe/"

PROBE = """() => {
  const q = s => document.querySelector(s);
  const r = e => { const b = e.getBoundingClientRect(); return {l:+b.left.toFixed(1), r:+b.right.toFixed(1), t:+b.top.toFixed(1), b:+b.bottom.toFixed(1)}; };
  const btns = [...document.querySelectorAll('#tray .ing')];
  const tray = q('#tray');
  return {
    vh: innerHeight, vw: innerWidth,
    trayTop: r(tray).t, trayBottom: r(tray).b,
    trayH: +tray.getBoundingClientRect().height.toFixed(1),
    ingH: btns.map(b => +b.getBoundingClientRect().height.toFixed(1)),
    btnBottomMax: Math.max(...btns.map(b => r(b).b)),
    btnRightMax: Math.max(...btns.map(b => r(b).r)),
    serve: r(q('#serveBtn')), clear: r(q('#clearBtn')),
    order: r(q('#order')), hud: r(q('.hud')), stageH: +q('.stage').getBoundingClientRect().height.toFixed(1),
    cupH: +q('.cup-glass').getBoundingClientRect().height.toFixed(1),
    bodyScrollH: document.documentElement.scrollHeight,
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (320, 360, 390):
        for h in (500, 520, 560, 600, 640, 700, 844):
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            pg.goto(URL, wait_until="networkidle")
            pg.click("#startBtn")
            pg.wait_for_timeout(400)
            d = pg.evaluate(PROBE)
            bad = []
            if d["serve"]["b"] > d["vh"] + 0.5: bad.append(f"serve cut {d['serve']['b']}>{d['vh']}")
            if d["btnBottomMax"] > d["vh"] + 0.5: bad.append(f"tray btn cut {d['btnBottomMax']}>{d['vh']}")
            if d["btnRightMax"] > d["vw"] + 0.5: bad.append(f"btn right {d['btnRightMax']}>{d['vw']}")
            if d["trayTop"] < d["order"]["b"] - 1: bad.append(f"tray overlaps order (trayTop {d['trayTop']} < orderBottom {d['order']['b']})")
            print(f"{w}x{h}: ingH={d['ingH']} trayH={d['trayH']} stageH={d['stageH']} cupH={d['cupH']} serveB={d['serve']['b']} " + ("OK" if not bad else "!! " + "; ".join(bad)))
            ctx.close()
    b.close()
