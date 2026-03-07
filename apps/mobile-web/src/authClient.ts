import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserRole } from "@nahamzzi/domain";

const SESSION_KEY = "auth-session-v1";

export type AuthErrorCode = "AUTH_REQUIRED" | "AUTH_INVALID_CREDENTIALS" | "AUTH_SESSION_EXPIRED";

export interface AuthUser {
  userId: string;
  loginId: string;
  displayName: string;
  defaultRole: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

const DEMO_USERS: Array<AuthUser & { passwordHash: string }> = [
  {
    userId: "user-a",
    loginId: "nahamzzi",
    displayName: "Nahamzzi",
    defaultRole: "A",
    passwordHash: "pw_f0d8019d"
  },
  {
    userId: "user-b",
    loginId: "deed1515",
    displayName: "Hamzzi Mate",
    defaultRole: "B",
    passwordHash: "pw_97030c6f"
  }
];

function hashPassword(value: string): string {
  let hash = 2166136261 >>> 0;
  for (const ch of value) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `pw_${hash.toString(16).padStart(8, "0")}`;
}

function buildToken(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AuthSession;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await readSession();
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
}

export async function login(loginId: string, password: string): Promise<{ success: true; session: AuthSession } | { success: false; errorCode: AuthErrorCode }> {
  const user = DEMO_USERS.find((item) => item.loginId === loginId.trim());
  if (!user) {
    return { success: false, errorCode: "AUTH_INVALID_CREDENTIALS" };
  }
  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, errorCode: "AUTH_INVALID_CREDENTIALS" };
  }

  const session: AuthSession = {
    token: buildToken(),
    user: {
      userId: user.userId,
      loginId: user.loginId,
      displayName: user.displayName,
      defaultRole: user.defaultRole
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, session };
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function requireSession(): Promise<{ success: true; session: AuthSession } | { success: false; errorCode: AuthErrorCode }> {
  const session = await getAuthSession();
  if (!session) {
    return { success: false, errorCode: "AUTH_SESSION_EXPIRED" };
  }
  return { success: true, session };
}
