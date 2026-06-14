/**
 * Ajan araç fabrikaları (ADR-122) — infra'yı `AgentTool`'a sarmalar. Faz 4'te container'ın
 * gerçek bileşenleri (checker/authority) bu imzalara bağlanır. `check_site_policy` ve `rag_retrieve`
 * Faz 3/5'e dek yer-tutucudur (dürüstçe "henüz aktif değil" döner).
 */
import type { AgentTool } from "../../domain/agent";

export interface SearchResultLite {
  title: string;
  snippet: string;
  url?: string;
  date?: string;
}

/** Public web araması — olayın gerçekleşip gerçekleşmediğini araştırmak için. */
export function webSearchTool(search: (query: string) => Promise<SearchResultLite[]>): AgentTool {
  return {
    name: "web_search",
    description:
      "Public web'de güncel bilgi ara (resmî site, haber, duyuru). Bir olayın gerçekleşip gerçekleşmediğini ya da izlenebilir olup olmadığını araştırmak için kullan.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "arama sorgusu (anahtar kelimeler)" } },
      required: ["query"],
    },
    run: async (args) => {
      const query = String(args.query ?? "").trim();
      if (!query) return "Boş sorgu.";
      const hits = await search(query);
      if (hits.length === 0) return "Sonuç bulunamadı.";
      return hits
        .slice(0, 6)
        .map((h, i) => `${i + 1}. ${h.title} — ${h.snippet}${h.date ? ` (${h.date})` : ""}`)
        .join("\n");
    },
  };
}

/** Bir konunun RESMÎ kaynağını (kurum domain'i) bul. */
export function resolveAuthorityTool(
  resolve: (topic: string) => Promise<string | null>,
): AgentTool {
  return {
    name: "resolve_authority",
    description:
      "Bir konunun RESMÎ kaynağının (kurum web sitesi domain'i) ne olduğunu bul. İzlemenin doğru kaynağı için.",
    parameters: {
      type: "object",
      properties: { topic: { type: "string", description: "izlenecek konu" } },
      required: ["topic"],
    },
    run: async (args) => {
      const topic = String(args.topic ?? "").trim();
      const domain = topic ? await resolve(topic) : null;
      return domain ? `Resmî kaynak: ${domain}` : "Resmî kaynak bulunamadı.";
    },
  };
}

/** Faz 3'e dek yer-tutucu — site izni (robots/ToS) denetimi henüz yok. */
export function checkSitePolicyStubTool(): AgentTool {
  return {
    name: "check_site_policy",
    description:
      "Bir sitenin otomatik izlemeye izin verip vermediğini (robots.txt/ToS) kontrol et.",
    parameters: {
      type: "object",
      properties: { domain: { type: "string" } },
      required: ["domain"],
    },
    run: async () => "Site-izni denetimi henüz aktif değil (Faz 3'te gelecek).",
  };
}

/** Faz 5'e dek yer-tutucu — bilgi tabanı (RAG) henüz yok. */
export function ragRetrieveStubTool(): AgentTool {
  return {
    name: "rag_retrieve",
    description: "Geçmiş tespitler/kaynaklar bilgi tabanından ilgili bağlamı getir.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    run: async () => "Bilgi tabanı (RAG) henüz aktif değil (Faz 5'te gelecek).",
  };
}
