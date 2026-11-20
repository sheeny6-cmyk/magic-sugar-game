#!/usr/bin/env python3
"""발레 왕국 마을 로컬 검증: 레이아웃 오버플로우 + 흐름 + 스크린샷."""
import json, pathlib, subprocess, sys, time
from playwright.sync_api import sync_playwright
from lesson_flow import finish_lesson

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8123"
OUT = pathlib.Path("/workspace/tmp/town-test"); OUT.mkdir(parents=True, exist_ok=True)

def overflow_report(pg):
    return pg.evaluate("""() => {
      const de = document.documentElement;
      const out = {scrollW: de.scrollWidth, clientW: de.clientWidth, wide: []};
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1)) {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed') return;
          out.wide.push({tag: el.tagName, cls: el.className && el.className.toString().slice(0,60), left: Math.round(r.left), right: Math.round(r.right)});
        }
      });
      out.wide = out.wide.slice(0, 12);
      return out;
    }""")

def seed(pg, data):
    pg.evaluate("""(d) => { localStorage.setItem('sugartown.v1', JSON.stringify(d)); }""", data)

def base_state(**kw):
    d = {"v":1,"coins":0,"stats":{"flex":0,"stam":0,"axis":0,"turn":0},"owned":["basic"],"worn":"basic",
         "stamps":{"bar":0,"center":0,"piece":0},"classes":0,"served":0,"best":0,"bestRound":0,"seen":[]}
    d.update(kw); return d

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width":360,"height":640}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))

    # ---------- 마을 ----------
    pg.goto(BASE + "/town/?t=1", wait_until="load")
    seed(pg, base_state())
    pg.reload(wait_until="load"); pg.wait_for_timeout(500)
    print("HUB overflow 360:", json.dumps(overflow_report(pg), ensure_ascii=False))
    pg.screenshot(path=str(OUT/"hub-360.png"), full_page=True)

    # ---------- 분식집 ----------
    pg.goto(BASE + "/town/snack/?t=1", wait_until="load"); pg.wait_for_timeout(500)
    print("SNACK start overflow:", json.dumps(overflow_report(pg), ensure_ascii=False))
    pg.screenshot(path=str(OUT/"snack-start-360.png"))
    pg.evaluate("""() => {
      __snack.start();
      __snack.state.queue = [__snack.CUST[0], __snack.CUST[5], __snack.CUST[8], __snack.CUST[3], __snack.CUST[1], __snack.CUST[6]];
      __snack.state.total = 6; __snack.state.round = 0; __snack.renderRound();
    }""")
    pg.wait_for_timeout(300)
    print("SNACK play overflow:", json.dumps(overflow_report(pg), ensure_ascii=False))
    pg.screenshot(path=str(OUT/"snack-play-360.png"))
    pg.evaluate("() => { __snack.togglePick('skewer'); }")
    pg.wait_for_timeout(250)
    pg.screenshot(path=str(OUT/"snack-picked-360.png"))
    pg.evaluate("() => { __snack.serve(); }")
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT/"snack-react-360.png"))
    st = pg.evaluate("() => ({coins: JSON.parse(localStorage.getItem('sugartown.v1')).coins, stats: JSON.parse(localStorage.getItem('sugartown.v1')).stats})")
    print("after correct serve:", st)
    pg.evaluate("() => { __snack.next(); }")
    pg.wait_for_timeout(200)
    pg.screenshot(path=str(OUT/"snack-round2-360.png"))

    # 도감
    pg.evaluate("() => document.getElementById('dexBtn2').click()")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"snack-dex-360.png"))
    pg.evaluate("() => document.getElementById('dexClose').click()")

    # ---------- 드레스룸 ----------
    pg.goto(BASE + "/town/dressroom/?t=1", wait_until="load")
    seed(pg, base_state(coins=120))
    pg.reload(wait_until="load"); pg.wait_for_timeout(400)
    print("DRESS overflow:", json.dumps(overflow_report(pg), ensure_ascii=False))
    pg.screenshot(path=str(OUT/"dress-360.png"), full_page=True)
    pg.evaluate("() => document.querySelector('[data-buy=\"lilac\"]').click()")
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT/"dress-insufficient-360.png"))
    seed(pg, base_state(coins=1200, stats={"flex":40,"stam":22,"axis":18,"turn":12}))
    pg.reload(wait_until="load"); pg.wait_for_timeout(400)
    pg.evaluate("() => document.querySelector('[data-buy=\"lilac\"]').click()")
    pg.wait_for_timeout(500)
    print("after buy lilac:", pg.evaluate("() => JSON.parse(localStorage.getItem('sugartown.v1'))"))
    pg.screenshot(path=str(OUT/"dress-bought-360.png"), full_page=True)
    pg.evaluate("() => document.querySelector('[data-buy=\"sugar\"]').click()")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"dress-sugar-360.png"))

    # ---------- 스튜디오 ----------
    seed(pg, base_state(coins=1200, stats={"flex":40,"stam":22,"axis":18,"turn":12}, owned=["basic","lilac"], worn="lilac"))
    pg.goto(BASE + "/town/studio/?t=1", wait_until="load"); pg.reload(wait_until="load"); pg.wait_for_timeout(400)
    print("STUDIO overflow:", json.dumps(overflow_report(pg), ensure_ascii=False))
    pg.screenshot(path=str(OUT/"studio-360.png"), full_page=True)
    pg.evaluate("() => document.querySelector('[data-cls=\"bar\"]').click()")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"studio-confirm-360.png"))
    pg.evaluate("() => document.getElementById('cGo').click()")
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT/"studio-lesson-360.png"))
    # 수업 끝까지
    finish_lesson(pg)
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT/"studio-result-360.png"))
    print("after class:", pg.evaluate("() => JSON.parse(localStorage.getItem('sugartown.v1'))"))

    # ---------- 스튜디오 5번째 수업 → 무대 ----------
    seed(pg, base_state(coins=900, stats={"flex":70,"stam":40,"axis":36,"turn":30}, classes=4,
                        stamps={"bar":2,"center":1,"piece":1}, owned=["basic","lilac"], worn="lilac"))
    pg.goto(BASE + "/town/studio/?t=1", wait_until="load"); pg.wait_for_timeout(400)
    pg.evaluate("() => document.querySelector('[data-cls=\"center\"]').click()")
    pg.wait_for_timeout(300)
    pg.evaluate("() => document.getElementById('cGo').click()")
    pg.wait_for_timeout(500)
    finish_lesson(pg)
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"studio-stage-ready-360.png"))

    pg.goto(BASE + "/town/stage/?t=1", wait_until="load"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"stage-360.png"), full_page=True)
    print("STAGE overflow:", json.dumps(overflow_report(pg), ensure_ascii=False))

    pg.goto(BASE + "/town/?t=1", wait_until="load"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"hub-open-360.png"), full_page=True)

    # ---------- 390x844 ----------
    ctx2 = b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg2 = ctx2.new_page()
    pg2.on("pageerror", lambda e: errs.append("PAGEERROR390: " + str(e)))
    pg2.goto(BASE + "/town/?t=1", wait_until="load"); pg2.wait_for_timeout(400)
    print("HUB overflow 390:", json.dumps(overflow_report(pg2), ensure_ascii=False))
    pg2.screenshot(path=str(OUT/"hub-390.png"), full_page=True)
    pg2.goto(BASE + "/town/snack/?t=1", wait_until="load"); pg2.wait_for_timeout(300)
    pg2.evaluate("() => { __snack.start(); __snack.state.queue=[__snack.CUST[2]]; __snack.state.total=1; __snack.state.round=0; __snack.renderRound(); }")
    pg2.wait_for_timeout(300)
    print("SNACK 390 overflow:", json.dumps(overflow_report(pg2), ensure_ascii=False))
    pg2.screenshot(path=str(OUT/"snack-play-390.png"))
    pg2.goto(BASE + "/town/dressroom/?t=1", wait_until="load"); pg2.wait_for_timeout(300)
    pg2.screenshot(path=str(OUT/"dress-390.png"), full_page=True)
    pg2.goto(BASE + "/town/studio/?t=1", wait_until="load"); pg2.wait_for_timeout(300)
    pg2.screenshot(path=str(OUT/"studio-390.png"), full_page=True)

    print("CONSOLE ERRORS:", errs[:10])
    b.close()
print("done", OUT)
