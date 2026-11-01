import { describe, expect, it, beforeEach } from "vitest";
import { generateReviveCode, isReviveCodeFormat, normalizeReviveCode } from "@/lib/auth/revive-code";
import { hashSecret, secretsMatch, signPayload, verifySignedPayload } from "@/lib/auth/crypto";
import {
  acknowledgeReviveCode,
  getPendingReviveCode,
  loginStudent,
  recoverPassword,
  registerStudent,
  USERNAME_HINT,
  validateUsername,
} from "@/lib/auth/store";
import { isAdminPath, isPublicPath } from "@/lib/auth/guard";
import { commonErrors, playingMix } from "@/lib/auth/analytics";
import { awardScore, beginStep, completionPercent, endStep, errorRate, GAME_POINTS, logError, STEP_POINTS, studentStatus } from "@/lib/auth/scoring";
import { ADMIN_PASSWORD, ADMIN_USERNAME, ensureAdminAccount } from "@/lib/auth/seed-admin";
import { destination, findUser, updateUser } from "@/lib/auth/store";
import { emptyProgress, PUBLIC_PATHS } from "@/lib/auth/types";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((part) => {
    const name = part.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  });
});

describe("revive codes", () => {
  it("makes a four-word kid-friendly phrase", () => {
    const code = generateReviveCode(() => 0.1);
    expect(isReviveCodeFormat(code)).toBe(true);
    expect(code.split("-")).toHaveLength(4);
  });

  it("normalizes spaces", () => {
    expect(normalizeReviveCode("  Apple  Brave  Coral  Daisy ")).toBe("apple-brave-coral-daisy");
  });
});

describe("secret hashing", () => {
  it("verifies a password and rejects a wrong one", async () => {
    const { hash, salt } = await hashSecret("secret");
    expect(await secretsMatch("secret", hash, salt)).toBe(true);
    expect(await secretsMatch("other", hash, salt)).toBe(false);
  });

  it("signs and verifies a session payload", async () => {
    const token = await signPayload("hello");
    expect(await verifySignedPayload(token)).toBe("hello");
    expect(await verifySignedPayload(`${token}x`)).toBe(null);
  });
});

describe("username format", () => {
  it("accepts firstname-lastname and rejects numbers, spaces, and extra symbols", () => {
    expect(validateUsername("Maria-Doe")).toBe(null);
    expect(validateUsername("john-smith")).toBe(null);
    expect(validateUsername("john")).toBe(USERNAME_HINT);
    expect(validateUsername("john-smith2")).toBe(USERNAME_HINT);
    expect(validateUsername("john smith")).toBe(USERNAME_HINT);
    expect(validateUsername("john_smith")).toBe(USERNAME_HINT);
    expect(validateUsername("john-smith-lee")).toBe(USERNAME_HINT);
    expect(validateUsername("Γιάννης-Παππάς")).toBe(USERNAME_HINT);
  });
});

describe("student accounts", () => {
  it("registers, stores a hashed revive code, and logs in", async () => {
    const created = await registerStudent("Sam-One", "pass", "A1");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.user.classGroup).toBe("A1");
    expect(created.user.username).toBe("Sam-One");
    expect(created.reviveCode && isReviveCodeFormat(created.reviveCode)).toBe(true);
    expect(getPendingReviveCode()?.code).toBe(created.reviveCode);
    expect(localStorage.getItem("ctw_users")).not.toContain(created.reviveCode ?? "nope");
    expect(localStorage.getItem("ctw_users")).not.toContain("\"pass\"");

    const bad = await loginStudent("Sam-One", "nope");
    expect(bad.ok).toBe(false);
    const good = await loginStudent("sam-one", "pass");
    expect(good.ok).toBe(true);
    expect((await registerStudent("sam-one", "pass", "B1")).ok).toBe(false);
  });

  it("resets a password with the revive code", async () => {
    const created = await registerStudent("Hero-Kid", "old1", "A2");
    if (!created.ok || !created.reviveCode) throw new Error("setup failed");
    const recovered = await recoverPassword("hero-kid", created.reviveCode, "new1");
    expect(recovered.ok).toBe(true);
    expect((await loginStudent("Hero-Kid", "old1")).ok).toBe(false);
    expect((await loginStudent("hero-kid", "new1")).ok).toBe(true);
  });

  it("acknowledges the revive code", async () => {
    const created = await registerStudent("Ace-Kid", "pass", "B1");
    if (!created.ok) throw new Error("setup failed");
    expect(created.user.reviveAcknowledged).toBe(false);
    await acknowledgeReviveCode("ace-kid");
    expect(getPendingReviveCode()).toBe(null);
    expect((await loginStudent("Ace-Kid", "pass")).ok && true).toBe(true);
  });
});

describe("route policy", () => {
  it("treats only login, register, and recover as public", () => {
    expect(PUBLIC_PATHS).toEqual(["/login", "/register", "/recover"]);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/studio")).toBe(false);
    expect(isPublicPath("/hacker")).toBe(false);
    expect(isPublicPath("/admin")).toBe(false);
    expect(isPublicPath("/login")).toBe(true);
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/students/sam")).toBe(true);
    expect(isAdminPath("/studio")).toBe(false);
  });

  it("sends tutors to the dashboard and students to the workspace", () => {
    expect(destination({ role: "admin", reviveAcknowledged: true })).toBe("/admin");
    expect(destination({ role: "student", reviveAcknowledged: false })).toBe("/revive-code");
    expect(destination({ role: "student", reviveAcknowledged: true }, "/studio")).toBe("/studio");
    expect(destination({ role: "student", reviveAcknowledged: true }, "/admin")).toBe("/");
  });
});

describe("scoring and tutor account", () => {
  it("awards step and game points once", async () => {
    const created = await registerStudent("Play-User", "pass", "B2");
    if (!created.ok) throw new Error("setup failed");
    const step = {
      kind: "step" as const,
      area: "python" as const,
      missionId: "mad-libs",
      missionTitle: "Mad Libs",
      stepId: "var",
      stepTitle: "Store a name",
    };
    expect(awardScore("Play-User", step).awarded).toBe(true);
    expect(awardScore("Play-User", step).awarded).toBe(false);
    expect(awardScore("play-user", { ...step, kind: "game", stepId: "complete", stepTitle: "Game finished" }).score)
      .toBe(STEP_POINTS + GAME_POINTS);
    expect(completionPercent({ ...emptyProgress(), pythonDone: ["mad-libs"] })).toBeGreaterThan(0);
  });

  it("logs wrong code, drop-off time, and chart counts", async () => {
    const created = await registerStudent("Scout-Bee", "pass", "C1");
    if (!created.ok) throw new Error("setup failed");
    const place = { area: "python" as const, missionId: "hangman", missionTitle: "Word Guess", stepId: "3", stepTitle: "Step 3" };
    logError("Scout-Bee", { ...place, message: "Missing a colon", codeSnippet: "if lives > 0", errorType: "syntax" });
    logError("scout-bee", { ...place, message: "Missing a colon", codeSnippet: "if lives > 0", errorType: "syntax" });
    beginStep("Scout-Bee", place);
    const user = findUser("scout-bee")!;
    updateUser(user.id, { liveSession: { ...user.liveSession!, stepStartedAt: new Date(Date.now() - 5000).toISOString() } });
    endStep("scout-bee");
    const saved = findUser("Scout-Bee")!;
    expect(saved.history.filter((item) => item.kind === "error_made")).toHaveLength(1);
    expect(saved.history.some((item) => item.kind === "session_stopped" && item.seconds >= 4)).toBe(true);
    expect(studentStatus(saved)).toBe("Stuck on Word Guess — Step 3");
    expect(errorRate(saved.history)).toBe(100);
    expect(playingMix([saved])[0]?.name).toBe("Word Guess");
    expect(commonErrors([saved])[0]?.value).toBe(1);
  });

  it("seeds the tutor account", async () => {
    await ensureAdminAccount();
    const tutor = await loginStudent(ADMIN_USERNAME, ADMIN_PASSWORD);
    expect(tutor.ok).toBe(true);
    if (tutor.ok) expect(tutor.user.role).toBe("admin");
    expect((await registerStudent("admin", "pass", "A1")).ok).toBe(false);
    expect((await registerStudent("nope", "pass", "A1")).ok).toBe(false);
    expect((await registerStudent("Ann-Lee", "pass", "Z9")).ok).toBe(false);
  });
});
