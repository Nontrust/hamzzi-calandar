import { describe, expect, it } from "vitest";
import { clearAuditEvents, listAuditEvents } from "../src/auditLog";
import { clearAnniversaryStore } from "../src/anniversaryStore";
import { clearAuthStore } from "../src/authStore";
import {
  actorFromSession,
  handleCalendarMonthView,
  handleCreateAnniversary,
  handleLogin,
  handleLogout,
  handleSessionValidate
} from "../src/handlers";

describe("auth flow", () => {
  it("supports login success and session validation", async () => {
    clearAuthStore();
    const login = await handleLogin("nahamzzi", "nahamzzi");
    expect(login.success).toBe(true);
    if (!login.success) return;

    const validation = await handleSessionValidate(login.data.session.token);
    expect(validation.success).toBe(true);
    if (!validation.success) return;
    expect(validation.data.loginId).toBe("nahamzzi");
  });

  it("returns invalid credentials on wrong password", async () => {
    clearAuthStore();
    const login = await handleLogin("nahamzzi", "wrong-password");
    expect(login.success).toBe(false);
    if (!login.success) {
      expect(login.errorCode).toBe("AUTH_INVALID_CREDENTIALS");
    }
  });

  it("revokes session on logout and blocks reuse", async () => {
    clearAuthStore();
    const login = await handleLogin("nahamzzi", "nahamzzi");
    expect(login.success).toBe(true);
    if (!login.success) return;

    const logout = await handleLogout(login.data.session.token);
    expect(logout.success).toBe(true);

    const validation = await handleSessionValidate(login.data.session.token);
    expect(validation.success).toBe(false);
    if (!validation.success) {
      expect(validation.errorCode).toBe("AUTH_SESSION_EXPIRED");
    }
  });

  it("blocks protected operations before business logic when unauthenticated", async () => {
    clearAuthStore();
    clearAnniversaryStore();

    const blocked = await handleCreateAnniversary(null, {
      name: "anniversary",
      baseDate: "2024-03-23",
      ruleType: "yearly",
      ruleValue: 1
    });
    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.errorCode).toBe("AUTH_REQUIRED");
    }
  });

  it("allows protected operations after authentication", async () => {
    clearAuthStore();
    clearAnniversaryStore();

    const login = await handleLogin("deed1515", "1q2w3e4r%T");
    expect(login.success).toBe(true);
    if (!login.success) return;

    const actor = actorFromSession(login.data.session.token, "B");
    const month = await handleCalendarMonthView(actor, "2026-03");
    expect(month.success).toBe(true);
  });

  it("records audit entries for denied auth attempts", async () => {
    clearAuthStore();
    clearAuditEvents();

    await handleLogin("nahamzzi", "bad");
    const logs = listAuditEvents();
    expect(logs.some((entry) => entry.action === "auth.login" && entry.outcome === "denied")).toBe(true);
  });
});
