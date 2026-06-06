/**
 * Spatial partitioning — kd-tree nearest-neighbor.  [v1.2]
 * Generalizes from 2D/3D space to EMBEDDING vectors: used here for near-duplicate / originality checks
 * and competitor clustering over script/topic embeddings. Note: kd-trees suit low/medium dimensions; for
 * full 768-dim production scale, pgvector/HNSW is the backend — this is the in-memory partitioning layer.
 */
export interface VecPoint { id: string; vec: number[]; }
interface KDNode { point: VecPoint; axis: number; left?: KDNode; right?: KDNode; }

function build(points: VecPoint[], depth = 0): KDNode | undefined {
  if (!points.length) return undefined;
  const axis = depth % points[0].vec.length;
  const sorted = points.slice().sort((a, b) => a.vec[axis] - b.vec[axis]);
  const mid = Math.floor(sorted.length / 2);
  return { point: sorted[mid], axis, left: build(sorted.slice(0, mid), depth + 1), right: build(sorted.slice(mid + 1), depth + 1) };
}
const dist2 = (a: number[], b: number[]) => a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0);

export class KDTree {
  private root?: KDNode;
  constructor(points: VecPoint[] = []) { this.root = build(points); }
  nearest(query: number[], k = 1): { id: string; dist: number }[] {
    const best: { id: string; d2: number }[] = [];
    const consider = (p: VecPoint) => { best.push({ id: p.id, d2: dist2(query, p.vec) }); best.sort((a, b) => a.d2 - b.d2); if (best.length > k) best.pop(); };
    const search = (node?: KDNode) => {
      if (!node) return;
      consider(node.point);
      const diff = query[node.axis] - node.point.vec[node.axis];
      const near = diff < 0 ? node.left : node.right, far = diff < 0 ? node.right : node.left;
      search(near);
      if (best.length < k || diff * diff < best[best.length - 1].d2) search(far);
    };
    search(this.root);
    return best.map((b) => ({ id: b.id, dist: Math.sqrt(b.d2) }));
  }
}
