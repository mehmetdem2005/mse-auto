import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "ShortsPilot", description: "Autonomous Shorts pipeline — control panel" };

const NAV = [
  { href: "/agents", label: "Komuta Merkezi", k: "01" },
  { href: "/", label: "Panel", k: "02" },
  { href: "/videos", label: "Videolar", k: "03" },
  { href: "/queue", label: "Kuyruk / Onay", k: "04" },
  { href: "/knowledge", label: "Bilgi (RAG)", k: "05" },
  { href: "/memory", label: "Hafıza", k: "06" },
  { href: "/analytics", label: "Analitik", k: "07" },
  { href: "/observability", label: "İzleme", k: "08" },
  { href: "/lab", label: "Otonomi Lab", k: "09" },
  { href: "/settings", label: "Ayarlar", k: "10" },
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
            <div style={{ marginTop: "auto", paddingTop: 20 }}>
              <div className="tag" style={{ lineHeight: 1.6 }}>
                Tam Otonom: <b style={{ color: "var(--accent)" }}>AÇIK</b><br />
                Onaysız üretim
              </div>
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
