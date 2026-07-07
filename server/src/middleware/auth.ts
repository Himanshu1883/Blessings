import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/apiResponse.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../utils/cookies.js";
import { User } from "../models/User.js";
import { hashToken, signAccessToken } from "../utils/tokens.js";
import { setAuthCookies } from "../utils/cookies.js";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "user" | "admin";
}

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies?.[ACCESS_COOKIE];
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      req.userId = payload.sub;
      req.userRole = payload.role;
      return next();
    }

    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new AppError(401, "Authentication required");

    const user = await User.findOne({
      refreshTokenHash: hashToken(refreshToken),
      refreshTokenExpiry: { $gt: new Date() },
    }).select("+refreshTokenHash +refreshTokenExpiry");

    if (!user) throw new AppError(401, "Session expired");

    const newAccess = signAccessToken({ sub: user._id.toString(), role: user.role });
    req.userId = user._id.toString();
    req.userRole = user.role;
    _res.locals.newAccessToken = newAccess;
    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(new AppError(401, "Authentication required"));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userRole !== "admin") {
    return next(new AppError(403, "Admin access required"));
  }
  next();
}

export function attachRefreshedCookie(req: AuthRequest, res: Response, next: NextFunction) {
  const token = res.locals.newAccessToken as string | undefined;
  if (token) {
    res.cookie(ACCESS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
  }
  next();
}
