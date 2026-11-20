#!/usr/bin/env python3
"""배포본 제목 확인 스크린샷: 시작 화면(390x844)을 저장."""
import pathlib
from playwright.sync_api import sync_playwright

URL = "https://sheeny6-cmyk.github.io/magic-sugar-game/cafe/?v=20261120d"
OUT = pathlib.Path("/workspace/downloads")

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1200)
    print(pg.title(), "|", pg.evaluate("() => document.querySelector('.start-top h1').innerText.replace(/\\n/g,' / ')"))
    pg.screenshot(path=str(OUT / "_title-start-390.png"))
    ctx.close()
    b.close()
