#!/usr/bin/env python3
"""Full setup: Supabase + Render + GitHub Secrets"""
import urllib.request, urllib.error, json, base64, os, time, sys, secrets as sec_mod
from nacl import encoding, public as nacl_public

SB_TOKEN   = os.environ["SUPABASE_TOKEN"]
RENDER_KEY = os.environ["RENDER_KEY"]
GEMINI_KEY = os.environ.get("GEMINI_KEY", "")
GROQ_KEY   = os.environ.get("GROQ_KEY", "")
GH_PAT     = os.environ["GH_PAT"]
REPO       = os.environ.get("REPO", "mehmetdem2005/mse-auto")


def call(method, url, data=None, headers=None):
    if headers is None:
        headers = {}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return (json.loads(raw) if raw else {}), r.status
    except urllib.error.HTTPError as e:
        txt = e.read().decode(errors="replace")
        print(f"  HTTP {e.code} — {url}\n    {txt[:300]}", flush=True)
        return None, e.code


def sb(method, path, data=None):
    return call(method, f"https://api.supabase.com/v1{path}", data,
                {"Authorization": f"Bearer {SB_TOKEN}"})


def gh(method, path, data=None):
    return call(method, f"https://api.github.com{path}", data, {
        "Authorization": f"Bearer {GH_PAT}",
        "Accept": "application/vnd.github.v3+json",
    })


def render(method, path, data=None):
    return call(method, f"https://api.render.com/v1{path}", data,
                {"Authorization": f"Bearer {RENDER_KEY}"})


# ── GitHub secret helper ─────────────────────────────────────────────────
pk_data, _ = gh("GET", f"/repos/{REPO}/actions/secrets/public-key")
PK_B64 = pk_data["key"]
PK_ID  = pk_data["key_id"]


def gh_secret(name, value):
    if not value:
        return
    pub = nacl_public.PublicKey(PK_B64.encode("utf-8"), encoding.Base64Encoder())
    enc = base64.b64encode(nacl_public.SealedBox(pub).encrypt(value.encode("utf-8"))).decode()
    gh("PUT", f"/repos/{REPO}/actions/secrets/{name}",
       {"encrypted_value": enc, "key_id": PK_ID})
    print(f"  ✓ GitHub secret: {name}", flush=True)


# ════════════════════════════════════════════════════════════════════════
print("\n━━━ 1. SUPABASE ━━━", flush=True)

orgs, _ = sb("GET", "/organizations")
if not orgs:
    print("  ✗ Supabase org alınamadı — token geçerli mi?", flush=True)
    sys.exit(1)

org_id = orgs[0]["id"]
print(f"  Org ID: {org_id}", flush=True)

# Check for existing project
projects, _ = sb("GET", "/projects")
project = next((p for p in (projects or []) if p.get("name") == "mse-auto"), None)

if project:
    project_id = project["id"]
    print(f"  ✓ Mevcut proje: {project_id}", flush=True)
else:
    db_pass = sec_mod.token_urlsafe(20)
    result, status = sb("POST", "/projects", {
        "name": "mse-auto",
        "organization_id": org_id,
        "plan": "free",
        "region": "eu-central-1",
        "db_pass": db_pass,
    })
    if not result or "id" not in result:
        print(f"  ✗ Proje oluşturulamadı (status {status}): {result}", flush=True)
        sys.exit(1)
    project_id = result["id"]
    print(f"  ✓ Proje oluşturuldu: {project_id}", flush=True)

    print("  ⏳ Proje hazırlanıyor (max 5dk)...", flush=True)
    for i in range(30):
        time.sleep(10)
        p, _ = sb("GET", f"/projects/{project_id}")
        status_str = (p or {}).get("status", "unknown")
        print(f"    [{i+1}/30] {status_str}", flush=True)
        if status_str == "ACTIVE_HEALTHY":
            print("  ✓ Proje hazır!", flush=True)
            break

project_url = f"https://{project_id}.supabase.co"
print(f"  URL: {project_url}", flush=True)

# Get API keys
keys, _ = sb("GET", f"/projects/{project_id}/api-keys")
anon_key    = next((k["api_key"] for k in (keys or []) if k.get("name") == "anon"), "")
service_key = next((k["api_key"] for k in (keys or []) if k.get("name") == "service_role"), "")
print(f"  ✓ Anon key: {anon_key[:24]}...", flush=True)

# Run schema via SQL endpoint
print("  📄 Schema yükleniyor...", flush=True)
with open("supabase/schema.sql", encoding="utf-8") as f:
    sql = f.read()

result, status = sb("POST", f"/projects/{project_id}/database/query", {"query": sql})
if status in (200, 201):
    print("  ✓ Schema uygulandı", flush=True)
else:
    print(f"  ⚠  Schema SQL Editor'dan çalıştırın (status {status})", flush=True)

# Save to GitHub secrets
gh_secret("SUPABASE_URL",               project_url)
gh_secret("SUPABASE_ANON_KEY",          anon_key)
gh_secret("SUPABASE_SERVICE_ROLE_KEY",  service_key)

# ════════════════════════════════════════════════════════════════════════
print("\n━━━ 2. RENDER ━━━", flush=True)

services, _ = render("GET", "/services?limit=20")
service_id = ""
for item in (services or []):
    if isinstance(item, dict):
        svc = item.get("service", {})
        if svc.get("name") == "mse-auto-api":
            service_id = svc.get("id", "")
            break

if not service_id:
    owners, _ = render("GET", "/owners?limit=1")
    owner_id = (owners or [{}])[0].get("owner", {}).get("id", "")
    print(f"  Owner: {owner_id}", flush=True)

    result, status = render("POST", "/services", {
        "type": "web_service",
        "name": "mse-auto-api",
        "ownerId": owner_id,
        "repo": f"https://github.com/{REPO}",
        "branch": "main",
        "rootDir": "api",
        "serviceDetails": {
            "buildCommand": "npm install",
            "startCommand": "npm start",
            "plan": "free",
            "runtime": "node",
        },
    })
    if not result or "service" not in result:
        print(f"  ✗ Render servis oluşturulamadı: {result}", flush=True)
    else:
        service_id = result["service"]["id"]
        print(f"  ✓ Servis oluşturuldu: {service_id}", flush=True)
else:
    print(f"  ✓ Servis bulundu: {service_id}", flush=True)

if service_id:
    env_vars = [
        {"key": "GEMINI_API_KEY",            "value": GEMINI_KEY},
        {"key": "GROQ_API_KEY",              "value": GROQ_KEY},
        {"key": "SUPABASE_URL",              "value": project_url},
        {"key": "SUPABASE_SERVICE_ROLE_KEY", "value": service_key},
        {"key": "ALLOWED_ORIGIN",            "value": "*"},
        {"key": "NODE_ENV",                  "value": "production"},
    ]
    render("PUT", f"/services/{service_id}/env-vars",
           [e for e in env_vars if e["value"]])
    print("  ✓ Env vars ayarlandı", flush=True)

    render("POST", f"/services/{service_id}/deploys", {})
    print("  ✓ Render deploy tetiklendi", flush=True)
    gh_secret("RENDER_SERVICE_ID", service_id)

# ════════════════════════════════════════════════════════════════════════
print("\n━━━ ÖZET ━━━", flush=True)
print(f"  Supabase: {project_url}", flush=True)
print(f"  Render:   https://mse-auto-api.onrender.com (yaklaşık 3dk'da hazır)", flush=True)
print(f"  GitHub Secrets güncellendi.", flush=True)
print("\n✅ Kurulum tamamlandı!", flush=True)
