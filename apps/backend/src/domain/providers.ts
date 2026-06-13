import type { ProviderUsage } from "@watcher/contracts";

/**
 * Sağlayıcı kullanım panosu port'u (ADR-095) — Supabase/Render/Vercel/DeepSeek/Groq
 * hesaplarının GERÇEK kullanım/kota verisi. Token tanımsızsa veya uç hata verirse
 * kart bunu dürüstçe taşır; asla uydurma metrik üretilmez.
 */
export interface ProviderUsagePort {
  fetchAll(): Promise<ProviderUsage[]>;
}
