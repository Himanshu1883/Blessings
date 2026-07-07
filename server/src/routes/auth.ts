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
  googleTokenLogin,
  updateProfile,
} from "../services/authService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, attachRefreshedCookie, type AuthRequest } from "../middleware/auth.js";
import { REFRESH_COOKIE } from "../utils/cookies.js";
import { env } from "../config/env.js";

const router = Router();

const registerSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email().optional(),
    phone: z.string().min(10).max(15).optional(),
    password: z.string().min(8).max(128),
  })
  .refine((d) => d.email || d.phone, { message: "Email or phone is required" });

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z
    .object({
      name: z.string().min(2),
      line1: z.string().min(3),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().min(4),
      phone: z.string().min(10),
      isDefault: z.boolean().optional(),
    })
    .optional(),
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

router.post("/logout", requireAuth, attachRefreshedCookie, async (req: AuthRequest, res, next) => {
  try {
    await logoutUser(req.userId, res);
    sendSuccess(res, { loggedOut: true });
  } catch (e) {
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

router.get("/google", (_req, res, next) => {
  try {
    const url = getGoogleAuthUrl();
    res.redirect(url);
  } catch (e) {
    next(e);
  }
});

router.get("/google/callback", async (req, res, next) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.redirect(`${env.CLIENT_URL}?auth=failed`);
    await handleGoogleCallback(code, res);
    res.redirect(`${env.CLIENT_URL}?auth=success`);
  } catch (e) {
    res.redirect(`${env.CLIENT_URL}?auth=failed`);
    next(e);
  }
});

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
  validateBody(profileSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const user = await updateProfile(req.userId!, req.body);
      sendSuccess(res, user);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
