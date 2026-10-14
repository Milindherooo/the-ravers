"""Frame metrics from docs/agents/ART-DIRECTION.md §7, so every role measures alike.

    python scripts/metrics.py review/<role>/*.png            # one row per still
    python scripts/metrics.py --json review/<role>/*.png     # machine-readable
    python scripts/metrics.py --diff a.png b.png             # mean |a-b| in 1/255 units

Stills are downscaled x4; luma is Rec.709 weights on sRGB values in [0,1].
redTint: hue 340-20deg, S>=.25, V>=.06. accentCore: hue 345-15deg, S>=.45, V>=.2.
dark: luma<.06. bright: luma>.75 (brightSD = luma SD of those pixels).
clip: any channel >=250 (measured at full size). medSat: median HSV saturation.
"""
import json, sys
import numpy as np
from PIL import Image


def load(path, scale=4):
    im = Image.open(path).convert('RGB')
    full = np.asarray(im, dtype=np.uint8)
    small = im.resize((max(1, im.width // scale), max(1, im.height // scale)), Image.BOX)
    return full, np.asarray(small, dtype=np.float32) / 255.0


def metrics(path):
    full, rgb = load(path)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    luma = .2126 * r + .7152 * g + .0722 * b
    mx, mn = rgb.max(-1), rgb.min(-1)
    v, s = mx, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    red = ((h >= 340) | (h <= 20)) & (s >= .25) & (v >= .06)
    core = ((h >= 345) | (h <= 15)) & (s >= .45) & (v >= .2)
    bright = luma > .75
    return {
        'file': path,
        'meanLuma': round(float(luma.mean()), 3),
        'dark%': round(float((luma < .06).mean() * 100), 1),
        'bright%': round(float(bright.mean() * 100), 1),
        'brightSD': round(float(luma[bright].std()) if bright.any() else 0.0, 3),
        'redTint%': round(float(red.mean() * 100), 1),
        'accentCore%': round(float(core.mean() * 100), 2),
        'clip%': round(float((full >= 250).any(-1).mean() * 100), 2),
        'darkest1%': round(float(np.percentile(luma, 1)), 3),
        'medSat': round(float(np.median(s)), 3),
    }


def main(argv):
    if argv[:1] == ['--diff']:
        a, b = (np.asarray(Image.open(p).convert('RGB'), dtype=np.float32) for p in argv[1:3])
        print(round(float(np.abs(a - b).mean()), 3))
        return
    as_json = argv[:1] == ['--json']
    rows = [metrics(p) for p in (argv[1:] if as_json else argv)]
    if as_json:
        print(json.dumps(rows, indent=1))
        return
    keys = [k for k in rows[0] if k != 'file'] if rows else []
    print('file'.ljust(34) + ''.join(k.rjust(12) for k in keys))
    for row in rows:
        print(row['file'].split('/')[-1][:33].ljust(34) + ''.join(str(row[k]).rjust(12) for k in keys))


if __name__ == '__main__':
    main(sys.argv[1:])
