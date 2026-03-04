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

function tokenKey(provider: ExternalProvider, userId: string): string {
  return `${provider}:${userId}`;
}

export function encryptToken(token: string): string {
  return `enc:${encodeURIComponent(token)}`;
}

export function decryptToken(encrypted: string): string {
  const encoded = encrypted.startsWith("enc:") ? encrypted.slice(4) : encrypted;
  return decodeURIComponent(encoded);
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
