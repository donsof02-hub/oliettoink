#!/usr/bin/env bash
# Comprime il video di sfondo della home e ne estrae il fotogramma di anteprima.
#
#   bash tools/build-video.sh
#
# Il video sta sullo sfondo, sfocato e al 70% di opacita': non serve la qualita'
# dell'originale. Scendere a 540x960 e 30 fps taglia il peso di circa l'85% senza
# che si veda la differenza, e su rete mobile e' la differenza fra partire subito
# e non partire. L'originale non viene toccato.

set -euo pipefail
cd "$(dirname "$0")/.."

SRC="backgroundhomepage.MP4"
OUT_DIR="media"
mkdir -p "$OUT_DIR"

[ -f "$SRC" ] || { echo "Manca $SRC"; exit 1; }

echo "[1/2] codifica $OUT_DIR/bg.mp4 ..."
ffmpeg -v error -stats -y -i "$SRC" \
  -an \
  -vf "scale=540:-2:flags=lanczos,fps=30" \
  -c:v libx264 -profile:v high -preset slow -crf 30 \
  -pix_fmt yuv420p -movflags +faststart \
  "$OUT_DIR/bg.mp4"

echo "[2/2] fotogramma di anteprima $OUT_DIR/bg-poster.jpg ..."
ffmpeg -v error -y -ss 1 -i "$SRC" -frames:v 1 \
  -vf "scale=540:-2:flags=lanczos" -q:v 6 \
  "$OUT_DIR/bg-poster.jpg"

echo
echo "originale : $(du -h "$SRC"            | cut -f1)"
echo "compresso : $(du -h "$OUT_DIR/bg.mp4" | cut -f1)"
echo "anteprima : $(du -h "$OUT_DIR/bg-poster.jpg" | cut -f1)"
