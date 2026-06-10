// Material 3 ripple — etkileşimli yüzeylerde tıklama noktasından yayılan dalga.
// Delegasyon: tek document dinleyici; eşleşen seçicilere ripple span ekler.
// prefers-reduced-motion: kapalı (erişilebilirlik).
const SELECTOR = ".btn, .nav button, .m3-icon-btn, .m3-menu-item, .tab";

export function installRipple(): () => void {
  if (
    typeof window === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ) {
    return () => {};
  }
  const onDown = (e: PointerEvent): void => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(SELECTOR);
    if (!el || el.hasAttribute("disabled")) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement("span");
    ink.className = "ripple-ink";
    ink.style.width = `${size}px`;
    ink.style.height = `${size}px`;
    ink.style.left = `${e.clientX - rect.left - size / 2}px`;
    ink.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(ink);
    ink.addEventListener("animationend", () => ink.remove(), { once: true });
  };
  document.addEventListener("pointerdown", onDown);
  return () => document.removeEventListener("pointerdown", onDown);
}
