import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";

// loadEnv boş string ("") env değerlerini "tanımsız" saymalı (Render env-group placeholder'ları
// FCM_PROJECT_ID="" gibi optional .min(1) alanlarını boşuna patlatmasın).
describe("loadEnv — boş string env temizliği", () => {
  let savedFcm: string | undefined;
  let savedNodeEnv: string | undefined;
  beforeEach(() => {
    savedFcm = process.env.FCM_PROJECT_ID;
    savedNodeEnv = process.env.NODE_ENV;
    // vitest NODE_ENV=test set eder; şema enum'unda yok → geçerli bir değere sabitle.
    process.env.NODE_ENV = "production";
  });
  afterEach(() => {
    const restore = (k: string, v: string | undefined): void => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    };
    restore("FCM_PROJECT_ID", savedFcm);
    restore("NODE_ENV", savedNodeEnv);
  });

  it("boş string optional değeri tanımsız sayar (patlamaz)", () => {
    process.env.FCM_PROJECT_ID = "";
    expect(loadEnv().FCM_PROJECT_ID).toBeUndefined();
  });

  it("dolu değeri korur", () => {
    process.env.FCM_PROJECT_ID = "demo-project";
    expect(loadEnv().FCM_PROJECT_ID).toBe("demo-project");
  });
});
