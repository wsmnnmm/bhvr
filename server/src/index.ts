import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse, EchoRequest } from "shared/dist";

const app = new Hono();

app.use(cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/hello", async (c) => {
  const data: ApiResponse = {
    message: "Hello BHVR!",
    success: true,
    timestamp: new Date().toISOString(),
  };

  return c.json(data, { status: 200 });
});

app.post("/echo", async (c) => {
  try {
    const body = await c.req.json<EchoRequest>();
    const message = typeof body?.message === "string" ? body.message : "";
    if (!message) {
      return c.json(
        {
          message: "message is required",
          success: true,
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse,
        { status: 400 }
      );
    }
    const data: ApiResponse = {
      message,
      success: true,
      timestamp: new Date().toISOString(),
    };
    return c.json(data, { status: 200 });
  } catch {
    const data: ApiResponse = {
      message: "invalid json",
      success: true,
      timestamp: new Date().toISOString(),
    };
    return c.json(data, { status: 400 });
  }
});

export default app;
