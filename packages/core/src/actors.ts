/**
 * Actor Model — asynchronous, deadlock-free message passing for many concurrent agents.  [v1.1]
 * Each actor owns a private mailbox and processes messages SEQUENTIALLY (no shared-state locks → no
 * deadlock); many actors run concurrently on the event loop. In-process (not a distributed actor runtime).
 */
type Handler<T> = (msg: T, self: Actor<T>) => Promise<void> | void;

export class Actor<T = any> {
  private mailbox: T[] = [];
  private running = false;
  private stopped = false;
  constructor(public name: string, private handler: Handler<T>) {}
  send(msg: T) { if (this.stopped) return; this.mailbox.push(msg); void this.pump(); }
  private async pump() {
    if (this.running) return;
    this.running = true;
    try { while (this.mailbox.length) { const m = this.mailbox.shift()!; await this.handler(m, this); } }
    finally { this.running = false; }
  }
  async drain() { while (this.running || this.mailbox.length) await new Promise((r) => setTimeout(r, 1)); }
  stop() { this.stopped = true; }
  get pending() { return this.mailbox.length; }
}

export class ActorSystem {
  private actors = new Map<string, Actor<any>>();
  spawn<T>(name: string, handler: Handler<T>): Actor<T> { const a = new Actor<T>(name, handler); this.actors.set(name, a); return a; }
  get(name: string) { return this.actors.get(name); }
  tell(name: string, msg: any) { this.actors.get(name)?.send(msg); }
  async drainAll() { await Promise.all([...this.actors.values()].map((a) => a.drain())); }
  size() { return this.actors.size; }
}
