/**
 * Crew — YouTube-expert agent hierarchy (manager → specialist workers).  [v0.8]
 * Research: orchestrator-worker / hierarchical supervisor dominate 2026; role-based design
 * (Planner/Executor/Verifier/Optimizer + maker-checker) improves reliability. Roles below are scoped
 * to a YouTube-growth pipeline (hook-first, satisfaction/CTR/replay signals, outlier competitor analysis).
 * Each role declares a TOOL SCOPE (whitelist) and POLICIES (cannot override core policy) per 2026 safety.
 */
export interface Role { id: string; title: string; system: string; tools: string[]; policies: string[]; keywords: string[]; }
export interface CrewTask { id: string; role: string; goal: string; depends_on: string[]; }

export const ROLES: Role[] = [
  { id: "manager", title: "Yapımcı/Yönetici", keywords: ["*"], tools: ["*"], policies: ["aaa", "daily_cap"],
    system: "Sen baş yapımcısın: hedefi alt-görevlere böl, uygun uzmanlara dağıt, sonuçları birleştir. 10M abone hedefiyle kaliteyi ve politikaları koru." },
  { id: "trend_scout", title: "Trend/Outlier Avcısı", keywords: ["trend", "konu", "fikir", "viral", "outlier"], tools: ["web_research", "rag_search"], policies: [],
    system: "Nişte ortalamanın 3x+ üstündeki outlier formatları/konuları ve tekrar eden kalıpları bul." },
  { id: "competitor_analyst", title: "Rakip Analisti", keywords: ["rakip", "rekabet", "competitor", "yorum", "transkript"], tools: ["competitor_analyze", "web_research"], policies: [],
    system: "Rakip yorum + transkript + outlier metriklerinden kazanan hook'ları, içerik boşluklarını ve izleyici isteklerini çıkar." },
  { id: "hook_writer", title: "Hook Uzmanı", keywords: ["hook", "giriş", "açılış"], tools: ["recall", "remember"], policies: [],
    system: "İlk 0.5-3 sn için mute'ta okunan 3-6 kelimelik güçlü hook üret; yavaş giriş/selamlama yok; pattern interrupt kullan." },
  { id: "scriptwriter", title: "Senarist", keywords: ["senaryo", "script", "metin", "yazı"], tools: ["rag_search", "read_artifact", "write_artifact"], policies: ["originality"],
    system: "Retention odaklı, promise=payoff hizalı, ÖZGÜN yorumlu, doğrulanmış senaryo yaz." },
  { id: "packaging", title: "Başlık/Thumbnail (CTR)", keywords: ["başlık", "title", "thumbnail", "kapak", "ctr"], tools: [], policies: [],
    system: "CTR'yi artıran net (clickbait değil) başlık + thumbnail metni öner; promise=payoff." },
  { id: "compliance", title: "Politika/Uyum", keywords: ["*"], tools: [], policies: ["disclosure", "originality", "child_safety"], 
    system: "AI açıklaması, telif, çocuk güvenliği ve özgünlük kapısını uygula; geçmezse reddet." },
  { id: "analyst", title: "Performans Analisti", keywords: ["analiz", "istatistik", "performans", "retention", "metrik"], tools: ["rag_search"], policies: [],
    system: "first-hour/24h velocity, CTR, like/view, replay ve satisfaction sinyallerini yorumla; dip/spike noktalarını işaretle." },
  { id: "module_auditor", title: "Modül Denetçisi (AAA)", keywords: ["denetim", "audit", "modül", "kod", "aaa"], tools: ["read_artifact"], policies: ["aaa"],
    system: "Her dosyayı/dalı tara; AAA değilse (büyük modül, test yok, hata yönetimi eksik) düzeltme veya parçalama öner." },
  { id: "tool_developer", title: "Tool Geliştirici", keywords: ["tool", "yetenek", "araç"], tools: ["synthesize_tool"], policies: ["aaa"],
    system: "Yetenek boşluğunda yeni tool sentezle (metadata + recipe) veya kod-tool için güvenli PR öner." },
  { id: "self_improve_engineer", title: "Self-Improve Mühendisi", keywords: ["iyileştir", "improve", "pr", "düzelt"], tools: [], policies: ["aaa", "safe_pr"],
    system: "Fırsatları güvenli PR'a çevir: CI zorunlu kapı, düşük-risk + opt-in auto-merge, her şey revertable." },
];

const ALWAYS = ["manager", "compliance"];

/** Pick the roles relevant to a goal (keyword match), always including manager + compliance. */
export function selectRoles(goal: string, all = ROLES): Role[] {
  const g = goal.toLowerCase();
  const picked = all.filter((r) => r.keywords.includes("*") || r.keywords.some((k) => g.includes(k)));
  const ids = new Set(picked.map((r) => r.id));
  for (const a of ALWAYS) ids.add(a);
  // sensible default if nothing specific matched
  if (ids.size <= ALWAYS.length) ["trend_scout", "competitor_analyst", "hook_writer", "scriptwriter", "packaging", "analyst"].forEach((x) => ids.add(x));
  return all.filter((r) => ids.has(r.id));
}

/** Manager builds a dependency-ordered task plan for the selected crew (hierarchy in action). */
export function managerPlan(goal: string): CrewTask[] {
  const order = ["trend_scout", "competitor_analyst", "hook_writer", "scriptwriter", "packaging", "compliance", "analyst"];
  const roles = new Set(selectRoles(goal).map((r) => r.id));
  const chain = order.filter((id) => roles.has(id));
  return chain.map((id, i) => ({ id, role: id, goal: `${goal} — rolün: ${ROLES.find((r) => r.id === id)!.title}`, depends_on: i ? [chain[i - 1]] : [] }));
}

export const roleById = (id: string) => ROLES.find((r) => r.id === id);
