#!/usr/bin/env python3
"""서빙 연출 카드 검증: 음료별 이미지/대사, 노출 시간(약 1초), 탭 스킵, 작은 화면 배치."""
import pathlib
import sys
import time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri() + "?debug"
SHOT_DIR = pathlib.Path("/workspace/downloads")

EXPECT = {
    "americano": ("assets/drink-americano.webp", "선생님 잔소리도 이겨내는 시원한 아아 나왔습니다!"),
    "arabesque": ("assets/drink-arabesque.webp", "팔이 하늘까지 올라가는 라벤더 힐링, 아라베스크 밀크입니다!"),
    "battement": ("assets/drink-battement.webp", "근손실 방지 차원에서! 단백질 가득 프로틴 라떼 나왔어요!"),
    "turnout": ("assets/drink-turnout.webp", "오늘 180도 턴아웃이 잘 되는 라떼입니다!"),
    "pirouette": (None, "3회전도 거뜬한 달콤함, 피루엣 라떼입니다!"),
    "pointe": (None, "발끝 포인에 힘 딱 들어가는 말차 라떼 나왔어요!"),
}


def start(pg):
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(250)
    pg.click("#startBtn")
    pg.wait_for_timeout(350)


def force_order(pg, drink_id):
    """DRINKS에서 원하는 음료 주문을 직접 만들어 넣는다."""
    pg.evaluate(
        """(id) => {
          const c = window.__cafe;
          const d = c.DRINKS.find(x => x.id === id);
          c.S.order = { drink: d, customer: {emoji:'🩰', role:'발레 3년차', name:'지수'},
                        line: d.lines[0], patience: 14, max: 14 };
          c.fillOrder();
        }""",
        drink_id,
    )
    pg.wait_for_timeout(120)


def serve_order(pg):
    keys = pg.evaluate("() => window.__cafe.S.order.drink.recipe.slice()")
    for k in keys:
        pg.click(f'#tray .ing[data-k="{k}"]')
    pg.click("#serveBtn")


def main():
    ok = True
    with sync_playwright() as p:
        b = p.chromium.launch()
        # ---- 1) 음료별 카드 내용 확인 (360x640) ----
        for did, (img, line) in EXPECT.items():
            ctx = b.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2,
                                is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            start(pg)
            force_order(pg, did)
            serve_order(pg)
            pg.wait_for_timeout(220)
            d = pg.evaluate("""() => {
              const f = document.getElementById('serveFlash');
              const c = document.getElementById('serveCard');
              const pic = document.getElementById('servePic');
              const im = pic.querySelector('img');
              const r = c.getBoundingClientRect();
              return { on: f.classList.contains('on'), img: im ? im.getAttribute('src') : null,
                       css: pic.classList.contains('css'),
                       name: document.getElementById('serveDrinkName').textContent,
                       line: document.getElementById('serveLine').textContent,
                       rect: {l:r.left,r:r.right,t:r.top,b:r.bottom},
                       vw: innerWidth, vh: innerHeight,
                       trayTop: document.getElementById('tray').getBoundingClientRect().top };
            }""")
            probs = []
            if not d["on"]:
                probs.append("serve card not shown")
            if img and d["img"] != img:
                probs.append(f"img {d['img']} != {img}")
            if not img and not d["css"]:
                probs.append("css cup card not used")
            if d["line"] != line:
                probs.append(f"line mismatch: {d['line']!r}")
            if d["rect"]["l"] < 0 or d["rect"]["r"] > d["vw"] or d["rect"]["t"] < 0 or d["rect"]["b"] > d["vh"]:
                probs.append(f"card out of viewport {d['rect']} vw={d['vw']} vh={d['vh']}")
            if did in ("turnout", "battement") and d["rect"]["b"] > d["trayTop"]:
                probs.append(f"card covers tray {d['rect']['b']} > {d['trayTop']}")
            if probs:
                ok = False
            print(f"[{'OK' if not probs else 'FAIL'}] {did:10s} name={d['name']} rect=({d['rect']['l']:.0f},{d['rect']['t']:.0f})-({d['rect']['r']:.0f},{d['rect']['b']:.0f})")
            for pr in probs:
                print("   -", pr)
            if did == "turnout":
                pg.screenshot(path=str(SHOT_DIR / "_serve-turnout-360.png"))
            if did == "pirouette":
                pg.screenshot(path=str(SHOT_DIR / "_serve-pirouette-360.png"))
            ctx.close()

        # ---- 2) 노출 시간 + 자동 전환 (390x844) ----
        ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                            is_mobile=True, has_touch=True)
        pg = ctx.new_page()
        start(pg)
        force_order(pg, "turnout")
        before = pg.evaluate("() => window.__cafe.S.order.drink.name")
        serve_order(pg)
        t0 = time.monotonic()
        pg.wait_for_selector("#serveFlash.on", timeout=1000)
        pg.wait_for_function("() => !document.getElementById('serveFlash').classList.contains('on')", timeout=3000)
        vis = time.monotonic() - t0
        pg.wait_for_timeout(400)
        after = pg.evaluate("() => window.__cafe.S.order.drink.name")
        print(f"[{'OK' if 0.85 <= vis <= 1.25 else 'CHECK'}] card visible {vis:.2f}s (target ~1.0s)")
        print(f"[{'OK' if after != before else 'FAIL'}] order advanced: {before} -> {after}")
        if not (0.85 <= vis <= 1.25) or after == before:
            ok = False

        # ---- 3) 탭하면 즉시 다음 손님 ----
        force_order(pg, "americano")
        serve_order(pg)
        pg.wait_for_selector("#serveFlash.on", timeout=1000)
        t1 = time.monotonic()
        pg.click("#serveCard")
        pg.wait_for_function("() => !document.getElementById('serveFlash').classList.contains('on')", timeout=600)
        skipped = time.monotonic() - t1
        pg.wait_for_function("() => !window.__cafe.S.locked", timeout=1500)
        names = pg.evaluate("() => ({o: window.__cafe.S.order.drink.name, up: window.__cafe.S.upcoming.length})")
        print(f"[{'OK' if skipped < 0.5 else 'FAIL'}] tap skipped in {skipped:.2f}s, order={names['o']}, upcoming={names['up']}")
        if skipped >= 0.5 or names["up"] != 2:
            ok = False
        pg.screenshot(path=str(SHOT_DIR / "_serve-after-skip.png"))
        ctx.close()
        b.close()
    print("\nRESULT:", "ALL OK" if ok else "PROBLEMS FOUND")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
