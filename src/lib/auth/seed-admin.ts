import { hashSecret } from "@/lib/auth/crypto";
import { generateReviveCode, normalizeReviveCode } from "@/lib/auth/revive-code";
import { findUser, saveUserRecord } from "@/lib/auth/store";
import { emptyProgress, type UserRecord } from "@/lib/auth/types";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "P@55_Adm1n!";

let pending: Promise<void> | null = null;

export function ensureAdminAccount(): Promise<void> {
  if (typeof localStorage !== "undefined" && findUser(ADMIN_USERNAME)?.role === "admin") return Promise.resolve();
  if (!pending) pending = seedAdmin().finally(() => { pending = null; });
  return pending;
}

async function seedAdmin(): Promise<void> {
  if (typeof localStorage === "undefined") return;
  if (findUser(ADMIN_USERNAME)?.role === "admin") return;
  const password = await hashSecret(ADMIN_PASSWORD);
  const revive = await hashSecret(normalizeReviveCode(generateReviveCode()));
  const admin: UserRecord = {
    id: crypto.randomUUID(),
    username: ADMIN_USERNAME,
    role: "admin",
    classGroup: "",
    passwordHash: password.hash,
    passwordSalt: password.salt,
    reviveCodeHash: revive.hash,
    reviveCodeSalt: revive.salt,
    reviveAcknowledged: true,
    score: 0,
    history: [],
    liveSession: null,
    progress: emptyProgress(),
    createdAt: new Date().toISOString(),
  };
  saveUserRecord(admin);
}
