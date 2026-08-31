import { Router } from "express";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  refreshSession,
  getGoogleAuthUrl,
  handleGoogleCallback,
  exchangeGoogleSession,
  googleTokenLogin,
  updateAccount,
  changePassword,
  isGoogleConfigured,
} from "../services/authService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearAuthCookies } from "../utils/cookies.js";
import { hashToken, verifyAccessToken, signOAuthState, verifyOAuthState } from "../utils/tokens.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

const router = Router();

const registerSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().email().optional(),
    ),
    phone: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().min(10).max(15).optional(),
    ),
    password: z.string().min(8).max(128),
  })
  .refine((d) => d.email || d.phone, { message: "Email or phone is required" });

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

const accountSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().email().nullable().optional(),
  ),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().min(10).max(15).nullable().optional(),
  ),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const user = await registerUser(req.body, res);
    sendSuccess(res, user, 201);
  } catch (e) {
    next(e);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const user = await loginUser(req.body, res);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    let userId: string | undefined;
    const access = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (access) {
      try {
        userId = verifyAccessToken(access).sub;
      } catch {
        userId = undefined;
      }
    }
    if (!userId) {
      const refresh = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      if (refresh) {
        const user = await User.findOne({
          refreshTokenHash: hashToken(refresh),
          refreshTokenExpiry: { $gt: new Date() },
        }).select("+refreshTokenHash");
        userId = user?._id.toString();
      }
    }
    await logoutUser(userId, res);
    sendSuccess(res, { loggedOut: true });
  } catch (e) {
    clearAuthCookies(res);
    next(e);
  }
});

router.get("/me", requireAuth, attachRefreshedCookie, async (req: AuthRequest, res, next) => {
  try {
    const user = await getMe(req.userId!);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ success: false, message: "No refresh token" });
    const user = await refreshSession(token, res);
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.get("/providers", (_req, res) => {
  sendSuccess(res, { google: isGoogleConfigured() });
});

function safeReturnPath(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) return "/";
  if (from.includes("://")) return "/";
  return from;
}

function safeReturnOrigin(raw: string | undefined): string {
  try {
    const allowed = new URL(env.CLIENT_URL);
    const url = new URL(raw || env.CLIENT_URL);
    if (
      url.origin === allowed.origin ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    ) {
      return url.origin;
    }
  } catch {
    // fall through
  }
  return new URL(env.CLIENT_URL).origin;
}

router.get("/google", (req, res, next) => {
  try {
    const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
    const proto = req.get("x-forwarded-proto") || req.protocol || "http";
    const origin = safeReturnOrigin(forwardedHost ? `${proto}://${forwardedHost}` : env.CLIENT_URL);
    const state = signOAuthState({
      from: safeReturnPath(req.query.from),
      origin,
    });
    res.redirect(getGoogleAuthUrl(state));
  } catch (e) {
    next(e);
  }
});

router.get("/google/callback", async (req, res) => {
  const fallbackOrigin = new URL(env.CLIENT_URL).origin;
  let origin = fallbackOrigin;
  let from = "/";
  try {
    if (typeof req.query.state === "string") {
      const state = verifyOAuthState(req.query.state);
      origin = safeReturnOrigin(state.origin);
      from = safeReturnPath(state.from);
    }
    const code = req.query.code as string | undefined;
    if (!code) {
      res.redirect(`${origin}/login?auth=failed&from=${encodeURIComponent(from)}`);
      return;
    }
    const { exchangeToken } = await handleGoogleCallback(code);
    const params = new URLSearchParams({
      token: exchangeToken,
      from,
    });
    res.redirect(`${origin}/auth/callback?${params.toString()}`);
  } catch {
    res.redirect(`${origin}/login?auth=failed&from=${encodeURIComponent(from)}`);
  }
});

router.post(
  "/google/exchange",
  validateBody(z.object({ token: z.string().min(10) })),
  async (req, res, next) => {
    try {
      const user = await exchangeGoogleSession(req.body.token, res);
      sendSuccess(res, user);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/google/token",
  validateBody(z.object({ idToken: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const user = await googleTokenLogin(req.body.idToken, res);
      sendSuccess(res, user);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/profile",
  requireAuth,
  attachRefreshedCookie,
  validateBody(accountSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await updateAccount(req.userId!, req.body, res);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/password",
  requireAuth,
  attachRefreshedCookie,
  validateBody(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(128),
    }),
  ),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await changePassword(req.userId!, req.body);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
