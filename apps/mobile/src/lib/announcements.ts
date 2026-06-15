// Duyuru okundu-durumu (ADR-100) — sunucuda kişi-başı okuma tablosu YOK (basitlik);
// "en son görülen an" cihazda saklanır, en yeni duyuruyla kıyaslanarak okunmamış sayılır.
import { type Announcement, api } from "@/lib/api";
import { qk } from "@/lib/query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const SEEN_KEY = "whenly:announcements:seenAt";

async function getSeenAt(): Promise<string | null> {
  return AsyncStorage.getItem(SEEN_KEY);
}

/**
 * Yayınlanan duyurular (sabit önce) — kullanıcı ekranı + zil rozeti ortak kaynağı.
 * ADR-135: kullanıcının dili sunucuya iletilir → dil-bağımsız + o dildeki duyurular gelir;
 * dil anahtara eklenir ki dil değişince yeniden çekilsin.
 */
export function useAnnouncements() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return useQuery({
    queryKey: [...qk.announcements, lang],
    queryFn: () => api.announcements(lang),
    staleTime: 60_000,
  });
}

/** "En son görülen an" — react-query ile reaktif (okununca güncellenir). */
function useSeenAt() {
  return useQuery({
    queryKey: qk.announcementsSeen,
    queryFn: getSeenAt,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/** Okunmamış duyuru sayısı (zil rozeti). seenAt yoksa hepsi okunmamış sayılır. */
export function useUnreadAnnouncements(): number {
  const { data } = useAnnouncements();
  const { data: seenAt } = useSeenAt();
  if (!data) return 0;
  return data.filter((a: Announcement) => !seenAt || a.createdAt > seenAt).length;
}

/** Duyurular ekranı açılınca çağrılır: en yeni an damgalanır, rozet sıfırlanır. */
export function useMarkAnnouncementsSeen(): () => void {
  const qc = useQueryClient();
  const { data } = useAnnouncements();
  return () => {
    // En yeni duyurudan biraz ilerisi: createdAt'ten büyük olduğundan tümü okundu sayılır.
    const now = new Date().toISOString();
    const latest = data?.[0]?.createdAt;
    const stamp = latest && latest > now ? latest : now;
    void AsyncStorage.setItem(SEEN_KEY, stamp);
    qc.setQueryData(qk.announcementsSeen, stamp);
  };
}
