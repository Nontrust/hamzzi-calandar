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
    throw new AuthError("AUTH_REQUIRED", "Authentication is required.");
  }
  return actor;
}

export function requireRole(actor: RequestActor, allowedRoles: UserRole[]): RequestActor {
  if (!allowedRoles.includes(actor.role)) {
    throw new AuthError("FORBIDDEN_ROLE", "You do not have permission for this action.");
  }
  return actor;
}
