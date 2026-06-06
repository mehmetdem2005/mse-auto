# PROVIDED-STANDARDS.md — Kullanıcının verdiği standart/mimari sözleşmesi (kaynak)
> Bu, Mehmet'in sağladığı ham standart listesi + yüklediği "ileri mimari" dokümanıdır.
> Sistem **STANDARDS.md** üzerinden bu maddelere göre denetlenir. (Özet/işlenmiş hâli: `standards.ts`.)

## A) Yüklenen doküman — İleri Otonom Mimari kavramları
1. **Nöro-Sembolik Mimari:** LLM'ler (nöral) strateji/kod üretir; sembolik motorlar (kural/derleyici) kodu fiziksel/güvenlik yasalarına göre *kanıtlar* (formal verification). → Bizde: CI sert kapısı + cerrahi-edit doğrulama + policy/authz; tam teorem-kanıtlama kapsam dışı (CI + tip kontrolü pratik karşılık).
2. **Yansıtıcı Mimari (Base/Meta-Level, hot-swap):** sistem kendi kaynağını okur, çalışırken kendini değiştirir. → Bizde: self-heal döngüsü (introspeksiyon→analiz→codegen→test→validate→apply); hot-swap **kasıtlı olarak deploy ile soğuk-swap** (in-process canlı değişim güvensiz — Replit dersi).
3. **Stigmerji / Çevresel Koordinasyon:** ajanlar doğrudan konuşmaz; ortamı (paylaşılan veri/sandbox) değiştirir, diğerleri tarayıp tepki verir. → Bizde: Blackboard + panels + sandbox (dolaylı koordinasyon); tam stigmerjik sürü sıradaki genişleme.
4. **Vektör Saatleri / Nedensel Zaman:** olayların nedensel sırası (Lamport). → Bizde: job_events + tracing (parent/child span) nedensel zinciri taşır; tam vektör-saat vektörü eklenebilir.
5. **Aktif Çıkarım / Serbest Enerji (Friston):** ajan tahmin üretir, sürprizi azaltır (modelini ya da ortamı günceller). → Bizde: anomaly→reason→act (tahmin-sapma→aksiyon) bu fikrin pratik çekirdeği.
6. **Ouroboros Döngüler:** çöken kodu analiz→patch→izole test→kendini güncelle (kapalı döngü). → Bizde: anomaly + selfimprove + CI + canary auto-revert.

## B) Ajan İletişim & Mesajlaşma
FIPA ACL, Actor Model, gRPC/Protobuf.

## C) Sistem & Kurumsal Mimari
TOGAF, ISO/IEC/IEEE 42010, BDI.

## D) İzolasyon & Güvenli Yürütme
Hexagonal (Ports/Adapters), OCI, Zero Trust.

## E) Görev Dağıtımı & Düşünce
Blackboard, ReAct, Contract Net Protocol, Raft/Paxos.

## F) Simülasyon & Mekansal Zekâ
GOAP, Behavior Trees, Spatial Partitioning (Octree/BVH).

## G) Bilişsel & Hafıza
SOAR/ACT-R, OWL (Knowledge Graph).

## H) İzlenebilirlik & Dayanıklılık
OpenTelemetry, Dead Letter Queue.
