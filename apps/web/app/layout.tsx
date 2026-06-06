import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "ShortsPilot", description: "Autonomous Shorts pipeline — control panel" };

const NAV = [
  { href: "/", label: "Dashboard", k: "01" },
  { href: "/queue", label: "Queue / Approval", k: "02" },
  { href: "/knowledge", label: "Knowledge (RAG)", k: "03" },
  { href: "/memory", label: "Memory", k: "04" },
  { href: "/analytics", label: "Analytics", k: "05" },
  { href: "/observability", label: "Observability", k: "06" },
  { href: "/lab", label: "Autonomy Lab", k: "07" },
  { href: "/settings", label: "Settings", k: "08" },
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
                Human-in-the-loop: <b style={{ color: "var(--accent)" }}>ON</b><br />
                Quality &gt; volume
              </div>
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
