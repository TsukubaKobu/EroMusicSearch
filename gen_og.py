from PIL import Image, ImageDraw, ImageFont
import os

img = Image.new('RGB', (1200, 630), color='#0a0a0a')
draw = ImageDraw.Draw(img)

font_big = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 72)
font_sub = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 36)
font_tag = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 24)
font_small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 28)

draw.rectangle([0, 0, 1200, 6], fill='#ff6b9d')
draw.rectangle([0, 624, 1200, 630], fill='#ff6b9d')
draw.rectangle([60, 180, 66, 450], fill='#ff6b9d')

for x in range(0, 1200, 40):
    for y in range(0, 630, 40):
        draw.point((x, y), fill='#1a1a2e')

draw.text((100, 180), 'Anime & Game Music Search', fill='#888888', font=font_sub)
draw.text((100, 230), 'EroMusicSearch', fill='#ffffff', font=font_big)
draw.text((100, 330), 'ErogameScape  /  Bangumi  /  Anison.info', fill='#aaaaaa', font=font_tag)

features = [
    'Bidirectional search: Work -> Music & Music -> Work',
    'Japanese fuzzy search (Hiragana <-> Katakana)',
    'Three databases in one app',
]
y = 400
for feat in features:
    draw.text((100, y), feat, fill='#666666', font=font_small)
    y += 40

for i, (note, color) in enumerate([('♪', '#ff6b9d'), ('♫', '#6baaff'), ('♬', '#6bffb8')]):
    nf = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 60)
    draw.text((900 + i * 80, 480), note, fill=color, font=nf)

draw.rounded_rectangle([100, 480, 220, 520], radius=12, fill='#ff6b9d')
draw.text((115, 488), 'v1.4.0', fill='#ffffff', font=font_tag)
draw.text((820, 570), 'tsukubakobu.github.io/EroMusicSearch', fill='#444444', font=font_tag)

img.save('og-image.png', 'PNG')
print(f'OG image created: {os.path.getsize("og-image.png")} bytes')
