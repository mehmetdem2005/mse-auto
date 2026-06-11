// Göreli zaman — aktif dilde (i18n). Feed + Watchers ortak (DRY, ADR-072).
import { useTranslation } from "react-i18next";

export function useAgo(): (iso: string | null | undefined) => string {
  const { t, i18n } = useTranslation();
  return (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("common.justNow");
    if (m < 60) return t("common.minAgo", { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("common.hourAgo", { n: h });
    const d = Math.floor(h / 24);
    if (d < 7) return t("common.dayAgo", { n: d });
    return new Date(iso).toLocaleDateString(i18n.language);
  };
}
