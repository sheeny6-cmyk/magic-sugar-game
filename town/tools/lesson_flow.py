"""리듬 수업을 실제 무대 버튼으로 끝까지 연주한다."""
import time


def wallet(page):
    return page.evaluate("JSON.parse(localStorage.getItem('sugartown.v1'))")


def play_lesson(page, timeout=30000):
    """노트가 판정 원에 닿을 때 같은 동작 버튼을 누른다."""
    before = wallet(page)
    run = before["lesson"]
    page.wait_for_function("() => window.__rhythm && window.__rhythm.notes().length > 0")
    buttons = {"beat": ".move.beat", "cat": ".move.cat", "jump": ".move.jump"}
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        info = page.evaluate("() => ({ now: window.__rhythm.now(), notes: window.__rhythm.notes() })")
        pending = [n for n in info["notes"] if not n["judged"]]
        if not pending:
            break
        upcoming = pending[0]
        wait = upcoming["t"] - info["now"] - 10
        if wait > 0:
            time.sleep(min(wait, 250) / 1000)
            continue
        page.locator(buttons[upcoming["type"]]).click()
        time.sleep(0.03)
    # 레벨업 카드가 먼저 뜨면 보상을 받고 결과 카드로 넘어간다.
    page.wait_for_timeout(200)
    if page.locator("#levelup").is_visible():
        page.locator("#gGo").click()
    page.wait_for_selector("#result", state="visible", timeout=15000)
    after = wallet(page)
    assert after["lesson"] is None and after["classes"] == before["classes"] + 1
    assert after["stamps"][run["kind"]] == before["stamps"][run["kind"]] + 1
    receipt = after["kingdom"]["receipt"]
    base = {"bar": 50, "center": 80, "piece": 120}[run["kind"]]
    potion = before["kingdom"]["prepared"]
    extra = 12 * potion["level"] if potion and potion["id"] == "piru" else 0
    gift = (receipt.get("levelUp") or {}).get("coins", 0)
    assert receipt["baseCoins"] == base
    assert receipt["coins"] == base + receipt["bonusCoins"] + (12 * potion["level"] if potion and potion["id"] == "piru" else 0)
    assert after["coins"] == before["coins"] + run["paidFee"] + receipt["coins"] + gift
    assert receipt["perfect"] + receipt["good"] + receipt["miss"] == len(run["chart"]["notes"])
    assert receipt["maxCombo"] <= receipt["perfect"] + receipt["good"]
    assert after["kingdom"]["prepared"] is None and after["worn"] == before["worn"]
    return receipt
