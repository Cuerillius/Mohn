import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/better-auth";
import proxies from "./routes/proxies";
import profiles from "./routes/profiles";
import history from "./routes/history";
import watchlist from "./routes/watchlist";
import settings from "./routes/settings";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("*", (c, next) => {
  const allowedOrigins = c.env.FRONTEND_URL?.split(",") ?? [];
  return cors({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["set-cookie"],
    credentials: true,
  })(c, next);
});

app.all("/api/auth/*", (c) => auth(c.env).handler(c.req.raw));

app.route("/api", proxies);
app.route("/api/profiles", profiles);
app.route("/api/profiles/:profileId/history", history);
app.route("/api/profiles/:profileId/watchlist", watchlist);
app.route("/api/settings", settings);

export type AppType = typeof app;
export default app;
