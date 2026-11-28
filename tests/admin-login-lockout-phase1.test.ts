import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/database";
import { POST as login } from "@/app/api/admin/auth/login/route";
import {
  getAdminLoginLockout,
  recordAdminLoginFailure,
  clearAdminLoginFailures,
} from "@/lib/security/rate-limit";
import {
  formatAdminLoginRetryTime,
  getAdminLoginLockoutDurationMs,
} from "@/lib/security/admin-login-lockout";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "false");
  vi.spyOn(db, "getAdminLoginLockoutState").mockResolvedValue(null);
  vi.spyOn(db, "recordAdminLoginFailure").mockResolvedValue(null);
  vi.spyOn(db, "clearAdminLoginFailures").mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("progressive admin login lockout", () => {
  it("doubles the lockout after each completed block of five failed attempts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-28T10:00:00.000Z"));
    const deviceKey = `device-${crypto.randomUUID()}`;

    for (let attempt = 1; attempt < 5; attempt += 1) {
      const state = await recordAdminLoginFailure(deviceKey);
      expect(state.locked).toBe(false);
      expect(state.failedAttempts).toBe(attempt);
    }

    const firstLock = await recordAdminLoginFailure(deviceKey);
    expect(firstLock).toMatchObject({
      failedAttempts: 0,
      lockoutCount: 1,
      locked: true,
      retryAfterSeconds: 900,
    });

    vi.advanceTimersByTime(15 * 60 * 1000);
    expect((await getAdminLoginLockout(deviceKey)).locked).toBe(false);

    for (let attempt = 1; attempt < 5; attempt += 1) {
      await recordAdminLoginFailure(deviceKey);
    }

    const secondLock = await recordAdminLoginFailure(deviceKey);
    expect(secondLock).toMatchObject({
      failedAttempts: 0,
      lockoutCount: 2,
      locked: true,
      retryAfterSeconds: 1800,
    });

    vi.advanceTimersByTime(30 * 60 * 1000);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await recordAdminLoginFailure(deviceKey);
    }
    expect(await getAdminLoginLockout(deviceKey)).toMatchObject({
      lockoutCount: 3,
      locked: true,
      retryAfterSeconds: 3600,
    });

    const expectedMinutes = [15, 30, 60, 120, 240, 480, 960, 1920, 3840];
    expectedMinutes.forEach((minutes, index) => {
      expect(getAdminLoginLockoutDurationMs(index)).toBe(minutes * 60 * 1000);
    });
    expect(formatAdminLoginRetryTime(16 * 60 * 60)).toBe("16 hours");
    expect(formatAdminLoginRetryTime(32 * 60 * 60)).toBe("1 day 8 hours");
    expect(formatAdminLoginRetryTime(64 * 60 * 60)).toBe("2 days 16 hours");
  });

  it("keeps failed-attempt state separate per device key and clears it after a valid login", async () => {
    const firstDevice = `device-${crypto.randomUUID()}`;
    const secondDevice = `device-${crypto.randomUUID()}`;
    await recordAdminLoginFailure(firstDevice);
    await recordAdminLoginFailure(firstDevice);

    expect(await getAdminLoginLockout(secondDevice)).toMatchObject({
      failedAttempts: 0,
      locked: false,
    });

    expect(await clearAdminLoginFailures(firstDevice)).toEqual({ ok: true });
    expect(await getAdminLoginLockout(firstDevice)).toMatchObject({
      failedAttempts: 0,
      locked: false,
    });
  });

  it("rejects a locked client before looking up credentials and returns Retry-After", async () => {
    vi.stubEnv("AUTH_SECRET", "test-auth-secret-that-is-long-enough-123456");
    vi.stubEnv("OMNIFLOW_TRUSTED_CLIENT_IP_HEADER", "x-real-ip");
    vi.spyOn(db, "getAdminLoginLockoutState").mockResolvedValue({
      failedAttempts: 0,
      lockoutCount: 1,
      locked: true,
      retryAfterSeconds: 321,
    });
    const findUser = vi.spyOn(db, "findUserByEmail");

    const response = await login(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "content-type": "application/json",
          "x-real-ip": "203.0.113.44",
        },
        body: JSON.stringify({
          email: "staff@example.org",
          password: "wrong-password",
        }),
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("321");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(findUser).not.toHaveBeenCalled();
  });

  it("returns 401 for the first four bad passwords and locks on the fifth", async () => {
    vi.stubEnv("AUTH_SECRET", "test-auth-secret-that-is-long-enough-123456");
    vi.stubEnv("OMNIFLOW_TRUSTED_CLIENT_IP_HEADER", "x-real-ip");
    vi.spyOn(db, "countUsers").mockResolvedValue(1);
    vi.spyOn(db, "findUserByEmail").mockResolvedValue(null);
    vi.spyOn(db, "recordAuditLog").mockResolvedValue(undefined as never);
    vi.spyOn(db, "getAdminLoginLockoutState").mockResolvedValue({
      failedAttempts: 0,
      lockoutCount: 0,
      locked: false,
      retryAfterSeconds: 0,
    });

    let attempts = 0;
    vi.spyOn(db, "recordAdminLoginFailure").mockImplementation(async () => {
      attempts += 1;
      return {
        failedAttempts: attempts < 5 ? attempts : 0,
        lockoutCount: attempts < 5 ? 0 : 1,
        locked: attempts >= 5,
        retryAfterSeconds: attempts < 5 ? 0 : 900,
      };
    });

    const responses: Response[] = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      responses.push(
        await login(
          new Request("http://localhost:3000/api/admin/auth/login", {
            method: "POST",
            headers: {
              host: "localhost:3000",
              origin: "http://localhost:3000",
              "content-type": "application/json",
              "x-real-ip": "203.0.113.88",
            },
            body: JSON.stringify({
              email: "staff@example.org",
              password: "wrong-password",
            }),
          })
        )
      );
    }

    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401, 401, 429,
    ]);
    expect(responses[4]?.headers.get("retry-after")).toBe("900");
    expect(attempts).toBe(5);
  });

  it("fails closed when the distributed lockout store is unavailable in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OMNIFLOW_STRICT_PRODUCTION", "true");

    expect(await getAdminLoginLockout(`device-${crypto.randomUUID()}`)).toMatchObject({
      locked: true,
      unavailable: true,
    });
    expect(
      await recordAdminLoginFailure(`device-${crypto.randomUUID()}`)
    ).toMatchObject({ locked: true, unavailable: true });
    expect(
      await clearAdminLoginFailures(`device-${crypto.randomUUID()}`)
    ).toEqual({ ok: false, unavailable: true });
  });
});
