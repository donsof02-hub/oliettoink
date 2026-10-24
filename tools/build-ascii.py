# -*- coding: utf-8 -*-
"""
Trasforma il logo in arte ASCII, da usare come elemento grafico del sito.

    python tools/build-ascii.py

Legge logo-mark.png (tratto bianco su fondo trasparente) e scrive data/ascii.json
con la stessa geco resa a caratteri in tre misure. I caratteri dei glifi sono
scelti fra quelli "spigolosi" invece della solita rampa di densita': su uno sfondo
nero con font monospazio danno un effetto sigillo, non una fotografia sgranata.

Un carattere e' alto circa il doppio di quanto e' largo: per non schiacciare il
disegno le righe campionate valgono il doppio delle colonne (CHAR_ASPECT).
"""
import json
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "logo-mark.png"
OUT = ROOT / "data" / "ascii.json"

CHAR_ASPECT = 2.05           # altezza/larghezza di una cella monospazio
RAMP = " .:-=+*#%@"          # dal vuoto al pieno
GLYPH_RAMP = " .'^\"~+*xX#$@" # variante piu' spigolosa, usata per le misure grandi

SIZES = {"sm": 24, "md": 38, "lg": 60}   # larghezza in colonne


def render(img, cols, ramp):
    w, h = img.size
    rows = max(1, int(round(cols * (h / w) / CHAR_ASPECT)))
    small = img.resize((cols, rows), Image.LANCZOS)
    alpha = small.split()[-1]

    last = len(ramp) - 1
    lines = []
    for y in range(rows):
        line = "".join(ramp[round(alpha.getpixel((x, y)) / 255 * last)]
                       for x in range(cols))
        lines.append(line.rstrip())
    # via le righe vuote in cima e in fondo
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return lines


def main():
    if not SRC.exists():
        raise SystemExit("Manca %s" % SRC)

    img = Image.open(SRC).convert("RGBA")
    data = {}
    for name, cols in SIZES.items():
        ramp = GLYPH_RAMP if cols >= 38 else RAMP
        lines = render(img, cols, ramp)
        data[name] = lines
        print("%-3s %2d colonne x %2d righe" % (name, cols, len(lines)))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    print("scritto", OUT.relative_to(ROOT))

    print("\nanteprima (md):\n")
    print("\n".join(data["md"]))


if __name__ == "__main__":
    main()
