import { describe, expect, it } from "vitest";
import { decideAppRoute, decideAuthRoute } from "../app/src/auth/routeGuards";

describe("route guards", () => {
  const mockSession = {
    token: "sess_test",
    expiresAt: "2099-01-01T00:00:00.000Z",
    user: {
      userId: "user-a",
      loginId: "nahamzzi",
      displayName: "Nahamzzi",
      defaultRole: "A" as const
    }
  };

  it("returns loading while bootstrapping", () => {
    expect(decideAppRoute(true, null)).toBe("loading");
    expect(decideAuthRoute(true, null)).toBe("loading");
  });

  it("redirects unauthenticated user from protected app route", () => {
    expect(decideAppRoute(false, null)).toBe("redirect");
  });

  it("allows authenticated user on protected app route", () => {
    expect(decideAppRoute(false, mockSession)).toBe("allow");
  });

  it("redirects authenticated user away from auth route", () => {
    expect(decideAuthRoute(false, mockSession)).toBe("redirect");
  });

  it("allows unauthenticated user on auth route", () => {
    expect(decideAuthRoute(false, null)).toBe("allow");
  });
});
