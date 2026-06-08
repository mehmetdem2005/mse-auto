import type { Me } from "@watcher/contracts";
import type { ReactNode } from "react";
import type { View } from "../App";

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
  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <span className="dot" />
          <div>
            <div className="name">WATCHER</div>
            <div className="sub">ops console</div>
          </div>
        </div>
        <nav className="nav">
          <button
            type="button"
            className={view === "overview" ? "active" : ""}
            onClick={() => onNav("overview")}
          >
            Genel
          </button>
          {me?.isAdmin ? (
            <button
              type="button"
              className={view === "admin" ? "active" : ""}
              onClick={() => onNav("admin")}
            >
              Admin
            </button>
          ) : null}
        </nav>
      </aside>
      <div>
        <header className="topbar">
          <div className="live">
            <span className="d" /> MONITORING
          </div>
          <div className="who">
            <span className="muted">{me?.email ?? me?.userId ?? "—"}</span>
            <span className={`chip ${me?.isAdmin ? "admin" : ""}`}>
              {me?.isAdmin ? "admin" : "üye"}
            </span>
            <button type="button" className="signout" onClick={onSignOut}>
              çıkış
            </button>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
