/**
 * Duyurular (ADR-100) — admin'in oluşturduğu, kullanıcıların zil/Duyurular
 * ekranında gördüğü zengin (görselli, CTA'lı) mesajlar. PII içermez; paylaşılan zon.
 */
export type AnnouncementKind = "info" | "update" | "promo" | "warning";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  pinned: boolean;
  published: boolean;
  /** ADR-134: NULL = global (herkese); dolu = yalnız bu kullanıcı (hediye bildirimi vb.). */
  recipientUserId: string | null;
  /** ADR-135: dolu → istemci kullanıcı dilinde yerelleştirir (sistem bildirimi); NULL → serbest-metin. */
  templateKey: string | null;
  /** ADR-135: admin duyuru dili (tr/en/…); NULL = tüm diller. */
  lang: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  kind: AnnouncementKind;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  pinned: boolean;
  published: boolean;
  /** ADR-134: verilirse duyuru yalnız bu kullanıcıya gider (global değil). */
  recipientUserId?: string | null | undefined;
  /** ADR-135: sistem bildirimi şablon anahtarı (istemci yerelleştirir). */
  templateKey?: string | null | undefined;
  /** ADR-135: duyuru dili (tr/en/…); NULL/verilmezse tüm diller. */
  lang?: string | null | undefined;
}

/** Kısmi güncelleme yaması — zod `.partial()` çıktısıyla uyumlu (değer `| undefined` olabilir). */
export type AnnouncementPatch = {
  [K in keyof AnnouncementInput]?: AnnouncementInput[K] | undefined;
};

export interface AnnouncementRepository {
  /** Kullanıcı görünümü: yalnız yayınlananlar; sabitlenenler önce, sonra en yeni. */
  listPublished(): Promise<AnnouncementRow[]>;
  /** Admin görünümü: hepsi (taslaklar dahil), aynı sıralama. */
  listAll(): Promise<AnnouncementRow[]>;
  create(input: AnnouncementInput): Promise<AnnouncementRow>;
  /** Kısmi güncelleme (ör. yalnız published/pinned toggle); yoksa null. */
  update(id: string, patch: AnnouncementPatch): Promise<AnnouncementRow | null>;
  remove(id: string): Promise<void>;
  /** ADR-148: bu kullanıcıya bu şablonla daha önce duyuru açıldı mı (sistem-bildirimi dedup). */
  existsForRecipient(userId: string, templateKey: string): Promise<boolean>;
}
