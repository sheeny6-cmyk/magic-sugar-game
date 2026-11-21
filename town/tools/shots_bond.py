#!/usr/bin/env python3
"""친밀도 UI 요소별 화면 캡처(검토용)."""
import pathlib, threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path('/workspace/downloads')
V = '?v=20261121i'


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    httpd = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd.server_address[1]


STATE = {
    "v": 1, "coins": 4360, "nick": "정화", "named": True,
    "kingdom": {"charter": 1, "life": 3, "orders": {"etu": 3, "ara": 1, "piru": 2, "shangz": 0, "alle": 1},
                "prepared": None, "receipt": None, "debutOutfit": "lilac"},
    "spirits": {"etu": {"bond": 7, "met": 1763000000000}, "ara": {"bond": 1, "met": 1763000000000},
                "piru": {"bond": 4, "met": 1763000000000}, "shangz": {"bond": 0, "met": 0},
                "alle": {"bond": 9, "met": 1763000000000}},
    "practiceWith": "alle", "letters": ["etu-0", "alle-0"],
    "journal": [
        {"at": 1763000000000, "key": "arrive", "icon": "✉️", "text": "정화님이 발레왕국에 도착했어요. 오늘부터 한 걸음씩."},
        {"at": 1763100000000, "key": "first-class", "icon": "🩰", "text": "정화님이 첫 수업을 마쳤어요. 바를 잡은 손끝까지 음악이 닿았어요."},
        {"at": 1763200000000, "key": "bond-alle-2", "icon": "💗", "text": "알레와 친밀도 Lv.2이 되었어요. 늘 흥얼거리며 세 박자를 세는 정령이라고 해요."},
        {"at": 1763300000000, "key": "rank-2", "icon": "🌟", "text": "Lv.2 견습 발레리나로 승급했어요. 두 번의 수업이 열렸어요."},
        {"at": 1763400000000, "key": "first-show", "icon": "🎭", "text": "정화님이 왕립 극장 첫 무대에 올랐어요. 마지막 인사까지 박수가 이어졌어요."},
        {"at": 1763500000000, "key": "bond-alle-4", "icon": "💗", "text": "알레와 친밀도 Lv.4가 되었어요. 늘 흘얼거리며 세 박자를 세는 정령이라고 해요."}
    ],
    "stats": {"flex": 62, "stam": 38, "axis": 45, "turn": 31},
    "owned": ["basic", "lilac", "swan"], "worn": "swan",
    "stamps": {"bar": 3, "center": 2, "piece": 1},
    "classes": 6, "served": 4, "best": 180, "bestRound": 5, "seen": ["tteokbokki"],
    "shows": 1, "fame": 2, "gifts": [2], "levelUp": None,
    "show": {"grade": "A", "score": 940, "coins": 200, "notes": 16, "perfect": 12, "at": 1763400000000, "outfit": "swan"},
    "createdAt": 1763000000000, "lesson": None, "lastLessons": {}
}

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
    base = f'http://127.0.0.1:{serve()}/town/'
    pg.goto(base + V, wait_until="load")
    pg.evaluate("(d)=>localStorage.setItem('sugartown.v1',JSON.stringify(d))", STATE)
    pg.reload(wait_until="load")
    pg.wait_for_timeout(600)
    pg.locator('.growth').screenshot(path=str(OUT / '발레왕국-정령친밀도-1d-홈성장-진행.png'))
    pg.locator('.counter').screenshot(path=str(OUT / '발레왕국-정령친밀도-1c-정령카드.png'))
    pg.locator('.record').screenshot(path=str(OUT / '발레왕국-정령친밀도-1b-성장일기.png'))
    pg.click('[data-spirit="alle"]')
    pg.wait_for_timeout(400)
    pg.locator('#bondDialog').screenshot(path=str(OUT / '발레왕국-정령친밀도-2b-교감모달-진행.png'))
    pg.keyboard.press('Escape')
    pg.wait_for_timeout(200)
    pg.goto(base + 'stage/' + V, wait_until="load")
    pg.wait_for_timeout(600)
    pg.goto(base + 'studio/' + V, wait_until="load")
    pg.wait_for_timeout(700)
    if pg.locator('#levelup').is_visible():
        pg.click('#gGo')
        pg.wait_for_timeout(500)
    pg.goto(base + 'potions/' + V + '#alle', wait_until="load")
    pg.wait_for_timeout(600)
    print('errors:', errs)
    b.close()
