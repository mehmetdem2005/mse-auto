/** İş kuyruğu port'u (ADR-011). Adapter'lar: in-memory (dev) + pg-boss (prod). */
export interface JobQueue {
  init(): Promise<void>;
  enqueue<T extends object>(queue: string, data: T): Promise<void>;
  process<T extends object>(queue: string, handler: (data: T) => Promise<void>): Promise<void>;
  shutdown(): Promise<void>;
}
