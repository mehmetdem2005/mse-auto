import { z } from "zod";
import type { AuthorityInfo, AuthorityResolver } from "../../domain/authority";
import { groqJsonChat } from "../groq/groq-json";

const InfoSchema = z.object({
  domain: z.string().nullable(),
  name: z.string().nullable(),
});

const SYSTEM = [
  "Bir izleme konusunun BİRİNCİL/RESMÎ kaynağını belirleyen asistansın.",
  "Kullanıcı bir izleme konusu verir; bu konuda duyuruyu/veriyi ÜRETEN resmî kurumun (devlet kurumu, resmî organizatör, üretici firma vb.) web sitesi alan adını döndür.",
  "Kurallar: yalnız KÖK alan adı ver (https:// olmadan, örn. 'kurum.gov.tr'); haber sitesi/blog/sosyal medya RESMÎ kaynak DEĞİLDİR; emin değilsen domain=null ver — uydurma.",
  'YALNIZCA şu JSON ile yanıtla: {"domain": string|null, "name": string|null}.',
].join(" ");

/** Groq ile konu→resmî kaynak çözümü (konu başına bir kez çağrılır, cache'lenir). */
export class GroqAuthorityResolver implements AuthorityResolver {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async resolve(canonicalQuery: string): Promise<AuthorityInfo> {
    const content = await groqJsonChat({
      apiKey: this.apiKey,
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `İzleme konusu: ${canonicalQuery}` },
      ],
      temperature: 0,
      maxTokens: 128,
      fetchImpl: this.fetchImpl,
    });
    const info = InfoSchema.parse(JSON.parse(content));
    // Güvenlik: alan adını normalize et (protokol/yol sızarsa kırp).
    const domain = info.domain
      ? (info.domain.replace(/^https?:\/\//, "").split("/")[0] ?? null)
      : null;
    return { domain: domain || null, name: info.name };
  }
}

/** Anahtarsız dev ortamı: çözüm yok (genel arama sürer). */
export class NullAuthorityResolver implements AuthorityResolver {
  async resolve(): Promise<AuthorityInfo> {
    return { domain: null, name: null };
  }
}
