export interface AuthUser {
  userId: string;
  email: string | null;
}

/** Erişim token'ını doğrular; geçersizse fırlatır. */
export interface AuthVerifier {
  verify(token: string): Promise<AuthUser>;
}
