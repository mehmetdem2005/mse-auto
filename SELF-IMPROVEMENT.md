# SELF-IMPROVEMENT — güvenli kendi-kendini-iyileştirme modeli (dürüst)  [v0.7]

Bu katman, sistemin **kendi kaynak kodunu GitHub üzerinden değiştirebilmesini**, **geniş sinyalleri
izleyip inisiyatif almasını**, **belleğini onarmasını** ve **rate-limit'te durmayıp aynı istekten
devam etmesini** sağlar — hepsi güvenlik korkulukları içinde. Araştırmaya dayanır (DGM/SICA;
2026 endüstri & Google PR pratiği; OTel; LangGraph checkpoint).

## 1) Kendi kodunu değiştirme — NASIL (güvenli yol)
- Ajan **doğrudan `main`'e push yapmaz**. Yeni dalda **PR açar** (`github.ts` → `openChangePR`).
- **CI (.github/workflows/ci.yml: typecheck+test+build) ZORUNLU KAPIDIR** — ajan atlayamaz.
  (2026 pratiği: "çift kapı" — ajan kendi testini koşar, CI bağımsız tekrar koşar; agent PR'ları
  insan koduyla **aynı branch protection / required status checks**'ten geçer.)
- **Otomatik-merge yalnızca**: `SELF_IMPROVE_AUTOMERGE=on` **VE** risk=`low` **VE** CI=yeşil.
  Aksi halde PR **insan onayı** bekler. (`selfimprove.classifyRisk` saf fonksiyon + birim-testli.)
- **Risk sınıflandırma:** infra/güvenlik/para/kendi-makinesi dosyaları (`youtube`, `.github/workflows`,
  `supabase/migrations`, `Dockerfile`, `render.yaml`, `middleware`, `github.ts`, `selfimprove.ts`,
  `env.ts`, `budget.ts`, `control.ts`, `package*.json`) → **high (asla otomatik)**. Düşük-blast dosyalar
  (docs, data/knowledge, compliance/agents/scriptwriter prompts, README/AGENT*/RESEARCH) → **low**.
- **Geri alma (rollback):** her değişiklik normal PR → **revert PR**. `main` korumalı; bot'un status
  check atlaması gerekiyorsa **GitHub Rulesets** kullan (klasik branch protection bot kimliğinde çalışmaz).
- **Kapsam (turn-1 varsayılanı):** otonom döngü, top fırsatı `docs/IMPROVEMENT-LOG.md` gibi **güvenli,
  düşük-riskli** bir dosyaya işleyen gerçek bir PR açar. Kod dosyalarına yönlendirme **opt-in/insan**
  kararıyla yapılır (proposeChange + fetched file context mekanizması hazır).

## 2) Geniş sorun algılama (sadece error değil)
`monitor.ts`: kuyruk derinliği, dead-letter, needs-review, **video etkileşimi** (analytics) ve **gerçek
yorum analizi** (`fetchCommentThreads` + Gemini → olgusal hata iddiası / şikâyet / duygu). Sinyaller
**sıralı fırsatlara** dönüşür (`findOpportunities` + saf `scoreOpportunity`/`rankOpportunities`),
`opportunities` tablosuna yazılır ve UI'da gösterilir. **İnisiyatif:** sorun olmasa da iyileştirme önerir.

## 3) Self-healing + bellek onarımı
`supervisor.superviseOnce()` her `AUTONOMY_EVERY_TICKS` tick'te: sinyalleri toplar, **bellek sağlığını**
denetler (`memoryHealth`: embedding'siz bilgi satırları vb.) ve **otomatik onarır** (`repairMemory`:
eksik embedding'leri yeniden üretir), dinamik panelleri (signals/opportunities) yazar.

## 4) Rate-limit'te durmama — "bekle ve aynı istekten devam"
`reliability.rateLimitWaitMs` (Retry-After → resumeAt → varsayılan `RATELIMIT_RESUME_DELAY_MS`).
Runner: rate-limit hatasında işi **dead-letter'a düşürmez ve deneme hakkı harcamaz**; `next_run_at`'i
ileri alıp **aynı stage/istekten devam** ettirir (`rate_limited_resume` olayı). Yani sıra dolduğunda
bekler, açılınca kaldığı yerden sürer.

## 5) Asla durmama
Worker `loop`/`serve` modu sürekli çalışır; her tick budget + kill switch kontrolü yapar. **Kill switch
güvenlik için kalır** ("asla kapanmasın" isteğine rağmen) — felç durumunda durdurabilmek şarttır.

## 6) Dürüst sınırlar (önemli)
- **"1 yıl boş bırak, kendini ne kadar geliştirir":** hata düzeltir, ayar/prompt/bilgi günceller, küçük
  özellik önerir, analizden öğrenir — ama **kalite tavanı modeldir**; kendiliğinden niteliksel olarak
  akıllanmaz (DGM bile her değişikliği benchmark'la doğrular; net-fayda kanıtlanamaz).
- **Birleştirilen PR'ları ara ara insan gözden geçirmeli.** Gözetimsiz kendi-kodunu-yeniden-yazan bir
  döngü güvenli değildir; bu yüzden kod dosyası düzenlemesi opt-in + PR + CI + insan kapısı arkasındadır.
- **Canlı GitHub/YouTube çağrıları bu repoda çalıştırılmadı**; istemciler doğrulanmış API şekline göre
  yazıldı ve **mock ile birim-test edildi** (30/30). Gemini araç-döngüsü sahte modelle test edildi.

## Yapılandırma
`GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BASE_BRANCH` (main), `SELF_IMPROVE_ENABLED` (off),
`SELF_IMPROVE_AUTOMERGE` (off), `MONITOR_ENABLED` (on), `AUTONOMY_EVERY_TICKS` (20),
`RATELIMIT_RESUME_DELAY_MS` (120000). Token izni: `repo` (PR + contents + checks).

---

## v0.9 eklentileri
- **Cerrahi kod self-edit** (`SELF_IMPROVE_CODE=on`): modül fırsatlarında TÜM dosya yerine **find/replace**
  PR'ı (belirsiz/bulunamadıysa **reddedilir**, kör yazma yok). Risk sınıflandırma + CI kapısı aynen geçerli.
- **Prompt auto-iyileştirme** (`PROMPTLAB_ENABLED=on`): GEPA döngüsü — yargıç (skor+ASI) → reflektör →
  doğrula → iyiyse `prompts` tablosuna kaydet. (Ajanlara otomatik takma sıradaki adım.)
- **Anomali otonomisi** (`ANOMALY_AUTONOMY=on`): tipli güvenli aksiyon uzayı; yüksek-risk asla otomatik.
- **OTel exporter / merge-queue+canary / A2A**: gözlemlenebilirlik, güvenli birleştirme, ajanlar-arası yüzey.
