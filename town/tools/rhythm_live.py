#!/usr/bin/env python3
"""발레 스튜디오 리듬 수업 라이브 검증 + 보고용 스크린샷.

사용: python3 rhythm_live.py https://sheeny6-cmyk.github.io/magic-sugar-game
      python3 rhythm_live.py http://127.0.0.1:8123
"""
import json, pathlib, sys, time
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://sheeny6-cmyk.github.io/magic-sugar-game").rstrip("/")
OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "/workspace/downloads")
OUT.mkdir(parents=True, exist_ok=True)
V = "?v=20261121f"
BUTTONS = {"beat": ".move.beat", "cat": ".move.cat", "jump": ".move.jump"}

STATE = {"v": 1, "coins": 420, "stats": {"flex": 62, "stam": 38, "axis": 45, "turn": 31},
         "owned": ["basic", "lilac"], "worn": "lilac", "classes": 3,
         "stamps": {"bar": 2, "center": 1, "piece": 0},
         "kingdom": {"charter": 1, "life": 4, "prepared": {"id": "etu", "level": 1},
                     "orders": {"etu": 0, "ara": 0, "piru": 0, "shangz": 0, "alle": 0}, "receipt": None}}


def wallet(pg):
    return pg.evaluate("() => JSON.parse(localStorage.getItem('sugartown.v1'))")


def overflow(pg):
    return pg.evaluate("""() => {
      const de = document.documentElement, wide = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed') {
          if (el.closest('.note-lane')) return;
          wide.push({tag: el.tagName, cls: String(el.className).slice(0, 40), l: Math.round(r.left), r: Math.round(r.right)});
        }
      });
      return {"scrollW": de.scrollWidth, "clientW": de.clientWidth, "wide": wide.slice(0, 6)};
    }""")


def next_note(pg):
    info = pg.evaluate("() => ({ now: window.__rhythm.now(), notes: window.__rhythm.notes() })")
    pending = [n for n in info["notes"] if not n["judged"]]
    return (info["now"], pending[0] if pending else None)


def play_through(pg, shot_after=None, shot_path=None):
    hits = 0
    deadline = time.time() + 40
    while time.time() < deadline:
        now, upcoming = next_note(pg)
        if not upcoming:
            return hits
        wait = upcoming["t"] - now - 10
        if wait > 0:
            time.sleep(min(wait, 200) / 1000)
            continue
        pg.locator(BUTTONS[upcoming["type"]]).click()
        hits += 1
        if shot_after and hits == shot_after:
            pg.wait_for_timeout(70)
            pg.screenshot(path=str(shot_path))
    return hits


with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    ctx = b.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append("CONSOLE " + m.type + ": " + m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))

    pg.goto(BASE + "/town/studio/" + V, wait_until="load")
    pg.evaluate("(d) => localStorage.setItem('sugartown.v1', JSON.stringify(d))", STATE)
    pg.reload(wait_until="load")
    pg.wait_for_timeout(500)
    print("STUDIO overflow:", json.dumps(overflow(pg), ensure_ascii=False))
    pg.screenshot(path=str(OUT / "ballet-town-rhythm-studio.png"), full_page=True)

    before = wallet(pg)
    pg.locator('[data-cls="bar"]').click()
    pg.wait_for_timeout(350)
    pg.screenshot(path=str(OUT / "ballet-town-rhythm-confirm.png"))
    print("confirm:", pg.locator("#cKicker").inner_text(), "|", pg.locator("#cReward").inner_text())
    pg.locator("#cGo").click()
    pg.wait_for_timeout(600)
    print("lesson:", pg.locator("#lTitle").inner_text(), "|", pg.locator("#lCount").inner_text())
    print("buff:", pg.locator("#lBuff").inner_text())
    print("audio:", pg.evaluate("() => window.__rhythm.audio()"), "music:", pg.evaluate("() => window.__rhythm.music()"))
    print("window:", pg.evaluate("() => window.__rhythm.score().window"))
    print("card scroll:", pg.evaluate("() => { const c = document.querySelector('.lcard'); return {ch: c.clientHeight, sh: c.scrollHeight}; }"))

    hits = play_through(pg, shot_after=3, shot_path=OUT / "ballet-town-rhythm-play.png")
    print("hits:", hits, "| score:", pg.evaluate("() => window.__rhythm.score()"))
    print("play overflow:", json.dumps(overflow(pg), ensure_ascii=False))
    pg.wait_for_selector("#result", state="visible", timeout=20000)
    pg.wait_for_timeout(350)
    pg.screenshot(path=str(OUT / "ballet-town-rhythm-result.png"))
    print("result:", pg.locator("#rCourse").inner_text(), "|", pg.locator("#rTitle").inner_text(),
          "|", pg.locator("#rPerfect").inner_text(), pg.locator("#rGood").inner_text(),
          pg.locator("#rMiss").inner_text(), "combo", pg.locator("#rCombo").inner_text())
    print("bonus line:", pg.locator("#rCoinsDetail").inner_text())
    after = wallet(pg)
    receipt = after["kingdom"]["receipt"]
    print("receipt:", json.dumps({k: receipt[k] for k in ("kind", "coins", "baseCoins", "bonusCoins", "perfect", "good", "miss", "maxCombo", "gift", "before", "after")}, ensure_ascii=False))
    assert after["lesson"] is None and after["classes"] == before["classes"] + 1, "lesson settle"
    assert after["stamps"]["bar"] == before["stamps"]["bar"] + 1, "stamp"
    assert receipt["coins"] == receipt["baseCoins"] + receipt["bonusCoins"], "coin breakdown"
    assert after["coins"] == before["coins"] + receipt["coins"], "wallet"
    assert receipt["perfect"] + receipt["good"] + receipt["miss"] == 8, "note count"
    assert after["kingdom"]["prepared"] is None, "potion consumed"
    assert after["worn"] == before["worn"] and "lilac" in after["owned"], "outfit kept"
    print("result overflow:", json.dumps(overflow(pg), ensure_ascii=False))

    # 한 번 더! 로 다시 시작했을 때 첫 노트가 새로 도착하는지
    pg.locator("#rAgain").click()
    pg.wait_for_timeout(500)
    print("again:", pg.locator("#lCount").inner_text(), "| notes:", len(pg.evaluate("() => window.__rhythm.notes()")))

    # 허브·무대 링크가 새 버전으로 열리는지
    pg.goto(BASE + "/town/" + V, wait_until="load")
    pg.wait_for_timeout(400)
    print("hub:", pg.locator("#nextGoal").inner_text(), "|", pg.locator("#nextReward").inner_text())
    pg.screenshot(path=str(OUT / "ballet-town-hub-360.png"), full_page=True)
    pg.goto(BASE + "/town/stage/" + V, wait_until="load")
    pg.wait_for_timeout(300)
    print("stage title:", pg.locator("h1").first.inner_text())

    ctx2 = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg2 = ctx2.new_page()
    pg2.on("pageerror", lambda e: errs.append("PAGEERROR390: " + str(e)))
    pg2.goto(BASE + "/town/studio/" + V, wait_until="load")
    pg2.wait_for_timeout(300)
    print("390 overflow:", json.dumps(overflow(pg2), ensure_ascii=False))

    print("ERRORS:", errs[:10])
    b.close()

print("screenshots:", OUT)
