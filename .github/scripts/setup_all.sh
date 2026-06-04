#!/bin/bash
# Full setup: Supabase + Render + GitHub Secrets
set -euo pipefail

log()  { echo "  $1"; }
die()  { echo "✗ $1" >&2; exit 1; }
json() { python3 -c "import sys,json; d=json.load(sys.stdin); $1"; }

REPO="${REPO:-mehmetdem2005/mse-auto}"

# ════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 1. SUPABASE ━━━"

# Organizations
ORGS_RAW=$(curl -sf "https://api.supabase.com/v1/organizations" \
  -H "Authorization: Bearer $SUPABASE_TOKEN") || die "Supabase API erişilemedi (token: ${SUPABASE_TOKEN:0:10}...)"
log "Orgs raw: $(echo "$ORGS_RAW" | head -c 120)"

ORG_ID=$(echo "$ORGS_RAW" | json "print(d[0]['id'] if d else '')" 2>/dev/null || echo "")
[ -z "$ORG_ID" ] && die "Supabase org bulunamadı — token geçerli mi? Response: $(echo "$ORGS_RAW" | head -c 200)"
log "Org: $ORG_ID"

# Find existing project
PROJECTS_RAW=$(curl -sf "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_TOKEN")
PROJECT_ID=$(echo "$PROJECTS_RAW" | python3 -c "
import sys,json
ps = json.load(sys.stdin)
p = next((x for x in (ps or []) if x.get('name') == 'mse-auto'), None)
print(p['id'] if p else '')
" 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
  log "Yeni proje oluşturuluyor..."
  DB_PASS=$(python3 -c "import secrets,string; a=string.ascii_letters+string.digits; print(''.join(secrets.choice(a) for _ in range(28)))")
  RESP=$(curl -sf -X POST "https://api.supabase.com/v1/projects" \
    -H "Authorization: Bearer $SUPABASE_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"mse-auto\",
      \"organization_id\": \"$ORG_ID\",
      \"plan\": \"free\",
      \"region\": \"eu-central-1\",
      \"db_pass\": \"$DB_PASS\"
    }") || die "Proje oluşturulamadı"
  PROJECT_ID=$(echo "$RESP" | json "print(d['id'])" 2>/dev/null || echo "")
  [ -z "$PROJECT_ID" ] && die "Proje ID alınamadı: $(echo "$RESP" | head -c 200)"
  log "Proje oluşturuldu: $PROJECT_ID"

  log "Proje hazırlanıyor (max 6dk)..."
  for i in $(seq 1 30); do
    sleep 12
    STATUS=$(curl -sf "https://api.supabase.com/v1/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $SUPABASE_TOKEN" | \
      json "print(d.get('status','?'))" 2>/dev/null || echo "unknown")
    log "[$i/30] $STATUS"
    [ "$STATUS" = "ACTIVE_HEALTHY" ] && { log "Proje hazır!"; break; }
  done
else
  log "Mevcut proje: $PROJECT_ID"
fi

PROJECT_URL="https://${PROJECT_ID}.supabase.co"
log "URL: $PROJECT_URL"

# Get API keys
KEYS_RAW=$(curl -sf "https://api.supabase.com/v1/projects/$PROJECT_ID/api-keys" \
  -H "Authorization: Bearer $SUPABASE_TOKEN")
ANON_KEY=$(echo "$KEYS_RAW" | python3 -c "
import sys,json
ks=json.load(sys.stdin)
print(next((k['api_key'] for k in (ks or []) if k.get('name')=='anon'), ''))
" 2>/dev/null || echo "")
SERVICE_KEY=$(echo "$KEYS_RAW" | python3 -c "
import sys,json
ks=json.load(sys.stdin)
print(next((k['api_key'] for k in (ks or []) if k.get('name')=='service_role'), ''))
" 2>/dev/null || echo "")

log "Anon key: ${ANON_KEY:0:20}..."
log "Service key: ${SERVICE_KEY:0:20}..."

# Run schema
log "Schema çalıştırılıyor..."
SCHEMA_JSON=$(python3 -c "import json; print(json.dumps(open('supabase/schema.sql').read()))")
SCHEMA_RESP=$(curl -s -X POST "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $SCHEMA_JSON}")
log "Schema response: $(echo "$SCHEMA_RESP" | head -c 150)"

# Set GitHub secrets via API (with PyNaCl-free encryption using gh CLI approach)
export GH_TOKEN="$GH_PAT"
printf '%s' "$PROJECT_URL" | gh secret set SUPABASE_URL             --repo "$REPO"
printf '%s' "$ANON_KEY"    | gh secret set SUPABASE_ANON_KEY        --repo "$REPO"
printf '%s' "$SERVICE_KEY" | gh secret set SUPABASE_SERVICE_ROLE_KEY --repo "$REPO"
log "Supabase secrets → GitHub OK"

# ════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 2. RENDER ━━━"

SERVICES_RAW=$(curl -sf "https://api.render.com/v1/services?limit=20" \
  -H "Authorization: Bearer $RENDER_KEY" || echo "[]")
SERVICE_ID=$(echo "$SERVICES_RAW" | python3 -c "
import sys,json
items = json.load(sys.stdin) or []
for item in items:
    if isinstance(item, dict) and item.get('service', {}).get('name') == 'mse-auto-api':
        print(item['service']['id'])
        break
" 2>/dev/null || echo "")

if [ -z "$SERVICE_ID" ]; then
  OWNERS_RAW=$(curl -sf "https://api.render.com/v1/owners?limit=1" \
    -H "Authorization: Bearer $RENDER_KEY")
  OWNER_ID=$(echo "$OWNERS_RAW" | json "print(d[0]['owner']['id'])" 2>/dev/null || echo "")
  [ -z "$OWNER_ID" ] && die "Render owner alınamadı: $(echo "$OWNERS_RAW" | head -c 200)"
  log "Owner: $OWNER_ID"

  SVC_RESP=$(curl -sf -X POST "https://api.render.com/v1/services" \
    -H "Authorization: Bearer $RENDER_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"web_service\",
      \"name\": \"mse-auto-api\",
      \"ownerId\": \"$OWNER_ID\",
      \"repo\": \"https://github.com/$REPO\",
      \"branch\": \"main\",
      \"rootDir\": \"api\",
      \"serviceDetails\": {
        \"buildCommand\": \"npm install\",
        \"startCommand\": \"npm start\",
        \"plan\": \"free\",
        \"runtime\": \"node\"
      }
    }") || die "Render servis oluşturulamadı"
  SERVICE_ID=$(echo "$SVC_RESP" | json "print(d['service']['id'])" 2>/dev/null || echo "")
  [ -z "$SERVICE_ID" ] && die "Render service ID alınamadı: $(echo "$SVC_RESP" | head -c 200)"
  log "Servis oluşturuldu: $SERVICE_ID"
else
  log "Servis bulundu: $SERVICE_ID"
fi

# Set env vars on Render
ENV_JSON=$(python3 - <<PYEOF
import json, os
pairs = [
    ("GEMINI_API_KEY",            os.environ.get("GEMINI_KEY", "")),
    ("GROQ_API_KEY",              os.environ.get("GROQ_KEY", "")),
    ("SUPABASE_URL",              "${PROJECT_URL}"),
    ("SUPABASE_SERVICE_ROLE_KEY", "${SERVICE_KEY}"),
    ("ALLOWED_ORIGIN",            "*"),
    ("NODE_ENV",                  "production"),
]
print(json.dumps([{"key": k, "value": v} for k, v in pairs if v]))
PYEOF
)

curl -sf -X PUT "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  -d "$ENV_JSON" > /dev/null
log "Env vars ayarlandı"

curl -sf -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' > /dev/null
log "Render deploy tetiklendi"

printf '%s' "$SERVICE_ID" | gh secret set RENDER_SERVICE_ID --repo "$REPO"

# ════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ KURULUM TAMAMLANDI ━━━"
echo "  Supabase: $PROJECT_URL"
echo "  Render:   https://mse-auto-api.onrender.com"
