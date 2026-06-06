/**
 * Minimal, dependency-free GitHub REST client (fetch-based; fetch is injectable for tests).  [v0.7]
 *
 * Safe self-modification, per 2026 industry/Google practice (researched):
 *   • The agent NEVER pushes to the default branch. It opens a PULL REQUEST on a new branch.
 *   • CI (.github/workflows/ci.yml: typecheck+test+build) is the HARD GATE the agent cannot bypass.
 *   • Auto-merge is opt-in and only for green CI + low-risk changes (see selfimprove.classifyRisk).
 *   • Every change is revertable (a normal PR → revert PR). Branch protection / Rulesets on main.
 * Endpoints verified against GitHub REST docs (git/refs, contents, pulls, commits/check-runs, merge).
 */
import { log } from "./logger.js";

type FetchLike = (input: any, init?: any) => Promise<any>;
export interface GhConfig { token: string; owner: string; repo: string; base?: string; apiVersion?: string; fetchImpl?: FetchLike; }
const API = "https://api.github.com";
const b64 = (s: string) => (typeof Buffer !== "undefined" ? Buffer.from(s, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(s))));

export class GitHub {
  private f: FetchLike;
  constructor(private c: GhConfig) { this.f = c.fetchImpl || (globalThis.fetch as any); }
  private h() {
    return { Authorization: `Bearer ${this.c.token}`, Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": this.c.apiVersion || "2022-11-28", "Content-Type": "application/json" };
  }
  private url(p: string) { return `${API}/repos/${this.c.owner}/${this.c.repo}${p}`; }

  async getRefSha(branch: string): Promise<string> {
    const r = await this.f(this.url(`/git/ref/heads/${encodeURIComponent(branch)}`), { headers: this.h() });
    if (!r.ok) throw new Error(`getRef ${branch}: ${r.status}`);
    return (await r.json()).object.sha;
  }
  async createBranch(name: string, fromSha: string) {
    const r = await this.f(this.url(`/git/refs`), { method: "POST", headers: this.h(), body: JSON.stringify({ ref: `refs/heads/${name}`, sha: fromSha }) });
    if (!r.ok && r.status !== 422) throw new Error(`createBranch ${name}: ${r.status}`); // 422 = already exists
  }
  /** Read a file's decoded text content (null if 404). */
  async getFileContent(path: string, ref?: string): Promise<string | null> {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const r = await this.f(this.url(`/contents/${path}${q}`), { headers: this.h() });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`getContent ${path}: ${r.status}`);
    const j = await r.json();
    if (!j.content) return "";
    return typeof Buffer !== "undefined" ? Buffer.from(j.content, "base64").toString("utf8") : decodeURIComponent(escape(atob(j.content)));
  }
  async getFileSha(path: string, branch: string): Promise<string | undefined> {    const r = await this.f(this.url(`/contents/${path}?ref=${encodeURIComponent(branch)}`), { headers: this.h() });
    if (r.status === 404) return undefined;
    if (!r.ok) throw new Error(`getFile ${path}: ${r.status}`);
    return (await r.json()).sha;
  }
  async putFile(a: { path: string; content: string; message: string; branch: string }) {
    const sha = await this.getFileSha(a.path, a.branch).catch(() => undefined);
    const body: any = { message: a.message, content: b64(a.content), branch: a.branch };
    if (sha) body.sha = sha;
    const r = await this.f(this.url(`/contents/${a.path}`), { method: "PUT", headers: this.h(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`putFile ${a.path}: ${r.status} ${await r.text?.()}`);
    return r.json();
  }
  async createPR(a: { title: string; head: string; body: string }): Promise<{ number: number; html_url: string }> {
    const r = await this.f(this.url(`/pulls`), { method: "POST", headers: this.h(), body: JSON.stringify({ title: a.title, head: a.head, base: this.c.base || "main", body: a.body }) });
    if (!r.ok) throw new Error(`createPR: ${r.status} ${await r.text?.()}`);
    const j = await r.json();
    return { number: j.number, html_url: j.html_url };
  }
  /** Aggregated CI conclusion for a commit ref. */
  async checksConclusion(ref: string): Promise<"success" | "failure" | "pending"> {
    const r = await this.f(this.url(`/commits/${ref}/check-runs`), { headers: this.h() });
    if (!r.ok) return "pending";
    const runs = (await r.json()).check_runs || [];
    if (!runs.length) return "pending";
    if (runs.some((x: any) => x.status !== "completed")) return "pending";
    return runs.every((x: any) => x.conclusion === "success" || x.conclusion === "skipped") ? "success" : "failure";
  }
  async mergePR(number: number, method: "squash" | "merge" | "rebase" = "squash") {
    const r = await this.f(this.url(`/pulls/${number}/merge`), { method: "PUT", headers: this.h(), body: JSON.stringify({ merge_method: method }) });
    if (!r.ok) throw new Error(`merge #${number}: ${r.status} ${await r.text?.()}`);
    return r.json();
  }
  /** High-level: create branch from base, write files, open a PR. Returns PR + head SHA. */
  async openChangePR(a: { branch: string; title: string; body: string; files: { path: string; content: string }[]; message: string }): Promise<{ number: number; html_url: string; headSha?: string }> {
    const baseSha = await this.getRefSha(this.c.base || "main");
    await this.createBranch(a.branch, baseSha);
    for (const file of a.files) await this.putFile({ path: file.path, content: file.content, message: a.message, branch: a.branch });
    const headSha = await this.getRefSha(a.branch).catch(() => undefined);
    const pr = await this.createPR({ title: a.title, head: a.branch, body: a.body });
    log.info("opened improvement PR", { number: pr.number, files: a.files.length });
    return { ...pr, headSha };
  }
}

export function githubFromEnv(fetchImpl?: FetchLike): GitHub | null {
  const token = process.env.GITHUB_TOKEN, owner = process.env.GITHUB_OWNER, repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) return null;
  return new GitHub({ token, owner, repo, base: process.env.GITHUB_BASE_BRANCH || "main", apiVersion: process.env.GITHUB_API_VERSION, fetchImpl });
}
