#!/usr/bin/env python3
"""cafe/ 최종 검증: 재료 이름 일치 + 트레이/액션 버튼/서빙 카드가 화면 안에 들어오는지."""
import pathlib
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
# 기본은 로컬 파일, 인자로 URL을 주면 배포본을 검사한다.
URL = sys.argv[1] if len(sys.argv) > 1 else (ROOT / "index.html").as_uri() + "?debug"
OUT = pathlib.Path("/workspace/downloads")

SIZES = [(320, 568), (360, 640), (384, 700), (390, 844)]
NAMES = ["얼음", "에스프레소", "스팀밀크", "말차", "라벤더", "프로틴", "카라멜", "아라베스크", "시나몬"]
DRINKS = ["americano", "arabesque", "battement", "turnout", "pirouette", "pointe"]

PROBE = """() => {
  const R = e => { const b = e.getBoundingClientRect(); return {l:+b.left.toFixed(1), r:+b.right.toFixed(1), t:+b.top.toFixed(1), b:+b.bottom.toFixed(1)}; };
  const tray = document.getElementById('tray');
  const btns = [...tray.querySelectorAll('.ing')];
  return {
    vw: innerWidth, vh: innerHeight,
    docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    trayScrollW: tray.scrollWidth, trayClientW: tray.clientWidth,
    names: btns.map(b => b.querySelector('.nm').textContent.trim()),
    btns: btns.map(b => ({ n: b.querySelector('.nm').textContent.trim(), ...R(b),
                           clipped: b.querySelector('.nm').scrollWidth > b.querySelector('.nm').clientWidth })),
    rows: [...new Set(btns.map(b => Math.round(b.getBoundingClientRect().top)))].length,
    serve: R(document.getElementById('serveBtn')),
    clear: R(document.getElementById('clearBtn')),
    chips: [...document.querySelectorAll('#recipe .chip')].map(c => c.textContent.replace(/^[^가-힣]+/, '').trim()),
  };
}"""

CARD = """() => {
  const c = document.getElementById('serveCard');
  const b = c.getBoundingClientRect();
  const tray = document.getElementById('tray').getBoundingClientRect();
  return { l:+b.left.toFixed(1), r:+b.right.toFixed(1), t:+b.top.toFixed(1), b:+b.bottom.toFixed(1),
           vw: innerWidth, vh: innerHeight, trayTop: +tray.top.toFixed(1),
           on: document.getElementById('serveFlash').classList.contains('on') };
}"""


def check_screen(pg, w, h):
    probs = []
    d = pg.evaluate(PROBE)
    if d["names"] != NAMES:
        probs.append(f"button names {d['names']}")
    if len(d["btns"]) != 9:
        probs.append(f"button count {len(d['btns'])}")
    if d["rows"] != 3:
        probs.append(f"tray rows {d['rows']}")
    if len(d["chips"]) != len([c for c in d["chips"]]):
        probs.append("chips missing")
    for c in d["chips"]:
        if c not in NAMES:
            probs.append(f"chip {c!r} not in tray names")
    if d["trayScrollW"] > d["trayClientW"] + 1:
        probs.append(f"tray overflow {d['trayScrollW']}>{d['trayClientW']}")
    if d["docW"] > d["vw"] + 0.5:
        probs.append(f"doc width {d['docW']}>{d['vw']}")
    for b in d["btns"]:
        if b["r"] > d["vw"] + 0.5 or b["l"] < -0.5 or b["b"] > d["vh"] + 0.5 or b["t"] < 0:
            probs.append(f"btn {b['n']} outside viewport {b}")
        if b["clipped"]:
            probs.append(f"btn {b['n']} label clipped")
    for nm, r in (("비우기", d["clear"]), ("서빙하기", d["serve"])):
        if r["b"] > d["vh"] + 0.5 or r["r"] > d["vw"] + 0.5 or r["l"] < -0.5:
            probs.append(f"{nm} outside {r}")
    return probs, d


def main():
    ok = True
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w, h in SIZES:
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2,
                                is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            pg.goto(URL, wait_until="load")
            pg.wait_for_timeout(250)
            pg.click("#startBtn")
            pg.wait_for_timeout(400)
            probs, d = check_screen(pg, w, h)
            # 서빙 카드도 이 화면 크기에서 화면 밖으로 나가지 않는지
            pg.evaluate("""() => { const c = window.__cafe, d = c.DRINKS.find(x => x.id === 'turnout');
              c.S.order = { drink: d, customer:{emoji:'🩰',role:'발레 3년차',name:'지수'}, line:d.lines[0], patience:14, max:14 };
              c.fillOrder(); }""")
            pg.wait_for_timeout(100)
            for k in pg.evaluate("() => window.__cafe.S.order.drink.recipe.slice()"):
                pg.click(f'#tray .ing[data-k="{k}"]')
            pg.click("#serveBtn")
            pg.wait_for_timeout(300)
            card = pg.evaluate(CARD)
            if not card["on"]:
                probs.append("serve card not shown")
            if card["l"] < -0.5 or card["r"] > card["vw"] + 0.5 or card["t"] < -0.5 or card["b"] > card["vh"] + 0.5:
                probs.append(f"serve card outside viewport {card}")
            if card["b"] > card["trayTop"] + 0.5:
                probs.append(f"serve card covers tray ({card['b']} > {card['trayTop']})")
            if (w, h) == (360, 640):
                pg.evaluate("() => document.getElementById('serveFlash').classList.remove('on')")
                pg.wait_for_timeout(50)
            print(f"[{'OK' if not probs else 'FAIL'}] {w}x{h} rows={d['rows']} names={len(d['names'])} "
                  f"tray={d['trayScrollW']}/{d['trayClientW']} serve.bottom={d['serve']['b']}/{h} card=({card['l']:.0f},{card['t']:.0f})-({card['r']:.0f},{card['b']:.0f})")
            for pr in probs:
                print("   -", pr)
            if probs:
                ok = False
            ctx.close()

        # 최종 스크린샷 (플레이 화면: 9개 버튼 + 비우기/서빙하기)
        for w, h, name in [(360, 640, "ballet-cafe-fixed.png"), (390, 844, "ballet-cafe-fixed-390x844.png")]:
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2,
                                is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            pg.goto(URL, wait_until="load")
            pg.wait_for_timeout(300)
            pg.click("#startBtn")
            pg.wait_for_timeout(1600)  # 첫 토스트가 사라진 뒤
            # 대표 재료(프로틴·시나몬 포함)가 담긴 상태로 촬영
            for k in ["espresso", "milk", "cinnamon"]:
                pg.click(f'#tray .ing[data-k="{k}"]')
            pg.wait_for_timeout(350)
            pg.screenshot(path=str(OUT / name))
            print("saved", OUT / name)
            ctx.close()
        b.close()
    print("\nRESULT:", "ALL OK" if ok else "PROBLEMS FOUND")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
