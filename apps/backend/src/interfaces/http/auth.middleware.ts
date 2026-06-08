import type { MiddlewareHandler } from "hono";
import type { AuthVerifier } from "../../domain/auth";

export interface AuthVariables {
  userId: string;
  email: string | null;
  requestId: string;
}

/** Authorization: Bearer <token> → doğrula → c.userId. Eksik/geçersiz → 401. */
export function authMiddleware(
  verifier: AuthVerifier,
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return c.json({ error: "Yetkisiz: Bearer token gerekli" }, 401);
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const user = await verifier.verify(token);
      c.set("userId", user.userId);
      c.set("email", user.email);
    } catch {
      return c.json({ error: "Yetkisiz: geçersiz token" }, 401);
    }
    await next();
  };
}
