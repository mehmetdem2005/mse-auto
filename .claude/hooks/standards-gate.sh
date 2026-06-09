#!/usr/bin/env bash
# Stop hook — STANDART KAPISI (CI ile tam eşit, turu bitirmeden önce).
# biome (a11y/lint/format) + typecheck + test temiz değilse turu bitirmeyi engeller (exit 2).
# Makinece denetlenemeyenler (TOGAF P1–P9, ISO, Atomic, react-query) UserPromptSubmit
# hatırlatıcısı + CLAUDE.md + footer disipliniyle; otomatik kapı değil.
set -u
dir="${CLAUDE_PROJECT_DIR:-.}"
cd "$dir" 2>/dev/null || exit 0

# Araç yoksa engelleme (yanlış-pozitif kilit olmasın).
command -v pnpm >/dev/null 2>&1 || exit 0
[ -f biome.json ] || exit 0

fail=""
run() { # ad, komut...
  local name="$1"; shift
  local out
  out="$("$@" 2>&1)"
  if [ $? -ne 0 ]; then
    fail="${fail}\n── ${name} ──\n$(echo "$out" | grep -E "✖|error|FAIL|Error|✗" | head -12)"
  fi
}

run "biome (a11y/lint/format)" pnpm biome ci .
run "typecheck" pnpm turbo run typecheck --output-logs=errors-only
run "test" pnpm turbo run test --output-logs=errors-only

if [ -n "$fail" ]; then
  {
    echo "STANDART KAPISI: turu bitirmeden DÜZELT (CI eşdeğeri kapı):"
    printf '%b\n' "$fail"
  } >&2
  exit 2   # Stop engellenir; stderr Claude'a verilir
fi
exit 0
