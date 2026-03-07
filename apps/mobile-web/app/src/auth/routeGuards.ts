import type { AuthSession } from "../../../src/authClient";

export type GuardDecision = "loading" | "redirect" | "allow";

export function decideAppRoute(isBootstrapping: boolean, session: AuthSession | null): GuardDecision {
  if (isBootstrapping) {
    return "loading";
  }
  if (!session) {
    return "redirect";
  }
  return "allow";
}

export function decideAuthRoute(isBootstrapping: boolean, session: AuthSession | null): GuardDecision {
  if (isBootstrapping) {
    return "loading";
  }
  if (session) {
    return "redirect";
  }
  return "allow";
}
