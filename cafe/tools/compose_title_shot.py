#!/usr/bin/env python3
"""배포 확인용 합성 이미지: 새 제목(시작 화면) + 공유 카드(is.gd/sugarcafe)."""
import pathlib
from PIL import Image, ImageDraw, ImageFont

D = pathlib.Path("/workspace/downloads")
FONT = "/usr/share/fonts/pickle-hwp/NotoSansCJKkr-Regular.otf"
f_h = ImageFont.truetype(FONT, 30)
f_c = ImageFont.truetype(FONT, 24)
f_s = ImageFont.truetype(FONT, 20)

start = Image.open(D / "_title-start-390.png").convert("RGB")
card = Image.open(D / "ballet-cafe-v2-share-card.png").convert("RGB")

H = 900
def fit(im):
    w = int(im.width * H / im.height)
    return im.resize((w, H), Image.LANCZOS)

start, card = fit(start), fit(card)

pad, cap_h, head_h = 36, 34, 92
W = pad * 2 + start.width + pad + card.width
tot = pad + head_h + cap_h + H + pad
img = Image.new("RGB", (W, tot), "#F6F1FA")
d = ImageDraw.Draw(img)

d.text((pad, 24), "슈가 발레 카페 — 제목·공유주소 수정 배포 확인", font=f_h, fill="#4A3556")
d.text((pad, 62), "sheeny6-cmyk.github.io/magic-sugar-game/cafe/?v=20261120d   ·   is.gd/sugarcafe", font=f_s, fill="#7A6688")

y = pad + head_h
d.text((pad, y - 2), "① 시작 화면 제목 (배포본)", font=f_c, fill="#5B4470")
d.text((pad + start.width + pad, y - 2), "② 결과 공유 카드 (하단 주소 is.gd/sugarcafe)", font=f_c, fill="#5B4470")
y += cap_h

img.paste(start, (pad, y))
img.paste(card, (pad + start.width + pad, y))

for x, w in [(pad, start.width), (pad + start.width + pad, card.width)]:
    d.rectangle([x, y, x + w - 1, y + H - 1], outline="#D9C8E8", width=2)

out = D / "ballet-cafe-v2-title-fixed.png"
img.save(out)
print(out, img.size)
