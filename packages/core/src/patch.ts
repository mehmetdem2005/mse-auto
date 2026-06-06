/**
 * Surgical edit engine — change only what must change (no full-file rewrite).  [v0.9]
 * Research (OpenAI apply_patch / Aider): avoid line numbers, delimit original/replacement, use a
 * LAYERED matching cascade (exact → whitespace-insensitive), and REJECT ambiguous/not-found edits
 * (the two failure modes of naive str_replace: indentation mismatch + duplicate matches).
 */
export interface Edit { find: string; replace: string; expected?: number; } // expected occurrence count (default 1)
export interface EditOutcome { ok: boolean; content: string; applied: number; errors: string[]; }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wsRegex = (find: string) => new RegExp(esc(find).replace(/\s+/g, "\\s+"), "g");
function countExact(hay: string, needle: string) { if (!needle) return 0; let i = 0, c = 0; while ((i = hay.indexOf(needle, i)) !== -1) { c++; i += needle.length; } return c; }

/** Apply one edit with the exact→whitespace cascade; returns new content or an error string. */
export function applyEdit(content: string, edit: Edit): { content?: string; error?: string } {
  const expected = edit.expected ?? 1;
  const snip = JSON.stringify(edit.find.slice(0, 48));
  if (!edit.find) return { error: "boş 'find'" };
  const exact = countExact(content, edit.find);
  if (exact > 0) {
    if (exact !== expected) return { error: `belirsiz: ${snip} ${exact} kez bulundu (beklenen ${expected}) — anchor ekle` };
    return { content: content.split(edit.find).join(edit.replace) };
  }
  const re = wsRegex(edit.find);
  const m = content.match(re);
  const fc = m ? m.length : 0;
  if (fc === 0) return { error: `bulunamadı: ${snip}` };
  if (fc !== expected) return { error: `belirsiz (boşluk-esnek): ${fc} kez (beklenen ${expected})` };
  return { content: content.replace(re, () => edit.replace) };
}

/** Apply edits sequentially; all-or-nothing report. */
export function applyEdits(content: string, edits: Edit[]): EditOutcome {
  let cur = content; let applied = 0; const errors: string[] = [];
  for (const e of edits) {
    const r = applyEdit(cur, e);
    if (r.error) { errors.push(r.error); continue; }
    cur = r.content!; applied++;
  }
  return { ok: errors.length === 0, content: cur, applied, errors };
}
