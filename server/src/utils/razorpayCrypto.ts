import crypto from "crypto";

export function hmacSha256Hex(secret: string, payload: string | Buffer) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function timingSafeEqualHex(expectedHex: string, received: string) {
  const expected = Buffer.from(expectedHex, "utf8");
  const actual = Buffer.from(received ?? "", "utf8");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function inrPaise(totalInr: number) {
  return Math.round(Number(totalInr) * 100);
}
