import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "ShortsPilot", description: "Autonomous Shorts pipeline — control panel" };

const NAV = [
  { href: "/", label: "Panel", k: "01" },
  { href: "/queue", label: "Kuyruk / Onay", k: "02" },
  { href: "/agents", label: "Ajanlar", k: "03" },
  { href: "/knowledge", label: "Bilgi (RAG)", k: "04" },
  { href: "/memory", label: "Hafıza", k: "05" },
  { href: "/analytics", label: "Analitik", k: "06" },
  { href: "/observability", label: "İzleme", k: "07" },
  { href: "/lab", label: "Otonomi Lab", k: "08" },
  { href: "/settings", label: "Ayarlar", k: "09" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="shell">
          <aside className="side">
            <div className="brand">SHORTS·<b>PILOT</b></div>
            <div className="tag">CONTROL PANEL</div>
            <nav className="nav">
              {NAV.map((n) => (
                <a key={n.href} href={n.href}>
                  <span>{n.label}</span>
                  <span className="mono" style={{ opacity: 0.4 }}>{n.k}</span>
                </a>
              ))}
            </nav>
            <div style={{ position: "absolute", bottom: 20, left: 16, right: 16 }}>
              <div className="tag" style={{ lineHeight: 1.6 }}>
                İnsan onayı: <b style={{ color: "var(--accent)" }}>AÇIK</b><br />
                Kalite &gt; nicelik
              </div>
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
