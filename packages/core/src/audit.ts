/**
 * Module / AAA auditor — scans a file inventory and flags non-AAA modules.  [v0.8]
 * Feeds the self-improve pipeline with "split this module" / "add tests" proposals (PR-gated).
 */
export interface FileInfo { path: string; lines: number; bytes?: number; hasTest?: boolean; }
export interface AuditFlag { path: string; issue: string; suggestion: string; severity: "info" | "warn"; }

export function auditModules(files: FileInfo[], opts: { maxLines?: number } = {}): AuditFlag[] {
  const max = opts.maxLines ?? 400;
  const flags: AuditFlag[] = [];
  for (const f of files) {
    if (f.lines > max) flags.push({ path: f.path, issue: `modül çok büyük (${f.lines} > ${max} satır)`, suggestion: "modülü mantıksal parçalara böl (split)", severity: "warn" });
    if (f.path.endsWith(".ts") && !/\.test\.|index\.ts$|types\.ts$|\.d\.ts$/.test(f.path) && f.hasTest === false)
      flags.push({ path: f.path, issue: "birim test yok", suggestion: "kritik yollar için test ekle", severity: "info" });
  }
  return flags;
}
