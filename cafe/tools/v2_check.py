#!/usr/bin/env python3
"""cafe v2 검증: 레이아웃(무스크롤)·섞기 손맛·성공/엉뚱 반응 카드·깜짝 손님·셔플백·결과 공유.

  python3 v2_check.py                      # 로컬 index.html?debug
  python3 v2_check.py <URL> --shot         # 배포본 + 스크린샷 저장
"""
import math
import pathlib
import struct
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
URL = ARGS[0] if ARGS else (ROOT / "index.html").as_uri() + "?debug"
SHOT = "--shot" in sys.argv
OUT = pathlib.Path("/workspace/downloads")
OUT.mkdir(parents=True, exist_ok=True)

PROBE = """() => {
  const R = e => { const b = e.getBoundingClientRect(); return {l:+b.left.toFixed(1), r:+b.right.toFixed(1), t:+b.top.toFixed(1), b:+b.bottom.toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1)}; };
  const tray = document.getElementById('tray');
  const btns = [...tray.querySelectorAll('.ing')];
  return {
    vw: innerWidth, vh: innerHeight,
    docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    names: btns.map(b => b.querySelector('.nm').textContent.trim()),
    rows: [...new Set(btns.map(b => Math.round(b.getBoundingClientRect().top)))].length,
    trayScrollW: tray.scrollWidth, trayClientW: tray.clientWidth,
    stir: R(document.getElementById('stir')),
    cup: R(document.getElementById('cup')),
    serve: R(document.getElementById('serveBtn')),
    clear: R(document.getElementById('clearBtn')),
    clock: document.getElementById('clock').textContent,
    stirTxt: document.getElementById('stirTxt').textContent.trim(),
    orderDrink: document.getElementById('cusDrink').textContent.trim(),
  };
}"""

CARD = """() => {
  const c = document.getElementById('serveCard');
  const b = c.getBoundingClientRect();
  const vh = innerHeight, vw = innerWidth;
  const trayTop = document.getElementById('tray').getBoundingClientRect().top;
  return {
    on: document.getElementById('serveFlash').classList.contains('on'),
    accident: document.getElementById('serveFlash').classList.contains('accident'),
    surprise: document.getElementById('serveFlash').classList.contains('surprise'),
    tag: document.getElementById('serveTag').textContent.trim(),
    drink: document.getElementById('serveDrinkName').textContent.trim(),
    who: document.getElementById('serveWho').textContent.trim(),
    line: document.getElementById('serveLine').textContent.trim(),
    bonus: document.getElementById('serveBonus').textContent.trim(),
    box: {l:+b.left.toFixed(1), r:+b.right.toFixed(1), t:+b.top.toFixed(1), b:+b.bottom.toFixed(1),
          vw, vh, trayTop:+trayTop.toFixed(1)},
  };
}"""


def cup_center(pg):
    return pg.evaluate("""() => { const b = document.getElementById('cupGlass').getBoundingClientRect();
        return {x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height}; }""")


def rub(pg, loops=5, steps=40, gap_ms=7, radius=0.42, until_full=False):
    """컵 위를 손가락으로 원을 그리며 문지른다. (걸린 시간, 도달 게이지) 반환."""
    c = cup_center(pg)
    r = min(c["w"], c["h"]) * radius
    pg.mouse.move(c["x"] + r, c["y"])
    t0 = time.time()
    pg.mouse.down()
    total = steps * loops
    for i in range(total):
        a = (i % steps) / steps * 2 * math.pi
        pg.mouse.move(c["x"] + r * math.cos(a), c["y"] + r * math.sin(a))
        if gap_ms:
            pg.wait_for_timeout(gap_ms)
        if until_full and i % 5 == 0 and pg.evaluate("() => window.__cafe.S.stir") >= 100:
            break
    pg.mouse.up()
    return time.time() - t0, pg.evaluate("() => window.__cafe.S.stir")


def add(pg, keys):
    for k in keys:
        pg.click(f'#tray .ing[data-k="{k}"]')


def force_order(pg, drink_id, guest=None):
    pg.evaluate("""([id, guest]) => {
      const c = window.__cafe;
      const d = c.DRINKS.find(x => x.id === id);
      const g = guest === 'surprise' ? c.SURPRISE[0] : null;
      c.S.order = { drink: d, customer: g || {emoji:'🩰', role:'발레 3년차', name:'지수'},
                    line: d.lines[0], patience: 60, max: 60 };
      c.fillOrder();
    }""", [drink_id, guest])


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(33)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w, h = struct.unpack(">II", head[16:24])
    return w, h


def main():
    problems = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w, h in [(360, 640), (390, 844)]:
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2,
                                is_mobile=True, has_touch=True, accept_downloads=True)
            pg = ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append("console.error: " + m.text) if m.type == "error" else None)
            pg.goto(URL, wait_until="load")
            pg.wait_for_timeout(400)
            pg.click("#startBtn")
            pg.wait_for_timeout(1300)

            d = pg.evaluate(PROBE)
            print(f"\n=== {w}x{h} ===  clock={d['clock']} tray={len(d['names'])} rows={d['rows']} first={d['orderDrink']}")
            if d["clock"] not in ("74", "75"):
                problems.append(f"{w}x{h}: 영업 시간이 75초가 아님({d['clock']})")
            if d["names"] != ["얼음", "에스프레소", "스팀밀크", "말차", "라벤더", "프로틴", "카라멜", "아라베스크", "시나몬"]:
                problems.append(f"{w}x{h}: 재료 이름 불일치 {d['names']}")
            if d["rows"] != 3:
                problems.append(f"{w}x{h}: 트레이 줄 수 {d['rows']}")
            if d["docH"] > d["vh"] + 0.5 or d["docW"] > d["vw"] + 0.5:
                problems.append(f"{w}x{h}: 스크롤 발생 doc={d['docW']}x{d['docH']} vp={d['vw']}x{d['vh']}")
            if d["trayScrollW"] > d["trayClientW"] + 1:
                problems.append(f"{w}x{h}: 트레이 넘침 {d['trayScrollW']}>{d['trayClientW']}")
            for nm, r in (("섞기게이지", d["stir"]), ("컵", d["cup"]), ("서빙", d["serve"]), ("비우기", d["clear"])):
                if r["b"] > d["vh"] + 0.5 or r["r"] > d["vw"] + 0.5 or r["l"] < -0.5 or r["t"] < -0.5:
                    problems.append(f"{w}x{h}: {nm} 화면 밖 {r}")
            if d["stir"]["b"] > d["serve"]["t"] + 0.5:
                problems.append(f"{w}x{h}: 섞기게이지가 액션 버튼과 겹침 {d['stir']} {d['serve']}")

            # ---------- 1) 재료 담으면 서빙 잠김 ----------
            force_order(pg, "turnout")
            add(pg, ["espresso", "milk", "cinnamon"])
            pg.wait_for_timeout(250)
            st = pg.evaluate("""() => ({txt: document.getElementById('serveBtn').textContent.trim(),
                                        wait: document.getElementById('serveBtn').classList.contains('wait'),
                                        stir: window.__cafe.S.stir, cup: window.__cafe.S.cup.length})""")
            print("  재료 3개 후:", st)
            if st["cup"] != 3 or st["stir"] != 0 or not st["wait"] or "섞" not in st["txt"]:
                problems.append(f"{w}x{h}: 섞기 전 서빙 버튼 상태 이상 {st}")

            # 섞지 않고 서빙 시도 → 카드 안 뜨고 안내만 (aria-disabled 상태라 force 탭)
            pg.click("#serveBtn", force=True)
            pg.wait_for_timeout(200)
            c0 = pg.evaluate(CARD)
            toast_txt = pg.evaluate("() => document.getElementById('toast').textContent")
            if c0["on"]:
                problems.append(f"{w}x{h}: 섞기 전인데 서빙이 됨")
            if "섞" not in toast_txt:
                problems.append(f"{w}x{h}: 섞기 전 안내 토스트 없음 ({toast_txt})")
            print("  섞기 전 서빙 시도 →", toast_txt)

            # ---------- 2) 스와이프로 섞기 ----------
            mid_t, mid_pct = rub(pg, loops=1)
            print(f"  섞기 1차: {mid_t:.2f}s → {mid_pct:.0f}%")
            if not (0 < mid_pct < 100):
                problems.append(f"{w}x{h}: 한 번 문질렀는데 게이지가 {mid_pct:.0f}%")
            if SHOT and (w, h) == (360, 640):
                pg.screenshot(path=str(OUT / "ballet-cafe-v2-stir.png"))
                print("  saved", OUT / "ballet-cafe-v2-stir.png")

            elapsed, pct = rub(pg, until_full=True)
            print(f"  섞기: {elapsed:.2f}s → {pct:.0f}%")
            if pct < 100:
                problems.append(f"{w}x{h}: 문질러도 100% 안 됨({pct:.0f}%)")
            if pct >= 100 and elapsed > 3.0:
                problems.append(f"{w}x{h}: 섞기 너무 느림({elapsed:.2f}s)")
            ready = pg.evaluate("""() => ({ready: document.getElementById('serveBtn').classList.contains('ready'),
                                          txt: document.getElementById('serveBtn').textContent.trim(),
                                          cupReady: document.getElementById('cup').classList.contains('ready'),
                                          tag: document.getElementById('cupTag').textContent.trim(),
                                          stirTxt: document.getElementById('stirTxt').textContent.trim()})""")
            print("  완성 상태:", ready)
            if not (ready["ready"] and ready["cupReady"]):
                problems.append(f"{w}x{h}: 100%인데 완성 표시 안 됨 {ready}")
            if SHOT and (w, h) == (390, 844):
                pg.screenshot(path=str(OUT / "ballet-cafe-v2-ready-390.png"))

            # ---------- 3) 성공 반응 카드 ----------
            pg.click("#serveBtn")
            pg.wait_for_selector("#serveFlash.on", timeout=1500)
            pg.wait_for_timeout(200)
            card = pg.evaluate(CARD)
            print("  성공 카드:", card["tag"], "|", card["drink"], "|", card["line"])
            if card["tag"] != "성공 ✨":
                problems.append(f"{w}x{h}: 성공 카드 태그 {card['tag']}")
            if "다리가 180도" not in card["line"]:
                problems.append(f"{w}x{h}: 턴아웃 반응 대사 불일치 {card['line']}")
            bb = card["box"]
            if bb["l"] < -0.5 or bb["r"] > bb["vw"] + 0.5 or bb["t"] < -0.5 or bb["b"] > bb["vh"] + 0.5:
                problems.append(f"{w}x{h}: 성공 카드 화면 밖 {bb}")
            if bb["b"] > bb["trayTop"] + 0.5:
                problems.append(f"{w}x{h}: 성공 카드가 트레이를 가림 {bb}")
            if SHOT and (w, h) == (390, 844):
                pg.screenshot(path=str(OUT / "ballet-cafe-v2-success-390.png"))
            pg.click("#serveCard")
            pg.wait_for_timeout(400)
            if pg.evaluate("() => document.getElementById('serveFlash').classList.contains('on')"):
                problems.append(f"{w}x{h}: 카드 탭해도 안 넘어감")

            # ---------- 4) 엉뚱한 음료(말차+프로틴) 사고 카드 ----------
            force_order(pg, "americano")
            add(pg, ["matcha", "protein"])
            rub(pg, until_full=True)
            pg.click("#serveBtn")
            pg.wait_for_selector("#serveFlash.on", timeout=1500)
            pg.wait_for_timeout(200)
            bad = pg.evaluate(CARD)
            print("  사고 카드:", bad["tag"], "|", bad["drink"], "|", bad["line"])
            if not bad["accident"]:
                problems.append(f"{w}x{h}: 사고 카드 클래스 없음")
            if "초록 괴물" not in bad["line"]:
                problems.append(f"{w}x{h}: 말차+프로틴 사고 대사 불일치 {bad['line']}")
            if bad["tag"] != "💥 엉뚱 사고":
                problems.append(f"{w}x{h}: 사고 태그 {bad['tag']}")
            bb = bad["box"]
            if bb["l"] < -0.5 or bb["r"] > bb["vw"] + 0.5 or bb["t"] < -0.5 or bb["b"] > bb["vh"] + 0.5:
                problems.append(f"{w}x{h}: 사고 카드 화면 밖 {bb}")
            if SHOT and (w, h) == (390, 844):
                pg.screenshot(path=str(OUT / "ballet-cafe-v2-reaction-390.png"))
            if SHOT and (w, h) == (360, 640):
                pg.screenshot(path=str(OUT / "ballet-cafe-v2-reaction.png"))
                print("  saved", OUT / "ballet-cafe-v2-reaction.png")
            pg.click("#serveCard")
            pg.wait_for_timeout(400)

            # ---------- 5) 깜짝 손님 ----------
            force_order(pg, "pointe", guest="surprise")
            add(pg, ["matcha", "milk", "ice"])
            rub(pg, until_full=True)
            pg.click("#serveBtn")
            pg.wait_for_selector("#serveFlash.on", timeout=1500)
            pg.wait_for_timeout(200)
            g = pg.evaluate(CARD)
            print("  깜짝 카드:", g["tag"], "|", g["who"], "|", g["line"], "|", g["bonus"])
            if not g["surprise"] or "깜짝" not in g["tag"] or "보너스" not in g["bonus"]:
                problems.append(f"{w}x{h}: 깜짝 손님 카드 {g}")
            pg.click("#serveCard")
            pg.wait_for_timeout(400)
            if SHOT and (w, h) == (390, 844):
                pg.screenshot(path=str(OUT / "ballet-cafe-v2-surprise-390.png"))

            # ---------- 6) 결과 화면 + 공유 버튼 ----------
            pg.evaluate("() => { window.__cafe.S.time = 0.3; }")
            pg.wait_for_function("() => document.querySelector('#s-end').classList.contains('on')", timeout=5000)
            pg.wait_for_timeout(700)
            res = pg.evaluate("""() => {
              const R = e => { const b = e.getBoundingClientRect(); return {l:+b.left.toFixed(1), r:+b.right.toFixed(1), t:+b.top.toFixed(1), b:+b.bottom.toFixed(1)}; };
              return {
                title: document.getElementById('gradeName').textContent.trim(),
                msg: document.getElementById('gradeMsg').textContent.trim(),
                journal: document.getElementById('journalLine').textContent.trim(),
                revenue: document.getElementById('rRevenue').textContent,
                served: document.getElementById('rServed').textContent,
                combo: document.getElementById('rCombo').textContent,
                miss: document.getElementById('rMiss').textContent,
                card: R(document.querySelector('.result')),
                share: R(document.getElementById('shareBtn')),
                home: R(document.getElementById('homeBtn')),
                again: R(document.getElementById('againBtn')),
                vw: innerWidth, vh: innerHeight,
                docH: document.documentElement.scrollHeight
              };
            }""")
            print("  결과:", res["title"], "/", res["journal"])
            print(f"  결과카드 {res['card']['t']:.0f}~{res['card']['b']:.0f} (vh {res['vh']}) share.bottom={res['share']['b']:.0f}")
            if not res["title"] or not res["journal"] or res["journal"] == "—":
                problems.append(f"{w}x{h}: 결과 칭호/일지 비어 있음")
            if res["card"]["t"] < -0.5 or res["card"]["b"] > res["vh"] + 0.5:
                problems.append(f"{w}x{h}: 결과 카드가 화면 밖 {res['card']}")
            if res["share"]["b"] > res["vh"] + 0.5 or res["share"]["r"] > res["vw"] + 0.5:
                problems.append(f"{w}x{h}: 공유 버튼이 화면 밖 {res['share']}")
            if res["docH"] > res["vh"] + 0.5:
                problems.append(f"{w}x{h}: 결과 화면 스크롤 {res['docH']}>{res['vh']}")
            if SHOT and (w, h) == (360, 640):
                pg.screenshot(path=str(OUT / "ballet-cafe-v2-end.png"))

            # 공유 → PNG 저장(공유 미지원 브라우저 폴백 경로)
            try:
                with pg.expect_download(timeout=8000) as dl:
                    pg.click("#shareBtn")
                dfile = dl.value
                name = "ballet-cafe-v2-share-card.png" if (w, h) == (360, 640) else f"ballet-cafe-v2-share-card-{w}.png"
                path = OUT / name
                dfile.save_as(str(path))
                size = png_size(path)
                print(f"  공유 카드 저장: {name} {size} {path.stat().st_size // 1024}KB")
                if size != (1080, 1350):
                    problems.append(f"{w}x{h}: 공유 이미지 크기 {size}")
            except Exception as e:
                problems.append(f"{w}x{h}: 공유 버튼이 이미지 저장을 하지 못함 ({str(e).splitlines()[0]})")
            after = pg.evaluate("() => document.getElementById('shareBtn').textContent.trim()")
            print("  공유 후 버튼:", after)

            if errs:
                problems.append(f"{w}x{h}: JS 오류 {errs[:3]}")
            ctx.close()

        # ---------- 7) 셔플 백: 6종 골고루 + 연속 중복 없음 ----------
        ctx = b.new_context(viewport={"width": 390, "height": 844})
        pg = ctx.new_page()
        pg.goto(URL, wait_until="load")
        pg.click("#startBtn")
        pg.wait_for_timeout(300)
        seq = pg.evaluate("""() => { const c = window.__cafe; const out = [];
          for (let i = 0; i < 18; i++) out.push(c.makeOrder().drink.id); return out; }""")
        print("\n  주문 순서:", " → ".join(seq))
        counts = {k: seq.count(k) for k in set(seq)}
        print("  분포:", counts)
        if any(seq[i] == seq[i + 1] for i in range(len(seq) - 1)):
            problems.append(f"연속 같은 메뉴 등장: {seq}")
        if len(counts) != 6 or min(counts.values()) < 2:
            problems.append(f"메뉴 분포가 고르지 않음: {counts}")

        # ---------- 8) 칭호 분기(플레이 기록별) ----------
        variants = pg.evaluate("""() => {
          const c = window.__cafe, S = c.S, out = [];
          const cases = [
            { served: 0, miss: 2, maxCombo: 0, acc: {} },
            { served: 6, miss: 0, maxCombo: 5, acc: {} },
            { served: 6, miss: 1, maxCombo: 9, acc: {} },
            { served: 5, miss: 3, maxCombo: 2, acc: { matchaProtein: 2 } },
            { served: 5, miss: 2, maxCombo: 2, acc: {} },
            { served: 3, miss: 2, maxCombo: 4, acc: {} },
            { served: 2, miss: 1, maxCombo: 1, acc: {} }
          ];
          cases.forEach(k => {
            S.served = k.served; S.miss = k.miss; S.maxCombo = k.maxCombo;
            S.stats.accidents = k.acc; S.stats.surprise = 0; S.revenue = 20000;
            out.push({ in: k, title: c.titleFor().name, journal: c.journalFor() });
          });
          return out;
        }""")
        for v in variants:
            print("  칭호분기:", v["in"], "→", v["title"])
        if len({v["title"] for v in variants}) < 5:
            problems.append("칭호 분기가 충분히 갈리지 않음")
        ctx.close()
        b.close()

    print("\nRESULT:", "ALL OK" if not problems else "PROBLEMS")
    for pr in problems:
        print("  -", pr)
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
