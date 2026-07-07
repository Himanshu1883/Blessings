import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User, toPublicUser } from "../models/User.js";
import { AppError } from "../utils/apiResponse.js";
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
} from "../utils/tokens.js";
import { sanitizeText, isEmail, isPhone, normalizePhone } from "../utils/sanitize.js";
import { env } from "../config/env.js";
import type { Response } from "express";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";

const BCRYPT_ROUNDS = 12;

function getGoogleClient() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    throw new AppError(503, "Google sign-in is not configured");
  }
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL,
  );
}

async function issueSession(userId: string, role: "user" | "admin", res: Response) {
  const refreshToken = generateRefreshToken();
  await User.findByIdAndUpdate(userId, {
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiry: refreshTokenExpiry(),
  });
  const accessToken = signAccessToken({ sub: userId, role });
  setAuthCookies(res, accessToken, refreshToken);
}

export async function registerUser(
  data: { name: string; email?: string; phone?: string; password: string },
  res: Response,
) {
  const name = sanitizeText(data.name);
  const email = data.email ? sanitizeText(data.email).toLowerCase() : undefined;
  const phone = data.phone ? normalizePhone(sanitizeText(data.phone)) : undefined;

  if (!email && !phone) throw new AppError(400, "Email or phone is required");
  if (email && !isEmail(email)) throw new AppError(400, "Invalid email");
  if (phone && !isPhone(phone)) throw new AppError(400, "Invalid phone number");
  if (data.password.length < 8) throw new AppError(400, "Password must be at least 8 characters");

  const existing = await User.findOne({
    $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
  });
  if (existing) throw new AppError(409, "Account already exists with this email or phone");

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: "user",
  });

  await issueSession(user._id.toString(), user.role, res);
  return toPublicUser(user);
}

export async function loginUser(
  data: { identifier: string; password: string },
  res: Response,
) {
  const identifier = sanitizeText(data.identifier);
  const isEmailLogin = isEmail(identifier);
  const query = isEmailLogin
    ? { email: identifier.toLowerCase() }
    : { phone: normalizePhone(identifier) };

  const user = await User.findOne(query).select("+passwordHash");
  if (!user || !user.passwordHash) throw new AppError(401, "Invalid credentials");

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid credentials");

  await issueSession(user._id.toString(), user.role, res);
  return toPublicUser(user);
}

export async function logoutUser(userId: string | undefined, res: Response) {
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshTokenHash: 1, refreshTokenExpiry: 1 },
    });
  }
  clearAuthCookies(res);
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");
  return toPublicUser(user);
}

export async function refreshSession(refreshToken: string, res: Response) {
  const user = await User.findOne({
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiry: { $gt: new Date() },
  });
  if (!user) throw new AppError(401, "Session expired");

  const newRefresh = generateRefreshToken();
  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash: hashToken(newRefresh),
    refreshTokenExpiry: refreshTokenExpiry(),
  });
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  setAuthCookies(res, accessToken, newRefresh);
  return toPublicUser(user);
}

export function getGoogleAuthUrl(): string {
  const client = getGoogleClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
}

export async function handleGoogleCallback(code: string, res: Response) {
  const client = getGoogleClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new AppError(400, "Google authentication failed");

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new AppError(400, "Google authentication failed");

  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email: payload.email.toLowerCase() });
    if (user) {
      user.googleId = payload.sub;
      user.avatarUrl = payload.picture;
      user.emailVerified = payload.email_verified ?? false;
      await user.save();
    } else {
      user = await User.create({
        name: sanitizeText(payload.name ?? payload.email.split("@")[0]),
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        avatarUrl: payload.picture,
        emailVerified: payload.email_verified ?? false,
        role: "user",
      });
    }
  }

  await issueSession(user._id.toString(), user.role, res);
  return toPublicUser(user);
}

export async function googleTokenLogin(idToken: string, res: Response) {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, "Google sign-in is not configured");
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new AppError(400, "Invalid Google token");

  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email: payload.email.toLowerCase() });
    if (user) {
      user.googleId = payload.sub;
      user.avatarUrl = payload.picture;
      await user.save();
    } else {
      user = await User.create({
        name: sanitizeText(payload.name ?? payload.email.split("@")[0]),
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        avatarUrl: payload.picture,
        emailVerified: true,
        role: "user",
      });
    }
  }

  await issueSession(user._id.toString(), user.role, res);
  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  data: { name?: string; address?: import("../models/User.js").IAddress },
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  if (data.name) user.name = sanitizeText(data.name);
  if (data.address) {
    const addr = {
      ...data.address,
      name: sanitizeText(data.address.name),
      line1: sanitizeText(data.address.line1),
      city: sanitizeText(data.address.city),
      state: sanitizeText(data.address.state),
      pincode: sanitizeText(data.address.pincode),
      phone: normalizePhone(data.address.phone),
    };
    if (addr.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    user.addresses.push(addr);
  }
  await user.save();
  return toPublicUser(user);
}
