import type { Me } from "@watcher/contracts";
import type { ReactNode } from "react";
import type { View } from "../App";
import { Menu } from "./Menu";

// Lucide (ISC lisansı) ikon yolları — inline SVG, ek bağımlılık yok.
function IconGrid(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconActivity(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function IconShield(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function Shell({
  me,
  view,
  onNav,
  onSignOut,
  children,
}: {
  me: Me | null;
  view: View;
  onNav: (v: View) => void;
  onSignOut: () => void;
  children: ReactNode;
}): ReactNode {
  const NAV: { id: View; label: string; icon: ReactNode; show: boolean }[] = [
    { id: "feed", label: "Akış", icon: <IconActivity />, show: true },
    { id: "overview", label: "Genel", icon: <IconGrid />, show: true },
    { id: "admin", label: "Admin", icon: <IconShield />, show: !!me?.isAdmin },
  ];

  return (
    <div className="app">
      {/* M3 Navigation Rail */}
      <aside className="rail">
        <div className="brand">
          <span className="dot" />
          <div>
            <div className="name">WATCHER</div>
            <div className="sub">ops console</div>
          </div>
        </div>
        <nav className="nav" aria-label="Ana gezinme">
          {NAV.filter((n) => n.show).map((n) => (
            <button
              key={n.id}
              type="button"
              className={view === n.id ? "active" : ""}
              aria-current={view === n.id ? "page" : undefined}
              onClick={() => onNav(n.id)}
            >
              <span className="nav-indicator">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div>
        {/* M3 Top App Bar + Overflow menü */}
        <header className="topbar">
          <div className="live">
            <span className="d" /> MONITORING
          </div>
          <div className="who">
            <span className="muted">{me?.email ?? me?.userId ?? "—"}</span>
            <span className={`chip ${me?.isAdmin ? "admin" : ""}`}>
              {me?.isAdmin ? "admin" : "üye"}
            </span>
            <Menu
              label="Hesap işlemleri"
              triggerLabel="Hesap menüsü"
              items={[{ label: "Çıkış yap", danger: true, onSelect: onSignOut }]}
            />
          </div>
        </header>
        {/* M3 fade-through görünüm geçişi (view değişince yeniden mount + anim) */}
        <main className="main">
          <div className="view-enter" key={view}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
