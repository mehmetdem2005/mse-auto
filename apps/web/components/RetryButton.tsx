"use client";
import { useState } from "react";
export default function RetryButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className="btn" disabled={busy} onClick={async () => {
      setBusy(true);
      await fetch(`/api/jobs/${id}/retry`, { method: "POST" });
      location.reload();
    }}>↻ Requeue</button>
  );
}
