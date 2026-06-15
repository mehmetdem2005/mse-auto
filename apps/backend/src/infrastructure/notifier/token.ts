import { GoogleAuth } from "google-auth-library";

export interface AccessTokenProvider {
  getToken(): Promise<string>;
}

/** Service account JSON'dan FCM scope'lu OAuth2 access token üretir. */
export class GoogleAuthTokenProvider implements AccessTokenProvider {
  private readonly auth: GoogleAuth;

  constructor(serviceAccountJson: string) {
    const creds = JSON.parse(serviceAccountJson) as { client_email: string; private_key: string };
    this.auth = new GoogleAuth({
      credentials: { client_email: creds.client_email, private_key: creds.private_key },
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
  }

  async getToken(): Promise<string> {
    const client = await this.auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) throw new Error("google-auth: access token alınamadı");
    return token;
  }
}
