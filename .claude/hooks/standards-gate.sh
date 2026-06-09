#!/usr/bin/env bash
# Stop hook — STANDART KAPISI.
# Tur biterken kod lint/a11y/format temiz değilse turu bitirmeyi engeller (exit 2).
# Yalnız makinece denetlenebilir kısmı (biome: a11y + lint + format) zorlar;
# TOGAF/ISO/atomic gibi yargı gerektirenler UserPromptSubmit hatırlatıcısı + CLAUDE.md ile.
set -u
dir="${CLAUDE_PROJECT_DIR:-.}"
cd "$dir" 2>/dev/null || exit 0

# Araç yoksa engelleme (yanlış-pozitif kilit olmasın).
command -v pnpm >/dev/null 2>&1 || exit 0
[ -f biome.json ] || exit 0

out="$(pnpm biome ci . 2>&1)"
status=$?
if [ "$status" -ne 0 ]; then
  {
    echo "STANDART KAPISI: biome (a11y/lint/format) HATALI — turu bitirmeden DÜZELT."
    echo "$out" | grep -E "✖|lint/|format|error" | head -25
  } >&2
  exit 2   # exit 2 → Stop engellenir, stderr Claude'a verilir
fi
exit 0
