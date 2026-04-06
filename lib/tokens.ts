import crypto from "crypto";

const SECRET = process.env.TOKEN_SECRET || "dev-token-secret";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface TokenPayload {
  medicationName: string;
  time: string;
  date: string;
  email?: string;
}

export function generateToken(payload: TokenPayload): string {
  const data = {
    ...payload,
    exp: Date.now() + EXPIRY_MS,
  };
  const json = JSON.stringify(data);
  const encoded = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): TokenPayload {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new Error("Invalid token format");
  }

  const expectedSig = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");

  if (signature !== expectedSig) {
    throw new Error("Invalid token signature");
  }

  const data = JSON.parse(Buffer.from(encoded, "base64url").toString());

  if (data.exp < Date.now()) {
    throw new Error("Token expired");
  }

  return {
    medicationName: data.medicationName,
    time: data.time,
    date: data.date,
    email: data.email,
  };
}
