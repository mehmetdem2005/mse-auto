import type { CSSProperties, ReactNode } from "react";

export function Banner({
  kind,
  children,
}: { kind: "err" | "note"; children: ReactNode }): ReactNode {
  return <div className={`banner ${kind}`}>{children}</div>;
}

export function Panel({
  title,
  children,
  delay = 0,
}: {
  title?: string;
  children: ReactNode;
  delay?: number;
}): ReactNode {
  const style: CSSProperties = { animationDelay: `${delay}ms` };
  return (
    <div className="panel" style={style}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

export function Stat({
  n,
  label,
  sub,
  tone,
  delay = 0,
}: {
  n: string;
  label: string;
  sub?: string;
  tone?: "accent" | "pos";
  delay?: number;
}): ReactNode {
  const style: CSSProperties = { animationDelay: `${delay}ms` };
  return (
    <div className="panel stat" style={style}>
      <div className={`n ${tone ?? ""}`}>{n}</div>
      <div className="l">{label}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
}
