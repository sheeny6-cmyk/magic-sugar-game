#!/usr/bin/env python3
"""로컬 검증: 레벨업 보상 · 리듬 무대 · 왕립 극장 공연 + 포스터."""
import json, pathlib, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8099"
OUT = pathlib.Path("/workspace/downloads")
OUT.mkdir(parents=True, exist_ok=True)
V = "?v=20261121g"

STATE = {"v": 1, "coins": 0, "stats": {"flex": 0, "stam": 0, "axis": 0, "turn": 0},
         "owned": ["basic"], "worn": "basic", "stamps": {"bar": 0, "center": 0, "piece": 0},
         "classes": 0, "served": 0, "best": 0, "bestRound": 0, "seen": []}


def seed(pg, d):
    pg.evaluate("(d)=>localStorage.setItem('sugartown.v1',JSON.stringify(d))", d)


def wallet(pg):
    return pg.evaluate("JSON.parse(localStorage.getItem('sugartown.v1'))")


def overflow(pg):
    return pg.evaluate("""() => {
      const de = document.documentElement; const wide=[];
      document.querySelectorAll('*').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>0 && (r.right>de.clientWidth+1 || r.left<-1) && getComputedStyle(el).position!=='fixed')
          wide.push({tag:el.tagName,cls:String(el.className).slice(0,40),l:Math.round(r.left),r:Math.round(r.right)});
      });
      return {scrollW:de.scrollWidth, clientW:de.clientWidth, wide:wide.slice(0,6)};
    }""")


def play_lesson(pg, capture=None):
    """노트가 판정 원에 닿을 때 버튼을 누른다."""
    pg.wait_for_function("() => window.__rhythm && window.__rhythm.notes().length > 0")
    buttons = {"beat": ".move.beat", "cat": ".move.cat", "jump": ".move.jump"}
    deadline = time.time() + 40
    while time.time() < deadline:
        info = pg.evaluate("() => ({ now: window.__rhythm.now(), notes: window.__rhythm.notes() })")
        pending = [n for n in info["notes"] if not n["judged"]]
        if not pending:
            break
        up = pending[0]
        wait = up["t"] - info["now"] - 10
        if wait > 0:
            time.sleep(min(wait, 200) / 1000)
            continue
        pg.locator(buttons[up["type"]]).click()
        time.sleep(0.03)
    pg.wait_for_function("() => document.getElementById('result').open || document.getElementById('levelup').open", timeout=25000)
    levelup = None
    if pg.locator("#levelup").is_visible():
        levelup = {
            "title": pg.locator("#gTitle").inner_text(),
            "coins": pg.locator("#gCoins").inner_text(),
            "outfit": pg.locator("#gOutfitName").inner_text() if pg.locator("#gOutfit").is_visible() else None,
            "kicker": pg.locator("#gKicker").inner_text(),
            "note": pg.locator("#gOutfitNote").inner_text() if pg.locator("#gOutfit").is_visible() else None,
        }
        if capture:
            pg.screenshot(path=capture)
        pg.locator("#gGo").click()
        pg.wait_for_selector("#result", state="visible", timeout=15000)
    return levelup


with sync_playwright() as p:
    b = p.chromium.launch()
    for size in [(360, 640), (390, 844)]:
        ctx = b.new_context(viewport={"width": size[0], "height": size[1]}, device_scale_factor=2,
                            is_mobile=True, has_touch=True)
        pg = ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))

        demo = dict(STATE); demo.update({"coins": 240, "stats": {"flex": 62, "stam": 38, "axis": 45, "turn": 31},
                                         "owned": ["basic", "lilac"], "worn": "lilac", "classes": 1,
                                         "stamps": {"bar": 1, "center": 0, "piece": 0}})
        pg.goto(BASE + "/town/" + V, wait_until="load")
        seed(pg, demo)

        # --- 스튜디오 ---
        pg.goto(BASE + "/town/studio/" + V, wait_until="load"); pg.wait_for_timeout(600)
        print(size, "studio overflow", json.dumps(overflow(pg), ensure_ascii=False))
        pg.screenshot(path=str(OUT / f"local-studio-{size[0]}.png"))
        print("classes cards:", pg.locator(".cls").count())
        print("class notes small:", pg.locator(".cls").first.locator("small").inner_text())

        # 수업 시작 → 화면
        pg.locator(".cls").first.click(); pg.wait_for_timeout(400)
        pg.locator("#cGo").click()
        pg.wait_for_timeout(1900)
        pg.screenshot(path=str(OUT / f"local-lesson-{size[0]}.png"))
        props = pg.evaluate("() => window.__rhythm.props()")
        print("props now:", props[:3])
        print("music:", pg.evaluate("() => window.__rhythm.music()"))
        print("audio:", pg.evaluate("() => window.__rhythm.audio()"))
        res = play_lesson(pg, capture=str(OUT / f"local-levelup-{size[0]}.png"))
        print("levelup:", res)
        pg.screenshot(path=str(OUT / f"local-result-{size[0]}.png"))
        print("wallet after:", {k: wallet(pg)[k] for k in ("classes", "coins", "gifts", "owned")})
        print("result title:", pg.locator("#rTitle").inner_text(), "| balance:", pg.locator("#rBalance").inner_text())

        # --- 드레스룸 ---
        pg.goto(BASE + "/town/dressroom/" + V, wait_until="load"); pg.wait_for_timeout(500)
        print(size, "dress overflow", json.dumps(overflow(pg), ensure_ascii=False))
        print("badges:", pg.evaluate("() => [...document.querySelectorAll('.lv-badge')].map(e=>({t:e.textContent,h:e.hidden}))"))
        pg.screenshot(path=str(OUT / f"local-dress-{size[0]}.png"), full_page=True)

        # --- 왕립 극장 (도장 5개 이상) ---
        ready_state = wallet(pg)
        ready_state["classes"] = 6
        ready_state["stamps"] = {"bar": 2, "center": 2, "piece": 2}
        ready_state["owned"] = ["basic", "lilac", "swan"]
        ready_state["worn"] = "swan"
        ready_state["fame"] = 0
        seed(pg, ready_state)
        pg.goto(BASE + "/town/stage/" + V, wait_until="load"); pg.wait_for_timeout(500)
        print(size, "stage overflow", json.dumps(overflow(pg), ensure_ascii=False))
        print("ready:", pg.evaluate("() => window.__stage.ready()"))
        pg.screenshot(path=str(OUT / f"local-stage-{size[0]}.png"), full_page=True)
        if pg.evaluate("() => window.__stage.ready()"):
            pg.locator("#startShow").click()
            pg.wait_for_timeout(1500)
            pg.screenshot(path=str(OUT / f"local-show-{size[0]}.png"))
            # 자동 연주: 큐 시각에 맞춰 탭
            deadline = time.time() + 45
            while time.time() < deadline:
                st = pg.evaluate("() => window.__stage.show()")
                if not st:
                    break
                if st["at"] >= len(st["times"]):
                    break
                target = st["times"][st["at"]]
                wait = target - st["now"]
                if wait > 0:
                    time.sleep(min(wait, 120) / 1000)
                    continue
                pg.evaluate("() => window.__stage.tap()")
                pg.wait_for_timeout(60)
            pg.wait_for_timeout(1800)
            print("curtain open:", pg.locator("#curtain").is_visible())
            print("grade:", pg.locator("#cGrade").inner_text(), "score:", pg.locator("#cScore").inner_text())
            pg.screenshot(path=str(OUT / f"local-curtain-{size[0]}.png"))
            pg.locator("#makePoster").click()
            pg.wait_for_timeout(900)
            print("poster:", pg.evaluate("() => window.__stage.poster()"))
            pg.screenshot(path=str(OUT / f"local-poster-{size[0]}.png"))
            png = pg.evaluate("() => document.getElementById('poster').toDataURL('image/png').slice(0,40)")
            print("poster data:", png)
            pg.evaluate("""() => { const c = document.getElementById('poster');
                const a = document.createElement('a');
                const d = c.toDataURL('image/png');
                const w = window.open('', '_blank'); w.document.write('<img src="'+d+'">'); }""")
        print(size, "errors:", errs)
        ctx.close()
    b.close()
    print("saved to", OUT)
