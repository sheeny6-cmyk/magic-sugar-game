#!/usr/bin/env python3
"""로컬 검증: 정령 친밀도 · 교감 모달 · 성장 일기 · 다음 모습 · 극장 응원."""
import json, pathlib, sys, threading, time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path('/workspace/downloads')
OUT.mkdir(parents=True, exist_ok=True)
V = '?v=20261121i'
problems = []


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    handler = partial(Quiet, directory=str(ROOT))
    httpd = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd.server_address[1]


def check(cond, label):
    print(('  ok   ' if cond else '  FAIL ') + label)
    if not cond:
        problems.append(label)


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


def seed(pg, d):
    pg.evaluate("(d)=>localStorage.setItem('sugartown.v1',JSON.stringify(d))", d)


def wallet(pg):
    return pg.evaluate("JSON.parse(localStorage.getItem('sugartown.v1'))")


def base_state(**kw):
    st = {
        "v": 1, "coins": 500, "nick": "정화", "named": True,
        "kingdom": {"charter": 1, "life": 3, "orders": {"etu": 2, "ara": 1, "piru": 0, "shangz": 0, "alle": 1},
                    "prepared": None, "receipt": None, "debutOutfit": None},
        "stats": {"flex": 20, "stam": 12, "axis": 16, "turn": 10},
        "owned": ["basic", "lilac"], "worn": "lilac",
        "stamps": {"bar": 1, "center": 0, "piece": 0},
        "classes": 1, "served": 0, "best": 0, "bestRound": 0, "seen": [],
        "shows": 0, "fame": 0, "gifts": [], "levelUp": None, "show": None,
        "createdAt": 1763000000000, "lesson": None, "lastLessons": {}
    }
    st.update(kw)
    return st


def main():
    live = sys.argv[1] if len(sys.argv) > 1 else ''
    if live:
        base = live.rstrip('/') + '/town/'
        print('LIVE', base)
    else:
        base = f'http://127.0.0.1:{serve()}/town/'
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w, h in [(360, 640), (390, 844)]:
            print(f'== viewport {w}x{h} ==')
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            errs = []
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))

            # ---- 1. 새 지갑: 도착 일기 · 오늘의 한마디 · 다음 모습 ----
            pg.goto(base + V, wait_until="load")
            pg.wait_for_timeout(500)
            if pg.locator('#nickDialog').is_visible():
                pg.fill('#nickInput', '정화')
                pg.click('#nickSave')
                pg.wait_for_timeout(500)
            check(pg.locator('#growthTitle').is_visible(), f'{w} 성장 섹션 표시')
            check('발레는 처음' in pg.inner_text('#voiceLine'), f'{w} Lv.1 독백 표시')
            hints = pg.locator('#lookHints li').count()
            check(hints >= 4, f'{w} 다음 모습 예고 {hints}줄')
            check(pg.get_attribute('#lookSilhouette', 'src') is not None, f'{w} 다음 의상 실루엣 src')
            check('아직은 실루엣' in pg.inner_text('#lookTitle'), f'{w} 실루엣 힌트 문구')
            diary = pg.locator('#diaryList li').count()
            check(diary >= 1, f'{w} 성장 일기 {diary}줄')
            check(pg.locator('#staffRoster .staff-link').count() == 5, f'{w} 정령 카드 5개')
            check(pg.locator('#staffRoster .heart-row').count() == 5, f'{w} 카드마다 하트')
            ov = overflow(pg)
            check(ov['scrollW'] <= ov['clientW'] + 1 and not ov['wide'], f'{w} 홈 가로 넘침 없음 {ov["scrollW"]}/{ov["clientW"]} {ov["wide"]}')
            if (w, h) == (360, 640):
                pg.wait_for_timeout(2500)
                pg.locator('.growth').screenshot(path=str(OUT / '발레왕국-정령친밀도-1-홈성장.png'))
                pg.locator('.record').screenshot(path=str(OUT / '발레왕국-정령친밀도-1b-성장일기.png'))
                pg.locator('.counter').screenshot(path=str(OUT / '발레왕국-정령친밀도-1c-정령카드.png'))

            # ---- 2. 정령 교감 모달 ----
            st = base_state(spirits={
                "etu": {"bond": 7, "met": 1763000000000}, "ara": {"bond": 1, "met": 1763000000000},
                "piru": {"bond": 0, "met": 0}, "shangz": {"bond": 0, "met": 0}, "alle": {"bond": 4, "met": 1763000000000}
            }, letters=["etu-0"], journal=[{"at": 1763000000000, "key": "arrive", "icon": "✉️", "text": "정화님이 발레왕국에 도착했어요."}])
            seed(pg, st)
            pg.reload(wait_until="load")
            pg.wait_for_timeout(500)
            check(pg.locator('[data-spirit="etu"] .hrt.on').count() == 4, f'{w} 에튜 카드 하트 4')
            check(pg.locator('[data-spirit="ara"] .hrt.on').count() == 2, f'{w} 아라 카드 하트 2')
            # 옛 지갑(정령 기록 없음)을 열면 주문 기록에서 친밀도를 이어받고 코인은 그대로다.
            old = base_state()
            old['coins'] = 777
            old.pop('spirits', None)
            seed(pg, old)
            pg.reload(wait_until='load')
            pg.wait_for_timeout(450)
            check(pg.evaluate("() => window.SugarTown.get().coins") == 777, f'{w} 옛 지갑 코인 유지')
            check(pg.evaluate("() => window.SugarTown.get().spirits.etu.bond") == 2, f'{w} 옛 주문 기록에서 에튜 친밀도 이어받기')
            check(pg.evaluate("() => window.SugarTown.get().journal.length") >= 1, f'{w} 옛 지갑에도 성장 일기 시작')
            check(pg.locator('[data-spirit="etu"] .hrt.on').count() == 2, f'{w} 옛 지갑 정령 카드 하트')
            # 다시 진행된 지갑으로
            seed(pg, st)
            pg.reload(wait_until='load')
            pg.wait_for_timeout(450)
            pg.click('[data-spirit="etu"]')
            pg.wait_for_timeout(300)
            check(pg.locator('#bondDialog').is_visible(), f'{w} 교감 모달 열림')
            check('에튜' in pg.inner_text('#bondName'), f'{w} 모달 정령 이름')
            check(pg.locator('#bondDialog .hrt.on').count() == 4, f'{w} 모달 하트 4')
            check('균형' in pg.inner_text('#bondNote') or 'Lv.4' in pg.inner_text('#bondNote'), f'{w} 친밀도 문구')
            check(pg.locator('#bondLetters details.letter').count() == 2, f'{w} 열린 편지 2통')
            check(pg.locator('#bondLetters .letter.locked').count() == 1, f'{w} 잠긴 편지 1통')
            body = pg.text_content('#bondLetters details.letter:first-of-type p')
            check('안녕하세요, 정화님' in (body or ''), f'{w} 편지에 닉네임')
            pg.click('#bondLetters details.letter:first-of-type summary')
            pg.wait_for_timeout(400)
            check(pg.locator('#bondLetters details.letter[open]').count() == 1, f'{w} 편지 펼침')
            wl = wallet(pg)
            check('etu-0' in (wl.get('letters') or []), f'{w} 읽은 편지 기록')
            ov = overflow(pg)
            check(ov['scrollW'] <= ov['clientW'] + 1, f'{w} 모달 가로 넘침 없음')
            if (w, h) == (390, 844):
                pg.locator('#bondDialog').screenshot(path=str(OUT / '발레왕국-정령친밀도-2-교감모달.png'))
            pg.click('#bondPractice')
            pg.wait_for_timeout(1200)
            check(pg.url.endswith('studio/?v=20261121i'), f'{w} 모달에서 함께 연습으로 이동 ({pg.url.split("/")[-1]})')
            check(wallet(pg)['practiceWith'] == 'etu', f'{w} 모달에서 고른 정령이 연습 친구로 저장')
            pg.go_back()
            pg.wait_for_timeout(700)
            pg.click('[data-spirit="etu"]')
            pg.wait_for_timeout(300)
            pg.click('#bondClose')
            pg.wait_for_timeout(200)
            check(not pg.locator('#bondDialog').is_visible(), f'{w} 모달 닫기')
            pg.click('[data-spirit="ara"]')
            pg.wait_for_timeout(250)
            check(pg.locator('#bondLetters details.letter').count() == 1, f'{w} 아라 열린 편지 1통')
            pg.keyboard.press('Escape')
            pg.wait_for_timeout(200)

            # ---- 3. 분식집: 정령 손님께 서빙하면 친밀도 상승 ----
            pg.goto(base + 'snack/' + V, wait_until="load")
            pg.wait_for_timeout(400)
            pg.click('#startBtn')
            pg.wait_for_timeout(300)
            before = wallet(pg)
            gained = []
            for _ in range(6):
                o = pg.evaluate("() => { const s = window.__snack.state; return {id: s.order.id, need: s.order.need, img: !!s.order.img}; }")
                before_round = wallet(pg)
                for mid in o['need']:
                    pg.click(f'.mcard[data-id="{mid}"]')
                pg.click('#serveBtn')
                pg.wait_for_timeout(350)
                after_round = wallet(pg)
                up = [sid for sid in after_round['spirits']
                      if after_round['spirits'][sid]['bond'] > before_round['spirits'][sid]['bond']]
                check(bool(up) == pg.locator('#rBond').is_visible(), f'{w} 친밀도 안내와 실제 상승 일치 ({o["id"]}: {up})')
                expected = o['id'] in ('etu', 'ara', 'piru', 'shangz', 'alle')
                check(bool(up) == expected, f'{w} 정령 손님만 친밀도 상승 ({o["id"]}: {up})')
                gained.extend(up)
                pg.click('#rNext')
                pg.wait_for_timeout(300)
            after = wallet(pg)
            for sid in set(gained):
                check(after['spirits'][sid]['bond'] > before['spirits'][sid]['bond'], f'{w} {sid} 친밀도 +')
            check(pg.locator('#endBonds').is_visible(), f'{w} 마감 카드 친밀도 요약')
            if (w, h) == (360, 640):
                pg.screenshot(path=str(OUT / '발레왕국-정령친밀도-3-분식집.png'))

            # ---- 4. 스튜디오: 함께할 정령 + 수업 완주 ----
            st = base_state(classes=0, stamps={"bar": 0, "center": 0, "piece": 0},
                            stats={"flex": 0, "stam": 0, "axis": 0, "turn": 0})
            seed(pg, st)
            pg.goto(base + 'studio/' + V, wait_until="load")
            pg.wait_for_timeout(400)
            check(pg.locator('#mates .mate').count() == 5, f'{w} 함께할 정령 5명')
            pg.click('[data-mate="alle"]')
            pg.wait_for_timeout(400)
            check(wallet(pg)['practiceWith'] == 'alle', f'{w} 함께할 정령 저장')
            check('알레' in pg.inner_text('#mateNote'), f'{w} 함께 연습 안내')
            pg.click('.cls[data-cls="bar"]')
            pg.wait_for_timeout(300)
            check('알레' in pg.inner_text('#cNote'), f'{w} 수업 확인창 친밀도 예고')
            pg.click('#cGo')
            pg.wait_for_timeout(600)
            # 첫 노트에서 일부러 틀린 동작을 눌러 다독임 문구를 확인한다.
            pg.wait_for_function("() => window.__rhythm && window.__rhythm.notes().length > 0")
            info = pg.evaluate("() => ({now: window.__rhythm.now(), notes: window.__rhythm.notes()})")
            first = info['notes'][0]
            wait = first['t'] - info['now']
            if wait > 0:
                time.sleep(min(wait, 3000) / 1000)
            wrong = {'beat': '.move.jump', 'cat': '.move.beat', 'jump': '.move.beat'}[first['type']]
            pg.locator(wrong).click()
            pg.wait_for_timeout(250)
            check(pg.locator('#lComfort').is_visible(), f'{w} 삐끗해도 정령이 다독임')
            # 남은 노트는 정직하게 연주한다.
            buttons = {"beat": ".move.beat", "cat": ".move.cat", "jump": ".move.jump"}
            deadline = time.time() + 40
            while time.time() < deadline:
                info = pg.evaluate("() => ({now: window.__rhythm.now(), notes: window.__rhythm.notes()})")
                pending = [n for n in info['notes'] if not n['judged']]
                if not pending:
                    break
                up = pending[0]
                gap = up['t'] - info['now'] - 10
                if gap > 0:
                    time.sleep(min(gap, 200) / 1000)
                    continue
                pg.locator(buttons[up['type']]).click()
                time.sleep(0.03)
            pg.wait_for_timeout(600)
            if pg.locator('#levelup').is_visible():
                pg.click('#gGo')
                pg.wait_for_timeout(400)
            pg.wait_for_selector('#result', state='visible', timeout=15000)
            bonds_text = pg.text_content('#rBonds') or ''
            check('알레' in bonds_text and '에튜' in bonds_text, f'{w} 결과 카드에 친밀도: {bonds_text}')
            check(pg.inner_text('#rVoice').strip() != '', f'{w} 결과 카드의 정령 한마디')
            after = wallet(pg)
            check(after['spirits']['etu']['bond'] >= 1, f'{w} 선생님 에튜 친밀도 상승')
            check(after['spirits']['alle']['bond'] >= 1, f'{w} 함께한 알레 친밀도 상승')
            check(any(b.get('id') == 'alle' for b in after['kingdom']['receipt'].get('bonds', [])), f'{w} 영수증에 알레 교감 기록')
            if (w, h) == (360, 640):
                pg.screenshot(path=str(OUT / '발레왕국-정령친밀도-4-스튜디오결과.png'))

            # ---- 5. 왕립 극장: 가장 가까운 정령의 응원 ----
            st = base_state(classes=6, shows=1, stamps={"bar": 2, "center": 2, "piece": 2},
                            spirits={"etu": {"bond": 3, "met": 1}, "ara": {"bond": 1, "met": 1},
                                     "piru": {"bond": 9, "met": 1}, "shangz": {"bond": 0, "met": 0}, "alle": {"bond": 2, "met": 1}})
            seed(pg, st)
            pg.goto(base + 'stage/' + V, wait_until="load")
            pg.wait_for_timeout(500)
            check(pg.locator('#cheerRow .cheer-spirit').count() == 2, f'{w} 응원 정령 2명')
            check('피루' in pg.inner_text('#cheerLine'), f'{w} 가장 가까운 정령이 피루')
            ov = overflow(pg)
            check(ov['scrollW'] <= ov['clientW'] + 1, f'{w} 극장 가로 넘침 없음')
            if (w, h) == (390, 844):
                pg.screenshot(path=str(OUT / '발레왕국-정령친밀도-5-극장응원.png'))
                pg.locator('.spirit-cheer').screenshot(path=str(OUT / '발레왕국-정령친밀도-5b-극장응원띠.png'))
            pg.click('#startShow')
            pg.wait_for_timeout(900)
            check('피루' in pg.inner_text('#sBubble'), f'{w} 무대 시작 응원 한마디')
            pg.click('#sQuit')
            pg.wait_for_timeout(300)

            # ---- 6. 주문대 · 드레스룸 회귀 확인 ----
            errs2 = []
            pg.on("console", lambda m: errs2.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs2.append("PAGEERROR " + str(e)))
            pg.goto(base + 'potions/' + V + '#etu', wait_until='load')
            pg.wait_for_timeout(500)
            check(pg.locator('#bondHearts .hrt.on').count() >= 1, f'{w} 주문대 친밀도 하트')
            check(pg.locator('#bondText').inner_text().startswith('친밀도 Lv.'), f'{w} 주문대 친밀도 문구')
            ov = overflow(pg)
            check(ov['scrollW'] <= ov['clientW'] + 1, f'{w} 주문대 가로 넘침 없음')
            pg.goto(base + 'dressroom/' + V, wait_until='load')
            pg.wait_for_timeout(400)
            check(pg.locator('body').is_visible(), f'{w} 드레스룸 표시')
            check(not errs2, f'{w} 주문대/드레스룸 오류 0건 ' + json.dumps(errs2[:3], ensure_ascii=False))

            check(not errs, f'{w} console.error/pageerror 0건 ' + json.dumps(errs[:4], ensure_ascii=False))
            ctx.close()
        b.close()
    print('\nproblems:', json.dumps(problems, ensure_ascii=False, indent=1) if problems else 'none')


if __name__ == '__main__':
    main()
