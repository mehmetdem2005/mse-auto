import { randomBytes } from "node:crypto";
import type { UserChannelRepository } from "../domain/channels";

/**
 * Telegram bot "konuşma" + "otomatik bağlama" akışı (ADR-153).
 *
 * Bot bir BİLDİRİM botudur (sohbet değil): kullanıcı yazınca yalnızca "ben bildirim botuyum"
 * açıklamasıyla yanıtlar. `/start <code>` ile gelen kullanıcı, uygulamada üretilmiş tek-kullanımlık
 * kodu taşır → chat_id'si hesabına bağlanır (kimse elle chat kimliğiyle uğraşmaz). Tek-yön port:
 * handler yalnız `TelegramReplier` (sendText) görür → application katmanı infra'ya bağlı kalmaz.
 */
export interface TelegramReplier {
  sendText(chatId: string, text: string): Promise<boolean>;
}

/** Uygulamada üretilen, bota taşınan tek-kullanımlık bağlama kodu → kullanıcı eşlemesi. */
export interface TelegramLinkStore {
  /** Kullanıcı için kısa-ömürlü kod üret. */
  create(userId: string): string;
  /** Kodu tüket (tek-kullanımlık): geçerli + süresi geçmemişse userId, değilse null. */
  consume(code: string): string | null;
}

/**
 * Bellek-içi bağlama deposu. Backend tek combined process (HTTP + worker aynı süreçte) → kod üreten
 * uç ile webhook AYNI bellekte; paylaşım tutarlı (migration/tablo gerekmez). Yeniden dağıtımda bekleyen
 * kodlar düşer (kullanıcı yeniden üretir — kabul edilebilir; kod 10 dk ömürlü zaten).
 */
export class InMemoryTelegramLinkStore implements TelegramLinkStore {
  private readonly map = new Map<string, { userId: string; exp: number }>();
  constructor(
    private readonly ttlMs = 10 * 60_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  create(userId: string): string {
    const code = randomBytes(9).toString("base64url"); // ~12 url-güvenli karakter
    this.map.set(code, { userId, exp: this.now() + this.ttlMs });
    return code;
  }

  consume(code: string): string | null {
    const e = this.map.get(code);
    if (!e) return null;
    this.map.delete(code); // tek-kullanımlık: bulunduğu an düşür
    if (e.exp < this.now()) return null;
    return e.userId;
  }
}

/** Bot yanıt metinleri — kullanıcının Telegram dil koduna göre tr/en (uygulama i18n'inden ayrı; bot içeriği). */
const MSG = {
  linked: {
    tr: "Bağlandı. Bundan sonra izlediğin bir olay gerçekleşince bildirimlerin buraya gelecek.",
    en: "Connected. From now on you'll get your alerts here when something you're watching happens.",
  },
  welcome: {
    tr: "Merhaba, ben Whenly bildirim botuyum. Hesabını bağlamak için Whenly uygulamasında Kanallar → Telegram'ı bağla'ya dokun.",
    en: "Hi, I'm the Whenly notification bot. To link your account, open the Whenly app and tap Channels → Connect Telegram.",
  },
  explain: {
    tr: "Ben bir bildirim botuyum, sohbet edemem. Yalnızca izlediğin bir olay gerçekleştiğinde sana burada haber veririm. Ayarları Whenly uygulamasından yönetebilirsin.",
    en: "I'm a notification bot, I can't chat. I only message you here when something you're watching happens. Manage settings in the Whenly app.",
  },
} as const;

function pickLang(code: string | undefined): "tr" | "en" {
  return code?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

/** Telegram update'inin yalnız ihtiyaç duyduğumuz alt kümesi. */
export interface TelegramUpdate {
  message?: {
    chat?: { id?: number };
    from?: { language_code?: string };
    text?: string;
  };
}

export interface TelegramUpdateDeps {
  replier: TelegramReplier;
  links: TelegramLinkStore;
  userChannels: UserChannelRepository;
}

/**
 * Gelen Telegram mesajını işler:
 *  - `/start <kod>` + kod geçerli → chat_id'yi hesaba bağla + telegram'ı aç → "bağlandı".
 *  - `/start` (kodsuz/geçersiz) → karşılama + uygulamadan bağlama yönergesi.
 *  - başka her metin → "ben bildirim botuyum" açıklaması.
 */
export async function handleTelegramUpdate(
  deps: TelegramUpdateDeps,
  update: TelegramUpdate,
): Promise<void> {
  const chatId = update.message?.chat?.id;
  if (chatId == null) return;
  const chat = String(chatId);
  const lang = pickLang(update.message?.from?.language_code);
  const text = (update.message?.text ?? "").trim();

  if (text.startsWith("/start")) {
    const code = text.slice("/start".length).trim();
    if (code) {
      const userId = deps.links.consume(code);
      if (userId) {
        const cur = await deps.userChannels.get(userId);
        await deps.userChannels.set(userId, {
          ...cur,
          telegramChatId: chat,
          enabled: [...new Set([...cur.enabled, "telegram" as const])],
        });
        await deps.replier.sendText(chat, MSG.linked[lang]);
        return;
      }
    }
    await deps.replier.sendText(chat, MSG.welcome[lang]);
    return;
  }

  await deps.replier.sendText(chat, MSG.explain[lang]);
}
