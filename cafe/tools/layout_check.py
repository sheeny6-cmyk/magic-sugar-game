#!/usr/bin/env python3
"""cafe/ 레이아웃 검증: 트레이 9개 버튼 + 비우기/서빙하기가 화면 안에 온전히 보이는지 확인."""
import json
import sys
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = ROOT / "index.html"

SIZES = [(320, 568), (360, 640), (360, 740), (384, 700), (390, 844), (430, 932)]

PROBE = """() => {
  const app = document.getElementById('app');
  const tray = document.getElementById('tray');
  const btns = [...tray.querySelectorAll('.ing')];
  const sv = document.getElementById('serveBtn');
  const cl = document.getElementById('clearBtn');
  const r = e => { const b = e.getBoundingClientRect(); return {l: +b.left.toFixed(1), r: +b.right.toFixed(1), t: +b.top.toFixed(1), b: +b.bottom.toFixed(1)}; };
  return {
    vw: window.innerWidth, vh: window.innerHeight,
    appW: app.clientWidth, appH: app.clientHeight,
    docScrollW: document.documentElement.scrollWidth,
    docScrollH: document.documentElement.scrollHeight,
    trayScrollW: tray.scrollWidth, trayClientW: tray.clientWidth,
    count: btns.length,
    names: btns.map(b => b.querySelector('.nm').textContent.trim()),
    chips: [...document.querySelectorAll('#recipe .chip')].map(c => c.textContent.trim()),
    rows: [...new Set(btns.map(b => Math.round(b.getBoundingClientRect().top)))].length,
    btns: btns.map(b => ({ n: b.querySelector('.nm').textContent.trim(), ...r(b), sw: b.scrollWidth, cw: b.clientWidth })),
    serve: r(sv), clear: r(cl),
    serveVisible: !!sv.offsetParent,
  };
}"""


def run():
    ok = True
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w, h in SIZES:
            ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2,
                                is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            pg.goto(URL.as_uri())
            pg.click("#startBtn")
            pg.wait_for_timeout(500)
            d = pg.evaluate(PROBE)
            probs = []
            if d["count"] != 9:
                probs.append(f"tray buttons={d['count']}")
            if d["trayScrollW"] > d["trayClientW"] + 1:
                probs.append(f"tray scrollW {d['trayScrollW']} > clientW {d['trayClientW']}")
            if d["docScrollW"] > d["vw"]:
                probs.append(f"doc scrollW {d['docScrollW']} > vw {d['vw']}")
            for bb in d["btns"]:
                if bb["r"] > d["vw"] or bb["l"] < 0:
                    probs.append(f"btn {bb['n']} out horizontally l={bb['l']} r={bb['r']}")
                if bb["b"] > d["vh"] or bb["t"] < 0:
                    probs.append(f"btn {bb['n']} out vertically t={bb['t']} b={bb['b']}")
                if bb["sw"] > bb["cw"] + 1:
                    probs.append(f"btn {bb['n']} text clipped sw={bb['sw']} cw={bb['cw']}")
            if d["serve"]["b"] > d["vh"] or d["serve"]["r"] > d["vw"]:
                probs.append(f"serveBtn out {d['serve']}")
            if d["clear"]["b"] > d["vh"] or d["clear"]["l"] < 0:
                probs.append(f"clearBtn out {d['clear']}")
            # 칩 이름 == 버튼 이름(현재 주문의 재료에 대해)
            for c in d["chips"]:
                nm = c.lstrip("".join(ch for ch in c if not ch.isalnum() and ord(ch) > 0x1F000))
                if not any(bn in c for bn, _ in [(bn, 1) for bn in d["names"]]):
                    probs.append(f"chip {c!r} has no matching tray button")
            out[f"{w}x{h}"] = d
            status = "OK" if not probs else "FAIL"
            if probs:
                ok = False
            print(f"[{status}] {w}x{h} rows={d['rows']} appW={d['appW']} trayScrollW={d['trayScrollW']}/{d['trayClientW']} serve.bottom={d['serve']['b']}")
            for pr in probs:
                print("   -", pr)
            ctx.close()
        b.close()
    print("\nnames:", out[f"{SIZES[0][0]}x{SIZES[0][1]}"]["names"])
    print("chips:", out[f"{SIZES[0][0]}x{SIZES[0][1]}"]["chips"])
    print("RESULT:", "ALL OK" if ok else "PROBLEMS FOUND")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(run())
