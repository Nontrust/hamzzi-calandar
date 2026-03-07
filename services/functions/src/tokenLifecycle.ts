import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type ExternalProvider = "google_calendar";
export type TokenState = "active" | "refresh_retry" | "reauth_required";

export interface ExternalTokenRecord {
  provider: ExternalProvider;
  userId: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  expiresAt: string;
  refreshedAt: string;
  retryCount: number;
  state: TokenState;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

const tokenStore = new Map<string, ExternalTokenRecord>();
const TOKEN_KEY_ENV = "NAHAMZZI_TOKEN_ENCRYPTION_KEY";
const TEST_FALLBACK_KEY_HEX = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";

function tokenKey(provider: ExternalProvider, userId: string): string {
  return `${provider}:${userId}`;
}

export function encryptToken(token: string): string {
  const key = resolveEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptToken(encrypted: string): string {
  if (encrypted.startsWith("enc:v1:")) {
    const parts = encrypted.split(":");
    if (parts.length !== 5) {
      throw new Error("Invalid encrypted token payload.");
    }
    const key = resolveEncryptionKey();
    const iv = Buffer.from(parts[2], "base64");
    const authTag = Buffer.from(parts[3], "base64");
    const ciphertext = Buffer.from(parts[4], "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  }

  // Backward-compatibility path for pre-migration demo tokens.
  if (encrypted.startsWith("enc:")) {
    return decodeURIComponent(encrypted.slice(4));
  }
  return encrypted;
}

function resolveEncryptionKey(): Buffer {
  const raw = process.env[TOKEN_KEY_ENV];
  if (!raw || raw.trim().length === 0) {
    if (process.env.NODE_ENV === "test") {
      return Buffer.from(TEST_FALLBACK_KEY_HEX, "hex");
    }
    throw new Error(`${TOKEN_KEY_ENV} is required and must be a 32-byte key (hex/base64).`);
  }

  const normalized = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
    return Buffer.from(normalized, "hex");
  }

  const candidate = Buffer.from(normalized, "base64");
  if (candidate.length === 32) {
    return candidate;
  }

  throw new Error(`${TOKEN_KEY_ENV} must decode to 32 bytes.`);
}

export function saveExternalToken(
  provider: ExternalProvider,
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: string,
  now: Date
): ExternalTokenRecord {
  const record: ExternalTokenRecord = {
    provider,
    userId,
    encryptedAccessToken: encryptToken(accessToken),
    encryptedRefreshToken: encryptToken(refreshToken),
    expiresAt,
    refreshedAt: now.toISOString(),
    retryCount: 0,
    state: "active"
  };
  tokenStore.set(tokenKey(provider, userId), record);
  return record;
}

export function getExternalToken(provider: ExternalProvider, userId: string): ExternalTokenRecord | null {
  return tokenStore.get(tokenKey(provider, userId)) ?? null;
}

export function shouldRefreshToken(expiresAt: string, now: Date, thresholdMinutes = 30): boolean {
  const expireMs = new Date(expiresAt).getTime();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return expireMs - now.getTime() <= thresholdMs;
}

export async function refreshExternalToken(
  record: ExternalTokenRecord,
  now: Date,
  refreshFn: (refreshToken: string) => Promise<RefreshResult>,
  maxRetries = 3
): Promise<{ record: ExternalTokenRecord; errorCode: string | null }> {
  try {
    const next = await refreshFn(decryptToken(record.encryptedRefreshToken));
    const updated: ExternalTokenRecord = {
      ...record,
      encryptedAccessToken: encryptToken(next.accessToken),
      encryptedRefreshToken: encryptToken(next.refreshToken ?? decryptToken(record.encryptedRefreshToken)),
      expiresAt: next.expiresAt,
      refreshedAt: now.toISOString(),
      retryCount: 0,
      state: "active"
    };
    tokenStore.set(tokenKey(record.provider, record.userId), updated);
    return { record: updated, errorCode: null };
  } catch {
    const nextRetryCount = record.retryCount + 1;
    const state: TokenState = nextRetryCount >= maxRetries ? "reauth_required" : "refresh_retry";
    const updated: ExternalTokenRecord = {
      ...record,
      retryCount: nextRetryCount,
      state
    };
    tokenStore.set(tokenKey(record.provider, record.userId), updated);
    return { record: updated, errorCode: state === "reauth_required" ? "TOKEN_REAUTH_REQUIRED" : "TOKEN_REFRESH_RETRY" };
  }
}

export function clearTokenStore(): void {
  tokenStore.clear();
}
