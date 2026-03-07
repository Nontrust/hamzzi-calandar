import type { UserRole } from "@nahamzzi/domain";

export interface AuthUserRecord {
  id: string;
  loginId: string;
  passwordHash: string;
  defaultRole: UserRole;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  state: "active" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export class UserAuthError extends Error {
  constructor(
    public readonly code: "AUTH_REQUIRED" | "AUTH_INVALID_CREDENTIALS" | "AUTH_SESSION_EXPIRED",
    message: string
  ) {
    super(message);
  }
}

const usersById = new Map<string, AuthUserRecord>();
const userIdByLoginId = new Map<string, string>();
const sessionsByToken = new Map<string, SessionRecord>();

function nowIso(now: Date): string {
  return now.toISOString();
}

function generateId(prefix: string, now = Date.now()): string {
  return `${prefix}_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function hashPassword(value: string): string {
  let hash = 2166136261 >>> 0;
  for (const ch of value) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `pw_${hash.toString(16).padStart(8, "0")}`;
}

const DEMO_USER_SEEDS = [
  {
    id: "user-a",
    loginId: "nahamzzi",
    passwordHash: "pw_f0d8019d",
    defaultRole: "A" as const,
    displayName: "Nahamzzi"
  },
  {
    id: "user-b",
    loginId: "deed1515",
    passwordHash: "pw_97030c6f",
    defaultRole: "B" as const,
    displayName: "Hamzzi Mate"
  }
] as const;

export function clearAuthStore(): void {
  usersById.clear();
  userIdByLoginId.clear();
  sessionsByToken.clear();
}

export function seedDemoUsers(now = new Date()): AuthUserRecord[] {
  const seeded: AuthUserRecord[] = [];
  for (const seed of DEMO_USER_SEEDS) {
    if (usersById.has(seed.id)) {
      seeded.push(usersById.get(seed.id)!);
      continue;
    }
    const record: AuthUserRecord = {
      id: seed.id,
      loginId: seed.loginId,
      passwordHash: seed.passwordHash,
      defaultRole: seed.defaultRole,
      displayName: seed.displayName,
      createdAt: nowIso(now),
      updatedAt: nowIso(now)
    };
    usersById.set(record.id, record);
    userIdByLoginId.set(record.loginId, record.id);
    seeded.push(record);
  }
  return seeded;
}

export function listUsers(): AuthUserRecord[] {
  return [...usersById.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function ensureSeeded(now = new Date()): void {
  if (usersById.size === 0) {
    seedDemoUsers(now);
  }
}

function revokeExpiredSessions(now = new Date()): void {
  for (const [token, session] of sessionsByToken.entries()) {
    if (session.state === "active" && new Date(session.expiresAt).getTime() <= now.getTime()) {
      sessionsByToken.set(token, {
        ...session,
        state: "expired",
        updatedAt: nowIso(now)
      });
    }
  }
}

export function loginByCredentials(loginId: string, password: string, now = new Date()): { user: AuthUserRecord; session: SessionRecord } {
  ensureSeeded(now);
  revokeExpiredSessions(now);

  const userId = userIdByLoginId.get(loginId.trim());
  if (!userId) {
    throw new UserAuthError("AUTH_INVALID_CREDENTIALS", "Invalid credentials.");
  }
  const user = usersById.get(userId)!;
  if (user.passwordHash !== hashPassword(password)) {
    throw new UserAuthError("AUTH_INVALID_CREDENTIALS", "Invalid credentials.");
  }

  const session: SessionRecord = {
    token: generateId("sess"),
    userId: user.id,
    state: "active",
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: nowIso(now),
    updatedAt: nowIso(now)
  };
  sessionsByToken.set(session.token, session);
  return { user, session };
}

export function validateSession(token: string, now = new Date()): { user: AuthUserRecord; session: SessionRecord } {
  ensureSeeded(now);
  revokeExpiredSessions(now);

  const session = sessionsByToken.get(token);
  if (!session) {
    throw new UserAuthError("AUTH_REQUIRED", "Session token is required.");
  }
  if (session.state !== "active") {
    throw new UserAuthError("AUTH_SESSION_EXPIRED", "Session has expired.");
  }
  if (new Date(session.expiresAt).getTime() <= now.getTime()) {
    sessionsByToken.set(token, {
      ...session,
      state: "expired",
      updatedAt: nowIso(now)
    });
    throw new UserAuthError("AUTH_SESSION_EXPIRED", "Session has expired.");
  }
  const user = usersById.get(session.userId);
  if (!user) {
    throw new UserAuthError("AUTH_REQUIRED", "Unknown session user.");
  }
  return { user, session };
}

export function logoutSession(token: string, now = new Date()): SessionRecord {
  const session = sessionsByToken.get(token);
  if (!session) {
    throw new UserAuthError("AUTH_SESSION_EXPIRED", "Session has expired.");
  }
  const next: SessionRecord = {
    ...session,
    state: session.state === "active" ? "revoked" : session.state,
    updatedAt: nowIso(now)
  };
  sessionsByToken.set(token, next);
  return next;
}

export function buildActorFromSession(token: string, role: UserRole | null, now = new Date()): { userId: string; role: UserRole } {
  const { user } = validateSession(token, now);
  return { userId: user.id, role: role ?? user.defaultRole };
}

export function getPasswordHash(rawPassword: string): string {
  return hashPassword(rawPassword);
}
