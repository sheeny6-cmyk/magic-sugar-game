#!/usr/bin/env python3
"""발레 왕국 마을 라이브 검증 + 보고용 스크린샷."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
from lesson_flow import play_lesson

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://sheeny6-cmyk.github.io/magic-sugar-game"
OUT = pathlib.Path("/workspace/downloads"); OUT.mkdir(parents=True, exist_ok=True)
V = "?v=20261121i"

def overflow(pg):
    return pg.evaluate("""() => {
      const de = document.documentElement; const wide=[];
      document.querySelectorAll('*').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>0 && (r.right>de.clientWidth+1 || r.left<-1) && getComputedStyle(el).position!=='fixed')
          wide.push({tag:el.tagName,cls:String(el.className).slice(0,40),l:Math.round(r.left),r:Math.round(r.right)});
      });
      return {scrollW:de.scrollWidth, clientW:de.clientWidth, wide:wide.slice(0,8)};
    }""")

def state(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('sugartown.v1')||'null')")

def seed(pg, d):
    pg.evaluate("(d)=>localStorage.setItem('sugartown.v1',JSON.stringify(d))", d)

BASE_STATE = {"v":1,"coins":0,"stats":{"flex":0,"stam":0,"axis":0,"turn":0},"owned":["basic"],"worn":"basic",
              "stamps":{"bar":0,"center":0,"piece":0},"classes":0,"served":0,"best":0,"bestRound":0,"seen":[]}

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width":360,"height":640}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))

    # ---- 1. 첫 방문(빈 지갑) 마을 ----
    pg.goto(BASE + "/town/" + V, wait_until="load"); pg.wait_for_timeout(700)
    print("fresh state:", state(pg))
    print("home overflow 360:", json.dumps(overflow(pg), ensure_ascii=False))

    # ---- 2. 데모 상태로 마을 ----
    demo = dict(BASE_STATE); demo.update({"coins":420,
        "stats":{"flex":62,"stam":38,"axis":45,"turn":31},
        "owned":["basic","lilac"],"worn":"lilac","classes":2,
        "stamps":{"bar":1,"center":1,"piece":0}})
    seed(pg, demo)
    pg.reload(wait_until="load"); pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT/"ballet-town-home-360.png"), full_page=True)
    print("home demo overflow:", json.dumps(overflow(pg), ensure_ascii=False))

    # ---- 3. 분식집 시작 ----
    pg.goto(BASE + "/town/snack/" + V, wait_until="load"); pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT/"ballet-town-snack-start-360.png"))
    print("snack start overflow:", json.dumps(overflow(pg), ensure_ascii=False))

    # ---- 4. 플레이: 아라 손님 ----
    pg.evaluate("""() => {
      __snack.start();
      __snack.state.queue=[__snack.CUST[0],__snack.CUST[6],__snack.CUST[5],__snack.CUST[2],__snack.CUST[4],__snack.CUST[8]];
      __snack.state.total=6; __snack.state.round=0; __snack.renderRound();
    }""")
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT/"ballet-town-snack-play-360.png"))
    print("snack play overflow:", json.dumps(overflow(pg), ensure_ascii=False))

    pg.evaluate("() => __snack.togglePick('skewer')"); pg.wait_for_timeout(250)
    pg.screenshot(path=str(OUT/"ballet-town-snack-picked-360.png"))
    pg.evaluate("() => __snack.serve()"); pg.wait_for_timeout(800)
    pg.screenshot(path=str(OUT/"ballet-town-snack-serve-360.png"))
    after = state(pg)
    print("after serve coins/stats:", after["coins"], after["stats"])
    pg.evaluate("() => __snack.next()"); pg.wait_for_timeout(300)

    # 도감
    pg.evaluate("() => document.getElementById('dexBtn2').click()"); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT/"ballet-town-snack-dex-360.png"))
    pg.evaluate("() => document.getElementById('dexClose').click()")

    # 마감 화면까지 (6명 자동 서빙)
    for _ in range(5):
        pg.evaluate("""() => { const o=__snack.state.order; __snack.state.pick=o.need.slice(); __snack.serve(); }""")
        pg.wait_for_timeout(350)
        pg.evaluate("() => __snack.next()"); pg.wait_for_timeout(250)
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"ballet-town-snack-end-360.png"))
    print("after 6 rounds:", json.dumps({k: state(pg)[k] for k in ("coins","served","best")}, ensure_ascii=False))

    # ---- 5. 드레스룸 ----
    seed(pg, demo); pg.goto(BASE + "/town/dressroom/" + V, wait_until="load"); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT/"ballet-town-dressroom-360.png"), full_page=True)
    print("dress overflow:", json.dumps(overflow(pg), ensure_ascii=False))
    pg.locator('[data-preview="swan"]').click()
    pg.locator("#lookAction").click(); pg.wait_for_timeout(600)
    st = state(pg); print("buy swan:", st["coins"], st["owned"], st["worn"])
    pg.screenshot(path=str(OUT/"ballet-town-dressroom-buy-360.png"), full_page=True)

    # ---- 6. 스튜디오 (착용 의상 반영 + 수업) ----
    st = state(pg); st["coins"] = 420; seed(pg, st)
    pg.goto(BASE + "/town/studio/" + V, wait_until="load"); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT/"ballet-town-studio-360.png"), full_page=True)
    print("studio attend text:", pg.evaluate("() => document.querySelector('.attend-txt h2').innerText"))
    print("studio overflow:", json.dumps(overflow(pg), ensure_ascii=False))
    pg.evaluate("() => document.querySelector('[data-cls=\"center\"]').click()"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT/"ballet-town-studio-confirm-360.png"))
    pg.evaluate("() => document.getElementById('cGo').click()"); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT/"ballet-town-studio-lesson-360.png"))
    play_lesson(pg)
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT/"ballet-town-studio-result-360.png"))
    st = state(pg); print("after class:", st["coins"], st["classes"], st["stats"], st["stamps"])

    # ---- 7. 무대 (5번째 수업 후) ----
    demo2 = dict(BASE_STATE); demo2.update({"coins":600,
        "stats":{"flex":74,"stam":52,"axis":60,"turn":44},
        "owned":["basic","lilac","swan"],"worn":"swan","classes":4,
        "stamps":{"bar":2,"center":1,"piece":1}})
    seed(pg, demo2)
    pg.goto(BASE + "/town/studio/" + V, wait_until="load"); pg.reload(wait_until="load"); pg.wait_for_timeout(500)
    pg.evaluate("() => document.querySelector('[data-cls=\"piece\"]').click()"); pg.wait_for_timeout(300)
    pg.evaluate("() => document.getElementById('cGo').click()"); pg.wait_for_timeout(400)
    play_lesson(pg)
    pg.wait_for_timeout(400)
    print("stage ready:", pg.evaluate("() => document.getElementById('rTitle').innerText"))
    pg.screenshot(path=str(OUT/"ballet-town-studio-stageopen-360.png"))
    pg.goto(BASE + "/town/stage/" + V, wait_until="load"); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT/"ballet-town-stage-360.png"), full_page=True)
    print("stage overflow:", json.dumps(overflow(pg), ensure_ascii=False))

    # ---- 8. 카페 링크 확인 ----
    pg.goto(BASE + "/town/" + V, wait_until="load"); pg.wait_for_timeout(400)
    href = pg.evaluate("() => document.querySelector('a[href*=\"cafe\"]').getAttribute('href')")
    pg.goto(BASE + "/cafe/", wait_until="load"); pg.wait_for_timeout(600)
    print("cafe href:", href, "title:", pg.title())

    # ---- 9. 390 ----
    ctx2 = b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg2 = ctx2.new_page()
    pg2.on("pageerror", lambda e: errs.append("390 PAGEERROR " + str(e)))
    pg2.goto(BASE + "/town/" + V, wait_until="load"); pg2.wait_for_timeout(500)
    seed(pg2, demo); pg2.reload(wait_until="load"); pg2.wait_for_timeout(600)
    pg2.screenshot(path=str(OUT/"ballet-town-home-390.png"), full_page=True)
    print("home 390 overflow:", json.dumps(overflow(pg2), ensure_ascii=False))
    pg2.goto(BASE + "/town/snack/" + V, wait_until="load"); pg2.wait_for_timeout(400)
    pg2.evaluate("""() => { __snack.start(); __snack.state.queue=[__snack.CUST[3]]; __snack.state.total=1; __snack.state.round=0; __snack.renderRound(); }""")
    pg2.wait_for_timeout(400)
    pg2.screenshot(path=str(OUT/"ballet-town-snack-play-390.png"))
    print("snack 390 overflow:", json.dumps(overflow(pg2), ensure_ascii=False))
    pg2.goto(BASE + "/town/dressroom/" + V, wait_until="load"); pg2.wait_for_timeout(500)
    pg2.screenshot(path=str(OUT/"ballet-town-dressroom-390.png"), full_page=True)
    pg2.goto(BASE + "/town/studio/" + V, wait_until="load"); pg2.wait_for_timeout(500)
    pg2.screenshot(path=str(OUT/"ballet-town-studio-390.png"), full_page=True)
    print("studio 390 overflow:", json.dumps(overflow(pg2), ensure_ascii=False))

    print("CONSOLE ERRORS:", errs[:8])
    b.close()
print("saved to", OUT)
