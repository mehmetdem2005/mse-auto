"use client";
// Renders the ≥5-reviewer editorial board result attached to a job (job.review).
export default function ReviewBoard({ review }: { review: any }) {
  if (!review?.decision) return null;
  const d = review.decision;
  const color = d.verdict === "approve" ? "var(--good)" : d.verdict === "blocked" ? "var(--bad)" : "var(--warn)";
  const sevColor: Record<string, string> = { none: "var(--good)", minor: "var(--muted)", major: "var(--warn)", critical: "var(--bad)" };
  return (
    <div className="card" style={{ marginTop: 12, borderLeft: `3px solid ${color}` }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <span className="eyebrow">Editorial board · {review.verdicts?.length ?? 0} reviewers · {review.rounds} round(s){review.mode ? ` · ${review.mode}` : ""}</span>
        <span className="badge" style={{ color }}>{d.verdict} · {d.passCount}/{review.reviewerCount} · score {d.score}</span>
      </div>
      {!!review.plan?.length && (
        <details style={{ marginBottom: 8 }}>
          <summary className="eyebrow" style={{ cursor: "pointer" }}>Agent swarm · {review.plan.length} sub-tasks{review.swarmTrace ? ` · ${review.swarmTrace.filter((t: any) => t.ok).length}/${review.swarmTrace.length} ok` : ""}</summary>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {review.plan.map((t: any) => <li key={t.id} className="tag" style={{ listStyle: "disc" }}><b>{t.id}</b>{t.depends_on?.length ? ` ←(${t.depends_on.join(",")})` : ""}: {t.goal?.slice(0, 90)}</li>)}
          </ul>
        </details>
      )}
      {review.editor_note && <div className="tag" style={{ marginBottom: 8 }}>📝 {review.editor_note}</div>}
      {!!d.blockers?.length && <div className="tag" style={{ color: "var(--bad)", marginBottom: 8 }}>⛔ veto: {d.blockers.join(", ")}</div>}
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        {(review.verdicts || []).map((v: any) => (
          <span key={v.role} className="badge" title={(v.issues || []).join(" | ")}
            style={{ color: v.pass ? "var(--good)" : sevColor[v.severity] || "var(--warn)", borderColor: "currentColor" }}>
            {v.pass ? "✓" : "✗"} {v.title} ({v.score})
          </span>
        ))}
      </div>
      {!!d.fixes?.length && (
        <details style={{ marginTop: 8 }}>
          <summary className="eyebrow" style={{ cursor: "pointer" }}>Required fixes ({d.fixes.length})</summary>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {d.fixes.slice(0, 12).map((f: string, i: number) => <li key={i} className="tag" style={{ listStyle: "disc" }}>{f}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
