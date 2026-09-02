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
import { sanitizeText, isEmail, isPhone, normalizePhone, isIndianMobile, normalizeIndianMobile, isPlaceholderEmail } from "../utils/sanitize.js";
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
    $set: {
      refreshTokenHash: hashToken(refreshToken),
      refreshTokenExpiry: refreshTokenExpiry(),
    },
    $unset: { oauthExchangeHash: 1, oauthExchangeExpiry: 1 },
  });
  const accessToken = signAccessToken({ sub: userId, role });
  setAuthCookies(res, accessToken, refreshToken);
}

function isDuplicateKeyError(e: unknown) {
  return Boolean(e && typeof e === "object" && "code" in e && (e as { code?: number }).code === 11000);
}

function normalizeNameForCompare(name: string) {
  return sanitizeText(name).toLowerCase().replace(/\s+/g, " ");
}

const RESET_VERIFY_MESSAGE = "Those details don't match our records.";

function findUserByIdentifier(identifier: string) {
  const cleaned = sanitizeText(identifier);
  const query = isEmail(cleaned)
    ? { email: cleaned.toLowerCase() }
    : { phone: normalizePhone(cleaned) };
  return User.findOne(query).select("+passwordHash +passwordResetHash +passwordResetExpiry +googleId");
}

async function findUserByEmailOrPhone(email?: string, phone?: string) {
  const clauses = [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])];
  if (clauses.length === 0) return null;
  return User.findOne({ $or: clauses }).select("+passwordHash");
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

  const existing = await findUserByEmailOrPhone(email, phone);
  if (existing) {
    const emailTaken = Boolean(email && existing.email === email);
    const phoneTaken = Boolean(phone && existing.phone === phone);
    const hasPassword = Boolean(existing.passwordHash);
    const hasGoogle = Boolean(existing.googleId);

    if (emailTaken && hasGoogle && !hasPassword) {
      throw new AppError(
        409,
        "This email is already used with Google. Continue with Google to sign in.",
        "ACCOUNT_EXISTS",
        { field: "email", hasGoogle: true, hasPassword: false },
      );
    }

    throw new AppError(
      409,
      emailTaken
        ? "An account already exists with this email. Sign in instead."
        : phoneTaken
          ? "An account already exists with this phone number. Sign in instead."
          : "An account already exists with this email or phone. Sign in instead.",
      "ACCOUNT_EXISTS",
      {
        field: emailTaken ? "email" : phoneTaken ? "phone" : "identifier",
        hasGoogle,
        hasPassword,
      },
    );
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  let user;
  try {
    user = await User.create({
      name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      passwordHash,
      role: "user",
    });
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      throw new AppError(
        409,
        "An account already exists with this email or phone. Sign in instead.",
        "ACCOUNT_EXISTS",
      );
    }
    throw e;
  }

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

  const user = await User.findOne(query).select("+passwordHash +googleId");
  if (!user) throw new AppError(401, "Invalid email, phone, or password", "INVALID_CREDENTIALS");
  if (!user.passwordHash) {
    throw new AppError(
      401,
      "This account uses Google sign-in. Continue with Google.",
      "GOOGLE_ONLY",
    );
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email, phone, or password", "INVALID_CREDENTIALS");

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
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError(404, "User not found");
  return toPublicUser(user);
}

export async function refreshSession(refreshToken: string, res: Response) {
  const user = await User.findOne({
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiry: { $gt: new Date() },
  }).select("+refreshTokenHash +refreshTokenExpiry +passwordHash");
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

export function getGoogleAuthUrl(state: string): string {
  const client = getGoogleClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });
}

export function isGoogleConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL);
}

async function upsertGoogleUser(payload: {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}) {
  const email = payload.email.toLowerCase();
  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      if (user.googleId && user.googleId !== payload.sub) {
        throw new AppError(409, "This email is already linked to another Google account.");
      }
      user.googleId = payload.sub;
      if (payload.picture) user.avatarUrl = payload.picture;
      user.emailVerified = payload.email_verified ?? user.emailVerified;
      await user.save();
    } else {
      try {
        user = await User.create({
          name: sanitizeText(payload.name ?? email.split("@")[0] ?? "Guest"),
          email,
          googleId: payload.sub,
          avatarUrl: payload.picture,
          emailVerified: payload.email_verified ?? false,
          role: "user",
        });
      } catch (e) {
        if (isDuplicateKeyError(e)) {
          user = await User.findOne({ email });
          if (!user) throw e;
          if (user.googleId && user.googleId !== payload.sub) {
            throw new AppError(409, "This email is already linked to another Google account.");
          }
          user.googleId = payload.sub;
          if (payload.picture) user.avatarUrl = payload.picture;
          await user.save();
        } else {
          throw e;
        }
      }
    }
  }
  return user;
}

async function issueGoogleExchange(userId: string) {
  const raw = generateRefreshToken();
  await User.findByIdAndUpdate(userId, {
    oauthExchangeHash: hashToken(raw),
    oauthExchangeExpiry: new Date(Date.now() + 2 * 60 * 1000),
  });
  return raw;
}

export async function handleGoogleCallback(code: string) {
  const client = getGoogleClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new AppError(400, "Google authentication failed");

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new AppError(400, "Google authentication failed");

  const user = await upsertGoogleUser({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: payload.email_verified,
  });
  const exchangeToken = await issueGoogleExchange(user._id.toString());
  return { exchangeToken };
}

export async function exchangeGoogleSession(rawToken: string, res: Response) {
  const user = await User.findOneAndUpdate(
    {
      oauthExchangeHash: hashToken(rawToken),
      oauthExchangeExpiry: { $gt: new Date() },
    },
    { $unset: { oauthExchangeHash: 1, oauthExchangeExpiry: 1 } },
    { new: true },
  );
  if (!user) {
    throw new AppError(401, "Google sign-in expired. Please try again.", "GOOGLE_EXPIRED");
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

  const user = await upsertGoogleUser({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: payload.email_verified,
  });
  await issueSession(user._id.toString(), user.role, res);
  return toPublicUser(user);
}

export async function updateAccount(
  userId: string,
  data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    currentPassword?: string;
    newPassword?: string;
  },
  res: Response,
) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError(404, "User not found");

  const hasPassword = Boolean(user.passwordHash);
  const nextName = data.name !== undefined ? sanitizeText(data.name) : user.name;
  if (nextName.length < 2) throw new AppError(400, "Name is required");

  let nextEmail = user.email;
  if (data.email !== undefined) {
    const raw = data.email?.trim() ? sanitizeText(data.email).toLowerCase() : undefined;
    if (raw && !isEmail(raw)) throw new AppError(400, "Invalid email");
    nextEmail = raw;
  }

  let nextPhone = user.phone;
  if (data.phone !== undefined) {
    const raw = data.phone?.trim() ? normalizeIndianMobile(data.phone) : undefined;
    if (raw && !isIndianMobile(raw)) {
      throw new AppError(400, "Enter a valid 10-digit Indian mobile number");
    }
    nextPhone = raw;
  }

  const emailForIdentity = nextEmail && !isPlaceholderEmail(nextEmail) ? nextEmail : undefined;
  if (!emailForIdentity && !nextPhone) {
    throw new AppError(400, "Keep at least an email or a mobile number");
  }

  const prevIdentityEmail = user.email && !isPlaceholderEmail(user.email) ? user.email : undefined;
  const emailChanged = (prevIdentityEmail ?? "") !== (emailForIdentity ?? "");
  const phoneChanged = (user.phone ?? "") !== (nextPhone ?? "");
  const passwordChanging = Boolean(data.newPassword);

  if (passwordChanging) {
    if (!data.newPassword || data.newPassword.length < 8) {
      throw new AppError(400, "New password must be at least 8 characters");
    }
    if (hasPassword) {
      if (!data.currentPassword) throw new AppError(400, "Current password is required");
      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash!);
      if (!valid) throw new AppError(401, "Current password is incorrect");
    }
  }

  if (emailChanged && emailForIdentity) {
    const taken = await User.findOne({ email: emailForIdentity, _id: { $ne: user._id } });
    if (taken) throw new AppError(409, "An account already exists with this email", "ACCOUNT_EXISTS");
  }
  if (phoneChanged && nextPhone) {
    const taken = await User.findOne({ phone: nextPhone, _id: { $ne: user._id } });
    if (taken) {
      throw new AppError(409, "An account already exists with this phone number", "ACCOUNT_EXISTS");
    }
  }

  user.name = nextName;
  if (emailForIdentity) {
    user.email = emailForIdentity;
  } else {
    user.email = undefined;
  }
  if (nextPhone) {
    user.phone = nextPhone;
  } else {
    user.phone = undefined;
  }
  if (passwordChanging && data.newPassword) {
    user.passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
  }

  try {
    await user.save();
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err?.code === 11000) {
      throw new AppError(409, "An account already exists with this email or phone", "ACCOUNT_EXISTS");
    }
    throw e;
  }

  const requiresRelogin = emailChanged || passwordChanging;
  if (requiresRelogin) {
    await logoutUser(userId, res);
  }

  return { user: toPublicUser(user), requiresRelogin };
}

export async function verifyPasswordReset(data: { identifier: string; name: string }) {
  const user = await findUserByIdentifier(data.identifier);
  if (!user) {
    throw new AppError(401, RESET_VERIFY_MESSAGE, "RESET_VERIFY_FAILED");
  }

  if (normalizeNameForCompare(user.name) !== normalizeNameForCompare(data.name)) {
    throw new AppError(401, RESET_VERIFY_MESSAGE, "RESET_VERIFY_FAILED");
  }

  const resetToken = generateRefreshToken();
  await User.findByIdAndUpdate(user._id, {
    passwordResetHash: hashToken(resetToken),
    passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000),
  });

  return { resetToken };
}

export async function resetPasswordWithToken(data: { resetToken: string; newPassword: string }) {
  if (data.newPassword.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters");
  }

  const user = await User.findOneAndUpdate(
    {
      passwordResetHash: hashToken(data.resetToken),
      passwordResetExpiry: { $gt: new Date() },
    },
    { $unset: { passwordResetHash: 1, passwordResetExpiry: 1 } },
    { new: true },
  ).select("+passwordHash");

  if (!user) {
    throw new AppError(401, "Reset session expired. Please start again.", "RESET_EXPIRED");
  }

  user.passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
  await user.save();
  await User.findByIdAndUpdate(user._id, {
    $unset: { refreshTokenHash: 1, refreshTokenExpiry: 1 },
  });

  return { reset: true };
}

export async function changePassword(
  userId: string,
  data: { currentPassword: string; newPassword: string },
) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw new AppError(400, "Password login not available for this account");
  }
  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) throw new AppError(401, "Current password is incorrect");
  if (data.newPassword.length < 8) {
    throw new AppError(400, "New password must be at least 8 characters");
  }
  user.passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
  await user.save();
  return { changed: true };
}
