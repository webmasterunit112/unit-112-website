#!/usr/bin/env python3
"""Make the default favicon set and the link-preview image into public/.
   python3 tools/make_icons.py   (re-run after changing COLORS or TEXT)"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public"
BLUE, GREEN, WHITE, RED, MIST = "#1C4966", "#2F6B4F", "#FFFFFF", "#E0685F", "#F3F7F6"
SERIF_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def badge(size):
    s = size * 4  # draw large, shrink for smooth edges
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.2), fill=BLUE)
    d.rectangle([0, int(s * 0.84), s, s], fill=GREEN)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.2), outline=None)
    # re-round the bottom corners after the green band
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.2), fill=255)
    im.putalpha(mask)
    f = ImageFont.truetype(SERIF_B, int(s * 0.44))
    d = ImageDraw.Draw(im)
    d.text((s / 2, s * 0.44), "112", font=f, fill=WHITE, anchor="mm")
    return im.resize((size, size), Image.LANCZOS)

OUT.mkdir(exist_ok=True)
badge(180).save(OUT / "apple-touch-icon.png")
badge(192).save(OUT / "icon-192.png")
badge(512).save(OUT / "icon-512.png")
big = badge(256)
big.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

(OUT / "favicon.svg").write_text(f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><clipPath id="r"><rect width="64" height="64" rx="13"/></clipPath></defs>
<g clip-path="url(#r)"><rect width="64" height="64" fill="{BLUE}"/><rect y="54" width="64" height="10" fill="{GREEN}"/></g>
<text x="32" y="36" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'DejaVu Serif', serif" font-weight="700" font-size="28" fill="{WHITE}">112</text>
</svg>
""")

# Link-preview image (shown when the site link is shared by email, text or Facebook)
W, H = 1200, 630
im = Image.new("RGB", (W, H), BLUE)
d = ImageDraw.Draw(im)
d.rectangle([0, H - 70, W, H], fill=GREEN)
d.rounded_rectangle([84, 144, 316, 376], radius=48, fill=WHITE)
b = badge(220)
im.paste(b, (90, 150), b)
d.text((360, 190), "ACBL Unit 112", font=ImageFont.truetype(SERIF_B, 92), fill=WHITE)
d.text((364, 310), "Duplicate bridge across Central", font=ImageFont.truetype(SANS, 40), fill="#DCE8EE")
d.text((364, 362), "& Western New York", font=ImageFont.truetype(SANS, 40), fill="#DCE8EE")
sf = ImageFont.truetype(SANS_B, 44)
x = 364
for ch, col in (("♠", WHITE), ("♥", RED), ("♦", RED), ("♣", WHITE)):
    d.text((x, 440), ch, font=sf, fill=col); x += 64
d.text((90, H - 50), "Tournaments · Results · Clubs · New players", font=ImageFont.truetype(SANS_B, 30), fill=WHITE)
im.save(OUT / "og-image.png", optimize=True)

(OUT / "site.webmanifest").write_text("""{
  "name": "ACBL Unit 112",
  "short_name": "Unit 112",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#1C4966",
  "background_color": "#F3F7F6",
  "display": "browser",
  "start_url": "/"
}
""")
print("icons written to", OUT)
