/**
 * Policy engine — declarative rules the crew works under (cannot be overridden by a single agent). [v0.8]
 */
export interface Policy { id: string; describe: string; check: (ctx: any) => { ok: boolean; reason?: string }; }

export const POLICIES: Policy[] = [
  { id: "disclosure", describe: "AI içeriği açıklaması zorunlu", check: (c) => ({ ok: !c.script || c.disclosureOk === true || /yapay zeka|made.?with.?ai|#?ai|asid/i.test(c.script.description || ""), reason: "AI açıklaması eksik" }) },
  { id: "daily_cap", describe: "Günlük yükleme sınırı", check: (c) => ({ ok: (c.uploadsToday ?? 0) < (c.maxPerDay ?? 2), reason: "Günlük yükleme sınırı aşıldı" }) },
  { id: "originality", describe: "Özgünlük eşiği (cosine)", check: (c) => ({ ok: (c.cosineMax ?? 0) <= (c.originalityThreshold ?? 0.92), reason: "İçerik çok benzer (özgünlük düşük)" }) },
  { id: "child_safety", describe: "Çocuk güvenliği", check: (c) => ({ ok: c.childSafetyRisk !== true, reason: "Çocuk güvenliği riski" }) },
  { id: "competitor_first", describe: "Yayından önce rakip analizi", check: (c) => ({ ok: c.competitorAnalyzed !== false, reason: "Rakip analizi yapılmadı" }) },
  { id: "aaa", describe: "AAA modül boyutu", check: (c) => ({ ok: (c.maxLines ?? 0) <= (c.aaaMaxLines ?? 400), reason: "Modül çok büyük (AAA değil) → parçala" }) },
  { id: "safe_pr", describe: "Kod değişikliği PR + CI kapısı", check: (c) => ({ ok: c.directPushToMain !== true, reason: "main'e doğrudan push yasak (PR+CI gerekli)" }) },
];

export function evaluate(ctx: any, ids?: string[]): { ok: boolean; violations: { id: string; reason?: string }[] } {
  const ps = ids ? POLICIES.filter((p) => ids.includes(p.id)) : POLICIES;
  const violations = ps.map((p) => ({ id: p.id, ...p.check(ctx) })).filter((r) => !r.ok).map((r) => ({ id: r.id, reason: r.reason }));
  return { ok: violations.length === 0, violations };
}
