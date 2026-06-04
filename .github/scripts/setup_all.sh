#!/bin/bash
# Full setup: Supabase + Render + GitHub Secrets (via gh CLI)
set -euo pipefail

log() { echo "  $1"; }
die() { echo "✗ $1" >&2; exit 1; }

jq_get() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); $2" 2>/dev/null || echo ""; }

REPO="${REPO:-mehmetdem2005/mse-auto}"

# ════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 1. SUPABASE ━━━"

# Organizations
ORGS=$(curl -sf "https://api.supabase.com/v1/organizations" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" || die "Supabase API erişilemedi")
ORG_ID=$(jq_get "$ORGS" "orgs=json.load(sys.stdin); print(orgs[0]['id'] if orgs else '')")
[ -z "$ORG_ID" ] && die "Supabase org bulunamadı — token geçerli mi?"
log "Org: $ORG_ID"

# Find existing project
PROJECTS=$(curl -sf "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer $SUPABASE_TOKEN")
PROJECT_ID=$(echo "$PROJECTS" | python3 -c "
import sys,json
ps = json.load(sys.stdin)
p = next((x for x in (ps or []) if x.get('name') == 'mse-auto'), None)
print(p['id'] if p else '')
" 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
  log "Yeni proje oluşturuluyor..."
  DB_PASS=$(openssl rand -base64 20 | tr -d '=/+' | head -c 28)
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
  PROJECT_ID=$(jq_get "$RESP" "print(json.load(sys.stdin)['id'])")
  log "Proje oluşturuldu: $PROJECT_ID"

  log "⏳ Proje hazırlanıyor (max 5dk)..."
  for i in $(seq 1 30); do
    sleep 12
    STATUS=$(curl -sf "https://api.supabase.com/v1/projects/$PROJECT_ID" \
      -H "Authorization: Bearer $SUPABASE_TOKEN" | \
      python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "unknown")
    log "[$i/30] $STATUS"
    [ "$STATUS" = "ACTIVE_HEALTHY" ] && { log "✓ Hazır!"; break; }
  done
else
  log "✓ Mevcut proje: $PROJECT_ID"
fi

PROJECT_URL="https://${PROJECT_ID}.supabase.co"
log "URL: $PROJECT_URL"

# Get keys
KEYS=$(curl -sf "https://api.supabase.com/v1/projects/$PROJECT_ID/api-keys" \
  -H "Authorization: Bearer $SUPABASE_TOKEN")
ANON_KEY=$(echo "$KEYS" | python3 -c "
import sys,json
ks=json.load(sys.stdin)
print(next((k['api_key'] for k in ks if k.get('name')=='anon'), ''))
" 2>/dev/null || echo "")
SERVICE_KEY=$(echo "$KEYS" | python3 -c "
import sys,json
ks=json.load(sys.stdin)
print(next((k['api_key'] for k in ks if k.get('name')=='service_role'), ''))
" 2>/dev/null || echo "")

log "Anon key: ${ANON_KEY:0:20}..."

# Run schema
log "📄 Schema çalıştırılıyor..."
SCHEMA=$(cat supabase/schema.sql)
SCHEMA_RESP=$(curl -s -X POST "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @- << SEOF
{"query": $(python3 -c "import json,sys; print(json.dumps(open('supabase/schema.sql').read()))")}
SEOF
)
log "Schema response: $(echo "$SCHEMA_RESP" | head -c 100)"

# Set GitHub secrets via gh CLI
export GH_TOKEN="$GH_PAT"
echo "$PROJECT_URL"  | gh secret set SUPABASE_URL              --repo "$REPO"
echo "$ANON_KEY"     | gh secret set SUPABASE_ANON_KEY          --repo "$REPO"
echo "$SERVICE_KEY"  | gh secret set SUPABASE_SERVICE_ROLE_KEY  --repo "$REPO"
log "✓ Supabase secrets → GitHub"

# ════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ 2. RENDER ━━━"

# Find existing service
SERVICES=$(curl -sf "https://api.render.com/v1/services?limit=20" \
  -H "Authorization: Bearer $RENDER_KEY" || echo "[]")
SERVICE_ID=$(echo "$SERVICES" | python3 -c "
import sys,json
items = json.load(sys.stdin) or []
for item in items:
    if isinstance(item, dict) and item.get('service', {}).get('name') == 'mse-auto-api':
        print(item['service']['id'])
        break
" 2>/dev/null || echo "")

if [ -z "$SERVICE_ID" ]; then
  OWNERS=$(curl -sf "https://api.render.com/v1/owners?limit=1" \
    -H "Authorization: Bearer $RENDER_KEY")
  OWNER_ID=$(jq_get "$OWNERS" "print(json.load(sys.stdin)[0]['owner']['id'])")
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
  SERVICE_ID=$(jq_get "$SVC_RESP" "print(json.load(sys.stdin)['service']['id'])")
  log "✓ Servis oluşturuldu: $SERVICE_ID"
else
  log "✓ Servis bulundu: $SERVICE_ID"
fi

# Set env vars
ENV_JSON=$(python3 - << PYEOF
import json, os
pairs = [
    ("GEMINI_API_KEY",            os.environ.get("GEMINI_KEY", "")),
    ("GROQ_API_KEY",              os.environ.get("GROQ_KEY", "")),
    ("SUPABASE_URL",              os.environ.get("PROJECT_URL", "")),
    ("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SERVICE_KEY_VAL", "")),
    ("ALLOWED_ORIGIN",            "*"),
    ("NODE_ENV",                  "production"),
]
print(json.dumps([{"key": k, "value": v} for k, v in pairs if v]))
PYEOF
)

export PROJECT_URL SERVICE_KEY_VAL="$SERVICE_KEY"
curl -sf -X PUT "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  -d "$ENV_JSON" > /dev/null
log "✓ Env vars ayarlandı"

# Trigger deploy
curl -sf -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' > /dev/null
log "✓ Render deploy tetiklendi"

echo "$SERVICE_ID" | gh secret set RENDER_SERVICE_ID --repo "$REPO"

# ════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ ✅ KURULUM TAMAMLANDI ━━━"
echo "  Supabase: $PROJECT_URL"
echo "  Render:   https://mse-auto-api.onrender.com (~3dk)"
echo "  Frontend: Vercel deploy tetikleniyor..."
