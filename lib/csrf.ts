import crypto from "crypto";

const SECRET = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "catatanku-csrf-secret";

export function generateCsrfToken(userId: string): string {
  return crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
}

export function validateCsrfToken(userId: string, token: string): boolean {
  const expected = generateCsrfToken(userId);
  if (expected.length !== token.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}
