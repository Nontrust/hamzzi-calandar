import type { UserRole } from "@nahamzzi/domain";

export interface RequestActor {
  userId: string;
  role: UserRole;
}

export class AuthError extends Error {
  constructor(public readonly code: "AUTH_REQUIRED" | "FORBIDDEN_ROLE", message: string) {
    super(message);
  }
}

export function requireAuthenticated(actor: RequestActor | null | undefined): RequestActor {
  if (!actor) {
    throw new AuthError("AUTH_REQUIRED", "인증이 필요한 요청입니다.");
  }
  return actor;
}

export function requireRole(actor: RequestActor, allowedRoles: UserRole[]): RequestActor {
  if (!allowedRoles.includes(actor.role)) {
    throw new AuthError("FORBIDDEN_ROLE", "권한이 없는 요청입니다.");
  }
  return actor;
}
