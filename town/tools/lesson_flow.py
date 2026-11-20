"""Complete a studio lesson using its rendered answer buttons."""
from playwright.sync_api import expect


def finish_lesson(page):
    def wallet():
        return page.evaluate("JSON.parse(localStorage.getItem('sugartown.v1'))")

    before = wallet()
    run = before["lesson"]
    for index, row in enumerate(run["rounds"]):
        expect(page.locator("#lCount")).to_contain_text(f"{index + 1} / 3")
        expect(page.locator("#lNext")).to_be_hidden()
        if index == 0:
            wrong = next(choice for choice in row["choices"] if choice != row["key"])
            page.locator(f'.term-choice[data-key="{wrong}"]').click()
            expect(page.locator("#lFeedback")).to_contain_text("한 번 더")
            page.reload(wait_until="domcontentloaded")
            expect(page.locator(f'.term-choice[data-key="{wrong}"]')).to_be_disabled()
        page.locator(f'.term-choice[data-key="{row["key"]}"]').click()
        page.locator("#lNext").click()
    expect(page.locator("#result")).to_be_visible()
    after = wallet()
    assert after["lesson"] is None and after["classes"] == before["classes"] + 1
    assert after["stamps"][run["kind"]] == before["stamps"][run["kind"]] + 1
    assert after["coins"] == before["coins"] and after["worn"] == before["worn"]
