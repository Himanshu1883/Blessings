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
import webhookRoutes from "./routes/webhooks.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use("/api/webhooks/razorpay", express.raw({ type: "application/json" }), (req, _res, next) => {
  (req as express.Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

const authLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true });
const apiLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true });

app.get("/api/health", (_req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", apiLimiter);
app.use("/api", catalogRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);

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
