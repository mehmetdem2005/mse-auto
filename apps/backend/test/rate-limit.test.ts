import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "../src/infrastructure/rate-limit/in-memory.limiter";

describe("InMemoryRateLimiter (sabit pencere)", () => {
  it("limit kadar izin verir, sonra reddeder", () => {
    const rl = new InMemoryRateLimiter(3, 1000);
    const t = 1_000_000;
    expect(rl.hit("a", t).allowed).toBe(true);
    expect(rl.hit("a", t).allowed).toBe(true);
    const third = rl.hit("a", t);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
    expect(rl.hit("a", t).allowed).toBe(false);
  });

  it("pencere dolunca sıfırlanır", () => {
    const rl = new InMemoryRateLimiter(1, 1000);
    const t = 1_000_000;
    expect(rl.hit("a", t).allowed).toBe(true);
    expect(rl.hit("a", t).allowed).toBe(false);
    expect(rl.hit("a", t + 1001).allowed).toBe(true); // yeni pencere
  });

  it("farklı anahtarlar izole", () => {
    const rl = new InMemoryRateLimiter(1, 1000);
    const t = 1_000_000;
    expect(rl.hit("a", t).allowed).toBe(true);
    expect(rl.hit("b", t).allowed).toBe(true); // a'dan bağımsız
  });
});
