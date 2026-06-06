/**
 * Lightweight knowledge graph — subject-predicate-object triples (OWL intent).  [v1.2]
 * Full OWL/DL reasoning is out of scope for a single channel; a queryable triple store gives the same
 * practical value: structured relations (story→category, hook→retention) the strategy layer can query.
 */
export interface Triple { s: string; p: string; o: string; }
export class Ontology {
  private triples: Triple[] = [];
  add(s: string, p: string, o: string) { this.triples.push({ s, p, o }); return this; }
  query(pat: Partial<Triple>): Triple[] { return this.triples.filter((t) => (!pat.s || t.s === pat.s) && (!pat.p || t.p === pat.p) && (!pat.o || t.o === pat.o)); }
  neighbors(entity: string): Triple[] { return this.triples.filter((t) => t.s === entity || t.o === entity); }
  size() { return this.triples.length; }
}
export function seedDomain(o = new Ontology()) {
  return o.add("Short", "isA", "ContentFormat").add("Short", "maxDuration", "60s")
    .add("hook", "improves", "retention").add("retention", "drives", "reach").add("originality", "avoids", "termination");
}
