import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

/** Salt-tamsayı metinleri (ör. "128") yumuşakça sayar; "$4.99" / "3 / 10" gibi
 *  biçimli değerleri olduğu gibi bırakır. */
function useCountUp(target: string): string {
  const [out, setOut] = useState(target);
  useEffect(() => {
    const clean = target.trim();
    if (!/^\d[\d.]*$/.test(clean)) {
      setOut(target);
      return;
    }
    const end = Number(clean.replace(/\./g, ""));
    if (!Number.isFinite(end) || end <= 0) {
      setOut(target);
      return;
    }
    const dur = 750;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number): void => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - (1 - p) ** 3;
      if (p < 1) {
        setOut(Math.round(end * eased).toLocaleString("tr-TR"));
        raf = requestAnimationFrame(tick);
      } else {
        setOut(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return out;
}

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
  const shown = useCountUp(n);
  return (
    <div className="panel stat" style={style}>
      <div className={`n ${tone ?? ""}`}>{shown}</div>
      <div className="l">{label}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
}
