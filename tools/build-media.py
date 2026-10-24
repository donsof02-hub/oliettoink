# -*- coding: utf-8 -*-
"""
Prepara le foto per PORTFOLIO e FLASH.

    python tools/build-media.py

Cosa fa:
  1. legge gli originali da
         foto portfolio non compresse/
         foto sketch pronti non compressi/
  2. per ogni foto prende la DATA DI SCATTO dagli EXIF (non la data del file, che
     cambia ogni volta che la foto viene copiata o mandata su WhatsApp);
  3. raggruppa il portfolio: stessa data = stessa sessione = una sola anteprima
     che, cliccata, apre il carosello con tutte le foto di quel giorno;
  4. le foto SENZA EXIF (tipicamente screenshot PNG o file ri-esportati) non
     vengono datate a caso: restano singole, una anteprima ciascuna, in fondo
     alla griglia e senza etichetta di data;
  5. genera miniature (600px) e versioni web (1600px) e TOGLIE gli EXIF dai file
     pubblicati: le foto da telefono contengono spesso le coordinate GPS di dove
     sono state scattate, cioe' lo studio o casa;
  6. scrive data/portfolio.json e data/flash.json.

Rilancialo ogni volta che aggiungi foto: rifa' solo quello che manca.
Per i file .HEIC serve:  pip install pillow-heif
"""
import json
import pathlib
import re
from collections import defaultdict
from datetime import datetime

from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIC = True
except ImportError:
    HEIC = False

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

SORGENTI = {
    "portfolio": ROOT / "foto portfolio non compresse",
    "flash": ROOT / "foto sketch pronti non compressi",
}

ESTENSIONI = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
THUMB_PX, WEB_PX = 600, 1600
Q_THUMB, Q_WEB = 78, 84

EXIF_TAG = (36867, 36868, 306)     # DateTimeOriginal, DateTimeDigitized, DateTime

MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
        "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]


def data_scatto(img):
    """Data di scatto dagli EXIF, oppure None se la foto non la porta con se'."""
    try:
        exif = img.getexif()
    except Exception:
        return None
    for tag in EXIF_TAG:
        raw = exif.get(tag)
        if not raw:
            try:
                raw = exif.get_ifd(0x8769).get(tag)
            except Exception:
                raw = None
        if raw:
            testo = str(raw).strip().strip("\x00")
            for formato in ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
                try:
                    return datetime.strptime(testo, formato)
                except ValueError:
                    pass
    return None


def numero(nome):
    """Il numero progressivo nel nome file: IMG_4605.HEIC -> 4605."""
    m = re.search(r"(\d{3,})", nome)
    return int(m.group(1)) if m else None


def salva(img, dove, lato, qualita):
    if dove.exists():
        return
    copia = ImageOps.exif_transpose(img)          # raddrizza secondo l'EXIF
    copia.thumbnail((lato, lato), Image.LANCZOS)
    if copia.mode != "RGB":
        copia = copia.convert("RGB")
    dove.parent.mkdir(parents=True, exist_ok=True)
    # salvataggio senza EXIF: via anche le coordinate GPS
    copia.save(dove, "JPEG", quality=qualita, optimize=True, progressive=True)


def leggi(sorgente, uscita):
    if not sorgente.exists():
        sorgente.mkdir(parents=True, exist_ok=True)
        return [], 0

    file = sorted(p for p in sorgente.iterdir()
                  if p.is_file() and p.suffix.lower() in ESTENSIONI)
    heic_saltate = 0
    foto = []

    for percorso in file:
        if percorso.suffix.lower() in (".heic", ".heif") and not HEIC:
            heic_saltate += 1
            continue
        try:
            with Image.open(percorso) as img:
                scattata = data_scatto(img)
                w, h = ImageOps.exif_transpose(img).size
                nome = re.sub(r"\.(jpg|jpeg|png|heic|heif|webp)$", "", percorso.stem, flags=re.I) + ".jpg"
                thumb, web = uscita / "thumb" / nome, uscita / "web" / nome
                salva(img, thumb, THUMB_PX, Q_THUMB)
                salva(img, web, WEB_PX, Q_WEB)

            foto.append({
                "file": percorso.name,
                "n": numero(percorso.name),
                "thumb": thumb.relative_to(ROOT).as_posix(),
                "web": web.relative_to(ROOT).as_posix(),
                "w": w, "h": h,
                "scattata": scattata,
            })
        except Exception as errore:
            print("  ! saltata %s (%s)" % (percorso.name, errore))

    return foto, heic_saltate


def etichetta(d):
    return "%d %s %d" % (d.day, MESI[d.month - 1], d.year)


def raggruppa(foto):
    """Sessioni: per data di scatto; per i file senza EXIF, per numero vicino."""
    datate = [f for f in foto if f["scattata"]]
    orfane = [f for f in foto if not f["scattata"]]

    sessioni = []
    per_data = defaultdict(list)
    for f in datate:
        per_data[f["scattata"].strftime("%Y-%m-%d")].append(f)

    for iso in sorted(per_data, reverse=True):
        scatti = sorted(per_data[iso], key=lambda f: f["scattata"])
        sessioni.append({
            "id": iso,
            "data": iso,
            "etichetta": etichetta(datetime.strptime(iso, "%Y-%m-%d")),
            "quante": len(scatti),
            "foto": [{k: f[k] for k in ("thumb", "web", "w", "h")} for f in scatti],
        })

    # senza data: una per una. Niente raggruppamenti a indovinare e niente
    # date inventate: ogni foto resta un'anteprima a se'.
    orfane.sort(key=lambda f: (f["n"] is None, f["n"] or 0, f["file"]))
    for i, f in enumerate(orfane):
        sessioni.append({
            "id": "s%d" % (i + 1),
            "data": None,
            "etichetta": None,
            "quante": 1,
            "foto": [{k: f[k] for k in ("thumb", "web", "w", "h")}],
        })

    return sessioni, len(datate), len(orfane)


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    heic_totali = 0

    # ───────── PORTFOLIO ─────────
    foto, heic = leggi(SORGENTI["portfolio"], ROOT / "media" / "portfolio")
    heic_totali += heic
    sessioni, n_datate, n_orfane = raggruppa(foto)

    (DATA / "portfolio.json").write_text(json.dumps({
        "generato": datetime.now().isoformat(timespec="seconds"),
        "sessioni": sessioni}, indent=1, ensure_ascii=False), encoding="utf-8")

    print("PORTFOLIO : %d foto -> %d sessioni  (%d con data EXIF, %d senza)"
          % (len(foto), len(sessioni), n_datate, n_orfane))
    for s in sessioni:
        print("   %-22s %2d foto" % (s["etichetta"] or "(senza data)", s["quante"]))

    # ───────── FLASH ─────────
    flash, heic = leggi(SORGENTI["flash"], ROOT / "media" / "flash")
    heic_totali += heic
    flash.sort(key=lambda f: (f["scattata"] or datetime.min), reverse=True)

    (DATA / "flash.json").write_text(json.dumps({
        "generato": datetime.now().isoformat(timespec="seconds"),
        "disegni": [{k: f[k] for k in ("thumb", "web", "w", "h")} for f in flash]},
        indent=1, ensure_ascii=False), encoding="utf-8")
    print("FLASH     : %d disegni" % len(flash))

    if heic_totali:
        print("\n%d file .HEIC saltati:  pip install pillow-heif" % heic_totali)


if __name__ == "__main__":
    main()
