import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { deviceRegisteredSchema, registerDeviceInputSchema } from "@watcher/contracts";
import { registerDevice } from "../../application/register-device";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function devicesRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  const register = createRoute({
    method: "post",
    path: "/",
    tags: ["devices"],
    summary: "Cihaz FCM token kaydet",
    request: {
      body: { content: { "application/json": { schema: registerDeviceInputSchema } } },
    },
    responses: {
      201: {
        content: { "application/json": { schema: deviceRegisteredSchema } },
        description: "Kaydedildi",
      },
    },
  });

  app.openapi(register, async (c) => {
    const input = c.req.valid("json");
    const result = await registerDevice(container, c.get("userId"), input);
    return c.json(result, 201);
  });

  return app;
}
