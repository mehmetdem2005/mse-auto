#!/usr/bin/env bash
# Stop hook — STANDART KAPISI. Tur biterken:
#  1) biome (a11y/lint/format) + typecheck + test temiz olmalı (CI eşdeğeri).
#  2) origin/main'e göre GÜVENLİK-dokunuşu veya BÜYÜK diff incelenmemişse blokla
#     → /security-review·/code-review çalıştırılıp `echo <sig> > .claude/.reviewed` ile onaylanmalı.
# Makinece denetlenemeyenler (TOGAF P1–P9, ISO, Atomic) hatırlatıcı + footer disipliniyle.
set -u
dir="${CLAUDE_PROJECT_DIR:-.}"
cd "$dir" 2>/dev/null || exit 0
command -v pnpm >/dev/null 2>&1 || exit 0
[ -f biome.json ] || exit 0

# ---- 1) Kalite kapısı (biome + typecheck + test) ----
fail=""
run() {
  local name="$1"; shift
  local out
  out="$("$@" 2>&1)" || fail="${fail}\n── ${name} ──\n$(echo "$out" | grep -E '✖|error|FAIL|Error|✗' | head -12)"
}
run "biome (a11y/lint/format)" pnpm biome ci .
run "typecheck" pnpm turbo run typecheck --output-logs=errors-only
run "test" pnpm turbo run test --output-logs=errors-only
if [ -n "$fail" ]; then
  { echo "STANDART KAPISI: turu bitirmeden DÜZELT (CI eşdeğeri):"; printf '%b\n' "$fail"; } >&2
  exit 2
fi

# ---- 2) İnceleme kapısı (güvenlik / büyük diff) ----
if git rev-parse origin/main >/dev/null 2>&1; then
  changed="$(git diff origin/main --name-only -- apps packages supabase 2>/dev/null)"
  if [ -n "$changed" ]; then
    sig="$(git diff origin/main 2>/dev/null | sha1sum | cut -c1-12)"
    acked="$(cat .claude/.reviewed 2>/dev/null || true)"
    sec="$(echo "$changed" | grep -Ei 'migrations/|/auth/|payment|stripe|config/env|secret|rls|service.role|notifier/token|webhook' || true)"
    lines="$(git diff origin/main --shortstat 2>/dev/null | grep -oE '[0-9]+ (insertion|deletion)' | grep -oE '^[0-9]+' | awk '{s+=$1} END{print s+0}')"
    need=""
    [ -n "$sec" ] && need="güvenlik-dokunuşu → /security-review"
    [ "${lines:-0}" -ge 300 ] && need="${need:+$need · }büyük diff (${lines} satır) → /code-review veya /simplify"
    if [ -n "$need" ] && [ "$sig" != "$acked" ]; then
      {
        echo "STANDART KAPISI — İNCELEME GEREKLİ: $need"
        [ -n "$sec" ] && { echo "Kritik dosyalar:"; echo "$sec" | head -8; }
        echo "İlgili review skill'ini çalıştır; sonra onayla:  echo $sig > .claude/.reviewed"
      } >&2
      exit 2
    fi
  fi
fi
exit 0
