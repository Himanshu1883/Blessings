import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { errorHandler, notFoundHandler } from "./middleware/validate.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import mediaRoutes from "./routes/media.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import couponRoutes from "./routes/coupons.js";
import homepageRoutes from "./routes/homepage.js";
import settingsRoutes from "./routes/settings.js";
import accountRoutes from "./routes/account.js";
import { razorpayWebhookHandler } from "./routes/webhooks.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

function attachRawBody(req: express.Request, _res: express.Response, next: express.NextFunction) {
  (req as express.Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
  next();
}

app.post("/api/webhook/razorpay", express.raw({ type: "*/*", limit: "1mb" }), attachRawBody, razorpayWebhookHandler);
app.post("/api/webhooks/razorpay", express.raw({ type: "*/*", limit: "1mb" }), attachRawBody, razorpayWebhookHandler);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

const authLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true });
const apiLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true });

app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/password/verify", authLimiter);
app.use("/api/auth/password/reset", authLimiter);
app.use("/api/auth/google/token", authLimiter);
app.use("/api/auth/google/exchange", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api", apiLimiter);
app.use("/api", catalogRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api", couponRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`Blessings API running on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
